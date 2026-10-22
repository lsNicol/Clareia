# ClareIA

Sua conta de luz, mais clara. O ClareIA é um site onde a pessoa envia a fatura de energia e recebe uma explicação de cada item em linguagem simples, com ajuda de IA.

🔗 **Site:** https://lsnicol.github.io/Clareia/

> Projeto em desenvolvimento. Por enquanto existe só a página inicial, e o envio da conta ainda não faz nada além de receber o arquivo no navegador.

## O que já tem

- Página inicial com área de envio (arrastar e soltar ou escolher arquivo)
- Card de exemplo de conta traduzida
- Seção "Como funciona" em 4 passos (vira carrossel em telas estreitas)
- Layout responsivo, com menu hambúrguer no mobile

## Tecnologias

HTML, CSS e JavaScript puros, sem framework nem build. Fontes Inter e Manrope pelo Google Fonts.

## Estrutura

```
index.html        página inicial
css/              base, header, index e como-funciona
js/               drop-file.js (envio) e como-funciona.js (carrossel)
img/              ícones e logo em SVG
```

## Rodando localmente

Os caminhos dos arquivos começam com `/Clareia/`, por causa do GitHub Pages. Por isso o site precisa ser servido a partir da pasta **pai** do projeto:

```bash
cd ..                       # pasta que contém Clareia/
python3 -m http.server 8000
```

Depois abra http://localhost:8000/Clareia/.

## Deploy

GitHub Pages, direto da branch `main` (pasta raiz). Cada push publica o site.

## Próximos passos

- Páginas internas (dúvidas frequentes, login e cadastro)
- Leitura da conta com IA e geração do relatório
- Histórico de consumo para quem tiver login
