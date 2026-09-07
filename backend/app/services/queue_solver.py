"""
queue_solver.py — Teoría de Colas: M/M/1 y M/M/s
"""
import math
from typing import Dict, Any, List


def solve_queue(
    model: str,
    lam: float,
    mu: float,
    servers: int = 1,
    max_n: int = 20,
) -> Dict[str, Any]:
    """
    Resuelve modelos de colas M/M/1 y M/M/s.

    Parámetros:
        lam: Tasa de llegada (λ)
        mu: Tasa de servicio (μ)
        servers: Número de servidores (s), solo para M/M/s
        max_n: N máximo para calcular Pn

    Retorna métricas: L, Lq, W, Wq, ρ, P0, Pn
    """
    if model == "MM1":
        return _solve_mm1(lam, mu, max_n)
    elif model == "MMs":
        return _solve_mms(lam, mu, servers, max_n)
    else:
        return {"status": "error", "error_message": f"Modelo '{model}' no soportado."}


def _solve_mm1(lam: float, mu: float, max_n: int) -> Dict[str, Any]:
    """M/M/1: Servidor único, llegadas Poisson, servicio exponencial."""
    rho = lam / mu

    if rho >= 1:
        return {
            "status": "error",
            "error_message": (
                f"El sistema M/M/1 es inestable. ρ = {rho:.4f} ≥ 1. "
                "La tasa de llegada debe ser menor a la tasa de servicio."
            ),
        }

    # Métricas de rendimiento
    L = rho / (1 - rho)         # Clientes promedio en el sistema
    Lq = rho**2 / (1 - rho)    # Clientes promedio en cola
    W = 1 / (mu - lam)          # Tiempo promedio en el sistema
    Wq = lam / (mu * (mu - lam))  # Tiempo promedio en cola
    P0 = 1 - rho                 # Probabilidad de sistema vacío

    Pn = [{"n": n, "Pn": round((1 - rho) * rho**n, 6)} for n in range(max_n + 1)]

    return {
        "model": "M/M/1",
        "rho": round(rho, 6),
        "L": round(L, 6),
        "Lq": round(Lq, 6),
        "W": round(W, 6),
        "Wq": round(Wq, 6),
        "P0": round(P0, 6),
        "Pn": Pn,
        "status": "optimal",
        "error_message": None,
    }


def _solve_mms(lam: float, mu: float, s: int, max_n: int) -> Dict[str, Any]:
    """M/M/s: s servidores paralelos, llegadas Poisson, servicio exponencial."""
    rho = lam / (s * mu)  # Factor de utilización por servidor

    if rho >= 1:
        return {
            "status": "error",
            "error_message": (
                f"El sistema M/M/s es inestable. ρ = {rho:.4f} ≥ 1. "
                "Aumente el número de servidores o la tasa de servicio."
            ),
        }

    a = lam / mu  # Intensidad de tráfico

    # Calcular P0
    sum_term = sum((a**n) / math.factorial(n) for n in range(s))
    last_term = (a**s) / (math.factorial(s) * (1 - rho))
    P0 = 1.0 / (sum_term + last_term)

    # Probabilidad de espera (Erlang C)
    Cq = (a**s * P0) / (math.factorial(s) * (1 - rho))

    # Métricas
    Lq = Cq * rho / (1 - rho)
    L = Lq + a
    Wq = Lq / lam
    W = Wq + 1 / mu

    # Pn
    Pn = []
    for n in range(max_n + 1):
        if n < s:
            pn = (a**n / math.factorial(n)) * P0
        else:
            pn = (a**n / (math.factorial(s) * s**(n - s))) * P0
        Pn.append({"n": n, "Pn": round(pn, 6)})

    return {
        "model": f"M/M/{s}",
        "rho": round(rho, 6),
        "L": round(L, 6),
        "Lq": round(Lq, 6),
        "W": round(W, 6),
        "Wq": round(Wq, 6),
        "P0": round(P0, 6),
        "Pn": Pn,
        "status": "optimal",
        "error_message": None,
    }
