# ClareIA

Sua conta de luz, mais clara. O ClareIA é um site onde a pessoa envia a fatura de energia em PDF, vê os dados organizados e tira dúvidas com uma IA que roda localmente.

🔗 **Site:** https://lsnicol.github.io/Clareia/

> Projeto em desenvolvimento. O site publicado no GitHub Pages é estático: mostra as páginas, mas **o envio da fatura e o chat só funcionam com o servidor Python rodando** (veja [Rodando localmente](#rodando-localmente)).

## O que já tem

**Página inicial**

- Área de envio da fatura (arrastar e soltar ou escolher arquivo, até 10 MB)
- Card de exemplo de conta traduzida
- Seção "Como funciona" em 4 passos (vira carrossel em telas estreitas)
- Perguntas frequentes e rodapé

**Página de resultado**

- Leitor do PDF com zoom, navegação por página, busca e download
- Chat sobre a fatura, com a resposta aparecendo aos poucos
- Atalhos "Resumir fatura", "Explicar itens" e "Consumo mensal", calculados no navegador, sem IA
- Visão só do PDF, só do chat ou lado a lado, com divisores ajustáveis
- Barra lateral com pastas e opções para renomear, compartilhar, exportar, redefinir e excluir o chat

**Conta**

- Janela de login e criar conta e página de cadastro, com validação dos campos. Ainda é só a interface: nenhuma conta é criada.

O layout é responsivo, com menu hambúrguer.

## Limitações atuais

- Só **PDF** é lido. A tela inicial também anuncia JPG e PNG, mas o servidor recusa esses formatos.
- A extração foi feita para o layout de fatura residencial da **CEMIG com saldo de geração** (energia solar ou compartilhada). Faturas sem esse campo, ou de outro layout, retornam erro.
- Só a primeira página do PDF é analisada.
- O navegador guarda uma fatura por vez, e as mensagens do chat se perdem ao recarregar a página.
- Cada pergunta é respondida sozinha: a IA não recebe as mensagens anteriores.
- Erros de envio aparecem apenas no console do navegador.

## Como funciona

1. O navegador envia o PDF para `POST /api/fatura`.
2. O servidor extrai itens, histórico de consumo, saldo de geração e unidade consumidora com o pdfplumber, e apaga o arquivo temporário.
3. O PDF e os dados extraídos ficam no IndexedDB do navegador, e a página de resultado abre.
4. No chat, `POST /api/chat` manda a pergunta e um resumo da fatura para o [Ollama](https://ollama.com/), que responde em streaming.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puros, sem framework nem build. [PDF.js](https://mozilla.github.io/pdf.js/) 3.11 incluído em `js/vendor/`. Fontes Inter e Manrope pelo Google Fonts.
- **Backend:** Python com Flask, pdfplumber e requests.
- **IA:** modelo `qwen3.5:4b` no Ollama.

## Estrutura

```
index.html          página inicial
pages/              cadastro e resultado
css/                base (tokens de design) e um arquivo por parte do site
js/                 envio, leitor de PDF, chat, barra lateral, formulários
js/vendor/          PDF.js
img/                ícones e logo em SVG
src/server.py       servidor Flask: arquivos do site e API
src/extractPDF.py   extração dos dados da fatura
requirements.txt    dependências Python
```

## Rodando localmente

Você precisa de Python 3.10 ou mais novo e do [Ollama](https://ollama.com/download) instalado e em execução.

```bash
# dependências
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# modelo do chat (cerca de 3,3 GB)
ollama pull qwen3.5:4b

# servidor
python src/server.py
```

Depois abra http://localhost:5000/.

Sem o Ollama, o envio e a leitura da fatura continuam funcionando; só o chat responde que o assistente está offline.

> Para mexer só no visual da página inicial, `python3 -m http.server 8000` basta. A página de resultado usa caminhos a partir da raiz (`/css/...`) e precisa ser aberta pelo servidor na raiz.

### Configuração

| O quê | Como |
|---|---|
| Acessar de outros aparelhos da rede | `HOST=0.0.0.0 python src/server.py` (o padrão é só `127.0.0.1`) |
| Trocar o modelo | `model` em `src/server.py` |
| Número de threads do Ollama | `num_thread` em `src/server.py` (está em 10; ajuste para a sua máquina) |

A API aceita, por IP, 10 envios de fatura e 20 perguntas por minuto.

### Testando só a extração

```bash
python src/extractPDF.py caminho/da/fatura.pdf
```

O resultado vai para `data/output/<nome-do-arquivo>.json`.

### Expondo na internet

O servidor está preparado para ficar atrás de um [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/):

```bash
cloudflared tunnel --url http://localhost:5000
```

Mantenha o `HOST` padrão nesse caso: o limite de pedidos confia no cabeçalho `CF-Connecting-IP`.

## Privacidade

Faturas têm CPF, endereço e código do cliente.

- O servidor apaga o PDF logo depois de ler.
- O PDF e os dados ficam salvos no navegador até o chat ser excluído ou outra fatura ser enviada.
- A IA roda no Ollama, na mesma máquina do servidor.
- `data/` e `*.pdf` estão no `.gitignore`. Não faça commit de faturas reais.

## Deploy

As páginas são publicadas pelo GitHub Pages, direto da branch `main` (pasta raiz). Cada push publica o site. O backend não é publicado por ali.

## Próximos passos

- Aceitar fotos da conta (JPG e PNG)
- Ler faturas de outros layouts e sem geração
- Contas de usuário, com histórico de consumo
- Mostrar os erros de envio na tela
- Páginas de contato, privacidade e termos
