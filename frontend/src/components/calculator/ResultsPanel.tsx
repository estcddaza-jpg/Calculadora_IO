"use client";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { SimplexResponse, GraphicalResponse, DualResponse } from "@/services/api";

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
  return (
    <div className="results-block">
      <div className="results-header">
        <span className={`results-badge ${data.status === "optimal" ? "badge-optimal" : "badge-error"}`}>
          {data.status.toUpperCase()}
        </span>
        <span className="results-zval">
          Z* = <strong>{data.optimal_value?.toFixed(4)}</strong>
        </span>
      </div>

      <div className="results-vars">
        {Object.entries(data.variables).map(([k, v]) => (
          <div key={k} className="results-var-chip">
            <KTex src={k.replace(/x(\d+)/, "x_{$1}").replace(/y(\d+)/, "y_{$1}")} />
            <span className="results-var-eq">=</span>
            <strong>{Number(v).toFixed(4)}</strong>
          </div>
        ))}
      </div>

      {/* Tableau iterations */}
      {data.tableaux && data.tableaux.length > 0 && (
        <div className="tableaux-wrapper">
          <h3 className="tableaux-title">Iteraciones del Simplex</h3>
          {data.tableaux.map((t, ti) => (
            <div key={ti} className="tableau-card">
              <div className="tableau-caption">
                Iteración {t.iteration} &nbsp;·&nbsp; Z = {t.z_value?.toFixed(4)}
                {t.is_optimal && <span className="tableau-optimal-tag">✓ Óptimo</span>}
              </div>
              <div className="tableau-scroll">
                <table className="simplex-table">
                  <thead>
                    <tr>
                      <th>Base</th>
                      <th>Cj</th>
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
                          <td>{t.cj?.[ri] ?? ""}</td>
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
                              {Number(cell).toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {/* Cj - Zj row */}
                    <tr className="cj-zj-row">
                      <td colSpan={2} className="cj-zj-label">Cj−Zj</td>
                      {t.cj_zj?.map((v, ci) => (
                        <td key={ci} className={v > 0 ? "text-orange-400 font-bold" : ""}>{v?.toFixed(3)}</td>
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
      <h3 className="tableaux-title">Modelo Dual</h3>
      <div className="dual-info">
        <span>Primal: <strong>{data.primal_type}</strong></span>
        <span>Dual: <strong>{data.dual_type}</strong></span>
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
  return (
    <div className="results-block">
      <div className="results-header">
        <span className={`results-badge ${data.status === "optimal" ? "badge-optimal" : "badge-error"}`}>
          {data.status.toUpperCase()}
        </span>
        <span className="results-zval">
          Z* = <strong>{data.optimal_value?.toFixed(4)}</strong>
        </span>
      </div>
      <h3 className="tableaux-title">Vértices de la Región Factible</h3>
      <div className="vertices-grid">
        {data.vertices?.map((v, i) => (
          <div key={i} className={`vertex-chip ${v.is_optimal ? "vertex-chip--optimal" : ""}`}>
            <KTex src={`(${v.x.toFixed(2)},\\,${v.y.toFixed(2)})`} />
            <span className="vertex-z">Z={v.z_value?.toFixed(2)}</span>
            {v.is_optimal && <span className="vertex-star">★</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────────────────────
export type ResultData =
  | { kind: "simplex"; data: SimplexResponse }
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
        <span>Calculando…</span>
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
      {result.kind === "dual"      && <DualResults    data={result.data} />}
      {result.kind === "graphical" && <GraphicalResults data={result.data} />}
    </div>
  );
}
