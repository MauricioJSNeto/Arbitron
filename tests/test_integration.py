"""
Testes de integração para o projeto Arbitron.
"""
import unittest
from unittest.mock import Mock, patch
from src.arbitrage import ArbitrageEngine
from src.api_manager import APIManager, BinanceAPI
from src.notifications import NotificationManager, TelegramNotificationProvider

class TestArbitronIntegration(unittest.TestCase):
    """Testes de integração do sistema completo."""
    
    def setUp(self):
        """Configuração inicial para os testes de integração."""
        self.arbitrage_engine = ArbitrageEngine(['binance', 'coinbase'])
        self.api_manager = APIManager()
        self.notification_manager = NotificationManager()
    
    def test_full_arbitrage_workflow(self):
        """Testa o fluxo completo de detecção de arbitragem."""
        # Este teste simularia um fluxo completo:
        # 1. Obter preços das APIs
        # 2. Detectar oportunidades de arbitragem
        # 3. Enviar notificações
        
        # Configurar mocks
        mock_binance_api = Mock()
        mock_coinbase_api = Mock()
        
        # Simular preços diferentes para criar oportunidade
        mock_binance_api.get_price.return_value = Mock(price=50000.0)
        mock_coinbase_api.get_price.return_value = Mock(price=50600.0)
        
        self.api_manager.add_exchange('binance', mock_binance_api)
        self.api_manager.add_exchange('coinbase', mock_coinbase_api)
        
        # Obter preços
        prices = self.api_manager.get_prices('BTC/USDT')
        
        # Verificar se obteve preços de ambas exchanges
        self.assertEqual(len(prices), 2)
        self.assertIsNotNone(prices['binance'])
        self.assertIsNotNone(prices['coinbase'])
    
    @patch('src.notifications.requests.post')
    def test_notification_integration(self, mock_post):
        """Testa integração do sistema de notificações."""
        # Configurar mock da resposta do Telegram
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        # Configurar provedor de notificação
        telegram_provider = TelegramNotificationProvider('fake_token', 'fake_chat_id')
        self.notification_manager.add_provider(telegram_provider)
        
        # Simular dados de oportunidade
        opportunity_data = {
            'symbol': 'BTC/USDT',
            'profit_percentage': 1.2,
            'exchange_buy': 'binance',
            'exchange_sell': 'coinbase',
            'buy_price': 50000.0,
            'sell_price': 50600.0,
            'timestamp': '2023-01-01 12:00:00'
        }
        
        # Enviar notificação
        self.notification_manager.send_arbitrage_alert(opportunity_data)
        
        # Verificar se a requisição foi feita
        mock_post.assert_called_once()

if __name__ == '__main__':
    unittest.main()

