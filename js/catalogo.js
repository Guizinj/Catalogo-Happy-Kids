export const LIMITE_POR_PAGINA = 14;

const MODOS_COM_CONSULTA_ATIVA = new Set(['busca', 'filtro', 'categoria']);

export function possuiConsultaAtiva(modo) {
    return MODOS_COM_CONSULTA_ATIVA.has(modo);
}

export function criarControladorCatalogo({
    limite = LIMITE_POR_PAGINA,
    fontesDeDados
} = {}) {
    let estado = {
        modo: 'catalogo',
        parametros: {},
        pagina: 0,
        produtos: [],
        temMais: false,
        carregando: false
    };
    let idDaRequisicaoAtual = 0;

    function obterEstado() {
        return {
            ...estado,
            produtos: [...estado.produtos]
        };
    }

    async function buscarPagina(modo, parametros, pagina) {
        if (!fontesDeDados) {
            throw new Error('Fontes de dados do catálogo não configuradas.');
        }

        switch (modo) {
            case 'busca':
                return fontesDeDados.buscarProdutosPorNome(parametros.termo, pagina, limite);
            case 'filtro':
                return fontesDeDados.buscarProdutosPorFiltros(parametros.filtros, pagina, limite);
            case 'categoria':
                return fontesDeDados.buscarProdutosPorCategoria(parametros.categoria, pagina, limite);
            default:
                return fontesDeDados.buscarTodosOsProdutos(pagina, limite);
        }
    }

    async function trocarModo(modo, parametros = {}) {
        const estadoAnterior = estado;
        const idDaRequisicao = ++idDaRequisicaoAtual;

        estado = {
            ...estado,
            modo,
            parametros,
            pagina: 0,
            temMais: false,
            carregando: true
        };

        try {
            const resposta = await buscarPagina(modo, parametros, 0);

            if (idDaRequisicao !== idDaRequisicaoAtual) {
                return { ...obterEstado(), desatualizada: true };
            }

            estado = {
                ...estado,
                produtos: resposta.produtos,
                temMais: resposta.temMais,
                carregando: false
            };

            return {
                ...obterEstado(),
                ultimaPagina: resposta.produtos,
                acrescentou: false
            };
        } catch (erro) {
            if (idDaRequisicao === idDaRequisicaoAtual) {
                estado = {
                    ...estadoAnterior,
                    carregando: false
                };
            }
            throw erro;
        }
    }

    async function carregarMais() {
        if (estado.carregando || !estado.temMais) {
            return { ...obterEstado(), ignorada: true };
        }

        const idDaRequisicao = ++idDaRequisicaoAtual;
        const paginaAlvo = estado.pagina + 1;
        const estadoAnterior = estado;

        estado = {
            ...estado,
            carregando: true
        };

        try {
            const resposta = await buscarPagina(estado.modo, estado.parametros, paginaAlvo);

            if (idDaRequisicao !== idDaRequisicaoAtual) {
                return { ...obterEstado(), desatualizada: true };
            }

            estado = {
                ...estado,
                pagina: paginaAlvo,
                produtos: estado.produtos.concat(resposta.produtos),
                temMais: resposta.temMais,
                carregando: false
            };

            return {
                ...obterEstado(),
                ultimaPagina: resposta.produtos,
                acrescentou: true
            };
        } catch (erro) {
            if (idDaRequisicao === idDaRequisicaoAtual) {
                estado = {
                    ...estadoAnterior,
                    carregando: false
                };
            }
            throw erro;
        }
    }

    return {
        carregarCatalogo: () => trocarModo('catalogo'),
        aplicarBusca: (termo) => trocarModo('busca', { termo }),
        aplicarFiltros: (filtros) => trocarModo('filtro', { filtros }),
        aplicarCategoria: (categoria) => trocarModo('categoria', { categoria }),
        carregarMais,
        obterEstado
    };
}
