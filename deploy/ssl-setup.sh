#!/bin/bash

echo "🔒 Configurando SSL com Let's Encrypt..."

# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Solicitar certificado (substitua seu-dominio.com)
read -p "Digite seu domínio (ex: arbitron.seudominio.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domínio não informado"
    exit 1
fi

# Gerar certificado
sudo certbot --nginx -d $DOMAIN

# Configurar renovação automática
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "✅ SSL configurado para $DOMAIN"
echo "🔄 Renovação automática configurada"
