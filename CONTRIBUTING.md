# Contribuindo para o Projeto Arbitron

Obrigado por seu interesse em contribuir para o projeto Arbitron! Este documento fornece diretrizes para contribuições efetivas e colaboração produtiva.

## Código de Conduta

### Nossos Valores
- **Respeito:** Tratamos todos os colaboradores com respeito e profissionalismo
- **Inclusão:** Valorizamos perspectivas diversas e criamos um ambiente acolhedor
- **Colaboração:** Trabalhamos juntos para alcançar objetivos comuns
- **Excelência:** Buscamos sempre a qualidade e melhoria contínua

### Comportamentos Esperados
- Use linguagem acolhedora e inclusiva
- Respeite pontos de vista e experiências diferentes
- Aceite críticas construtivas com elegância
- Foque no que é melhor para a comunidade
- Demonstre empatia com outros membros da comunidade

## Como Contribuir

### Tipos de Contribuição

1. **Relatórios de Bug**
   - Identifique e reporte problemas
   - Forneça informações detalhadas para reprodução
   - Sugira possíveis soluções

2. **Solicitações de Funcionalidade**
   - Proponha novas funcionalidades
   - Explique o caso de uso e benefícios
   - Discuta implementação com a equipe

3. **Contribuições de Código**
   - Correções de bugs
   - Implementação de novas funcionalidades
   - Melhorias de performance
   - Refatoração de código

4. **Documentação**
   - Melhoria da documentação existente
   - Criação de tutoriais e guias
   - Tradução de conteúdo
   - Exemplos de uso

5. **Testes**
   - Criação de novos testes
   - Melhoria da cobertura de testes
   - Testes de performance
   - Validação de cenários edge case

## Processo de Contribuição

### 1. Preparação do Ambiente

```bash
# Fork o repositório no GitHub
# Clone seu fork localmente
git clone https://github.com/seu-usuario/arbitron.git
cd arbitron

# Configure o repositório upstream
git remote add upstream https://github.com/projeto-original/arbitron.git

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# Instale dependências de desenvolvimento
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Criação de Branch

```bash
# Atualize seu fork
git checkout main
git pull upstream main

# Crie uma branch para sua contribuição
git checkout -b feature/nome-da-funcionalidade
# ou
git checkout -b bugfix/descricao-do-bug
# ou
git checkout -b docs/melhoria-documentacao
```

### 3. Desenvolvimento

#### Padrões de Código

**Python (PEP 8)**
```python
# Use nomes descritivos
def calculate_arbitrage_profit(buy_price: Decimal, sell_price: Decimal) -> Decimal:
    """
    Calcula o lucro percentual de uma oportunidade de arbitragem.
    
    Args:
        buy_price: Preço de compra
        sell_price: Preço de venda
        
    Returns:
        Percentual de lucro
    """
    if buy_price <= 0:
        return Decimal('0')
    
    return ((sell_price - buy_price) / buy_price) * 100

# Use type hints sempre
from typing import List, Optional, Dict, Any

# Docstrings para todas as funções públicas
def process_exchange_data(data: Dict[str, Any]) -> Optional[PriceData]:
    """Processa dados brutos da exchange."""
    pass
```

**Estrutura de Arquivos**
```
src/
├── module_name/
│   ├── __init__.py
│   ├── core.py          # Lógica principal
│   ├── models.py        # Modelos de dados
│   ├── utils.py         # Funções utilitárias
│   └── exceptions.py    # Exceções customizadas
```

#### Testes

**Testes Unitários**
```python
import unittest
from unittest.mock import Mock, patch
from src.arbitrage import ArbitrageEngine

class TestArbitrageEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ArbitrageEngine(['binance', 'coinbase'])
    
    def test_calculate_profit_positive(self):
        """Testa cálculo de lucro positivo."""
        result = self.engine.calculate_profit(100, 105)
        self.assertEqual(result, 5.0)
    
    @patch('src.api_manager.requests.get')
    def test_api_integration(self, mock_get):
        """Testa integração com API externa."""
        mock_get.return_value.json.return_value = {'price': '50000'}
        # Teste da integração
```

**Cobertura de Testes**
- Mantenha cobertura > 80%
- Teste casos de sucesso e falha
- Inclua testes de edge cases
- Use mocks para dependências externas

### 4. Commit e Push

#### Mensagens de Commit

Use o formato [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato: tipo(escopo): descrição

# Exemplos:
git commit -m "feat(arbitrage): adiciona suporte para exchange Kraken"
git commit -m "fix(notifications): corrige envio de email com caracteres especiais"
git commit -m "docs(readme): atualiza instruções de instalação"
git commit -m "test(api): adiciona testes para validação de entrada"
git commit -m "refactor(cache): melhora performance do sistema de cache"
```

**Tipos de Commit:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção

#### Push das Mudanças

```bash
# Execute os testes antes do commit
python -m pytest tests/ -v

# Verifique a qualidade do código
flake8 src/
black src/
mypy src/

# Commit suas mudanças
git add .
git commit -m "feat(arbitrage): adiciona nova funcionalidade"

# Push para seu fork
git push origin feature/nome-da-funcionalidade
```

### 5. Pull Request

#### Criação do PR

1. Acesse seu fork no GitHub
2. Clique em "New Pull Request"
3. Selecione a branch com suas mudanças
4. Preencha o template do PR

#### Template do Pull Request

```markdown
## Descrição
Breve descrição das mudanças implementadas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação (mudança apenas na documentação)

## Como Testar
1. Passos para reproduzir/testar
2. Comandos específicos
3. Resultados esperados

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Todos os testes passam
- [ ] Cobertura de testes mantida/melhorada

## Screenshots (se aplicável)
Adicione screenshots para mudanças visuais.

## Issues Relacionadas
Fixes #123
Closes #456
```

### 6. Revisão de Código

#### Para Autores
- Responda aos comentários construtivamente
- Faça mudanças solicitadas prontamente
- Mantenha o PR atualizado com a branch main
- Seja paciente durante o processo de revisão

#### Para Revisores
- Seja construtivo e específico nos comentários
- Foque na qualidade, legibilidade e manutenibilidade
- Teste as mudanças localmente quando necessário
- Aprove quando estiver satisfeito com a qualidade

## Padrões de Qualidade

### Código
- **Legibilidade:** Código deve ser auto-explicativo
- **Manutenibilidade:** Fácil de modificar e estender
- **Performance:** Otimizado para casos de uso comuns
- **Segurança:** Livre de vulnerabilidades conhecidas

### Testes
- **Cobertura:** Mínimo 80% de cobertura
- **Qualidade:** Testes devem ser confiáveis e rápidos
- **Organização:** Testes bem estruturados e documentados

### Documentação
- **Completude:** Todas as funcionalidades documentadas
- **Clareza:** Linguagem clara e exemplos práticos
- **Atualização:** Mantida sincronizada com o código

## Ferramentas de Desenvolvimento

### Linting e Formatação
```bash
# Instalar ferramentas
pip install flake8 black mypy isort

# Executar verificações
flake8 src/                    # Linting
black src/                     # Formatação
mypy src/                      # Type checking
isort src/                     # Organização de imports
```

### Configuração do Editor

**VS Code (.vscode/settings.json)**
```json
{
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "python.sortImports.args": ["--profile", "black"],
    "editor.formatOnSave": true
}
```

## Comunicação

### Canais de Comunicação
- **GitHub Issues:** Bugs, funcionalidades, discussões técnicas
- **GitHub Discussions:** Perguntas gerais, ideias, feedback
- **Email:** Questões sensíveis ou privadas

### Etiqueta
- Seja claro e conciso
- Use títulos descritivos
- Forneça contexto suficiente
- Seja respeitoso e profissional

## Reconhecimento

Valorizamos todas as contribuições! Contribuidores são reconhecidos:

- **README:** Lista de contribuidores
- **Changelog:** Créditos em releases
- **Badges:** Reconhecimento especial para contribuições significativas

## Dúvidas?

Se você tem dúvidas sobre como contribuir:

1. Consulte a documentação existente
2. Procure issues similares
3. Abra uma issue com sua pergunta
4. Entre em contato com os mantenedores

Obrigado por contribuir para o projeto Arbitron! 🚀

