#!/bin/bash

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "📊 Arbitron - Monitor de Sistema"
echo "==============================="
echo "IP: $PUBLIC_IP"
echo "Timestamp: $(date)"
echo ""

# Status dos containers
echo "🐳 Status dos Containers:"
echo "========================"
docker-compose -f docker-compose.ec2.yml ps

echo ""
echo "🌐 Status dos Serviços:"
echo "======================"

# Verificar Frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://$PUBLIC_IP:3000"
else
    echo "❌ Frontend: OFFLINE"
fi

# Verificar API
if curl -f -s http://localhost:8000/health > /dev/null; then
    echo "✅ API: http://$PUBLIC_IP:8000"
else
    echo "❌ API: OFFLINE"
fi

# Verificar Security
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Security: http://$PUBLIC_IP:3001"
else
    echo "❌ Security: OFFLINE"
fi

echo ""
echo "💾 Uso de Recursos:"
echo "=================="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "📋 Comandos Úteis:"
echo "=================="
echo "Ver logs: docker-compose -f docker-compose.ec2.yml logs -f"
echo "Reiniciar: docker-compose -f docker-compose.ec2.yml restart"
echo "Parar: docker-compose -f docker-compose.ec2.yml down"
