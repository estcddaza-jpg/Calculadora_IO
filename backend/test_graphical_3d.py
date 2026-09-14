import urllib.request
import json

problem = {
    "type": "MAX",
    "objective_function": [3, 2, 5],
    "constraints": [
        {"coefficients": [1, 2, 1], "operator": "<=", "rhs": 430},
        {"coefficients": [3, 0, 2], "operator": "<=", "rhs": 460},
        {"coefficients": [1, 4, 0], "operator": "<=", "rhs": 420}
    ],
    "variable_names": ["x1", "x2", "x3"]
}

data = json.dumps(problem).encode("utf-8")
req = urllib.request.Request("http://localhost:8000/api/linear/graphical", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as res:
    print(res.read().decode("utf-8"))
