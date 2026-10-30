import { esconderDica } from "./dicas.js";

const sidebar = document.getElementById("sidebar");
const fundo = document.getElementById("fundo-sidebar");
const botaoSidebar = document.getElementById("alternar-sidebar");
const estreita = matchMedia("(max-width: 800px)");

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

// ---- sidebar
export function aplicarSidebar(aberta, animar = true) {
  if (animar && aberta && sidebar.classList.contains("fechada")) {
    sidebar.classList.add("abrindo");
    setTimeout(() => sidebar.classList.remove("abrindo"), 300);
  }
  sidebar.classList.toggle("fechada", !aberta);
  fundo.hidden = !(aberta && estreita.matches);
  botaoSidebar.setAttribute("aria-expanded", aberta);
  botaoSidebar.setAttribute("aria-label", aberta ? "Ocultar barra lateral" : "Mostrar barra lateral");
  delete botaoSidebar.dataset.tip; // o texto da dica muda com o estado
  // fechada vira uma faixa de ícones; clicar num deles reabre
  sidebar.querySelectorAll("h2").forEach((h) => {
    if (aberta) { h.removeAttribute("tabindex"); h.removeAttribute("role"); }
    else { h.tabIndex = 0; h.setAttribute("role", "button"); }
  });
  esconderDica();
}
sidebar.querySelectorAll("h2").forEach((h) => {
  const abrir = () => { if (sidebar.classList.contains("fechada")) aplicarSidebar(true); };
  h.addEventListener("click", abrir);
  h.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); }
  });
});
botaoSidebar.addEventListener("click", () =>
  aplicarSidebar(sidebar.classList.contains("fechada")));
fundo.addEventListener("click", () => aplicarSidebar(false));

// ---- largura da sidebar: arrastar o divisor (mouse, toque e teclado)
const espaco = sidebar.parentElement;
const divisorSidebar = document.getElementById("divisor-sidebar");
const LARG_MIN = 200, LARG_MAX = 480, ABRIR_EM = 120, FECHAR_EM = 100;
export function definirLargura(px) {
  px = Math.round(Math.min(LARG_MAX, Math.max(LARG_MIN, px)));
  espaco.style.setProperty("--sidebar-w", `${px}px`);
  divisorSidebar.setAttribute("aria-valuenow", px);
  return px;
}
const larguraSalva = parseFloat(ler("clareia:sidebar"));
if (larguraSalva) definirLargura(larguraSalva);
const soltarSidebar = () => {
  espaco.classList.remove("arrastando");
  guardar("clareia:sidebar", parseInt(espaco.style.getPropertyValue("--sidebar-w"), 10) || 272);
};
// durante o arrastar a sidebar assume qualquer largura (da faixa até o máximo);
// ao soltar ela encaixa: faixa, ou no mínimo aberta
const LARG_FAIXA = 58, LIMIAR = 130;
let larguraArraste = null;
divisorSidebar.addEventListener("pointerdown", (e) => {
  divisorSidebar.setPointerCapture(e.pointerId);
  espaco.classList.add("arrastando");
  larguraArraste = sidebar.getBoundingClientRect().width;
});
divisorSidebar.addEventListener("pointermove", (e) => {
  if (!divisorSidebar.hasPointerCapture(e.pointerId)) return;
  const original = parseInt(espaco.style.getPropertyValue("--sidebar-w"), 10) || 272;
  larguraArraste = Math.min(LARG_MAX, Math.max(LARG_FAIXA, e.clientX - sidebar.getBoundingClientRect().left));
  sidebar.style.width = `${larguraArraste}px`;
  aplicarSidebar(larguraArraste >= LIMIAR, false);
  // meio opaco enquanto menor que o tamanho original e ainda seguro
  sidebar.classList.toggle("meio", larguraArraste < original);
});
const soltarArraste = () => {
  if (larguraArraste === null) return;
  const larg = larguraArraste;
  larguraArraste = null;
  sidebar.classList.remove("meio");
  sidebar.style.removeProperty("width"); // volta a largura final, animada
  if (larg < LIMIAR) { aplicarSidebar(false, false); espaco.classList.remove("arrastando"); return; }
  definirLargura(larg);
  soltarSidebar();
};
divisorSidebar.addEventListener("pointerup", soltarArraste);
divisorSidebar.addEventListener("pointercancel", soltarArraste);
divisorSidebar.addEventListener("dblclick", () => {
  aplicarSidebar(true);
  definirLargura(272);
  soltarSidebar();
});
divisorSidebar.addEventListener("keydown", (e) => {
  const passo = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0;
  if (!passo) return;
  e.preventDefault();
  const larg = sidebar.getBoundingClientRect().width;
  if (sidebar.classList.contains("fechada")) {
    if (passo > 0) { aplicarSidebar(true); definirLargura(LARG_MIN); soltarSidebar(); }
    return;
  }
  if (passo < 0 && larg <= LARG_MIN) { aplicarSidebar(false); return; }
  definirLargura(larg + passo);
  soltarSidebar();
});


