// Chat: mensagens na tela, envio da pergunta e resposta da IA.
// O resto da página só usa o que este módulo devolve (mensagem, limpar, texto),
// nunca mexe em #mensagens direto. Trocar por React = reescrever só este arquivo.
export function iniciarChat({ obterFatura }) {
  const mensagens = document.getElementById("mensagens");
  const form = document.getElementById("form-chat");
  const campo = document.getElementById("pergunta");

  function mensagem(texto, quem) {
    const el = document.createElement("div");
    el.className = `msg ${quem}`;
    el.textContent = texto;
    mensagens.append(el);
    mensagens.scrollTop = mensagens.scrollHeight;
    return el;
  }

  function limpar() {
    mensagens.replaceChildren();
  }

  // a conversa inteira em texto puro (para baixar e compartilhar)
  function texto() {
    return [...mensagens.children].map((m) =>
      `${m.classList.contains("eu") ? "Você" : "ClareIA"}: ${m.innerText}`).join("\n\n");
  }

  // lê a resposta linha a linha (um JSON por linha) conforme o servidor envia
  async function* linhas(corpo) {
    const leitor = corpo.pipeThrough(new TextDecoderStream()).getReader();
    let resto = "";
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) return;
      const partes = (resto + value).split("\n");
      resto = partes.pop(); // a última pode ter chegado pela metade
      for (const parte of partes) yield JSON.parse(parte);
    }
  }

  // redesenha a resposta a cada pedaço; só rola se a pessoa já estava no fim
  function atualizar(el, desenhar) {
    const noFim = mensagens.scrollHeight - mensagens.scrollTop - mensagens.clientHeight < 40;
    desenhar();
    el.classList.remove("pensando");
    if (noFim) mensagens.scrollTop = mensagens.scrollHeight;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pergunta = campo.value.trim();
    if (!pergunta) return;
    campo.value = "";
    mensagem(pergunta, "eu");
    const fatura = obterFatura();
    if (!fatura) {
      mensagem("Envie uma fatura na página inicial para eu poder ajudar.", "ia");
      return;
    }
    const resposta = mensagem("Pensando", "ia");
    resposta.classList.add("pensando");
    const pontos = document.createElement("span");
    pontos.className = "pontos";
    pontos.append(...[0, 1, 2].map(() => document.createElement("i")));
    resposta.append(pontos);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, fatura }),
      });
      if (!resp.ok) {
        const { erro } = await resp.json();
        atualizar(resposta, () => resposta.textContent = erro);
        return;
      }
      let texto = "";
      for await (const { parte, erro } of linhas(resp.body)) {
        if (erro) texto += `\n\n_${erro}_`;
        else texto += parte;
        atualizar(resposta, () => {
          resposta.classList.add("md");
          renderMarkdown(texto, resposta);
        });
      }
      if (!texto) throw new Error("resposta vazia");
    } catch {
      atualizar(resposta, () =>
        resposta.textContent = "Não consegui falar com o assistente agora. Tente de novo em instantes.");
    }
  });
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  return { mensagem, limpar, texto };
}
