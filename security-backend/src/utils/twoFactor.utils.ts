
import speakeasy from 'speakeasy';

/**
 * Gera um novo segredo para 2FA (TOTP).
 * @param username - O nome de usuário ou identificador para associar ao segredo.
 * @param issuer - O nome do emissor (nome da aplicação) a ser exibido no app autenticador.
 * @returns Objeto contendo o segredo (ascii, hex, base32) e a URL otpauth para QR code.
 */
export const generateTwoFactorSecret = (username: string, issuer: string = 'CryptoArbitrageBot') => {
  const secret = speakeasy.generateSecret({ length: 20, name: `${issuer} (${username})` });
  // secret.ascii, secret.hex, secret.base32, secret.otpauth_url
  return secret;
};

/**
 * Verifica um código TOTP fornecido pelo usuário contra o segredo armazenado.
 * @param secretBase32 - O segredo 2FA do usuário, codificado em base32.
 * @param userToken - O código TOTP de 6 dígitos fornecido pelo usuário.
 * @returns True se o código for válido, False caso contrário.
 */
export const verifyTwoFactorCode = (secretBase32: string, userToken: string): boolean => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token: userToken,
      window: 1, // Permite uma pequena variação de tempo (1 * 30 segundos para frente ou para trás)
    });
    return verified;
  } catch (error) {
    console.error('Erro ao verificar código 2FA:', error);
    return false;
  }
};

