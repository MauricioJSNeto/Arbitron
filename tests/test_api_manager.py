"""
Testes unitários para o módulo de gerenciamento de APIs.
"""
import unittest
from unittest.mock import Mock, patch
from src.api_manager import APIManager, BinanceAPI, PriceData

class TestAPIManager(unittest.TestCase):
    """Testes para a classe APIManager."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        self.api_manager = APIManager()
    
    def test_add_exchange(self):
        """Testa adição de uma exchange."""
        mock_api = Mock()
        self.api_manager.add_exchange('test_exchange', mock_api)
        
        self.assertIn('test_exchange', self.api_manager.exchanges)
        self.assertEqual(self.api_manager.exchanges['test_exchange'], mock_api)
    
    def test_get_prices(self):
        """Testa obtenção de preços de múltiplas exchanges."""
        # Criar mocks para as APIs
        mock_api1 = Mock()
        mock_api2 = Mock()
        
        # Configurar retornos dos mocks
        price_data1 = PriceData('BTC/USDT', 50000.0, 100.0, 1234567890, 'exchange1')
        price_data2 = PriceData('BTC/USDT', 50100.0, 150.0, 1234567890, 'exchange2')
        
        mock_api1.get_price.return_value = price_data1
        mock_api2.get_price.return_value = price_data2
        
        # Adicionar exchanges ao manager
        self.api_manager.add_exchange('exchange1', mock_api1)
        self.api_manager.add_exchange('exchange2', mock_api2)
        
        # Testar obtenção de preços
        prices = self.api_manager.get_prices('BTC/USDT')
        
        self.assertEqual(len(prices), 2)
        self.assertEqual(prices['exchange1'], price_data1)
        self.assertEqual(prices['exchange2'], price_data2)

class TestBinanceAPI(unittest.TestCase):
    """Testes para a classe BinanceAPI."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        self.api = BinanceAPI()
    
    @patch('src.api_manager.requests.get')
    def test_get_price_success(self, mock_get):
        """Testa obtenção de preço com sucesso."""
        # Configurar mock da resposta
        mock_response = Mock()
        mock_response.json.return_value = {
            'symbol': 'BTCUSDT',
            'price': '50000.00'
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Testar obtenção de preço
        price_data = self.api.get_price('BTCUSDT')
        
        self.assertIsNotNone(price_data)
        self.assertEqual(price_data.symbol, 'BTCUSDT')
        self.assertEqual(price_data.price, 50000.0)
        self.assertEqual(price_data.exchange, 'binance')
    
    @patch('src.api_manager.requests.get')
    def test_get_price_failure(self, mock_get):
        """Testa falha na obtenção de preço."""
        # Configurar mock para lançar exceção
        mock_get.side_effect = Exception("API Error")
        
        # Testar obtenção de preço
        price_data = self.api.get_price('BTCUSDT')
        
        self.assertIsNone(price_data)

if __name__ == '__main__':
    unittest.main()

