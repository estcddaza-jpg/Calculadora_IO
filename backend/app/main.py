from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api import routes_linear, routes_networks, routes_advanced

load_dotenv()

app = FastAPI(
    title="Calculadora IO - API",
    description="Motor matemático para Investigación de Operaciones universitaria",
    version="1.0.0",
)

origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_linear.router, prefix="/api/linear", tags=["Programación Lineal"])
app.include_router(routes_networks.router, prefix="/api/networks", tags=["Redes y Proyectos"])
app.include_router(routes_advanced.router, prefix="/api/advanced", tags=["Modelos Avanzados"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Calculadora IO API corriendo"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
