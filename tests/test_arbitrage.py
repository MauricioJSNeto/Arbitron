"""
Testes unitários para o módulo de arbitragem.
"""
import unittest
from decimal import Decimal
from src.arbitrage import ArbitrageEngine, ArbitrageOpportunity

class TestArbitrageEngine(unittest.TestCase):
    """Testes para a classe ArbitrageEngine."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        self.engine = ArbitrageEngine(
            exchanges=['binance', 'coinbase'],
            min_profit=Decimal('1.0')
        )
    
    def test_calculate_profit_positive(self):
        """Testa cálculo de lucro positivo."""
        buy_price = Decimal('100.0')
        sell_price = Decimal('105.0')
        
        profit = self.engine.calculate_profit(buy_price, sell_price)
        
        self.assertEqual(profit, Decimal('5.0'))
    
    def test_calculate_profit_negative(self):
        """Testa cálculo de lucro negativo."""
        buy_price = Decimal('100.0')
        sell_price = Decimal('95.0')
        
        profit = self.engine.calculate_profit(buy_price, sell_price)
        
        self.assertEqual(profit, Decimal('-5.0'))
    
    def test_calculate_profit_zero_buy_price(self):
        """Testa cálculo com preço de compra zero."""
        buy_price = Decimal('0.0')
        sell_price = Decimal('100.0')
        
        profit = self.engine.calculate_profit(buy_price, sell_price)
        
        self.assertEqual(profit, Decimal('0.0'))
    
    def test_find_opportunities_empty_list(self):
        """Testa busca de oportunidades retornando lista vazia."""
        opportunities = self.engine.find_opportunities('BTC/USDT')
        
        self.assertIsInstance(opportunities, list)
        self.assertEqual(len(opportunities), 0)

class TestArbitrageOpportunity(unittest.TestCase):
    """Testes para a classe ArbitrageOpportunity."""
    
    def test_arbitrage_opportunity_creation(self):
        """Testa criação de uma oportunidade de arbitragem."""
        opportunity = ArbitrageOpportunity(
            exchange_buy='binance',
            exchange_sell='coinbase',
            symbol='BTC/USDT',
            buy_price=Decimal('50000.0'),
            sell_price=Decimal('50500.0'),
            profit_percentage=Decimal('1.0'),
            volume=Decimal('0.1')
        )
        
        self.assertEqual(opportunity.exchange_buy, 'binance')
        self.assertEqual(opportunity.exchange_sell, 'coinbase')
        self.assertEqual(opportunity.symbol, 'BTC/USDT')
        self.assertEqual(opportunity.buy_price, Decimal('50000.0'))
        self.assertEqual(opportunity.sell_price, Decimal('50500.0'))
        self.assertEqual(opportunity.profit_percentage, Decimal('1.0'))
        self.assertEqual(opportunity.volume, Decimal('0.1'))

if __name__ == '__main__':
    unittest.main()

