#!/bin/bash

echo "🚀 Setting up Crypto Arbitrage Bot..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files from examples
echo "📝 Creating environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
fi

if [ ! -f security-backend/.env ]; then
    cp security-backend/.env.example security-backend/.env
    echo "✅ Created security-backend/.env file"
fi

if [ ! -f arbitrage-engine/.env ]; then
    cp arbitrage-engine/.env.example arbitrage-engine/.env
    echo "✅ Created arbitrage-engine/.env file"
fi

# Generate secure keys
echo "🔐 Generating secure keys..."

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Update security-backend .env with generated keys
sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" security-backend/.env
sed -i "s/your-refresh-token-secret-change-this-in-production/$REFRESH_SECRET/g" security-backend/.env
sed -i "s/your-32-byte-hex-encryption-key-change-this/$ENCRYPTION_KEY/g" security-backend/.env

echo "✅ Generated secure keys"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p nginx

echo "✅ Created directories"

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is not responding"
fi

# Check Security Backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Security Backend is running on http://localhost:3001"
else
    echo "❌ Security Backend is not responding"
fi

# Check Arbitrage Engine
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Arbitrage Engine is running on http://localhost:8000"
else
    echo "❌ Arbitrage Engine is not responding"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your exchange API keys in arbitrage-engine/.env"
echo "2. Access the dashboard at http://localhost:3000"
echo "3. Check logs with: docker-compose logs -f"
echo "4. Stop services with: docker-compose down"
echo ""
echo "📚 Documentation:"
echo "- API Documentation: http://localhost:8000/docs"
echo "- Security API: http://localhost:3001/api-docs"
echo ""
