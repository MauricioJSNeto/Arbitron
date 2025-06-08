import os
import openai
from github import Github

# Configure com sua chave de API e token GitHub
openai.api_key = os.getenv("OPENAI_API_KEY")
github = Github(os.getenv("GITHUB_TOKEN"))

repo_name = "MauricioJSNeto/Arbitron"
repo = github.get_repo(repo_name)

branch_name = "ia-auto-review"

# Garante que o branch exista
if branch_name not in [b.name for b in repo.get_branches()]:
    source = repo.get_branch("main")
    repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=source.commit.sha)

for file in os.listdir("reports"):
    with open(f"reports/{file}", "r") as report_file:
        report = report_file.read()
        print(f"Processando: {file}")

        prompt = f"""
Contexto: você está revisando o repositório {repo_name}.
Com base nesse relatório de revisão:

{report}

Gere um patch completo com as alterações sugeridas.
"""

        # Chamada do modelo para sugerir ajuste
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        suggestion = response.choices[0].message.content
        filename = file.replace(".md", "_suggestion.txt")
        os.makedirs("suggestions", exist_ok=True)
        with open(f"suggestions/{filename}", "w") as s:
            s.write(suggestion)

        # Cria commit e PR se desejar
        # Conteúdo hipotético -- ajuste conforme o patch proposto
        # repo.create_file(path, message, content, branch=branch_name)
        # repo.create_pull(title=..., body=..., head=branch_name, base="main")
