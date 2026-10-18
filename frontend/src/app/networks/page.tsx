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
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🕸️</span>
              <h1 className="text-3xl font-bold text-white">Redes y Proyectos</h1>
            </div>
            <p className="text-slate-400">
              Transporte, Asignación, CPM/PERT y Teoría de Colas con visualización completa.
            </p>
          </div>
          <select
            className="bg-slate-800/50 border border-white/10 text-white text-sm rounded-lg px-4 py-2 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            value="networks"
            onChange={(e) => {
              if (e.target.value === "linear") window.location.href = "/";
            }}
          >
            <option value="linear">📐 Programación Lineal</option>
            <option value="networks">🕸️ Redes y Proyectos</option>
            <option value="queues">🕒 Teoría de Colas</option>
            <option value="advanced">📈 Modelos Avanzados</option>
          </select>
        </div>

        <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit mb-8 border border-white/8">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                section === s.id
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {s.icon} {s.label}
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

  const m = supply.length;
  const n = demand.length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Problema de Transporte</h2>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1.5">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="styled-select"
              id="transport-method"
            >
              <option value="northwest">Esquina Noroeste</option>
              <option value="min_cost">Costo Mínimo</option>
              <option value="vogel">Aproximación de Vogel</option>
            </select>
          </div>

          {/* Tabla de costos */}
          <div className="overflow-x-auto">
            <table className="simplex-table text-xs">
              <thead>
                <tr>
                  <th>Origen\Destino</th>
                  {demand.map((_, j) => (
                    <th key={j}>D{j + 1}</th>
                  ))}
                  <th className="text-teal-400">Oferta</th>
                </tr>
              </thead>
              <tbody>
                {supply.map((s, i) => (
                  <tr key={i}>
                    <td className="basic-var-col">O{i + 1}</td>
                    {demand.map((_, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          value={costs[i]?.[j] ?? 0}
                          onChange={(e) => {
                            const newCosts = costs.map((row) => [...row]);
                            newCosts[i][j] = Number(e.target.value);
                            setCosts(newCosts);
                          }}
                          className="number-input w-14 text-center"
                          id={`cost-${i}-${j}`}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        type="number"
                        value={s}
                        onChange={(e) => {
                          const arr = [...supply];
                          arr[i] = Number(e.target.value);
                          setSupply(arr);
                        }}
                        className="number-input w-14 text-center text-teal-300"
                        id={`supply-${i}`}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="text-blue-400 font-semibold text-xs">Demanda</td>
                  {demand.map((d, j) => (
                    <td key={j}>
                      <input
                        type="number"
                        value={d}
                        onChange={(e) => {
                          const arr = [...demand];
                          arr[j] = Number(e.target.value);
                          setDemand(arr);
                        }}
                        className="number-input w-14 text-center text-blue-300"
                        id={`demand-${j}`}
                      />
                    </td>
                  ))}
                  <td className="text-slate-500 text-xs">
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
            className="btn-primary w-full mt-4"
            id="transport-solve-btn"
          >
            {loading ? "Resolviendo..." : "⚡ Resolver Transporte"}
          </button>
          {error && <div className="alert-error mt-3 text-sm">{error}</div>}
        </div>
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Asignación Óptima</h3>
              <div className="alert-success py-1 px-3 text-sm">
                Costo Total: <strong className="text-teal-300">{result.total_cost}</strong>
              </div>
            </div>
            {result.dummy_added && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                ⚠️ {result.dummy_added}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="simplex-table text-sm">
                <thead>
                  <tr>
                    <th>Origen</th>
                    {result.allocation[0]?.map((_: any, j: number) => (
                      <th key={j}>D{j + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.allocation?.map((row: any[], i: number) => (
                    <tr key={i}>
                      <td className="basic-var-col">O{i + 1}</td>
                      {row.map((val, j) => (
                        <td key={j} className={val !== null && val > 0 ? "text-teal-300 font-bold" : "text-slate-600"}>
                          {val !== null ? val : "—"}
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">
          Método de Ruta Crítica (CPM)
        </h2>
        <div className="space-y-2">
          {activities.map((act, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-4">{i + 1}</span>
              <input
                value={act.id}
                onChange={(e) => {
                  const arr = [...activities];
                  arr[i] = { ...arr[i], id: e.target.value };
                  setActivities(arr);
                }}
                className="number-input w-12 text-center"
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
                className="number-input flex-1"
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
                className="number-input w-16"
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
                className="number-input w-24"
                placeholder="Pred."
                id={`act-pred-${i}`}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSolve}
          disabled={loading}
          className="btn-primary w-full"
          id="cpm-solve-btn"
        >
          {loading ? "Calculando..." : "⚡ Calcular CPM"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Resultados CPM</h3>
              <span className="badge badge-optimal">
                Duración: {result.project_duration} días
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">Ruta Crítica: </span>
              <span className="text-rose-400 font-semibold">
                {result.critical_path?.join(" → ")}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="simplex-table text-xs">
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
                    <tr key={a.id} className={a.is_critical ? "bg-rose-500/5" : ""}>
                      <td className="basic-var-col">{a.name}</td>
                      <td>{a.ES}</td>
                      <td>{a.EF}</td>
                      <td>{a.LS}</td>
                      <td>{a.LF}</td>
                      <td>{a.slack}</td>
                      <td>
                        {a.is_critical ? (
                          <span className="badge badge-critical text-xs">✓</span>
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
        )}
      </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">PERT — 3 Estimados de Tiempo</h2>
        <div className="text-xs text-slate-500 mb-2">
          <KaTeXDisplay latex="t_e = \\frac{t_o + 4t_m + t_p}{6}, \\ \\sigma^2 = \\left(\\frac{t_p - t_o}{6}\\right)^2" />
        </div>
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-6 gap-1 text-slate-400 font-semibold px-1">
            <span>ID</span>
            <span className="col-span-2">Nombre</span>
            <span>to</span>
            <span>tm</span>
            <span>tp</span>
          </div>
          {activities.map((act, i) => (
            <div key={i} className="grid grid-cols-6 gap-1">
              <input
                value={act.id}
                onChange={(e) => {
                  const arr = [...activities];
                  arr[i] = { ...arr[i], id: e.target.value };
                  setActivities(arr);
                }}
                className="number-input text-center"
                id={`pert-id-${i}`}
              />
              <input
                value={act.name}
                onChange={(e) => {
                  const arr = [...activities];
                  arr[i] = { ...arr[i], name: e.target.value };
                  setActivities(arr);
                }}
                className="number-input col-span-2"
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
                  className="number-input text-center"
                  id={`pert-${field}-${i}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-slate-400 whitespace-nowrap">
            Tiempo objetivo (para P):
          </label>
          <input
            type="number"
            value={targetTime}
            onChange={(e) =>
              setTargetTime(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="number-input w-24"
            placeholder="Opcional"
            id="pert-target-time"
          />
        </div>
        <button
          onClick={handleSolve}
          disabled={loading}
          className="btn-primary w-full"
          id="pert-solve-btn"
        >
          {loading ? "Calculando..." : "⚡ Calcular PERT"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-semibold text-white">Resultados PERT</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/3 rounded-xl p-3 border border-white/6">
                <div className="text-xs text-slate-400 mb-1">Duración Esperada</div>
                <div className="text-xl font-bold text-blue-300">
                  {result.expected_duration}
                </div>
              </div>
              <div className="bg-white/3 rounded-xl p-3 border border-white/6">
                <div className="text-xs text-slate-400 mb-1">Desviación Estándar</div>
                <div className="text-xl font-bold text-violet-300">
                  {result.project_std_dev?.toFixed(4)}
                </div>
              </div>
            </div>
            {result.probability_data && (
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                <p className="text-teal-300 font-semibold mb-1">Probabilidad de completar en T={result.probability_data.target_time}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-400">Z = {result.probability_data.Z_score}</span>
                  <span className="text-teal-400 font-bold text-lg">
                    P = {(result.probability_data.probability * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="simplex-table text-xs">
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
                    <tr key={a.id} className={a.is_critical ? "bg-rose-500/5" : ""}>
                      <td className="basic-var-col">{a.name}</td>
                      <td>{a.expected_time}</td>
                      <td>{a.variance?.toFixed(4)}</td>
                      <td>{a.slack}</td>
                      <td>
                        {a.is_critical ? (
                          <span className="badge badge-critical text-xs">✓</span>
                        ) : "—"}
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Teoría de Colas</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Modelo</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="styled-select"
              id="queue-model"
            >
              <option value="MM1">M/M/1</option>
              <option value="MMs">M/M/s</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              <KaTeXDisplay latex="\\lambda" /> — Tasa de llegada
            </label>
            <input
              type="number"
              value={lambda}
              onChange={(e) => setLambda(Number(e.target.value))}
              className="number-input"
              step="0.1"
              id="queue-lambda"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              <KaTeXDisplay latex="\\mu" /> — Tasa de servicio
            </label>
            <input
              type="number"
              value={mu}
              onChange={(e) => setMu(Number(e.target.value))}
              className="number-input"
              step="0.1"
              id="queue-mu"
            />
          </div>
          {model === "MMs" && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                s — Servidores
              </label>
              <input
                type="number"
                min={1}
                value={servers}
                onChange={(e) => setServers(Number(e.target.value))}
                className="number-input"
                id="queue-servers"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              N máximo para Pn
            </label>
            <input
              type="number"
              min={5}
              value={maxN}
              onChange={(e) => setMaxN(Number(e.target.value))}
              className="number-input"
              id="queue-maxn"
            />
          </div>
        </div>
        <button
          onClick={handleSolve}
          disabled={loading}
          className="btn-primary w-full"
          id="queue-solve-btn"
        >
          {loading ? "Calculando..." : "⚡ Calcular Modelo de Colas"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Resultados {result.model}</h3>
              <span className={`badge ${result.rho < 0.8 ? "badge-optimal" : "badge-critical"}`}>
                ρ = {result.rho?.toFixed(4)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((m, i) => (
                <div
                  key={i}
                  className="bg-white/3 rounded-xl p-3 border border-white/6"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <KaTeXDisplay latex={m.latex} className="text-slate-400 text-xs" />
                    <span className="text-xs text-slate-500">—</span>
                    <span className="text-xs text-slate-500">
                      {m.label.split("—")[1]}
                    </span>
                  </div>
                  <div className={`text-xl font-bold font-mono ${m.color}`}>
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
                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/8">
                  <table className="simplex-table text-xs">
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
                          <td>{p.n}</td>
                          <td className="text-blue-300">{p.Pn.toFixed(6)}</td>
                          <td className="text-slate-400">
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
        )}
      </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Problema de Asignación</h2>
          <div className="flex gap-2">
            {(["MIN", "MAX"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  type === t ? "bg-orange-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[["+ Fila", addRow], ["− Fila", removeRow], ["+ Col", addCol], ["− Col", removeCol]].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void}
              className="px-3 py-1 rounded text-xs bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 transition-all">
              {label as string}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="simplex-table text-xs">
            <thead>
              <tr>
                <th>Agente\Tarea</th>
                {Array.from({ length: m }, (_, j) => <th key={j}>T{j + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="basic-var-col">A{i + 1}</td>
                  {row.map((val, j) => (
                    <td key={j}>
                      <input type="number" value={val}
                        onChange={(e) => {
                          const m2 = matrix.map((r) => [...r]);
                          m2[i][j] = Number(e.target.value);
                          setMatrix(m2);
                        }}
                        className="number-input w-14 text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleSolve} disabled={loading} className="btn-primary w-full">
          {loading ? "Resolviendo..." : `⚡ Resolver Asignación (${type})`}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
        <CodeViewer algo="assignment" />
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Asignación Óptima</h3>
              <div className="alert-success py-1 px-3 text-sm">
                {type === "MIN" ? "Costo" : "Beneficio"} Total:{" "}
                <strong className="text-teal-300">{result.total_cost}</strong>
              </div>
            </div>
            <div className="space-y-2">
              {result.assignments?.map((a: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/4 border border-white/8">
                  <span className="text-white text-sm font-medium">{a.agent} → {a.task}</span>
                  <span className="text-teal-300 font-mono text-sm">{a.cost}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Kuhn-Munkres Paso a Paso</h2>
          <div className="flex gap-2">
            {(["MIN", "MAX"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  type === t ? "bg-orange-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="simplex-table text-xs">
            <thead>
              <tr>
                <th>Agente\Tarea</th>
                {Array.from({ length: m }, (_, j) => <th key={j}>T{j + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="basic-var-col">A{i + 1}</td>
                  {row.map((val, j) => (
                    <td key={j}>
                      <input type="number" value={val}
                        onChange={(e) => {
                          const m2 = matrix.map((r) => [...r]);
                          m2[i][j] = Number(e.target.value);
                          setMatrix(m2);
                        }}
                        className="number-input w-14 text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleSolve} disabled={loading} className="btn-primary w-full">
          {loading ? "Calculando..." : "⚡ Ejecutar Kuhn-Munkres"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}

        {result && (
          <div className="alert-success py-2 px-3 text-sm flex justify-between">
            <span>Costo Total Óptimo:</span>
            <strong className="text-teal-300">{result.total_cost}</strong>
          </div>
        )}
        <CodeViewer algo="kuhn-munkres" />
      </div>

      <div className="space-y-4">
        {steps.length > 0 && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {currentStep?.step ?? "Resultado"}
              </h3>
              <span className="text-xs text-slate-500">{stepIdx + 1} / {steps.length}</span>
            </div>

            {currentStep?.description && (
              <p className="text-xs text-slate-400 bg-white/3 rounded-lg p-3 border border-white/8">
                {currentStep.description}
              </p>
            )}

            {currentStep?.delta !== undefined && (
              <div className="text-amber-400 text-sm font-mono">
                Δ = {currentStep.delta?.toFixed(4)}
              </div>
            )}

            {currentStep?.matrix && (
              <div className="overflow-x-auto">
                <table className="simplex-table text-xs">
                  <thead>
                    <tr>
                      <th></th>
                      {currentStep.col_names?.map((c: string) => <th key={c}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {currentStep.matrix.map((row: number[], i: number) => (
                      <tr key={i}>
                        <td className="basic-var-col">{currentStep.row_names?.[i] ?? `A${i+1}`}</td>
                        {row.map((val: number, j: number) => {
                          const isAssigned = currentStep.assignments?.some(
                            (a: any) => a.row === i && a.col === j
                          );
                          const isZero = Math.abs(val) < 1e-9;
                          return (
                            <td key={j} className={
                              isAssigned
                                ? "bg-teal-500/20 text-teal-300 font-bold"
                                : isZero
                                ? "text-orange-400 font-semibold"
                                : ""
                            }>
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
              <div className="alert-success text-sm">
                ✅ Asignación óptima encontrada
              </div>
            )}

            <div className="flex gap-2 justify-between">
              <button disabled={stepIdx === 0}
                onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40">
                ◀ Anterior
              </button>
              <button disabled={stepIdx === steps.length - 1}
                onClick={() => setStepIdx(Math.min(steps.length - 1, stepIdx + 1))}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40">
                Siguiente ▶
              </button>
            </div>
          </div>
        )}
      </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Flujo Máximo (Edmonds-Karp)</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fuente (s)</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} className="number-input" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sumidero (t)</label>
            <input value={sink} onChange={(e) => setSink(e.target.value)} className="number-input" />
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-1 text-xs text-slate-500 font-semibold px-1">
            <span>Origen</span><span>Destino</span><span>Capacidad</span><span></span>
          </div>
          {edges.map((edge, i) => (
            <div key={i} className="grid grid-cols-4 gap-1">
              <input value={edge.source}
                onChange={(e) => { const a = [...edges]; a[i] = {...a[i], source: e.target.value}; setEdges(a); }}
                className="number-input text-center text-xs" />
              <input value={edge.target}
                onChange={(e) => { const a = [...edges]; a[i] = {...a[i], target: e.target.value}; setEdges(a); }}
                className="number-input text-center text-xs" />
              <input type="number" value={edge.capacity}
                onChange={(e) => { const a = [...edges]; a[i] = {...a[i], capacity: Number(e.target.value)}; setEdges(a); }}
                className="number-input text-center text-xs" />
              <button onClick={() => removeEdge(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
            </div>
          ))}
          <button onClick={addEdge} className="text-xs text-teal-400 hover:text-teal-300 mt-1">
            + Agregar arista
          </button>
        </div>

        <button onClick={handleSolve} disabled={loading} className="btn-primary w-full">
          {loading ? "Calculando..." : "⚡ Calcular Flujo Máximo"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
        <CodeViewer algo="max-flow" />
      </div>

      <div className="space-y-4">
        {result && (
          <>
            <div className="glass-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">Resultado</h3>
                <div className="alert-success px-3 py-1 text-sm">
                  Flujo Máximo: <strong className="text-teal-300">{result.max_flow}</strong>
                </div>
              </div>

              <h4 className="text-xs font-semibold text-slate-400 uppercase">Flujo por Arista</h4>
              <div className="overflow-x-auto">
                <table className="simplex-table text-xs">
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
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase">Rutas de Aumento</h4>
                {result.augmenting_paths.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/8">
                    <span className="text-xs text-slate-500">#{i + 1}</span>
                    <span className="text-sm font-mono text-white">{p.path?.join(" → ")}</span>
                    <span className="ml-auto text-orange-400 text-xs font-bold">
                      Δ = {p.bottleneck}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Flujo a Costo Mínimo</h2>

        {/* Nodos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase">Nodos (oferta/demanda b_i)</h3>
            <div className={`text-xs font-mono ${isBalanced ? "text-teal-400" : "text-red-400"}`}>
              Σb_i = {totalBalance.toFixed(1)} {isBalanced ? "✓" : "⚠"}
            </div>
          </div>
          <div className="space-y-1">
            {nodes.map((node, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={node.id}
                  onChange={(e) => { const a = [...nodes]; a[i] = {...a[i], id: e.target.value}; setNodes(a); }}
                  className="number-input w-16 text-center text-xs" placeholder="ID" />
                <input type="number" value={node.demand}
                  onChange={(e) => { const a = [...nodes]; a[i] = {...a[i], demand: Number(e.target.value)}; setNodes(a); }}
                  className="number-input flex-1 text-xs"
                  placeholder="b_i (+oferta / -demanda / 0=transb.)" />
                <button onClick={() => nodes.length > 2 && setNodes(nodes.filter((_, j) => j !== i))}
                  className="text-red-400 text-xs hover:text-red-300">✕</button>
              </div>
            ))}
            <button onClick={() => setNodes([...nodes, { id: `N${nodes.length + 1}`, demand: 0 }])}
              className="text-xs text-teal-400 hover:text-teal-300">+ Agregar nodo</button>
          </div>
        </div>

        {/* Aristas */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Aristas</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-1 text-xs text-slate-500 px-1">
              <span>Origen</span><span>Destino</span><span>Cap.</span><span>Costo</span><span></span>
            </div>
            {edges.map((edge, i) => (
              <div key={i} className="grid grid-cols-5 gap-1">
                <input value={edge.source}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], source: e.target.value}; setEdges(a); }}
                  className="number-input text-center text-xs" />
                <input value={edge.target}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], target: e.target.value}; setEdges(a); }}
                  className="number-input text-center text-xs" />
                <input type="number" value={edge.capacity}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], capacity: Number(e.target.value)}; setEdges(a); }}
                  className="number-input text-center text-xs" />
                <input type="number" value={edge.cost}
                  onChange={(e) => { const a = [...edges]; a[i] = {...a[i], cost: Number(e.target.value)}; setEdges(a); }}
                  className="number-input text-center text-xs" />
                <button onClick={() => setEdges(edges.filter((_, j) => j !== i))}
                  className="text-red-400 text-xs hover:text-red-300">✕</button>
              </div>
            ))}
            <button
              onClick={() => setEdges([...edges, { source: nodes[0]?.id ?? "s", target: nodes[nodes.length-1]?.id ?? "t", capacity: 10, cost: 1 }])}
              className="text-xs text-teal-400 hover:text-teal-300">+ Agregar arista</button>
          </div>
        </div>

        <button onClick={handleSolve} disabled={loading || !isBalanced} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Calculando..." : isBalanced ? "⚡ Calcular Flujo a Costo Mínimo" : "⚠ Red desbalanceada"}
        </button>
        {error && <div className="alert-error text-sm">{error}</div>}
        <CodeViewer algo="min-cost-flow" />
      </div>

      <div>
        {result && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Resultado Óptimo</h3>
              <div className="alert-success px-3 py-1 text-sm">
                Costo Total Mínimo:{" "}
                <strong className="text-teal-300">{result.total_cost}</strong>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="simplex-table text-xs">
                <thead>
                  <tr><th>Arco</th><th>Flujo</th><th>Cap.</th><th>Costo/u</th><th>Costo Arco</th></tr>
                </thead>
                <tbody>
                  {result.flow_on_edges?.map((e: any, i: number) => (
                    <tr key={i} className={e.flow > 0 ? "bg-teal-500/5" : "opacity-50"}>
                      <td className="font-mono">{e.source} → {e.target}</td>
                      <td className={e.flow > 0 ? "text-teal-300 font-bold" : "text-slate-600"}>{e.flow}</td>
                      <td>{e.capacity}</td>
                      <td className="text-slate-400">${e.cost_per_unit}</td>
                      <td className={e.arc_cost > 0 ? "text-orange-400 font-semibold" : "text-slate-600"}>
                        ${e.arc_cost}
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
  );
}
