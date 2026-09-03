const INTERVALO_AUTOMATICO = 6000;

function obterDistanciaDeRolagem(carrossel) {
    const primeiroCard = carrossel.querySelector('.card-produto');

    if (!primeiroCard) {
        return carrossel.clientWidth;
    }

    const estilos = getComputedStyle(carrossel);
    const espacamento = Number.parseFloat(estilos.columnGap) || 0;

    return primeiroCard.getBoundingClientRect().width + espacamento;
}

function rolarCarrossel(carrossel, direcao) {
    const distancia = obterDistanciaDeRolagem(carrossel);
    const limiteFinal = Math.max(
        0,
        carrossel.scrollWidth - carrossel.clientWidth
    );

    if (limiteFinal === 0) return;

    if (direcao > 0 && carrossel.scrollLeft + distancia >= limiteFinal) {
        carrossel.scrollTo({
            left: 0,
            behavior: 'smooth'
        });
        return;
    }

    if (direcao < 0 && carrossel.scrollLeft <= 2) {
        carrossel.scrollTo({
            left: limiteFinal,
            behavior: 'smooth'
        });
        return;
    }

    carrossel.scrollBy({
        left: distancia * direcao,
        behavior: 'smooth'
    });
}

export function configurarCarrosselMaisVendidos() {
    const secao = document.getElementById('secao-mais-vendidos');
    const carrossel = document.getElementById('carrossel-mais-vendidos');
    const botaoAnterior = document.getElementById('btn-mais-vendidos-anterior');
    const botaoProximo = document.getElementById('btn-mais-vendidos-proximo');

    if (!secao || !carrossel || !botaoAnterior || !botaoProximo) {
        return;
    }

    if (carrossel.dataset.configurado === 'true') return;
    carrossel.dataset.configurado = 'true';

    const permitePausaComMouse = window.matchMedia(
        '(hover: hover) and (pointer: fine)'
    ).matches;

    const prefereMovimentoReduzido = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    let temporizador = null;

    function pararMovimentoAutomatico() {
        clearInterval(temporizador);
        temporizador = null;
    }

    function iniciarMovimentoAutomatico() {
        pararMovimentoAutomatico();

        const naoPrecisaRolar =
            carrossel.scrollWidth <= carrossel.clientWidth + 1;

        if (
            prefereMovimentoReduzido
            || document.hidden
            || naoPrecisaRolar
        ) {
            return;
        }

        temporizador = setInterval(() => {
            rolarCarrossel(carrossel, 1);
        }, INTERVALO_AUTOMATICO);
    }

    botaoAnterior.addEventListener('click', () => {
        rolarCarrossel(carrossel, -1);
        iniciarMovimentoAutomatico();
    });

    botaoProximo.addEventListener('click', () => {
        rolarCarrossel(carrossel, 1);
        iniciarMovimentoAutomatico();
    });

    if (permitePausaComMouse) {
        secao.addEventListener('mouseenter', pararMovimentoAutomatico);
        secao.addEventListener('mouseleave', iniciarMovimentoAutomatico);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pararMovimentoAutomatico();
        } else {
            iniciarMovimentoAutomatico();
        }
    });

    window.addEventListener('resize', iniciarMovimentoAutomatico);

    iniciarMovimentoAutomatico();
}