"use client";
import { useState } from "react";
import {
  solveTransport,
  solveCPM,
  solvePERT,
  solveQueues,
  getErrorMessage,
} from "@/services/api";
import KaTeXDisplay from "@/components/math/KaTeXDisplay";

type Section = "transport" | "cpm" | "pert" | "queues";

export default function NetworksPage() {
  const [section, setSection] = useState<Section>("transport");

  const sections = [
    { id: "transport" as const, label: "Transporte", icon: "🚚" },
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
