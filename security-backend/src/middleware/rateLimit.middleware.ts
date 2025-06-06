import { Request, Response, NextFunction } from 'express';

// Simples armazenamento em memória para rate limiting (NÃO adequado para produção distribuída)
// Em produção, use um armazenamento persistente como Redis.
interface RateLimitRecord {
  [key: string]: number[]; // key (userId ou IP) -> array de timestamps das requisições
}

const requestTimestamps: RateLimitRecord = {};

interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Número máximo de requisições permitidas na janela
  message?: string; // Mensagem de erro personalizada
  keyGenerator?: (req: Request) => string; // Função para gerar a chave (padrão: userId)
}

/**
 * Middleware de Rate Limiting simples baseado em usuário (ou IP).
 * @param options Configurações de rate limiting.
 */
export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests } = options;
  const message = options.message || 'Muitas requisições. Tente novamente mais tarde.';

  // Função padrão para obter a chave (ID do usuário autenticado)
  const defaultKeyGenerator = (req: Request): string | null => {
    return req.user?.id || null; // Retorna null se o usuário não estiver autenticado
  };

  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);

    // Se não foi possível gerar uma chave (ex: usuário não logado), permite passar
    // Ou pode optar por limitar por IP neste caso.
    if (!key) {
      // console.warn('[RateLimiter] Chave não gerada (usuário não autenticado?). Permitindo passagem.');
      return next();
    }

    const now = Date.now();
    const userRequests = requestTimestamps[key] || [];

    // Remove timestamps fora da janela de tempo
    const relevantRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (relevantRequests.length >= maxRequests) {
      console.warn(`[RateLimiter] Limite excedido para chave: ${key}`);
      // Atualiza os timestamps para manter o bloqueio
      requestTimestamps[key] = relevantRequests;
      return res.status(429).json({ // 429 Too Many Requests
        success: false,
        error: 'Too Many Requests',
        message: message,
        timestamp: new Date().toISOString(),
      });
    }

    // Adiciona o timestamp atual e atualiza o registro
    relevantRequests.push(now);
    requestTimestamps[key] = relevantRequests;

    next(); // Permite a requisição
  };
};

// Limpa registros antigos periodicamente (exemplo simples)
// Em produção, um mecanismo mais robusto é necessário, especialmente com Redis (TTL)
setInterval(() => {
    const now = Date.now();
    const windowMsThreshold = 60 * 60 * 1000; // Limpa registros mais velhos que 1 hora
    Object.keys(requestTimestamps).forEach(key => {
        requestTimestamps[key] = requestTimestamps[key].filter(timestamp => now - timestamp < windowMsThreshold);
        if (requestTimestamps[key].length === 0) {
            delete requestTimestamps[key];
        }
    });
    // console.log('[RateLimiter] Limpeza de registros antigos concluída.');
}, 60 * 60 * 1000); // Executa a cada hora
