"""
generate_arch_diagram.py — Generador de diagrama de arquitectura de alta resolución
"""
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

OUTPUT_DIR = r"C:\Users\carda\OneDrive\Documentos\Cosas de la U\calculo de procesos\capturas"
output_path = os.path.join(OUTPUT_DIR, "arquitectura.png")

# Set figure with dark slate aesthetic matching OptiFlow (#09090B / #18181B)
fig, ax = plt.subplots(figsize=(14, 8), dpi=300)
fig.patch.set_facecolor('#09090B')
ax.set_facecolor('#09090B')
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')

# Title
ax.text(7, 7.5, "ARQUITECTURA DEL SISTEMA — CALCULADORA DE IO", 
        fontsize=16, fontweight='bold', color='#FAFAFA', ha='center', va='center', fontfamily='sans-serif')
ax.text(7, 7.15, "Cliente Web React/Next.js  ⟷  Servidor API FastAPI  ⟷  Motores Numéricos y de Redes", 
        fontsize=10, color='#A1A1AA', ha='center', va='center', fontfamily='sans-serif')

def draw_box(x, y, w, h, title, subtitle, items, border_color='#3F3F46', bg_color='#18181B', title_color='#6366F1'):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15", 
                                  linewidth=1.5, edgecolor=border_color, facecolor=bg_color)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h - 0.35, title, fontsize=12, fontweight='bold', color=title_color, ha='center', va='center')
    if subtitle:
        ax.text(x + w/2, y + h - 0.7, subtitle, fontsize=8.5, fontweight='semibold', color='#71717A', ha='center', va='center')
    
    start_y = y + h - 1.15
    for idx, item in enumerate(items):
        ax.text(x + 0.3, start_y - (idx * 0.42), f"• {item}", fontsize=9, color='#D4D4D8', ha='left', va='center')

# Box 1: FRONTEND
draw_box(0.6, 1.2, 3.8, 5.3, 
         "CAPA CLIENTE (FRONTEND)", 
         "Next.js 16 • React 19 • Puerto 3000", 
         [
             "OptiFlow UI Dark Theme (#09090B)",
             "Teclado Virtual Matemático Integrado",
             "Renderizado KaTeX & MathLive",
             "Gráficos Interactivos 2D/3D (Plotly/Chart.js)",
             "Topologías de Red en SVG Nativo",
             "Gestión de Estado React / Hooks",
             "Cliente HTTP Axios con Interceptores"
         ],
         border_color='#4F46E5', title_color='#818CF8')

# Box 2: BACKEND
draw_box(5.1, 1.2, 3.8, 5.3, 
         "CAPA SERVIDOR (BACKEND)", 
         "FastAPI • Uvicorn ASGI • Puerto 8000", 
         [
             "Middleware CORS & Manejo de Errores",
             "Esquemas Pydantic v2 (Validación)",
             "Módulo /api/linear: Simplex & Dual",
             "Módulo /api/networks: Grafos & Transporte",
             "Módulo /api/advanced: Mochila & Colas",
             "Auto-balanceo de Oferta/Demanda",
             "Documentación Automática Swagger /docs"
         ],
         border_color='#10B981', title_color='#34D399')

# Box 3: COMPUTATIONAL ENGINES
draw_box(9.6, 1.2, 3.8, 5.3, 
         "CAPA MATEMÁTICA (SOLVERS)", 
         "NumPy • SciPy • NetworkX • PuLP", 
         [
             "NumPy: Álgebra Lineal & Tableaus Simplex",
             "SciPy: linear_sum_assignment (Húngaro)",
             "NetworkX: Edmonds-Karp (Flujo Máximo)",
             "NetworkX: Algoritmos de Prim / Kruskal",
             "PuLP / CBC: Flujo a Costo Mínimo",
             "Solvers Analíticos: CPM, PERT, Colas M/M/s",
             "Programación Dinámica: Mochila 0/1"
         ],
         border_color='#F59E0B', title_color='#FBBF24')

# Draw Arrows
arrow_kw = dict(arrowstyle="<|-|>", color='#A1A1AA', lw=2, mutation_scale=15)
ax.annotate("", xy=(5.1, 3.85), xytext=(4.4, 3.85), arrowprops=arrow_kw)
ax.text(4.75, 4.25, "REST API\nJSON/HTTP", fontsize=7.5, fontweight='bold', color='#A1A1AA', ha='center', va='center')

ax.annotate("", xy=(9.6, 3.85), xytext=(8.9, 3.85), arrowprops=arrow_kw)
ax.text(9.25, 4.25, "Matrices\nNumPy / DTOs", fontsize=7.5, fontweight='bold', color='#A1A1AA', ha='center', va='center')

# Footer
ax.text(7, 0.5, "Despliegue Local Independiente — Arquitectura Desacoplada de Alta Cohesión", 
        fontsize=9, color='#71717A', ha='center', va='center', style='italic')

plt.tight_layout()
plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close()
print("Diagrama de arquitectura generado con éxito en:", output_path)
