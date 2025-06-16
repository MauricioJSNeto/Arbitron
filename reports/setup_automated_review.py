# Estrutura inicial do repositório com suporte para revisão automatizada

import os

# 1. Cria diretório para os relatórios
os.makedirs("reports", exist_ok=True)

# 2. Template de relatório para cada função
for role in [
    "product_owner", "qa", "backend", "devops", "frontend", "security", "design"
]:
    with open(f"reports/{role}.md", "w") as f:
        role_title = role.replace("_", " ").title()
        content = f"""### ✅ Função:
{role_title}

### 🔍 Descrição do Problema:
(Descreva claramente o problema identificado no código ou comportamento do sistema)

### 🛠️ Proposta de Correção:
(Explique o que precisa ser feito para resolver o problema. Seja técnico e objetivo.)

### 📂 Arquivo(s) Afetado(s):
(Informe o caminho dos arquivos e, se possível, as linhas afetadas)

### ✅ Prioridade:
(Baixa | Média | Alta | Crítica)
"""
        f.write(content)

# 3. Script inicial para parsing dos relatórios e aplicação via IA
apply_script_lines = [
    "import os",
    "# import openai  # Comentar ou remover se não usar OpenAI",
    "# from github import Github # Comentar ou remover se não usar Github",
    "",
    "# Configure com sua chave de API e token GitHub",
    "# openai.api_key = os.getenv(\"OPENAI_API_KEY\") # Comentar ou remover se não usar OpenAI",
    "# github = Github(os.getenv(\"GITHUB_TOKEN\")) # Comentar ou remover se não usar Github",
    "",
    "# repo_name = \"MauricioJSNeto/Arbitron\" # Comentar ou remover se não usar Github",
    "# repo = github.get_repo(repo_name) # Comentar ou remover se não usar Github",
    "",
    "# branch_name = \"ia-auto-review\" # Comentar ou remover se não usar Github",
    "",
    "# Garante que o branch exista",
    "# if branch_name not in [b.name for b in repo.get_branches()]: # Comentar ou remover se não usar Github",
    "#     source = repo.get_branch(\"main\") # Comentar ou remover se não usar Github",
    "#     repo.create_git_ref(ref=f\"refs/heads/{branch_name}\", sha=source.commit.sha) # Comentar ou remover se não usar Github",
    "",
    "for file in os.listdir(\"reports\"):",
    "    with open(f\"reports/{file}\", \"r\") as report_file:",
    "        report = report_file.read()",
    "        print(f\"Processando: {file}\")",
    "",
    "        # prompt_template = \"\"\"Contexto: você está revisando o repositório {repo_name}.\\nCom base nesse relatório de revisão:\\n\\n{report}\\n\\nGere um patch completo com as alterações sugeridas.\\n\"\"\"",
    "        # prompt = prompt_template.format(repo_name=repo_name, report=report)",
    "        # Substituindo o prompt_template para não depender de repo_name se o GitHub for removido",
    "        prompt = f\"Com base neste relatório de revisão:\\n\\n{report}\\n\\nGere um patch completo com as alterações sugeridas.\\n\"",
    "",
    "        # Chamada do modelo para sugerir ajuste (Placeholder para Manus.AI API)",
    "        # Exemplo hipotético de como você chamaria a API da Manus.AI:",
    "        # from manus_ai_sdk import ManusAI",
    "        # manus_ai = ManusAI(api_key=os.getenv(\"MANUS_AI_API_KEY\"))",
    "        # response = manus_ai.generate_code(prompt=prompt, model=\"manus-code-gen\")",
    "        # suggestion = response.generated_code",
    "        suggestion = f\"\"\"[SUGESTÃO GERADA PELA MANUS.AI PARA {file}]\\n\\n{prompt}\
\"\"\"",
    "",
    "        # suggestion = response.choices[0].message.content # Remover se não usar OpenAI",
    "        filename = file.replace(\".md\", \"_suggestion.txt\")",
    "        with open(f\"suggestions/{filename}\", \"w\") as s:",
    "            s.write(suggestion)",
    "",
    "        # Cria commit e PR se desejar (Comentar ou remover se não usar Github)",
    "        # Conteúdo hipotético -- ajuste conforme o patch proposto",
    "        # repo.create_file(path, message, content, branch=branch_name)",
    "        # repo.create_pull(title=..., body=..., head=branch_name, base=\"main\")",
]
apply_script = "\n".join(apply_script_lines)

os.makedirs("suggestions", exist_ok=True)

with open("apply_ai_fixes.py", "w") as f:
    f.write(apply_script)

# 4. Cria GitHub Actions para execução automatizada
github_action_lines = [
    "name: IA Code Review",
    "",
    "on:",
    "  push:",
    "    paths:",
    "      - \'reports/**\\'",
    "  workflow_dispatch:",
    "",
    "jobs:",
    "  run-review:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v3",
    "",
    "      - name: Setup Python",
    "        uses: actions/setup-python@v4",
    "        with:",
    "          python-version: \'3.10\\'",
    "",
    "      - name: Install dependencies",
    "        run: pip install PyGithub # Remover openai se não for mais usado, adicionar manus_ai_sdk se aplicável",
    "",
    "      - name: Run IA Review Script",
    "        env:",
    "          # OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} # Remover se não usar OpenAI",
    "          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Manter se for usar PyGithub para criar PRs",
    "          MANUS_AI_API_KEY: ${{ secrets.MANUS_AI_API_KEY }} # Adicionar sua chave da Manus.AI aqui",
    "        run: python apply_ai_fixes.py",
]
github_action = "\n".join(github_action_lines)

os.makedirs(".github/workflows", exist_ok=True)
with open(".github/workflows/ai_review.yml", "w") as f:
    f.write(github_action)


