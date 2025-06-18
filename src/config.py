"""
Módulo de configuração e gerenciamento de segredos.
"""
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from pydantic import BaseSettings, validator
import logging

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

class Settings(BaseSettings):
    """Configurações da aplicação usando Pydantic."""
    
    # Configurações do banco de dados
    database_url: str = "sqlite:///arbitron.db"
    
    # Configurações de APIs
    binance_api_key: Optional[str] = None
    binance_api_secret: Optional[str] = None
    coinbase_api_key: Optional[str] = None
    coinbase_api_secret: Optional[str] = None
    
    # Configurações de arbitragem
    min_profit_percentage: float = 1.0
    max_trade_amount: float = 1000.0
    
    # Configurações de notificações
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    email_user: Optional[str] = None
    email_password: Optional[str] = None
    
    # Configurações de logging
    log_level: str = "INFO"
    log_file: str = "arbitron.log"
    
    @validator('min_profit_percentage')
    def validate_min_profit(cls, v):
        """Valida o percentual mínimo de lucro."""
        if v < 0:
            raise ValueError('Percentual mínimo de lucro deve ser positivo')
        return v
    
    @validator('max_trade_amount')
    def validate_max_trade_amount(cls, v):
        """Valida o valor máximo de trade."""
        if v <= 0:
            raise ValueError('Valor máximo de trade deve ser positivo')
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

def get_settings() -> Settings:
    """Retorna as configurações da aplicação."""
    return Settings()

def setup_logging(settings: Settings) -> None:
    """
    Configura o sistema de logging.
    
    Args:
        settings: Configurações da aplicação
    """
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(settings.log_file),
            logging.StreamHandler()
        ]
    )

# Instância global das configurações
settings = get_settings()

