"""
routes_advanced.py — Endpoints de Modelos Avanzados (PD, Branch & Bound, NL)
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import KnapsackRequest, KnapsackResponse
from app.services.advanced_solver import solve_knapsack

router = APIRouter()


@router.post("/knapsack", response_model=KnapsackResponse, summary="Programación Dinámica — Mochila")
def knapsack(request: KnapsackRequest):
    try:
        items = [item.model_dump() for item in request.items]
        result = solve_knapsack(items=items, capacity=request.capacity)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return KnapsackResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
