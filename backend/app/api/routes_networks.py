"""
routes_networks.py — Endpoints de Redes y Proyectos
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    TransportRequest, TransportResponse,
    AssignmentRequest, AssignmentResponse,
    MaxFlowRequest, MaxFlowResponse,
    MSTRequest, MSTResponse,
    CPMRequest, CPMResponse,
    PERTRequest, PERTResponse,
    QueueRequest, QueueResponse,
)
from app.services.network_solver import (
    solve_transport, solve_assignment, solve_max_flow, solve_mst
)
from app.services.pert_cpm_solver import solve_cpm, solve_pert
from app.services.queue_solver import solve_queue

router = APIRouter()


@router.post("/transport", response_model=TransportResponse, summary="Problema de Transporte")
def transport(request: TransportRequest):
    try:
        result = solve_transport(
            method=request.method,
            supply=request.supply,
            demand=request.demand,
            costs=request.costs,
            source_names=request.source_names,
            destination_names=request.destination_names,
        )
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return TransportResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assignment", response_model=AssignmentResponse, summary="Problema de Asignación (Método Húngaro)")
def assignment(request: AssignmentRequest):
    try:
        result = solve_assignment(
            cost_matrix=request.cost_matrix,
            problem_type=request.type,
            agent_names=request.agent_names,
            task_names=request.task_names,
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return AssignmentResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/max-flow", response_model=MaxFlowResponse, summary="Flujo Máximo (Edmonds-Karp)")
def max_flow(request: MaxFlowRequest):
    try:
        edges = [e.model_dump() for e in request.edges]
        result = solve_max_flow(edges=edges, source=request.source, sink=request.sink)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return MaxFlowResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mst", response_model=MSTResponse, summary="Árbol de Mínima Expansión (Prim/Kruskal)")
def mst(request: MSTRequest):
    try:
        edges = [e.model_dump() for e in request.edges]
        result = solve_mst(edges=edges, algorithm=request.algorithm)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return MSTResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cpm", response_model=CPMResponse, summary="Método de Ruta Crítica (CPM)")
def cpm(request: CPMRequest):
    try:
        activities = [a.model_dump() for a in request.activities]
        result = solve_cpm(activities)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return CPMResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pert", response_model=PERTResponse, summary="PERT (3 tiempos + probabilidad)")
def pert(request: PERTRequest):
    try:
        activities = [a.model_dump() for a in request.activities]
        result = solve_pert(activities, target_time=request.target_time)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return PERTResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/queues", response_model=QueueResponse, summary="Teoría de Colas M/M/1 y M/M/s")
def queues(request: QueueRequest):
    try:
        result = solve_queue(
            model=request.model,
            lam=request.lambda_rate,
            mu=request.mu_rate,
            servers=request.servers or 1,
            max_n=request.max_n or 20,
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        return QueueResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
