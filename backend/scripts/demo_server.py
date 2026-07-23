"""Standalone demo server for the House & Neighborhood Data Collector agent.

Not part of the main app (no DB, no auth) — just a thin wrapper so the agent
can be demoed through a browser instead of a console script.

Run: uv run uvicorn scripts.demo_server:app --reload --port 8010
Then open http://localhost:8010
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.agents.seller.data_collector import HouseNeighborhoodDataCollectorAgent

app = FastAPI(title="Immobil'IA — Demo agent")
_agent = HouseNeighborhoodDataCollectorAgent()
_HTML_PATH = Path(__file__).parent / "demo_neighborhood.html"


class NeighborhoodRequest(BaseModel):
    address: str


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(_HTML_PATH)


@app.post("/api/neighborhood")
async def neighborhood(payload: NeighborhoodRequest) -> dict:
    try:
        return await _agent.run({"address": payload.address})
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — demo endpoint, surface any failure to the UI
        raise HTTPException(status_code=502, detail=f"Agent failed: {exc}") from exc
