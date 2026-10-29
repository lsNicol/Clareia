// Converte o markdown das respostas da IA em elementos do DOM.
// Monta tudo com createElement/textContent (nunca innerHTML), então o texto do modelo não injeta HTML.
const renderMarkdown = (() => {
  function el(tag, pai, texto) {
    const e = document.createElement(tag);
    if (texto) e.textContent = texto;
    pai.append(e);
    return e;
  }

  // **negrito**, `código` e *itálico* / _itálico_ (o resto vira texto puro)
  function inline(texto, pai) {
    texto.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/).forEach((parte, i) => {
      if (!parte) return;
      if (i % 2 === 0) pai.append(parte);
      else if (parte.startsWith("**")) el("strong", pai, parte.slice(2, -2));
      else if (parte.startsWith("`")) el("code", pai, parte.slice(1, -1));
      else el("em", pai, parte.slice(1, -1));
    });
  }

  function tabela(linhas, destino) {
    const celulas = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const corpo = linhas.filter((l) => !/^[\s|:-]+$/.test(l));
    const t = el("table", el("div", destino));
    destino.lastChild.className = "tabela";
    corpo.forEach((linha, i) => {
      const tr = el("tr", t);
      celulas(linha).forEach((c) => inline(c, el(i === 0 ? "th" : "td", tr)));
    });
  }

  return (texto, destino) => {
    destino.replaceChildren();
    const linhas = texto.replace(/<think>[\s\S]*?<\/think>/g, "").trim().split("\n");
    let paragrafo = null; // <p> aberto: recebe as linhas seguintes
    let lista = null;     // <ul>/<ol> aberta
    const fechar = () => { paragrafo = null; lista = null; };

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      let m;
      if (linha.trim().startsWith("```")) {
        fechar();
        const codigo = [];
        for (i++; i < linhas.length && !linhas[i].trim().startsWith("```"); i++) codigo.push(linhas[i]);
        el("code", el("pre", destino), codigo.join("\n"));
      } else if (!linha.trim()) {
        paragrafo = null; // a lista continua: itens separados por linha em branco seguem na mesma lista
      } else if ((m = linha.match(/^\s{0,3}(#{1,6})\s+(.*)/))) {
        fechar();
        inline(m[2], el(m[1].length <= 2 ? "h3" : "h4", destino));
      } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(linha)) {
        fechar();
        el("hr", destino);
      } else if (linha.trim().startsWith("|")) {
        fechar();
        const bloco = [];
        for (; i < linhas.length && linhas[i].trim().startsWith("|"); i++) bloco.push(linhas[i]);
        i--;
        tabela(bloco, destino);
      } else if ((m = linha.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)/))) {
        const tipo = m[1] ? "ol" : "ul";
        if (!lista || lista.localName !== tipo) { paragrafo = null; lista = el(tipo, destino); }
        inline(m[2], el("li", lista));
      } else {
        lista = null;
        if (!paragrafo) paragrafo = el("p", destino);
        else paragrafo.append(document.createElement("br"));
        inline(linha.trim(), paragrafo);
      }
    }
  };
})();
