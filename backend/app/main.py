"""
ShareChat APM — Trend Intelligence API

Lightweight FastAPI service aggregating Google Trends India + Indian news RSS.
Modular layout: collectors → normalization → scoring → routes → utils.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.trends import router as trends_router

# Tradeoff: permissive CORS for local/demo frontends; tighten origins in production.
app = FastAPI(
    title="ShareChat Trend Intelligence",
    description="Hindi-audience trend engine for APM assignment",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trends_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
