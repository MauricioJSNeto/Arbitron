import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// Estendendo a interface Request do Express para incluir a propriedade 'user'
// Coloque isso em src/types/express/index.d.ts ou similar
declare global {
  namespace Express {
    interface Request {
      user?: any; // Use um tipo mais específico, como UserProfile, se disponível
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato Bearer TOKEN

  if (token == null) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Token de autenticação não fornecido.',
      timestamp: new Date().toISOString(),
    });
  }

  jwt.verify(token, config.jwt.secret, (err: any, user: any) => {
    if (err) {
      console.error('Erro na verificação do JWT:', err.message);
      // Diferenciar entre token expirado e token inválido
      const errorType = err.name === 'TokenExpiredError' ? 'Token Expirado' : 'Token Inválido';
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Autenticação falhou: ${errorType}.`, 
        timestamp: new Date().toISOString(),
      });
    }

    // Anexa as informações do usuário decodificadas à requisição
    // O payload do JWT deve conter as informações necessárias (id, role, etc.)
    req.user = user;
    next(); // Passa para o próximo middleware ou rota
  });
};
