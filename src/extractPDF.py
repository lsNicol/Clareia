import sys
import os
import re
import json
import pdfplumber

NUM = re.compile(r"-?\d{1,3}(?:\.\d{3})*,\d+|-?\d+,\d+|\d+")

def br(s: str) -> float:
    #formata para float
    return float(s.replace(".", "").replace(",", "."))

def achar(words, texto):
    #find com lazy evaluation
    return next(w for w in words if w["text"] == texto)

def extrair_itens(page, words):
    topo = achar(words, "Itens")["bottom"]
    base = achar(words, "Bandeira")["bottom"]
    regiao = page.crop((0, topo, page.width, base))
    itens = []
    for linha in regiao.extract_text().split("\n"):
        nums = NUM.findall(linha)
        if not nums:
            continue
        # descrição = texto antes do primeiro número (sem a unidade)
        descricao = re.split(r"\s(?:kWh\s)?-?\d", linha, maxsplit=1)[0].strip()
        item = {"descricao": descricao}

        if descricao.startswith("TOTAL"):
            item.update(valor=br(nums[0]), pis_cofins=br(nums[1]), base_icms=br(nums[2]), icms=br(nums[3]))
        elif len(nums) >= 6:
            v = [br(n) for n in nums[-6:]]
            item.update(valor=v[0], pis_cofins=v[1], base_icms=v[2],
                        aliq_icms=v[3], icms=v[4], tarifa_unit=v[5])
            resto = nums[:-6]
            if resto:
                item["preco_unit"] = br(resto[-1])
            if len(resto) >= 2:
                item["kwh"] = br(resto[-2])
        else:                       # Contrib Ilum, Bandeira...
            item["valor"] = br(nums[-1])
        itens.append(item)
    return itens

def extrair_historico(page, words):
    ancora = achar(words, "Histórico")
    # caixa da esquerda: do título até o fim do histórico
    regiao = page.crop((0, ancora["top"], page.width * 0.4, page.height))
    historico = []
    for linha in regiao.extract_text().split("\n"):
        m = re.match(r"([A-Z]{3}/\d{2})\s+(\d+)\s+([\d,]+)\s+(\d+)$", linha.strip())
        if m:
            historico.append({"mes": m[1], "kwh": int(m[2]), "media_dia": br(m[3]), "dias": int(m[4])})
    return historico

def extrair_fatura(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[0]
        words = page.extract_words()
        texto = page.extract_text()

        return {
            "itens": extrair_itens(page, words),
            "historico": extrair_historico(page, words),
            "saldo_geracao_kwh": br(re.search(r"SALDO ATUAL DE GERAÇÃO:\s*([\d.,]+)", texto)[1]),
            "uc": re.search(r"\d\.\d{3}\.\d{3}\.\d{3}-\d{2}", texto)[0],
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Erro: Você precisa informar o caminho do arquivo PDF.")
        print("Uso: python extractPDF.py /caminho/do/seu/arquivo.pdf")
        sys.exit(1)

    pdf_path = os.path.abspath(sys.argv[1])

    if not os.path.exists(pdf_path):
        print(f"Erro: O arquivo '{pdf_path}' não foi encontrado.")
        sys.exit(1)

    local_do_script = os.path.dirname(os.path.abspath(__file__))
    pasta_output = os.path.abspath(os.path.join(local_do_script, "..", "data", "output"))
    os.makedirs(pasta_output, exist_ok=True)

    nome_sem_extensao, _ = os.path.splitext(os.path.basename(pdf_path))
    json_path = os.path.join(pasta_output, f"{nome_sem_extensao}.json")

    dados = extrair_fatura(pdf_path)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

    print("Processamento concluído com sucesso!")
    print(f"-> Entrada: {pdf_path}")
    print(f"-> Saída:   {json_path}")
