"use client";
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KaTeXDisplayProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renderiza una expresión LaTeX usando KaTeX.
 * Soporta modo inline y display (bloque centrado).
 */
export default function KaTeXDisplay({
  latex,
  displayMode = false,
  className = "",
}: KaTeXDisplayProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(latex, ref.current, {
        displayMode,
        throwOnError: false,
        errorColor: "#f43f5e",
        strict: false,
        trust: true,
        macros: {
          "\\R": "\\mathbb{R}",
          "\\st": "\\text{s.a.}",
        },
      });
    } catch (e) {
      if (ref.current) {
        ref.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`Expresión matemática: ${latex}`}
    />
  );
}
