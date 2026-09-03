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
