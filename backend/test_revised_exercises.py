import urllib.request
import json
import pprint

ex1 = {
    "type": "MAX",
    "objective_function": [3, 2],
    "constraints": [
        {"coefficients": [1, 1], "operator": "<=", "rhs": 4},
        {"coefficients": [2, 1], "operator": "<=", "rhs": 5}
    ],
    "variable_names": ["x1", "x2"]
}

ex2 = {
    "type": "MIN",
    "objective_function": [2, 2, 4, 2.5],
    "constraints": [
        {"coefficients": [1, 1, 1, 2], "operator": "=", "rhs": 6},
        {"coefficients": [1, 2, 3, 1], "operator": "=", "rhs": 10}
    ],
    "variable_names": ["x1", "x2", "x3", "x4"]
}

for i, payload in enumerate([ex1, ex2]):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/api/linear/revised-simplex", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        print(f"\n--- EXERCISE {i+1} ---")
        result = json.loads(res.read().decode("utf-8"))
        print(f"Status: {result['status']}, Optimal Z: {result['optimal_value']}")
        print(f"Variables: {result['variables']}")
        for t in result["tableaux"]:
            print(f"Iter {t['iteration']}: BV={t['basic_variables']}, Z={t['z_value']}")
            print(f"B^-1 = {t['b_inv']}")
            print(f"pi = {t['pi']}")
            print(f"reduced_costs = {t['reduced_costs']}")
