import numpy as np
from typing import List, Dict, Any, Optional

def _fraction_round(val: float, decimals: int = 6) -> float:
    return round(val, decimals)

def solve_revised_simplex_stepbystep(
    obj_type: str,
    obj_coeffs: List[float],
    constraints: List[Dict],
    var_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    n_vars = len(obj_coeffs)
    n_constraints = len(constraints)
    if var_names is None:
        var_names = [f"x{i+1}" for i in range(n_vars)]

    BIG_M = 1e6
    sense = 1 if obj_type == "MAX" else -1

    # Preparar el problema agregando variables de holgura y artificiales
    slack_names = []
    art_names = []
    extra_cols = []
    
    for i, c in enumerate(constraints):
        op = c["operator"]
        if op == "<=":
            col = [0.0] * n_constraints
            col[i] = 1.0
            extra_cols.append(("slack", f"s{i+1}", col, 0.0))
        elif op == ">=":
            s_col = [0.0] * n_constraints
            s_col[i] = -1.0
            extra_cols.append(("slack", f"s{i+1}", s_col, 0.0))
            a_col = [0.0] * n_constraints
            a_col[i] = 1.0
            extra_cols.append(("art", f"a{i+1}", a_col, BIG_M))
        elif op == "=":
            a_col = [0.0] * n_constraints
            a_col[i] = 1.0
            extra_cols.append(("art", f"a{i+1}", a_col, BIG_M))

    all_var_names = list(var_names) + [ec[1] for ec in extra_cols]
    n_cols = len(all_var_names)

    # Costos C_j 
    if obj_type == "MIN":
        cj = [-c for c in obj_coeffs] + [0.0 if ec[0] == "slack" else -BIG_M for ec in extra_cols]
    else:
        cj = list(obj_coeffs) + [0.0 if ec[0] == "slack" else -BIG_M for ec in extra_cols]

    # Matriz A original + ampliada
    A = []
    b = []
    for i, c in enumerate(constraints):
        row = list(float(x) for x in c["coefficients"])
        for ec in extra_cols:
            row.append(ec[2][i])
        A.append(row)
        b.append(float(c["rhs"]))

    A = np.array(A, dtype=float)
    b = np.array(b, dtype=float)

    # Base inicial: variables de holgura y artificiales
    basic_vars_idx = []
    for i, c in enumerate(constraints):
        op = c["operator"]
        if op == "<=":
            idx = all_var_names.index(f"s{i+1}")
        else:
            idx = all_var_names.index(f"a{i+1}")
        basic_vars_idx.append(idx)
        
    basic_vars_idx = np.array(basic_vars_idx, dtype=int)
    B_inv = np.eye(n_constraints)

    tableaux_list = []
    max_iter = 50

    for iteration in range(max_iter + 1):
        # Nombres de VB actuales
        current_bv_names = [all_var_names[i] for i in basic_vars_idx]
        cb = np.array([cj[i] for i in basic_vars_idx])
        
        # 1. Pi = cB * B_inv
        pi = cb @ B_inv
        
        # 2. RHS = B_inv * b (Valores actuales de la base)
        b_bar = B_inv @ b
        z_val = cb @ b_bar

        # 3. Costos reducidos cj_zj = cj - zj = cj - pi * A
        zj = pi @ A
        cj_zj = np.array(cj) - zj
        
        # Modificar cj_zj para las variables básicas para evitar errores de coma flotante
        cj_zj[basic_vars_idx] = 0.0

        # Serializar estado actual para la tabla
        b_inv_list = [[_fraction_round(v) for v in row] for row in B_inv.tolist()]
        rhs_list = [_fraction_round(v) for v in b_bar.tolist()]
        pi_list = [_fraction_round(v) for v in pi.tolist()]
        reduced_costs_list = [_fraction_round(v) for v in cj_zj.tolist()]
        
        # 4. Variable entrante (Criterio de optimalidad)
        max_cj_zj = np.max(cj_zj)
        if max_cj_zj <= 1e-8:
            # Optimo
            tableaux_list.append({
                "iteration": iteration,
                "basic_variables": current_bv_names,
                "variable_names": all_var_names,
                "b_inv": b_inv_list,
                "rhs": rhs_list,
                "pi": pi_list,
                "reduced_costs": reduced_costs_list,
                "z_value": _fraction_round(z_val),
                "entering_variable": None,
                "leaving_variable": None,
                "is_optimal": True,
            })
            break
            
        entering_idx = int(np.argmax(cj_zj))
        entering = all_var_names[entering_idx]
        
        # 5. Variable saliente (Prueba de razón mínima)
        A_bar = B_inv @ A[:, entering_idx]
        
        ratios = []
        for i in range(n_constraints):
            if A_bar[i] > 1e-8:
                ratios.append(b_bar[i] / A_bar[i])
            else:
                ratios.append(np.inf)
                
        if all(r == np.inf for r in ratios):
            # No acotado
            tableaux_list.append({
                "iteration": iteration,
                "basic_variables": current_bv_names,
                "variable_names": all_var_names,
                "b_inv": b_inv_list,
                "rhs": rhs_list,
                "pi": pi_list,
                "reduced_costs": reduced_costs_list,
                "z_value": _fraction_round(z_val),
                "entering_variable": entering,
                "leaving_variable": None,
                "is_optimal": False,
            })
            break
            
        leaving_row = int(np.argmin(ratios))
        leaving = current_bv_names[leaving_row]
        
        tableaux_list.append({
            "iteration": iteration,
            "basic_variables": current_bv_names,
            "variable_names": all_var_names,
            "b_inv": b_inv_list,
            "rhs": rhs_list,
            "pi": pi_list,
            "reduced_costs": reduced_costs_list,
            "z_value": _fraction_round(z_val),
            "entering_variable": entering,
            "leaving_variable": leaving,
            "is_optimal": False,
        })
        
        # 6. Actualizar B_inv con matriz de transformación (E)
        E = np.eye(n_constraints)
        pivot = A_bar[leaving_row]
        E[:, leaving_row] = -A_bar / pivot
        E[leaving_row, leaving_row] = 1.0 / pivot
        B_inv = E @ B_inv
        
        # Actualizar variables básicas
        basic_vars_idx[leaving_row] = entering_idx

    # Determinar status y variables finales
    if len(tableaux_list) > 0 and tableaux_list[-1]["is_optimal"]:
        status = "optimal"
        opt_val = tableaux_list[-1]["z_value"]
        # Obtener valores de la base
        sol = {}
        for i, name in enumerate(tableaux_list[-1]["basic_variables"]):
            if name in var_names: # Solo para variables originales
                sol[name] = tableaux_list[-1]["rhs"][i]
        for name in var_names:
            if name not in sol:
                sol[name] = 0.0
    else:
        status = "unbounded" if len(tableaux_list) > 0 else "error"
        opt_val = None
        sol = None
        
    return {
        "status": status,
        "optimal_value": opt_val,
        "variables": sol,
        "tableaux": tableaux_list,
    }
