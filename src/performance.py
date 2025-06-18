"""
Módulo de otimização de banco de dados e caching.
"""
from typing import Any, Optional, Dict, List
import sqlite3
from cachetools import TTLCache, cached
import time
import logging
from contextlib import contextmanager

class DatabaseOptimizer:
    """Classe para otimização de consultas ao banco de dados."""
    
    def __init__(self, db_path: str):
        """
        Inicializa o otimizador de banco de dados.
        
        Args:
            db_path: Caminho para o arquivo do banco de dados SQLite
        """
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexões com o banco de dados."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permite acesso por nome de coluna
        try:
            yield conn
        finally:
            conn.close()
    
    def create_indexes(self) -> None:
        """Cria índices para otimizar consultas frequentes."""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_arbitrage_symbol ON arbitrage_opportunities(symbol)",
            "CREATE INDEX IF NOT EXISTS idx_arbitrage_timestamp ON arbitrage_opportunities(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_arbitrage_profit ON arbitrage_opportunities(profit_percentage)",
            "CREATE INDEX IF NOT EXISTS idx_price_data_symbol_exchange ON price_data(symbol, exchange)",
            "CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp)"
        ]
        
        with self.get_connection() as conn:
            for index_sql in indexes:
                try:
                    conn.execute(index_sql)
                    self.logger.info(f"Índice criado: {index_sql}")
                except sqlite3.Error as e:
                    self.logger.error(f"Erro ao criar índice: {e}")
            conn.commit()
    
    def analyze_database(self) -> None:
        """Analisa o banco de dados para otimizar o plano de consultas."""
        with self.get_connection() as conn:
            try:
                conn.execute("ANALYZE")
                conn.commit()
                self.logger.info("Análise do banco de dados concluída")
            except sqlite3.Error as e:
                self.logger.error(f"Erro ao analisar banco de dados: {e}")

class CacheManager:
    """Gerenciador de cache para dados frequentemente acessados."""
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        """
        Inicializa o gerenciador de cache.
        
        Args:
            max_size: Tamanho máximo do cache
            ttl: Time-to-live em segundos
        """
        self.price_cache = TTLCache(maxsize=max_size, ttl=ttl)
        self.opportunity_cache = TTLCache(maxsize=max_size, ttl=ttl)
        self.logger = logging.getLogger(__name__)
    
    @cached(cache=lambda self: self.price_cache)
    def get_cached_price(self, symbol: str, exchange: str) -> Optional[Dict[str, Any]]:
        """
        Obtém preço do cache.
        
        Args:
            symbol: Símbolo da criptomoeda
            exchange: Nome da exchange
            
        Returns:
            Dados de preço em cache ou None
        """
        cache_key = f"{symbol}_{exchange}"
        return self.price_cache.get(cache_key)
    
    def set_price_cache(self, symbol: str, exchange: str, price_data: Dict[str, Any]) -> None:
        """
        Define preço no cache.
        
        Args:
            symbol: Símbolo da criptomoeda
            exchange: Nome da exchange
            price_data: Dados de preço
        """
        cache_key = f"{symbol}_{exchange}"
        self.price_cache[cache_key] = price_data
        self.logger.debug(f"Preço cacheado: {cache_key}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do cache.
        
        Returns:
            Dicionário com estatísticas do cache
        """
        return {
            'price_cache': {
                'size': len(self.price_cache),
                'max_size': self.price_cache.maxsize,
                'hits': getattr(self.price_cache, 'hits', 0),
                'misses': getattr(self.price_cache, 'misses', 0)
            },
            'opportunity_cache': {
                'size': len(self.opportunity_cache),
                'max_size': self.opportunity_cache.maxsize,
                'hits': getattr(self.opportunity_cache, 'hits', 0),
                'misses': getattr(self.opportunity_cache, 'misses', 0)
            }
        }
    
    def clear_cache(self) -> None:
        """Limpa todos os caches."""
        self.price_cache.clear()
        self.opportunity_cache.clear()
        self.logger.info("Cache limpo")

class PerformanceMonitor:
    """Monitor de performance para operações críticas."""
    
    def __init__(self):
        """Inicializa o monitor de performance."""
        self.metrics = {}
        self.logger = logging.getLogger(__name__)
    
    def time_operation(self, operation_name: str):
        """
        Decorator para medir tempo de operações.
        
        Args:
            operation_name: Nome da operação
        """
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    end_time = time.time()
                    duration = end_time - start_time
                    self.record_metric(operation_name, duration)
            return wrapper
        return decorator
    
    def record_metric(self, metric_name: str, value: float) -> None:
        """
        Registra uma métrica de performance.
        
        Args:
            metric_name: Nome da métrica
            value: Valor da métrica
        """
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        
        self.metrics[metric_name].append({
            'value': value,
            'timestamp': time.time()
        })
        
        # Manter apenas os últimos 100 registros
        if len(self.metrics[metric_name]) > 100:
            self.metrics[metric_name] = self.metrics[metric_name][-100:]
        
        self.logger.debug(f"Métrica registrada: {metric_name} = {value:.4f}s")
    
    def get_average_time(self, metric_name: str) -> Optional[float]:
        """
        Calcula o tempo médio de uma operação.
        
        Args:
            metric_name: Nome da métrica
            
        Returns:
            Tempo médio em segundos ou None se não houver dados
        """
        if metric_name not in self.metrics or not self.metrics[metric_name]:
            return None
        
        values = [m['value'] for m in self.metrics[metric_name]]
        return sum(values) / len(values)
    
    def get_performance_report(self) -> Dict[str, Any]:
        """
        Gera relatório de performance.
        
        Returns:
            Dicionário com métricas de performance
        """
        report = {}
        for metric_name, records in self.metrics.items():
            if records:
                values = [r['value'] for r in records]
                report[metric_name] = {
                    'count': len(values),
                    'average': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                    'last_recorded': records[-1]['timestamp']
                }
        return report

