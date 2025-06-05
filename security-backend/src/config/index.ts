import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validação básica (pode ser expandida com Zod ou similar)
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRES_IN',
  'ENCRYPTION_KEY', // Chave para criptografar/descriptografar dados sensíveis (ex: chaves API)
  'DATABASE_URL', // URL de conexão com o banco de dados (ex: PostgreSQL)
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Erro Fatal: Variável de ambiente ${varName} não definida.`);
    process.exit(1);
  }
});

interface Config {
  env: string;
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  encryptionKey: string;
  databaseUrl: string;
  // Adicionar outras configurações conforme necessário (ex: SMTP, Telegram)
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN!,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN!,
  },
  encryptionKey: process.env.ENCRYPTION_KEY!,
  databaseUrl: process.env.DATABASE_URL!,
};

export default config;
