import ccxt.async_support as ccxt
import asyncio

async def detect_simple_arbitrage(pair: str, exchanges: list, min_profit: float = 0.01) -> list:
    results = []
    async def fetch_price(exchange_id):
        exchange = getattr(ccxt, exchange_id)()
        ticker = await exchange.fetch_ticker(pair)
        await exchange.close()
        return {"exchange": exchange_id, "bid": ticker["bid"], "ask": ticker["ask"]}

    prices = await asyncio.gather(*(fetch_price(ex) for ex in exchanges))
    for buy_ex in prices:
        for sell_ex in prices:
            if buy_ex["exchange"] == sell_ex["exchange"]:
                continue
            buy_price = buy_ex["bid"]
            sell_price = sell_ex["ask"]
            fees = 0.002  # Exemplo: 0.2% de taxa
            profit = (sell_price - buy_price - fees * (buy_price + sell_price)) / buy_price
            if profit > min_profit:
                results.append({
                    "buy_exchange": buy_ex["exchange"],
                    "sell_exchange": sell_ex["exchange"],
                    "pair": pair,
                    "buy_price": buy_price,
                    "sell_price": sell_price,
                    "profit_percent": profit * 100
                })
    return results

async def main():
    opportunities = await detect_simple_arbitrage("BTC/USDT", ["binance", "kraken"], 0.01)
    for opp in opportunities:
        print(f"Oportunidade: Comprar em {opp['buy_exchange']} a {opp['buy_price']}, Vender em {opp['sell_exchange']} a {opp['sell_price']}, Lucro: {opp['profit_percent']:.2f}%")

if __name__ == "__main__":
    asyncio.run(main())