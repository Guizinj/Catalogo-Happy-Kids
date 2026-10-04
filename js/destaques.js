const INTERVALO_AUTOMATICO = 3000;
const INDICE_INICIAL = 1;

function aguardarImagem(imagem) {
  if (imagem.complete) return Promise.resolve(imagem.naturalWidth > 0);

  return new Promise((resolve) => {
    imagem.addEventListener('load', () => resolve(true), { once: true });
    imagem.addEventListener('error', () => resolve(false), { once: true });
  });
}

export async function configurarDestaques() {
  const telaMobile = window.matchMedia('(max-width: 760px)');
  if (!telaMobile.matches) {
    function iniciarAoEntrarNoMobile(evento) {
      if (!evento.matches) return;
      telaMobile.removeEventListener('change', iniciarAoEntrarNoMobile);
      configurarDestaques();
    }
    telaMobile.addEventListener('change', iniciarAoEntrarNoMobile);
    return;
  }

  const secao = document.querySelector('.destaques');
  const faixa = document.getElementById('destaques-faixa');
  if (!secao || !faixa) return;

  const slidesOriginais = [...faixa.querySelectorAll('.destaques-slide')];
  const imagens = slidesOriginais.map((slide) => slide.querySelector('img'));
  const pontos = [...secao.querySelectorAll('.destaques-pontos button')];
  const loader = document.getElementById('loader-overlay');
  const imagemInicial = imagens[INDICE_INICIAL];
  if (!imagemInicial || slidesOriginais.length < 2) return;
  imagemInicial.loading = 'eager';
  if (!(await aguardarImagem(imagemInicial))) return;

  const cloneUltimo = slidesOriginais.at(-1).cloneNode(true);
  const clonePrimeiro = slidesOriginais[0].cloneNode(true);
  cloneUltimo.setAttribute('aria-hidden', 'true');
  clonePrimeiro.setAttribute('aria-hidden', 'true');
  cloneUltimo.querySelector('img').loading = 'eager';
  clonePrimeiro.querySelector('img').loading = 'eager';
  faixa.prepend(cloneUltimo);
  faixa.append(clonePrimeiro);
  const slides = [...faixa.querySelectorAll('.destaques-slide')];

  secao.hidden = false;
  let indiceAtual = INDICE_INICIAL;
  let temporizador;
  let mouseSobre = false;
  let focoDentro = false;
  let visivel = true;
  let quadroDeRolagem;
  let ajustePendente;
  let toqueAtivo = false;

  function atualizarPontos() {
    pontos.forEach((ponto, indice) => {
      if (indice === indiceAtual) ponto.setAttribute('aria-current', 'true');
      else ponto.removeAttribute('aria-current');
    });
  }

  function mostrar(indice) {
    const origem = indiceAtual;
    indiceAtual = (indice + imagens.length) % imagens.length;
    let indiceFisico = indiceAtual + 1;
    if (origem === imagens.length - 1 && indiceAtual === 0) indiceFisico = slides.length - 1;
    if (origem === 0 && indiceAtual === imagens.length - 1) indiceFisico = 0;
    const slide = slides[indiceFisico];
    faixa.scrollTo({
      left: posicaoDoSlide(slide),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    atualizarPontos();
  }

  function posicaoDoSlide(slide) {
    return slide.offsetLeft - (faixa.clientWidth - slide.offsetWidth) / 2;
  }

  function indiceFisicoMaisProximo() {
    const centro = faixa.scrollLeft + faixa.clientWidth / 2;
    return slides.reduce((maisProximo, slide, indice) => {
      const distancia = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - centro);
      const distanciaAnterior = Math.abs(
        slides[maisProximo].offsetLeft + slides[maisProximo].offsetWidth / 2 - centro
      );
      return distancia < distanciaAnterior ? indice : maisProximo;
    }, 0);
  }

  function irSemAnimacao(indiceFisico) {
    faixa.style.scrollSnapType = 'none';
    faixa.style.scrollBehavior = 'auto';
    faixa.scrollLeft = posicaoDoSlide(slides[indiceFisico]);
    requestAnimationFrame(() => {
      faixa.style.scrollSnapType = '';
      faixa.style.scrollBehavior = '';
    });
  }

  function ajustarExtremidades() {
    clearTimeout(ajustePendente);
    if (toqueAtivo) return;
    const indiceFisico = indiceFisicoMaisProximo();
    if (indiceFisico === 0) irSemAnimacao(imagens.length);
    if (indiceFisico === slides.length - 1) irSemAnimacao(1);
  }

  function parar() {
    clearInterval(temporizador);
    temporizador = undefined;
  }

  function iniciar() {
    parar();
    if (
      mouseSobre ||
      focoDentro ||
      !visivel ||
      document.hidden ||
      (loader?.isConnected && !loader.classList.contains('oculto')) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    temporizador = setInterval(() => mostrar(indiceAtual + 1), INTERVALO_AUTOMATICO);
  }

  secao.querySelector('.destaques-anterior').addEventListener('click', () => {
    mostrar(indiceAtual - 1);
    iniciar();
  });
  secao.querySelector('.destaques-proximo').addEventListener('click', () => {
    mostrar(indiceAtual + 1);
    iniciar();
  });
  pontos.forEach((ponto, indice) => {
    ponto.addEventListener('click', () => {
      mostrar(indice);
      iniciar();
    });
  });

  irSemAnimacao(indiceAtual + 1);
  atualizarPontos();

  faixa.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(quadroDeRolagem);
      quadroDeRolagem = requestAnimationFrame(() => {
        const indiceFisico = indiceFisicoMaisProximo();
        indiceAtual = (indiceFisico - 1 + imagens.length) % imagens.length;
        atualizarPontos();
      });
      clearTimeout(ajustePendente);
      ajustePendente = setTimeout(ajustarExtremidades, 140);
    },
    { passive: true }
  );
  faixa.addEventListener('scrollend', ajustarExtremidades);

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    secao.addEventListener('mouseenter', () => {
      mouseSobre = true;
      parar();
    });
    secao.addEventListener('mouseleave', () => {
      mouseSobre = false;
      iniciar();
    });
  }
  faixa.addEventListener(
    'touchstart',
    () => {
      toqueAtivo = true;
      parar();
    },
    { passive: true }
  );
  function finalizarToque() {
    toqueAtivo = false;
    clearTimeout(ajustePendente);
    ajustePendente = setTimeout(ajustarExtremidades, 140);
    iniciar();
  }
  faixa.addEventListener('touchend', finalizarToque, { passive: true });
  faixa.addEventListener('touchcancel', finalizarToque, { passive: true });
  secao.addEventListener('focusin', () => {
    focoDentro = true;
    parar();
  });
  secao.addEventListener('focusout', (evento) => {
    if (secao.contains(evento.relatedTarget)) return;
    focoDentro = false;
    iniciar();
  });
  document.addEventListener('visibilitychange', iniciar);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', iniciar);
  window.addEventListener('resize', () => irSemAnimacao(indiceAtual + 1));
  if (loader?.isConnected && !loader.classList.contains('oculto')) {
    const observadorDoLoader = new MutationObserver(() => {
      if (!loader.classList.contains('oculto')) return;
      observadorDoLoader.disconnect();
      iniciar();
    });
    observadorDoLoader.observe(loader, { attributes: true, attributeFilter: ['class'] });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting;
        iniciar();
      },
      { threshold: 0.2 }
    ).observe(secao);
  }
  iniciar();
}
