import os
import tempfile
from flask import Flask, request, jsonify, send_from_directory
import json
import requests
from extractPDF import extrair_fatura

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = Flask(__name__, static_folder=None)

@app.get("/")
def index():
    return send_from_directory(RAIZ, "index.html")

@app.get("/<any(css, js, img, pages):pasta>/<path:arquivo>")
def estaticos(pasta, arquivo):
    return send_from_directory(os.path.join(RAIZ, pasta), arquivo)

@app.post("/api/fatura")
def receber_fatura():
    arquivo = request.files.get("arquivo")
    if arquivo is None or not arquivo.filename.lower().endswith(".pdf"):
        return jsonify(erro="Envie um arquivo PDF."), 400

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        arquivo.save(tmp)
        caminho = tmp.name
    try:
        dados = extrair_fatura(caminho)
    except Exception as e:
        return jsonify(erro=f"Não consegui ler a fatura: {e}"), 422
    finally:
        os.remove(caminho)  # a fatura tem CPF e endereço, não deixe sobrando

    return jsonify(dados)

@app.post("/api/chat")
def clareia_chat():
    pedido = request.get_json()
    pergunta = pedido.get("pergunta")
    fatura = pedido.get("fatura")

    if not pergunta:
        return jsonify(erro="Não foi possível ler a sua pergunta."), 400
    elif not fatura:
        return jsonify(erro="Não foi possível ler a sua fatura."), 400
    
    fatura_filtrada = {
        "itens": fatura["itens"],
        "historico": fatura["historico"],
        "saldo_geracao_kwh": fatura["saldo_geracao_kwh"],
    }

    mensagens = [
        {"role": "system", "content": "Você é a ClareIA, uma assistente de faturas de energia. Use linguagem simples e use os dados abaixo:\n" + json.dumps(fatura_filtrada, ensure_ascii=False)},
        {"role": "user", "content": pergunta},
    ]
    try:
        resp = requests.post("http://localhost:11434/api/chat", json={"model": "qwen3:8b", "messages": mensagens, "stream":False}, timeout=120)
    except requests.RequestException:
        return jsonify(erro="Assistente ClareIA Offline"), 503

    texto = resp.json()["message"]["content"]
    return jsonify(resposta=texto)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
