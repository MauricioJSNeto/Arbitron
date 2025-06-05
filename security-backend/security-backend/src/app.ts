
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import apiRoutes from './routes'; // Importa o roteador principal

const app: Express = express();

// Middlewares Essenciais
app.use(cors()); // Habilita CORS (ajustar origens em produção)
app.use(express.json()); // Habilita parsing de JSON no body das requisições
app.use(express.urlencoded({ extended: true })); // Habilita parsing de URL-encoded data

// Rota de Health Check básica
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Monta as rotas da API sob o prefixo /api/v1
app.use('/api/v1', apiRoutes);

// Middleware de Tratamento de Erros Genérico (deve ser o último middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);

  // TODO: Implementar logging de erro mais robusto (ex: Winston, Pino)

  // Resposta genérica para evitar vazar detalhes
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId || 'N/A' // Assumindo que um middleware de requestId pode existir
  });
});

// Middleware para Rotas Não Encontradas (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `A rota ${req.method} ${req.originalUrl} não foi encontrada.`,
    timestamp: new Date().toISOString(),
  });
});

// Função para iniciar o servidor
const startServer = () => {
  app.listen(config.port, () => {
    console.log(`[${config.env}] Servidor de Segurança rodando na porta ${config.port}`);
  });
};

// Inicia o servidor (pode ser exportado para testes)
if (require.main === module) {
  startServer();
}

export { app, startServer }; // Exporta para testes ou outros usos

