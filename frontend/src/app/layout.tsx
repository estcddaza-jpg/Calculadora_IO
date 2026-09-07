import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calculadora IO — Investigación de Operaciones",
  description:
    "Calculadora universitaria de Investigación de Operaciones: Simplex, Redes, PERT/CPM, Colas, Transporte y más. Visualización paso a paso con tablas académicas.",
  keywords: ["investigación de operaciones", "simplex", "programación lineal", "PERT", "CPM", "redes"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
