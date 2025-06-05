
import { Router } from 'express';
import * as SecurityController from '../controllers/security.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware JWT
import { checkRole } from '../middleware/role.middleware'; // Middleware de Role (Ex: admin)

const router = Router();

// Todas as rotas de segurança requerem autenticação
router.use(authenticateToken);

// Rota para Criptografar Dados (Ex: Chaves API antes de salvar)
// POST /api/v1/security/encrypt
// Apenas usuários autenticados (talvez com role específico? Ex: 'trader' ou 'admin')
router.post('/encrypt', SecurityController.encryptData);

// Rota para Descriptografar Dados (Usado internamente pelo backend? Ou para debug por admin?)
// POST /api/v1/security/decrypt
// Requer role de 'admin' para evitar exposição indevida
router.post('/decrypt', checkRole(['admin']), SecurityController.decryptData);

// Rota para Validar Operações Críticas
// POST /api/v1/security/validate-operation
// Apenas usuários autenticados (role pode depender do tipo de operação)
router.post('/validate-operation', SecurityController.validateOperation);

// Rota para Buscar Logs de Auditoria
// GET /api/v1/security/audit-logs
// Requer role de 'admin' ou talvez 'viewer' com escopo limitado
router.get('/audit-logs', checkRole(['admin', 'viewer']), SecurityController.getAuditLogs);

export default router;

