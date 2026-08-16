import assert from 'node:assert/strict';
import test from 'node:test';

import {
    escaparPadraoIlike,
    normalizarListaFavoritos,
    normalizarProduto
} from '../js/domain.js';
import { criarControladorCatalogo, possuiConsultaAtiva } from '../js/catalogo.js';

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

    assert.deepEqual(favoritos, [{
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
    }]);
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
                return { produtos: [{ codigo: '1', nome: 'Produto', preco: 10 }], temMais: true };
            }

            return new Promise((resolve) => {
                liberarResposta = () => resolve({
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
