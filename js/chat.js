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
      const dados = await resp.json();
      if (resp.ok) {
        resposta.classList.add("md");
        renderMarkdown(dados.resposta, resposta);
      } else {
        resposta.textContent = dados.erro;
      }
    } catch {
      resposta.textContent = "Não consegui falar com o assistente agora. Tente de novo em instantes.";
    }
    resposta.classList.remove("pensando");
    mensagens.scrollTop = mensagens.scrollHeight;
  });
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  return { mensagem, limpar, texto };
}
