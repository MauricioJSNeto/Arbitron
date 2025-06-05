
import jwt from 'jsonwebtoken';
import config from '../config';

// Gera um Access Token JWT
export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

// Gera um Refresh Token JWT
export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
};

// Verifica um Access Token
export const verifyAccessToken = (token: string): any | null => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    console.error('Erro ao verificar Access Token:', error);
    return null;
  }
};

// Verifica um Refresh Token
export const verifyRefreshToken = (token: string): any | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    console.error('Erro ao verificar Refresh Token:', error);
    return null;
  }
};

