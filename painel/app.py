from flask import Flask, render_template_string, request, redirect, session, url_for, jsonify
from flask_dance.contrib.google import make_google_blueprint, google
from datetime import datetime
import json
import os

app = Flask(__name__)
app.secret_key = 'sua_chave_super_secreta'

# Autenticação Google
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['GOOGLE_OAUTH_CLIENT_ID'] = 'SEU_CLIENT_ID_GOOGLE'
app.config['GOOGLE_OAUTH_CLIENT_SECRET'] = 'SEU_CLIENT_SECRET_GOOGLE'

google_bp = make_google_blueprint(scope=["profile", "email"])
app.register_blueprint(google_bp, url_prefix="/login")

LOG_FILE = 'logs/lucro_diario.json'
EMAIL_AUTORIZADO = 'seu.email@exemplo.com'
STATE_FILE = 'logs/painel_estado.json'

def carregar_lucros():
    try:
        with open(LOG_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def salvar_lucros(data):
    with open(LOG_FILE, 'w') as f:
        json.dump(data, f)

def lucro_total():
    data = carregar_lucros()
    return round(sum(data.values()), 2)

def lucro_hoje():
    data = carregar_lucros()
    hoje = datetime.now().strftime('%Y-%m-%d')
    return round(data.get(hoje, 0.0), 2)

def estado_painel():
    if not os.path.exists(STATE_FILE):
        return {"ativo": False, "dry_run": True, "par": "ETH/USDT"}
    with open(STATE_FILE, 'r') as f:
        return json.load(f)

def salvar_estado(estado):
    with open(STATE_FILE, 'w') as f:
        json.dump(estado, f)

# --- Novo endpoint para o bot ler ---
@app.route('/api/estado', methods=['GET'])
def api_estado():
    return jsonify(estado_painel())

TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Painel Arbitron</title>
    <style>
        body { font-family: Arial; background: #111; color: #eee; text-align: center; padding-top: 40px; }
        .caixa { background: #222; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px; }
        h1 { color: #00f7ff; }
        a, button, input { color: #000; font-size: 16px; }
        button { background: #00f7ff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        input { padding: 8px; border-radius: 5px; border: none; }
    </style>
</head>
<body>
{% if not logado %}
    <div class="caixa">
        <h1>Login</h1>
        <a href="{{ url_for('google.login') }}"><button>Entrar com Google</button></a>
    </div>
{% else %}
    <div class="caixa">
        <h1>Painel Arbitron</h1>
        <p><b>Lucro Hoje:</b> {{ lucro_hoje }} USDT</p>
        <p><b>Lucro Total:</b> {{ lucro_total }} USDT</p>
        <hr>
        <form method="post" action="/atualizar">
            <p><label>Par Monitorado:</label> <input name="par" value="{{ estado.par }}"></p>
            <p><label>Modo Dry-Run:</label> <input type="checkbox" name="dry_run" {% if estado.dry_run %}checked{% endif %}></p>
            <p><label>Execução Ativa:</label> <input type="checkbox" name="ativo" {% if estado.ativo %}checked{% endif %}></p>
            <button type="submit">Salvar Alterações</button>
        </form>
        <hr>
        <form method="post" action="/resetar">
            <button>Resetar Lucro Diário</button>
        </form>
        <br><a href="{{ url_for('logout') }}">Sair</a>
    </div>
{% endif %}
</body>
</html>
"""

@app.route('/')
def index():
    if not session.get('logado'):
        if not google.authorized:
            return render_template_string(TEMPLATE, logado=False)
        resp = google.get("/oauth2/v2/userinfo")
        if not resp.ok:
            return "Erro ao autenticar com Google", 403
        email = resp.json().get("email")
        if email != EMAIL_AUTORIZADO:
            return "Acesso não autorizado", 403
        session['logado'] = True
    return render_template_string(
        TEMPLATE,
        logado=True,
        lucro_hoje=lucro_hoje(),
        lucro_total=lucro_total(),
        estado=estado_painel()
    )

@app.route('/atualizar', methods=['POST'])
def atualizar():
    estado = {
        "par": request.form.get("par"),
        "dry_run": "dry_run" in request.form,
        "ativo": "ativo" in request.form
    }
    salvar_estado(estado)
    return redirect(url_for('index'))

@app.route('/resetar', methods=['POST'])
def resetar():
    hoje = datetime.now().strftime('%Y-%m-%d')
    data = carregar_lucros()
    data[hoje] = 0.0
    salvar_lucros(data)
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    os.makedirs("logs", exist_ok=True)
    app.run(debug=True, port=8000)
