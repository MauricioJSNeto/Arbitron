FROM python:3.9-slim

# Metadados do container
LABEL maintainer="MauricioJSNeto"
LABEL description="Arbitron - Advanced Cryptocurrency Arbitrage Bot"
LABEL version="1.0.0"

WORKDIR /app

# Copiar requirements primeiro para melhor cache do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY . .

# Expor porta da API
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
