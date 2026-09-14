import urllib.request
import json

problem = {
    "type": "MAX",
    "objective_function": [3, 5],
    "constraints": [
        {"coefficients": [1, 0], "operator": "<=", "rhs": 4},
        {"coefficients": [0, 2], "operator": "<=", "rhs": 12},
        {"coefficients": [3, 2], "operator": "<=", "rhs": 18}
    ],
    "variable_names": ["x1", "x2"]
}

data = json.dumps(problem).encode("utf-8")
req = urllib.request.Request("http://localhost:8000/api/linear/graphical", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as res:
    print(res.read().decode("utf-8"))
