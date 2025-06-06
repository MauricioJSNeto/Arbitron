from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

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

class BotStatus(BaseModel):
    status: str  # running, paused, stopped
    mode: str  # real, simulation

class Trade(BaseModel):
    id: str
    timestamp: str
    pair: str
    buy_exchange: str
    sell_exchange: str
    profit: float
    status: str  # completed, failed

class ExchangeStatus(BaseModel):
    exchange: str
    status: str  # connected, disconnected
    last_checked: str

class BacktestRequest(BaseModel):
    exchanges: List[str]
    pairs: List[str]
    start_date: datetime
    end_date: datetime
    initial_balance: float = 10000.0

class BacktestResult(BaseModel):
    total_profit: float
    total_trades: int
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    trades: List[Trade]
