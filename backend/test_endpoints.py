import json
import urllib.request
import urllib.error

problems = [
    {
        "type": "MAX",
        "objective_function": [3, 2],
        "constraints": [
            {"coefficients": [2, 1], "operator": "<=", "rhs": 18},
            {"coefficients": [2, 3], "operator": "<=", "rhs": 42},
            {"coefficients": [3, 1], "operator": "<=", "rhs": 24}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MIN",
        "objective_function": [4, 5],
        "constraints": [
            {"coefficients": [1, 2], "operator": ">=", "rhs": 10},
            {"coefficients": [3, 1], "operator": ">=", "rhs": 15}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX",
        "objective_function": [2, 3],
        "constraints": [
            {"coefficients": [1, 1], "operator": "<=", "rhs": 10},
            {"coefficients": [1, 2], "operator": ">=", "rhs": 6}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX",
        "objective_function": [5, 4],
        "constraints": [
            {"coefficients": [6, 4], "operator": "=", "rhs": 24},
            {"coefficients": [1, 2], "operator": "<=", "rhs": 6}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX", # Infeasible
        "objective_function": [1, 1],
        "constraints": [
            {"coefficients": [1, 1], "operator": "<=", "rhs": 2},
            {"coefficients": [1, 1], "operator": ">=", "rhs": 4}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX", # Unbounded
        "objective_function": [2, 1],
        "constraints": [
            {"coefficients": [1, -1], "operator": "<=", "rhs": 10},
            {"coefficients": [2, -1], "operator": "<=", "rhs": 40}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX",
        "objective_function": [4, 6],
        "constraints": [
            {"coefficients": [2, 3], "operator": "<=", "rhs": 12},
            {"coefficients": [1, 1], "operator": "<=", "rhs": 5}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX",
        "objective_function": [3, 9],
        "constraints": [
            {"coefficients": [1, 4], "operator": "<=", "rhs": 8},
            {"coefficients": [1, 2], "operator": "<=", "rhs": 4}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MIN", # Infeasible / equality
        "objective_function": [2, 2],
        "constraints": [
            {"coefficients": [1, 1], "operator": "=", "rhs": 5},
            {"coefficients": [2, 1], "operator": "=", "rhs": 8}
        ],
        "variable_names": ["x1", "x2"]
    },
    {
        "type": "MAX",
        "objective_function": [10, 20],
        "constraints": [
            {"coefficients": [5, 5], "operator": "<=", "rhs": 1000},
            {"coefficients": [2, 8], "operator": "<=", "rhs": 1200}
        ],
        "variable_names": ["x1", "x2"]
    }
]

endpoints = [
    "http://localhost:8000/api/linear/simplex",
    "http://localhost:8000/api/linear/revised-simplex",
    "http://localhost:8000/api/linear/graphical",
    "http://localhost:8000/api/linear/dual"
]

results = {ep: {"success": 0, "fail": 0} for ep in endpoints}

for idx, p in enumerate(problems, 1):
    data = json.dumps(p).encode("utf-8")
    for ep in endpoints:
        req = urllib.request.Request(ep, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as res:
                if res.status == 200:
                    results[ep]["success"] += 1
                else:
                    print(f"Error {ep} Problem {idx}: {res.status}")
                    results[ep]["fail"] += 1
        except urllib.error.HTTPError as e:
            if e.code == 400:
                results[ep]["success"] += 1
            else:
                print(f"Error {ep} Problem {idx}: HTTP {e.code}")
                results[ep]["fail"] += 1
        except Exception as e:
            print(f"Exception {ep} Problem {idx}: {e}")
            results[ep]["fail"] += 1

print("\n=== RESULTADOS DEL TEST ===")
for ep, stats in results.items():
    name = ep.split('/')[-1].upper()
    print(f"[{name}] -> {stats['success']} pasaron en VERDE | {stats['fail']} fallaron")
