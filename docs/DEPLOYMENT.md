# Deployment Guide

## Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/MauricioJSNeto/Arbitron.git
   cd Arbitron
   \`\`\`

2. **Run setup script**
   \`\`\`bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   \`\`\`

3. **Configure exchange API keys**
   Edit `arbitrage-engine/.env` and add your exchange API keys:
   \`\`\`env
   BINANCE_API_KEY=your_binance_api_key
   BINANCE_SECRET_KEY=your_binance_secret_key
   \`\`\`

4. **Access the application**
   - Dashboard: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

## Manual Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Environment Configuration

1. **Copy environment files**
   \`\`\`bash
   cp .env.example .env
   cp security-backend/.env.example security-backend/.env
   cp arbitrage-engine/.env.example arbitrage-engine/.env
   \`\`\`

2. **Generate secure keys**
   \`\`\`bash
   # Generate JWT secret
   openssl rand -hex 32

   # Generate encryption key
   openssl rand -hex 32
   \`\`\`

3. **Update environment files with your keys**

### Docker Deployment

\`\`\`bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

### Local Development

1. **Start databases**
   \`\`\`bash
   docker-compose up postgres redis -d
   \`\`\`

2. **Start security backend**
   \`\`\`bash
   cd security-backend
   npm install
   npm run dev
   \`\`\`

3. **Start arbitrage engine**
   \`\`\`bash
   cd arbitrage-engine
   pip install -r requirements.txt
   uvicorn api.main:app --reload --port 8000
   \`\`\`

4. **Start frontend**
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`

## Production Deployment

### Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable HTTPS**
4. **Configure firewall rules**
5. **Set up monitoring and logging**

### Environment Variables

Ensure all production environment variables are set:

- `JWT_SECRET`: Strong random string
- `ENCRYPTION_KEY`: 32-byte hex key
- `DATABASE_URL`: Production database URL
- Exchange API keys with appropriate permissions

### Monitoring

The system includes health check endpoints:

- Frontend: `http://localhost:3000`
- Security Backend: `http://localhost:3001/health`
- Arbitrage Engine: `http://localhost:8000/health`

### Backup Strategy

1. **Database backups**
   \`\`\`bash
   docker-compose exec postgres pg_dump -U user crypto_bot_db > backup.sql
   \`\`\`

2. **Configuration backups**
   - Environment files
   - Docker compose configuration
   - Nginx configuration

### Scaling

For high-volume trading:

1. **Use multiple arbitrage engine instances**
2. **Implement Redis clustering**
3. **Use PostgreSQL read replicas**
4. **Add load balancer**

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check Docker logs: `docker-compose logs [service-name]`
   - Verify environment variables
   - Check port conflicts

2. **Database connection errors**
   - Ensure PostgreSQL is running
   - Check connection strings
   - Verify user permissions

3. **API authentication errors**
   - Check JWT secrets match
   - Verify token expiration
   - Check CORS configuration

### Support

For issues and support:
1. Check the logs first
2. Review the documentation
3. Open an issue on GitHub
