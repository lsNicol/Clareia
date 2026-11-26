import json
import os
import tempfile
import time
from collections import defaultdict, deque
from flask import Flask, Response, request, jsonify, send_from_directory
import requests
from extractPDF import extrair_fatura

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # faturas passam longe disso

# limite simples por IP: {rota: (pedidos, janela em segundos)}
LIMITES = {"/api/fatura": (10, 60), "/api/chat": (20, 60)}
historico_pedidos = defaultdict(deque)

def ip_do_cliente():
    # atrás do cloudflared o IP real vem neste header
    return request.headers.get("CF-Connecting-IP", request.remote_addr)

@app.before_request
def limitar_pedidos():
    limite = LIMITES.get(request.path)
    if limite is None or request.method != "POST":
        return
    maximo, janela = limite
    agora = time.time()
    fila = historico_pedidos[(ip_do_cliente(), request.path)]
    while fila and agora - fila[0] > janela:
        fila.popleft()
    if len(fila) >= maximo:
        return jsonify(erro="Muitos pedidos. Espere um pouco e tente de novo."), 429
    fila.append(agora)

@app.errorhandler(413)
def arquivo_grande(_):
    return jsonify(erro="Arquivo grande demais (máximo 10 MB)."), 413

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

def resumir_fatura(fatura):
    # texto enxuto em vez do JSON: menos tokens para o modelo ler = resposta mais rápida
    campos = {"valor": "R$", "kwh": "kWh", "preco_unit": "preço unit.", "icms": "ICMS", "pis_cofins": "PIS/COFINS"}
    itens = "\n".join(
        f"- {i['descricao']}: " + ", ".join(f"{nome} {i[c]}" for c, nome in campos.items() if i.get(c))
        for i in fatura["itens"])
    historico = ", ".join(f"{m['mes']} {m['kwh']}" for m in fatura["historico"])
    return (f"Itens (valor negativo é desconto; TOTAL é o valor a pagar):\n{itens}\n"
            f"Consumo por mês em kWh: {historico}\n"
            f"Saldo de geração: {fatura['saldo_geracao_kwh']} kWh")

def repassar_resposta(resp):
    # uma linha JSON por pedaço: {"parte": "..."} ou {"erro": "..."}
    linha = lambda **dados: json.dumps(dados, ensure_ascii=False) + "\n"
    try:
        with resp:  # se o navegador desistir, fecha a conexão e o Ollama para de gerar
            for bruto in resp.iter_lines():
                if not bruto:
                    continue
                pedaco = json.loads(bruto)
                if "error" in pedaco:
                    break
                if pedaco["message"]["content"]:
                    yield linha(parte=pedaco["message"]["content"])
                if pedaco["done"]:
                    return
    except requests.RequestException:
        pass
    yield linha(erro="A resposta foi interrompida. Tente de novo.")

@app.post("/api/chat")
def clareia_chat():
    pedido = request.get_json(silent=True) or {}
    pergunta = pedido.get("pergunta")
    fatura = pedido.get("fatura")

    if not pergunta:
        return jsonify(erro="Não foi possível ler a sua pergunta."), 400
    elif not fatura:
        return jsonify(erro="Não foi possível ler a sua fatura."), 400
    
    mensagens = [
        {"role": "system", "content": "Você é a ClareIA, uma assistente de faturas de energia. Responda em poucas frases, com linguagem simples, usando os dados abaixo.\n" + resumir_fatura(fatura)},
        {"role": "user", "content": pergunta},
    ]
    try:
        resp = requests.post("http://localhost:11434/api/chat", json={
            "model": "qwen3.5:4b",
            "messages": mensagens,
            "stream": True,
            "think": False,
            "keep_alive": "30m",  # não descarrega o modelo entre as perguntas
            "options": {"num_thread": 10},  # o padrão do Ollama usa só 2 neste notebook
        }, stream=True, timeout=120)
        resp.raise_for_status()  # ex.: modelo não instalado
    except requests.RequestException:
        return jsonify(erro="Assistente ClareIA Offline"), 503

    # x-ndjson: o cloudflared repassa na hora, sem esperar a resposta inteira
    return Response(repassar_resposta(resp), mimetype="application/x-ndjson")

if __name__ == "__main__":
    # padrão só local (cloudflared); HOST=0.0.0.0 libera para a rede
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=5000, debug=False)
