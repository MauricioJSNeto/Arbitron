# Core Arbitrage Engine Logic
# This script demonstrates the core arbitrage detection algorithm

import time
import json
from typing import Dict, List, Tuple, Optional
import numpy as np

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
            "Binance": {"maker": 0.1, "taker": 0.1},  # Percentage
            "Kraken": {"maker": 0.16, "taker": 0.26},
            "Coinbase": {"maker": 0.4, "taker": 0.6},
            "KuCoin": {"maker": 0.1, "taker": 0.1},
            "Bybit": {"maker": 0.1, "taker": 0.1},
            "OKX": {"maker": 0.08, "taker": 0.1},
            # DEX fees would include gas estimates
            "Uniswap": {"maker": 0.3, "taker": 0.3, "gas": 15},  # Gas in USD
            "PancakeSwap": {"maker": 0.25, "taker": 0.25, "gas": 1},
        }
    
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
                    # Step 1: A -> B
                    if ab_exists:
                        rate_ab = 1 / exchange_data[ab_pair]["ask"]  # How much B we get for 1 A
                    else:
                        rate_ab = exchange_data[f"{b}/{a}"]["bid"]  # How much B we get for 1 A
                    
                    # Step 2: B -> C
                    if bc_exists:
                        rate_bc = 1 / exchange_data[bc_pair]["ask"]  # How much C we get for 1 B
                    else:
                        rate_bc = exchange_data[f"{c}/{b}"]["bid"]  # How much C we get for 1 B
