"""
insert_screenshots.py — Reemplazo de marcadores de capturas en documentos Word (.docx)
"""
import os
import docx
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOCS_DIR = r"C:\Users\carda\OneDrive\Documentos\Cosas de la U\calculo de procesos"
CAPTURAS_DIR = os.path.join(DOCS_DIR, "capturas")

MAPPINGS = {
    # Manual de Usuario
    "Teclado Virtual con Función Objetivo y Restricciones Ingresadas": "simplex.png",
    "Gráfico 2D con Polígono Factible y Vértice Óptimo Resaltado": "grafico.png",
    "Cuadrícula del Problema de Transporte y Matriz de Asignaciones": "transporte.png",
    "Visor Paso a Paso del Algoritmo de Kuhn-Munkres": "asignacion.png",
    "Grafo SVG de Flujo Máximo con Rutas de Aumento": "flujo.png",
    "Tabla CPM/PERT con Ruta Crítica Resaltada en Rojo": "pert.png",
    "Bloque Desplegable de </> Código del Algoritmo": "codigo.png",
    # Documentación Técnica
    "Diagrama de Arquitectura: Cliente React/Next.js": "arquitectura.png",
    "Topología de Red SVG con Rutas de Aumento": "flujo.png",
}

def process_document(input_filename, output_filename):
    input_path = os.path.join(DOCS_DIR, input_filename)
    output_path = os.path.join(DOCS_DIR, output_filename)

    if not os.path.exists(input_path):
        print(f"❌ No existe: {input_path}")
        return

    doc = docx.Document(input_path)
    replaced_count = 0

    def check_and_replace(paragraph):
        nonlocal replaced_count
        text = paragraph.text
        for key, img_name in MAPPINGS.items():
            if key in text:
                img_path = os.path.join(CAPTURAS_DIR, img_name)
                if not os.path.exists(img_path):
                    print(f"⚠️ Imagen no encontrada: {img_path}")
                    continue
                paragraph.text = ""
                paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = paragraph.add_run()
                run.add_picture(img_path, width=Inches(6.0))
                print(f"   ✓ [{output_filename}] Reemplazado '{key[:35]}...' -> {img_name}")
                replaced_count += 1
                return True
        return False

    # Check normal paragraphs
    for p in doc.paragraphs:
        check_and_replace(p)

    # Check tables (where placeholders are located inside callout cells)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    check_and_replace(p)

    doc.save(output_path)
    print(f"🎉 Guardado exitosamente: {output_path} (Reemplazos: {replaced_count})")

if __name__ == "__main__":
    print("Iniciando inserción de capturas en documentos Word...")
    process_document("Manual_Usuario_IO_Completo.docx", "Manual_Usuario_IO_FINAL_CON_FOTOS.docx")
    process_document("Documentacion_Tecnica_IO_Completa.docx", "Documentacion_Tecnica_IO_FINAL_CON_FOTOS.docx")
