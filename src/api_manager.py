"""
Módulo de gerenciamento de APIs para exchanges.
"""
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
import requests
import os
from dataclasses import dataclass

@dataclass
class PriceData:
    """Dados de preço de uma exchange."""
    symbol: str
    price: float
    volume: float
    timestamp: int
    exchange: str

class ExchangeAPI(ABC):
    """Classe abstrata para APIs de exchanges."""
    
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        """
        Inicializa a API da exchange.
        
        Args:
            api_key: Chave da API (carregada de variável de ambiente se não fornecida)
            api_secret: Segredo da API (carregado de variável de ambiente se não fornecido)
        """
        self.api_key = api_key or os.getenv(f'{self.__class__.__name__.upper()}_API_KEY')
        self.api_secret = api_secret or os.getenv(f'{self.__class__.__name__.upper()}_API_SECRET')
    
    @abstractmethod
    def get_price(self, symbol: str) -> Optional[PriceData]:
        """
        Obtém o preço atual de um símbolo.
        
        Args:
            symbol: Símbolo da criptomoeda
            
        Returns:
            Dados de preço ou None se não encontrado
        """
        pass
    
    @abstractmethod
    def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """
        Obtém o livro de ordens de um símbolo.
        
        Args:
            symbol: Símbolo da criptomoeda
            
        Returns:
            Dados do livro de ordens
        """
        pass

class BinanceAPI(ExchangeAPI):
    """Implementação da API da Binance."""
    
    BASE_URL = "https://api.binance.com/api/v3"
    
    def get_price(self, symbol: str) -> Optional[PriceData]:
        """Implementação específica para Binance."""
        try:
            response = requests.get(f"{self.BASE_URL}/ticker/price", params={"symbol": symbol})
            response.raise_for_status()
            data = response.json()
            
            return PriceData(
                symbol=data['symbol'],
                price=float(data['price']),
                volume=0.0,  # Seria obtido de outra endpoint
                timestamp=0,  # Seria obtido de outra endpoint
                exchange='binance'
            )
        except Exception as e:
            print(f"Erro ao obter preço da Binance: {e}")
            return None
    
    def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """Implementação específica para Binance."""
        try:
            response = requests.get(f"{self.BASE_URL}/depth", params={"symbol": symbol})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Erro ao obter orderbook da Binance: {e}")
            return {}

class APIManager:
    """Gerenciador de múltiplas APIs de exchanges."""
    
    def __init__(self):
        """Inicializa o gerenciador de APIs."""
        self.exchanges: Dict[str, ExchangeAPI] = {}
    
    def add_exchange(self, name: str, api: ExchangeAPI) -> None:
        """
        Adiciona uma exchange ao gerenciador.
        
        Args:
            name: Nome da exchange
            api: Instância da API da exchange
        """
        self.exchanges[name] = api
    
    def get_prices(self, symbol: str) -> Dict[str, Optional[PriceData]]:
        """
        Obtém preços de todas as exchanges configuradas.
        
        Args:
            symbol: Símbolo da criptomoeda
            
        Returns:
            Dicionário com preços de cada exchange
        """
        prices = {}
        for name, api in self.exchanges.items():
            prices[name] = api.get_price(symbol)
        return prices

