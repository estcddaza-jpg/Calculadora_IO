import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "OptiFlow — Calculadora de Investigación de Operaciones",
  description:
    "Workspace de alta precisión para Investigación de Operaciones, Programación Lineal (Simplex), Flujos de Redes y Planificación de Proyectos (PERT/CPM).",
  keywords: ["investigación de operaciones", "simplex", "programación lineal", "PERT", "CPM", "redes", "transporte"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-[#09090B] text-[#FAFAFA] font-sans selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
