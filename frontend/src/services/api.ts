import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ─────────────────────────────────────────────
//  Tipos de respuesta
// ─────────────────────────────────────────────

export interface SimplexTableau {
  iteration: number;
  basic_variables: string[];
  variable_names: string[];
  cj: number[];
  zj: number[];
  cj_zj: number[];
  z_value: number;
  tableau: number[][];
  entering_variable: string | null;
  leaving_variable: string | null;
  is_optimal: boolean;
}

export interface SimplexResponse {
  status: string;
  optimal_value: number;
  variables: Record<string, number>;
  tableaux: SimplexTableau[];
  dual_values: Record<string, number>;
  sensitivity: Record<string, unknown>;
}

export interface RevisedSimplexTableau {
  iteration: number;
  basic_variables: string[];
  variable_names: string[];
  b_inv: number[][];
  rhs: number[];
  pi: number[];
  reduced_costs: number[];
  z_value: number;
  entering_variable: string | null;
  leaving_variable: string | null;
  is_optimal: boolean;
}

export interface RevisedSimplexResponse {
  status: string;
  optimal_value: number;
  variables: Record<string, number>;
  tableaux: RevisedSimplexTableau[];
}

export interface GraphicalVertex {
  x: number;
  y: number;
  z?: number;
  is_optimal: boolean;
  z_value: number;
}

export interface GraphicalResponse {
  status: string;
  vertices: GraphicalVertex[];
  faces?: number[][];
  optimal_point?: GraphicalVertex;
  optimal_value: number;
  constraint_lines: Array<{
    id: string;
    label: string;
    x_pts: number[];
    y_pts: number[];
    operator: string;
    rhs: number;
  }>;
  error_message?: string;
}

export interface DualResponse {
  primal_type: string;
  dual_type: string;
  dual_objective: number[];
  dual_constraints: Array<{
    coefficients: number[];
    operator: string;
    rhs: number;
    variable: string;
  }>;
  dual_variable_names: string[];
  latex_representation: string;
}

// ─────────────────────────────────────────────
//  Interfaces de entrada
// ─────────────────────────────────────────────

export interface Constraint {
  coefficients: number[];
  operator: "<=" | ">=" | "=";
  rhs: number;
}

export interface LinearProgramInput {
  type: "MAX" | "MIN";
  objective_function: number[];
  constraints: Constraint[];
  variable_names?: string[];
}

// ─────────────────────────────────────────────
//  API calls — Programación Lineal
// ─────────────────────────────────────────────

export const solveLinearSimplex = async (
  input: LinearProgramInput
): Promise<SimplexResponse> => {
  const { data } = await api.post<SimplexResponse>("/linear/simplex", input);
  return data;
};

export const solveRevisedSimplex = async (
  input: LinearProgramInput
): Promise<RevisedSimplexResponse> => {
  const { data } = await api.post<RevisedSimplexResponse>("/linear/revised-simplex", input);
  return data;
};

export const solveGraphical = async (
  input: LinearProgramInput
): Promise<GraphicalResponse> => {
  const { data } = await api.post<GraphicalResponse>("/linear/graphical", input);
  return data;
};

export const generateDual = async (
  input: LinearProgramInput
): Promise<DualResponse> => {
  const { data } = await api.post<DualResponse>("/linear/dual", input);
  return data;
};

// ─────────────────────────────────────────────
//  API calls — Redes
// ─────────────────────────────────────────────

export const solveTransport = async (payload: unknown) => {
  const { data } = await api.post("/networks/transport", payload);
  return data;
};

export const solveAssignment = async (payload: unknown) => {
  const { data } = await api.post("/networks/assignment", payload);
  return data;
};

export const solveMaxFlow = async (payload: unknown) => {
  const { data } = await api.post("/networks/max-flow", payload);
  return data;
};

export const solveMST = async (payload: unknown) => {
  const { data } = await api.post("/networks/mst", payload);
  return data;
};

export const solveCPM = async (payload: unknown) => {
  const { data } = await api.post("/networks/cpm", payload);
  return data;
};

export const solvePERT = async (payload: unknown) => {
  const { data } = await api.post("/networks/pert", payload);
  return data;
};

export const solveQueues = async (payload: unknown) => {
  const { data } = await api.post("/networks/queues", payload);
  return data;
};

// ─────────────────────────────────────────────
//  API calls — Avanzados
// ─────────────────────────────────────────────

export const solveKnapsack = async (payload: unknown) => {
  const { data } = await api.post("/advanced/knapsack", payload);
  return data;
};

// ─────────────────────────────────────────────
//  Error handler helper
// ─────────────────────────────────────────────

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Error desconocido";
};

export default api;
