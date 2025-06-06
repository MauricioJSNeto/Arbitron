import * as UserService from "./user.service";
import * as JwtUtils from "../utils/jwt.utils";
import * as TwoFactorUtils from "../utils/twoFactor.utils";
import { AuthResponse, UserProfile } from "@/types/contracts"; // Ajustar path
import * as AuditService from "./audit.service";

/**
 * Autentica um usuário com base em nome de usuário e senha, lidando com 2FA.
 * @param username O nome de usuário.
 * @param password A senha.
 * @param twoFactorCode O código 2FA opcional fornecido na tentativa de login.
 * @returns Um objeto AuthResponse indicando sucesso ou falha.
 */
export const loginUser = async (username: string, password: string, twoFactorCode?: string): Promise<AuthResponse> => {
  const user = await UserService.findUserByUsername(username);

  if (!user) {
    console.warn(`Tentativa de login falhou: Usuário ${username} não encontrado.`);
    await AuditService.logAction(null, 'login_fail', { username, reason: 'User not found' });
    return { success: false, error: "Credenciais inválidas", timestamp: new Date().toISOString() };
  }

  const isPasswordValid = await UserService.comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    console.warn(`Tentativa de login falhou: Senha inválida para usuário ${username}.`);
    await AuditService.logAction(user.id, 'login_fail', { username, reason: 'Invalid password' });
    return { success: false, error: "Credenciais inválidas", timestamp: new Date().toISOString() };
  }

  // Senha válida, verificar 2FA
  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      // 2FA é necessário, mas não foi fornecido
      console.log(`Login requer 2FA para usuário ${username}, código não fornecido.`);
      await AuditService.logAction(user.id, 'login_2fa_required', { username });
      // Retorna sucesso parcial indicando que 2FA é necessário
      // O frontend deve solicitar o código 2FA e chamar /auth/2fa/verify
      return {
        success: false, // Ou true, dependendo de como o frontend lida com isso
        requiresTwoFactor: true,
        // Opcional: retornar um token temporário para a verificação 2FA
        // tempToken: JwtUtils.generateTempToken({ userId: user.id }),
        timestamp: new Date().toISOString(),
        message: "Autenticação de dois fatores necessária."
      };
    }

    // Código 2FA foi fornecido, verificar
    const isTwoFactorValid = TwoFactorUtils.verifyTwoFactorCode(user.twoFactorSecret, twoFactorCode);

    if (!isTwoFactorValid) {
      console.warn(`Tentativa de login falhou: Código 2FA inválido para usuário ${username}.`);
      await AuditService.logAction(user.id, 'login_fail', { username, reason: 'Invalid 2FA code' });
      return { success: false, error: "Código 2FA inválido", timestamp: new Date().toISOString() };
    }

    // Código 2FA válido
    console.log(`Login bem-sucedido com 2FA para usuário ${username}.`);
    // Prosseguir para gerar tokens

  } else {
    // 2FA não está habilitado, login bem-sucedido
    console.log(`Login bem-sucedido (sem 2FA) para usuário ${username}.`);
    // Prosseguir para gerar tokens
  }

  // Gerar tokens JWT (Access e Refresh)
  const userPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    // Incluir outras informações relevantes, mas não sensíveis
  };
  const accessToken = JwtUtils.generateAccessToken(userPayload);
  const refreshToken = JwtUtils.generateRefreshToken({ id: user.id });

  // Armazenar o refresh token associado ao usuário (no DB em produção)
  await UserService.updateUserRefreshToken(user.id, refreshToken);

  // Registrar auditoria de login bem-sucedido
  await AuditService.logAction(user.id, 'login_success', { username });

  // Preparar o perfil do usuário para a resposta
  const userProfile: UserProfile = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: new Date().toISOString(), // Atualizar lastLogin no DB em produção
    permissions: user.permissions,
  };

  return {
    success: true,
    token: accessToken,
    refreshToken: refreshToken,
    user: userProfile,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Verifica um código 2FA (usado se o login inicial indicou requiresTwoFactor).
 * @param userId O ID do usuário.
 * @param twoFactorCode O código TOTP fornecido.
 * @returns AuthResponse com tokens se válido, ou erro.
 */
export const verifyTwoFactorCode = async (userId: string, twoFactorCode: string): Promise<AuthResponse> => {
    const user = await UserService.findUserById(userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        await AuditService.logAction(userId, '2fa_verify_fail', { reason: 'User not found or 2FA not enabled/setup' });
        return { success: false, error: "Falha na verificação 2FA. Usuário inválido ou 2FA não configurado.", timestamp: new Date().toISOString() };
    }

    const isTwoFactorValid = TwoFactorUtils.verifyTwoFactorCode(user.twoFactorSecret, twoFactorCode);

    if (!isTwoFactorValid) {
        await AuditService.logAction(userId, '2fa_verify_fail', { reason: 'Invalid 2FA code' });
        return { success: false, error: "Código 2FA inválido.", timestamp: new Date().toISOString() };
    }

    // Código 2FA válido, gerar tokens finais
    const userPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = JwtUtils.generateAccessToken(userPayload);
    const refreshToken = JwtUtils.generateRefreshToken({ id: user.id });

    await UserService.updateUserRefreshToken(user.id, refreshToken);
    await AuditService.logAction(userId, '2fa_verify_success', {});

    const userProfile: UserProfile = {
        id: user.id, username: user.username, email: user.email, role: user.role,
        twoFactorEnabled: user.twoFactorEnabled, lastLogin: new Date().toISOString(), permissions: user.permissions,
    };

    return {
        success: true, token: accessToken, refreshToken: refreshToken, user: userProfile,
        timestamp: new Date().toISOString(),
    };
};


/**
 * Gera um novo Access Token usando um Refresh Token válido.
 * @param token O Refresh Token fornecido.
 * @returns Objeto com o novo Access Token ou erro.
 */
export const refreshAccessToken = async (token: string): Promise<Partial<AuthResponse>> => {
  const decoded = JwtUtils.verifyRefreshToken(token);

  if (!decoded || !decoded.id) {
    await AuditService.logAction(null, 'refresh_token_fail', { reason: 'Invalid or expired token' });
    return { success: false, error: "Refresh token inválido ou expirado.", timestamp: new Date().toISOString() };
  }

  const user = await UserService.findUserByRefreshToken(token); // Verifica se o token está associado a um usuário no DB

  if (!user || user.id !== decoded.id) {
    await AuditService.logAction(decoded.id, 'refresh_token_fail', { reason: 'Token mismatch or user not found' });
    // Considerar invalidar todos os refresh tokens do usuário aqui por segurança
    return { success: false, error: "Refresh token inválido ou não associado.", timestamp: new Date().toISOString() };
  }

  // Gerar novo Access Token
  const userPayload = { id: user.id, username: user.username, role: user.role };
  const newAccessToken = JwtUtils.generateAccessToken(userPayload);

  await AuditService.logAction(user.id, 'refresh_token_success', {});

  return {
    success: true,
    token: newAccessToken,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Valida se um usuário pode realizar uma operação crítica.
 * Aprimorado para incluir validação de modo e limites de trade.
 * @param userId ID do usuário realizando a ação.
 * @param operationType Tipo da operação (ex: 'mode_switch', 'trade_execution', 'config_update').
 * @param operationData Dados adicionais sobre a operação.
 * @param requiresConfirmation Se a operação exige confirmação extra (ex: 2FA).
 * @returns Objeto indicando se a operação é permitida e o motivo.
 */
export const validateCriticalOperation = async (
    userId: string,
    operationType: string,
    operationData: any,
    requiresConfirmation?: boolean
): Promise<{ allowed: boolean; reason?: string; requires2FA?: boolean }> => {
    const user = await UserService.findUserById(userId);
    if (!user) {
        return { allowed: false, reason: 'Usuário não encontrado.' };
    }

    console.log(`[AuthService] Validando operação crítica: User=${userId}, Type=${operationType}, RequiresConfirm=${requiresConfirmation}, Data=${JSON.stringify(operationData)}`);

    // Lógica de validação baseada no tipo de operação e role/permissões do usuário
    switch (operationType) {
        case 'mode_switch':
            // Somente admin ou trader podem mudar o modo
            if (user.role !== 'admin' && user.role !== 'trader') {
                return { allowed: false, reason: 'Permissão insuficiente para alterar o modo de operação.' };
            }
            // Validação específica para mudar para 'live'
            if (operationData?.mode === 'live') {
                console.log(`[AuthService] Tentativa de mudar para modo LIVE por User=${userId}`);
                // Exemplo: Poderia verificar se todas as configurações necessárias estão completas
                // Exemplo: Poderia exigir 2FA para esta ação específica
                if (user.twoFactorEnabled && requiresConfirmation) {
                    console.warn("[AuthService] Validação de operação crítica: 2FA seria necessário para mudar para LIVE, mas não implementado neste fluxo.");
                    // return { allowed: false, reason: 'Confirmação 2FA necessária para ativar o modo Live.', requires2FA: true };
                }
                // Adicionar outras verificações se necessário (ex: status das conexões das exchanges)
            }
            break;
        case 'trade_execution':
            // Somente admin ou trader podem executar trades
            if (user.role !== 'admin' && user.role !== 'trader') {
                return { allowed: false, reason: 'Permissão insuficiente para executar trades.' };
            }
            // Exemplo: Validação de limite de trade
            const tradeAmount = operationData?.amountUSD; // Supondo que o montante venha em operationData
            const TRADE_LIMIT_CONFIRMATION = 1000; // Exemplo: Limite de $1000 para exigir confirmação
            if (typeof tradeAmount === 'number' && tradeAmount > TRADE_LIMIT_CONFIRMATION) {
                console.log(`[AuthService] Trade acima do limite ($${tradeAmount}) por User=${userId}. Confirmação necessária.`);
                if (!requiresConfirmation) {
                     // Se a flag de confirmação não veio do frontend, negar a operação
                     // O frontend deveria chamar esta API primeiro para verificar se a confirmação é necessária
                     // e então chamar novamente com requiresConfirmation=true (após o usuário confirmar na UI)
                     // Ou, alternativamente, exigir 2FA para trades acima do limite.
                     return { allowed: false, reason: `Confirmação obrigatória para trades acima de $${TRADE_LIMIT_CONFIRMATION}.` };
                }
                // Se requiresConfirmation=true, a operação pode prosseguir (assumindo que o usuário confirmou na UI)
                // Poderia adicionar validação 2FA aqui também, se configurado.
                 if (user.twoFactorEnabled) {
                    console.warn("[AuthService] Validação de operação crítica: 2FA seria recomendado para trades acima do limite, mas não implementado neste fluxo.");
                    // return { allowed: false, reason: 'Confirmação 2FA necessária para trades acima do limite.', requires2FA: true };
                 }
            }
            // Adicionar outras verificações de limites de risco aqui (ex: max loss diário, etc.)
            break;
        case 'config_update':
             if (user.role !== 'admin') {
                return { allowed: false, reason: 'Permissão insuficiente para modificar configurações.' };
            }
            // Poderia exigir 2FA para salvar configurações críticas
            break;
        // Adicionar outros tipos de operação
        default:
            console.warn(`Tipo de operação desconhecido para validação: ${operationType}`);
            return { allowed: false, reason: 'Tipo de operação desconhecido.' };
    }

    // Se chegou até aqui, a operação é permitida (baseado nesta lógica simples)
    return { allowed: true };
};
