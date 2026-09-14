import pytest
from app.services.network_solver import solve_transport, solve_assignment, solve_max_flow, solve_mst
from app.services.pert_cpm_solver import solve_cpm

def test_solve_transport():
    supply = [20, 30]
    demand = [10, 15, 25]
    costs = [
        [2, 3, 1],
        [5, 4, 8]
    ]
    res = solve_transport(method="northwest", supply=supply, demand=demand, costs=costs)
    if res["status"] == "error":
        print(f"ERROR transport: {res.get('error_message')}")
    assert res["status"] == "optimal"

def test_solve_cpm():
    activities = [
        {"id": "A", "name": "A", "duration": 3, "predecessors": []},
        {"id": "B", "name": "B", "duration": 4, "predecessors": ["A"]},
        {"id": "C", "name": "C", "duration": 2, "predecessors": ["A"]},
        {"id": "D", "name": "D", "duration": 5, "predecessors": ["B", "C"]},
    ]
    res = solve_cpm(activities)
    print(res)
    assert res["status"] == "optimal"
