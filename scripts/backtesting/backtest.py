import pandas as pd
import numpy as np
from scripts.arbitrage_engine import ArbitrageEngine
import ccxt.async_support as ccxt
import asyncio
import logging
from datetime import datetime
from typing import List, Dict
from api.models import Trade

logger = logging.getLogger(__name__)

class BacktestEngine:
    def __init__(self, exchanges: List[str], pairs: List[str], start_date: datetime, end_date: datetime, initial_balance: float):
        self.exchanges = exchanges
        self.pairs = pairs
        self.start_date = start_date
        self.end_date = end_date
        self.initial_balance = initial_balance
        self.engine = ArbitrageEngine()
        self.trades = []

    async def fetch_historical_data(self) -> Dict:
        """Simula dados históricos (substituir por fonte real em produção)."""
        market_data = {}
        for exchange_id in self.exchanges:
            exchange = getattr(ccxt, exchange_id)({'enableRateLimit': True})
            data = {}
            for pair in self.pairs:
                # Simulação simples: preços randomizados para demonstração
                timestamps = pd.date_range(start=self.start_date, end=self.end_date, freq='1H')
                prices = np.random.normal(50000, 1000, len(timestamps))  # Exemplo: BTC/USDT
                data[pair] = [
                    {
                        "timestamp": ts.isoformat(),
                        "bid": price * 0.999,
                        "ask": price * 1.001,
                        "volume": np.random.uniform(10, 100)
                    }
                    for ts, price in zip(timestamps, prices)
                ]
            market_data[exchange_id] = data
            await exchange.close()
        return market_data

    async def run(self) -> Dict:
        """Executa o backtest."""
        try:
            market_data = await self.fetch_historical_data()
            balance = self.initial_balance
            trades = []

            for ts in pd.date_range(start=self.start_date, end=self.end_date, freq='1H'):
                snapshot = {}
                for exchange_id, pairs_data in market_data.items():
                    snapshot[exchange_id] = {}
                    for pair, candles in pairs_data.items():
                        for candle in candles:
                            if candle["timestamp"].startswith(ts.isoformat()):
                                snapshot[exchange_id][pair] = {
                                    "bid": candle["bid"],
                                    "ask": candle["ask"],
                                    "volume": candle["volume"]
                                }
                                break

                opportunities = self.engine.detect_simple_arbitrage(snapshot)
                for exchange in self.exchanges:
                    triangular_opps = self.engine.detect_triangular_arbitrage(snapshot, exchange)
                    opportunities.extend(triangular_opps)

                for opp in opportunities:
                    if opp.get("estimatedProfit", opp.get("profitPercentage", 0)) > 0:
                        trade = Trade(
                            id=f"backtest-{ts.timestamp()}",
                            timestamp=ts.isoformat(),
                            pair=opp["pair"],
                            buy_exchange=opp.get("buyExchange", opp.get("exchange")),
                            sell_exchange=opp.get("sellExchange", opp.get("exchange")),
                            profit=opp.get("estimatedProfit", opp.get("profitPercentage")),
                            status="completed"
                        )
                        trades.append(trade.dict())
                        balance += trade.profit

            # Calcula métricas
            total_trades = len(trades)
            total_profit = balance - self.initial_balance
            win_rate = len([t for t in trades if t["profit"] > 0]) / total_trades if total_trades > 0 else 0
            returns = pd.Series([t["profit"] for t in trades])
            max_drawdown = self.calculate_max_drawdown(returns)
            sharpe_ratio = self.calculate_sharpe_ratio(returns)

            return {
                "total_profit": total_profit,
                "total_trades": total_trades,
                "win_rate": win_rate * 100,
                "max_drawdown": max_drawdown,
                "sharpe_ratio": sharpe_ratio,
                "trades": trades
            }
        except Exception as e:
            logger.error(f"Erro no backtest: {str(e)}")
            raise

    def calculate_max_drawdown(self, returns: pd.Series) -> float:
        """Calcula o máximo drawdown."""
        cumulative = (1 + returns).cumprod()
        peak = cumulative.expanding().max()
        drawdown = (cumulative - peak) / peak
        return -drawdown.min() * 100 if not drawdown.empty else 0

    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """Calcula o Sharpe Ratio (anualizado)."""
        mean_return = returns.mean()
        std_return = returns.std()
        if std_return == 0:
            return 0
        return (mean_return * 252) / (std_return * np.sqrt(252))  # 252 dias de negociação

async def main():
    backtest = BacktestEngine(
        exchanges=["binance", "kraken"],
        pairs=["BTC/USDT"],
        start_date=datetime(2025, 1, 1),
        end_date=datetime(2025, 6, 1),
        initial_balance=10000
    )
    result = await backtest.run()
    logger.info(f"Backtest Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())