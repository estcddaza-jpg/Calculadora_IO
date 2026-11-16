"use client";
import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { formatNumber } from "@/utils/format";
import { Scatter } from "react-chartjs-2";
import type { GraphicalResponse } from "@/services/api";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Graph2DProps {
  result: GraphicalResponse;
  objCoeffs: number[];
}

const COLORS = [
  "#4f8ef7",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#a78bfa",
];

export default function Graph2D({ result, objCoeffs }: Graph2DProps) {
  const { vertices, optimal_point, constraint_lines } = result;

  // Calcular límites del gráfico
  const allX = vertices.map((v) => v.x).concat(0);
  const allY = vertices.map((v) => v.y).concat(0);
  const maxX = Math.max(...allX) * 1.3 + 1;
  const maxY = Math.max(...allY) * 1.3 + 1;

  // Polígono de la región factible (ordenar vértices por ángulo)
  const centroid = {
    x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
    y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
  };
  const sortedVertices = [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
  const closedPolygon = [...sortedVertices, sortedVertices[0]];

  const datasets = [
    // Región factible (relleno del polígono)
    {
      label: "Región Factible",
      data: closedPolygon.map((v) => ({ x: v.x, y: v.y })),
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderColor: "rgba(99, 102, 241, 0.85)",
      borderWidth: 2,
      showLine: true,
      pointRadius: 0,
      fill: true,
      tension: 0,
      order: 10,
    },
    // Líneas de restricción
    ...constraint_lines.map((cl, i) => ({
      label: cl.label,
      data: cl.x_pts.map((x, j) => ({ x, y: cl.y_pts[j] })),
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1.5,
      borderDash: [4, 4],
      backgroundColor: "transparent",
      showLine: true,
      pointRadius: 0,
      fill: false,
      order: 5,
    })),
    // Vértices
    {
      label: "Vértices",
      data: vertices.map((v) => ({ x: v.x, y: v.y })),
      backgroundColor: vertices.map((v) =>
        v.is_optimal ? "#10B981" : "rgba(99, 102, 241, 0.9)"
      ),
      borderColor: vertices.map((v) =>
        v.is_optimal ? "#052E16" : "#4F46E5"
      ),
      borderWidth: 2,
      pointRadius: vertices.map((v) => (v.is_optimal ? 10 : 6)),
      showLine: false,
      order: 1,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <Scatter
          data={{ datasets } as any}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            scales: {
              x: {
                type: "linear",
                min: -0.2,
                max: maxX,
                title: {
                  display: true,
                  text: "x₁",
                  color: "#94a3b8",
                  font: { size: 14 },
                },
                grid: {
                  color: "#27272A",
                },
                ticks: { color: "#A1A1AA" },
              },
              y: {
                type: "linear",
                min: -0.2,
                max: maxY,
                title: {
                  display: true,
                  text: "x₂",
                  color: "#A1A1AA",
                  font: { size: 14 },
                },
                grid: {
                  color: "#27272A",
                },
                ticks: { color: "#A1A1AA" },
              },
            },
            plugins: {
              legend: {
                labels: { color: "#FAFAFA", boxWidth: 16, font: { size: 12 } },
              },
              tooltip: {
                backgroundColor: "#18181B",
                borderColor: "#27272A",
                borderWidth: 1,
                titleColor: "#FAFAFA",
                bodyColor: "#A1A1AA",
                callbacks: {
                  label: (ctx) => {
                    const pt = ctx.raw as { x: number; y: number };
                    const v = vertices.find(
                      (v) =>
                        Math.abs(v.x - pt.x) < 0.01 &&
                        Math.abs(v.y - pt.y) < 0.01
                    );
                    if (v) {
                      return [
                        `(${pt.x.toFixed(3)}, ${pt.y.toFixed(3)})`,
                        `Z = ${v.z_value.toFixed(4)}`,
                        v.is_optimal ? "⭐ PUNTO ÓPTIMO" : "",
                      ].filter(Boolean);
                    }
                    return `(${pt.x.toFixed(3)}, ${pt.y.toFixed(3)})`;
                  },
                },
              },
            },
          }}
          height={380}
        />
      </div>

      {/* Tabla de vértices */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          Vértices de la Región Factible
        </h4>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 text-blue-400">Vértice</th>
              <th className="text-center py-2 text-slate-400">x₁</th>
              <th className="text-center py-2 text-slate-400">x₂</th>
              <th className="text-center py-2 text-slate-400">Z</th>
              <th className="text-center py-2 text-slate-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {vertices.map((v, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-800 ${
                  v.is_optimal ? "bg-emerald-500/10 text-emerald-400 font-semibold" : ""
                }`}
              >
                <td className="py-2 text-zinc-300">V{i + 1}</td>
                <td className="py-2 text-center font-mono">{formatNumber(v.x)}</td>
                <td className="py-2 text-center font-mono">{formatNumber(v.y)}</td>
                <td className="py-2 text-center font-mono text-indigo-400 font-semibold">
                  {formatNumber(v.z_value)}
                </td>
                <td className="py-2 text-center">
                  {v.is_optimal ? (
                    <span className="badge badge-optimal">✓ Óptimo</span>
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
  );
}
