"""
capture_all.py — Automatización de capturas con Playwright para Documentación y Manual de Usuario
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"C:\Users\carda\OneDrive\Documentos\Cosas de la U\calculo de procesos\capturas"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use high resolution viewport for professional documentation
        context = browser.new_context(
            viewport={"width": 1400, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        print("1. Capturando simplex.png...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_selector(".calc-keypad", timeout=10000)

        # Ensure MAX
        max_btn = page.locator(".calc-toggle__btn", has_text="MAX")
        if "calc-toggle__btn--active" not in (max_btn.get_attribute("class") or ""):
            max_btn.click()

        # Clear
        page.locator("button[aria-label='AC']").click()
        time.sleep(0.3)

        # Z: 4x1 + 3x2
        page.locator(".calc-row-tab", has_text="Z").click()
        page.locator("button[aria-label='4']").click()
        page.locator("button[aria-label='x₁']").click()
        page.locator("button.key-op[aria-label='+']").click()
        page.locator("button[aria-label='3']").click()
        page.locator("button[aria-label='x₂']").click()

        # R1: 2x1 + x2 <= 10
        page.locator("button[aria-label='+Fila']").click()
        time.sleep(0.2)
        page.locator("button[aria-label='2']").click()
        page.locator("button[aria-label='x₁']").click()
        page.locator("button.key-op[aria-label='+']").click()
        page.locator("button[aria-label='x₂']").click()
        page.locator("button[aria-label='≤']").click()
        page.locator("button[aria-label='1']").click()
        page.locator("button[aria-label='0']").click()

        # R2: x1 + 2x2 <= 8
        page.locator("button[aria-label='+Fila']").click()
        time.sleep(0.2)
        page.locator("button[aria-label='x₁']").click()
        page.locator("button.key-op[aria-label='+']").click()
        page.locator("button[aria-label='2']").click()
        page.locator("button[aria-label='x₂']").click()
        page.locator("button[aria-label='≤']").click()
        page.locator("button[aria-label='8']").click()

        # Solve
        page.locator("button.key-solve").click()
        page.wait_for_selector(".results-block", timeout=10000)
        time.sleep(1)

        simplex_path = os.path.join(OUTPUT_DIR, "simplex.png")
        page.screenshot(path=simplex_path)
        print(f"   -> Guardado en {simplex_path}")

        print("2. Capturando grafico.png...")
        page.locator("#method-btn-graphical").click()
        page.wait_for_selector("canvas", timeout=10000)
        time.sleep(1.2)  # Wait for Chart.js animation
        grafico_path = os.path.join(OUTPUT_DIR, "grafico.png")
        page.screenshot(path=grafico_path)
        print(f"   -> Guardado en {grafico_path}")

        print("3. Capturando transporte.png...")
        page.goto("http://localhost:3000/networks", wait_until="networkidle")
        page.locator("#tab-network-transport").click()
        time.sleep(0.5)
        page.locator("#transport-solve-btn").click()
        page.wait_for_selector(".glass-card h3:has-text('Asignación Óptima')", timeout=10000)
        time.sleep(0.5)
        transporte_path = os.path.join(OUTPUT_DIR, "transporte.png")
        page.screenshot(path=transporte_path)
        print(f"   -> Guardado en {transporte_path}")

        print("4. Capturando asignacion.png (Kuhn-Munkres paso a paso)...")
        page.locator("#tab-network-kuhn-munkres").click()
        time.sleep(0.5)
        page.locator("#km-solve-btn").click()
        page.wait_for_selector("#km-next-step-btn", timeout=10000)
        time.sleep(0.5)
        # Advance step
        page.locator("#km-next-step-btn").click()
        time.sleep(0.5)
        asignacion_path = os.path.join(OUTPUT_DIR, "asignacion.png")
        page.screenshot(path=asignacion_path)
        print(f"   -> Guardado en {asignacion_path}")

        print("5. Capturando flujo.png (Flujo Máximo con SVG)...")
        page.locator("#tab-network-max-flow").click()
        time.sleep(0.5)
        page.locator("#maxflow-solve-btn").click()
        page.wait_for_selector("svg", timeout=10000)
        time.sleep(0.8)
        flujo_path = os.path.join(OUTPUT_DIR, "flujo.png")
        page.screenshot(path=flujo_path)
        print(f"   -> Guardado en {flujo_path}")

        print("6. Capturando pert.png (PERT con Ruta Crítica)...")
        page.locator("#tab-network-pert").click()
        time.sleep(0.5)
        page.locator("#pert-solve-btn").click()
        page.wait_for_selector(".badge-critical", timeout=10000)
        time.sleep(0.8)
        pert_path = os.path.join(OUTPUT_DIR, "pert.png")
        page.screenshot(path=pert_path)
        print(f"   -> Guardado en {pert_path}")

        print("7. Capturando codigo.png (Bloque </> Código del Algoritmo desplegado)...")
        # Click on CodeViewer button
        code_btn = page.locator("button", has_text="Código del Algoritmo")
        code_btn.scroll_into_view_if_needed()
        code_btn.click()
        page.wait_for_selector("pre", timeout=10000)
        time.sleep(0.5)
        # Scroll down so the code block is nicely in view
        page.locator("pre").scroll_into_view_if_needed()
        time.sleep(0.5)
        codigo_path = os.path.join(OUTPUT_DIR, "codigo.png")
        page.screenshot(path=codigo_path)
        print(f"   -> Guardado en {codigo_path}")

        browser.close()
        print("\n✅ TODAS LAS 7 CAPTURAS GENERADAS EXITOSAMENTE!")

if __name__ == "__main__":
    capture()
