from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scripts.arbitrage_engine import ArbitrageEngine
import logging
import asyncio

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Bot de Arbitragem de Criptomoedas")

class ArbitrageRequest(BaseModel):
    pair: str
    exchanges: list[str]
    min_profit: float = 0.5

@app.post("/api/v1/arbitrage/scan")
async def scan_arbitrage(request: ArbitrageRequest):
    """
    Escaneia oportunidades de arbitragem para um par e exchanges especificados.
    """
    try:
        engine = ArbitrageEngine(min_profit_threshold=request.min_profit)
        market_data = await engine.fetch_market_data(request.exchanges, [request.pair])
        opportunities = engine.detect_simple_arbitrage(market_data)
        if not opportunities:
            raise HTTPException(status_code=404, detail="Nenhuma oportunidade encontrada")
        return opportunities
    except Exception as e:
        logger.error(f"Erro ao escanear arbitragem: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/arbitrage/scan_triangular")
async def scan_triangular_arbitrage(exchange: str):
    """
    Escaneia oportunidades de arbitragem triangular em uma exchange.
    """
    try:
        engine = ArbitrageEngine()
        market_data = await engine.fetch_market_data([exchange], list(set([p for ex in market_data.values() for p in ex.keys()])))
        opportunities = engine.detect_triangular_arbitrage(market_data, exchange)
        if not opportunities:
            raise HTTPException(status_code=404, detail="Nenhuma oportunidade encontrada")
        return opportunities
    except Exception as e:
        logger.error(f"Erro ao escanear arbitragem triangular: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)