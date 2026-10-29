// Leitor de PDF próprio (PDF.js): páginas em canvas + camada de texto,
// com a barra flutuante de zoom, página, download e busca.
const leitorPdf = (() => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/vendor/pdf.worker.min.js";

  const ZOOM_MIN = 0.5, ZOOM_MAX = 4, ZOOM_PASSO = 0.25;
  const normalizar = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  async function abrir(arquivo) {
    const $ = (id) => document.getElementById(id);
    const visor = $("visor"), ferramentas = $("ferramentas"), busca = $("busca");
    const campoPagina = $("pagina-atual"), campoTermo = $("termo");

    const doc = await pdfjsLib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
    $("total-paginas").textContent = doc.numPages;
    campoPagina.max = doc.numPages;
    visor.hidden = ferramentas.hidden = false;

    let zoom = 1;          // 1 = ajustado à largura do visor
    let paginas = [];      // { el, canvas, camada, num, divs, pronto, escala }
    let termo = "";
    let achados = [];      // { pagina, indice }
    let atual = -1;

    const primeira = await doc.getPage(1);
    const larguraBase = primeira.getViewport({ scale: 1 }).width;
    const escalaAjustada = () => Math.max(0.3, (visor.clientWidth - 32) / larguraBase);

    // ---- layout: cada página ganha o tamanho final já na criação; o desenho é preguiçoso
    async function montar() {
      const escala = escalaAjustada() * zoom;
      const fracao = visor.scrollHeight > visor.clientHeight
        ? visor.scrollTop / visor.scrollHeight : 0;
      visor.replaceChildren();
      paginas = [];
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale: escala });
        const el = document.createElement("div");
        el.className = "pagina";
        el.style.width = `${vp.width}px`;
        el.style.height = `${vp.height}px`;
        el.style.setProperty("--scale-factor", escala);
        visor.append(el);
        paginas.push({ el, page, vp, num: n, pronto: null });
        observador.observe(el);
      }
      visor.scrollTop = fracao * visor.scrollHeight;
      atualizarPagina();
    }

    function desenhar(p) {
      if (p.pronto) return p.pronto;
      p.pronto = (async () => {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(p.vp.width * dpr);
        canvas.height = Math.floor(p.vp.height * dpr);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        const camada = document.createElement("div");
        camada.className = "textLayer";
        p.el.append(canvas, camada);

        await p.page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: p.vp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        }).promise;

        p.divs = [];
        await pdfjsLib.renderTextLayer({
          textContentSource: await p.page.getTextContent(),
          container: camada,
          viewport: p.vp,
          textDivs: p.divs,
        }).promise;
        destacar(p);
      })();
      return p.pronto;
    }

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        const p = paginas.find((x) => x.el === e.target);
        if (p) desenhar(p);
      });
    }, { root: visor, rootMargin: "600px 0px" });

    // ---- zoom
    function definirZoom(novo) {
      novo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novo));
      if (novo === zoom) return;
      zoom = novo;
      montar();
    }
    $("zoom-mais").addEventListener("click", () => definirZoom(zoom + ZOOM_PASSO));
    $("zoom-menos").addEventListener("click", () => definirZoom(zoom - ZOOM_PASSO));
    $("zoom-ajustar").addEventListener("click", () => definirZoom(1));

    // refaz quando o painel muda de largura (divisor, modos, sidebar)
    let larguraVisor = visor.clientWidth, quadro = 0;
    new ResizeObserver(() => {
      if (!visor.clientWidth || visor.clientWidth === larguraVisor) return;
      larguraVisor = visor.clientWidth;
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(montar);
    }).observe(visor);

    // ---- página atual
    function atualizarPagina() {
      if (document.activeElement === campoPagina) return;
      const ref = visor.scrollTop + visor.clientHeight / 3;
      const p = paginas.find((x) => x.el.offsetTop + x.el.offsetHeight > ref) || paginas.at(-1);
      if (p) campoPagina.value = p.num;
    }
    visor.addEventListener("scroll", atualizarPagina, { passive: true });
    campoPagina.addEventListener("change", () => {
      const n = Math.min(doc.numPages, Math.max(1, parseInt(campoPagina.value, 10) || 1));
      campoPagina.value = n;
      paginas[n - 1].el.scrollIntoView({ block: "start" });
      campoPagina.blur();
    });

    // ---- download
    $("baixar").addEventListener("click", () => {
      const url = URL.createObjectURL(arquivo);
      const a = Object.assign(document.createElement("a"), { href: url, download: arquivo.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // ---- busca (por trecho de texto do PDF, sem acento e sem diferenciar maiúscula)
    const textos = []; // por página: lista de strings normalizadas
    async function textoDaPagina(n) {
      if (!textos[n]) {
        const conteudo = await (await doc.getPage(n)).getTextContent();
        textos[n] = conteudo.items.map((i) => normalizar(i.str));
      }
      return textos[n];
    }

    function destacar(p) {
      if (!p.divs) return;
      p.divs.forEach((d, i) => {
        const a = achados.findIndex((x) => x.pagina === p.num && x.indice === i);
        d.classList.toggle("achado", a !== -1);
        d.classList.toggle("atual", a !== -1 && a === atual);
      });
    }

    async function buscar() {
      termo = normalizar(campoTermo.value.trim());
      achados = [];
      atual = -1;
      if (termo) {
        for (let n = 1; n <= doc.numPages; n++) {
          (await textoDaPagina(n)).forEach((t, i) => {
            if (t.includes(termo)) achados.push({ pagina: n, indice: i });
          });
        }
      }
      paginas.forEach(destacar);
      if (achados.length) await ir(0); else conta();
    }

    function conta() {
      $("busca-conta").textContent = !termo ? ""
        : achados.length ? `${atual + 1}/${achados.length}` : "0 resultados";
    }

    async function ir(i) {
      if (!achados.length) return;
      atual = (i + achados.length) % achados.length;
      const alvo = achados[atual];
      const p = paginas[alvo.pagina - 1];
      await desenhar(p);
      paginas.forEach(destacar);
      p.divs[alvo.indice]?.scrollIntoView({ block: "center", inline: "nearest" });
      conta();
    }

    const abrirBusca = (abrir) => {
      busca.hidden = !abrir;
      $("abrir-busca").setAttribute("aria-expanded", abrir);
      if (abrir) campoTermo.focus();
      else { campoTermo.value = ""; buscar(); }
    };
    $("abrir-busca").addEventListener("click", () => abrirBusca(busca.hidden));
    busca.addEventListener("submit", (e) => {
      e.preventDefault();
      if (achados.length && normalizar(campoTermo.value.trim()) === termo) ir(atual + 1);
      else buscar();
    });
    campoTermo.addEventListener("input", () => { clearTimeout(campoTermo.t); campoTermo.t = setTimeout(buscar, 250); });
    campoTermo.addEventListener("keydown", (e) => { if (e.key === "Escape") abrirBusca(false); });
    $("busca-prox").addEventListener("click", () => ir(atual + 1));
    $("busca-ant").addEventListener("click", () => ir(atual - 1));

    await montar();
  }

  return { abrir };
})();
