"use client";
import { useState } from "react";
import { solveKnapsack, getErrorMessage } from "@/services/api";
import KaTeXDisplay from "@/components/math/KaTeXDisplay";

export default function AdvancedPage() {
  const [items, setItems] = useState([
    { name: "Laptop", weight: 3, value: 4 },
    { name: "Tablet", weight: 1, value: 2 },
    { name: "Cámara", weight: 2, value: 3 },
    { name: "Libro", weight: 1, value: 1 },
  ]);
  const [capacity, setCapacity] = useState(5);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await solveKnapsack({ items, capacity });
      setResult(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🧬</span>
            <h1 className="text-3xl font-bold text-white">Modelos Avanzados</h1>
          </div>
          <p className="text-slate-400">
            Programación Dinámica, Branch & Bound, Grafos y más.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mochila */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎒</span>
              <h2 className="text-base font-semibold text-white">
                Problema de la Mochila (0/1)
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              <KaTeXDisplay
                latex="\\max \\sum v_i x_i \\quad \\text{s.a.} \\quad \\sum w_i x_i \\leq W, \\quad x_i \\in \\{0,1\\}"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Capacidad de la mochila (W)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="number-input w-32"
                min={1}
                id="knapsack-capacity"
              />
            </div>

            <div>
              <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 mb-1 px-1">
                <span className="col-span-2">Ítem</span>
                <span>Peso</span>
                <span>Valor</span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const arr = [...items];
                      arr[i] = { ...arr[i], name: e.target.value };
                      setItems(arr);
                    }}
                    className="number-input col-span-2"
                    placeholder="Nombre"
                    id={`item-name-${i}`}
                  />
                  <input
                    type="number"
                    value={item.weight}
                    onChange={(e) => {
                      const arr = [...items];
                      arr[i] = { ...arr[i], weight: Number(e.target.value) };
                      setItems(arr);
                    }}
                    className="number-input text-center"
                    min={1}
                    id={`item-weight-${i}`}
                  />
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => {
                      const arr = [...items];
                      arr[i] = { ...arr[i], value: Number(e.target.value) };
                      setItems(arr);
                    }}
                    className="number-input text-center"
                    min={0}
                    id={`item-value-${i}`}
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  setItems([...items, { name: `Item ${items.length + 1}`, weight: 1, value: 1 }])
                }
                className="btn-secondary text-xs py-1.5 px-3"
              >
                + Agregar ítem
              </button>
            </div>

            <button
              onClick={handleSolve}
              disabled={loading}
              className="btn-primary w-full"
              id="knapsack-solve-btn"
            >
              {loading ? "Calculando..." : "⚡ Resolver con PD"}
            </button>
            {error && <div className="alert-error text-sm">{error}</div>}
          </div>

          {/* Resultado */}
          <div>
            {result ? (
              <div className="glass-card p-5 space-y-4 animate-fade-up">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Solución Óptima</h3>
                  <div className="alert-success py-1 px-3 text-sm">
                    Valor máx: <strong className="text-teal-300">{result.optimal_value}</strong>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">Ítems seleccionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.selected_items?.map((name: string) => (
                      <span
                        key={name}
                        className="badge badge-optimal px-3 py-1"
                      >
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                </div>

                {result.dp_table && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tabla de Programación Dinámica
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-white/8">
                      <table className="simplex-table text-xs">
                        <thead>
                          <tr>
                            <th>Item \ W</th>
                            {result.dp_table[0]?.map((_: any, j: number) => (
                              <th key={j}>{j}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.dp_table.map((row: number[], i: number) => (
                            <tr key={i}>
                              <td className="basic-var-col">
                                {i === 0 ? "—" : items[i - 1]?.name || `I${i}`}
                              </td>
                              {row.map((val, j) => (
                                <td
                                  key={j}
                                  className={
                                    val === result.optimal_value
                                      ? "text-teal-300 font-bold"
                                      : "text-slate-400"
                                  }
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-10 text-center">
                <div className="text-5xl mb-4">🎒</div>
                <p className="text-slate-400">
                  Configura los ítems y la capacidad para resolver el problema de la mochila
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
