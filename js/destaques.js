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

  const imagens = [...faixa.querySelectorAll('img')];
  const slides = [...faixa.querySelectorAll('.destaques-slide')];
  const pontos = [...secao.querySelectorAll('.destaques-pontos button')];
  const loader = document.getElementById('loader-overlay');
  const imagensIniciais = imagens.slice(0, INDICE_INICIAL + 1);
  imagensIniciais.forEach((imagem) => {
    imagem.loading = 'eager';
  });
  if (!imagens.length || (await Promise.all(imagensIniciais.map(aguardarImagem))).includes(false)) return;

  secao.hidden = false;
  let indiceAtual = INDICE_INICIAL;
  let temporizador;
  let mouseSobre = false;
  let focoDentro = false;
  let visivel = true;
  let quadroDeRolagem;

  function atualizarPontos() {
    pontos.forEach((ponto, indice) => {
      if (indice === indiceAtual) ponto.setAttribute('aria-current', 'true');
      else ponto.removeAttribute('aria-current');
    });
  }

  function mostrar(indice) {
    indiceAtual = (indice + imagens.length) % imagens.length;
    const slide = slides[indiceAtual];
    faixa.scrollTo({
      left: posicaoDoSlide(slide),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    atualizarPontos();
  }

  function posicaoDoSlide(slide) {
    return slide.offsetLeft - (faixa.clientWidth - slide.offsetWidth) / 2;
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

  faixa.style.scrollBehavior = 'auto';
  faixa.scrollLeft = posicaoDoSlide(slides[indiceAtual]);
  requestAnimationFrame(() => {
    faixa.style.scrollBehavior = '';
  });
  atualizarPontos();

  faixa.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(quadroDeRolagem);
      quadroDeRolagem = requestAnimationFrame(() => {
        const centro = faixa.scrollLeft + faixa.clientWidth / 2;
        indiceAtual = slides.reduce((maisProximo, slide, indice) => {
          const distancia = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - centro);
          const distanciaAnterior = Math.abs(
            slides[maisProximo].offsetLeft + slides[maisProximo].offsetWidth / 2 - centro
          );
          return distancia < distanciaAnterior ? indice : maisProximo;
        }, 0);
        atualizarPontos();
      });
    },
    { passive: true }
  );

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
  faixa.addEventListener('touchstart', parar, { passive: true });
  faixa.addEventListener('touchend', iniciar, { passive: true });
  faixa.addEventListener('touchcancel', iniciar, { passive: true });
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
  window.addEventListener('resize', () => mostrar(indiceAtual));
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
