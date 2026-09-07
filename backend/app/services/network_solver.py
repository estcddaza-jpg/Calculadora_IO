"""
network_solver.py — Transporte, Asignación, Flujo Máximo, MST con NetworkX
"""
from typing import List, Dict, Any, Optional
import numpy as np
import networkx as nx


# ─────────────────────────────────────────────────────────────────────
#  PROBLEMA DE TRANSPORTE
# ─────────────────────────────────────────────────────────────────────

def solve_transport(
    method: str,
    supply: List[float],
    demand: List[float],
    costs: List[List[float]],
    source_names: Optional[List[str]] = None,
    destination_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Resuelve el problema de transporte con método seleccionado."""
    supply = list(supply)
    demand = list(demand)
    costs = [list(row) for row in costs]

    m = len(supply)
    n = len(demand)

    if source_names is None:
        source_names = [f"O{i+1}" for i in range(m)]
    if destination_names is None:
        destination_names = [f"D{j+1}" for j in range(n)]

    # Balancear si es necesario
    dummy_added = None
    total_supply = sum(supply)
    total_demand = sum(demand)

    if abs(total_supply - total_demand) > 1e-8:
        if total_supply > total_demand:
            diff = total_supply - total_demand
            demand.append(diff)
            for row in costs:
                row.append(0.0)
            destination_names.append("D_ficticio")
            n += 1
            dummy_added = f"Columna ficticia D_ficticio (demanda={diff:.1f}) agregada para balancear"
        else:
            diff = total_demand - total_supply
            supply.append(diff)
            costs.append([0.0] * n)
            source_names.append("O_ficticio")
            m += 1
            dummy_added = f"Fila ficticia O_ficticio (oferta={diff:.1f}) agregada para balancear"

    steps = []

    if method == "northwest":
        allocation, step_list = _northwest_corner(supply, demand, costs, source_names, destination_names)
    elif method == "min_cost":
        allocation, step_list = _minimum_cost(supply, demand, costs, source_names, destination_names)
    elif method == "vogel":
        allocation, step_list = _vogel_approximation(supply, demand, costs, source_names, destination_names)
    else:
        return {"status": "error", "error_message": f"Método '{method}' no reconocido."}

    # Costo total
    total_cost = 0.0
    for i in range(len(supply)):
        for j in range(len(demand)):
            if allocation[i][j] is not None:
                total_cost += allocation[i][j] * costs[i][j]

    return {
        "status": "optimal",
        "method": method,
        "total_cost": round(total_cost, 4),
        "allocation": allocation,
        "steps": step_list,
        "is_balanced": dummy_added is None,
        "dummy_added": dummy_added,
        "error_message": None,
    }


def _northwest_corner(supply, demand, costs, src_names, dst_names):
    m, n = len(supply), len(demand)
    supply_rem = list(supply)
    demand_rem = list(demand)
    allocation = [[None] * n for _ in range(m)]
    steps = []
    i, j = 0, 0

    while i < m and j < n:
        qty = min(supply_rem[i], demand_rem[j])
        allocation[i][j] = qty
        steps.append({
            "description": f"Asignar {qty} de {src_names[i]} a {dst_names[j]}",
            "allocation_matrix": [row[:] for row in allocation],
            "cost": None,
        })
        supply_rem[i] -= qty
        demand_rem[j] -= qty
        if supply_rem[i] == 0 and demand_rem[j] == 0:
            if i + 1 < m:
                i += 1
            else:
                j += 1
        elif supply_rem[i] == 0:
            i += 1
        else:
            j += 1

    return allocation, steps


def _minimum_cost(supply, demand, costs, src_names, dst_names):
    m, n = len(supply), len(demand)
    supply_rem = list(supply)
    demand_rem = list(demand)
    allocation = [[None] * n for _ in range(m)]
    steps = []

    # Ordenar celdas por costo ascendente
    cells = [(costs[i][j], i, j) for i in range(m) for j in range(n)]
    cells.sort(key=lambda x: x[0])

    for cost, i, j in cells:
        if supply_rem[i] > 0 and demand_rem[j] > 0:
            qty = min(supply_rem[i], demand_rem[j])
            allocation[i][j] = qty
            supply_rem[i] -= qty
            demand_rem[j] -= qty
            steps.append({
                "description": f"Costo mínimo={cost}: Asignar {qty} de {src_names[i]} a {dst_names[j]}",
                "allocation_matrix": [row[:] for row in allocation],
                "cost": cost,
            })

    return allocation, steps


def _vogel_approximation(supply, demand, costs, src_names, dst_names):
    m, n = len(supply), len(demand)
    supply_rem = list(supply)
    demand_rem = list(demand)
    allocation = [[None] * n for _ in range(m)]
    steps = []
    row_done = [False] * m
    col_done = [False] * n

    def get_penalty(values):
        sorted_vals = sorted(v for v in values if v is not None)
        if len(sorted_vals) < 2:
            return sorted_vals[0] if sorted_vals else 0, 0
        return sorted_vals[1] - sorted_vals[0], sorted_vals[0]

    for _ in range(m + n):
        if all(row_done) or all(col_done):
            break

        row_penalties = []
        for i in range(m):
            if row_done[i]:
                row_penalties.append((-np.inf, 0))
                continue
            vals = [costs[i][j] if not col_done[j] else None for j in range(n)]
            pen, min_cost = get_penalty(vals)
            row_penalties.append((pen, i))

        col_penalties = []
        for j in range(n):
            if col_done[j]:
                col_penalties.append((-np.inf, 0))
                continue
            vals = [costs[i][j] if not row_done[i] else None for i in range(m)]
            pen, min_cost = get_penalty(vals)
            col_penalties.append((pen, j))

        max_row_pen = max(row_penalties, key=lambda x: x[0])
        max_col_pen = max(col_penalties, key=lambda x: x[0])

        if max_row_pen[0] >= max_col_pen[0]:
            i = max_row_pen[1]
            j = min((j for j in range(n) if not col_done[j]),
                    key=lambda j: costs[i][j])
        else:
            j = max_col_pen[1]
            i = min((i for i in range(m) if not row_done[i]),
                    key=lambda i: costs[i][j])

        qty = min(supply_rem[i], demand_rem[j])
        allocation[i][j] = qty
        supply_rem[i] -= qty
        demand_rem[j] -= qty

        steps.append({
            "description": f"Vogel: Asignar {qty} de {src_names[i]} a {dst_names[j]} (costo={costs[i][j]})",
            "allocation_matrix": [row[:] for row in allocation],
            "cost": costs[i][j],
        })

        if supply_rem[i] == 0:
            row_done[i] = True
        if demand_rem[j] == 0:
            col_done[j] = True

    return allocation, steps


# ─────────────────────────────────────────────────────────────────────
#  PROBLEMA DE ASIGNACIÓN — Método Húngaro
# ─────────────────────────────────────────────────────────────────────

def solve_assignment(
    cost_matrix: List[List[float]],
    problem_type: str = "MIN",
    agent_names: Optional[List[str]] = None,
    task_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Método Húngaro para problema de asignación."""
    matrix = np.array(cost_matrix, dtype=float)
    n = matrix.shape[0]

    if agent_names is None:
        agent_names = [f"Agente {i+1}" for i in range(n)]
    if task_names is None:
        task_names = [f"Tarea {j+1}" for j in range(n)]

    if problem_type == "MAX":
        matrix = matrix.max() - matrix

    steps = []

    # Paso 1: Reducción por filas
    row_min = matrix.min(axis=1, keepdims=True)
    matrix = matrix - row_min
    steps.append({"step": "Reducción por filas", "matrix": matrix.tolist()})

    # Paso 2: Reducción por columnas
    col_min = matrix.min(axis=0, keepdims=True)
    matrix = matrix - col_min
    steps.append({"step": "Reducción por columnas", "matrix": matrix.tolist()})

    # Método húngaro simplificado usando scipy
    from scipy.optimize import linear_sum_assignment
    orig_matrix = np.array(cost_matrix, dtype=float)
    if problem_type == "MAX":
        row_ind, col_ind = linear_sum_assignment(-orig_matrix)
    else:
        row_ind, col_ind = linear_sum_assignment(orig_matrix)

    total = float(sum(orig_matrix[r, c] for r, c in zip(row_ind, col_ind)))
    assignments = [
        {"agent": agent_names[r], "task": task_names[c], "cost": float(orig_matrix[r, c])}
        for r, c in zip(row_ind, col_ind)
    ]

    return {
        "status": "optimal",
        "total_cost": round(total, 4),
        "assignments": assignments,
        "steps": steps,
        "error_message": None,
    }


# ─────────────────────────────────────────────────────────────────────
#  FLUJO MÁXIMO
# ─────────────────────────────────────────────────────────────────────

def solve_max_flow(
    edges: List[Dict],
    source: str,
    sink: str,
) -> Dict[str, Any]:
    """Ford-Fulkerson / Edmonds-Karp con NetworkX."""
    G = nx.DiGraph()
    for e in edges:
        G.add_edge(e["source"], e["target"], capacity=e["capacity"])

    try:
        flow_value, flow_dict = nx.maximum_flow(G, source, sink, flow_func=nx.algorithms.flow.edmonds_karp)
    except nx.NetworkXError as e:
        return {"status": "error", "error_message": str(e)}

    flow_edges = []
    for u in flow_dict:
        for v, flow in flow_dict[u].items():
            if flow > 0:
                cap = G[u][v].get("capacity", 0)
                flow_edges.append({
                    "source": u,
                    "target": v,
                    "flow": flow,
                    "capacity": cap,
                    "label": f"{flow}/{cap}",
                })

    return {
        "status": "optimal",
        "max_flow": flow_value,
        "flow_on_edges": flow_edges,
        "error_message": None,
    }


# ─────────────────────────────────────────────────────────────────────
#  ÁRBOL DE MÍNIMA EXPANSIÓN
# ─────────────────────────────────────────────────────────────────────

def solve_mst(
    edges: List[Dict],
    algorithm: str = "kruskal",
) -> Dict[str, Any]:
    """Prim o Kruskal con NetworkX."""
    G = nx.Graph()
    for e in edges:
        G.add_edge(e["source"], e["target"], weight=e["weight"])

    try:
        if algorithm == "kruskal":
            mst = nx.minimum_spanning_tree(G, algorithm="kruskal")
        else:
            mst = nx.minimum_spanning_tree(G, algorithm="prim")
    except Exception as ex:
        return {"status": "error", "error_message": str(ex)}

    mst_edges = [
        {"source": u, "target": v, "weight": d["weight"]}
        for u, v, d in mst.edges(data=True)
    ]
    total = sum(e["weight"] for e in mst_edges)

    return {
        "status": "optimal",
        "algorithm": algorithm,
        "total_weight": round(total, 4),
        "mst_edges": mst_edges,
        "error_message": None,
    }
