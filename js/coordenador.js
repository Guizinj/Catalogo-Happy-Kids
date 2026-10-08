import {
  buscarProdutosMaisVendidos,
  buscarProdutosPorCategoria,
  buscarProdutosPorCodigos,
  buscarProdutosPorFiltros,
  buscarProdutosPorNome,
  buscarTodosOsProdutos
} from './api.js';
import { configurarCarrosselMaisVendidos } from './carrossel.js';
import { criarControladorAvisoFavoritos } from './aviso-favoritos.js?v=1.0.1';
import { configurarDestaques } from './destaques.js?v=1.0.4';
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
} from './ui.js?v=1.0.3';
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
import { configurarLinksWhatsApp } from './whatsapp.js?v=1.0.1';

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
let exibirAvisoFavoritos = () => false;

/** Ponto único de exibição após adicionar um favorito pelo card ou pelos detalhes. */
function abrirFavoritosAposAdicionar(modalProduto = null) {
  const modalFavoritos = document.getElementById('dialog-favorite');
  if (!modalFavoritos) return;

  setTimeout(() => {
    if (modalProduto?.open) modalProduto.close();

    const abrirLista = () => {
      if (!modalFavoritos.open) modalFavoritos.showModal();
    };

    if (!exibirAvisoFavoritos(abrirLista)) abrirLista();
  }, 250);
}

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
    obterFavoritos(),
    'grid',
    resultado.modo
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
  mostrarToast(`Redirecionado para o Catálogo Completo...`);
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

async function carregarCategoria(categoria, subcategoria = null) {
  try {
    mostrarToast(`Carregando Categoria "${categoria}"...`, 'sucesso');
    const resultado = await catalogo.aplicarCategoria(categoria, subcategoria);
    atualizarCatalogoNaTela(resultado);
  } catch (erro) {
    console.error('Falha ao filtrar por categoria', erro);
    mostrarToast('Não foi possível carregar esta categoria. Tente novamente.', 'removido');
  }
}

export function configurarFiltroCategoria() {
  const listaCategorias = document.querySelector('.lista-modal-categoria');
  const modalMenu = document.getElementById('modal-menu');
  if (!listaCategorias) return;

  listaCategorias.addEventListener('click', async (evento) => {
    const botaoAccordion = evento.target.closest('.btn-alternar-categoria');
    if (botaoAccordion) {
      const abrir = botaoAccordion.getAttribute('aria-expanded') !== 'true';
      listaCategorias.querySelectorAll('.btn-alternar-categoria').forEach((botao) => {
        const expandido = botao === botaoAccordion && abrir;
        botao.setAttribute('aria-expanded', String(expandido));
        document.getElementById(botao.getAttribute('aria-controls')).hidden = !expandido;
      });
      if (abrir) {
        const areaRolavel = listaCategorias.closest('.corpo-menu-scroll');
        const item = botaoAccordion.closest('.item-categoria-modal');
        if (areaRolavel && item) {
          const area = areaRolavel.getBoundingClientRect();
          const categoria = item.getBoundingClientRect();
          const espaco = parseFloat(getComputedStyle(areaRolavel).paddingTop) || 0;
          if (categoria.top < area.top + espaco || categoria.bottom > area.bottom - espaco) {
            areaRolavel.scrollTo({
              top: areaRolavel.scrollTop + categoria.top - area.top - espaco,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth'
            });
          }
        }
      }
      return;
    }

    const botaoFiltro = evento.target.closest('.btn-filtrar-categoria');
    if (!botaoFiltro) return;

    const { categoria, subcategoria } = botaoFiltro.dataset;
    if (!categoria) return;

    fecharMenuERolar(modalMenu);
    await carregarCategoria(categoria, subcategoria || null);
  });
}

function configurarCarrosselCategorias() {
  const carrossel = document.getElementById('carrossel-categorias');
  const anterior = document.getElementById('btn-categorias-anterior');
  const proximo = document.getElementById('btn-categorias-proximo');
  const painel = document.getElementById('categorias-subcategorias');
  const secao = carrossel?.closest('.secao-categorias');
  if (!carrossel || !anterior || !proximo || !painel || !secao) return;

  const cards = carrossel.querySelectorAll('.categoria-card');
  let cardAberto = null;
  cards.forEach((card) => {
    card.setAttribute('aria-controls', painel.id);
    card.setAttribute('aria-expanded', 'false');
  });

  const fecharPainel = () => {
    painel.hidden = true;
    cardAberto?.setAttribute('aria-expanded', 'false');
    cardAberto = null;
  };

  const atualizarControles = () => {
    const fim = carrossel.scrollWidth - carrossel.clientWidth;
    anterior.disabled = carrossel.scrollLeft <= 1;
    proximo.disabled = carrossel.scrollLeft >= fim - 1;
  };

  const rolar = (direcao) => {
    const card = carrossel.querySelector('li');
    if (!card) return;
    const distancia =
      card.getBoundingClientRect().width + parseFloat(getComputedStyle(carrossel).gap);
    carrossel.scrollBy({
      left: distancia * 3 * direcao,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  };

  anterior.addEventListener('click', () => rolar(-1));
  proximo.addEventListener('click', () => rolar(1));
  carrossel.addEventListener('scroll', atualizarControles, { passive: true });
  window.addEventListener('resize', atualizarControles);
  atualizarControles();

  carrossel.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.categoria-card');
    if (!botao || !carrossel.contains(botao)) return;

    if (cardAberto === botao && !painel.hidden) {
      fecharPainel();
      return;
    }

    const categoria = botao.dataset.categoria;
    const origem = Array.from(
      document.querySelectorAll('.lista-modal-categoria .btn-alternar-categoria')
    ).find((item) => item.dataset.categoria === categoria);
    const sublista = origem && document.getElementById(origem.getAttribute('aria-controls'));
    const opcoes = sublista?.querySelectorAll('.btn-filtrar-categoria');
    if (!opcoes?.length) {
      fecharPainel();
      document.querySelector('.conteudo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      void carregarCategoria(categoria);
      return;
    }

    const itens = Array.from(opcoes, (opcaoOriginal) => {
      const item = document.createElement('li');
      const opcao = document.createElement('button');
      opcao.type = 'button';
      opcao.className = 'btn-filtrar-categoria categoria-subcategoria';
      opcao.dataset.categoria = opcaoOriginal.dataset.categoria;
      opcao.dataset.subcategoria = opcaoOriginal.dataset.subcategoria || '';
      opcao.textContent = opcaoOriginal.textContent.trim();
      if (opcaoOriginal.hasAttribute('aria-label')) {
        opcao.setAttribute('aria-label', opcaoOriginal.getAttribute('aria-label'));
      }
      item.append(opcao);
      return item;
    });

    fecharPainel();
    painel.replaceChildren(...itens);
    painel.setAttribute('aria-label', `Opções de ${categoria}`);
    painel.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    cardAberto = botao;
    itens[0].querySelector('button').focus({ preventScroll: true });
    secao.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  });

  painel.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('.categoria-subcategoria');
    if (!botao || !painel.contains(botao)) return;

    document.querySelector('.conteudo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await carregarCategoria(botao.dataset.categoria, botao.dataset.subcategoria || null);
  });

  painel.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const card = cardAberto;
    fecharPainel();
    card?.focus();
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

function configurarEstadoVazioCatalogo() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  grid.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-action="abrir-busca"]')) {
      document.getElementById('btn-abrir-busca')?.click();
      return;
    }

    if (!evento.target.closest('[data-action="explorar-categorias"]')) return;

    document.querySelector('.abrir-menu')?.click();
    const corpoMenu = document.querySelector('#modal-menu .corpo-menu-scroll');
    if (corpoMenu) corpoMenu.scrollTop = 0;
    document.querySelector('#modal-menu .btn-alternar-categoria')?.focus({ preventScroll: true });
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

    if (resultado.foiAdicionado) abrirFavoritosAposAdicionar(modalProduto);
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
      abrirFavoritosAposAdicionar();
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
  exibirAvisoFavoritos = criarControladorAvisoFavoritos();
  configurarDestaques();
  configurarBloqueioRolagemModais();
  configurarLinksWhatsApp();
  configurarPesquisa();
  configurarEstadoVazioCatalogo();
  configurarFiltroCategoria();
  configurarCarrosselCategorias();
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
