import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware para proteger rotas
import { rateLimiter } from '../middleware/rateLimit.middleware'; // Importa o rate limiter

const router = Router();

// Aplica rate limiting às rotas de autenticação sensíveis
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 10, // Limita cada IP/usuário a 10 requisições por janela
  message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.'
});

// Rota de Login
// POST /api/v1/auth/login
router.post('/login', authLimiter, AuthController.login);

// Rota de Verificação 2FA
// POST /api/v1/auth/2fa/verify
router.post('/2fa/verify', authLimiter, AuthController.verifyTwoFactor);

// Rota de Refresh Token
// POST /api/v1/auth/refresh
router.post('/refresh', authLimiter, AuthController.refreshToken);

// Exemplo de rota protegida (opcional, para teste)
// router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
