"use client";
import dynamic from "next/dynamic";
import { formatNumber } from "@/utils/format";
import type { GraphicalResponse } from "@/services/api";

// Plotly needs to be dynamically imported with ssr: false
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Graph3DProps {
  result: GraphicalResponse;
}

export default function Graph3D({ result }: Graph3DProps) {
  const { vertices, faces, optimal_point } = result;

  const xPts = vertices.map(v => v.x);
  const yPts = vertices.map(v => v.y);
  const zPts = vertices.map(v => v.z || 0);

  // Mesh3D requires flat arrays for i, j, k
  const i = faces ? faces.map((f: number[]) => f[0]) : [];
  const j = faces ? faces.map((f: number[]) => f[1]) : [];
  const k = faces ? faces.map((f: number[]) => f[2]) : [];

  const meshData = {
    type: 'mesh3d',
    x: xPts,
    y: yPts,
    z: zPts,
    i: i,
    j: j,
    k: k,
    opacity: 0.5,
    color: 'rgba(79, 142, 247, 0.8)',
    flatshading: true,
    name: "Región Factible",
  };

  const optimalData = optimal_point ? {
    type: 'scatter3d',
    mode: 'markers',
    x: [optimal_point.x],
    y: [optimal_point.y],
    z: [optimal_point.z || 0],
    marker: {
      size: 8,
      color: '#f59e0b',
      symbol: 'circle',
    },
    name: "Óptimo",
  } : null;

  const verticesData = {
    type: 'scatter3d',
    mode: 'markers',
    x: xPts,
    y: yPts,
    z: zPts,
    marker: {
      size: 4,
      color: '#4f8ef7',
    },
    name: "Vértices",
  };

  const data = optimalData ? [meshData, verticesData, optimalData] : [meshData, verticesData];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 h-[500px]">
        {/* @ts-ignore */}
        <Plot
          data={data}
          layout={{
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'transparent',
            scene: {
              xaxis: { title: 'X1', gridcolor: '#334155', zerolinecolor: '#475569' },
              yaxis: { title: 'X2', gridcolor: '#334155', zerolinecolor: '#475569' },
              zaxis: { title: 'X3', gridcolor: '#334155', zerolinecolor: '#475569' },
            },
            legend: { font: { color: '#94a3b8' } }
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          Vértices de la Región Factible (3D)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-2 text-blue-400">Vértice</th>
                <th className="text-center py-2 text-slate-400">x₁</th>
                <th className="text-center py-2 text-slate-400">x₂</th>
                <th className="text-center py-2 text-slate-400">x₃</th>
                <th className="text-center py-2 text-slate-400">Z</th>
                <th className="text-center py-2 text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {vertices.map((v, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-white/4 ${
                    v.is_optimal ? "bg-amber-500/10" : ""
                  }`}
                >
                  <td className="py-2 text-slate-300">V{idx + 1}</td>
                  <td className="py-2 text-center">{formatNumber(v.x)}</td>
                  <td className="py-2 text-center">{formatNumber(v.y)}</td>
                  <td className="py-2 text-center">{formatNumber(v.z || 0)}</td>
                  <td className="py-2 text-center text-blue-300 font-semibold">
                    {formatNumber(v.z_value || 0)}
                  </td>
                  <td className="py-2 text-center">
                    {v.is_optimal ? (
                      <span className="badge badge-optimal">★ Óptimo</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Factible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
