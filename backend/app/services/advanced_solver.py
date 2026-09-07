"""
advanced_solver.py — Programación Dinámica: Mochila 0/1
"""
from typing import List, Dict, Any


def solve_knapsack(items: List[Dict], capacity: float) -> Dict[str, Any]:
    """
    Problema de la Mochila 0/1 con Programación Dinámica.
    Capacidad convertida a entero (x10 si hay decimales).
    """
    # Escalar si hay decimales en pesos o capacidad
    scale = 1
    all_weights = [item["weight"] for item in items] + [capacity]
    if any(w != int(w) for w in all_weights):
        scale = 10

    W = int(capacity * scale)
    weights = [int(item["weight"] * scale) for item in items]
    values = [item["value"] for item in items]
    names = [item["name"] for item in items]
    n = len(items)

    # Tabla DP
    dp = [[0.0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(W + 1):
            # No incluir ítem i
            dp[i][w] = dp[i - 1][w]
            # Incluir ítem i si cabe
            if weights[i - 1] <= w:
                include_val = dp[i - 1][w - weights[i - 1]] + values[i - 1]
                if include_val > dp[i][w]:
                    dp[i][w] = include_val

    optimal_value = dp[n][W]

    # Trazar selección de ítems
    selected = []
    w = W
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected.append(names[i - 1])
            w -= weights[i - 1]
    selected.reverse()

    # Simplificar tabla DP para envío (solo primeras 11 columnas si es grande)
    dp_display = []
    step = max(1, W // 10)
    cols = list(range(0, W + 1, step))
    for row in dp:
        dp_display.append([row[c] for c in cols])

    return {
        "status": "optimal",
        "optimal_value": optimal_value,
        "selected_items": selected,
        "dp_table": dp_display,
        "error_message": None,
    }
