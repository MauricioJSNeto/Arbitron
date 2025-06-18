"""
Módulo de sistema de notificações.
"""
from typing import Optional, List
from abc import ABC, abstractmethod
import smtplib
import requests
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from dataclasses import dataclass
import logging

@dataclass
class Notification:
    """Representa uma notificação."""
    title: str
    message: str
    priority: str = "normal"  # low, normal, high, urgent

class NotificationProvider(ABC):
    """Classe abstrata para provedores de notificação."""
    
    @abstractmethod
    def send(self, notification: Notification) -> bool:
        """
        Envia uma notificação.
        
        Args:
            notification: Dados da notificação
            
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        pass

class EmailNotificationProvider(NotificationProvider):
    """Provedor de notificações por email."""
    
    def __init__(self, smtp_server: str, smtp_port: int, username: str, password: str):
        """
        Inicializa o provedor de email.
        
        Args:
            smtp_server: Servidor SMTP
            smtp_port: Porta do servidor SMTP
            username: Nome de usuário do email
            password: Senha do email
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.logger = logging.getLogger(__name__)
    
    def send(self, notification: Notification, to_email: str) -> bool:
        """
        Envia notificação por email.
        
        Args:
            notification: Dados da notificação
            to_email: Email de destino
            
        Returns:
            True se enviado com sucesso
        """
        try:
            msg = MimeMultipart()
            msg['From'] = self.username
            msg['To'] = to_email
            msg['Subject'] = notification.title
            
            msg.attach(MimeText(notification.message, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            text = msg.as_string()
            server.sendmail(self.username, to_email, text)
            server.quit()
            
            self.logger.info(f"Email enviado para {to_email}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao enviar email: {e}")
            return False

class TelegramNotificationProvider(NotificationProvider):
    """Provedor de notificações via Telegram."""
    
    def __init__(self, bot_token: str, chat_id: str):
        """
        Inicializa o provedor do Telegram.
        
        Args:
            bot_token: Token do bot do Telegram
            chat_id: ID do chat para enviar mensagens
        """
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.logger = logging.getLogger(__name__)
    
    def send(self, notification: Notification) -> bool:
        """
        Envia notificação via Telegram.
        
        Args:
            notification: Dados da notificação
            
        Returns:
            True se enviado com sucesso
        """
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            
            message = f"*{notification.title}*\n\n{notification.message}"
            
            payload = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            
            self.logger.info("Mensagem enviada via Telegram")
            return True
            
        except Exception as e:
            self.logger.error(f"Erro ao enviar mensagem via Telegram: {e}")
            return False

class NotificationManager:
    """Gerenciador de notificações."""
    
    def __init__(self):
        """Inicializa o gerenciador de notificações."""
        self.providers: List[NotificationProvider] = []
        self.logger = logging.getLogger(__name__)
    
    def add_provider(self, provider: NotificationProvider) -> None:
        """
        Adiciona um provedor de notificação.
        
        Args:
            provider: Provedor de notificação
        """
        self.providers.append(provider)
    
    def send_notification(self, notification: Notification) -> None:
        """
        Envia notificação através de todos os provedores configurados.
        
        Args:
            notification: Dados da notificação
        """
        for provider in self.providers:
            try:
                provider.send(notification)
            except Exception as e:
                self.logger.error(f"Erro ao enviar notificação: {e}")
    
    def send_arbitrage_alert(self, opportunity_data: dict) -> None:
        """
        Envia alerta de oportunidade de arbitragem.
        
        Args:
            opportunity_data: Dados da oportunidade de arbitragem
        """
        notification = Notification(
            title="🚀 Oportunidade de Arbitragem Detectada!",
            message=f"""
Nova oportunidade encontrada:

💰 Par: {opportunity_data.get('symbol', 'N/A')}
📈 Lucro: {opportunity_data.get('profit_percentage', 0):.2f}%
🏪 Comprar em: {opportunity_data.get('exchange_buy', 'N/A')}
🏪 Vender em: {opportunity_data.get('exchange_sell', 'N/A')}
💵 Preço de compra: ${opportunity_data.get('buy_price', 0):.4f}
💵 Preço de venda: ${opportunity_data.get('sell_price', 0):.4f}

⏰ Detectado em: {opportunity_data.get('timestamp', 'N/A')}
            """.strip(),
            priority="high"
        )
        
        self.send_notification(notification)

