import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware para proteger rotas

const router = Router();

// Rota de Login
// POST /api/v1/auth/login
router.post('/login', AuthController.login);

// Rota de Verificação 2FA
// POST /api/v1/auth/2fa/verify
// Assumindo que o login inicial retorna um token temporário se 2FA for necessário
// Ou que esta rota é acessada com um token parcial/temporário
// Para simplificar, vamos assumir que o usuário já está parcialmente autenticado
// ou que o login retorna um estado indicando a necessidade de 2FA.
// Uma abordagem mais robusta pode usar um token específico para a etapa 2FA.
router.post('/2fa/verify', AuthController.verifyTwoFactor); // Pode precisar de um middleware específico

// Rota de Refresh Token
// POST /api/v1/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// Exemplo de rota protegida (opcional, para teste)
// router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
