import { fecharAoClicarFora } from './modais.js';

const CHAVE_AVISO_FAVORITOS = 'happyKidsAvisoFavoritosVisto';

/** Controla o aviso; o coordenador decide quando tentar exibi-lo. */
export function criarControladorAvisoFavoritos() {
  const modal = document.getElementById('modal-aviso-favoritos');
  const botaoEntendi = document.getElementById('btn-entendi-aviso-favoritos');
  const botaoFechar = document.getElementById('btn-fechar-aviso-favoritos');
  const botaoSobre = document.getElementById('btn-sobre-favoritos');
  let exibidoNestaPagina = false;
  let continuarAposFechar = null;

  if (!modal || !botaoEntendi || !botaoFechar) return () => false;

  botaoEntendi.addEventListener('click', () => modal.close());
  botaoFechar.addEventListener('click', () => modal.close());
  fecharAoClicarFora(modal);

  botaoSobre?.addEventListener('click', () => {
    const lista = document.getElementById('dialog-favorite');
    if (!lista?.open || modal.open) return;

    // Mantém apenas um dialog aberto e preserva a lista e sua rolagem.
    abrirAviso(() => {
      if (!lista.open) lista.showModal();
      botaoSobre.focus({ preventScroll: true });
    });
  });

  modal.addEventListener('close', () => {
    const continuar = continuarAposFechar;
    continuarAposFechar = null;
    continuar?.();
  });

  function abrirAviso(continuar) {
    if (modal.open) return true;

    modal.showModal();
    exibidoNestaPagina = true;
    continuarAposFechar = continuar;

    try {
      localStorage.setItem(CHAVE_AVISO_FAVORITOS, '1');
    } catch (erro) {
      // Mantém a exibição única nesta página mesmo sem persistir o registro.
      console.warn('Não foi possível salvar o registro do aviso de favoritos.', erro);
    }

    return true;
  }

  return function exibirAvisoFavoritos(continuar) {
    // Cliques rápidos não devem abrir a lista por cima do aviso.
    if (modal.open) return true;
    if (exibidoNestaPagina) return false;

    try {
      if (localStorage.getItem(CHAVE_AVISO_FAVORITOS) === '1') {
        exibidoNestaPagina = true;
        return false;
      }
    } catch (erro) {
      console.warn('Não foi possível ler o registro do aviso de favoritos.', erro);
    }

    return abrirAviso(continuar);
  };
}
