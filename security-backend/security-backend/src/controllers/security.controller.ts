
import { Request, Response, NextFunction } from 'express';
import * as EncryptionService from '../services/encryption.service';
import * as AuditService from '../services/audit.service';
import * as AuthService from '../services/auth.service'; // Para validação de operação

// POST /api/v1/security/encrypt
export const encryptData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataToEncrypt } = req.body;
    if (!dataToEncrypt) {
      return res.status(400).json({ success: false, error: 'Bad Request', message: '"dataToEncrypt" é obrigatório no corpo da requisição.' });
    }

    const encryptedData = EncryptionService.encrypt(dataToEncrypt);
    // Registrar auditoria (opcional, mas recomendado)
    await AuditService.logAction(req.user?.id, 'encrypt_data', { inputLength: dataToEncrypt.length });

    return res.status(200).json({ success: true, data: { encryptedData } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/security/decrypt
export const decryptData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataToDecrypt } = req.body;
    if (!dataToDecrypt) {
      return res.status(400).json({ success: false, error: 'Bad Request', message: '"dataToDecrypt" é obrigatório no corpo da requisição.' });
    }

    // Apenas admins podem descriptografar (já verificado pelo middleware checkRole(['admin']))
    const decryptedData = EncryptionService.decrypt(dataToDecrypt);

    // Registrar auditoria
    await AuditService.logAction(req.user?.id, 'decrypt_data', { inputLength: dataToDecrypt.length });

    return res.status(200).json({ success: true, data: { decryptedData } });
  } catch (error) {
    // Tratar erros específicos de descriptografia (ex: IV inválido, tag inválida)
    if (error instanceof Error && (error.message.includes('Invalid IV') || error.message.includes('Unsupported state') || error.message.includes('Invalid authentication tag'))) {
        console.error('Erro de descriptografia:', error.message);
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Falha ao descriptografar os dados. Formato inválido ou chave incorreta.' });
    }
    next(error);
  }
};

// POST /api/v1/security/validate-operation
export const validateOperation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { operationType, operationData, requiresConfirmation } = req.body;
    const userId = req.user?.id;

    if (!userId || !operationType) {
      return res.status(400).json({ success: false, error: 'Bad Request', message: '"userId" e "operationType" são obrigatórios.' });
    }

    // A lógica de validação pode ser complexa e depender do tipo de operação
    // Exemplo: Verificar permissões, limites de risco, confirmar 2FA se necessário
    const validationResult = await AuthService.validateCriticalOperation(userId, operationType, operationData, requiresConfirmation);

    // Registrar auditoria da tentativa de validação
    await AuditService.logAction(userId, 'validate_operation', { operationType, allowed: validationResult.allowed, reason: validationResult.reason });

    return res.status(validationResult.allowed ? 200 : 403).json(validationResult);

  } catch (error) {
    next(error);
  }
};

// GET /api/v1/security/audit-logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair parâmetros de paginação e filtros da query string
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const filters = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    // Apenas admins ou viewers podem ver logs (já verificado pelo middleware)
    // Adicionar lógica para restringir viewers a ver apenas seus próprios logs, se necessário
    if (req.user?.role === 'viewer' && !filters.userId) {
        filters.userId = req.user.id; // Viewer só pode ver seus próprios logs por padrão
    } else if (req.user?.role === 'viewer' && filters.userId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: 'Viewers só podem visualizar seus próprios logs.' });
    }

    const result = await AuditService.getLogs(page, limit, filters);

    return res.status(200).json({ success: true, ...result }); // Retorna dados e paginação

  } catch (error) {
    next(error);
  }
};

