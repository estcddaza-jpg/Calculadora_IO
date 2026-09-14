"use client";
import { useCalculatorStore } from "@/store/useCalculatorStore";

interface KeyDef {
  label: string;
  token: string;
  variant: "num" | "op" | "var" | "action" | "solve";
  colSpan?: number;
  rowSpan?: number;
  shiftOnly?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Key definitions per mode (normal layer)
// ─────────────────────────────────────────────────────────────────────────────

const LINEAR_KEYS_NORMAL: KeyDef[] = [
  // Row 1 — actions + type toggles
  { label: "AC",    token: "__CLEAR__",   variant: "action" },
  { label: "DEL",   token: "__DEL__",     variant: "action" },
  { label: "+Fila", token: "__ADDROW__",  variant: "action" },
  { label: "−Fila", token: "__DELROW__",  variant: "action" },
  // Row 2 — variables
  { label: "x₁",   token: "x1",          variant: "var" },
  { label: "x₂",   token: "x2",          variant: "var" },
  { label: "x₃",   token: "x3",          variant: "var" },
  { label: "x₄",   token: "x4",          variant: "var" },
  // Row 3 — operators
  { label: "≤",    token: "<=",           variant: "op" },
  { label: "≥",    token: ">=",           variant: "op" },
  { label: "=",    token: "=",            variant: "op" },
  { label: "+",    token: "+",            variant: "op" },
  // Row 4 — numbers (7,8,9) + minus
  { label: "7",    token: "7",            variant: "num" },
  { label: "8",    token: "8",            variant: "num" },
  { label: "9",    token: "9",            variant: "num" },
  { label: "−",    token: "-",            variant: "op" },
  // Row 5 — 4,5,6 + mult
  { label: "4",    token: "4",            variant: "num" },
  { label: "5",    token: "5",            variant: "num" },
  { label: "6",    token: "6",            variant: "num" },
  { label: "×",    token: "*",            variant: "op" },
  // Row 6 — 1,2,3 + div
  { label: "1",    token: "1",            variant: "num" },
  { label: "2",    token: "2",            variant: "num" },
  { label: "3",    token: "3",            variant: "num" },
  { label: "/",    token: "/",            variant: "op" },
  // Row 7 — 0, dot, GRAPH, RESOLVER
  { label: "0",    token: "0",            variant: "num" },
  { label: ".",    token: ".",            variant: "num" },
  { label: "📊 GRÁFICA", token: "__GRAPH__", variant: "action" },
  { label: "RESOLVER ▶", token: "__SOLVE__", variant: "solve" },
];

const SHIFT_EXTRA_KEYS: KeyDef[] = [
  { label: "x₅",  token: "x5", variant: "var", shiftOnly: true },
  { label: "x₆",  token: "x6", variant: "var", shiftOnly: true },
  { label: "y₁",  token: "y1", variant: "var", shiftOnly: true },
  { label: "y₂",  token: "y2", variant: "var", shiftOnly: true },
];

const VARIANT_CLASS: Record<string, string> = {
  num:    "key-num",
  op:     "key-op",
  var:    "key-var",
  action: "key-action",
  solve:  "key-solve",
};

interface CalcKeypadProps {
  onSolve: (override?: "graphical") => void;
}

export default function CalcKeypad({ onSolve }: CalcKeypadProps) {
  const {
    pushToken, deleteLastToken, clearAll,
    addRow, removeRow, activeRowIdx, shiftLayer, toggleShift,
  } = useCalculatorStore();

  const keys = shiftLayer === "shift"
    ? [...LINEAR_KEYS_NORMAL.slice(0, 8), ...SHIFT_EXTRA_KEYS, ...LINEAR_KEYS_NORMAL.slice(8)]
    : LINEAR_KEYS_NORMAL;

  function handleKey(k: KeyDef) {
    switch (k.token) {
      case "__CLEAR__":   clearAll();              break;
      case "__DEL__":     deleteLastToken();        break;
      case "__ADDROW__":  addRow();                 break;
      case "__DELROW__":  removeRow(activeRowIdx);  break;
      case "__SOLVE__":   onSolve();                break;
      case "__GRAPH__":   onSolve("graphical");     break;
      default:            pushToken(k.token);       break;
    }
  }

  return (
    <div className="calc-keypad">
      {/* Shift toggle */}
      <button
        className={`key-shift-btn ${shiftLayer === "shift" ? "key-shift-btn--active" : ""}`}
        onClick={toggleShift}
        aria-label="Shift layer"
      >
        ⇧ {shiftLayer === "shift" ? "ON" : "OFF"}
      </button>

      <div className="calc-keypad__grid">
        {keys.map((k, i) => (
          <button
            key={`${k.token}-${i}`}
            className={`calc-key ${VARIANT_CLASS[k.variant]} ${k.colSpan === 2 ? "col-span-2" : ""}`}
            onClick={() => handleKey(k)}
            aria-label={k.label}
          >
            <span className="calc-key__label">{k.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}