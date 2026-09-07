"use client";
import { useState, useCallback, useEffect } from "react";
import { useCalculatorStore } from "@/store/useCalculatorStore";
import CalcDisplay from "./CalcDisplay";
import CalcKeypad from "./CalcKeypad";
import ResultsPanel, { type ResultData } from "./ResultsPanel";
import {
  solveLinearSimplex,
  solveGraphical,
  generateDual,
  getErrorMessage,
} from "@/services/api";

type SolveMethod = "simplex" | "graphical" | "dual";

const MODE_LABELS: Record<string, string> = {
  linear:   "📐 Programación Lineal",
  networks: "🕸 Redes y Proyectos",
  queues:   "⏱ Teoría de Colas",
  advanced: "🧩 Modelos Avanzados",
};

export default function CalculatorLayout() {
  const { mode, setMode, optType, setOptType, getParsedModel, rows, activeRowIdx, pasteToActiveRow } =
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

  const handleSolve = useCallback(async () => {
    const model = getParsedModel();
    if (!model) {
      setResult({ kind: "error", message: "Modelo incompleto. Ingresa la función objetivo y al menos una restricción." });
      setResultsOpen(true);
      return;
    }

    setLoading(true);
    setResultsOpen(true);

    try {
      if (method === "simplex") {
        const data = await solveLinearSimplex(model);
        setResult({ kind: "simplex", data });
      } else if (method === "graphical") {
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
      {/* ── HEADER ── */}
      <header className="calc-header">
        <div className="calc-header__brand">
          <span className="calc-header__icon">∑</span>
          <span className="calc-header__title">Calculadora IO</span>
        </div>

        <div className="calc-header__controls">
          {/* Mode selector */}
          <select
            className="calc-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as "linear" | "networks" | "queues" | "advanced")}
          >
            {Object.entries(MODE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* OPT type toggle */}
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

          {/* Method selector */}
          {mode === "linear" && (
            <div className="calc-toggle">
              {(["simplex", "graphical", "dual"] as SolveMethod[]).map((m) => (
                <button
                  key={m}
                  className={`calc-toggle__btn calc-toggle__btn--sm ${method === m ? "calc-toggle__btn--active" : ""}`}
                  onClick={() => setMethod(m)}
                >
                  {m === "simplex" ? "Simplex" : m === "graphical" ? "Gráfico" : "Dual"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <main className="calc-body">
        {/* Left panel — Display + Keypad (Centered) */}
        <section className="calc-center">
          {/* Row tabs */}
          <div className="calc-row-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
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
            <span style={{ fontSize: "0.75rem", color: "#888", paddingRight: "10px" }}>
              (Ctrl+V para pegar)
            </span>
          </div>

          <CalcDisplay />
          <CalcKeypad onSolve={handleSolve} />
        </section>

        {/* Right panel — Results */}
        <section className={`calc-right ${resultsOpen ? "calc-right--open" : ""}`}>
          <div className="calc-right__header">
            <h2 className="calc-right__title">Resultados</h2>
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

      {/* Results toggle button (mobile) */}
      {!resultsOpen && result && (
        <button className="calc-results-fab" onClick={() => setResultsOpen(true)}>
          📊 Ver Resultados
        </button>
      )}
    </div>
  );
}