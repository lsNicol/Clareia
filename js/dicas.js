// dicas (balão com setinha) em todo botão só de ícone
const dica = document.createElement("div");
dica.className = "dica";
dica.setAttribute("role", "tooltip");
dica.hidden = true;
document.body.append(dica);
const OPOSTO = { top: "bottom", bottom: "top", left: "right", right: "left" };
let alvoDica = null;

export function esconderDica() { dica.hidden = true; alvoDica = null; }
function mostrarDica(el) {
  const texto = el.dataset.tip;
  if (!texto || alvoDica === el) return;
  alvoDica = el;
  dica.textContent = texto;
  dica.hidden = false;
  const r = el.getBoundingClientRect();
  const d = dica.getBoundingClientRect();
  const FOLGA = 10, M = 6;
  let pos = el.dataset.tipPos || "bottom";
  const cabe = {
    top: r.top - d.height - FOLGA >= M,
    bottom: r.bottom + d.height + FOLGA <= innerHeight - M,
    left: r.left - d.width - FOLGA >= M,
    right: r.right + d.width + FOLGA <= innerWidth - M,
  };
  if (!cabe[pos] && cabe[OPOSTO[pos]]) pos = OPOSTO[pos];
  let x, y;
  if (pos === "top" || pos === "bottom") {
    x = Math.min(innerWidth - d.width - M, Math.max(M, r.left + r.width / 2 - d.width / 2));
    y = pos === "top" ? r.top - d.height - FOLGA : r.bottom + FOLGA;
    dica.style.setProperty("--seta", `${r.left + r.width / 2 - x}px`);
  } else {
    y = Math.min(innerHeight - d.height - M, Math.max(M, r.top + r.height / 2 - d.height / 2));
    x = pos === "left" ? r.left - d.width - FOLGA : r.right + FOLGA;
    dica.style.setProperty("--seta", `${r.top + r.height / 2 - y}px`);
  }
  dica.dataset.pos = pos;
  dica.style.left = `${x}px`;
  dica.style.top = `${y}px`;
}
// o texto vem de data-tip, ou de title/aria-label dos botões (title nativo atrapalharia)
function alvoComDica(e) {
  const el = e.target.closest?.("[data-tip], button[title], button[aria-label]");
  if (!el || el.closest(".menu-chat")) return null;
  if (!el.dataset.tip) {
    const t = el.getAttribute("title") || el.getAttribute("aria-label");
    if (!t) return null;
    el.dataset.tip = t;
    el.removeAttribute("title");
  }
  return el;
}
document.addEventListener("pointerover", (e) => {
  if (e.pointerType === "touch") return;
  const el = alvoComDica(e);
  if (el) mostrarDica(el); else esconderDica();
});
document.addEventListener("focusin", (e) => {
  const el = alvoComDica(e);
  if (el && el.matches(":focus-visible")) mostrarDica(el); else esconderDica();
});
document.addEventListener("pointerdown", esconderDica);
document.addEventListener("focusout", esconderDica);
document.addEventListener("scroll", esconderDica, true);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") esconderDica(); });
