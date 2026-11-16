"use client";
import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { SimplexResponse, GraphicalResponse, DualResponse, RevisedSimplexResponse } from "@/services/api";
import Graph2D from "../visualizations/Graph2D";
import Graph3D from "../visualizations/Graph3D";
import { formatNumber } from "@/utils/format";

// ─────────────────────────────────────────────────────────────────────────────
//  Tiny KaTeX inline renderer
// ─────────────────────────────────────────────────────────────────────────────
function KTex({ src }: { src: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(src, ref.current, { throwOnError: false, output: "html" });
    } catch {
      if (ref.current) ref.current.textContent = src;
    }
  }, [src]);
  return <span ref={ref} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Simplex Results
// ─────────────────────────────────────────────────────────────────────────────
function SimplexResults({ data }: { data: SimplexResponse }) {
  const isOptimal = data.status === "optimal";
  const numIterations = data.tableaux ? data.tableaux.length : 0;

  return (
    <div className="results-block">
      {/* Optimal Solution Highlight Card */}
      <div className="results-header">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`results-badge ${isOptimal ? "badge-optimal" : "badge-error"}`}>
              {isOptimal ? "✓ OPTIMAL" : data.status.toUpperCase()}
            </span>
            {numIterations > 0 && (
              <span className="text-xs text-zinc-400 font-mono">
                {numIterations} {numIterations === 1 ? "iteración" : "iteraciones"}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mt-1">Solución Óptima</h3>
        </div>

        <div className="flex flex-col sm:items-end justify-center px-4 py-2 rounded-lg bg-[#09090B] border border-zinc-800">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Valor Objetivo</span>
          <span className="results-zval">
            Z* = <strong>{data.status === "unbounded" ? "∞" : data.status === "infeasible" ? "-" : formatNumber(data.optimal_value)}</strong>
          </span>
        </div>
      </div>

      {/* Variables */}
      <div>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Variables del Modelo
        </span>
        <div className="results-vars">
          {Object.entries(data.variables || {}).map(([k, v]) => (
            <div key={k} className="results-var-chip">
              <KTex src={k.replace(/x(\d+)/, "x_{$1}").replace(/y(\d+)/, "y_{$1}")} />
              <span className="results-var-eq">=</span>
              <strong>{formatNumber(v)}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau iterations */}
      {data.tableaux && data.tableaux.length > 0 && (
        <div className="tableaux-wrapper mt-2">
          <div className="flex items-center justify-between">
            <h3 className="tableaux-title">Iteraciones del Simplex</h3>
            <span className="text-xs text-zinc-400 font-mono">
              Todas las Cj - Zj ≤ 0
            </span>
          </div>

          {data.tableaux.map((t, ti) => (
            <div key={ti} className="tableau-card">
              <div className="tableau-caption">
                <span className="font-semibold text-zinc-300">Iteración {t.iteration}</span>
                <span className="text-zinc-500 font-mono">·</span>
                <span className="font-mono text-zinc-400">Z = {formatNumber(t.z_value)}</span>
                {t.is_optimal && <span className="tableau-optimal-tag ml-auto">✓ Óptimo</span>}
              </div>
              <div className="tableau-scroll">
                <table className="simplex-table">
                  <thead>
                    <tr>
                      <th>Base</th>
                      <th>CB</th>
                      {t.variable_names.map((v) => <th key={v}>{v}</th>)}
                      <th>b</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.tableau.map((row, ri) => {
                      const bv = t.basic_variables[ri] ?? "";
                      return (
                        <tr key={ri}>
                          <td className="basic-var-col">{bv}</td>
                          <td className="font-semibold text-indigo-400 font-mono">{formatNumber(t.cb?.[ri] ?? t.cj?.[ri])}</td>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={
                                bv === t.leaving_variable &&
                                t.variable_names[ci] === t.entering_variable
                                  ? "pivot-cell"
                                  : ""
                              }
                            >
                              {formatNumber(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {/* Cj - Zj row */}
                    <tr className="cj-zj-row">
                      <td colSpan={2} className="cj-zj-label">Cj−Zj</td>
                      {t.cj_zj?.map((v, ci) => (
                        <td key={ci} className={v > 0 ? "text-amber-400 font-bold" : "text-zinc-400"}>
                          {formatNumber(v)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Dual Results
// ─────────────────────────────────────────────────────────────────────────────
function DualResults({ data }: { data: DualResponse }) {
  return (
    <div className="results-block">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Modelo Dual</h3>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
            PRIMAL: {data.primal_type}
          </span>
          <span className="text-zinc-500">→</span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            DUAL: {data.dual_type}
          </span>
        </div>
      </div>

      <div className="dual-latex-box">
        <KTex src={data.latex_representation} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Graphical Results (vertices list)
// ─────────────────────────────────────────────────────────────────────────────
function GraphicalResults({ data }: { data: GraphicalResponse }) {
  const isInherently3D = data.vertices.length > 0 && data.vertices[0].z !== undefined;
  const [view3D, setView3D] = useState(isInherently3D);
  
  const renderData = (view3D && !isInherently3D) 
    ? { ...data, vertices: data.vertices.map(v => ({ ...v, z: 0 })) }
    : data;

  return (
    <div className="results-block">
      <div className="results-header">
        <div className="flex items-center gap-3">
          <span className={`results-badge ${data.status === "optimal" ? "badge-optimal" : "badge-error"}`}>
            {data.status.toUpperCase()}
          </span>
          <span className="results-zval">
            Z* = <strong>{data.status === "unbounded" ? "∞" : data.status === "infeasible" ? "-" : formatNumber(data.optimal_value)}</strong>
          </span>
        </div>
        
        <div className="calc-toggle">
          <button 
            className={`calc-toggle__btn ${!view3D ? "calc-toggle__btn--active" : ""}`} 
            onClick={() => setView3D(false)}
          >2D</button>
          <button 
            className={`calc-toggle__btn ${view3D ? "calc-toggle__btn--active" : ""}`} 
            onClick={() => setView3D(true)}
          >3D</button>
        </div>
      </div>
      
      {/* Vértices de la Región Factible */}
      {data.vertices && data.vertices.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Vértices de la Región Factible
          </h4>
          <div className="vertices-grid">
            {data.vertices.map((v, vi) => {
              const isOpt = data.optimal_point &&
                Math.abs(data.optimal_point.x - v.x) < 0.001 &&
                Math.abs(data.optimal_point.y - v.y) < 0.001;
              return (
                <div key={vi} className={`vertex-chip ${isOpt ? "vertex-chip--optimal" : ""}`}>
                  <span>({formatNumber(v.x)}, {formatNumber(v.y)})</span>
                  <span className="vertex-z">Z={formatNumber(v.z_value)}</span>
                  {isOpt && <span className="vertex-star">★ Óptimo</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 w-full">
        {view3D ? (
          <Graph3D result={renderData} />
        ) : (
          <Graph2D result={data} objCoeffs={[0, 0]} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Revised Simplex Results
// ─────────────────────────────────────────────────────────────────────────────
function RevisedSimplexResults({ data }: { data: RevisedSimplexResponse }) {
  return (
    <div className="results-block">
      <div className="results-header">
        <div className="flex items-center gap-3">
          <span className={`results-badge ${data.status === "optimal" ? "badge-optimal" : "badge-error"}`}>
            {data.status.toUpperCase()}
          </span>
          <span className="results-zval">
            Z* = <strong>{data.status === "unbounded" ? "∞" : data.status === "infeasible" ? "-" : formatNumber(data.optimal_value)}</strong>
          </span>
        </div>
      </div>

      <div className="results-vars">
        {data.variables && Object.entries(data.variables).map(([k, v]) => (
          <div key={k} className="results-var-chip">
            <KTex src={k.replace(/x(\d+)/, "x_{$1}").replace(/y(\d+)/, "y_{$1}")} />
            <span className="results-var-eq">=</span>
            <strong>{formatNumber(v)}</strong>
          </div>
        ))}
      </div>

      {/* Tableau iterations */}
      {data.tableaux && data.tableaux.length > 0 && (
        <div className="tableaux-wrapper mt-2">
          <h3 className="tableaux-title">Iteraciones del Simplex Revisado</h3>
          {data.tableaux.map((t, ti) => (
            <div key={ti} className="tableau-card">
              <div className="tableau-caption">
                <span className="font-semibold text-zinc-300">Iteración {t.iteration}</span>
                <span className="text-zinc-500 font-mono">·</span>
                <span className="font-mono text-zinc-400">Z = {formatNumber(t.z_value)}</span>
                {t.is_optimal && <span className="tableau-optimal-tag ml-auto">✓ Óptimo</span>}
              </div>
              <div className="tableau-scroll">
                <table className="simplex-table text-xs">
                  <thead>
                    <tr>
                      <th>Base</th>
                      <th>b_bar</th>
                      {t.b_inv[0].map((_, ci) => <th key={ci}>B⁻¹_{ci+1}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {t.basic_variables.map((bv, ri) => (
                      <tr key={ri}>
                        <td className="basic-var-col">{bv}</td>
                        <td className="font-semibold text-emerald-400 font-mono">{formatNumber(t.rhs[ri])}</td>
                        {t.b_inv[ri].map((cell, ci) => (
                          <td key={ci}>{formatNumber(cell)}</td>
                        ))}
                      </tr>
                    ))}
                    {/* Pi row */}
                    <tr className="cj-zj-row bg-white/5">
                      <td className="cj-zj-label">π (Multiplicadores)</td>
                      <td></td>
                      {t.pi?.map((v, ci) => (
                        <td key={ci} className="text-indigo-400 font-mono font-semibold">{formatNumber(v)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-3 tableau-scroll border-t border-zinc-800">
                <table className="simplex-table text-xs w-full">
                   <thead>
                      <tr>
                        <th className="text-left">Variables (Cj - Zj)</th>
                        {t.variable_names.map((v) => <th key={v}>{v}</th>)}
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                        <td className="font-semibold text-amber-400">Costos Reducidos</td>
                        {t.reduced_costs.map((rc, ci) => (
                           <td key={ci} className={rc > 0 ? "text-amber-400 font-bold" : "text-zinc-400"}>
                             {formatNumber(rc)}
                           </td>
                        ))}
                      </tr>
                   </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────────────────────
export type ResultData =
  | { kind: "simplex"; data: SimplexResponse }
  | { kind: "revised"; data: RevisedSimplexResponse }
  | { kind: "dual";    data: DualResponse }
  | { kind: "graphical"; data: GraphicalResponse }
  | { kind: "error";   message: string };

interface ResultsPanelProps {
  result: ResultData | null;
  loading: boolean;
}

export default function ResultsPanel({ result, loading }: ResultsPanelProps) {
  if (loading) {
    return (
      <div className="results-loading">
        <div className="spinner" />
        <span>Calculando solución óptima…</span>
      </div>
    );
  }

  if (!result) return null;

  if (result.kind === "error") {
    return (
      <div className="alert-error results-error">
        <span>⚠</span>
        <span>{result.message}</span>
      </div>
    );
  }

  return (
    <div className="results-panel">
      {result.kind === "simplex"   && <SimplexResults data={result.data} />}
      {result.kind === "revised"   && <RevisedSimplexResults data={result.data} />}
      {result.kind === "dual"      && <DualResults    data={result.data} />}
      {result.kind === "graphical" && <GraphicalResults data={result.data} />}
    </div>
  );
}
