"""
pert_cpm_solver.py — Gestión de Proyectos: CPM y PERT con NetworkX
"""
from typing import List, Dict, Any, Optional
import networkx as nx
import math
from scipy.stats import norm


def solve_cpm(activities: List[Dict]) -> Dict[str, Any]:
    """
    CPM: Calcula ES, EF, LS, LF, Holgura y Ruta Crítica.
    """
    G = nx.DiGraph()

    # Agregar nodos y aristas
    for act in activities:
        G.add_node(act["id"], name=act["name"], duration=act["duration"])
        for pred in act.get("predecessors", []):
            G.add_edge(pred, act["id"], label=act["name"])

    if not nx.is_directed_acyclic_graph(G):
        return {
            "status": "error",
            "error_message": "El grafo contiene ciclos. Las actividades deben formar un DAG.",
        }

    # Ordenamiento topológico
    topo_order = list(nx.topological_sort(G))

    # Paso hacia adelante: ES y EF
    ES = {node: 0.0 for node in G.nodes()}
    EF = {}

    for node in topo_order:
        duration = G.nodes[node].get("duration", 0.0)
        # ES = máximo EF de predecesores
        predecessors = list(G.predecessors(node))
        if predecessors:
            ES[node] = max(EF[pred] for pred in predecessors)
        EF[node] = ES[node] + duration

    project_duration = max(EF.values())

    # Paso hacia atrás: LS y LF
    LF = {node: project_duration for node in G.nodes()}
    LS = {}

    for node in reversed(topo_order):
        duration = G.nodes[node].get("duration", 0.0)
        successors = list(G.successors(node))
        if successors:
            LF[node] = min(LS[succ] for succ in successors)
        LS[node] = LF[node] - duration

    # Holgura y ruta crítica
    slack = {node: round(LS[node] - ES[node], 4) for node in G.nodes()}
    critical_nodes = [node for node in G.nodes() if abs(slack[node]) < 1e-6]

    # Construir actividades resultado
    act_map = {a["id"]: a for a in activities}
    results = []
    for node in topo_order:
        act = act_map.get(node, {})
        results.append({
            "id": node,
            "name": act.get("name", node),
            "duration": G.nodes[node].get("duration", 0.0),
            "ES": round(ES[node], 4),
            "EF": round(EF[node], 4),
            "LS": round(LS[node], 4),
            "LF": round(LF[node], 4),
            "slack": slack[node],
            "is_critical": abs(slack[node]) < 1e-6,
        })

    # Aristas para visualización
    edges = []
    for u, v, data in G.edges(data=True):
        is_crit = u in critical_nodes and v in critical_nodes
        edges.append({
            "source": u,
            "target": v,
            "label": data.get("label", ""),
            "is_critical": is_crit,
        })

    # Ruta crítica como secuencia de nodos
    critical_path = _extract_critical_path(G, critical_nodes, topo_order)

    return {
        "status": "optimal",
        "critical_path": critical_path,
        "project_duration": round(project_duration, 4),
        "activities": results,
        "edges": edges,
        "error_message": None,
    }


def _extract_critical_path(G, critical_nodes, topo_order):
    """Extrae la secuencia de nodos en la ruta crítica."""
    critical_set = set(critical_nodes)
    path = []
    for node in topo_order:
        if node in critical_set:
            path.append(node)
    return path


def solve_pert(activities: List[Dict], target_time: Optional[float] = None) -> Dict[str, Any]:
    """
    PERT: 3 tiempos (to, tm, tp) → te, varianza, ruta crítica, probabilidad.
    """
    G = nx.DiGraph()

    for act in activities:
        to = act["optimistic"]
        tm = act["most_likely"]
        tp = act["pessimistic"]
        te = (to + 4 * tm + tp) / 6
        variance = ((tp - to) / 6) ** 2

        G.add_node(
            act["id"],
            name=act["name"],
            duration=te,
            optimistic=to,
            most_likely=tm,
            pessimistic=tp,
            expected_time=te,
            variance=variance,
        )
        for pred in act.get("predecessors", []):
            G.add_edge(pred, act["id"])

    if not nx.is_directed_acyclic_graph(G):
        return {
            "status": "error",
            "error_message": "El grafo contiene ciclos.",
        }

    topo_order = list(nx.topological_sort(G))

    # Paso hacia adelante
    ES = {node: 0.0 for node in G.nodes()}
    EF = {}
    for node in topo_order:
        te = G.nodes[node]["duration"]
        predecessors = list(G.predecessors(node))
        if predecessors:
            ES[node] = max(EF[pred] for pred in predecessors)
        EF[node] = ES[node] + te

    expected_duration = max(EF.values())

    # Paso hacia atrás
    LF = {node: expected_duration for node in G.nodes()}
    LS = {}
    for node in reversed(topo_order):
        te = G.nodes[node]["duration"]
        successors = list(G.successors(node))
        if successors:
            LF[node] = min(LS[succ] for succ in successors)
        LS[node] = LF[node] - te

    slack = {node: round(LS[node] - ES[node], 4) for node in G.nodes()}
    critical_nodes = [node for node in G.nodes() if abs(slack[node]) < 1e-6]

    # Varianza del proyecto (suma de varianzas de la ruta crítica)
    project_variance = sum(
        G.nodes[node]["variance"] for node in critical_nodes
    )
    project_std_dev = math.sqrt(project_variance)

    # Probabilidad de terminar en target_time
    probability_data = None
    if target_time is not None and project_std_dev > 0:
        z = (target_time - expected_duration) / project_std_dev
        prob = float(norm.cdf(z))
        probability_data = {
            "target_time": target_time,
            "Z_score": round(z, 4),
            "probability": round(prob, 4),
            "probability_pct": round(prob * 100, 2),
        }

    # Resultados por actividad
    act_map = {a["id"]: a for a in activities}
    results = []
    for node in topo_order:
        nd = G.nodes[node]
        results.append({
            "id": node,
            "name": nd["name"],
            "duration": round(nd["expected_time"], 4),
            "ES": round(ES[node], 4),
            "EF": round(EF[node], 4),
            "LS": round(LS[node], 4),
            "LF": round(LF[node], 4),
            "slack": slack[node],
            "is_critical": abs(slack[node]) < 1e-6,
            "expected_time": round(nd["expected_time"], 4),
            "variance": round(nd["variance"], 6),
        })

    edges = []
    for u, v in G.edges():
        is_crit = u in critical_nodes and v in critical_nodes
        edges.append({"source": u, "target": v, "label": "", "is_critical": is_crit})

    critical_path = _extract_critical_path(G, critical_nodes, topo_order)

    return {
        "status": "optimal",
        "critical_path": critical_path,
        "expected_duration": round(expected_duration, 4),
        "project_variance": round(project_variance, 6),
        "project_std_dev": round(project_std_dev, 6),
        "activities": results,
        "edges": edges,
        "probability_data": probability_data,
        "error_message": None,
    }
