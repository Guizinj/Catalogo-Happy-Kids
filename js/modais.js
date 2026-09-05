let posicaoAnteriorDoToqueY = 0;

/**
 * Retorna a área em que o gesto começou quando ela realmente possui
 * rolagem interna, como a descrição do produto ou o corpo de um menu.
 */
function obterAreaRolavel(alvo, dialog) {
  let elemento = alvo instanceof Element ? alvo : alvo?.parentElement;

  while (elemento && elemento !== dialog) {
    const estilos = getComputedStyle(elemento);
    const permiteRolagemVertical = /auto|scroll/.test(estilos.overflowY);

    if (permiteRolagemVertical && elemento.scrollHeight > elemento.clientHeight + 1) {
      return elemento;
    }

    elemento = elemento.parentElement;
  }

  return null;
}

function registrarInicioDoToque(evento) {
  if (!document.querySelector('dialog[open]') || evento.touches.length !== 1) return;
  posicaoAnteriorDoToqueY = evento.touches[0].clientY;
}

function impedirRolagemDoFundoNoToque(evento) {
  const dialogAberto = document.querySelector('dialog[open]');
  if (!dialogAberto || evento.touches.length !== 1) return;

  const areaRolavel = dialogAberto.contains(evento.target)
    ? obterAreaRolavel(evento.target, dialogAberto)
    : null;

  if (!areaRolavel) {
    evento.preventDefault();
    return;
  }

  const toqueAtualY = evento.touches[0].clientY;
  const arrastandoParaBaixo = toqueAtualY > posicaoAnteriorDoToqueY;
  const chegouAoInicio = areaRolavel.scrollTop <= 0;
  const chegouAoFim =
    areaRolavel.scrollTop + areaRolavel.clientHeight >= areaRolavel.scrollHeight - 1;

  posicaoAnteriorDoToqueY = toqueAtualY;

  if ((chegouAoInicio && arrastandoParaBaixo) || (chegouAoFim && !arrastandoParaBaixo)) {
    evento.preventDefault();
  }
}

/** Mantém o documento imóvel enquanto qualquer dialog estiver aberto. */
export function configurarBloqueioRolagemModais() {
  document.addEventListener('touchstart', registrarInicioDoToque, { passive: true });
  document.addEventListener('touchmove', impedirRolagemDoFundoNoToque, { passive: false });
}

/**
 * Fecha o dialog e espera o bloqueio ser removido antes de navegar.
 */
export function fecharModalERolar(dialog, elemento, opcoes = {}) {
  if (dialog?.open) {
    dialog.close();
  }

  requestAnimationFrame(() => {
    elemento?.scrollIntoView(opcoes);
  });
}

export function configurarModalMenu() {
  const modalMenu = document.getElementById('modal-menu');
  const botoesAbrirMenu = document.querySelectorAll('.abrir-menu');
  const botaoFecharMenu = document.getElementById('btn-fechar-menu');
  const botaoBusca = document.getElementById('btn-abrir-busca');
  const campoLupa = document.getElementById('campo-lupa');

  fecharAoClicarFora(modalMenu);

  botoesAbrirMenu.forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      evento.preventDefault();
      modalMenu?.showModal();
    });
  });

  botaoFecharMenu?.addEventListener('click', () => {
    modalMenu?.close();
  });

  botaoBusca?.addEventListener('click', () => {
    modalMenu?.showModal();
    campoLupa?.focus();
  });
}

export function configurarModalFavoritos() {
  const modalFavoritos = document.getElementById('dialog-favorite');
  const botaoAbrirFavoritos = document.getElementById('btn-favorite');
  const botaoFecharFavoritos = document.getElementById('btn-fechar-fav');

  fecharAoClicarFora(modalFavoritos);

  botaoAbrirFavoritos?.addEventListener('click', () => {
    modalFavoritos?.showModal();
  });

  botaoFecharFavoritos?.addEventListener('click', () => {
    modalFavoritos?.close();
  });
}

export function configurarModalMagic() {
  const modalMagic = document.getElementById('modal-filtro-magico');
  const botaoAbrirMagic = document.getElementById('btn-cta');
  const botaoFecharMagic = document.getElementById('btn-fechar');

  fecharAoClicarFora(modalMagic);

  botaoAbrirMagic?.addEventListener('click', () => {
    modalMagic?.showModal();
  });

  botaoFecharMagic?.addEventListener('click', () => {
    modalMagic?.close();
  });
}

/**
 * Escuta os cliques em um modal do tipo <dialog> e o fecha se o clique
 * for na área escura (backdrop).
 */
export function fecharAoClicarFora(dialog) {
  if (!dialog) return;

  dialog.addEventListener('click', (evento) => {
    // No <dialog>, um clique no backdrop tem o próprio dialog como alvo.
    if (evento.target === dialog) {
      dialog.close();
    }
  });
}

export function configurarFaq() {
  const modalAjuda = document.getElementById('modal-ajuda');
  const botaoFecharAjuda = document.getElementById('btn-fechar-ajuda');
  const botoesAbrirAjuda = document.querySelectorAll('.abrir-ajuda');

  botoesAbrirAjuda.forEach((botao) => {
    botao.addEventListener('click', (evento) => {
      evento.preventDefault();
      modalAjuda?.showModal();
    });
  });

  botaoFecharAjuda?.addEventListener('click', () => modalAjuda?.close());

  fecharAoClicarFora(modalAjuda);
}

export function configurarModalLoja() {
  const modalLojas = document.getElementById('modal-lojas');
  const botaoAbrirLojas = document.getElementById('abrir-lojas');
  const botaoFecharLojas = document.querySelector('.btn-fechar-modal-lojas');

  botaoAbrirLojas?.addEventListener('click', (evento) => {
    evento.preventDefault();
    modalLojas?.showModal();
  });

  botaoFecharLojas?.addEventListener('click', (evento) => {
    evento.preventDefault();
    modalLojas?.close();
  });

  fecharAoClicarFora(modalLojas);
}
