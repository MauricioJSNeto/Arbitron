# Segurança no Projeto Arbitron

## Práticas Recomendadas

- **Chaves e Tokens:** Use variáveis de ambiente e arquivos .env. Nunca comite essas informações.
- **Acesso à VPS:** Use somente SSH com chave privada. Nunca permita autenticação por senha.
- **Firewall:** Ative firewall (ex: UFW, Security Groups AWS).
- **HTTPS:** Acesse interfaces web apenas por conexões seguras.
