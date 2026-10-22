(() => {
  const secao = document.querySelector('.como-funciona');
  if (!secao) return;

  secao.classList.add('com-js');
  const passos = [...secao.querySelectorAll('.passo')];
  const segmentos = [...secao.querySelectorAll('.trilho li')];
  const carrossel = secao.querySelector('.carrossel');
  const botaoPlay = secao.querySelector('.ctrl-play');
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)');
  let atual = 0;

  function ir(indice) {
    atual = (indice + passos.length) % passos.length;
    passos.forEach((passo, i) => {
      const aberto = i === atual;
      passo.classList.toggle('aberto', aberto);
      passo.querySelector('.passo-botao').setAttribute('aria-expanded', aberto);
      passo.querySelector('.passo-texto').hidden = !aberto;
    });
    segmentos.forEach((seg, i) => {
      seg.classList.remove('feito', 'ativo');
      // reflow para a barra de progresso reiniciar mesmo quando o passo se repete
      void seg.offsetWidth;
      seg.classList.toggle('feito', i < atual);
      seg.classList.toggle('ativo', i === atual);
    });
  }

  function pausar(pausado) {
    secao.classList.toggle('pausado', pausado);
    botaoPlay.setAttribute('aria-pressed', pausado);
    botaoPlay.setAttribute('aria-label',
      pausado ? 'Retomar a troca automática' : 'Pausar a troca automática');
  }

  passos.forEach((passo, i) => {
    passo.style.setProperty('--i', i);
    // botão real dentro do título (sem JS o título fica como texto)
    const titulo = passo.querySelector('.passo-titulo');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'passo-botao';
    botao.setAttribute('aria-controls', passo.querySelector('.passo-texto').id);
    botao.append(...titulo.childNodes);
    titulo.append(botao);
    botao.addEventListener('click', () => {
      ir(i);
    });
  });

  carrossel.hidden = false;
  secao.querySelector('.ctrl-ant').addEventListener('click', () => ir(atual - 1));
  secao.querySelector('.ctrl-prox').addEventListener('click', () => ir(atual + 1));
  botaoPlay.addEventListener('click', () => pausar(!secao.classList.contains('pausado')));

  // a barra de progresso é o temporizador: ao terminar, passa para o próximo
  secao.querySelector('.trilho').addEventListener('animationend', () => ir(atual + 1));

  ir(0);
  // quem pediu menos movimento não recebe troca automática
  pausar(semMovimento.matches);

  // só roda o tempo enquanto a seção está na tela
  if (!('IntersectionObserver' in window)) {
    passos.forEach((passo) => passo.classList.add('visivel'));
    secao.classList.add('na-tela');
    return;
  }
  new IntersectionObserver((entradas) => {
    secao.classList.toggle('na-tela', entradas[0].isIntersecting);
  }, { threshold: 0.4 }).observe(secao);

  // animação de entrada: uma vez, quando o passo aparece
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.2 });
  passos.forEach((passo) => observador.observe(passo));
})();
