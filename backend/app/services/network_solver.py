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
#  PROBLEMA DE ASIGNACIÓN — Método Húngaro (con pasos)
# ─────────────────────────────────────────────────────────────────────

def solve_assignment(
    cost_matrix: List[List[float]],
    problem_type: str = "MIN",
    agent_names: Optional[List[str]] = None,
    task_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Método Húngaro para problema de asignación con pasos del algoritmo Kuhn-Munkres."""
    orig_matrix = np.array(cost_matrix, dtype=float)
    n_rows, n_cols = orig_matrix.shape

    # Auto-balance: pad to square
    n = max(n_rows, n_cols)
    matrix = np.zeros((n, n), dtype=float)
    matrix[:n_rows, :n_cols] = orig_matrix

    if agent_names is None:
        agent_names = [f"Agente {i+1}" for i in range(n_rows)]
    if task_names is None:
        task_names = [f"Tarea {j+1}" for j in range(n_cols)]

    # Extend names for padded rows/cols
    agent_names_ext = list(agent_names) + [f"Ficticio {i+1}" for i in range(n - n_rows)]
    task_names_ext = list(task_names) + [f"Ficticio {j+1}" for j in range(n - n_cols)]

    km_steps = solve_kuhn_munkres(
        cost_matrix=cost_matrix,
        problem_type=problem_type,
        agent_names=agent_names_ext[:n],
        task_names=task_names_ext[:n],
    )

    # Use scipy for reliable optimal
    from scipy.optimize import linear_sum_assignment
    work = np.array(cost_matrix, dtype=float)
    padded = np.zeros((n, n), dtype=float)
    padded[:n_rows, :n_cols] = work
    if problem_type == "MAX":
        row_ind, col_ind = linear_sum_assignment(-padded)
    else:
        row_ind, col_ind = linear_sum_assignment(padded)

    total = float(sum(orig_matrix[r, c] for r, c in zip(row_ind, col_ind) if r < n_rows and c < n_cols))
    assignments = [
        {"agent": agent_names[r], "task": task_names[c], "cost": float(orig_matrix[r, c])}
        for r, c in zip(row_ind, col_ind) if r < n_rows and c < n_cols
    ]

    return {
        "status": "optimal",
        "total_cost": round(total, 4),
        "assignments": assignments,
        "steps": km_steps,
        "error_message": None,
    }


def solve_kuhn_munkres(
    cost_matrix: List[List[float]],
    problem_type: str = "MIN",
    agent_names: Optional[List[str]] = None,
    task_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Implementación explícita paso a paso del algoritmo de Kuhn-Munkres.
    Devuelve el historial completo de matrices para visualización académica.
    """
    orig = np.array(cost_matrix, dtype=float)
    n_rows, n_cols = orig.shape
    n = max(n_rows, n_cols)

    # Pad to square matrix
    matrix = np.zeros((n, n), dtype=float)
    matrix[:n_rows, :n_cols] = orig

    if agent_names is None:
        agent_names = [f"Agente {i+1}" for i in range(n)]
    if task_names is None:
        task_names = [f"Tarea {j+1}" for j in range(n)]

    steps: List[Dict[str, Any]] = []

    # Step 0: Original (or inverted for MAX)
    if problem_type == "MAX":
        matrix = matrix.max() - matrix
        steps.append({
            "step": "Conversión MAX→MIN (restar de máximo)",
            "description": f"Para maximizar, se convierte: nuevo_costo = {orig.max()} - costo_original",
            "matrix": matrix.tolist(),
            "row_names": agent_names,
            "col_names": task_names,
        })
    else:
        steps.append({
            "step": "Matriz original",
            "description": "Matriz de costos de entrada al algoritmo.",
            "matrix": matrix.tolist(),
            "row_names": agent_names,
            "col_names": task_names,
        })

    # Step 1: Row reduction
    row_min = matrix.min(axis=1, keepdims=True)
    matrix = matrix - row_min
    steps.append({
        "step": "Paso 1 — Reducción por filas",
        "description": f"Se resta el mínimo de cada fila: {row_min.flatten().tolist()}",
        "matrix": matrix.tolist(),
        "row_names": agent_names,
        "col_names": task_names,
        "highlight": "rows",
    })

    # Step 2: Column reduction
    col_min = matrix.min(axis=0, keepdims=True)
    matrix = matrix - col_min
    steps.append({
        "step": "Paso 2 — Reducción por columnas",
        "description": f"Se resta el mínimo de cada columna: {col_min.flatten().tolist()}",
        "matrix": matrix.tolist(),
        "row_names": agent_names,
        "col_names": task_names,
        "highlight": "cols",
    })

    # Steps 3+: Cover zeros and iterate until assignment found
    iteration = 3
    while True:
        # Find minimum cover lines
        assignment_matrix = np.zeros_like(matrix, dtype=int)
        row_covered = np.zeros(n, dtype=bool)
        col_covered = np.zeros(n, dtype=bool)

        # Greedy zero covering for display
        row_has_zero = (matrix == 0).any(axis=1)
        col_has_zero = (matrix == 0).any(axis=0)
        lines_used = int(row_has_zero.sum()) if row_has_zero.sum() < col_has_zero.sum() else int(col_has_zero.sum())

        # Check if we can make n assignments on zeros
        from scipy.optimize import linear_sum_assignment
        # Use big-M trick: where matrix > 0, put large value; 0s become candidates
        zero_mask = (matrix == 0).astype(float)
        # We want to maximize the number of zero-assignments
        try:
            ri, ci = linear_sum_assignment(-zero_mask)
            n_assigned = int(sum(1 for r, c in zip(ri, ci) if matrix[r, c] == 0))
        except Exception:
            n_assigned = 0

        if n_assigned == n:
            # Found optimal assignment
            assignments_list = [
                {"row": int(r), "col": int(c), "value": float(matrix[r, c])}
                for r, c in zip(ri, ci) if matrix[r, c] == 0
            ]
            steps.append({
                "step": f"Paso {iteration} — Asignación óptima encontrada",
                "description": f"Se encontraron {n} ceros independientes. El algoritmo termina.",
                "matrix": matrix.tolist(),
                "row_names": agent_names,
                "col_names": task_names,
                "assignments": assignments_list,
                "is_final": True,
            })
            break

        # Find minimum element not covered by lines and adjust
        # Simple heuristic cover: cover rows with most zeros, then remaining cols
        row_zeros = (matrix == 0).sum(axis=1)
        col_zeros = (matrix == 0).sum(axis=0)

        for _ in range(n):
            if (matrix[~row_covered, :][:, ~col_covered] == 0).any():
                # Cover row or col that has most uncovered zeros
                uncovered = matrix.copy()
                uncovered[row_covered, :] = 1
                uncovered[:, col_covered] = 1
                rz = (uncovered == 0).sum(axis=1)
                cz = (uncovered == 0).sum(axis=0)
                if rz.max() >= cz.max():
                    row_covered[rz.argmax()] = True
                else:
                    col_covered[cz.argmax()] = True
            else:
                break

        # Find min uncovered
        uncovered_vals = matrix[~row_covered, :][:, ~col_covered]
        if uncovered_vals.size == 0:
            break
        delta = float(uncovered_vals.min())

        steps.append({
            "step": f"Paso {iteration} — Iteración de cobertura",
            "description": (
                f"Las líneas mínimas no cubren todos los ceros. "
                f"Δ = {delta:.4f} (menor elemento no cubierto). "
                f"Se resta Δ de los no cubiertos y se suma Δ a los doblemente cubiertos."
            ),
            "matrix": matrix.tolist(),
            "row_names": agent_names,
            "col_names": task_names,
            "delta": delta,
            "row_covered": row_covered.tolist(),
            "col_covered": col_covered.tolist(),
        })

        # Apply delta adjustment
        for r in range(n):
            for c in range(n):
                if not row_covered[r] and not col_covered[c]:
                    matrix[r, c] -= delta
                elif row_covered[r] and col_covered[c]:
                    matrix[r, c] += delta

        iteration += 1
        if iteration > 20:  # safety break
            break

    return steps



# ─────────────────────────────────────────────────────────────────────
#  FLUJO MÁXIMO — Ford-Fulkerson / Edmonds-Karp con rutas de aumento
# ─────────────────────────────────────────────────────────────────────

def solve_max_flow(
    edges: List[Dict],
    source: str,
    sink: str,
) -> Dict[str, Any]:
    """
    Edmonds-Karp (BFS) con rutas de aumento explícitas.
    Devuelve el flujo máximo, el flujo por arista y las augmenting paths.
    """
    # Build node list
    nodes = set()
    for e in edges:
        nodes.add(e["source"])
        nodes.add(e["target"])

    # Build capacity graph
    capacity: Dict[str, Dict[str, float]] = {n: {} for n in nodes}
    for e in edges:
        u, v, c = e["source"], e["target"], float(e["capacity"])
        capacity[u][v] = capacity[u].get(v, 0) + c
        if v not in capacity:
            capacity[v] = {}
        if u not in capacity[v]:
            capacity[v][u] = 0

    # Flow graph
    flow: Dict[str, Dict[str, float]] = {u: {v: 0.0 for v in capacity[u]} for u in capacity}

    augmenting_paths: List[Dict[str, Any]] = []
    total_flow = 0.0

    def bfs_path():
        """BFS to find augmenting path from source to sink."""
        parent = {source: None}
        visited = {source}
        queue = [source]
        while queue:
            u = queue.pop(0)
            for v in capacity[u]:
                residual = capacity[u][v] - flow[u].get(v, 0)
                if v not in visited and residual > 0:
                    parent[v] = u
                    visited.add(v)
                    if v == sink:
                        # Reconstruct path
                        path = []
                        node = sink
                        while node != source:
                            prev = parent[node]
                            path.append((prev, node))
                            node = prev
                        path.reverse()
                        return path
                    queue.append(v)
        return None

    # Edmonds-Karp iterations
    while True:
        path = bfs_path()
        if path is None:
            break

        # Calculate bottleneck
        bottleneck = float('inf')
        for u, v in path:
            residual = capacity[u][v] - flow[u].get(v, 0)
            bottleneck = min(bottleneck, residual)

        # Update flows
        for u, v in path:
            flow[u][v] = flow[u].get(v, 0) + bottleneck
            flow[v][u] = flow[v].get(u, 0) - bottleneck

        total_flow += bottleneck

        # Record augmenting path
        path_nodes = [path[0][0]] + [v for _, v in path]
        augmenting_paths.append({
            "path": path_nodes,
            "bottleneck": bottleneck,
            "edges": [{"from": u, "to": v} for u, v in path],
        })

    # Build result edges (only original edges with positive flow)
    original_edges = set()
    for e in edges:
        original_edges.add((e["source"], e["target"]))

    flow_edges = []
    for u, v in original_edges:
        f = flow.get(u, {}).get(v, 0)
        cap = capacity.get(u, {}).get(v, 0)
        flow_edges.append({
            "source": u,
            "target": v,
            "flow": max(0, f),
            "capacity": cap,
            "label": f"{max(0, f):.0f}/{cap:.0f}",
        })

    return {
        "status": "optimal",
        "max_flow": total_flow,
        "flow_on_edges": flow_edges,
        "augmenting_paths": augmenting_paths,
        "error_message": None,
    }


# ─────────────────────────────────────────────────────────────────────
#  FLUJO A COSTO MÍNIMO
# ─────────────────────────────────────────────────────────────────────

def solve_min_cost_flow(
    nodes: List[Dict],
    edges: List[Dict],
) -> Dict[str, Any]:
    """
    Flujo a Costo Mínimo usando NetworkX.
    nodes: [{"id": str, "demand": float}]  (positivo=oferta, negativo=demanda, 0=transbordo)
    edges: [{"source": str, "target": str, "capacity": float, "cost": float, "min_capacity": float (opt)}]
    """
    # Validate balance
    total_balance = sum(n.get("demand", 0) for n in nodes)
    if abs(total_balance) > 1e-6:
        return {
            "status": "error",
            "error_message": f"La suma de ofertas/demandas debe ser 0. Suma actual: {total_balance:.4f}",
        }

    G = nx.DiGraph()

    for n in nodes:
        # NetworkX min_cost_flow: demand > 0 means the node demands flow (sink-like)
        # demand < 0 means the node supplies flow (source-like)
        # We invert: user inputs positive=supply (=negative demand in nx)
        G.add_node(n["id"], demand=-n.get("demand", 0))

    for e in edges:
        G.add_edge(
            e["source"],
            e["target"],
            capacity=float(e.get("capacity", 1e9)),
            weight=float(e.get("cost", 0)),
            lower=float(e.get("min_capacity", 0)),
        )

    try:
        flow_dict = nx.min_cost_flow(G)
    except nx.NetworkXUnfeasible:
        return {
            "status": "infeasible",
            "error_message": "El problema de flujo a costo mínimo no tiene solución factible.",
        }
    except Exception as ex:
        return {"status": "error", "error_message": str(ex)}

    # Calculate total cost and build edge results
    total_cost = 0.0
    flow_edges = []
    for u in flow_dict:
        for v, f in flow_dict[u].items():
            if G.has_edge(u, v):
                cost_per_unit = G[u][v].get("weight", 0)
                cap = G[u][v].get("capacity", 0)
                arc_cost = f * cost_per_unit
                total_cost += arc_cost
                flow_edges.append({
                    "source": u,
                    "target": v,
                    "flow": round(f, 4),
                    "capacity": cap,
                    "cost_per_unit": cost_per_unit,
                    "arc_cost": round(arc_cost, 4),
                    "label": f"{f:.0f}/{cap:.0f} (${arc_cost:.2f})",
                })

    return {
        "status": "optimal",
        "total_cost": round(total_cost, 4),
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
