# Security Backend - README

Este diretório contém o código-fonte para a camada de segurança do Bot de Arbitragem de Criptomoedas, implementada em Node.js com TypeScript e Express.js.

## Funcionalidades Principais

*   Autenticação de usuário via JWT (Access + Refresh Tokens).
*   Suporte para Autenticação de Dois Fatores (2FA/TOTP) via Speakeasy.
*   Criptografia de dados sensíveis (ex: chaves API) usando AES-256-GCM.
*   Controle de acesso baseado em Roles (admin, trader, viewer).
*   Validação de operações críticas.
*   Registro de logs de auditoria.
*   APIs RESTful seguindo os contratos definidos em `lib/integration/api-contracts.ts`.

## Estrutura do Projeto

Consulte `security_backend_structure.md` para uma visão geral da organização dos diretórios e arquivos.

## Configuração

1.  **Variáveis de Ambiente:** Copie `.env.example` para `.env` e preencha as variáveis necessárias:
    *   `NODE_ENV`: Ambiente (development, production, test).
    *   `PORT`: Porta onde o servidor rodará.
    *   `JWT_SECRET`: Segredo para assinar Access Tokens.
    *   `JWT_EXPIRES_IN`: Tempo de expiração do Access Token (ex: `15m`, `1h`).
    *   `REFRESH_TOKEN_SECRET`: Segredo para assinar Refresh Tokens.
    *   `REFRESH_TOKEN_EXPIRES_IN`: Tempo de expiração do Refresh Token (ex: `7d`).
    *   `ENCRYPTION_KEY`: Chave de 32 bytes (64 caracteres hex) para criptografia AES-256-GCM.
    *   `DATABASE_URL`: URL de conexão com o banco de dados (ex: PostgreSQL).
    *   (Opcional) Configurações para serviços externos (SMTP, Telegram, etc.).

2.  **Banco de Dados:**
    *   **IMPORTANTE:** Os serviços `UserService` e `AuditService` atuais usam dados em memória para simulação. Você **precisa** substituí-los por implementações que interajam com seu banco de dados real (ex: usando Prisma, TypeORM, Sequelize).
    *   Modele as tabelas/coleções para `Users` e `AuditLogs` conforme necessário.
    *   Implemente a lógica de busca, criação e atualização nos arquivos de serviço correspondentes.
    *   **Hashing de Senhas:** Use `bcrypt.hash` para gerar hashes seguros ao criar ou atualizar senhas de usuários. A função `comparePassword` no `UserService` simulado precisa ser atualizada para usar `bcrypt.compare`.
    *   **Segredos 2FA:** Gere e armazene o `twoFactorSecret` (base32) de forma segura para cada usuário que habilitar 2FA.

## Instalação e Execução

1.  **Instalar Dependências:**
    \`\`\`bash
    npm install
    # ou
    yarn install
    \`\`\`

2.  **Compilar TypeScript:**
    \`\`\`bash
    npm run build
    # ou
    yarn build
    \`\`\`

3.  **Executar em Produção:**
    \`\`\`bash
    npm start
    # ou
    yarn start
    \`\`\`

4.  **Executar em Desenvolvimento (com hot-reload):**
    \`\`\`bash
    npm run dev
    # ou
    yarn dev
    \`\`\`

## Documentação da API

Consulte `API_DOCUMENTATION.md` para detalhes sobre os endpoints disponíveis, formatos de requisição/resposta e fluxos de autenticação.

## Integração

*   Esta camada expõe APIs RESTful no prefixo `/api/v1`.
*   Use um cliente HTTP (como o `api-client.ts` do frontend) para interagir com esses endpoints.
*   Siga o fluxo de autenticação JWT (login -> obter tokens -> enviar token no header -> refresh quando expirar).
*   Consulte o `integration-guide.md` do projeto principal para mais detalhes sobre a comunicação entre as camadas.

## Próximos Passos Recomendados

1.  Implementar a persistência em banco de dados real para usuários e logs de auditoria.
2.  Implementar a lógica real de hashing e comparação de senhas com `bcrypt`.
3.  Implementar a geração e armazenamento seguro de segredos 2FA por usuário.
4.  Refinar a lógica de `validateCriticalOperation` no `AuthService` conforme as regras de negócio específicas.
5.  Adicionar validação de entrada mais robusta (ex: usando `express-validator` ou `zod`).
6.  Implementar um sistema de logging mais robusto (ex: Winston, Pino).
7.  Escrever testes unitários e de integração.
8.  Configurar HTTPS em produção.
9.  Revisar e ajustar as configurações de CORS para produção.
