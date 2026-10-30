import { esconderDica } from "./dicas.js";
import { aplicarSidebar, definirLargura } from "./sidebar.js";
import { iniciarChat } from "./chat.js";

(() => {
  const split = document.getElementById("split");
  const divisor = document.getElementById("divisor");
  const sidebar = document.getElementById("sidebar");
  const fundo = document.getElementById("fundo-sidebar");
  const botaoSidebar = document.getElementById("alternar-sidebar");
  const botoesModo = [...document.querySelectorAll(".modos [data-modo]")];
  const estreita = matchMedia("(max-width: 800px)");
  const MIN = 20, MAX = 80;

  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const reais = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ---- modo: só PDF / PDF e chat / só chat
  let modo = ler("clareia:modo") || "ambos";
  function aplicarModo() {
    // em tela estreita não cabem os dois lado a lado
    const efetivo = estreita.matches && modo === "ambos" ? "chat" : modo;
    split.dataset.modo = efetivo;
    botoesModo.forEach((b) => b.setAttribute("aria-pressed", b.dataset.modo === efetivo));
  }
  botoesModo.forEach((b) => b.addEventListener("click", () => {
    modo = b.dataset.modo;
    guardar("clareia:modo", modo);
    aplicarModo();
  }));
  estreita.addEventListener("change", () => { aplicarModo(); aplicarSidebar(!estreita.matches); });

  // ---- divisor arrastável entre PDF e chat (mouse, toque e teclado)
  function definirDivisao(pct) {
    pct = Math.min(MAX, Math.max(MIN, pct));
    split.style.setProperty("--divisao", pct);
    divisor.setAttribute("aria-valuenow", Math.round(pct));
    return pct;
  }
  const salva = parseFloat(ler("clareia:divisao"));
  if (salva) definirDivisao(salva);

  divisor.addEventListener("pointerdown", (e) => {
    divisor.setPointerCapture(e.pointerId);
    split.classList.add("arrastando");
  });
  divisor.addEventListener("pointermove", (e) => {
    if (!divisor.hasPointerCapture(e.pointerId)) return;
    const r = split.getBoundingClientRect();
    definirDivisao(((e.clientX - r.left) / r.width) * 100);
  });
  const soltar = () => {
    split.classList.remove("arrastando");
    guardar("clareia:divisao", split.style.getPropertyValue("--divisao"));
  };
  divisor.addEventListener("pointerup", soltar);
  divisor.addEventListener("pointercancel", soltar);
  divisor.addEventListener("dblclick", () => { definirDivisao(55); soltar(); });
  divisor.addEventListener("keydown", (e) => {
    const passo = e.key === "ArrowLeft" ? -2 : e.key === "ArrowRight" ? 2 : 0;
    if (!passo) return;
    e.preventDefault();
    definirDivisao(parseFloat(split.style.getPropertyValue("--divisao") || 55) + passo);
    soltar();
  });

  // ---- chat (o resto da página só fala com ele por essa API)
  const conversa = iniciarChat({ obterFatura: () => fatura });

  // ---- ferramentas da sidebar (usam só os dados já extraídos, sem backend)
  let fatura = null;
  const nomeItens = () => fatura.itens.filter((i) => !i.descricao.startsWith("TOTAL"));
  const kwh = (n) => `${n.toLocaleString("pt-BR")} kWh`;

  const respostas = {
    resumir: ["Resumir fatura", () => {
      const total = fatura.itens.find((i) => i.descricao.startsWith("TOTAL"));
      const maior = nomeItens().reduce((a, b) => (b.valor > a.valor ? b : a));
      return [
        `Unidade consumidora: ${fatura.uc}`,
        total ? `Total da fatura: ${reais(total.valor)}` : null,
        `Saldo de geração: ${kwh(fatura.saldo_geracao_kwh)}`,
        `Maior cobrança: ${maior.descricao} (${reais(maior.valor)})`,
      ].filter(Boolean).join("\n");
    }],
    itens: ["Explicar itens", () =>
      nomeItens().map((i) => `• ${i.descricao}: ${reais(i.valor)}`).join("\n")],
    consumo: ["Consumo mensal", () => {
      const h = fatura.historico;
      if (!h || !h.length) return "Não encontrei o histórico de consumo nessa fatura.";
      const media = h.reduce((s, m) => s + m.kwh, 0) / h.length;
      return h.map((m) => `• ${m.mes}: ${kwh(m.kwh)} (${m.media_dia.toLocaleString("pt-BR")} kWh/dia)`).join("\n")
        + `\n\nMédia dos ${h.length} meses: ${kwh(Math.round(media))}`;
    }],
  };

  function baixarConversa() {
    const url = URL.createObjectURL(new Blob([conversa.texto()], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "conversa-clareia.txt" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saudacao() {
    conversa.mensagem(fatura
      ? "Oi! Li a sua fatura. Use as ferramentas ao lado ou pergunte o que quiser sobre ela."
      : "Envie uma fatura na página inicial para eu poder ajudar.", "ia");
  }

  document.querySelectorAll(".ferr-lista button").forEach((botao) => {
    botao.addEventListener("click", () => {
      if (estreita.matches) aplicarSidebar(false);
      // os resumos aparecem no chat, então garante que ele esteja visível
      if (split.dataset.modo === "pdf") { modo = "chat"; aplicarModo(); }
      const [pergunta, gerar] = respostas[botao.dataset.acao];
      conversa.mensagem(pergunta, "eu");
      conversa.mensagem(fatura ? gerar() : "Ainda não tenho uma fatura para analisar.", "ia");
    });
  });

  // ---- chats e pastas (um chat por fatura; estado fica no localStorage)
  const lerJson = (k, padrao) => { try { return JSON.parse(ler(k)) ?? padrao; } catch { return padrao; } };
  let pastas = lerJson("clareia:pastas", []);
  let chat = null; // { nome, pasta }
  const salvarChat = () => guardar("clareia:chat", JSON.stringify(chat));
  const salvarPastas = () => guardar("clareia:pastas", JSON.stringify(pastas));

  const nomeArquivo = document.getElementById("nome-arquivo");
  const listaChats = document.getElementById("lista-faturas");
  const listaPastas = document.getElementById("lista-pastas");
  const ICONE_PASTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/></svg>';
  const ICONE_MAIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';

  function itemChat() {
    const item = document.createElement("li");
    const nome = document.createElement("span");
    nome.className = "chat-nome";
    nome.textContent = chat.nome;
    nome.title = chat.nome;
    const mais = document.createElement("button");
    mais.type = "button";
    mais.className = "chat-mais";
    mais.setAttribute("aria-label", "Opções do chat");
    mais.dataset.tipPos = "top";
    mais.setAttribute("aria-haspopup", "menu");
    mais.innerHTML = ICONE_MAIS;
    mais.addEventListener("click", () => abrirMenu(mais));
    item.append(nome, mais);
    return item;
  }
  nomeArquivo.addEventListener("click", () => abrirMenu(nomeArquivo));

  function desenhar() {
    fecharMenu();
    listaChats.replaceChildren();
    listaPastas.replaceChildren();
    if (!chat) return;
    nomeArquivo.querySelector(".arq-nome").textContent = chat.nome;
    nomeArquivo.disabled = false;
    if (!pastas.includes(chat.pasta)) chat.pasta = null;
    if (!chat.pasta) listaChats.append(itemChat());
    pastas.forEach((nome) => {
      const li = document.createElement("li");
      li.className = "pasta";
      const cab = document.createElement("div");
      cab.className = "pasta-cab";
      const abrir = document.createElement("button");
      abrir.type = "button";
      abrir.className = "pasta-nome";
      abrir.innerHTML = ICONE_PASTA;
      abrir.append(nome);
      const remover = document.createElement("button");
      remover.type = "button";
      remover.className = "pasta-remover";
      remover.setAttribute("aria-label", `Remover pasta ${nome}`);
      remover.title = "Remover pasta";
      remover.textContent = "×";
      remover.addEventListener("click", () => {
        pastas = pastas.filter((p) => p !== nome);
        salvarPastas();
        desenhar();
      });
      cab.append(abrir, remover);
      li.append(cab);
      if (chat.pasta === nome) {
        const ul = document.createElement("ul");
        ul.className = "lista-faturas";
        ul.append(itemChat());
        li.append(ul);
        abrir.addEventListener("click", () => ul.hidden = !ul.hidden);
      }
      listaPastas.append(li);
    });
  }

  // nova pasta: o botão vira um campo de texto
  const formPasta = document.getElementById("nova-pasta");
  const botaoPasta = document.getElementById("nova-pasta-botao");
  const campoPasta = document.getElementById("nova-pasta-nome");
  function pedirPasta() {
    botaoPasta.hidden = true;
    campoPasta.hidden = false;
    campoPasta.focus();
  }
  function fecharCampoPasta() {
    campoPasta.value = "";
    campoPasta.hidden = true;
    botaoPasta.hidden = false;
  }
  function criarPasta(nome) {
    nome = nome.trim();
    if (!nome) return null;
    if (!pastas.includes(nome)) { pastas.push(nome); salvarPastas(); }
    return nome;
  }
  botaoPasta.addEventListener("click", pedirPasta);
  formPasta.addEventListener("submit", (e) => {
    e.preventDefault();
    if (criarPasta(campoPasta.value)) desenhar();
    fecharCampoPasta();
  });
  campoPasta.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharCampoPasta(); });
  campoPasta.addEventListener("blur", () => { if (!campoPasta.value.trim()) fecharCampoPasta(); });

  // ---- menu dos três pontinhos: abre à direita do chat
  const menu = document.getElementById("menu-chat");
  const menuPastas = document.getElementById("menu-pastas");
  const botaoPastaMenu = menu.querySelector('[data-acao="pasta"]');
  let gatilho = null;

  function fecharMenu() {
    menu.hidden = true;
    menuPastas.hidden = true;
    botaoPastaMenu.setAttribute("aria-expanded", "false");
    gatilho?.closest("li")?.classList.remove("menu-aberto");
    gatilho = null;
  }
  function abrirMenu(botao) {
    const reaberto = gatilho === botao;
    fecharMenu();
    if (reaberto) return;
    gatilho = botao;
    const li = botao.closest("li");
    li?.classList.add("menu-aberto");
    const r = (li || botao).getBoundingClientRect();
    menu.hidden = false;
    // da sidebar abre à direita do chat; do header abre logo abaixo do nome
    const x = li ? r.right + 6 : r.left + r.width / 2 - menu.offsetWidth / 2;
    const cabe = x + menu.offsetWidth <= innerWidth - 8;
    menu.style.left = `${cabe ? Math.max(8, x) : Math.max(8, innerWidth - menu.offsetWidth - 8)}px`;
    const y = li ? r.top : r.bottom + 6;
    menu.style.top = `${Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8))}px`;
    menu.classList.toggle("sub-esq", x + menu.offsetWidth * 2 > innerWidth);
    menu.querySelector("button").focus();
  }

  function montarSubmenu() {
    menuPastas.replaceChildren();
    pastas.forEach((nome) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.dataset.pasta = nome;
      b.innerHTML = ICONE_PASTA;
      b.append(nome + (chat.pasta === nome ? " ✓" : ""));
      menuPastas.append(b);
    });
    if (chat.pasta) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.dataset.pasta = "";
      b.textContent = "Tirar da pasta";
      menuPastas.append(b);
    }
    const nova = document.createElement("button");
    nova.type = "button";
    nova.setAttribute("role", "menuitem");
    nova.dataset.nova = "1";
    nova.textContent = "+ Nova pasta";
    menuPastas.append(nova);
  }
  function alternarSubmenu(abrir) {
    if (abrir) montarSubmenu();
    menuPastas.hidden = !abrir;
    botaoPastaMenu.setAttribute("aria-expanded", abrir);
  }
  botaoPastaMenu.addEventListener("click", () => alternarSubmenu(menuPastas.hidden));
  botaoPastaMenu.parentElement.addEventListener("mouseenter", () => alternarSubmenu(true));
  botaoPastaMenu.parentElement.addEventListener("mouseleave", () => alternarSubmenu(false));
  menu.addEventListener("mouseover", (e) => {
    const b = e.target.closest(".menu-chat > button");
    if (b && b !== botaoPastaMenu && !menuPastas.hidden) alternarSubmenu(false);
  });

  menuPastas.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.nova) {
      const nome = criarPasta(prompt("Nome da nova pasta:") || "");
      if (!nome) return;
      chat.pasta = nome;
    } else {
      chat.pasta = b.dataset.pasta || null;
    }
    salvarChat();
    desenhar();
  });

  // renomear abre um <dialog> modal: showModal() centraliza e escurece o fundo (::backdrop)
  const modal = document.getElementById("modal-renomear");
  const campoRenomear = document.getElementById("campo-renomear");
  function renomear() {
    fecharMenu();
    campoRenomear.value = chat.nome;
    modal.showModal();
    campoRenomear.select();
  }
  document.getElementById("form-renomear").addEventListener("submit", () => {
    const nome = campoRenomear.value.trim();
    if (nome) { chat.nome = nome; salvarChat(); desenhar(); }
  });
  modal.querySelector(".modal-cancelar").addEventListener("click", () => modal.close());
  // clicar no escurecido (fora da caixa) também fecha
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  const aviso = document.createElement("div");
  aviso.className = "aviso";
  aviso.setAttribute("role", "status");
  document.body.append(aviso);
  let tempoAviso;
  function avisar(texto) {
    aviso.textContent = texto;
    aviso.classList.add("visivel");
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(() => aviso.classList.remove("visivel"), 2400);
  }

  async function compartilhar() {
    const texto = conversa.texto();
    try {
      if (navigator.share) { await navigator.share({ title: chat.nome, text: texto }); return; }
      await navigator.clipboard.writeText(texto);
      avisar("Conversa copiada para a área de transferência");
    } catch (e) {
      if (e.name !== "AbortError") avisar("Não consegui compartilhar a conversa");
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${chat.nome}"? A fatura e a conversa serão removidas deste navegador.`)) return;
    try { await faturaStore.apagar(); } catch {}
    try { localStorage.removeItem("clareia:chat"); } catch {}
    location.reload();
  }

  menu.addEventListener("click", (e) => {
    const acao = e.target.closest("[data-acao]")?.dataset.acao;
    if (!acao || acao === "pasta") return;
    if (acao === "renomear") { renomear(); return; }
    fecharMenu();
    if (estreita.matches) aplicarSidebar(false);
    if (acao === "limpar") { conversa.limpar(); saudacao(); }
    else if (acao === "baixar") baixarConversa();
    else if (acao === "compartilhar") compartilhar();
    else if (acao === "excluir") excluir();
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest(".chat-mais, #nome-arquivo")) fecharMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) { const g = gatilho; fecharMenu(); g?.focus(); }
  });
  document.querySelector(".sidebar-rolagem").addEventListener("scroll", fecharMenu);
  addEventListener("resize", fecharMenu);

  async function carregar() {
    let guardado = null;
    try { guardado = await faturaStore.ler(); } catch {}
    if (!guardado) { saudacao(); return; }
    fatura = guardado.dados;
    document.getElementById("pdf-vazio").hidden = true;
    leitorPdf.abrir(guardado.arquivo).catch(() => {
      document.getElementById("pdf-vazio").hidden = false;
      document.getElementById("pdf-vazio").textContent = "Não consegui mostrar o PDF.";
    });
    const salvo = lerJson("clareia:chat", null);
    chat = { nome: salvo?.nome || guardado.arquivo.name, pasta: salvo?.pasta || null };
    desenhar();
    saudacao();
  }

  aplicarModo();
  aplicarSidebar(!estreita.matches);
  carregar();
})();
