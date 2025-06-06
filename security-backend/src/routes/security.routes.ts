import { Router } from 'express';
import * as SecurityController from '../controllers/security.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware JWT
import { checkRole } from '../middleware/role.middleware'; // Middleware de Role (Ex: admin)
import { rateLimiter } from '../middleware/rateLimit.middleware'; // Importa o rate limiter
import { validateCriticalOperationInput } from '../middleware/criticalOperation.middleware'; // Importa validação de input

const router = Router();

// Todas as rotas de segurança requerem autenticação
router.use(authenticateToken);

// Aplica rate limiting a endpoints sensíveis (ajustar limites conforme necessário)
const sensitiveOperationLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 50, // Limita cada usuário a 50 operações sensíveis por hora
  message: 'Limite de operações de segurança excedido. Tente novamente mais tarde.'
});

// Rota para Criptografar Dados (Ex: Chaves API antes de salvar)
// POST /api/v1/security/encrypt
router.post('/encrypt', sensitiveOperationLimiter, SecurityController.encryptData);

// Rota para Descriptografar Dados (Usado internamente pelo backend? Ou para debug por admin?)
// POST /api/v1/security/decrypt
// Requer role de 'admin'
router.post('/decrypt', sensitiveOperationLimiter, checkRole(['admin']), SecurityController.decryptData);

// Rota para Validar Operações Críticas
// POST /api/v1/security/validate-operation
// Aplica rate limiting e validação de input antes do controller
router.post(
    '/validate-operation',
    sensitiveOperationLimiter,
    validateCriticalOperationInput, // Middleware para validar input específico da operação
    SecurityController.validateOperation
);

// Rota para Buscar Logs de Auditoria
// GET /api/v1/security/audit-logs
// Requer role de 'admin' ou talvez 'viewer' com escopo limitado
router.get('/audit-logs', checkRole(['admin', 'viewer']), SecurityController.getAuditLogs);

export default router;
