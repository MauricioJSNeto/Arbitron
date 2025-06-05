from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scripts.arbitrage_engine import detect_simple_arbitrage

app = FastAPI()

class ArbitrageRequest(BaseModel):
    pair: str
    exchanges: list[str]
    min_profit: float = 0.01

@app.post("/api/v1/arbitrage/scan")
async def scan_arbitrage(request: ArbitrageRequest):
    opportunities = await detect_simple_arbitrage(request.pair, request.exchanges, request.min_profit)
    if not opportunities:
        raise HTTPException(status_code=404, detail="Nenhuma oportunidade encontrada")
    return opportunities