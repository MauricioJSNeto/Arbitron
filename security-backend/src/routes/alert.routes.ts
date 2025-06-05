
import { Router } from 'express';
import * as AlertController from '../controllers/alert.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware JWT

const router = Router();

// Todas as rotas de alerta requerem autenticação
router.use(authenticateToken);

// Rota para Buscar Alertas do Usuário
// GET /api/v1/alerts
router.get('/', AlertController.getAlerts);

// Rota para Criar um Novo Alerta (geralmente uso interno)
// POST /api/v1/alerts
router.post('/', AlertController.createAlert);

// Rota para Marcar um Alerta como Lido
// PUT /api/v1/alerts/:id/read
router.put('/:id/read', AlertController.markAsRead);

export default router;

