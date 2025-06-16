from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from scripts.arbitrage_engine import ArbitrageEngine
from scripts.execution.engine import ExecutionEngine
from scripts.connectors.cex import CEXConnector
from scripts.backtesting.backtest import BacktestEngine
import asyncio
from typing import List, Dict
from websockets.exceptions import ConnectionClosed
import json
from datetime import datetime, timedelta
from api.models import ArbitrageRequest, ArbitrageOpportunity, TriangularArbitrageOpportunity, BotStatus, Trade, ExchangeStatus, BacktestRequest, BacktestResult
import yaml

import logging
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger

log_file = "arbitron.log"
max_bytes = 10 * 1024 * 1024  # 10 MB
backup_count = 5

# Configurar o logger principal
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configurar o handler de arquivo com rotação
file_handler = RotatingFileHandler(log_file, maxBytes=max_bytes, backupCount=backup_count)

# Configurar o formatador JSON
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
file_handler.setFormatter(formatter)

# Adicionar o handler ao logger
logger.addHandler(file_handler)

# Opcional: Configurar um handler de console para ver os logs durante o desenvolvimento
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

app = FastAPI(title="Arbitron - Cryptocurrency Arbitrage Bot API")

# Estado global do bot
class BotState:
    def __init__(self):
        self.status = "stopped"  # running, paused, stopped
        self.mode = "real"  # real, simulation
        self.engine = ArbitrageEngine()
        self.connectors = {
            "binance": CEXConnector("binance"),
            "kraken": CEXConnector("kraken"),
        }
        self.execution_engine = ExecutionEngine(self.connectors)
        self.trades = []  # Simples armazenamento em memória (substituir por DB em produção)
        self.clients = []  # Lista de clientes WebSocket conectados
        self.daily_profit_limit = 0
        self.daily_loss_limit = 0
        self.current_daily_profit = 0
        self.current_daily_loss = 0
        self.last_day_reset = datetime.utcnow().date()
        self.load_settings()

    def load_settings(self):
        with open("config/settings.yaml", "r") as f:
            settings = yaml.safe_load(f)
            self.daily_profit_limit = settings.get("risk_management", {}).get("daily_profit_limit", 0)
            self.daily_loss_limit = settings.get("risk_management", {}).get("daily_loss_limit", 0)

    async def broadcast(self, message: dict):
        """Envia mensagem para todos os clientes WebSocket conectados."""
        disconnected_clients = []
        for client in self.clients:
            try:
                await client.send_json(message)
            except (WebSocketDisconnect, ConnectionClosed):
                disconnected_clients.append(client)
        # Remove clientes desconectados
        self.clients = [client for client in self.clients if client not in disconnected_clients]

    async def scan_opportunities(self):
        """Escaneia oportunidades de arbitragem continuamente."""
        while self.status == "running":
            # Reset diário de lucro/perda
            today = datetime.utcnow().date()
            if today > self.last_day_reset:
                self.current_daily_profit = 0
                self.current_daily_loss = 0
                self.last_day_reset = today
                logger.info("Reset diário de lucro/perda realizado.")

            # Verifica limites de lucro/perda diários
            if self.daily_profit_limit > 0 and self.current_daily_profit >= self.daily_profit_limit:
                logger.warning(f"Limite de lucro diário de {self.daily_profit_limit} USD atingido. Parando o bot.")
                self.status = "stopped"
                await self.broadcast({"type": "status", "data": {"status": self.status, "mode": self.mode, "message": "Daily profit limit reached."}})
                break

            if self.daily_loss_limit > 0 and self.current_daily_loss >= self.daily_loss_limit:
                logger.warning(f"Limite de perda diária de {self.daily_loss_limit} USD atingido. Parando o bot.")
                self.status = "stopped"
                await self.broadcast({"type": "status", "data": {"status": self.status, "mode": self.mode, "message": "Daily loss limit reached."}})
                break

            try:
                market_data = await self.engine.fetch_market_data(list(self.connectors.keys()), ["BTC/USDT", "ETH/USDT"])
                opportunities = self.engine.detect_simple_arbitrage(market_data)
                for exchange in self.connectors.keys():
                    triangular_opps = self.engine.detect_triangular_arbitrage(market_data, exchange)
                    opportunities.extend(triangular_opps)
                
                # Envia oportunidades para clientes WebSocket
                for opp in opportunities:
                    await self.broadcast({"type": "opportunity", "data": opp})
                    if self.mode == "real" and self.status == "running":
                        success = await self.execution_engine.execute_trade(opp)
                        if success:
                            trade = Trade(
                                id=f"trade-{datetime.utcnow().timestamp()}",
                                timestamp=datetime.utcnow().isoformat(),
                                pair=opp["pair"],
                                buy_exchange=opp.get("buyExchange", opp.get("exchange")),
                                sell_exchange=opp.get("sellExchange", opp.get("exchange")),
                                profit=opp.get("estimatedProfit", opp.get("profitPercentage")),
                                status="completed"
                            )
                            self.trades.append(trade.dict())
                            # Atualiza lucro/perda diário
                            self.current_daily_profit += trade.profit  # Assumindo que profit é em USD
                            logger.info(f"Lucro diário atualizado: {self.current_daily_profit} USD")
                        else:
                            # Se a operação falhar, considerar como perda para o limite diário de perda
                            # Isso é uma simplificação, o ideal seria calcular a perda real
                            self.current_daily_loss += opp.get("estimatedLoss", 0) # Assumindo que estimatedLoss é em USD
                            logger.info(f"Perda diária atualizada: {self.current_daily_loss} USD")
            
            except Exception as e:
                logger.error(f"Erro ao escanear oportunidades: {str(e)}")
            await asyncio.sleep(5)  # Intervalo configurável

bot_state = BotState()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Endpoint WebSocket para oportunidades e status do bot."""
    await websocket.accept()
    bot_state.clients.append(websocket)
    try:
        # Envia status inicial
        await websocket.send_json({"type": "status", "data": {"status": bot_state.status, "mode": bot_state.mode}})
        while True:
            await asyncio.sleep(1)  # Mantém a conexão ativa
    except (WebSocketDisconnect, ConnectionClosed):
        bot_state.clients.remove(websocket)

@app.post("/api/v1/arbitrage/scan")
async def scan_arbitrage(request: ArbitrageRequest):
    """Escaneia oportunidades de arbitragem para um par e exchanges especificados."""
    try:
        market_data = await bot_state.engine.fetch_market_data(request.exchanges, [request.pair])
        opportunities = bot_state.engine.detect_simple_arbitrage(market_data)
        if not opportunities:
            raise HTTPException(status_code=404, detail="Nenhuma oportunidade encontrada")
        return opportunities
    except Exception as e:
        logger.error(f"Erro ao escanear arbitragem: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/arbitrage/scan_triangular")
async def scan_triangular_arbitrage(exchange: str):
    """Escaneia oportunidades de arbitragem triangular em uma exchange."""
    try:
        market_data = await bot_state.engine.fetch_market_data([exchange], ["BTC/USDT", "ETH/USDT", "BTC/ETH"])
        opportunities = bot_state.engine.detect_triangular_arbitrage(market_data, exchange)
        if not opportunities:
            raise HTTPException(status_code=404, detail="Nenhuma oportunidade encontrada")
        return opportunities
    except Exception as e:
        logger.error(f"Erro ao escanear arbitragem triangular: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/bot/start")
async def start_bot():
    """Inicia o bot."""
    if bot_state.status == "running":
        raise HTTPException(status_code=400, detail="Bot já está rodando")
    bot_state.status = "running"
    asyncio.create_task(bot_state.scan_opportunities())
    await bot_state.broadcast({"type": "status", "data": {"status": bot_state.status, "mode": bot_state.mode}})
    return {"status": bot_state.status, "mode": bot_state.mode}

@app.post("/api/v1/bot/pause")
async def pause_bot():
    """Pausa o bot."""
    if bot_state.status != "running":
        raise HTTPException(status_code=400, detail="Bot não está rodando")
    bot_state.status = "paused"
    await bot_state.broadcast({"type": "status", "data": {"status": bot_state.status, "mode": bot_state.mode}})
    return {"status": bot_state.status, "mode": bot_state.mode}

@app.post("/api/v1/bot/stop")
async def stop_bot():
    """Para o bot."""
    bot_state.status = "stopped"
    await bot_state.broadcast({"type": "status", "data": {"status": bot_state.status, "mode": bot_state.mode}})
    return {"status": bot_state.status, "mode": bot_state.mode}

@app.post("/api/v1/bot/toggle-mode")
async def toggle_mode():
    """Alterna entre modo real e simulação."""
    bot_state.mode = "simulation" if bot_state.mode == "real" else "real"
    await bot_state.broadcast({"type": "status", "data": {"status": bot_state.status, "mode": bot_state.mode}})
    return {"status": bot_state.status, "mode": bot_state.mode}

@app.get("/api/v1/trades/recent", response_model=List[Trade])
async def get_recent_trades():
    """Retorna os trades recentes."""
    return bot_state.trades[-10:]  # Últimos 10 trades (substituir por consulta ao DB)

@app.get("/api/v1/exchanges/status", response_model=List[ExchangeStatus])
async def get_exchange_status():
    """Retorna o status das conexões com exchanges."""
    statuses = []
    for exchange_id, connector in bot_state.connectors.items():
        is_connected = await connector.test_connection()
        statuses.append({
            "exchange": exchange_id,
            "status": "connected" if is_connected else "disconnected",
            "last_checked": datetime.utcnow().isoformat()
        })
    return statuses

@app.post("/api/v1/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """Executa um backtest com dados históricos."""
    try:
        backtest_engine = BacktestEngine(
            exchanges=request.exchanges,
            pairs=request.pairs,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_balance=request.initial_balance
        )
        result = await backtest_engine.run()
        return result
    except Exception as e:
        logger.error(f"Erro ao executar backtest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



@app.get("/")
async def read_root():
    return {"message": "Welcome to Arbitron API"}


