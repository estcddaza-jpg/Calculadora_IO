"use client";
import { useState } from "react";
import {
  solveTransport,
  solveCPM,
  solvePERT,
  solveQueues,
  solveAssignment,
  solveKuhnMunkres,
  solveMaxFlow,
  solveMinCostFlow,
  getErrorMessage,
} from "@/services/api";
import KaTeXDisplay from "@/components/math/KaTeXDisplay";

type Section = "transport" | "assignment" | "kuhn-munkres" | "max-flow" | "min-cost-flow" | "cpm" | "pert" | "queues";

export default function NetworksPage() {
  const [section, setSection] = useState<Section>("transport");

  const sections = [
    { id: "transport" as const, label: "Transporte", icon: "🚚" },
    { id: "assignment" as const, label: "Asignación", icon: "📋" },
    { id: "kuhn-munkres" as const, label: "Kuhn-Munkres", icon: "🔢" },
    { id: "max-flow" as const, label: "Flujo Máx.", icon: "🌊" },
    { id: "min-cost-flow" as const, label: "Costo Mín.", icon: "💰" },
    { id: "cpm" as const, label: "CPM", icon: "📅" },
    { id: "pert" as const, label: "PERT", icon: "📊" },
    { id: "queues" as const, label: "Colas", icon: "⏱️" },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center py-8 px-4 sm:px-8">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Redes y Proyectos</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Asignación, Kuhn-Munkres, Flujo Máximo, Costo Mínimo, Transporte y CPM/PERT
            </p>
          </div>
          <nav className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-lg">
            <button
              onClick={() => window.location.href = "/"}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              📐 Programación Lineal
            </button>
            <button
              onClick={() => window.location.href = "/networks"}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
            >
              Redes, Asignación y Flujos
            </button>
          </nav>
        </div>

        {/* Pestañas grandes y centradas */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          {sections.map((s) => (
            <button
              key={s.id}
              id={`tab-network-${s.id}`}
              onClick={() => setSection(s.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                section === s.id
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {section === "transport" && <TransportSection />}
        {section === "assignment" && <AssignmentSection />}
        {section === "kuhn-munkres" && <KuhnMunkresSection />}
        {section === "max-flow" && <MaxFlowSection />}
        {section === "min-cost-flow" && <MinCostFlowSection />}
        {section === "cpm" && <CPMSection />}
        {section === "pert" && <PERTSection />}
        {section === "queues" && <QueuesSection />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TRANSPORTE
// ─────────────────────────────────────────────
function TransportSection() {
  const [method, setMethod] = useState("northwest");
  const [supply, setSupply] = useState([20, 30, 25]);
  const [demand, setDemand] = useState([15, 25, 35]);
  const [costs, setCosts] = useState([
    [2, 3, 1],
    [5, 4, 8],
    [5, 6, 8],
  ]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await solveTransport({ method, supply, demand, costs });
      setResult(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const addOrigin = () => {
    setSupply([...supply, 20]);
    setCosts([...costs, new Array(demand.length).fill(0)]);
  };
  const removeOrigin = () => {
    if (supply.length > 2) {
      setSupply(supply.slice(0, -1));
      setCosts(costs.slice(0, -1));
    }
  };
  const addDestination = () => {
    setDemand([...demand, 20]);
    setCosts(costs.map((row) => [...row, 0]));
  };
  const removeDestination = () => {
    if (demand.length > 2) {
      setDemand(demand.slice(0, -1));
      setCosts(costs.map((row) => row.slice(0, -1)));
    }
  };

  const m = supply.length;
  const n = demand.length;

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Problema de Transporte</h2>

          <div className="flex gap-2 flex-wrap mb-2">
            {[["add-orig", "+ Origen", addOrigin], ["del-orig", "− Origen", removeOrigin], ["add-dest", "+ Destino", addDestination], ["del-dest", "− Destino", removeDestination]].map(([idKey, label, fn]) => (
              <button key={label as string} onClick={fn as () => void} id={`transport-btn-${idKey}`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-all">
                {label as string}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Método de Solución</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="styled-select text-base py-3.5 px-4 w-full"
              id="transport-method"
            >
              <option value="northwest">Esquina Noroeste</option>
              <option value="min_cost">Costo Mínimo</option>
              <option value="vogel">Aproximación de Vogel</option>
            </select>
          </div>

          {/* Tabla de costos */}
          <div className="overflow-x-auto">
            <table className="simplex-table text-base w-full my-3">
              <thead>
                <tr>
                  <th className="py-3 px-3 text-center">Origen\Destino</th>
                  {demand.map((_, j) => (
                    <th key={j} className="py-3 px-3 text-center">D{j + 1}</th>
                  ))}
                  <th className="py-3 px-3 text-center text-teal-400 font-bold">Oferta</th>
                </tr>
              </thead>
              <tbody>
                {supply.map((s, i) => (
                  <tr key={i}>
                    <td className="basic-var-col font-bold text-center">O{i + 1}</td>
                    {demand.map((_, j) => (
                      <td key={j} className="py-3 px-2 text-center">
                        <input
                          type="number"
                          value={costs[i]?.[j] ?? 0}
                          onChange={(e) => {
                            const newCosts = costs.map((row) => [...row]);
                            newCosts[i][j] = Number(e.target.value);
                            setCosts(newCosts);
                          }}
                          className="number-input w-24 h-12 text-center font-bold text-base mx-auto block"
                          id={`cost-${i}-${j}`}
                        />
                      </td>
                    ))}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        value={s}
                        onChange={(e) => {
                          const arr = [...supply];
                          arr[i] = Number(e.target.value);
                          setSupply(arr);
                        }}
                        className="number-input w-24 h-12 text-center text-teal-300 font-bold text-base mx-auto block"
                        id={`supply-${i}`}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="text-blue-400 font-bold text-base text-center">Demanda</td>
                  {demand.map((d, j) => (
                    <td key={j} className="py-3 px-2 text-center">
                      <input
                        type="number"
                        value={d}
                        onChange={(e) => {
                          const arr = [...demand];
                          arr[j] = Number(e.target.value);
                          setDemand(arr);
                        }}
                        className="number-input w-24 h-12 text-center text-blue-300 font-bold text-base mx-auto block"
                        id={`demand-${j}`}
                      />
                    </td>
                  ))}
                  <td className="text-slate-400 text-xs font-semibold text-center">
                    {Math.abs(supply.reduce((a, b) => a + b, 0) - demand.reduce((a, b) => a + b, 0)) < 0.01
                      ? "✓ Balanceado"
                      : "⚠ Desbalanceado"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSolve}
            disabled={loading}
            className="btn-primary w-full mt-6 py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide"
            id="transport-solve-btn"
          >
            {loading ? "Resolviendo..." : "⚡ Resolver Transporte"}
          </button>
          {error && <div className="alert-error mt-3 text-sm">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Asignación Óptima</h3>
              <div className="alert-success py-1.5 px-4 text-base font-semibold">
                Costo Total: <strong className="text-teal-300 text-lg">{result.total_cost}</strong>
              </div>
            </div>
            {result.dummy_added && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                ⚠️ {result.dummy_added}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="simplex-table text-base w-full text-center">
                <thead>
                  <tr>
                    <th className="py-3">Origen</th>
                    {result.allocation[0]?.map((_: any, j: number) => (
                      <th key={j} className="py-3">D{j + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.allocation?.map((row: any[], i: number) => (
                    <tr key={i}>
                      <td className="basic-var-col font-bold">O{i + 1}</td>
                      {row.map((val, j) => (
                        <td key={j} className={`py-3 ${val !== null && val > 0 ? "text-teal-300 font-bold text-lg" : "text-slate-600"}`}>
                          {val !== null ? val : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CPM
// ─────────────────────────────────────────────
function CPMSection() {
  const [activities, setActivities] = useState([
    { id: "A", name: "Diseño", duration: 4, predecessors: [] },
    { id: "B", name: "Desarrollo", duration: 6, predecessors: ["A"] },
    { id: "C", name: "Pruebas", duration: 3, predecessors: ["B"] },
    { id: "D", name: "Documentación", duration: 2, predecessors: ["A"] },
    { id: "E", name: "Entrega", duration: 1, predecessors: ["C", "D"] },
  ]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addActivity = () => {
    const nextLetter = String.fromCharCode(65 + activities.length);
    setActivities([
      ...activities,
      { id: nextLetter, name: `Actividad ${nextLetter}`, duration: 1, predecessors: [] },
    ]);
  };
  const removeActivity = (idx: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== idx));
    }
  };

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await solveCPM({ activities });
      setResult(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Método de Ruta Crítica (CPM)
          </h2>
          <div className="space-y-2.5">
            {activities.map((act, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <span className="text-slate-400 font-bold w-5">{i + 1}</span>
                <input
                  value={act.id}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = { ...arr[i], id: e.target.value };
                    setActivities(arr);
                  }}
                  className="number-input w-16 h-11 text-center font-bold text-base"
                  placeholder="ID"
                  id={`act-id-${i}`}
                />
                <input
                  value={act.name}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = { ...arr[i], name: e.target.value };
                    setActivities(arr);
                  }}
                  className="number-input flex-1 h-11 text-base px-3"
                  placeholder="Nombre"
                  id={`act-name-${i}`}
                />
                <input
                  type="number"
                  value={act.duration}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = { ...arr[i], duration: Number(e.target.value) };
                    setActivities(arr);
                  }}
                  className="number-input w-20 h-11 text-center font-bold text-base"
                  placeholder="Dur."
                  id={`act-dur-${i}`}
                />
                <input
                  value={act.predecessors.join(",")}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = {
                      ...arr[i],
                      predecessors: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    };
                    setActivities(arr);
                  }}
                  className="number-input w-28 h-11 text-center text-sm font-semibold"
                  placeholder="Pred. (A,B)"
                  id={`act-pred-${i}`}
                />
                <button
                  onClick={() => removeActivity(i)}
                  className="text-red-400 hover:text-red-300 font-bold px-2 text-sm"
                  id={`cpm-del-${i}`}
                >✕</button>
              </div>
            ))}
            <button
              onClick={addActivity}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-1 inline-block"
              id="cpm-add-btn"
            >
              + Agregar actividad
            </button>
          </div>
          <button
            onClick={handleSolve}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide"
            id="cpm-solve-btn"
          >
            {loading ? "Calculando..." : "⚡ Calcular CPM"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Resultados CPM</h3>
              <span className="badge badge-optimal text-base px-3 py-1 font-semibold">
                Duración: {result.project_duration} días
              </span>
            </div>
            <div className="text-base bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
              <span className="text-slate-400 font-semibold">Ruta Crítica: </span>
              <span className="text-rose-400 font-bold text-lg font-mono">
                {result.critical_path?.join(" → ")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="simplex-table text-sm w-full text-center">
                <thead>
                  <tr>
                    <th>Act.</th>
                    <th>ES</th>
                    <th>EF</th>
                    <th>LS</th>
                    <th>LF</th>
                    <th>Holgura</th>
                    <th>Crítica</th>
                  </tr>
                </thead>
                <tbody>
                  {result.activities?.map((a: any) => (
                    <tr key={a.id} className={a.is_critical ? "bg-rose-500/10 font-bold" : ""}>
                      <td className="basic-var-col">{a.name}</td>
                      <td>{a.ES}</td>
                      <td>{a.EF}</td>
                      <td>{a.LS}</td>
                      <td>{a.LF}</td>
                      <td className={a.is_critical ? "text-rose-400 font-bold" : ""}>{a.slack}</td>
                      <td>
                        {a.is_critical ? (
                          <span className="badge badge-critical text-xs">✓ SÍ</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  PERT
// ─────────────────────────────────────────────
function PERTSection() {
  const [activities, setActivities] = useState([
    { id: "A", name: "Planificación", optimistic: 2, most_likely: 4, pessimistic: 6, predecessors: [] },
    { id: "B", name: "Desarrollo", optimistic: 5, most_likely: 8, pessimistic: 12, predecessors: ["A"] },
    { id: "C", name: "Pruebas", optimistic: 2, most_likely: 4, pessimistic: 7, predecessors: ["B"] },
  ]);
  const [targetTime, setTargetTime] = useState<number | "">("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addActivity = () => {
    const nextLetter = String.fromCharCode(65 + activities.length);
    setActivities([
      ...activities,
      { id: nextLetter, name: `Actividad ${nextLetter}`, optimistic: 1, most_likely: 2, pessimistic: 3, predecessors: [] },
    ]);
  };
  const removeActivity = (idx: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== idx));
    }
  };

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await solvePERT({
        activities,
        target_time: targetTime !== "" ? Number(targetTime) : null,
      });
      setResult(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-1">PERT — 3 Estimados de Tiempo</h2>
          <div className="text-sm text-slate-400 mb-2">
            <KaTeXDisplay latex="t_e = \\frac{t_o + 4t_m + t_p}{6}, \\ \\sigma^2 = \\left(\\frac{t_p - t_o}{6}\\right)^2" />
          </div>
          <div className="space-y-2.5">
            <div className="grid grid-cols-7 gap-2 text-slate-400 font-semibold px-1 text-xs uppercase tracking-wider">
              <span>ID</span>
              <span className="col-span-2">Nombre</span>
              <span className="text-center">to</span>
              <span className="text-center">tm</span>
              <span className="text-center">tp</span>
              <span></span>
            </div>
            {activities.map((act, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 items-center">
                <input
                  value={act.id}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = { ...arr[i], id: e.target.value };
                    setActivities(arr);
                  }}
                  className="number-input text-center h-11 text-base font-bold"
                  id={`pert-id-${i}`}
                />
                <input
                  value={act.name}
                  onChange={(e) => {
                    const arr = [...activities];
                    arr[i] = { ...arr[i], name: e.target.value };
                    setActivities(arr);
                  }}
                  className="number-input col-span-2 h-11 text-base px-3"
                  id={`pert-name-${i}`}
                />
                {(["optimistic", "most_likely", "pessimistic"] as const).map((field) => (
                  <input
                    key={field}
                    type="number"
                    value={act[field]}
                    onChange={(e) => {
                      const arr = [...activities];
                      arr[i] = { ...arr[i], [field]: Number(e.target.value) };
                      setActivities(arr);
                    }}
                    className="number-input text-center h-11 text-base font-bold"
                    id={`pert-${field}-${i}`}
                  />
                ))}
                <button
                  onClick={() => removeActivity(i)}
                  className="text-red-400 hover:text-red-300 font-bold px-2 text-sm"
                  id={`pert-del-${i}`}
                >✕</button>
              </div>
            ))}
            <button
              onClick={addActivity}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-1 inline-block"
              id="pert-add-btn"
            >
              + Agregar actividad
            </button>
          </div>
          <div className="flex gap-3 items-center pt-2">
            <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">
              Tiempo objetivo (para P):
            </label>
            <input
              type="number"
              value={targetTime}
              onChange={(e) =>
                setTargetTime(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="number-input w-32 h-11 text-center font-bold text-base"
              placeholder="Opcional"
              id="pert-target-time"
            />
          </div>
          <button
            onClick={handleSolve}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide"
            id="pert-solve-btn"
          >
            {loading ? "Calculando..." : "⚡ Calcular PERT"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white pb-3 border-b border-white/10">Resultados PERT</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="text-xs text-slate-400 font-semibold mb-1">Duración Esperada</div>
                <div className="text-2xl font-black text-blue-300">
                  {result.expected_duration}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="text-xs text-slate-400 font-semibold mb-1">Desviación Estándar</div>
                <div className="text-2xl font-black text-violet-300">
                  {result.project_std_dev?.toFixed(4)}
                </div>
              </div>
            </div>
            {result.probability_data && (
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
                <p className="text-teal-300 font-semibold mb-1">Probabilidad de completar en T={result.probability_data.target_time}</p>
                <div className="flex gap-4 items-center text-sm">
                  <span className="text-slate-400">Z = {result.probability_data.Z_score}</span>
                  <span className="text-teal-400 font-extrabold text-xl">
                    P = {(result.probability_data.probability * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="simplex-table text-sm w-full text-center">
                <thead>
                  <tr>
                    <th>Act.</th>
                    <th><KaTeXDisplay latex="t_e" /></th>
                    <th><KaTeXDisplay latex="\\sigma^2" /></th>
                    <th>Holgura</th>
                    <th>Crítica</th>
                  </tr>
                </thead>
                <tbody>
                  {result.activities?.map((a: any) => (
                    <tr key={a.id} className={a.is_critical ? "bg-rose-500/10 font-bold" : ""}>
                      <td className="basic-var-col">{a.name}</td>
                      <td>{a.expected_time}</td>
                      <td>{a.variance?.toFixed(4)}</td>
                      <td>{a.slack}</td>
                      <td>
                        {a.is_critical ? (
                          <span className="badge badge-critical text-xs">✓ SÍ</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  COLAS
// ─────────────────────────────────────────────
function QueuesSection() {
  const [model, setModel] = useState("MM1");
  const [lambda, setLambda] = useState(4);
  const [mu, setMu] = useState(6);
  const [servers, setServers] = useState(2);
  const [maxN, setMaxN] = useState(15);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await solveQueues({
        model,
        lambda_rate: lambda,
        mu_rate: mu,
        servers,
        max_n: maxN,
      });
      setResult(res);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const metrics = result
    ? [
        { label: "ρ — Utilización", value: result.rho, latex: "\\rho", color: "text-amber-300" },
        { label: "L — Clientes en sistema", value: result.L, latex: "L", color: "text-blue-300" },
        { label: "Lq — Clientes en cola", value: result.Lq, latex: "L_q", color: "text-blue-300" },
        { label: "W — Tiempo en sistema", value: result.W, latex: "W", color: "text-violet-300" },
        { label: "Wq — Tiempo en cola", value: result.Wq, latex: "W_q", color: "text-violet-300" },
        { label: "P₀ — Sistema vacío", value: result.P0, latex: "P_0", color: "text-teal-300" },
      ]
    : [];

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Teoría de Colas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Modelo</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="styled-select text-base py-3.5 px-4 w-full"
                id="queue-model"
              >
                <option value="MM1">M/M/1</option>
                <option value="MMs">M/M/s</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <KaTeXDisplay latex="\\lambda" /> — Tasa de llegada
              </label>
              <input
                type="number"
                value={lambda}
                onChange={(e) => setLambda(Number(e.target.value))}
                className="number-input w-full h-12 text-center font-bold text-lg"
                step="0.1"
                id="queue-lambda"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <KaTeXDisplay latex="\\mu" /> — Tasa de servicio
              </label>
              <input
                type="number"
                value={mu}
                onChange={(e) => setMu(Number(e.target.value))}
                className="number-input w-full h-12 text-center font-bold text-lg"
                step="0.1"
                id="queue-mu"
              />
            </div>
            {model === "MMs" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  s — Servidores
                </label>
                <input
                  type="number"
                  min={1}
                  value={servers}
                  onChange={(e) => setServers(Number(e.target.value))}
                  className="number-input w-full h-12 text-center font-bold text-lg"
                  id="queue-servers"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                N máximo para Pn
              </label>
              <input
                type="number"
                min={5}
                value={maxN}
                onChange={(e) => setMaxN(Number(e.target.value))}
                className="number-input w-full h-12 text-center font-bold text-lg"
                id="queue-maxn"
              />
            </div>
          </div>
          <button
            onClick={handleSolve}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide"
            id="queue-solve-btn"
          >
            {loading ? "Calculando..." : "⚡ Calcular Modelo de Colas"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Resultados {result.model}</h3>
              <span className={`badge text-base px-3 py-1 font-semibold ${result.rho < 0.8 ? "badge-optimal" : "badge-critical"}`}>
                ρ = {result.rho?.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <KaTeXDisplay latex={m.latex} className="text-slate-400 text-xs" />
                    <span className="text-xs text-slate-500">—</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {m.label.split("—")[1]}
                    </span>
                  </div>
                  <div className={`text-2xl font-black font-mono ${m.color}`}>
                    {typeof m.value === "number" ? m.value.toFixed(4) : m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla Pn */}
            {result.Pn && result.Pn.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Distribución P(n)
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10">
                  <table className="simplex-table text-sm w-full text-center">
                    <thead>
                      <tr>
                        <th>n</th>
                        <th>P(n)</th>
                        <th>P(n) %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.Pn.map((p: { n: number; Pn: number }) => (
                        <tr key={p.n}>
                          <td className="font-bold">{p.n}</td>
                          <td className="text-blue-300 font-mono">{p.Pn.toFixed(6)}</td>
                          <td className="text-slate-300 font-semibold">
                            {(p.Pn * 100).toFixed(3)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CÓDIGO DEL ALGORITMO — Visor de código fuente
// ─────────────────────────────────────────────

const ALGORITHM_CODE: Record<string, string> = {
  assignment: `# Método Húngaro — Problema de Asignación
# Auto-balancea matrices no cuadradas con filas/columnas ficticias.

from scipy.optimize import linear_sum_assignment
import numpy as np

def solve_assignment(cost_matrix, problem_type="MIN"):
    orig = np.array(cost_matrix, dtype=float)
    n_rows, n_cols = orig.shape
    n = max(n_rows, n_cols)
    
    # Pad to square
    matrix = np.zeros((n, n), dtype=float)
    matrix[:n_rows, :n_cols] = orig
    
    if problem_type == "MAX":
        row_ind, col_ind = linear_sum_assignment(-matrix)
    else:
        row_ind, col_ind = linear_sum_assignment(matrix)
    
    total = sum(orig[r, c] for r, c in zip(row_ind, col_ind)
                if r < n_rows and c < n_cols)
    return total, [(r, c) for r, c in zip(row_ind, col_ind)]`,

  "kuhn-munkres": `# Algoritmo de Kuhn-Munkres — Paso a Paso
# Implementación explícita con historial matricial completo.

import numpy as np
from scipy.optimize import linear_sum_assignment

def solve_kuhn_munkres(cost_matrix, problem_type="MIN"):
    matrix = np.array(cost_matrix, dtype=float)
    steps = []

    # Paso 1: Reducción por filas
    row_min = matrix.min(axis=1, keepdims=True)
    matrix -= row_min
    steps.append({"step": "Reducción por filas", "matrix": matrix.tolist()})

    # Paso 2: Reducción por columnas
    col_min = matrix.min(axis=0, keepdims=True)
    matrix -= col_min
    steps.append({"step": "Reducción por columnas", "matrix": matrix.tolist()})

    # Paso 3+: Cobertura mínima de ceros y ajuste con Δ
    while True:
        zero_mask = (matrix == 0).astype(float)
        ri, ci = linear_sum_assignment(-zero_mask)
        n_zeros = sum(1 for r, c in zip(ri, ci) if matrix[r, c] == 0)
        
        if n_zeros == len(matrix):
            break  # Asignación óptima encontrada
        
        # Calcular Δ y ajustar matriz
        delta = matrix[matrix > 0].min()
        matrix[~covered_rows, :][:, ~covered_cols] -= delta
        matrix[covered_rows, :][:, covered_cols] += delta

    return steps, ri, ci`,

  "max-flow": `# Flujo Máximo — Edmonds-Karp (BFS)
# Devuelve rutas de aumento con su cuello de botella.

from collections import deque

def solve_max_flow(edges, source, sink):
    # Construir grafo de capacidades
    capacity = {}
    for e in edges:
        u, v, c = e["source"], e["target"], e["capacity"]
        capacity.setdefault(u, {})[v] = capacity.get(u, {}).get(v, 0) + c
        capacity.setdefault(v, {}).setdefault(u, 0)

    flow = {u: {v: 0 for v in capacity[u]} for u in capacity}
    total_flow = 0
    paths = []

    while True:
        # BFS para encontrar ruta de aumento
        parent = {source: None}
        queue = deque([source])
        while queue and sink not in parent:
            u = queue.popleft()
            for v in capacity.get(u, {}):
                residual = capacity[u][v] - flow[u].get(v, 0)
                if v not in parent and residual > 0:
                    parent[v] = u
                    queue.append(v)
        
        if sink not in parent:
            break  # No hay más rutas de aumento

        # Reconstruir ruta y calcular cuello de botella
        path, node = [], sink
        while node != source:
            path.append((parent[node], node))
            node = parent[node]
        path.reverse()
        bottleneck = min(
            capacity[u][v] - flow[u].get(v, 0)
            for u, v in path
        )
        
        # Actualizar flujos
        for u, v in path:
            flow[u][v] = flow[u].get(v, 0) + bottleneck
            flow[v][u] = flow[v].get(u, 0) - bottleneck
        
        total_flow += bottleneck
        paths.append({"path": path, "bottleneck": bottleneck})

    return total_flow, flow, paths`,

  "min-cost-flow": `# Flujo a Costo Mínimo — NetworkX
# Verifica balance (Σb_i = 0) y resuelve con SSP algorithm.

import networkx as nx

def solve_min_cost_flow(nodes, edges):
    # Validar balance: suma de ofertas/demandas = 0
    total = sum(n["demand"] for n in nodes)
    if abs(total) > 1e-6:
        raise ValueError(f"Red desbalanceada: Σb_i = {total}")

    G = nx.DiGraph()
    for n in nodes:
        # Convención: oferta+ en usuario → demanda- en nx
        G.add_node(n["id"], demand=-n["demand"])
    
    for e in edges:
        G.add_edge(
            e["source"], e["target"],
            capacity=e["capacity"],
            weight=e["cost"],
            lower=e.get("min_capacity", 0)
        )

    # Resolver con Successive Shortest Paths
    flow_dict = nx.min_cost_flow(G)

    # Calcular costo total
    total_cost = sum(
        flow_dict[u][v] * G[u][v]["weight"]
        for u in flow_dict for v in flow_dict[u]
        if G.has_edge(u, v)
    )
    return total_cost, flow_dict`,
};

function CodeViewer({ algo }: { algo: string }) {
  const [open, setOpen] = useState(false);
  const code = ALGORITHM_CODE[algo] ?? "// Código no disponible";

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-500/40 text-orange-400 text-sm font-mono hover:bg-orange-500/10 transition-all"
      >
        <span>{open ? "▼" : "▶"}</span>
        {"</>"} Código del Algoritmo
      </button>
      {open && (
        <div className="mt-3 rounded-xl bg-slate-900/80 border border-white/10 overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
            <span className="text-xs text-slate-500 font-mono">Python</span>
            <button
              onClick={() => navigator.clipboard?.writeText(code)}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              📋 Copiar
            </button>
          </div>
          <pre className="p-4 text-xs text-green-300 font-mono whitespace-pre leading-relaxed overflow-x-auto">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
//  ASIGNACIÓN
// ─────────────────────────────────────────────
function AssignmentSection() {
  const [matrix, setMatrix] = useState([
    [9, 2, 7],
    [3, 6, 3],
    [5, 8, 1],
  ]);
  const [type, setType] = useState<"MIN" | "MAX">("MIN");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = matrix.length;
  const m = matrix[0]?.length ?? 0;

  const addRow = () => setMatrix([...matrix, Array(m).fill(0)]);
  const removeRow = () => matrix.length > 2 && setMatrix(matrix.slice(0, -1));
  const addCol = () => setMatrix(matrix.map((r) => [...r, 0]));
  const removeCol = () => m > 2 && setMatrix(matrix.map((r) => r.slice(0, -1)));

  const handleSolve = async () => {
    setLoading(true); setError(null);
    try {
      const res = await solveAssignment({ cost_matrix: matrix, type });
      setResult(res);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Problema de Asignación</h2>
            <div className="flex gap-2">
              {(["MIN", "MAX"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    type === t ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-white/5 text-slate-400 hover:text-white"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[["+ Fila", addRow], ["− Fila", removeRow], ["+ Col", addCol], ["− Col", removeCol]].map(([label, fn]) => (
              <button key={label as string} onClick={fn as () => void}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-all">
                {label as string}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="simplex-table text-base w-full my-3 text-center">
              <thead>
                <tr>
                  <th className="py-3 px-3">Agente\Tarea</th>
                  {Array.from({ length: m }, (_, j) => <th key={j} className="py-3 px-3">T{j + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="basic-var-col font-bold">A{i + 1}</td>
                    {row.map((val, j) => (
                      <td key={j} className="py-3 px-2">
                        <input type="number" value={val}
                          onChange={(e) => {
                            const m2 = matrix.map((r) => [...r]);
                            m2[i][j] = Number(e.target.value);
                            setMatrix(m2);
                          }}
                          className="number-input w-24 h-12 text-center font-bold text-base mx-auto block"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button id="assignment-solve-btn" onClick={handleSolve} disabled={loading} className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide">
            {loading ? "Resolviendo..." : `⚡ Resolver Asignación (${type})`}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
          <CodeViewer algo="assignment" />
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Asignación Óptima</h3>
              <div className="alert-success py-1.5 px-4 text-base font-semibold">
                {type === "MIN" ? "Costo" : "Beneficio"} Total:{" "}
                <strong className="text-teal-300 text-lg">{result.total_cost}</strong>
              </div>
            </div>
            <div className="space-y-3">
              {result.assignments?.map((a: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white text-base font-medium">{a.agent} → {a.task}</span>
                  <span className="text-teal-300 font-mono text-base font-bold">{a.cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
//  KUHN-MUNKRES (Paso a Paso)
// ─────────────────────────────────────────────
function KuhnMunkresSection() {
  const [matrix, setMatrix] = useState([
    [8, 4, 7],
    [5, 2, 3],
    [9, 4, 8],
  ]);
  const [type, setType] = useState<"MIN" | "MAX">("MIN");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  const n = matrix.length;
  const m = matrix[0]?.length ?? 0;

  const handleSolve = async () => {
    setLoading(true); setError(null); setStepIdx(0);
    try {
      const res = await solveKuhnMunkres({ cost_matrix: matrix, type });
      setResult(res);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const steps = result?.steps ?? [];
  const currentStep = steps[stepIdx];

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Kuhn-Munkres Paso a Paso</h2>
            <div className="flex gap-2">
              {(["MIN", "MAX"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    type === t ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-white/5 text-slate-400 hover:text-white"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="simplex-table text-base w-full my-3 text-center">
              <thead>
                <tr>
                  <th className="py-3 px-3">Agente\Tarea</th>
                  {Array.from({ length: m }, (_, j) => <th key={j} className="py-3 px-3">T{j + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="basic-var-col font-bold">A{i + 1}</td>
                    {row.map((val, j) => (
                      <td key={j} className="py-3 px-2">
                        <input type="number" value={val}
                          onChange={(e) => {
                            const m2 = matrix.map((r) => [...r]);
                            m2[i][j] = Number(e.target.value);
                            setMatrix(m2);
                          }}
                          className="number-input w-24 h-12 text-center font-bold text-base mx-auto block"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button id="km-solve-btn" onClick={handleSolve} disabled={loading} className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide">
            {loading ? "Calculando..." : "⚡ Ejecutar Kuhn-Munkres"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}

          {result && (
            <div className="alert-success py-2.5 px-4 text-base flex justify-between font-semibold">
              <span>Costo Total Óptimo:</span>
              <strong className="text-teal-300 text-lg">{result.total_cost}</strong>
            </div>
          )}
          <CodeViewer algo="kuhn-munkres" />
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          {steps.length > 0 && (
            <div className="glass-card p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">
                  {currentStep?.step ?? "Resultado"}
                </h3>
                <span className="text-xs text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  {stepIdx + 1} / {steps.length}
                </span>
              </div>

              {currentStep?.description && (
                <p className="text-xs text-slate-300 bg-white/5 rounded-xl p-3.5 border border-white/10 leading-relaxed">
                  {currentStep.description}
                </p>
              )}

              {currentStep?.delta !== undefined && (
                <div className="text-amber-400 text-sm font-mono font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
                  Δ = {currentStep.delta?.toFixed(4)}
                </div>
              )}

              {currentStep?.matrix && (
                <div className="overflow-x-auto">
                  <table className="simplex-table text-sm w-full text-center">
                    <thead>
                      <tr>
                        <th className="py-2.5"></th>
                        {currentStep.col_names?.map((c: string) => <th key={c} className="py-2.5">{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {currentStep.matrix.map((row: number[], i: number) => (
                        <tr key={i}>
                          <td className="basic-var-col font-bold">{currentStep.row_names?.[i] ?? `A${i+1}`}</td>
                          {row.map((val: number, j: number) => {
                            const isAssigned = currentStep.assignments?.some(
                              (a: any) => a.row === i && a.col === j
                            );
                            const isZero = Math.abs(val) < 1e-9;
                            return (
                              <td key={j} className={`py-2.5 ${
                                isAssigned
                                  ? "bg-teal-500/25 text-teal-300 font-bold"
                                  : isZero
                                  ? "text-orange-400 font-semibold"
                                  : ""
                              }`}>
                                {Math.abs(val) < 1e-9 ? "0" : val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentStep?.is_final && (
                <div className="alert-success text-sm font-semibold">
                  ✅ Asignación óptima encontrada
                </div>
              )}

              <div className="flex gap-3 justify-between pt-2">
                <button id="km-prev-step-btn" disabled={stepIdx === 0}
                  onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                  className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40">
                  ◀ Anterior
                </button>
                <button id="km-next-step-btn" disabled={stepIdx === steps.length - 1}
                  onClick={() => setStepIdx(Math.min(steps.length - 1, stepIdx + 1))}
                  className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40">
                  Siguiente ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
//  FLUJO MÁXIMO
// ─────────────────────────────────────────────
function MaxFlowSection() {
  const [edges, setEdges] = useState([
    { source: "s", target: "A", capacity: 15 },
    { source: "s", target: "B", capacity: 4 },
    { source: "A", target: "B", capacity: 10 },
    { source: "A", target: "C", capacity: 12 },
    { source: "B", target: "C", capacity: 10 },
    { source: "B", target: "t", capacity: 10 },
    { source: "C", target: "t", capacity: 7 },
  ]);
  const [source, setSource] = useState("s");
  const [sink, setSink] = useState("t");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allNodes = Array.from(new Set(edges.flatMap((e) => [e.source, e.target])));

  const handleSolve = async () => {
    setLoading(true); setError(null);
    try {
      const res = await solveMaxFlow({ edges, source, sink });
      setResult(res);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const addEdge = () => setEdges([...edges, { source: "s", target: "t", capacity: 10 }]);
  const removeEdge = (i: number) => setEdges(edges.filter((_, idx) => idx !== i));

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Flujo Máximo (Edmonds-Karp)</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nodo Fuente (s)</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} className="number-input w-full h-12 text-center font-bold text-lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nodo Sumidero (t)</label>
              <input value={sink} onChange={(e) => setSink(e.target.value)} className="number-input w-full h-12 text-center font-bold text-lg" />
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 font-semibold px-1">
              <span>Origen</span><span>Destino</span><span>Capacidad</span><span></span>
            </div>
            {edges.map((edge, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input value={edge.source}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], source: e.target.value}; setEdges(a); }}
                  className="number-input text-center text-base font-bold h-11" />
                <input value={edge.target}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], target: e.target.value}; setEdges(a); }}
                  className="number-input text-center text-base font-bold h-11" />
                <input type="number" value={edge.capacity}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], capacity: Number(e.target.value)}; setEdges(a); }}
                  className="number-input text-center text-base font-bold h-11" />
                <button onClick={() => removeEdge(i)} className="text-red-400 hover:text-red-300 text-sm font-bold">✕</button>
              </div>
            ))}
            <button onClick={addEdge} className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-2 inline-block">
              + Agregar arista
            </button>
          </div>

          <button id="maxflow-solve-btn" onClick={handleSolve} disabled={loading} className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide">
            {loading ? "Calculando..." : "⚡ Calcular Flujo Máximo"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
          <CodeViewer algo="max-flow" />
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Resultado</h3>
              <div className="alert-success px-4 py-1.5 text-base font-semibold">
                Flujo Máximo: <strong className="text-teal-300 text-lg">{result.max_flow}</strong>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-slate-400 uppercase">Flujo por Arista</h4>
            <div className="overflow-x-auto">
              <table className="simplex-table text-sm w-full text-center">
                <thead>
                  <tr><th>Arista</th><th>Flujo</th><th>Capacidad</th><th>%</th></tr>
                </thead>
                <tbody>
                  {result.flow_on_edges?.map((e: any, i: number) => (
                    <tr key={i} className={e.flow > 0 ? "bg-teal-500/5" : ""}>
                      <td className="font-mono">{e.source} → {e.target}</td>
                      <td className="text-teal-300 font-bold">{e.flow}</td>
                      <td>{e.capacity}</td>
                      <td className="text-slate-400">{((e.flow / e.capacity) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.flow_on_edges && (
            <FlowNetworkDiagram
              edges={result.flow_on_edges}
              source={source}
              sink={sink}
            />
          )}

          {result.augmenting_paths?.length > 0 && (
            <div className="glass-card p-6 md:p-8 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Rutas de Aumento</h4>
              {result.augmenting_paths.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
                  <span className="text-base font-mono text-white">{p.path?.join(" → ")}</span>
                  <span className="ml-auto text-orange-400 text-xs font-bold bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    Cuello: {p.bottleneck}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowNetworkDiagram({ edges, source, sink }: { edges: any[]; source: string; sink: string }) {
  const nodeSet = new Set<string>();
  edges.forEach((e) => {
    nodeSet.add(e.source);
    nodeSet.add(e.target);
  });
  const nodes = Array.from(nodeSet);

  const width = 480;
  const height = 220;
  const padding = 50;

  const intermediates = nodes.filter((n) => n !== source && n !== sink);
  const pos: Record<string, { x: number; y: number }> = {};
  pos[source] = { x: padding, y: height / 2 };
  pos[sink] = { x: width - padding, y: height / 2 };

  intermediates.forEach((n, i) => {
    const colCount = Math.ceil(intermediates.length / 2);
    const col = Math.floor(i / 2);
    const row = i % 2;
    const x = padding + ((col + 1) / (colCount + 1)) * (width - 2 * padding);
    const y = row === 0 ? height * 0.25 : height * 0.75;
    pos[n] = { x, y };
  });

  return (
    <div className="glass-card p-4 space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase">Diagrama de Red</h4>
      <div className="w-full overflow-x-auto flex justify-center">
        <svg width={width} height={height} className="rounded-lg bg-slate-950/40 border border-white/5">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#14b8a6" />
            </marker>
            <marker id="arrow-gray" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {edges.map((e, i) => {
            const p1 = pos[e.source] || { x: 50, y: 50 };
            const p2 = pos[e.target] || { x: 100, y: 100 };
            const active = e.flow > 0;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 8;
            return (
              <g key={i}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={active ? "#14b8a6" : "#475569"}
                  strokeWidth={active ? 2.5 : 1}
                  markerEnd={active ? "url(#arrow)" : "url(#arrow-gray)"}
                />
                <text
                  x={midX}
                  y={midY}
                  fill={active ? "#2dd4bf" : "#94a3b8"}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {e.flow}/{e.capacity}
                </text>
              </g>
            );
          })}

          {nodes.map((n) => {
            const p = pos[n] || { x: 50, y: 50 };
            const isSrc = n === source;
            const isSnk = n === sink;
            return (
              <g key={n}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="16"
                  fill={isSrc ? "#0284c7" : isSnk ? "#e11d48" : "#1e293b"}
                  stroke={isSrc ? "#38bdf8" : isSnk ? "#fb7185" : "#64748b"}
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {n}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
//  FLUJO A COSTO MÍNIMO
// ─────────────────────────────────────────────
function MinCostFlowSection() {
  const [nodes, setNodes] = useState([
    { id: "s", demand: 20 },
    { id: "A", demand: 0 },
    { id: "B", demand: 0 },
    { id: "t", demand: -20 },
  ]);
  const [edges, setEdges] = useState([
    { source: "s", target: "A", capacity: 15, cost: 2 },
    { source: "s", target: "B", capacity: 10, cost: 5 },
    { source: "A", target: "t", capacity: 15, cost: 3 },
    { source: "B", target: "t", capacity: 12, cost: 1 },
  ]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBalance = nodes.reduce((s, n) => s + n.demand, 0);
  const isBalanced = Math.abs(totalBalance) < 0.01;

  const handleSolve = async () => {
    setLoading(true); setError(null);
    try {
      const res = await solveMinCostFlow({ nodes, edges });
      setResult(res);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className={`w-full transition-all ${result ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col items-center"}`}>
      <div className={`space-y-4 w-full ${!result ? "max-w-4xl" : ""}`}>
        <div className="glass-card p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Flujo a Costo Mínimo</h2>

          {/* Nodos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nodos (oferta/demanda b_i)</h3>
              <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                isBalanced ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                Σb_i = {totalBalance.toFixed(1)} {isBalanced ? "✓ Balanceado" : "⚠ Desbalanceado"}
              </div>
            </div>
            <div className="space-y-2">
              {nodes.map((node, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={node.id}
                    onChange={(e) => { const a = [...nodes]; a[i] = {...a[i], id: e.target.value}; setNodes(a); }}
                    className="number-input w-20 text-center text-sm font-bold h-11" placeholder="ID" />
                  <input type="number" value={node.demand}
                    onChange={(e) => { const a = [...nodes]; a[i] = {...a[i], demand: Number(e.target.value)}; setNodes(a); }}
                    className="number-input flex-1 text-sm font-semibold h-11"
                    placeholder="b_i (+oferta / -demanda / 0=transb.)" />
                  <button onClick={() => nodes.length > 2 && setNodes(nodes.filter((_, j) => j !== i))}
                    className="text-red-400 text-sm hover:text-red-300 font-bold px-2">✕</button>
                </div>
              ))}
              <button onClick={() => setNodes([...nodes, { id: `N${nodes.length + 1}`, demand: 0 }])}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-1 inline-block">+ Agregar nodo</button>
            </div>
          </div>

          {/* Aristas */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aristas</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 font-semibold px-1">
                <span>Origen</span><span>Destino</span><span>Cap.</span><span>Costo</span><span></span>
              </div>
              {edges.map((edge, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <input value={edge.source}
                    onChange={(e) => { const a = [...edges]; a[i] = {...a[i], source: e.target.value}; setEdges(a); }}
                    className="number-input text-center text-sm font-bold h-10" />
                  <input value={edge.target}
                    onChange={(e) => { const a = [...edges]; a[i] = {...a[i], target: e.target.value}; setEdges(a); }}
                    className="number-input text-center text-sm font-bold h-10" />
                  <input type="number" value={edge.capacity}
                    onChange={(e) => { const a = [...edges]; a[i] = {...a[i], capacity: Number(e.target.value)}; setEdges(a); }}
                    className="number-input text-center text-sm font-bold h-10" />
                  <input type="number" value={edge.cost}
                    onChange={(e) => { const a = [...edges]; a[i] = {...a[i], cost: Number(e.target.value)}; setEdges(a); }}
                    className="number-input text-center text-sm font-bold h-10" />
                  <button onClick={() => setEdges(edges.filter((_, j) => j !== i))}
                    className="text-red-400 text-sm hover:text-red-300 font-bold">✕</button>
                </div>
              ))}
              <button
                onClick={() => setEdges([...edges, { source: nodes[0]?.id ?? "s", target: nodes[nodes.length-1]?.id ?? "t", capacity: 10, cost: 1 }])}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-1 inline-block">+ Agregar arista</button>
            </div>
          </div>

          <button id="mincostflow-solve-btn" onClick={handleSolve} disabled={loading || !isBalanced} className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-orange-500/25 tracking-wide disabled:opacity-50">
            {loading ? "Calculando..." : isBalanced ? "⚡ Calcular Flujo a Costo Mínimo" : "⚠ Red desbalanceada"}
          </button>
          {error && <div className="alert-error text-sm">{error}</div>}
          <CodeViewer algo="min-cost-flow" />
        </div>
      </div>

      {result && (
        <div className="space-y-4 w-full">
          <div className="glass-card p-6 md:p-8 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Resultado Óptimo</h3>
              <div className="alert-success px-4 py-1.5 text-base font-semibold">
                Costo Total Mínimo:{" "}
                <strong className="text-teal-300 text-lg">{result.total_cost}</strong>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="simplex-table text-sm w-full text-center">
                <thead>
                  <tr><th>Arco</th><th>Flujo</th><th>Cap.</th><th>Costo/u</th><th>Costo Arco</th></tr>
                </thead>
                <tbody>
                  {result.flow_on_edges?.map((e: any, i: number) => (
                    <tr key={i} className={e.flow > 0 ? "bg-teal-500/5" : "opacity-50"}>
                      <td className="font-mono">{e.source} → {e.target}</td>
                      <td className={e.flow > 0 ? "text-teal-300 font-bold text-base" : "text-slate-600"}>{e.flow}</td>
                      <td>{e.capacity}</td>
                      <td className="text-slate-400">${e.cost_per_unit}</td>
                      <td className={e.arc_cost > 0 ? "text-orange-400 font-bold" : "text-slate-600"}>
                        ${e.arc_cost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
