
import { Router } from 'express';
import authRoutes from './auth.routes';
import securityRoutes from './security.routes';
import alertRoutes from './alert.routes'; // Importa as rotas de alerta

const router = Router();

// Monta as rotas de autenticação
router.use('/auth', authRoutes);

// Monta as rotas de segurança
router.use('/security', securityRoutes);

// Monta as rotas de alerta
router.use('/alerts', alertRoutes);

export default router;

