
import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { AuthRequest } from '@/types/contracts'; // Ajustar path se necessário

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, twoFactorCode }: AuthRequest = req.body;

    // Validação básica de entrada (pode ser movida para um middleware de validação)
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Nome de usuário e senha são obrigatórios.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await AuthService.loginUser(username, password, twoFactorCode);

    // Define o status code baseado no resultado
    let statusCode = 200;
    if (!result.success) {
      statusCode = result.requiresTwoFactor ? 401 : 401; // 401 para ambos, mas frontend diferencia pela flag
      if (result.error === 'Credenciais inválidas') statusCode = 401;
      if (result.error === 'Código 2FA inválido') statusCode = 401;
      // Adicionar outros códigos de erro se necessário
    }

    return res.status(statusCode).json(result);

  } catch (error) {
    // Passa o erro para o middleware de tratamento de erros
    next(error);
  }
};

// POST /api/v1/auth/2fa/verify
export const verifyTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assumindo que o username ou userId e o código 2FA são enviados no body
    // Ou que o userId vem do token JWT parcial/temporário (se aplicável)
    const { userId, twoFactorCode } = req.body; // Ajustar conforme implementação real
    const tempToken = req.headers['x-temp-token'] as string; // Exemplo: token temporário do login

    if ((!userId && !tempToken) || !twoFactorCode) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Identificador de usuário (ou token temporário) e código 2FA são obrigatórios.',
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Decodificar tempToken para obter userId se necessário
    const actualUserId = userId; // ou extrair do tempToken

    const result = await AuthService.verifyTwoFactorCode(actualUserId, twoFactorCode);

    return res.status(result.success ? 200 : 401).json(result);

  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/refresh
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token é obrigatório.',
        timestamp: new Date().toISOString(),
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    return res.status(result.success ? 200 : 401).json(result);

  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/profile (Exemplo de rota protegida)
/*
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // O middleware authenticateToken já validou o token e anexou req.user
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    // Buscar perfil completo se necessário, ou retornar dados do token
    const userProfile = await AuthService.getUserProfile(req.user.id);
    if (!userProfile) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.status(200).json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
};
*/

