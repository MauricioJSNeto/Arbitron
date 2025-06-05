import { Request, Response, NextFunction } from 'express';
import { UserProfile } from '@/types/contracts'; // Importando do local correto (ajustar se necessário)

// Middleware para verificar se o usuário autenticado possui uma das roles permitidas
export const checkRole = (allowedRoles: Array<UserProfile['role']>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se o middleware de autenticação anexou o usuário à requisição
    if (!req.user || !req.user.role) {
      console.warn('Tentativa de verificação de role sem usuário autenticado ou sem role definida.');
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Acesso negado. Informações de usuário ou role ausentes.',
        timestamp: new Date().toISOString(),
      });
    }

    const userRole = req.user.role as UserProfile['role'];

    // Verifica se a role do usuário está na lista de roles permitidas
    if (allowedRoles.includes(userRole)) {
      next(); // Usuário tem a role permitida, continua para a próxima etapa
    } else {
      console.warn(`Usuário ${req.user.id} com role '${userRole}' tentou acessar rota restrita para roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Acesso negado. Você não tem permissão para realizar esta ação.',
        timestamp: new Date().toISOString(),
      });
    }
  };
};
