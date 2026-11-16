"use client";
import { useState, useCallback, useEffect } from "react";
import { useCalculatorStore } from "@/store/useCalculatorStore";
import CalcDisplay from "./CalcDisplay";
import CalcKeypad from "./CalcKeypad";
import ResultsPanel, { type ResultData } from "./ResultsPanel";
import {
  solveLinearSimplex,
  solveRevisedSimplex,
  solveGraphical,
  generateDual,
  getErrorMessage,
} from "@/services/api";

type SolveMethod = "simplex" | "revised" | "graphical" | "dual";

export default function CalculatorLayout() {
  const { mode, optType, setOptType, getParsedModel, rows, activeRowIdx, pasteToActiveRow } =
    useCalculatorStore();

  const [method, setMethod] = useState<SolveMethod>("simplex");
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Ignorar si el usuario está pegando en un input real
      }
      const text = e.clipboardData?.getData("text");
      if (text) {
        pasteToActiveRow(text);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        useCalculatorStore.getState().moveCursor("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        useCalculatorStore.getState().moveCursor("right");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        useCalculatorStore.getState().deleteAtCursor();
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pasteToActiveRow]);

  const handleSolve = useCallback(async (overrideMethod?: SolveMethod) => {
    const model = getParsedModel();
    if (!model) {
      setResult({ kind: "error", message: "Modelo incompleto. Ingresa la función objetivo y al menos una restricción." });
      setResultsOpen(true);
      return;
    }

    setLoading(true);
    setResultsOpen(true);

    const methodToUse = overrideMethod || method;

    try {
      if (methodToUse === "simplex") {
        const data = await solveLinearSimplex(model);
        setResult({ kind: "simplex", data });
      } else if (methodToUse === "revised") {
        const data = await solveRevisedSimplex(model);
        setResult({ kind: "revised", data });
      } else if (methodToUse === "graphical") {
        const data = await solveGraphical(model);
        setResult({ kind: "graphical", data });
      } else {
        const data = await generateDual(model);
        setResult({ kind: "dual", data });
      }
    } catch (err) {
      setResult({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [getParsedModel, method]);

  return (
    <div className="calc-root">
      {/* ── TOP HEADER (OptiFlow Enterprise Bar) ── */}
      <header className="calc-header">
        {/* Brand */}
        <div className="calc-header__brand">
          <div className="calc-header__icon-box">
            <span className="calc-header__icon">∑</span>
          </div>
          <div className="calc-header__title-group">
            <span className="calc-header__title">Calculadora</span>
            <span className="calc-header__subtitle">Investigación de Operaciones</span>
          </div>
        </div>

        {/* Module Pill Selector */}
        <nav aria-label="Módulos principales" className="calc-nav-pill">
          <button
            onClick={() => window.location.href = "/"}
            className="calc-nav-btn calc-nav-btn--active"
          >
            Programación Lineal
          </button>
          <button
            onClick={() => window.location.href = "/networks"}
            className="calc-nav-btn"
            title="Ir a Transporte, Asignación, Flujos y Proyectos"
          >
            Redes, Asignación y Flujos
          </button>
        </nav>

        {/* Right Controls */}
        <div className="calc-header__controls">
          {/* Mobile navigation button */}
          <button
            onClick={() => window.location.href = "/networks"}
            className="md:hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm"
          >
            Redes
          </button>

          {/* MAX / MIN Selector */}
          {mode === "linear" && (
            <div className="calc-toggle">
              <button
                className={`calc-toggle__btn ${optType === "MAX" ? "calc-toggle__btn--active" : ""}`}
                onClick={() => setOptType("MAX")}
              >MAX</button>
              <button
                className={`calc-toggle__btn ${optType === "MIN" ? "calc-toggle__btn--active" : ""}`}
                onClick={() => setOptType("MIN")}
              >MIN</button>
            </div>
          )}

          {/* Solve Method Selector */}
          {mode === "linear" && (
            <div className="calc-toggle">
              {(["simplex", "revised", "graphical", "dual"] as SolveMethod[]).map((m) => (
                <button
                  key={m}
                  className={`calc-toggle__btn calc-toggle__btn--sm ${method === m ? "calc-toggle__btn--active" : ""}`}
                  onClick={() => {
                    setMethod(m);
                    if (resultsOpen && result) {
                      handleSolve(m);
                    }
                  }}
                  id={`method-btn-${m}`}
                >
                  {m === "simplex" ? "Estándar" : m === "revised" ? "Revisado" : m === "graphical" ? "Gráfico" : "Dual"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="calc-body">
        {/* Left Panel: Mathematical Model Input (Display + Keypad) */}
        <section className="calc-center">
          {/* Row Tabs */}
          <div className="calc-row-tabs">
            <div className="calc-row-tab-list">
              {rows.map((row, idx) => (
                <button
                  key={row.id}
                  className={`calc-row-tab ${idx === activeRowIdx ? "calc-row-tab--active" : ""}`}
                  onClick={() => useCalculatorStore.getState().setActiveRow(idx)}
                >
                  {idx === 0 ? "Z" : `R${idx}`}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-zinc-500 font-mono tracking-tight hidden sm:inline">
              Ctrl+V pegar
            </span>
          </div>

          <CalcDisplay />
          <CalcKeypad onSolve={handleSolve} />
        </section>

        {/* Right Panel: Results & Simplex Tableaux */}
        <section className={`calc-right ${resultsOpen ? "calc-right--open" : ""}`}>
          <div className="calc-right__header">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="calc-right__title">Resultados de Optimización</h2>
            </div>
            <button
              className="calc-right__close"
              onClick={() => setResultsOpen(false)}
              aria-label="Cerrar resultados"
            >✕</button>
          </div>
          <div className="calc-right__body">
            <ResultsPanel result={result} loading={loading} />
          </div>
        </section>
      </main>

      {/* Mobile Floating Results Button */}
      {!resultsOpen && result && (
        <button className="calc-results-fab" onClick={() => setResultsOpen(true)}>
          📊 Ver Resultados
        </button>
      )}
    </div>
  );
}
