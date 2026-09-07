"""
routes_linear.py — Endpoints de Programación Lineal
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    LinearProgramRequest,
    SimplexResponse,
    GraphicalResponse,
    DualResponse,
)
from app.services.simplex_solver import (
    solve_simplex_stepbystep,
    solve_graphical_method,
    generate_dual_model,
)

router = APIRouter()


@router.post("/simplex", response_model=SimplexResponse, summary="Resolver por Método Simplex")
def simplex(request: LinearProgramRequest):
    """
    Resuelve un Problema de Programación Lineal usando el Método Simplex.
    Devuelve cada iteración del tableau para visualización paso a paso.
    """
    try:
        constraints = [c.model_dump() for c in request.constraints]
        result = solve_simplex_stepbystep(
            obj_type=request.type,
            obj_coeffs=request.objective_function,
            constraints=constraints,
            var_names=request.variable_names,
        )
        if result["status"] not in ("optimal",):
            raise HTTPException(status_code=400, detail=result.get("error_message", "Error al resolver"))
        return SimplexResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/graphical", response_model=GraphicalResponse, summary="Resolver por Método Gráfico")
def graphical(request: LinearProgramRequest):
    """
    Resuelve un PL de 2 variables usando el Método Gráfico.
    Devuelve vértices de la región factible y punto óptimo.
    """
    try:
        if len(request.objective_function) != 2:
            raise HTTPException(
                status_code=400,
                detail="El método gráfico solo soporta exactamente 2 variables de decisión.",
            )
        constraints = [c.model_dump() for c in request.constraints]
        result = solve_graphical_method(
            obj_type=request.type,
            obj_coeffs=request.objective_function,
            constraints=constraints,
        )
        if result["status"] not in ("optimal",):
            raise HTTPException(status_code=400, detail=result.get("error_message", "Sin solución"))
        return GraphicalResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/dual", response_model=DualResponse, summary="Generar Modelo Dual")
def dual(request: LinearProgramRequest):
    """
    Genera el modelo Dual a partir del Primal ingresado.
    Aplica las reglas de dualidad estándar y devuelve representación LaTeX.
    """
    try:
        constraints = [c.model_dump() for c in request.constraints]
        result = generate_dual_model(
            obj_type=request.type,
            obj_coeffs=request.objective_function,
            constraints=constraints,
            var_names=request.variable_names,
        )
        return DualResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar dual: {str(e)}")
