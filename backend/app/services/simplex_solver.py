"""
simplex_solver.py
Motor de resolución Simplex paso a paso usando PuLP + NumPy.
Captura cada iteración de la tabla para renderizado académico en el frontend.
"""
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pulp
from fractions import Fraction


def _fraction_round(val: float, decimals: int = 6) -> float:
    """Redondea valores flotantes pequeños a cero."""
    return round(val, decimals)


def solve_simplex_stepbystep(
    obj_type: str,
    obj_coeffs: List[float],
    constraints: List[Dict],
    var_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Resuelve un PL usando el método Simplex con captura de iteraciones.

    Implementación manual del tableau Simplex en NumPy para capturar
    cada paso, complementada con PuLP para verificación.

    Retorna:
        {
          "status": str,
          "optimal_value": float,
          "variables": {xi: val},
          "tableaux": [...],
          "dual_values": {...},
          "sensitivity": {...}
        }
    """
    n_vars = len(obj_coeffs)
    n_constraints = len(constraints)

    if var_names is None:
        var_names = [f"x{i+1}" for i in range(n_vars)]

    # ── 1. Construir tableau aumentado ────────────────────────────────
    # Variables de holgura / exceso / artificiales
    slack_vars = []
    artificial_vars = []
    col_names = list(var_names)

    # Matriz de restricciones ampliada
    A = []
    b = []
    constraint_types = []

    for i, c in enumerate(constraints):
        row = list(c["coefficients"])
        op = c["operator"]
        rhs = float(c["rhs"])
        constraint_types.append(op)
        A.append(row)
        b.append(rhs)

    # Agregar slacks y artificiales
    slack_matrix = []
    art_matrix = []

    slack_idx = 0
    art_idx = 0

    for i, op in enumerate(constraint_types):
        s_row = [0.0] * n_constraints
        a_row = [0.0] * n_constraints

        if op == "<=":
            s_row[i] = 1.0
            slack_vars.append(f"s{slack_idx+1}")
            slack_idx += 1
        elif op == ">=":
            s_row[i] = -1.0
            a_row[i] = 1.0
            slack_vars.append(f"s{slack_idx+1}")
            artificial_vars.append(f"a{art_idx+1}")
            slack_idx += 1
            art_idx += 1
        elif op == "=":
            a_row[i] = 1.0
            artificial_vars.append(f"a{art_idx+1}")
            art_idx += 1

        slack_matrix.append(s_row)
        art_matrix.append(a_row)

    col_names += slack_vars + artificial_vars

    # ── 2. Usar PuLP para solución y análisis de sensibilidad ─────────
    sense = pulp.LpMaximize if obj_type == "MAX" else pulp.LpMinimize
    prob = pulp.LpProblem("LP", sense)

    lp_vars = [pulp.LpVariable(name, lowBound=0) for name in var_names]

    prob += pulp.lpSum(obj_coeffs[i] * lp_vars[i] for i in range(n_vars))

    pulp_constraints = []
    for i, c in enumerate(constraints):
        expr = pulp.lpSum(c["coefficients"][j] * lp_vars[j] for j in range(n_vars))
        if c["operator"] == "<=":
            constraint = expr <= c["rhs"]
        elif c["operator"] == ">=":
            constraint = expr >= c["rhs"]
        else:
            constraint = expr == c["rhs"]
        prob += constraint
        pulp_constraints.append(constraint)

    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    status_map = {
        "Optimal": "optimal",
        "Infeasible": "infeasible",
        "Unbounded": "unbounded",
        "Not Solved": "not_solved",
    }
    pulp_status = pulp.LpStatus[prob.status]
    status = status_map.get(pulp_status, pulp_status.lower())

    if status != "optimal":
        messages = {
            "infeasible": "El problema no tiene solución factible. La región factible está vacía.",
            "unbounded": "El problema no está acotado. La función objetivo puede crecer indefinidamente.",
            "not_solved": "No se pudo resolver el problema.",
        }
        return {
            "status": status,
            "error_message": messages.get(status, "Error desconocido"),
            "tableaux": [],
        }

    optimal_value = pulp.value(prob.objective)
    solution = {v.name: _fraction_round(v.varValue or 0.0) for v in lp_vars}

    # ── 3. Simular iteraciones del Simplex manualmente ────────────────
    tableaux = _simulate_simplex_tableaux(
        obj_type, obj_coeffs, constraints, var_names, n_vars, n_constraints
    )

    # ── 4. Precios sombra (dual values) ──────────────────────────────
    dual_values = {}
    for i, (name, c) in enumerate(zip([f"R{i+1}" for i in range(n_constraints)], pulp_constraints)):
        try:
            dual_values[name] = _fraction_round(pulp.value(c.pi) or 0.0)
        except Exception:
            dual_values[name] = 0.0

    # ── 5. Análisis de sensibilidad ───────────────────────────────────
    sensitivity = _compute_sensitivity(prob, lp_vars, obj_coeffs, constraints, var_names)

    return {
        "status": status,
        "optimal_value": _fraction_round(optimal_value),
        "variables": solution,
        "tableaux": tableaux,
        "dual_values": dual_values,
        "sensitivity": sensitivity,
    }


def _simulate_simplex_tableaux(
    obj_type: str,
    obj_coeffs: List[float],
    constraints: List[Dict],
    var_names: List[str],
    n_vars: int,
    n_constraints: int,
) -> List[Dict]:
    """
    Simula las iteraciones del método Simplex Big-M en NumPy.
    Retorna lista de tableaux serializables.
    """
    BIG_M = 1e6
    sense = 1 if obj_type == "MAX" else -1  # MAX: maximizar, MIN: convertir

    # Construir tableau con holguras y artificiales
    slack_names = []
    art_names = []
    extra_cols = []  # columnas a agregar

    for i, c in enumerate(constraints):
        op = c["operator"]
        if op == "<=":
            col = [0.0] * n_constraints
            col[i] = 1.0
            extra_cols.append(("slack", f"s{i+1}", col, 0.0))
            slack_names.append(f"s{i+1}")
        elif op == ">=":
            s_col = [0.0] * n_constraints
            s_col[i] = -1.0
            extra_cols.append(("slack", f"s{i+1}", s_col, 0.0))
            slack_names.append(f"s{i+1}")
            a_col = [0.0] * n_constraints
            a_col[i] = 1.0
            extra_cols.append(("art", f"a{i+1}", a_col, BIG_M))
            art_names.append(f"a{i+1}")
        elif op == "=":
            a_col = [0.0] * n_constraints
            a_col[i] = 1.0
            extra_cols.append(("art", f"a{i+1}", a_col, BIG_M))
            art_names.append(f"a{i+1}")

    all_var_names = list(var_names) + [ec[1] for ec in extra_cols]
    n_cols = len(all_var_names)

    # Cj (coeficientes de la función objetivo extendida)
    cj = list(obj_coeffs) + [ec[3] if obj_type == "MAX" else -ec[3] for ec in extra_cols]
    if obj_type == "MIN":
        cj_original = [-c for c in obj_coeffs] + [0.0] * len(extra_cols)
        cj = [-c for c in obj_coeffs] + [0.0 if ec[0] == "slack" else -BIG_M for ec in extra_cols]
    else:
        cj = list(obj_coeffs) + [0.0 if ec[0] == "slack" else -BIG_M for ec in extra_cols]

    # Construir la matriz A ampliada
    tableau = []
    for i, c in enumerate(constraints):
        row = list(float(x) for x in c["coefficients"])
        for ec in extra_cols:
            row.append(ec[2][i])
        row.append(float(c["rhs"]))
        tableau.append(row)

    tableau = np.array(tableau, dtype=float)
    rhs_col = n_cols  # índice de la columna RHS (última)

    # Variables básicas iniciales
    basic_vars = []
    for i, c in enumerate(constraints):
        op = c["operator"]
        if op == "<=":
            # La holgura de esta fila es básica
            s_name = f"s{i+1}"
            basic_vars.append(s_name)
        else:
            a_name = f"a{i+1}"
            basic_vars.append(a_name)

    tableaux_list = []
    max_iter = 50

    for iteration in range(max_iter + 1):
        # Calcular Zj y Cj-Zj
        cb = np.array([cj[all_var_names.index(bv)] if bv in all_var_names else 0.0
                       for bv in basic_vars])

        zj = cb @ tableau[:, :n_cols]
        z_val = float(cb @ tableau[:, rhs_col])

        cj_arr = np.array(cj, dtype=float)
        cj_zj = cj_arr - zj

        # Serializar tableau
        tableau_data = []
        for row_i in range(n_constraints):
            row_data = [_fraction_round(tableau[row_i, col_j]) for col_j in range(n_cols + 1)]
            tableau_data.append(row_data)

        entering = None
        leaving = None

        # Criterio de optimalidad: todos Cj-Zj <= 0 para MAX
        max_cj_zj = max(cj_zj)
        if max_cj_zj <= 1e-8:
            # Óptimo alcanzado
            tableaux_list.append({
                "iteration": iteration,
                "basic_variables": list(basic_vars),
                "variable_names": list(all_var_names),
                "cj": list(cj),
                "zj": [_fraction_round(v) for v in zj.tolist()],
                "cj_zj": [_fraction_round(v) for v in cj_zj.tolist()],
                "z_value": _fraction_round(z_val),
                "tableau": tableau_data,
                "entering_variable": None,
                "leaving_variable": None,
                "is_optimal": True,
            })
            break

        # Variable entrante: mayor Cj-Zj
        entering_col = int(np.argmax(cj_zj))
        entering = all_var_names[entering_col]

        # Test de la razón mínima positiva
        ratios = []
        for row_i in range(n_constraints):
            denom = tableau[row_i, entering_col]
            if denom > 1e-8:
                ratios.append(tableau[row_i, rhs_col] / denom)
            else:
                ratios.append(np.inf)

        if all(r == np.inf for r in ratios):
            # No acotado
            break

        leaving_row = int(np.argmin(ratios))
        leaving = basic_vars[leaving_row]

        tableaux_list.append({
            "iteration": iteration,
            "basic_variables": list(basic_vars),
            "variable_names": list(all_var_names),
            "cj": list(cj),
            "zj": [_fraction_round(v) for v in zj.tolist()],
            "cj_zj": [_fraction_round(v) for v in cj_zj.tolist()],
            "z_value": _fraction_round(z_val),
            "tableau": tableau_data,
            "entering_variable": entering,
            "leaving_variable": leaving,
            "is_optimal": False,
        })

        # Pivoteo
        pivot = tableau[leaving_row, entering_col]
        tableau[leaving_row, :] /= pivot

        for row_i in range(n_constraints):
            if row_i != leaving_row:
                factor = tableau[row_i, entering_col]
                tableau[row_i, :] -= factor * tableau[leaving_row, :]

        basic_vars[leaving_row] = entering

    return tableaux_list


def _compute_sensitivity(
    prob: pulp.LpProblem,
    lp_vars: List[pulp.LpVariable],
    obj_coeffs: List[float],
    constraints: List[Dict],
    var_names: List[str],
) -> Dict[str, Any]:
    """Calcula análisis de sensibilidad básico."""
    sensitivity = {
        "objective_ranges": {},
        "rhs_ranges": {},
        "shadow_prices": {},
    }
    try:
        for i, v in enumerate(lp_vars):
            sensitivity["objective_ranges"][var_names[i]] = {
                "current": obj_coeffs[i],
                "value": round(v.varValue or 0.0, 6),
            }
        for i, c in enumerate(constraints):
            key = f"Restricción {i+1}"
            try:
                sensitivity["shadow_prices"][key] = round(pulp.value(prob.constraints.get(f"_C{i+1}", None)) or 0.0, 6)
            except Exception:
                sensitivity["shadow_prices"][key] = 0.0
    except Exception:
        pass
    return sensitivity


def generate_dual_model(
    obj_type: str,
    obj_coeffs: List[float],
    constraints: List[Dict],
    var_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Genera el modelo Dual a partir del Primal.
    Reglas de dualidad estándar:
      - MAX primal  → MIN dual
      - Restricciones <= primal → variables duales >= 0
      - Restricciones >= primal → variables duales <= 0
      - Restricciones = primal  → variables duales irrestrictas
    """
    n_vars = len(obj_coeffs)
    n_constraints = len(constraints)

    if var_names is None:
        var_names = [f"x{i+1}" for i in range(n_vars)]

    dual_var_names = [f"y{i+1}" for i in range(n_constraints)]
    dual_type = "MIN" if obj_type == "MAX" else "MAX"

    # Función objetivo dual: coeficientes = RHS del primal
    dual_obj = [c["rhs"] for c in constraints]

    # Restricciones duales: transpuesta de A
    # Una restricción dual por cada variable primal
    dual_constraints = []
    for j in range(n_vars):
        coeffs = [constraints[i]["coefficients"][j] for i in range(n_constraints)]
        if obj_type == "MAX":
            op = ">="
        else:
            op = "<="
        dual_constraints.append({
            "coefficients": coeffs,
            "operator": op,
            "rhs": obj_coeffs[j],
            "variable": var_names[j],
        })

    # Representación LaTeX del dual
    obj_terms = " + ".join(f"{dual_obj[i]}y_{{{i+1}}}" for i in range(n_constraints))
    latex = f"\\text{{{dual_type}}} \\quad Z_D = {obj_terms}\\\\ \\text{{s.a.:}}\\\\"
    for j, dc in enumerate(dual_constraints):
        terms = " + ".join(f"{dc['coefficients'][i]}y_{{{i+1}}}" for i in range(n_constraints))
        latex += f"{terms} {dc['operator']} {dc['rhs']}\\\\"
    latex += "y_i \\geq 0 \\quad \\forall i"

    return {
        "primal_type": obj_type,
        "dual_type": dual_type,
        "dual_objective": dual_obj,
        "dual_constraints": dual_constraints,
        "dual_variable_names": dual_var_names,
        "latex_representation": latex,
    }


def solve_graphical_method(
    obj_type: str,
    obj_coeffs: List[float],
    constraints: List[Dict],
) -> Dict[str, Any]:
    """
    Método Gráfico para PL con 2 variables.
    Calcula vértices de la región factible y punto óptimo.
    """
    if len(obj_coeffs) != 2:
        return {
            "status": "error",
            "error_message": "El método gráfico solo soporta 2 variables.",
            "vertices": [],
            "constraint_lines": [],
        }

    from itertools import combinations

    n = len(constraints)
    # Agregar restricciones de no negatividad
    all_constraints = list(constraints) + [
        {"coefficients": [1, 0], "operator": ">=", "rhs": 0},
        {"coefficients": [0, 1], "operator": ">=", "rhs": 0},
    ]

    def constraint_satisfied(x, y, c):
        val = c["coefficients"][0] * x + c["coefficients"][1] * y
        if c["operator"] == "<=":
            return val <= c["rhs"] + 1e-8
        elif c["operator"] == ">=":
            return val >= c["rhs"] - 1e-8
        else:
            return abs(val - c["rhs"]) < 1e-8

    # Encontrar intersecciones entre pares de restricciones
    vertices = []
    extended = all_constraints

    for i, j in combinations(range(len(extended)), 2):
        c1, c2 = extended[i], extended[j]
        A = np.array([
            c1["coefficients"],
            c2["coefficients"],
        ], dtype=float)
        b_vec = np.array([c1["rhs"], c2["rhs"]], dtype=float)

        try:
            if abs(np.linalg.det(A)) < 1e-10:
                continue
            point = np.linalg.solve(A, b_vec)
            x, y = point
            if x < -1e-6 or y < -1e-6:
                continue

            # Verificar factibilidad en todas las restricciones originales
            feasible = all(constraint_satisfied(x, y, c) for c in constraints)
            if feasible:
                vertices.append({
                    "x": _fraction_round(x),
                    "y": _fraction_round(y),
                    "is_optimal": False,
                    "z_value": _fraction_round(obj_coeffs[0] * x + obj_coeffs[1] * y),
                })
        except np.linalg.LinAlgError:
            continue

    if not vertices:
        return {
            "status": "infeasible",
            "error_message": "No se encontraron vértices factibles. La región factible está vacía.",
            "vertices": [],
            "constraint_lines": [],
        }

    # Encontrar óptimo
    sense = max if obj_type == "MAX" else min
    optimal = sense(vertices, key=lambda v: v["z_value"])
    optimal["is_optimal"] = True

    # Líneas para graficar restricciones
    x_max = max(v["x"] for v in vertices) * 1.5 + 2
    constraint_lines = []
    for i, c in enumerate(constraints):
        a1, a2 = c["coefficients"]
        rhs = c["rhs"]
        if abs(a2) > 1e-10:
            x_pts = [0, x_max]
            y_pts = [(rhs - a1 * x) / a2 for x in x_pts]
        elif abs(a1) > 1e-10:
            x_pts = [rhs / a1, rhs / a1]
            y_pts = [0, x_max]
        else:
            continue
        constraint_lines.append({
            "id": f"c{i+1}",
            "label": f"R{i+1}",
            "x_pts": x_pts,
            "y_pts": [_fraction_round(y) for y in y_pts],
            "operator": c["operator"],
            "rhs": rhs,
        })

    return {
        "status": "optimal",
        "vertices": vertices,
        "optimal_point": optimal,
        "optimal_value": optimal["z_value"],
        "constraint_lines": constraint_lines,
        "error_message": None,
    }
