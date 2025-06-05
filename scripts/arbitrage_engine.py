# Core Arbitrage Engine Logic
# This script implements the core arbitrage detection algorithm

import time
import json
from typing import Dict, List, Tuple, Optional
import ccxt.async_support as ccxt
import asyncio
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ArbitrageEngine:
    """
    Core engine for detecting arbitrage opportunities across exchanges
    """
    
    def __init__(self, min_profit_threshold: float = 0.5):
        """
        Initialize the arbitrage engine
        
        Args:
            min_profit_threshold: Minimum profit percentage to consider an opportunity valid
        """
        self.min_profit_threshold = min_profit_threshold
        self.exchange_fees = {
            "binance": {"maker": 0.1, "taker": 0.1},  # Percentage
            "kraken": {"maker": 0.16, "taker": 0.26},
            "coinbase": {"maker": 0.4, "taker": 0.6},
            "kucoin": {"maker": 0.1, "taker": 0.1},
            "bybit": {"maker": 0.1, "taker": 0.1},
            "okx": {"maker": 0.08, "taker": 0.1},
            "uniswap": {"maker": 0.3, "taker": 0.3, "gas": 15},  # Gas in USD
            "pancakeswap": {"maker": 0.25, "taker": 0.25, "gas": 1},
        }
    
    async def fetch_market_data(self, exchanges: List[str], pairs: List[str]) -> Dict:
        """
        Fetch market data from multiple exchanges using CCXT
        
        Args:
            exchanges: List of exchange IDs
            pairs: List of trading pairs
            
        Returns:
            Dictionary of exchange -> pair -> price data
        """
        market_data = {}
        async def fetch_exchange_data(exchange_id):
            try:
                exchange = getattr(ccxt, exchange_id)({'enableRateLimit': True})
                data = {}
                for pair in pairs:
                    try:
                        ticker = await exchange.fetch_ticker(pair)
                        data[pair] = {
                            "bid": ticker["bid"],
                            "ask": ticker["ask"],
                            "volume": ticker["baseVolume"]
                        }
                    except Exception as e:
                        logger.warning(f"Par {pair} não disponível em {exchange_id}: {str(e)}")
                market_data[exchange_id] = data
                await exchange.close()
            except Exception as e:
                logger.error(f"Erro ao buscar dados de {exchange_id}: {str(e)}")
        
        await asyncio.gather(*(fetch_exchange_data(ex) for ex in exchanges))
        return market_data
    
    def detect_simple_arbitrage(self, market_data: Dict) -> List[Dict]:
        """
        Detect simple arbitrage opportunities (same pair across different exchanges)
        
        Args:
            market_data: Dictionary of exchange -> pair -> price data
            
        Returns:
            List of arbitrage opportunities
        """
        opportunities = []
        
        # Get all pairs that exist on multiple exchanges
        all_pairs = set()
        for exchange_data in market_data.values():
            all_pairs.update(exchange_data.keys())
        
        # Check each pair
        for pair in all_pairs:
            # Get all exchanges that have this pair
            exchanges_with_pair = []
            for exchange, exchange_data in market_data.items():
                if pair in exchange_data:
                    exchanges_with_pair.append({
                        "exchange": exchange,
                        "bid": exchange_data[pair]["bid"],
                        "ask": exchange_data[pair]["ask"],
                        "volume": exchange_data[pair].get("volume", 0)
                    })
            
            # Need at least 2 exchanges to compare
            if len(exchanges_with_pair) < 2:
                continue
            
            # Find best bid and ask across exchanges
            for buy_ex in exchanges_with_pair:
                for sell_ex in exchanges_with_pair:
                    # Skip same exchange
                    if buy_ex["exchange"] == sell_ex["exchange"]:
                        continue
                    
                    # Calculate potential profit
                    buy_price = buy_ex["ask"]  # Price to buy at
                    sell_price = sell_ex["bid"]  # Price to sell at
                    
                    # Calculate fees
                    buy_fee_pct = self.exchange_fees[buy_ex["exchange"]]["taker"] / 100
                    sell_fee_pct = self.exchange_fees[sell_ex["exchange"]]["taker"] / 100
                    
                    # Calculate effective prices after fees
                    effective_buy = buy_price * (1 + buy_fee_pct)
                    effective_sell = sell_price * (1 - sell_fee_pct)
                    
                    # Calculate profit percentage
                    profit_pct = ((effective_sell / effective_buy) - 1) * 100
                    
                    # If profitable above threshold
                    if profit_pct > self.min_profit_threshold:
                        # Calculate estimated profit for 1 unit
                        estimated_profit = sell_price - buy_price - (buy_price * buy_fee_pct) - (sell_price * sell_fee_pct)
                        
                        # Create opportunity object
                        opportunity = {
                            "id": f"{buy_ex['exchange']}-{sell_ex['exchange']}-{pair}-{time.time()}",
                            "pair": pair,
                            "type": "simple",
                            "buyExchange": buy_ex["exchange"],
                            "sellExchange": sell_ex["exchange"],
                            "buyPrice": buy_price,
                            "sellPrice": sell_price,
                            "spreadPercentage": profit_pct,
                            "estimatedProfit": estimated_profit,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                            "buyVolume": buy_ex["volume"],
                            "sellVolume": sell_ex["volume"]
                        }
                        
                        opportunities.append(opportunity)
                        logger.info(f"Oportunidade simples encontrada: {opportunity}")
        
        # Sort by profit percentage (descending)
        opportunities.sort(key=lambda x: x["spreadPercentage"], reverse=True)
        return opportunities
    
    def detect_triangular_arbitrage(self, market_data: Dict, exchange: str) -> List[Dict]:
        """
        Detect triangular arbitrage opportunities within a single exchange
        
        Args:
            market_data: Dictionary of exchange -> pair -> price data
            exchange: The exchange to check for triangular arbitrage
            
        Returns:
            List of triangular arbitrage opportunities
        """
        if exchange not in market_data:
            logger.warning(f"Exchange {exchange} não encontrada nos dados de mercado")
            return []
        
        opportunities = []
        exchange_data = market_data[exchange]
        
        # Extract all currencies from pairs
        currencies = set()
        for pair in exchange_data.keys():
            base, quote = pair.split('/')
            currencies.add(base)
            currencies.add(quote)
        
        # For each currency triplet (A, B, C), check if we can go A->B->C->A
        for a in currencies:
            for b in currencies:
                if a == b:
                    continue
                    
                for c in currencies:
                    if a == c or b == c:
                        continue
                    
                    # Check if all required pairs exist
                    ab_pair = f"{a}/{b}"
                    bc_pair = f"{b}/{c}"
                    ca_pair = f"{c}/{a}"
                    
                    # We might need to invert some pairs
                    ab_exists = ab_pair in exchange_data
                    ba_exists = f"{b}/{a}" in exchange_data
                    bc_exists = bc_pair in exchange_data
                    cb_exists = f"{c}/{b}" in exchange_data
                    ca_exists = ca_pair in exchange_data
                    ac_exists = f"{a}/{c}" in exchange_data
                    
                    if not ((ab_exists or ba_exists) and (bc_exists or cb_exists) and (ca_exists or ac_exists)):
                        continue
                    
                    # Calculate rates for each step
                    try:
                        # Step 1: A -> B
                        if ab_exists:
                            rate_ab = 1 / exchange_data[ab_pair]["ask"]  # How much B we get for 1 A
                            fee_ab = self.exchange_fees[exchange]["taker"] / 100
                        else:
                            rate_ab = exchange_data[f"{b}/{a}"]["bid"]  # How much B we get for 1 A
                            fee_ab = self.exchange_fees[exchange]["taker"] / 100
                        
                        # Step 2: B -> C
                        if bc_exists:
                            rate_bc = 1 / exchange_data[bc_pair]["ask"]  # How much C we get for 1 B
                            fee_bc = self.exchange_fees[exchange]["taker"] / 100
                        else:
                            rate_bc = exchange_data[f"{c}/{b}"]["bid"]  # How much C we get for 1 B
                            fee_bc = self.exchange_fees[exchange]["taker"] / 100
                        
                        # Step 3: C -> A
                        if ca_exists:
                            rate_ca = 1 / exchange_data[ca_pair]["ask"]  # How much A we get for 1 C
                            fee_ca = self.exchange_fees[exchange]["taker"] / 100
                        else:
                            rate_ca = exchange_data[f"{a}/{c}"]["bid"]  # How much A we get for 1 C
                            fee_ca = self.exchange_fees[exchange]["taker"] / 100
                        
                        # Calculate final amount after all trades (starting with 1 unit of A)
                        amount_b = rate_ab * (1 - fee_ab)  # A -> B
                        amount_c = amount_b * rate_bc * (1 - fee_bc)  # B -> C
                        final_amount_a = amount_c * rate_ca * (1 - fee_ca)  # C -> A
                        
                        # Calculate profit percentage
                        profit_pct = ((final_amount_a / 1) - 1) * 100
                        
                        if profit_pct > self.min_profit_threshold:
                            opportunity = {
                                "id": f"{exchange}-triangular-{a}-{b}-{c}-{time.time()}",
                                "pair": f"{a}/{b}/{c}",
                                "type": "triangular",
                                "exchange": exchange,
                                "steps": [
                                    {"pair": ab_pair if ab_exists else f"{b}/{a}", "rate": rate_ab, "fee": fee_ab},
                                    {"pair": bc_pair if bc_exists else f"{c}/{b}", "rate": rate_bc, "fee": fee_bc},
                                    {"pair": ca_pair if ca_exists else f"{a}/{c}", "rate": rate_ca, "fee": fee_ca}
                                ],
                                "profitPercentage": profit_pct,
                                "estimatedProfit": final_amount_a - 1,
                                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                            }
                            opportunities.append(opportunity)
                            logger.info(f"Oportunidade triangular encontrada: {opportunity}")
                    
                    except Exception as e:
                        logger.error(f"Erro ao calcular arbitragem triangular {a}-{b}-{c}: {str(e)}")
                        continue
        
        # Sort by profit percentage (descending)
        opportunities.sort(key=lambda x: x["profitPercentage"], reverse=True)
        return opportunities

async def main():
    engine = ArbitrageEngine(min_profit_threshold=0.5)
    exchanges = ["binance", "kraken"]
    pairs = ["BTC/USDT", "ETH/USDT"]
    market_data = await engine.fetch_market_data(exchanges, pairs)
    simple_opportunities = engine.detect_simple_arbitrage(market_data)
    triangular_opportunities = engine.detect_triangular_arbitrage(market_data, "binance")
    
    for opp in simple_opportunities:
        logger.info(f"Simple: {opp['buyExchange']} -> {opp['sellExchange']} ({opp['pair']}): {opp['spreadPercentage']:.2f}%")
    for opp in triangular_opportunities:
        logger.info(f"Triangular: {opp['exchange']} ({opp['pair']}): {opp['profitPercentage']:.2f}%")

if __name__ == "__main__":
    asyncio.run(main())
