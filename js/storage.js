import {
    normalizarFavorito,
    normalizarListaFavoritos,
    normalizarProduto,
    normalizarQuantidade
} from './domain.js';

const CHAVE_FAVORITOS = 'happyKidsFavoritos';
let listaFavoritos = [];

function sincronizarLocalStorage() {
    try {
        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(listaFavoritos));
        return true;
    } catch (erro) {
        console.error('Não foi possível salvar favoritos localmente', erro);
        return false;
    }
}

export function carregarFavoritos() {
    try {
        const favoritosSalvos = localStorage.getItem(CHAVE_FAVORITOS);

        if (!favoritosSalvos) {
            listaFavoritos = [];
            return listaFavoritos;
        }

        const favoritos = JSON.parse(favoritosSalvos);
        listaFavoritos = normalizarListaFavoritos(favoritos);

        // Corrige silenciosamente dados antigos, duplicados ou adulterados.
        sincronizarLocalStorage();
    } catch (erro) {
        console.warn('Favoritos locais inválidos; a lista foi reiniciada.', erro);
        listaFavoritos = [];

        try {
            localStorage.removeItem(CHAVE_FAVORITOS);
        } catch (erroDeLimpeza) {
            console.error('Não foi possível limpar favoritos inválidos', erroDeLimpeza);
        }
    }

    return listaFavoritos;
}

export function obterFavoritos() {
    return [...listaFavoritos];
}

export function verificarFavorito(idProduto) {
    return listaFavoritos.some((produto) => produto.codigo === String(idProduto));
}

export function buscarFavorito(idProduto) {
    return listaFavoritos.find((produto) => produto.codigo === String(idProduto)) || null;
}

export function alternarFavorito(produto) {
    const produtoNormalizado = normalizarProduto(produto);

    if (!produtoNormalizado) {
        return {
            listaAtualizada: obterFavoritos(),
            foiAdicionado: false,
            sucesso: false
        };
    }

    const listaAnterior = [...listaFavoritos];
    const indice = listaFavoritos.findIndex((item) => item.codigo === produtoNormalizado.codigo);
    let foiAdicionado = false;

    if (indice !== -1) {
        listaFavoritos.splice(indice, 1);
    } else {
        listaFavoritos.push({
            ...produtoNormalizado,
            quantidade: 1
        });
        foiAdicionado = true;
    }

    const sucesso = sincronizarLocalStorage();
    if (!sucesso) {
        listaFavoritos = listaAnterior;
    }

    return {
        listaAtualizada: obterFavoritos(),
        foiAdicionado,
        sucesso
    };
}

export function removerFavorito(idProduto) {
    const indice = listaFavoritos.findIndex((produto) => produto.codigo === String(idProduto));

    if (indice !== -1) {
        listaFavoritos.splice(indice, 1);
        sincronizarLocalStorage();
    }

    return obterFavoritos();
}

export function alterarQuantidade(idProduto, operacao) {
    const indice = listaFavoritos.findIndex((produto) => produto.codigo === String(idProduto));

    if (indice === -1) {
        return obterFavoritos();
    }

    const quantidadeAtual = listaFavoritos[indice].quantidade;
    const proximaQuantidade = operacao === 'somar'
        ? normalizarQuantidade(quantidadeAtual + 1)
        : normalizarQuantidade(quantidadeAtual - 1);

    if (operacao === 'somar' && quantidadeAtual >= proximaQuantidade) {
        return obterFavoritos();
    }

    if (operacao === 'subtrair' && quantidadeAtual <= 1) {
        return obterFavoritos();
    }

    listaFavoritos[indice].quantidade = proximaQuantidade;
    sincronizarLocalStorage();
    return obterFavoritos();
}

export function obterQuantidade(idProduto) {
    const favorito = buscarFavorito(idProduto);
    return favorito ? favorito.quantidade : 0;
}

export function atualizarPrecosFavoritos(produtosAtualizados) {
    const atualizadosPorCodigo = new Map(
        (Array.isArray(produtosAtualizados) ? produtosAtualizados : [])
            .map(normalizarProduto)
            .filter(Boolean)
            .map((produto) => [produto.codigo, produto])
    );

    listaFavoritos = listaFavoritos.map((favorito) => {
        const produtoAtualizado = atualizadosPorCodigo.get(favorito.codigo);

        if (!produtoAtualizado) {
            return favorito;
        }

        return normalizarFavorito({
            ...produtoAtualizado,
            quantidade: favorito.quantidade
        });
    }).filter(Boolean);

    sincronizarLocalStorage();
    return obterFavoritos();
}
