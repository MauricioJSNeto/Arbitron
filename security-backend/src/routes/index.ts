import { Router } from 'express';
import authRoutes from './auth.routes';
import securityRoutes from './security.routes';

const router = Router();

// Monta as rotas de autenticação
router.use('/auth', authRoutes);

// Monta as rotas de segurança
router.use('/security', securityRoutes);

export default router;
