"use client";
import { useState } from "react";
import KaTeXDisplay from "../math/KaTeXDisplay";
import type { SimplexTableau } from "@/services/api";

interface StepByStepTableProps {
  tableaux: SimplexTableau[];
  optimalValue: number;
  variables: Record<string, number>;
}

/** Formatea un número a máximo 4 decimales eliminando ceros inútiles */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Number(parseFloat(String(value)).toFixed(4)));
}

export default function StepByStepTable({
  tableaux,
  optimalValue,
  variables,
}: StepByStepTableProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tableaux || tableaux.length === 0) return null;

  const tableau = tableaux[activeTab];
  const varNames = tableau.variable_names || [];
  const cj = tableau.cj || [];
  const zj = tableau.zj || [];
  const cjzj = tableau.cj_zj || [];

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Iteraciones del Método Simplex
        </h3>
        <div className="flex items-center gap-2">
          {tableaux.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === i
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              aria-label={`Iteración ${i}`}
            >
              {t.is_optimal ? "✓ Óptimo" : `It. ${i}`}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de la iteración */}
      {!tableau.is_optimal && (
        <div className="flex gap-4 text-sm">
          {tableau.entering_variable && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">Entra:</span>
              <KaTeXDisplay
                latex={tableau.entering_variable.replace(/(\d+)/, "_{$1}")}
                className="text-amber-400"
              />
            </div>
          )}
          {tableau.leaving_variable && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-slate-400">Sale:</span>
              <KaTeXDisplay
                latex={tableau.leaving_variable.replace(/(\d+)/, "_{$1}")}
                className="text-rose-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Tabla Simplex */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="simplex-table">
          <thead>
            <tr>
              <th className="w-12 border-r border-white/8"></th>
              <th className="border-r border-white/8"></th>
              <th className="border-r border-white/8">
                <KaTeXDisplay latex="C_j" />
              </th>
              {varNames.map((name, j) => (
                <th
                  key={j}
                  className={
                    name === tableau.entering_variable
                      ? "text-amber-400"
                      : ""
                  }
                >
                  <KaTeXDisplay
                    latex={`${formatNumber(cj[j] ?? 0)}`}
                  />
                </th>
              ))}
            </tr>
            <tr style={{ borderBottom: "2px solid rgba(79,142,247,0.3)" }}>
              <th className="border-r border-white/8">
                <KaTeXDisplay latex="C_B" />
              </th>
              <th className="border-r border-white/8">VB</th>
              <th className="border-r border-white/8 text-teal-400">
                <KaTeXDisplay latex="b" />
              </th>
              {varNames.map((name, j) => (
                <th
                  key={j}
                  className={
                    name === tableau.entering_variable
                      ? "text-amber-400"
                      : "text-slate-300"
                  }
                >
                  <KaTeXDisplay
                    latex={name
                      .replace(/([a-zA-Z]+)(\d+)/, "$1_{$2}")
                      .replace(/s(\d+)/, "s_{$1}")
                      .replace(/a(\d+)/, "a_{$1}")}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableau.basic_variables.map((bv, rowIdx) => (
              <tr
                key={rowIdx}
                className={
                  bv === tableau.leaving_variable ? "bg-rose-500/5" : ""
                }
              >
                <td className="border-r border-white/8 text-teal-400 font-mono text-xs">
                  <KaTeXDisplay
                    latex={formatNumber(
                      cj[varNames.indexOf(bv)] ?? 0
                    )}
                  />
                </td>
                <td className="basic-var-col border-r border-white/8">
                  <KaTeXDisplay
                    latex={bv
                      .replace(/([a-zA-Z]+)(\d+)/, "$1_{$2}")}
                  />
                </td>
                <td className="border-r border-white/8 text-blue-300 font-semibold">
                  <KaTeXDisplay
                    latex={formatNumber(
                      tableau.tableau[rowIdx]?.[varNames.length] ?? 0
                    )}
                  />
                </td>
                {varNames.map((_, colIdx) => {
                  const val = tableau.tableau[rowIdx]?.[colIdx] ?? 0;
                  const isPivot =
                    varNames[colIdx] === tableau.entering_variable &&
                    bv === tableau.leaving_variable;
                  return (
                    <td
                      key={colIdx}
                      className={isPivot ? "pivot-cell" : ""}
                    >
                      <KaTeXDisplay latex={formatNumber(val)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* Fila Zj */}
            <tr className="border-t border-white/10">
              <td colSpan={2} className="text-slate-400 text-xs border-r border-white/8">
                <KaTeXDisplay latex="Z_j" />
              </td>
              <td className="border-r border-white/8 text-blue-400 font-bold">
                <KaTeXDisplay latex={formatNumber(tableau.z_value)} />
              </td>
              {zj.map((z, j) => (
                <td key={j} className="text-slate-400">
                  <KaTeXDisplay latex={formatNumber(z)} />
                </td>
              ))}
            </tr>
            {/* Fila Cj - Zj */}
            <tr className="bg-white/2">
              <td colSpan={2} className="text-slate-400 text-xs border-r border-white/8">
                <KaTeXDisplay latex="C_j - Z_j" />
              </td>
              <td className="border-r border-white/8"></td>
              {cjzj.map((v, j) => (
                <td
                  key={j}
                  className={
                    v > 0
                      ? "text-amber-400 font-semibold"
                      : v < 0
                      ? "text-rose-400"
                      : "text-slate-500"
                  }
                >
                  <KaTeXDisplay latex={formatNumber(v)} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Resultado óptimo */}
      {tableau.is_optimal && (
        <div className="alert-success mt-4">
          <div>
            <p className="font-semibold text-teal-300 mb-2">
              ✓ Solución Óptima Encontrada
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-slate-400">Z* = </span>
                <KaTeXDisplay
                  latex={formatNumber(optimalValue)}
                  className="text-teal-300 font-bold text-base"
                />
              </div>
              {Object.entries(variables).map(([name, val]) => (
                <div key={name}>
                  <KaTeXDisplay
                    latex={`${name.replace(/(\d+)/, "_{$1}")} = ${formatNumber(val)}`}
                    className="text-teal-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
