import ccxt.async_support as ccxt
import asyncio
import logging

logger = logging.getLogger(__name__)

class CEXConnector:
    def __init__(self, exchange_id: str, api_key: str = None, api_secret: str = None):
        """
        Inicializa um conector para uma exchange centralizada.
        :param exchange_id: ID da exchange (ex: 'binance')
        :param api_key: Chave API (opcional)
        :param api_secret: Chave secreta (opcional)
        """
        self.exchange_id = exchange_id
        self.exchange = getattr(ccxt, exchange_id)({
            'enableRateLimit': True,
            'apiKey': api_key,
            'secret': api_secret
        })

    async def fetch_ticker(self, pair: str) -> dict:
        """
        Busca o ticker de um par de negociação.
        :param pair: Par de negociação (ex: 'BTC/USDT')
        :return: Dados do ticker
        """
        try:
            ticker = await self.exchange.fetch_ticker(pair)
            return {
                "bid": ticker["bid"],
                "ask": ticker["ask"],
                "volume": ticker["baseVolume"]
            }
        except Exception as e:
            logger.error(f"Erro ao buscar ticker em {self.exchange_id}: {str(e)}")
            return None
        finally:
            await self.exchange.close()

    async def test_connection(self) -> bool:
        """
        Testa a conexão com a exchange.
        :return: True se conectado, False caso contrário
        """
        try:
            await self.exchange.fetch_tickers()
            logger.info(f"Conexão com {self.exchange_id} bem-sucedida")
            return True
        except Exception as e:
            logger.error(f"Falha na conexão com {self.exchange_id}: {str(e)}")
            return False
        finally:
            await self.exchange.close()

async def main():
    connector = CEXConnector("binance")
    result = await connector.test_connection()
    logger.info(f"Conexão com Binance: {'OK' if result else 'Falhou'}")
    ticker = await connector.fetch_ticker("BTC/USDT")
    if ticker:
        logger.info(f"Ticker BTC/USDT: {ticker['bid']} (bid), {ticker['ask']} (ask)")

if __name__ == "__main__":
    asyncio.run(main())
