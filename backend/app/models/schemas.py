from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any


# ─────────────────────────────────────────────
#  Programación Lineal
# ─────────────────────────────────────────────

class Constraint(BaseModel):
    coefficients: List[float] = Field(..., description="Coeficientes de la restricción")
    operator: Literal["<=", ">=", "="] = Field(..., description="Operador de la restricción")
    rhs: float = Field(..., description="Lado derecho de la restricción")


class LinearProgramRequest(BaseModel):
    type: Literal["MAX", "MIN"] = Field(..., description="Tipo de optimización")
    objective_function: List[float] = Field(..., description="Coeficientes de la función objetivo")
    constraints: List[Constraint] = Field(..., description="Lista de restricciones")
    variable_names: Optional[List[str]] = Field(None, description="Nombres de variables (ej: x1, x2)")


class SimplexTableau(BaseModel):
    iteration: int
    basic_variables: List[str]
    variable_names: List[str]
    cj: List[float]
    cb: Optional[List[float]] = None
    zj: List[float]
    cj_zj: List[float]
    z_value: float
    tableau: List[List[float]]
    entering_variable: Optional[str] = None
    leaving_variable: Optional[str] = None
    is_optimal: bool = False


class SimplexResponse(BaseModel):
    status: str
    optimal_value: Optional[float] = None
    variables: Optional[Dict[str, float]] = None
    tableaux: Optional[List[SimplexTableau]] = None
    dual_values: Optional[Dict[str, float]] = None
    sensitivity: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class RevisedSimplexTableau(BaseModel):
    iteration: int
    basic_variables: List[str]
    variable_names: List[str]
    b_inv: List[List[float]]
    rhs: List[float]
    pi: List[float]
    reduced_costs: List[float]
    entering_variable: Optional[str] = None
    leaving_variable: Optional[str] = None
    is_optimal: bool = False
    z_value: float


class RevisedSimplexResponse(BaseModel):
    status: str
    optimal_value: Optional[float] = None
    variables: Optional[Dict[str, float]] = None
    tableaux: Optional[List[RevisedSimplexTableau]] = None
    error_message: Optional[str] = None



class GraphicalVertex(BaseModel):
    x: float
    y: float
    z: Optional[float] = None
    is_optimal: bool = False
    z_value: Optional[float] = None


class GraphicalResponse(BaseModel):
    status: str
    vertices: List[GraphicalVertex]
    faces: Optional[List[List[int]]] = None
    optimal_point: Optional[GraphicalVertex] = None
    optimal_value: Optional[float] = None
    constraint_lines: List[Dict[str, Any]]
    error_message: Optional[str] = None


class DualResponse(BaseModel):
    primal_type: str
    dual_type: str
    dual_objective: List[float]
    dual_constraints: List[Dict[str, Any]]
    dual_variable_names: List[str]
    latex_representation: str


# ─────────────────────────────────────────────
#  Teoría de Colas
# ─────────────────────────────────────────────

class QueueRequest(BaseModel):
    model: Literal["MM1", "MMs"] = Field(..., description="Modelo de colas")
    lambda_rate: float = Field(..., gt=0, description="Tasa de llegada λ")
    mu_rate: float = Field(..., gt=0, description="Tasa de servicio μ")
    servers: Optional[int] = Field(1, ge=1, description="Número de servidores (s)")
    max_n: Optional[int] = Field(20, ge=1, description="N máximo para calcular Pn")


class QueueResponse(BaseModel):
    model: str
    rho: float
    L: float
    Lq: float
    W: float
    Wq: float
    P0: float
    Pn: List[Dict[str, float]]
    status: str
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Redes — Transporte
# ─────────────────────────────────────────────

class TransportRequest(BaseModel):
    method: Literal["northwest", "min_cost", "vogel"] = Field(..., description="Método de solución inicial")
    supply: List[float] = Field(..., description="Oferta de cada fuente")
    demand: List[float] = Field(..., description="Demanda de cada destino")
    costs: List[List[float]] = Field(..., description="Matriz de costos")
    source_names: Optional[List[str]] = None
    destination_names: Optional[List[str]] = None


class TransportStep(BaseModel):
    description: str
    allocation_matrix: List[List[Optional[float]]]
    cost: Optional[float] = None


class TransportResponse(BaseModel):
    status: str
    method: str
    total_cost: Optional[float] = None
    allocation: Optional[List[List[Optional[float]]]] = None
    steps: Optional[List[TransportStep]] = None
    is_balanced: bool = True
    dummy_added: Optional[str] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Redes — CPM / PERT
# ─────────────────────────────────────────────

class CPMActivity(BaseModel):
    id: str
    name: str
    duration: float
    predecessors: List[str] = []


class PERTActivity(BaseModel):
    id: str
    name: str
    optimistic: float       # to
    most_likely: float      # tm
    pessimistic: float      # tp
    predecessors: List[str] = []


class ActivityResult(BaseModel):
    id: str
    name: str
    duration: float
    ES: float
    EF: float
    LS: float
    LF: float
    slack: float
    is_critical: bool
    # PERT extras
    expected_time: Optional[float] = None
    variance: Optional[float] = None


class NetworkEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    is_critical: bool = False


class CPMResponse(BaseModel):
    status: str
    critical_path: List[str]
    project_duration: float
    activities: List[ActivityResult]
    edges: List[NetworkEdge]
    error_message: Optional[str] = None


class PERTResponse(BaseModel):
    status: str
    critical_path: List[str]
    expected_duration: float
    project_variance: float
    project_std_dev: float
    activities: List[ActivityResult]
    edges: List[NetworkEdge]
    probability_data: Optional[Dict[str, float]] = None
    error_message: Optional[str] = None


class PERTRequest(BaseModel):
    activities: List[PERTActivity]
    target_time: Optional[float] = Field(None, description="Tiempo objetivo para calcular probabilidad")


class CPMRequest(BaseModel):
    activities: List[CPMActivity]


# ─────────────────────────────────────────────
#  Flujo Máximo
# ─────────────────────────────────────────────

class FlowEdge(BaseModel):
    source: str
    target: str
    capacity: float


class MaxFlowRequest(BaseModel):
    edges: List[FlowEdge]
    source: str
    sink: str


class MaxFlowResponse(BaseModel):
    status: str
    max_flow: Optional[float] = None
    flow_on_edges: Optional[List[Dict[str, Any]]] = None
    augmenting_paths: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Árbol de Mínima Expansión
# ─────────────────────────────────────────────

class MSTEdge(BaseModel):
    source: str
    target: str
    weight: float


class MSTRequest(BaseModel):
    edges: List[MSTEdge]
    algorithm: Literal["prim", "kruskal"] = "kruskal"


class MSTResponse(BaseModel):
    status: str
    algorithm: str
    total_weight: Optional[float] = None
    mst_edges: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Programación Dinámica — Mochila
# ─────────────────────────────────────────────

class KnapsackItem(BaseModel):
    name: str
    weight: float
    value: float


class KnapsackRequest(BaseModel):
    items: List[KnapsackItem]
    capacity: float


class KnapsackResponse(BaseModel):
    status: str
    optimal_value: Optional[float] = None
    selected_items: Optional[List[str]] = None
    dp_table: Optional[List[List[float]]] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Problema de Asignación (Húngaro)
# ─────────────────────────────────────────────

class AssignmentRequest(BaseModel):
    cost_matrix: List[List[float]]
    type: Literal["MIN", "MAX"] = "MIN"
    agent_names: Optional[List[str]] = None
    task_names: Optional[List[str]] = None


class AssignmentResponse(BaseModel):
    status: str
    total_cost: Optional[float] = None
    assignments: Optional[List[Dict[str, Any]]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Flujo a Costo Mínimo
# ─────────────────────────────────────────────

class MinCostFlowNode(BaseModel):
    id: str
    demand: float = 0.0  # positive=supply, negative=demand, 0=transshipment


class MinCostFlowEdge(BaseModel):
    source: str
    target: str
    capacity: float
    cost: float
    min_capacity: Optional[float] = 0.0


class MinCostFlowRequest(BaseModel):
    nodes: List[MinCostFlowNode]
    edges: List[MinCostFlowEdge]


class MinCostFlowResponse(BaseModel):
    status: str
    total_cost: Optional[float] = None
    flow_on_edges: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None


# ─────────────────────────────────────────────
#  Kuhn-Munkres (endpoint dedicado para pasos)
# ─────────────────────────────────────────────

class KuhnMunkresRequest(BaseModel):
    cost_matrix: List[List[float]]
    type: Literal["MIN", "MAX"] = "MIN"
    agent_names: Optional[List[str]] = None
    task_names: Optional[List[str]] = None


class KuhnMunkresResponse(BaseModel):
    status: str
    total_cost: Optional[float] = None
    assignments: Optional[List[Dict[str, Any]]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None
