import logging
from logging.handlers import RotatingFileHandler
import os

os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("Arbitron")
logger.setLevel(logging.DEBUG)

handler = RotatingFileHandler("logs/arbitron.log", maxBytes=500_000, backupCount=5)
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
