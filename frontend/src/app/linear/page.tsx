"use client";
import { useState } from "react";
import KaTeXDisplay from "@/components/math/KaTeXDisplay";
import StepByStepTable from "@/components/ui/StepByStepTable";
import Graph2D from "@/components/visualizations/Graph2D";
import {
  solveLinearSimplex,
  solveGraphical,
  generateDual,
  getErrorMessage,
  type Constraint,
  type LinearProgramInput,
  type SimplexResponse,
  type GraphicalResponse,
  type DualResponse,
} from "@/services/api";

type Tab = "simplex" | "graphical" | "dual";

const OPERATORS = ["<=", ">=", "="] as const;

function buildLatexObjective(
  type: string,
  coeffs: number[],
  names: string[]
): string {
  const terms = coeffs
    .map((c, i) => {
      if (c === 0) return null;
      const sign = c < 0 ? "-" : i > 0 ? "+" : "";
      const abs = Math.abs(c);
      const coef = abs === 1 ? "" : abs;
      return `${sign}${coef}${names[i].replace(/(\d+)/, "_{$1}")}`;
    })
    .filter(Boolean)
    .join(" ");
  return `\\text{${type}} \\quad Z = ${terms}`;
}

function buildLatexConstraint(c: Constraint, names: string[]): string {
  const terms = c.coefficients
    .map((coef, i) => {
      if (coef === 0) return null;
      const sign = coef < 0 ? "-" : i > 0 ? "+" : "";
      const abs = Math.abs(coef);
      const c2 = abs === 1 ? "" : abs;
      return `${sign}${c2}${names[i].replace(/(\d+)/, "_{$1}")}`;
    })
    .filter(Boolean)
    .join(" ");
  const op =
    c.operator === "<=" ? "\\leq" : c.operator === ">=" ? "\\geq" : "=";
  return `${terms} ${op} ${c.rhs}`;
}

export default function LinearPage() {
  const [activeTab, setActiveTab] = useState<Tab>("simplex");
  const [objType, setObjType] = useState<"MAX" | "MIN">("MAX");
  const [numVars, setNumVars] = useState(2);
  const [numConstraints, setNumConstraints] = useState(3);
  const [objCoeffs, setObjCoeffs] = useState<number[]>([3, 5]);
  const [constraints, setConstraints] = useState<Constraint[]>([
    { coefficients: [1, 0], operator: "<=", rhs: 4 },
    { coefficients: [0, 2], operator: "<=", rhs: 12 },
    { coefficients: [3, 2], operator: "<=", rhs: 18 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simplexResult, setSimplexResult] = useState<SimplexResponse | null>(null);
  const [graphResult, setGraphResult] = useState<GraphicalResponse | null>(null);
  const [dualResult, setDualResult] = useState<DualResponse | null>(null);

  const varNames = Array.from({ length: numVars }, (_, i) => `x${i + 1}`);

  // ── Adjust arrays when numVars or numConstraints changes ──
  const updateNumVars = (n: number) => {
    const clamp = Math.max(2, Math.min(8, n));
    setNumVars(clamp);
    setObjCoeffs((prev) => {
      const arr = [...prev];
      while (arr.length < clamp) arr.push(0);
      return arr.slice(0, clamp);
    });
    setConstraints((prev) =>
      prev.map((c) => {
        const cfs = [...c.coefficients];
        while (cfs.length < clamp) cfs.push(0);
        return { ...c, coefficients: cfs.slice(0, clamp) };
      })
    );
  };

  const updateNumConstraints = (n: number) => {
    const clamp = Math.max(1, Math.min(10, n));
    setNumConstraints(clamp);
    setConstraints((prev) => {
      const arr = [...prev];
      while (arr.length < clamp)
        arr.push({ coefficients: new Array(numVars).fill(0), operator: "<=", rhs: 0 });
      return arr.slice(0, clamp);
    });
  };

  const setObjCoeff = (i: number, val: number) => {
    setObjCoeffs((prev) => {
      const arr = [...prev];
      arr[i] = val;
      return arr;
    });
  };

  const setConstraintCoeff = (ci: number, vi: number, val: number) => {
    setConstraints((prev) =>
      prev.map((c, idx) => {
        if (idx !== ci) return c;
        const cfs = [...c.coefficients];
        cfs[vi] = val;
        return { ...c, coefficients: cfs };
      })
    );
  };

  const setConstraintOp = (ci: number, op: typeof OPERATORS[number]) => {
    setConstraints((prev) =>
      prev.map((c, idx) => (idx === ci ? { ...c, operator: op } : c))
    );
  };

  const setConstraintRhs = (ci: number, val: number) => {
    setConstraints((prev) =>
      prev.map((c, idx) => (idx === ci ? { ...c, rhs: val } : c))
    );
  };

  const buildInput = (): LinearProgramInput => ({
    type: objType,
    objective_function: objCoeffs,
    constraints,
    variable_names: varNames,
  });

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    setSimplexResult(null);
    setGraphResult(null);
    setDualResult(null);

    try {
      const input = buildInput();

      if (activeTab === "simplex") {
        const res = await solveLinearSimplex(input);
        setSimplexResult(res);
      } else if (activeTab === "graphical") {
        if (numVars !== 2) {
          setError("El método gráfico requiere exactamente 2 variables. Ajusta el número de variables.");
          return;
        }
        const res = await solveGraphical(input);
        setGraphResult(res);
      } else if (activeTab === "dual") {
        const res = await generateDual(input);
        setDualResult(res);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // LaTeX del modelo
  const latexObj = buildLatexObjective(objType, objCoeffs, varNames);
  const latexConstraints = constraints.map((c) =>
    buildLatexConstraint(c, varNames)
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📐</span>
            <h1 className="text-3xl font-bold text-white">
              Programación Lineal
            </h1>
          </div>
          <p className="text-slate-400">
            Resuelve PL con visualización académica paso a paso: tableau Simplex,
            región factible y dualidad.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit mb-8 border border-white/8">
          {(
            [
              { id: "simplex", label: "Simplex", icon: "∑" },
              { id: "graphical", label: "Método Gráfico", icon: "📊" },
              { id: "dual", label: "Dualidad", icon: "↔" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Panel de entrada ── */}
          <div className="space-y-5">
            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-white mb-4">
                Configuración del Modelo
              </h2>

              {/* Tipo y dimensiones */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Tipo
                  </label>
                  <select
                    value={objType}
                    onChange={(e) => setObjType(e.target.value as "MAX" | "MIN")}
                    className="styled-select"
                    id="obj-type-select"
                  >
                    <option value="MAX">MAX</option>
                    <option value="MIN">MIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Variables
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={numVars}
                    onChange={(e) => updateNumVars(Number(e.target.value))}
                    className="number-input"
                    id="num-vars-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Restricciones
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={numConstraints}
                    onChange={(e) => updateNumConstraints(Number(e.target.value))}
                    className="number-input"
                    id="num-constraints-input"
                  />
                </div>
              </div>

              {/* Función objetivo */}
              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-2">
                  Coeficientes de la Función Objetivo
                </label>
                <div className="flex gap-2 flex-wrap">
                  {varNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={objCoeffs[i] ?? 0}
                        onChange={(e) => setObjCoeff(i, Number(e.target.value))}
                        className="number-input w-20"
                        id={`obj-coeff-${i}`}
                        placeholder="0"
                      />
                      <span className="text-slate-400 text-sm">
                        {name.replace(/(\d+)/, "₍$1₎")}
                      </span>
                      {i < numVars - 1 && (
                        <span className="text-slate-500">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Restricciones */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">
                  Restricciones
                </label>
                <div className="space-y-2">
                  {constraints.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 text-xs w-6">R{ci + 1}</span>
                      {varNames.map((name, vi) => (
                        <div key={vi} className="flex items-center gap-1">
                          <input
                            type="number"
                            value={c.coefficients[vi] ?? 0}
                            onChange={(e) =>
                              setConstraintCoeff(ci, vi, Number(e.target.value))
                            }
                            className="number-input w-16"
                            id={`c${ci}-v${vi}`}
                            placeholder="0"
                          />
                          <span className="text-slate-500 text-xs">
                            {name.replace(/(\d+)/, "₍$1₎")}
                          </span>
                          {vi < numVars - 1 && (
                            <span className="text-slate-600 text-xs">+</span>
                          )}
                        </div>
                      ))}
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          setConstraintOp(ci, e.target.value as typeof OPERATORS[number])
                        }
                        className="styled-select w-20 text-center"
                        id={`op-${ci}`}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={c.rhs}
                        onChange={(e) =>
                          setConstraintRhs(ci, Number(e.target.value))
                        }
                        className="number-input w-20"
                        id={`rhs-${ci}`}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vista previa del modelo en LaTeX */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Vista Previa del Modelo
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <KaTeXDisplay
                    latex={latexObj}
                    className="text-blue-300"
                  />
                </div>
                <div className="text-slate-500 text-xs mb-1">s.a.:</div>
                {latexConstraints.map((lx, i) => (
                  <div key={i} className="pl-4">
                    <KaTeXDisplay latex={lx} className="text-slate-300" />
                  </div>
                ))}
                <div className="pl-4">
                  <KaTeXDisplay
                    latex={varNames
                      .map((n) => n.replace(/(\d+)/, "_{$1}"))
                      .join(", ") + " \\geq 0"}
                    className="text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Botón resolver */}
            <button
              onClick={handleSolve}
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
              id="solve-button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-5 h-5"></span>
                  Resolviendo...
                </span>
              ) : (
                `⚡ Resolver con ${
                  activeTab === "simplex"
                    ? "Simplex"
                    : activeTab === "graphical"
                    ? "Método Gráfico"
                    : "Dualidad"
                }`
              )}
            </button>
          </div>

          {/* ── Panel de resultados ── */}
          <div className="space-y-5">
            {error && (
              <div className="alert-error">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-rose-300 mb-1">Error al resolver</p>
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              </div>
            )}

            {/* Resultado Simplex */}
            {simplexResult && activeTab === "simplex" && (
              <div className="glass-card p-5">
                <StepByStepTable
                  tableaux={simplexResult.tableaux}
                  optimalValue={simplexResult.optimal_value}
                  variables={simplexResult.variables}
                />

                {/* Precios sombra */}
                {simplexResult.dual_values &&
                  Object.keys(simplexResult.dual_values).length > 0 && (
                    <div className="mt-6 border-t border-white/8 pt-5">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">
                        💰 Precios Sombra (Valores Duales)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(simplexResult.dual_values).map(
                          ([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center bg-white/3 rounded-lg px-3 py-2 border border-white/6"
                            >
                              <span className="text-slate-400 text-sm">{key}</span>
                              <KaTeXDisplay
                                latex={String(val)}
                                className="text-violet-300 font-mono font-semibold"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Resultado Gráfico */}
            {graphResult && activeTab === "graphical" && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">
                    Región Factible
                  </h3>
                  <div className="alert-success py-1.5 px-3 text-sm">
                    Z* ={" "}
                    <strong className="text-teal-300">
                      {graphResult.optimal_value?.toFixed(4)}
                    </strong>
                    {" en "}(
                    {graphResult.optimal_point?.x.toFixed(3)},{" "}
                    {graphResult.optimal_point?.y.toFixed(3)})
                  </div>
                </div>
                <Graph2D result={graphResult} objCoeffs={objCoeffs} />
              </div>
            )}

            {/* Resultado Dual */}
            {dualResult && activeTab === "dual" && (
              <div className="glass-card p-5 space-y-5">
                <h3 className="font-semibold text-white">
                  Modelo Dual Generado
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <span className="badge badge-optimal">
                      PRIMAL: {dualResult.primal_type}
                    </span>
                    <span>→</span>
                    <span className="badge badge-critical">
                      DUAL: {dualResult.dual_type}
                    </span>
                  </div>

                  <div className="bg-white/3 rounded-xl p-4 border border-white/6 overflow-x-auto">
                    <KaTeXDisplay
                      latex={dualResult.latex_representation
                        .split("\\\\")
                        .join(" \\\\ ")}
                      displayMode={true}
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-3">
                      Restricciones del modelo dual:
                    </p>
                    {dualResult.dual_constraints.map((dc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-white/6 text-sm"
                      >
                        <span className="text-slate-400">
                          Para {dc.variable.replace(/(\d+)/, "₍$1₎")}:
                        </span>
                        <KaTeXDisplay
                          latex={`${dc.coefficients
                            .map(
                              (c, j) =>
                                `${c}y_{${j + 1}}`
                            )
                            .join(" + ")} ${
                            dc.operator === "<="
                              ? "\\leq"
                              : dc.operator === ">="
                              ? "\\geq"
                              : "="
                          } ${dc.rhs}`}
                          className="text-violet-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Estado inicial */}
            {!simplexResult && !graphResult && !dualResult && !error && !loading && (
              <div className="glass-card p-10 text-center">
                <div className="text-5xl mb-4">🧮</div>
                <p className="text-slate-400 text-lg mb-2">
                  Configura tu modelo y presiona Resolver
                </p>
                <p className="text-slate-600 text-sm">
                  Los resultados aparecerán aquí con visualización paso a paso
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
