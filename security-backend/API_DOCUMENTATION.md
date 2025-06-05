
# Camada de Segurança - Documentação da API

Este documento descreve as APIs implementadas na camada de segurança do Bot de Arbitragem de Criptomoedas, baseadas nos contratos definidos em `lib/integration/api-contracts.ts`.

**URL Base da API:** `/api/v1`

**Autenticação:** A maioria das rotas requer um JSON Web Token (JWT) válido no cabeçalho `Authorization` como `Bearer <token>`. Rotas específicas podem exigir roles (`admin`, `trader`, `viewer`).

**Observação:** Os serviços de usuário (`UserService`) e auditoria (`AuditService`) utilizam dados em memória para simulação. Em produção, devem ser substituídos por implementações que interajam com um banco de dados real (ex: PostgreSQL).

---

## 1. Autenticação (`/auth`)

### 1.1. Login de Usuário

*   **Endpoint:** `POST /auth/login`
*   **Descrição:** Autentica um usuário com nome de usuário e senha. Pode requerer uma segunda etapa de verificação 2FA se habilitada para o usuário.
*   **Autenticação:** Nenhuma.
*   **Request Body:** `AuthRequest`
    ```json
    {
      "username": "string",
      "password": "string",
      "twoFactorCode": "string" // Opcional, apenas se o usuário tentar logar com 2FA de uma vez
    }
    ```
*   **Success Response (200 OK - Login Completo):** `AuthResponse`
    ```json
    {
      "success": true,
      "token": "string", // Access Token JWT
      "refreshToken": "string", // Refresh Token JWT
      "user": UserProfile, // Perfil do usuário autenticado
      "timestamp": "string"
    }
    ```
*   **Success Response (Parcial - 2FA Requerido):** `AuthResponse` (Status Code pode variar, ex: 200 ou 401 com flag)
    ```json
    {
      "success": false, // Ou true, dependendo da implementação do frontend
      "requiresTwoFactor": true,
      "message": "Autenticação de dois fatores necessária.",
      "timestamp": "string"
      // "tempToken": "string" // Opcional: Token temporário para a etapa 2FA
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Campos obrigatórios ausentes.
    *   `401 Unauthorized`: Credenciais inválidas (usuário/senha) ou código 2FA inválido.
    *   `500 Internal Server Error`: Erro inesperado no servidor.

### 1.2. Verificação 2FA

*   **Endpoint:** `POST /auth/2fa/verify`
*   **Descrição:** Verifica o código TOTP fornecido pelo usuário após o login indicar que 2FA é necessário.
*   **Autenticação:** Nenhuma (ou requer um token temporário emitido pelo `/login`).
*   **Request Body:**
    ```json
    {
      "userId": "string", // ID do usuário (obtido da resposta do login ou token temp)
      "twoFactorCode": "string" // Código TOTP de 6 dígitos
    }
    ```
*   **Success Response (200 OK):** `AuthResponse` (similar ao login completo, com tokens e perfil)
    ```json
    {
      "success": true,
      "token": "string",
      "refreshToken": "string",
      "user": UserProfile,
      "timestamp": "string"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Campos obrigatórios ausentes.
    *   `401 Unauthorized`: Código 2FA inválido, usuário não encontrado ou 2FA não configurado.
    *   `500 Internal Server Error`.

### 1.3. Renovar Access Token

*   **Endpoint:** `POST /auth/refresh`
*   **Descrição:** Gera um novo Access Token JWT usando um Refresh Token válido.
*   **Autenticação:** Nenhuma.
*   **Request Body:**
    ```json
    {
      "refreshToken": "string"
    }
    ```
*   **Success Response (200 OK):** `Partial<AuthResponse>`
    ```json
    {
      "success": true,
      "token": "string", // Novo Access Token JWT
      "timestamp": "string"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Refresh token ausente.
    *   `401 Unauthorized`: Refresh token inválido, expirado ou não associado a um usuário.
    *   `500 Internal Server Error`.

---

## 2. Segurança (`/security`)

**Autenticação:** Todas as rotas `/security` requerem um Access Token JWT válido no cabeçalho `Authorization: Bearer <token>`.

### 2.1. Criptografar Dados

*   **Endpoint:** `POST /security/encrypt`
*   **Descrição:** Criptografa uma string fornecida (ex: chave API de exchange) usando AES-256-GCM.
*   **Autorização:** Requer usuário autenticado (qualquer role).
*   **Request Body:**
    ```json
    {
      "dataToEncrypt": "string"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "encryptedData": "string" // Dados criptografados em formato HEX (IV + AuthTag + Ciphertext)
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: `dataToEncrypt` ausente.
    *   `401 Unauthorized`: Token JWT ausente ou inválido.
    *   `500 Internal Server Error`.

### 2.2. Descriptografar Dados

*   **Endpoint:** `POST /security/decrypt`
*   **Descrição:** Descriptografa uma string previamente criptografada com AES-256-GCM.
*   **Autorização:** Requer usuário autenticado com role `admin`.
*   **Request Body:**
    ```json
    {
      "dataToDecrypt": "string" // Dados criptografados em formato HEX
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "decryptedData": "string" // Dados originais descriptografados
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: `dataToDecrypt` ausente ou formato inválido/corrompido.
    *   `401 Unauthorized`: Token JWT ausente ou inválido.
    *   `403 Forbidden`: Usuário não tem role `admin`.
    *   `500 Internal Server Error`.

### 2.3. Validar Operação Crítica

*   **Endpoint:** `POST /security/validate-operation`
*   **Descrição:** Valida se o usuário autenticado tem permissão para realizar uma operação crítica (ex: mudar para modo live, executar trade, alterar configuração), potencialmente verificando roles e limites.
*   **Autorização:** Requer usuário autenticado (role específica pode ser verificada internamente dependendo do `operationType`).
*   **Request Body:**
    ```json
    {
      "operationType": "string", // Ex: "mode_switch", "trade_execution", "config_update"
      "operationData": "any", // Dados relevantes para a operação (ex: { "mode": "live" })
      "requiresConfirmation": "boolean" // Opcional: Indica se confirmação extra (ex: 2FA) é sugerida
    }
    ```
*   **Success Response (200 OK - Operação Permitida):**
    ```json
    {
      "allowed": true
    }
    ```
*   **Error Response (403 Forbidden - Operação Negada):**
    ```json
    {
      "allowed": false,
      "reason": "string", // Motivo da negação (ex: Permissão insuficiente)
      "requires2FA": "boolean" // Opcional: Indica se 2FA é necessário para prosseguir
    }
    ```
*   **Outras Error Responses:**
    *   `400 Bad Request`: Campos obrigatórios ausentes.
    *   `401 Unauthorized`: Token JWT ausente ou inválido.
    *   `500 Internal Server Error`.

### 2.4. Obter Logs de Auditoria

*   **Endpoint:** `GET /security/audit-logs`
*   **Descrição:** Retorna uma lista paginada de logs de auditoria, com opções de filtro.
*   **Autorização:** Requer usuário autenticado com role `admin` ou `viewer`. Viewers só podem ver seus próprios logs por padrão.
*   **Query Parameters (Opcionais):**
    *   `page` (number, default: 1): Número da página.
    *   `limit` (number, default: 20): Número de logs por página.
    *   `userId` (string): Filtrar por ID de usuário (Admin pode ver todos, Viewer só o próprio).
    *   `action` (string): Filtrar por tipo de ação (case-insensitive substring match).
    *   `startDate` (string, ISO 8601): Data/hora inicial.
    *   `endDate` (string, ISO 8601): Data/hora final.
*   **Success Response (200 OK):** `PaginatedResponse<AuditLogEntry>`
    ```json
    {
      "success": true,
      "data": [ AuditLogEntry ], // Array de logs da página atual
      "pagination": {
        "page": "number",
        "limit": "number",
        "total": "number", // Total de logs encontrados com os filtros
        "totalPages": "number"
      },
      "timestamp": "string",
      "requestId": "string"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Token JWT ausente ou inválido.
    *   `403 Forbidden`: Usuário não tem role `admin` ou `viewer`, ou Viewer tentando acessar logs de outro usuário.
    *   `500 Internal Server Error`.

---

## 3. Fluxo de Autenticação Típico

1.  **Frontend** envia `POST /auth/login` com `username` e `password`.
2.  **Backend** valida credenciais.
    *   **Se 2FA não habilitado:** Retorna `200 OK` com `token`, `refreshToken` e `user`.
    *   **Se 2FA habilitado e código NÃO fornecido:** Retorna resposta indicando `requiresTwoFactor: true`.
    *   **Se 2FA habilitado e código FORNECIDO:** Valida o código.
        *   Se válido: Retorna `200 OK` com `token`, `refreshToken` e `user`.
        *   Se inválido: Retorna `401 Unauthorized`.
3.  **Se 2FA foi requerido (passo 2b):**
    *   **Frontend** solicita o código 2FA ao usuário.
    *   **Frontend** envia `POST /auth/2fa/verify` com `userId` e `twoFactorCode`.
    *   **Backend** valida o código.
        *   Se válido: Retorna `200 OK` com `token`, `refreshToken` e `user`.
        *   Se inválido: Retorna `401 Unauthorized`.
4.  **Frontend** armazena `token` e `refreshToken` de forma segura.
5.  Para chamadas subsequentes a endpoints protegidos, **Frontend** envia o `token` no cabeçalho `Authorization: Bearer <token>`.
6.  Se o `token` expirar (API retorna 401/403), **Frontend** usa o `refreshToken` para chamar `POST /auth/refresh`.
7.  **Backend** valida o `refreshToken` e retorna um novo `token`.
8.  **Frontend** atualiza o `token` armazenado e tenta a chamada original novamente.

