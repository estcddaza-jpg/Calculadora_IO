import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

export type OptType = "MAX" | "MIN";
export type ConstraintOp = "<=" | ">=" | "=";
export type CalcMode = "linear" | "networks" | "queues" | "advanced";
export type ShiftLayer = "normal" | "shift";

export interface RowBuffer {
  id: string;
  latex: string;
  raw: string;
  tokens: string[];
}

export interface ParsedConstraint {
  coefficients: number[];
  operator: ConstraintOp;
  rhs: number;
}

export interface ParsedModel {
  type: OptType;
  objective_function: number[];
  constraints: ParsedConstraint[];
  variable_names: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeRow = (id: string): RowBuffer => ({ id, latex: "", raw: "", tokens: [] });

const OPERATOR_LATEX: Record<string, string> = {
  "<=": "\\leq",
  ">=": "\\geq",
  "=": "=",
};

function tokensToLatex(tokens: string[]): string {
  return tokens
    .map((t) => {
      // Dynamic variable formatting, e.g., x10 -> x_{10}
      if (/^[a-zA-Z]\d+$/.test(t)) {
        const letter = t.replace(/\d+$/, "");
        const num = t.replace(/^[a-zA-Z]+/, "");
        return `${letter}_{${num}}`;
      }
      if (OPERATOR_LATEX[t]) return " " + OPERATOR_LATEX[t] + " ";
      if (t === "+") return " + ";
      if (t === "-") return " - ";
      if (t === "*") return "\\cdot ";
      if (t === "/") return " \\div ";
      if (t === "__CURSOR__") return "\\htmlClass{calc-cursor-katex}{|}";
      return t;
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function tokensToRaw(tokens: string[]): string {
  return tokens.join("");
}

function parseRowRaw(raw: string): { coeffs: Map<string, number>; op: ConstraintOp | null; rhs: number | null } {
  let op: ConstraintOp | null = null;
  let rhs: number | null = null;
  let lhs = raw;

  const opMatch = raw.match(/(<=|>=|(?<![<>])=(?!=))/);
  if (opMatch) {
    op = opMatch[1] as ConstraintOp;
    const idx = raw.indexOf(opMatch[1]);
    lhs = raw.slice(0, idx);
    const rhsStr = raw.slice(idx + opMatch[1].length).trim().replace(/\s/g, "");
    if (rhsStr.includes("/")) {
      const parts = rhsStr.split("/");
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      rhs = num / (isNaN(den) || den === 0 ? 1 : den);
    } else {
      rhs = parseFloat(rhsStr) || 0;
    }
  }

  const coeffs = new Map<string, number>();
  // Match optional sign, optional number, optional fraction, optional decimals, followed by variable
  const termRegex = /([+-]?\s*\d*\.?\d*(?:\/\d*\.?\d*)?)\s*([a-zA-Z]\d+)/g;
  let m;
  while ((m = termRegex.exec(lhs)) !== null) {
    const coefStr = m[1].replace(/\s/g, "");
    let coef = 1;
    if (coefStr === "" || coefStr === "+") {
      coef = 1;
    } else if (coefStr === "-") {
      coef = -1;
    } else {
      if (coefStr.includes("/")) {
        const parts = coefStr.split("/");
        const num = parts[0] === "" || parts[0] === "+" ? 1 : parts[0] === "-" ? -1 : parseFloat(parts[0]);
        const den = parseFloat(parts[1]);
        coef = num / (isNaN(den) || den === 0 ? 1 : den);
      } else {
        coef = parseFloat(coefStr);
      }
    }
    if (isNaN(coef)) coef = 1;
    coeffs.set(m[2], (coeffs.get(m[2]) || 0) + coef);
  }

  return { coeffs, op, rhs };
}

export function parseModel(
  optType: OptType,
  objectiveRaw: string,
  constraintRows: RowBuffer[],
  varNames: string[]
): ParsedModel | null {
  const objParsed = parseRowRaw(objectiveRaw);
  const objCoeffs = varNames.map((v) => objParsed.coeffs.get(v) ?? 0);

  const constraints: ParsedConstraint[] = [];
  for (const row of constraintRows) {
    if (!row.raw.trim()) continue;
    const p = parseRowRaw(row.raw);
    if (p.op === null || p.rhs === null) return null;
    constraints.push({
      coefficients: varNames.map((v) => p.coeffs.get(v) ?? 0),
      operator: p.op,
      rhs: p.rhs,
    });
  }

  if (constraints.length === 0) return null;
  if (objCoeffs.every((c) => c === 0)) return null;

  return {
    type: optType,
    objective_function: objCoeffs,
    constraints,
    variable_names: varNames,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────────────────────────────────────

interface CalculatorState {
  mode: CalcMode;
  optType: OptType;
  shiftLayer: ShiftLayer;
  varNames: string[];
  rows: RowBuffer[];
  activeRowIdx: number;
  activeCursorIdx: number | null;

  setMode: (m: CalcMode) => void;
  setOptType: (t: OptType) => void;
  toggleShift: () => void;
  setActiveRow: (idx: number) => void;
  addRow: () => void;
  removeRow: (idx: number) => void;
  clearActiveRow: () => void;
  clearAll: () => void;
  deleteLastToken: () => void; // Keeps the original but we'll add deleteAtCursor
  deleteAtCursor: () => void;
  pushToken: (token: string) => void;
  moveCursor: (dir: "left" | "right") => void;
  pasteToActiveRow: (text: string) => void;
  getLatexForRow: (idx: number) => string;
  getParsedModel: () => ParsedModel | null;
}

function syncRow(tokens: string[]): Pick<RowBuffer, "latex" | "raw"> {
  return { latex: tokensToLatex(tokens), raw: tokensToRaw(tokens) };
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  mode: "linear",
  optType: "MAX",
  shiftLayer: "normal",
  varNames: ["x1", "x2"],
  rows: [makeRow("obj"), makeRow("c1")],
  activeRowIdx: 0,
  activeCursorIdx: null,

  setMode: (m) => set({ mode: m }),
  setOptType: (t) => set({ optType: t }),
  toggleShift: () =>
    set((s) => ({ shiftLayer: s.shiftLayer === "normal" ? "shift" : "normal" })),

  setActiveRow: (idx) => set({ activeRowIdx: idx, activeCursorIdx: null }),

  addRow: () => {
    const state = get();
    const rows = [...state.rows, makeRow(`c${Date.now()}`)];
    set({ rows, activeRowIdx: rows.length - 1, activeCursorIdx: null });
  },

  removeRow: (idx) => {
    const state = get();
    if (idx === 0 || state.rows.length <= 2) return;
    const newRows = state.rows.filter((_, i) => i !== idx);
    const newActive = Math.min(idx - 1, newRows.length - 1);
    set({ rows: newRows, activeRowIdx: newActive, activeCursorIdx: null });
  },

  clearActiveRow: () => {
    set((s) => ({
      rows: s.rows.map((r, i) =>
        i === s.activeRowIdx ? { ...r, latex: "", raw: "", tokens: [] } : r
      ),
      activeCursorIdx: null,
    }));
  },

  clearAll: () =>
    set({
      rows: [makeRow("obj"), makeRow("c1")],
      activeRowIdx: 0,
      activeCursorIdx: null,
      optType: "MAX",
    }),

  deleteLastToken: () => get().deleteAtCursor(),

  deleteAtCursor: () =>
    set((s) => {
      const rows = s.rows.map((r, i) => {
        if (i === s.activeRowIdx) {
          const cursor = s.activeCursorIdx !== null ? s.activeCursorIdx : r.tokens.length;
          if (cursor > 0) {
            const tokens = [...r.tokens];
            tokens.splice(cursor - 1, 1);
            return { ...r, tokens, ...syncRow(tokens) };
          }
        }
        return r;
      });
      const newCursor = s.activeCursorIdx !== null ? Math.max(0, s.activeCursorIdx - 1) : null;
      return { rows, activeCursorIdx: newCursor };
    }),

  pushToken: (token) =>
    set((s) => {
      const rows = s.rows.map((r, i) => {
        if (i === s.activeRowIdx) {
          const cursor = s.activeCursorIdx !== null ? s.activeCursorIdx : r.tokens.length;
          const tokens = [...r.tokens];
          tokens.splice(cursor, 0, token);
          return { ...r, tokens, ...syncRow(tokens) };
        }
        return r;
      });
      const newCursor = s.activeCursorIdx !== null ? s.activeCursorIdx + 1 : null;
      return { rows, activeCursorIdx: newCursor };
    }),

  moveCursor: (dir) =>
    set((s) => {
      const row = s.rows[s.activeRowIdx];
      if (!row) return {};
      let cursor = s.activeCursorIdx !== null ? s.activeCursorIdx : row.tokens.length;
      if (dir === "left") cursor = Math.max(0, cursor - 1);
      else if (dir === "right") cursor = Math.min(row.tokens.length, cursor + 1);
      return { activeCursorIdx: cursor };
    }),

  pasteToActiveRow: (text) =>
    set((s) => {
      const regex = /(<=|>=|=|[+\-*/]|[a-zA-Z]\d+|\d+\.?\d*|\.)/g;
      const parsedTokens = text.match(regex) || [];
      const rows = s.rows.map((r, i) => {
        if (i === s.activeRowIdx) {
          const cursor = s.activeCursorIdx !== null ? s.activeCursorIdx : r.tokens.length;
          const tokens = [...r.tokens];
          tokens.splice(cursor, 0, ...parsedTokens);
          return { ...r, tokens, ...syncRow(tokens) };
        }
        return r;
      });
      const newCursor = s.activeCursorIdx !== null ? s.activeCursorIdx + parsedTokens.length : null;
      return { rows, activeCursorIdx: newCursor };
    }),

  getLatexForRow: (idx) => {
    const state = get();
    const row = state.rows[idx];
    if (!row) return "";
    if (idx === state.activeRowIdx) {
      const cursorIdx = state.activeCursorIdx !== null ? state.activeCursorIdx : row.tokens.length;
      const tokensWithCursor = [...row.tokens];
      tokensWithCursor.splice(cursorIdx, 0, "__CURSOR__");
      return tokensToLatex(tokensWithCursor);
    }
    return row.latex;
  },

  getParsedModel: () => {
    const state = get();
    
    // Extract all unique variables dynamically from all rows
    const allRaw = [state.rows[0]?.raw ?? "", ...state.rows.slice(1).map((r) => r.raw)];
    const varSet = new Set<string>();
    const varRegex = /[a-zA-Z]\d+/g;
    allRaw.forEach((raw) => {
      const matches = raw.match(varRegex);
      if (matches) {
        matches.forEach((m) => varSet.add(m));
      }
    });

    // Sort variables logically (e.g., x1, x2, x3... x10)
    let dynamicVarNames = Array.from(varSet).sort((a, b) => {
      const letterA = a.replace(/\d+$/, "");
      const numA = parseInt(a.replace(/^[a-zA-Z]+/, ""), 10);
      const letterB = b.replace(/\d+$/, "");
      const numB = parseInt(b.replace(/^[a-zA-Z]+/, ""), 10);
      
      if (letterA !== letterB) return letterA.localeCompare(letterB);
      return numA - numB;
    });

    // Fallback to default varNames if no variables were detected
    if (dynamicVarNames.length === 0) {
      dynamicVarNames = state.varNames;
    }

    return parseModel(state.optType, state.rows[0]?.raw ?? "", state.rows.slice(1), dynamicVarNames);
  },
}));
