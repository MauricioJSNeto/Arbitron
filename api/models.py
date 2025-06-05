from pydantic import BaseModel
from typing import List, Dict

class ArbitrageRequest(BaseModel):
    pair: str
    exchanges: List[str]
    min_profit: float = 0.5

class ArbitrageOpportunity(BaseModel):
    id: str
    pair: str
    type: str
    buyExchange: str
    sellExchange: str
    buyPrice: float
    sellPrice: float
    spreadPercentage: float
    estimatedProfit: float
    timestamp: str
    buyVolume: float
    sellVolume: float

class TriangularArbitrageOpportunity(BaseModel):
    id: str
    pair: str
    type: str
    exchange: str
    steps: List[Dict]
    profitPercentage: float
    estimatedProfit: float
    timestamp: str
