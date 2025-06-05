// Placeholder para o serviço de usuário
// Em uma implementação real, este serviço interagiria com o banco de dados
// para buscar e gerenciar informações do usuário.

import { UserProfile } from "@/types/contracts"; // Ajustar path se necessário
import bcrypt from 'bcrypt';

// Simulação de um banco de dados de usuários em memória (APENAS PARA EXEMPLO)
// Substituir por uma conexão real ao banco de dados (PostgreSQL, MongoDB, etc.)
const usersInMemory: Record<string, any> = {
  'admin': {
    id: 'user-admin-001',
    username: 'admin',
    email: 'admin@example.com',
    // Senha 'password' hasheada com bcrypt (gerar hash real para produção)
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwx.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm',
    role: 'admin',
    twoFactorEnabled: true,
    // Segredo 2FA em base32 (gerar um real por usuário)
    twoFactorSecret: 'KVKFKFQJTJTFKVKFKFQJTJTFKVKF', // Exemplo: JBSWY3DPEHPK3PXP
    lastLogin: new Date().toISOString(),
    permissions: ['*'], // Admin tem todas as permissões
    refreshToken: null, // Armazenar refresh token associado ao usuário
  },
  'trader': {
    id: 'user-trader-002',
    username: 'trader',
    email: 'trader@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwx.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm', // Senha 'password'
    role: 'trader',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLogin: new Date().toISOString(),
    permissions: ['execute_trades', 'view_dashboard', 'manage_api_keys'],
    refreshToken: null,
  },
   'viewer': {
    id: 'user-viewer-003',
    username: 'viewer',
    email: 'viewer@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwx.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm', // Senha 'password'
    role: 'viewer',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLogin: new Date().toISOString(),
    permissions: ['view_dashboard', 'view_audit_logs'], // Viewer só pode ver seus logs
    refreshToken: null,
  }
};

/**
 * Busca um usuário pelo nome de usuário.
 * Em produção, buscaria no banco de dados.
 * @param username O nome de usuário.
 * @returns O perfil do usuário ou null se não encontrado.
 */
export const findUserByUsername = async (username: string): Promise<any | null> => {
  console.log(`[UserService] Buscando usuário: ${username}`);
  const user = usersInMemory[username.toLowerCase()];
  if (user) {
    console.log(`[UserService] Usuário encontrado: ${user.id}`);
    // Simula um atraso de banco de dados
    await new Promise(resolve => setTimeout(resolve, 50));
    // Retorna uma cópia para evitar mutações no objeto em memória
    return { ...user };
  }
  console.log(`[UserService] Usuário não encontrado: ${username}`);
  return null;
};

/**
 * Busca um usuário pelo ID.
 * Em produção, buscaria no banco de dados.
 * @param userId O ID do usuário.
 * @returns O perfil do usuário ou null se não encontrado.
 */
export const findUserById = async (userId: string): Promise<any | null> => {
    console.log(`[UserService] Buscando usuário por ID: ${userId}`);
    const user = Object.values(usersInMemory).find(u => u.id === userId);
    if (user) {
        console.log(`[UserService] Usuário encontrado: ${user.username}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...user };
    }
    console.log(`[UserService] Usuário não encontrado por ID: ${userId}`);
    return null;
};

/**
 * Compara uma senha fornecida com o hash armazenado.
 * @param plainPassword A senha em texto plano.
 * @param hashedPassword O hash da senha armazenado.
 * @returns True se a senha corresponder, False caso contrário.
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    // Em um cenário real, o hash seria buscado do DB junto com o usuário
    // A comparação DEVE ser feita aqui, não enviando o hash para fora
    // A biblioteca bcrypt lida com o salt embutido no hash

    // !! IMPORTANTE: Substitua o hash de exemplo por um gerado corretamente !!
    // Exemplo de como gerar um hash (NÃO FAÇA ISSO AQUI, faça ao criar/atualizar senha):
    // const salt = await bcrypt.genSalt(10);
    // const hash = await bcrypt.hash(plainPassword, salt);

    // Simulação de comparação (SEMPRE FALHA com o hash de exemplo)
    // return await bcrypt.compare(plainPassword, hashedPassword);

    // *** SIMULAÇÃO PARA TESTE - REMOVER EM PRODUÇÃO ***
    console.warn('[UserService] SIMULAÇÃO: Comparação de senha sempre retorna true para teste.');
    return plainPassword === 'password'; // Simplesmente compara com 'password' para teste
};

/**
 * Atualiza o refresh token de um usuário.
 * Em produção, atualizaria no banco de dados.
 * @param userId O ID do usuário.
 * @param refreshToken O novo refresh token ou null para remover.
 */
export const updateUserRefreshToken = async (userId: string, refreshToken: string | null): Promise<void> => {
    console.log(`[UserService] Atualizando refresh token para usuário ${userId}`);
    const user = Object.values(usersInMemory).find(u => u.id === userId);
    if (user) {
        user.refreshToken = refreshToken;
        console.log(`[UserService] Refresh token atualizado.`);
    } else {
        console.error(`[UserService] Falha ao atualizar refresh token: Usuário ${userId} não encontrado.`);
    }
    await new Promise(resolve => setTimeout(resolve, 30));
};

/**
 * Busca um usuário pelo refresh token.
 * Em produção, buscaria no banco de dados.
 * @param refreshToken O refresh token.
 * @returns O perfil do usuário ou null se não encontrado.
 */
export const findUserByRefreshToken = async (refreshToken: string): Promise<any | null> => {
    console.log(`[UserService] Buscando usuário por refresh token`);
    const user = Object.values(usersInMemory).find(u => u.refreshToken === refreshToken);
    if (user) {
        console.log(`[UserService] Usuário encontrado: ${user.username}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { ...user };
    }
    console.log(`[UserService] Usuário não encontrado por refresh token.`);
    return null;
};
