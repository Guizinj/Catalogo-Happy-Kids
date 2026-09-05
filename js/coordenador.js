import {
  buscarProdutosMaisVendidos,
  buscarProdutosPorCategoria,
  buscarProdutosPorCodigos,
  buscarProdutosPorFiltros,
  buscarProdutosPorNome,
  buscarTodosOsProdutos
} from './api.js';
import { configurarCarrosselMaisVendidos } from './carrossel.js';
import { criarControladorCatalogo, possuiConsultaAtiva } from './catalogo.js';
import {
  atualizarModalProdutoUI,
  atualizarTituloCatalogo,
  atualizarTotalFavoritos,
  controlarVisibilidadeBotaoCatalogoCompleto,
  controlarVisibilidadeBotaoPaginacao,
  enviarOrcamentoWhatsApp,
  favNavbar,
  mostrarToast,
  ocultarLoader,
  renderizarListaFavoritos,
  renderizarMaisVendidos,
  renderizarProdutos
} from './ui.js';
import {
  configurarBloqueioRolagemModais,
  configurarFaq,
  configurarModalFavoritos,
  configurarModalLoja,
  configurarModalMagic,
  configurarModalMenu,
  fecharAoClicarFora,
  fecharModalERolar
} from './modais.js';
import { mensagensNoTopo } from './banner.js';
import {
  alterarQuantidade,
  alternarFavorito,
  atualizarPrecosFavoritos,
  buscarFavorito,
  carregarFavoritos,
  obterFavoritos,
  obterQuantidade,
  removerFavorito,
  verificarFavorito
} from './storage.js';
import { configurarLinksWhatsApp } from './whatsapp.js';

const catalogo = criarControladorCatalogo({
  fontesDeDados: {
    buscarTodosOsProdutos,
    buscarProdutosPorNome,
    buscarProdutosPorFiltros,
    buscarProdutosPorCategoria
  }
});
let produtosAtuais = [];
let produtosMaisVendidos = [];

function sincronizarInterfaceFavoritos() {
  const favoritos = obterFavoritos();
  renderizarListaFavoritos(favoritos);
  favNavbar(favoritos.length);
  atualizarTotalFavoritos(favoritos);
}

function atualizarBotoesFavorito(produto, estaFavoritado) {
  const seletor = '.card-produto[data-id="' + produto.codigo + '"] [data-action="favoritar"]';

  document.querySelectorAll(seletor).forEach((botao) => {
    botao.querySelector('.favorite')?.classList.toggle('favoritado', estaFavoritado);
    botao.setAttribute(
      'aria-label',
      (estaFavoritado ? 'Remover ' : 'Adicionar ') + produto.nome + ' dos favoritos'
    );
  });
}

function atualizarCatalogoNaTela(resultado) {
  if (!resultado || resultado.desatualizada) {
    return;
  }

  if (resultado.ignorada) {
    const estadoAtual = catalogo.obterEstado();
    controlarVisibilidadeBotaoPaginacao(estadoAtual.temMais, estadoAtual.carregando);
    return;
  }

  atualizarTituloCatalogo(resultado.modo, resultado.parametros);

  produtosAtuais = resultado.produtos;
  renderizarProdutos(
    resultado.acrescentou ? resultado.ultimaPagina : resultado.produtos,
    Boolean(resultado.acrescentou),
    obterFavoritos()
  );
  controlarVisibilidadeBotaoPaginacao(resultado.temMais, resultado.carregando);
  controlarVisibilidadeBotaoCatalogoCompleto(possuiConsultaAtiva(resultado.modo));
}

function favoritarComFeedback(produto) {
  const resultado = alternarFavorito(produto);

  if (!resultado.sucesso) {
    mostrarToast('Não foi possível salvar seus favoritos neste navegador.', 'removido');
    return resultado;
  }

  atualizarBotoesFavorito(produto, resultado.foiAdicionado);

  mostrarToast(
    resultado.foiAdicionado ? 'Item adicionado aos favoritos' : 'Item removido dos favoritos',
    resultado.foiAdicionado ? 'sucesso' : 'removido'
  );
  sincronizarInterfaceFavoritos();

  return resultado;
}

async function buscarMaisVendidosComFallback() {
  try {
    return await buscarProdutosMaisVendidos();
  } catch (erro) {
    console.error('Falha ao carregar mais vendidos', erro);
    return [];
  }
}

async function iniciarLoja() {
  try {
    carregarFavoritos();

    const codigosFavoritados = obterFavoritos().map((favorito) => favorito.codigo);
    const [resultadoCatalogo, favoritosAtualizados, maisVendidos] = await Promise.all([
      catalogo.carregarCatalogo(),
      buscarProdutosPorCodigos(codigosFavoritados),
      buscarMaisVendidosComFallback()
    ]);

    atualizarPrecosFavoritos(favoritosAtualizados);

    produtosMaisVendidos = maisVendidos;

    atualizarCatalogoNaTela(resultadoCatalogo);
    renderizarMaisVendidos(produtosMaisVendidos, obterFavoritos());
    configurarCarrosselMaisVendidos();
    sincronizarInterfaceFavoritos();
  } catch (erro) {
    console.error('Falha ao iniciar loja', erro);
    mostrarToast('Não foi possível carregar a loja. Tente recarregar a página.', 'removido');
  } finally {
    ocultarLoader();
  }
}

async function carregarProximaPagina() {
  const estadoAntes = catalogo.obterEstado();

  if (estadoAntes.carregando) {
    return;
  }

  if (!estadoAntes.temMais) {
    controlarVisibilidadeBotaoPaginacao(false, false);
    return;
  }

  controlarVisibilidadeBotaoPaginacao(estadoAntes.temMais, true);

  try {
    const resultado = await catalogo.carregarMais();
    atualizarCatalogoNaTela(resultado);
  } catch (erro) {
    console.error('Falha ao carregar próxima página', erro);
    const estadoAtual = catalogo.obterEstado();
    controlarVisibilidadeBotaoPaginacao(estadoAtual.temMais, false);
    mostrarToast('Não foi possível carregar mais produtos. Tente novamente.', 'removido');
  }
}

function configurarProximaPagina() {
  document.getElementById('btn-proxima-pagina')?.addEventListener('click', carregarProximaPagina);
}

async function voltarParaCatalogoCompleto() {
  mostrarToast(`Redirecionado para o Catálogo Completo...`)
  try {
    const resultado = await catalogo.carregarCatalogo();
    atualizarCatalogoNaTela(resultado);
    document.querySelector('.conteudo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (erro) {
    console.error('Falha ao voltar para catálogo completo', erro);
    mostrarToast('Não foi possível carregar o catálogo. Tente novamente.', 'removido');
  }
}

function configurarBotaoVerCatalogoCompleto() {
  document
    .getElementById('btn-ver-catalogo-completo')
    ?.addEventListener('click', voltarParaCatalogoCompleto);
}

function fecharMenuERolar(modalMenu) {
  fecharModalERolar(modalMenu, document.querySelector('.conteudo'), {
    behavior: 'smooth',
    block: 'start'
  });
}

function configurarFiltroCategoria() {
  const listaCategorias = document.querySelector('.lista-modal-categoria');
  const modalMenu = document.getElementById('modal-menu');
  if (!listaCategorias) return;

  listaCategorias.addEventListener('click', async (evento) => {
    const item = evento.target.closest('.item-categoria-modal');
    if (!item) return;

    const categoria = item.querySelector('.texto-categoria')?.textContent.trim();
    if (!categoria) return;

    try {
      fecharMenuERolar(modalMenu);
      mostrarToast(`Carregando Categoria "${categoria}"...`, 'sucesso');
      const resultado = await catalogo.aplicarCategoria(categoria);
      atualizarCatalogoNaTela(resultado);
    } catch (erro) {
      console.error('Falha ao filtrar por categoria', erro);
      mostrarToast('Não foi possível carregar esta categoria. Tente novamente.', 'removido');
    }
  });
}

function configurarPesquisa() {
  const campo = document.getElementById('campo-lupa');
  const formulario = document.getElementById('form-pesquisa');
  const modalMenu = document.getElementById('modal-menu');
  if (!campo || !formulario) return;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const termo = campo.value.trim();

    if (!termo) {
      campo.setCustomValidity('Digite algo para buscar.');
      campo.reportValidity();
      campo.focus();
      return;
    }

    campo.setCustomValidity('');

    try {
      fecharMenuERolar(modalMenu);
      mostrarToast(`Buscando por... "${termo}"`);
      const resultado = await catalogo.aplicarBusca(termo);
      atualizarCatalogoNaTela(resultado);
      campo.value = '';
      campo.blur();
    } catch (erro) {
      console.error('Falha na busca por nome', erro);
      mostrarToast('Não foi possível buscar. Tente novamente.', 'removido');
    }
  });
}

function configurarFiltroMagico() {
  const formulario = document.getElementById('form-filtro-magico');
  const modalMagic = document.getElementById('modal-filtro-magico');
  if (!formulario) return;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const dados = new FormData(formulario);
    const filtros = {
      idade: Number(dados.get('idade')),
      genero: dados.get('para_quem'),
      marca: dados.get('marca')
    };


    try {
      const resultado = await catalogo.aplicarFiltros(filtros);
      atualizarCatalogoNaTela(resultado);
      fecharModalERolar(modalMagic, document.querySelector('.conteudo'), {
        behavior: 'smooth',
        block: 'start'
      });
    } catch (erro) {
      console.error('Falha no filtro mágico', erro);
      mostrarToast('Não foi possível buscar. Tente novamente.', 'removido');
    }
      mostrarToast(`Busca feita por Filtro Mágico...`);
  });
}

function encontrarProdutoPorCodigo(codigo) {
  const codigoProcurado = String(codigo);

  return (
    produtosAtuais.find((produto) => produto.codigo === codigoProcurado) ||
    produtosMaisVendidos.find((produto) => produto.codigo === codigoProcurado) ||
    null
  );
}

function configurarModalProduto() {
  const modalFavoritos = document.getElementById('dialog-favorite');
  const modalProduto = document.getElementById('modal-produto');
  const botaoFechar = document.getElementById('btn-fechar-modal');
  const botaoFavoritar = document.getElementById('btn-favoritar-modal');
  let produtoAtualNoModal = null;

  function exibirDetalhes(produto) {
    if (!produto || !modalProduto) return;

    produtoAtualNoModal = produto;
    atualizarModalProdutoUI(produto, verificarFavorito);
    modalProduto.showModal();
  }

  document.addEventListener('click', (evento) => {
    const card = evento.target.closest('.card-produto');
    if (card) {
      // O card inteiro abre os detalhes. O coração continua sendo uma
      // ação independente e não deve abrir o modal.
      if (evento.target.closest('[data-action="favoritar"]')) {
        return;
      }

      const produto = encontrarProdutoPorCodigo(card.dataset.id);
      exibirDetalhes(produto);
      return;
    }

    const botaoDetalheFavorito = evento.target.closest('[data-action="ver-detalhes-favorito"]');
    if (botaoDetalheFavorito) {
      const produto = buscarFavorito(
        botaoDetalheFavorito.closest('.card-favorito-mini')?.dataset.id
      );
      exibirDetalhes(produto);
    }
  });

  botaoFavoritar?.addEventListener('click', () => {
    if (!produtoAtualNoModal) return;

    const resultado = favoritarComFeedback(produtoAtualNoModal);

    if (!resultado.sucesso) return;

    atualizarModalProdutoUI(produtoAtualNoModal, verificarFavorito);

    if (resultado.foiAdicionado && modalProduto && modalFavoritos) {
      setTimeout(() => {
        if (modalProduto.open) modalProduto.close();
        modalFavoritos.showModal();
      }, 250);
    }
  });

  botaoFechar?.addEventListener('click', () => modalProduto?.close());
  fecharAoClicarFora(modalProduto);
}

function configurarCliqueNosCards() {
  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-action="favoritar"]');
    if (!botao) return;

    const card = botao.closest('.card-produto');
    const produto = encontrarProdutoPorCodigo(card?.dataset.id);
    if (!produto) return;

    const resultado = favoritarComFeedback(produto);

    if (resultado.sucesso && resultado.foiAdicionado) {
      setTimeout(() => {
        document.getElementById('dialog-favorite')?.showModal();
      }, 250);
    }
  });
}

function configurarEventosModalFavoritosConteudo() {
  const container = document.querySelector('.modal-favoritos-conteudo');
  const modalConfirmacao = document.getElementById('modal-confirmacao');
  const cancelar = document.getElementById('btn-cancelar-remocao');
  const confirmar = document.getElementById('btn-confirmar-remocao');
  if (!container || !modalConfirmacao || !cancelar || !confirmar) return;

  let idProdutoPendente = null;

  cancelar.addEventListener('click', () => {
    idProdutoPendente = null;
    modalConfirmacao.close();
  });

  confirmar.addEventListener('click', () => {
    if (idProdutoPendente !== null) {
      const produtoRemovido = buscarFavorito(idProdutoPendente);

      removerFavorito(idProdutoPendente);
      if (produtoRemovido) atualizarBotoesFavorito(produtoRemovido, false);

      sincronizarInterfaceFavoritos();
      mostrarToast('Item removido dos favoritos', 'removido');
    }

    idProdutoPendente = null;
    modalConfirmacao.close();
  });

  container.addEventListener('click', (evento) => {
    const botaoDiminuir = evento.target.closest('[data-action="diminuir-favorito"]');
    const botaoAumentar = evento.target.closest('[data-action="aumentar-favorito"]');
    const card = (botaoDiminuir || botaoAumentar)?.closest('.card-favorito-mini');
    const idProduto = card?.dataset.id;
    if (!idProduto) return;

    if (botaoDiminuir) {
      if (obterQuantidade(idProduto) > 1) {
        alterarQuantidade(idProduto, 'subtrair');
        sincronizarInterfaceFavoritos();
      } else {
        idProdutoPendente = idProduto;
        modalConfirmacao.showModal();
      }
    }

    if (botaoAumentar) {
      alterarQuantidade(idProduto, 'somar');
      sincronizarInterfaceFavoritos();
    }
  });

  fecharAoClicarFora(modalConfirmacao);
}

function configurarBotaoConsultar() {
  document
    .getElementById('btn-consultar-favoritos')
    ?.addEventListener('click', () => enviarOrcamentoWhatsApp(obterFavoritos()));
}

document.addEventListener('DOMContentLoaded', () => {
  configurarBloqueioRolagemModais();
  configurarLinksWhatsApp();
  configurarPesquisa();
  configurarFiltroCategoria();
  configurarCliqueNosCards();
  configurarFaq();
  configurarModalProduto();
  configurarModalLoja();
  configurarModalFavoritos();
  configurarEventosModalFavoritosConteudo();
  configurarModalMagic();
  configurarModalMenu();
  mensagensNoTopo();
  configurarFiltroMagico();
  configurarProximaPagina();
  configurarBotaoVerCatalogoCompleto();
  configurarBotaoConsultar();
  iniciarLoja();
});
