import assert from 'node:assert/strict';
import test from 'node:test';

import { escaparPadraoIlike, normalizarListaFavoritos, normalizarProduto } from '../js/domain.js';
import {
  criarControladorCatalogo,
  LIMITE_POR_PAGINA,
  possuiConsultaAtiva
} from '../js/catalogo.js';

const chamadasSupabase = [];

test('usa 20 produtos como limite padrão por página', async () => {
  let limiteRecebido;
  const fontesDeDados = {
    buscarTodosOsProdutos: async (_pagina, limite) => {
      limiteRecebido = limite;
      return { produtos: [], temMais: false };
    }
  };
  const catalogo = criarControladorCatalogo({ fontesDeDados });

  await catalogo.carregarCatalogo();

  assert.equal(LIMITE_POR_PAGINA, 20);
  assert.equal(limiteRecebido, 20);
});

test('normaliza um produto público válido', () => {
  const produto = normalizarProduto({
    codigo: 123,
    nome: '  Boneca  ',
    preco: '59.9',
    estoque: true,
    descricao: null
  });

  assert.deepEqual(produto, {
    codigo: '123',
    nome: 'Boneca',
    preco: 59.9,
    descricao: '',
    estoque: true,
    destaque: null,
    idade_recomendada: null,
    genero: '',
    marca: '',
    categoria: ''
  });
});

test('rejeita produtos sem código seguro ou preço válido', () => {
  assert.equal(normalizarProduto({ codigo: '../arquivo', preco: 10 }), null);
  assert.equal(normalizarProduto({ codigo: 12, preco: -1 }), null);
});

test('recupera favoritos válidos, limita quantidade e remove duplicados', () => {
  const favoritos = normalizarListaFavoritos([
    { codigo: 1, nome: 'Primeiro', preco: 10, quantidade: 500 },
    { codigo: 1, nome: 'Atualizado', preco: 12, quantidade: 2 },
    { codigo: '<script>', nome: 'Inválido', preco: 10 }
  ]);

  assert.deepEqual(favoritos, [
    {
      codigo: '1',
      nome: 'Atualizado',
      preco: 12,
      descricao: '',
      estoque: false,
      destaque: null,
      idade_recomendada: null,
      genero: '',
      marca: '',
      categoria: '',
      quantidade: 2
    }
  ]);
});

test('escapa curingas de busca ILIKE', () => {
  assert.equal(escaparPadraoIlike('100%_\\'), '100\\%\\_\\\\');
});

test('so exibe retorno ao catalogo quando ha busca ou filtro ativo', () => {
  assert.equal(possuiConsultaAtiva('catalogo'), false);
  assert.equal(possuiConsultaAtiva('busca'), true);
  assert.equal(possuiConsultaAtiva('filtro'), true);
  assert.equal(possuiConsultaAtiva('categoria'), true);
  assert.equal(possuiConsultaAtiva('desconhecido'), false);
});

test('não avança a página quando carregar mais falha e permite retry correto', async () => {
  const chamadas = [];
  let deveFalhar = true;
  const fontesDeDados = {
    buscarTodosOsProdutos: async (pagina) => {
      chamadas.push(pagina);

      if (pagina === 1 && deveFalhar) {
        throw new Error('falha temporária');
      }

      return {
        produtos: [{ codigo: String(pagina + 1), nome: 'Produto', preco: 10 }],
        temMais: pagina < 1
      };
    },
    buscarProdutosPorNome: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorFiltros: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorCategoria: async () => ({ produtos: [], temMais: false })
  };
  const catalogo = criarControladorCatalogo({ fontesDeDados });

  await catalogo.carregarCatalogo();
  await assert.rejects(catalogo.carregarMais(), /falha temporária/);
  assert.equal(catalogo.obterEstado().pagina, 0);

  deveFalhar = false;
  await catalogo.carregarMais();

  assert.deepEqual(chamadas, [0, 1, 1]);
  assert.equal(catalogo.obterEstado().pagina, 1);
  assert.equal(catalogo.obterEstado().produtos.length, 2);
});

test('ignora clique concorrente em carregar mais', async () => {
  let liberarResposta;
  let chamadas = 0;
  const fontesDeDados = {
    buscarTodosOsProdutos: async (pagina) => {
      chamadas++;

      if (pagina === 0) {
        return {
          produtos: [{ codigo: '1', nome: 'Produto', preco: 10 }],
          temMais: true
        };
      }

      return new Promise((resolve) => {
        liberarResposta = () =>
          resolve({
            produtos: [{ codigo: '2', nome: 'Produto', preco: 10 }],
            temMais: false
          });
      });
    },
    buscarProdutosPorNome: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorFiltros: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorCategoria: async () => ({ produtos: [], temMais: false })
  };
  const catalogo = criarControladorCatalogo({ fontesDeDados });

  await catalogo.carregarCatalogo();
  const primeiraChamada = catalogo.carregarMais();
  const segundaChamada = await catalogo.carregarMais();
  assert.equal(segundaChamada.ignorada, true);

  liberarResposta();
  await primeiraChamada;
  assert.equal(chamadas, 2);
});

test('encerra a paginação quando a próxima página não retorna cards', async () => {
  const fontesDeDados = {
    buscarTodosOsProdutos: async (pagina) => {
      if (pagina === 0) {
        return {
          produtos: [{ codigo: '1', nome: 'Produto', preco: 10 }],
          temMais: true
        };
      }

      return { produtos: [], temMais: true };
    },
    buscarProdutosPorNome: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorFiltros: async () => ({ produtos: [], temMais: false }),
    buscarProdutosPorCategoria: async () => ({ produtos: [], temMais: false })
  };
  const catalogo = criarControladorCatalogo({ fontesDeDados });

  await catalogo.carregarCatalogo();
  const resultado = await catalogo.carregarMais();

  assert.equal(resultado.acrescentou, false);
  assert.equal(resultado.temMais, false);
  assert.equal(catalogo.obterEstado().carregando, false);
});

test('categoria e subcategoria permanecem na paginação e cada seleção reinicia a página', async () => {
  const chamadas = [];
  const catalogo = criarControladorCatalogo({
    fontesDeDados: {
      buscarProdutosPorCategoria: async (categoria, subcategoria, pagina) => {
        chamadas.push({ categoria, subcategoria, pagina });
        return { produtos: [{ codigo: String(chamadas.length) }], temMais: pagina === 0 };
      }
    }
  });

  await catalogo.aplicarCategoria('Bebês');
  assert.deepEqual(catalogo.obterEstado().parametros, {
    categoria: 'Bebês',
    subcategoria: null
  });
  await catalogo.carregarMais();
  await catalogo.aplicarCategoria('Bebês', 'Banho');
  await catalogo.carregarMais();
  await catalogo.aplicarCategoria('Bebês', 'Sono e Conforto');
  await catalogo.aplicarCategoria('Jogos', 'Jogos de Mesa');
  await catalogo.aplicarCategoria('Jogos');

  assert.deepEqual(chamadas, [
    { categoria: 'Bebês', subcategoria: null, pagina: 0 },
    { categoria: 'Bebês', subcategoria: null, pagina: 1 },
    { categoria: 'Bebês', subcategoria: 'Banho', pagina: 0 },
    { categoria: 'Bebês', subcategoria: 'Banho', pagina: 1 },
    { categoria: 'Bebês', subcategoria: 'Sono e Conforto', pagina: 0 },
    { categoria: 'Jogos', subcategoria: 'Jogos de Mesa', pagina: 0 },
    { categoria: 'Jogos', subcategoria: null, pagina: 0 }
  ]);
  assert.equal(catalogo.obterEstado().modo, 'categoria');
  assert.equal(catalogo.obterEstado().pagina, 0);
});

test('resposta antiga de categoria não substitui a seleção mais recente', async () => {
  let resolverPrimeira;
  const catalogo = criarControladorCatalogo({
    fontesDeDados: {
      buscarProdutosPorCategoria: (categoria) =>
        categoria === 'Jogos'
          ? new Promise((resolve) => {
              resolverPrimeira = resolve;
            })
          : Promise.resolve({ produtos: [{ codigo: 'recente' }], temMais: false })
    }
  });

  const primeira = catalogo.aplicarCategoria('Jogos', 'Jogos de Mesa');
  await catalogo.aplicarCategoria('Bebês', 'Banho');
  resolverPrimeira({ produtos: [{ codigo: 'antigo' }], temMais: false });
  const respostaAntiga = await primeira;

  assert.equal(respostaAntiga.desatualizada, true);
  assert.deepEqual(catalogo.obterEstado().parametros, {
    categoria: 'Bebês',
    subcategoria: 'Banho'
  });
  assert.deepEqual(catalogo.obterEstado().produtos, [{ codigo: 'recente' }]);
});

test('resposta antiga de carregar mais não acrescenta produtos após troca de categoria', async () => {
  let resolverPaginaAntiga;
  const catalogo = criarControladorCatalogo({
    fontesDeDados: {
      buscarProdutosPorCategoria: (categoria, _subcategoria, pagina) => {
        if (categoria === 'Bebês' && pagina === 1) {
          return new Promise((resolve) => {
            resolverPaginaAntiga = resolve;
          });
        }
        return Promise.resolve({
          produtos: [{ codigo: categoria }],
          temMais: categoria === 'Bebês'
        });
      }
    }
  });

  await catalogo.aplicarCategoria('Bebês', 'Banho');
  const paginaAntiga = catalogo.carregarMais();
  await catalogo.aplicarCategoria('Jogos');
  resolverPaginaAntiga({ produtos: [{ codigo: 'atrasado' }], temMais: false });

  assert.equal((await paginaAntiga).desatualizada, true);
  assert.equal(catalogo.obterEstado().pagina, 0);
  assert.deepEqual(catalogo.obterEstado().parametros, {
    categoria: 'Jogos',
    subcategoria: null
  });
  assert.deepEqual(catalogo.obterEstado().produtos, [{ codigo: 'Jogos' }]);
});

test('consulta por categoria usa igualdade e só filtra subcategoria quando selecionada', async (t) => {
  const chamadas = [];
  globalThis.window = {
    supabase: {
      createClient: () => ({
        from(tabela) {
          const operacoes = [['from', tabela]];
          chamadas.push(operacoes);
          chamadasSupabase.push(operacoes);
          return {
            select(campo) {
              operacoes.push(['select', campo]);
              return this;
            },
            eq(campo, valor) {
              operacoes.push(['eq', campo, valor]);
              return this;
            },
            filter(campo, operador, valor) {
              operacoes.push(['filter', campo, operador, valor]);
              return this;
            },
            order(campo) {
              operacoes.push(['order', campo]);
              return this;
            },
            range(inicio, fim) {
              operacoes.push(['range', inicio, fim]);
              return Promise.resolve({ data: [], error: null });
            }
          };
        }
      })
    }
  };
  const { buscarProdutosPorCategoria } = await import('../js/api.js');

  await buscarProdutosPorCategoria('Bebês', null, 0, 20);
  await buscarProdutosPorCategoria('Bebês', 'Banho', 1, 20);

  assert.deepEqual(
    chamadas[0].filter(([operacao]) => operacao === 'eq'),
    [
      ['eq', 'estoque', true],
      ['eq', 'categoria', 'Bebês']
    ]
  );
  assert.equal(
    chamadas[0].some(([operacao]) => operacao === 'filter'),
    false
  );
  assert.deepEqual(
    chamadas[1].find(([operacao]) => operacao === 'filter'),
    ['filter', 'subcategorias', 'cs', '{"Banho"}']
  );
  assert.deepEqual(chamadas[1].at(-1), ['range', 20, 40]);

  await t.test('serializa subcategoria com vírgula como um único elemento do array', async () => {
    await buscarProdutosPorCategoria('Educativos e Criativos', 'Artes, Música e Criação', 0, 20);

    assert.deepEqual(
      chamadas[2].find(([operacao]) => operacao === 'filter'),
      ['filter', 'subcategorias', 'cs', '{"Artes, Música e Criação"}']
    );
  });
});

test('accordion abre e fecha sem consultar produtos ou fechar o menu', async () => {
  const rolagens = [];
  let limitesCategoria = { top: 350, bottom: 650 };
  const areaRolavel = {
    scrollTop: 120,
    getBoundingClientRect: () => ({ top: 100, bottom: 500 }),
    scrollTo: (opcoes) => rolagens.push(opcoes)
  };
  const item = { getBoundingClientRect: () => limitesCategoria };
  const estilosAnteriores = globalThis.getComputedStyle;
  const windowAnterior = globalThis.window;
  globalThis.getComputedStyle = () => ({ paddingTop: '15px' });
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  const sublistas = {
    'subcategorias-jogos': { hidden: true },
    'subcategorias-bebes': { hidden: true }
  };
  const criarBotao = (id) => {
    const atributos = new Map([
      ['aria-expanded', 'false'],
      ['aria-controls', id]
    ]);
    return {
      closest: () => item,
      getAttribute: (nome) => atributos.get(nome),
      setAttribute: (nome, valor) => atributos.set(nome, valor)
    };
  };
  const jogos = criarBotao('subcategorias-jogos');
  const bebes = criarBotao('subcategorias-bebes');
  let aoClicar;
  const consultasAntes = chamadasSupabase.length;
  let fechamentos = 0;
  const lista = {
    closest: () => areaRolavel,
    addEventListener: (_tipo, callback) => {
      aoClicar = callback;
    },
    querySelectorAll: () => [jogos, bebes]
  };
  globalThis.document = {
    addEventListener() {},
    querySelector: () => lista,
    getElementById: (id) =>
      id === 'modal-menu'
        ? {
            close() {
              fechamentos++;
            }
          }
        : sublistas[id]
  };
  const { configurarFiltroCategoria } = await import('../js/coordenador.js');
  configurarFiltroCategoria();
  const clicar = (botao) =>
    aoClicar({
      target: { closest: (seletor) => (seletor === '.btn-alternar-categoria' ? botao : null) }
    });

  await clicar(jogos);
  assert.equal(jogos.getAttribute('aria-expanded'), 'true');
  assert.equal(sublistas['subcategorias-jogos'].hidden, false);
  assert.deepEqual(rolagens, [{ top: 355, behavior: 'instant' }]);
  limitesCategoria = { top: 150, bottom: 350 };
  await clicar(bebes);
  assert.equal(sublistas['subcategorias-jogos'].hidden, true);
  assert.equal(sublistas['subcategorias-bebes'].hidden, false);
  await clicar(bebes);
  assert.equal(bebes.getAttribute('aria-expanded'), 'false');
  assert.equal(sublistas['subcategorias-bebes'].hidden, true);
  assert.equal(rolagens.length, 1);
  assert.equal(chamadasSupabase.length, consultasAntes);
  assert.equal(fechamentos, 0);
  globalThis.getComputedStyle = estilosAnteriores;
  globalThis.window = windowAnterior;
});
