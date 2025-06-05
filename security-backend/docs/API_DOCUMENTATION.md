# Camada de Segurança - Documentação da API v2

Este documento descreve as APIs implementadas e atualizadas na camada de segurança do Bot de Arbitragem de Criptomoedas, incluindo Autenticação, Segurança, Alertas e melhorias de Auditoria/Validação.

**URL Base da API:** `/api/v1`

**Autenticação:** A maioria das rotas requer um JSON Web Token (JWT) válido no cabeçalho `Authorization` como `Bearer <token>`. Rotas específicas podem exigir roles (`admin`, `trader`, `viewer`).

**Rate Limiting:** Endpoints sensíveis (login, refresh, operações de segurança) possuem rate limiting por usuário/IP para prevenir abuso.

**Observação:** Os serviços de usuário (`UserService`), auditoria (`AuditService`) e alertas (`AlertService`) utilizam dados em memória para simulação. Em produção, devem ser substituídos por implementações que interajam com um banco de dados real (ex: PostgreSQL).

---

## 1. Autenticação (`/auth`)

*   **Rate Limiting:** Aplicado a todas as rotas `/auth`.

### 1.1. Login de Usuário

*   **Endpoint:** `POST /auth/login`
*   **Descrição:** Autentica um usuário com nome de usuário e senha. Pode requerer uma segunda etapa de verificação 2FA se habilitada.
*   **Request Body:** `AuthRequest`
*   **Responses:** Conforme documentado anteriormente (sucesso completo, 2FA requerido, erro).

### 1.2. Verificação 2FA

*   **Endpoint:** `POST /auth/2fa/verify`
*   **Descrição:** Verifica o código TOTP fornecido pelo usuário após o login indicar que 2FA é necessário.
*   **Request Body:** `{ "userId": "string", "twoFactorCode": "string" }`
*   **Responses:** Conforme documentado anteriormente (sucesso com tokens, erro).

### 1.3. Renovar Access Token

*   **Endpoint:** `POST /auth/refresh`
*   **Descrição:** Gera um novo Access Token JWT usando um Refresh Token válido.
*   **Request Body:** `{ "refreshToken": "string" }`
*   **Responses:** Conforme documentado anteriormente (sucesso com novo token, erro).

---

## 2. Segurança (`/security`)

*   **Autenticação:** Requer JWT válido.
*   **Rate Limiting:** Aplicado a operações sensíveis (`encrypt`, `decrypt`, `validate-operation`).

### 2.1. Criptografar Dados

*   **Endpoint:** `POST /security/encrypt`
*   **Descrição:** Criptografa uma string fornecida (ex: chave API) usando AES-256-GCM.
*   **Autorização:** Usuário autenticado.
*   **Request Body:** `{ "dataToEncrypt": "string" }`
*   **Response (200 OK):** `{ "success": true, "data": { "encryptedData": "string" } }`
*   **Auditoria:** Registra a ação `encrypt_data`.

### 2.2. Descriptografar Dados

*   **Endpoint:** `POST /security/decrypt`
*   **Descrição:** Descriptografa uma string previamente criptografada.
*   **Autorização:** Role `admin`.
*   **Request Body:** `{ "dataToDecrypt": "string" }`
*   **Response (200 OK):** `{ "success": true, "data": { "decryptedData": "string" } }`
*   **Auditoria:** Registra a ação `decrypt_data`.

### 2.3. Validar Operação Crítica

*   **Endpoint:** `POST /security/validate-operation`
*   **Middleware:** `validateCriticalOperationInput` - Realiza pré-validação (ex: exige `requiresConfirmation=true` para trades acima do limite).
*   **Descrição:** Valida se o usuário pode realizar uma operação crítica (ex: mudar para modo live, executar trade > $1000, alterar config). A lógica de validação no `AuthService` foi aprimorada.
*   **Autorização:** Usuário autenticado (role específica pode ser verificada internamente).
*   **Request Body:** `{ "operationType": "string", "operationData": any, "requiresConfirmation": boolean }`
*   **Response (200 OK):** `{ "allowed": true }`
*   **Response (403 Forbidden / 400 Bad Request):** `{ "allowed": false, "reason": "string", "requires2FA": boolean }`
*   **Auditoria:** Registra a ação `validate_operation` (sucesso ou falha).

### 2.4. Obter Logs de Auditoria

*   **Endpoint:** `GET /security/audit-logs`
*   **Descrição:** Retorna logs de auditoria paginados com filtros (usuário, ação, período).
*   **Autorização:** Role `admin` ou `viewer` (viewer só vê próprios logs).
*   **Query Params:** `page`, `limit`, `userId`, `action`, `startDate`, `endDate`.
*   **Response (200 OK):** `PaginatedResponse<AuditLogEntry>`
*   **Auditoria:** Registra a ação `get_audit_logs`.

---

## 3. Alertas (`/alerts`) (NOVO)

*   **Autenticação:** Requer JWT válido.

### 3.1. Buscar Alertas do Usuário

*   **Endpoint:** `GET /alerts`
*   **Descrição:** Retorna uma lista paginada de alertas para o usuário autenticado.
*   **Autorização:** Usuário autenticado.
*   **Query Params (Opcionais):**
    *   `page` (number, default: 1)
    *   `limit` (number, default: 20)
    *   `read` (boolean, `true` ou `false`): Filtrar por status de leitura (omitir para buscar todos).
*   **Success Response (200 OK):** `PaginatedResponse<Alert>`
    ```json
    {
      "success": true,
      "data": [ Alert ], // Array de alertas da página
      "pagination": { "page": number, "limit": number, "total": number, "totalPages": number },
      "timestamp": "string",
      "requestId": "string"
    }
    ```
*   **Error Responses:** `401 Unauthorized`, `500 Internal Server Error`.

### 3.2. Criar Novo Alerta

*   **Endpoint:** `POST /alerts`
*   **Descrição:** Cria um novo alerta para o usuário autenticado. (Nota: Geralmente usado internamente por outros serviços, mas a API está disponível).
*   **Autorização:** Usuário autenticado.
*   **Request Body:**
    ```json
    {
      "type": "string", // AlertType (ex: 'info', 'warning', 'trade_executed')
      "title": "string",
      "message": "string",
      "metadata": "object" // Opcional
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "success": true,
      "data": Alert // O alerta criado
    }
    ```
*   **Auditoria:** Registra a ação `create_alert`.
*   **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`.

### 3.3. Marcar Alerta como Lido

*   **Endpoint:** `PUT /alerts/:id/read`
*   **Descrição:** Marca um alerta específico do usuário autenticado como lido.
*   **Autorização:** Usuário autenticado.
*   **Path Parameter:** `:id` - O ID do alerta a ser marcado.
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Alert marked as read."
    }
    ```
*   **Auditoria:** Registra a ação `mark_alert_read` (ou `mark_alert_read_fail`).
*   **Error Responses:** `401 Unauthorized`, `404 Not Found` (alerta não existe ou não pertence ao usuário), `500 Internal Server Error`.

---

## 4. Melhorias de Auditoria e Validação

*   **Log Automático:** O `AuditService` agora é chamado em mais pontos críticos (criação/leitura de alertas, acesso a logs, falhas de validação, etc.).
*   **Validação de Operações:** A função `validateCriticalOperation` no `AuthService` foi aprimorada para verificar explicitamente a mudança para modo `live` e trades acima de um limite (`$1000` no exemplo), exigindo confirmação.
*   **Middleware de Validação:** Um novo middleware (`validateCriticalOperationInput`) foi adicionado à rota `POST /security/validate-operation` para garantir que flags como `requiresConfirmation` sejam enviadas corretamente pelo frontend em cenários específicos (ex: trades acima do limite).
*   **Rate Limiting:** Middlewares de rate limiting foram adicionados às rotas `/auth` e a endpoints sensíveis em `/security` para mitigar abuso.

