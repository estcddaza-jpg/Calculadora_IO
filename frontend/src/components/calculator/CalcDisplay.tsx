"use client";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useCalculatorStore } from "@/store/useCalculatorStore";

interface RowDisplayProps {
  idx: number;
  isActive: boolean;
  onClick: () => void;
}

function RowDisplay({ idx, isActive, onClick }: RowDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { getLatexForRow, rows, optType } = useCalculatorStore();
  const latex = getLatexForRow(idx);
  const label = idx === 0 ? `\\textbf{${optType}}\\;Z =` : `R_${idx}:`;

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(label + "\\;" + (latex || "\\square"), ref.current, {
        displayMode: false,
        throwOnError: false,
        output: "html",
        trust: true,
        strict: false,
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, label]);

  const isEmpty = !latex;

  return (
    <div
      onClick={onClick}
      className={`calc-row ${isActive ? "calc-row--active" : ""} ${isEmpty ? "calc-row--empty" : ""}`}
    >
      <div ref={ref} className="calc-row__katex" />
    </div>
  );
}

export default function CalcDisplay() {
  const { rows, activeRowIdx, setActiveRow } = useCalculatorStore();

  return (
    <div className="calc-display">
      <div className="calc-display__inner">
        {rows.map((row, idx) => (
          <RowDisplay
            key={row.id}
            idx={idx}
            isActive={idx === activeRowIdx}
            onClick={() => setActiveRow(idx)}
          />
        ))}
      </div>
    </div>
  );
}
