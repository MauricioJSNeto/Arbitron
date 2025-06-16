import json
from datetime import datetime

ARQUIVO_CONTROLE = "logs/lucro_diario.json"

def carregar():
    try:
        with open(ARQUIVO_CONTROLE, "r") as f:
            return json.load(f)
    except:
        return {}

def salvar(data):
    with open(ARQUIVO_CONTROLE, "w") as f:
        json.dump(data, f)

def lucro_hoje():
    data = carregar()
    hoje = datetime.now().strftime("%Y-%m-%d")
    return data.get(hoje, 0.0)

def atualizar_lucro(valor):
    data = carregar()
    hoje = datetime.now().strftime("%Y-%m-%d")
    data[hoje] = data.get(hoje, 0.0) + valor
    salvar(data)

def pode_operar(limite):
    return lucro_hoje() < limite
