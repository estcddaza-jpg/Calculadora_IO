import asyncio
from app.models.schemas import LinearProgramRequest
from app.services.simplex_solver import solve_simplex_stepbystep

req = LinearProgramRequest(
    type="MAX",
    objective_function=[3, 5],
    constraints=[
        {"coefficients": [1, 0], "operator": "<=", "rhs": 4.0}
    ],
    variable_names=["x1", "x2"]
)
res = solve_simplex_stepbystep(req.type, req.objective_function, [c.model_dump() for c in req.constraints], req.variable_names)
import json
print(json.dumps(res, indent=2))
