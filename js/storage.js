// =========================================
// BANCO DE DADOS LOCAL (CARRINHO/FAVORITOS)
// =========================================

let listaFavoritos = [];

// Função interna e privada deste arquivo
function sincronizarLocalStorage() {
    localStorage.setItem('happyKidsFavoritos', JSON.stringify(listaFavoritos));
}

export function carregarFavoritos() {
    const favoritosSalvos = localStorage.getItem('happyKidsFavoritos');
    if (favoritosSalvos) {
        listaFavoritos = JSON.parse(favoritosSalvos);
    }
    return listaFavoritos;
}

export function obterFavoritos() {
    return listaFavoritos;
}

export function verificarFavorito(idProduto) {
    return listaFavoritos.some(p => String(p.codigo) === String(idProduto));
}

export function buscarFavorito(idProduto) {
    return listaFavoritos.find(p => String(p.codigo) === String(idProduto));
}

export function alternarFavorito(produto) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(produto.codigo));
    let foiAdicionado = false;

    if (index !== -1) {
        listaFavoritos.splice(index, 1); // Se tem, remove
    } else {
        listaFavoritos.push({ ...produto, quantidade: 1 }); // Se não tem, adiciona
        foiAdicionado = true;
    }

    sincronizarLocalStorage();
    return { listaAtualizada: listaFavoritos, foiAdicionado };
}

export function removerFavorito(idProduto) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
    if (index !== -1) {
        listaFavoritos.splice(index, 1);
        sincronizarLocalStorage();
    }
    return listaFavoritos;
}

export function alterarQuantidade(idProduto, operacao) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
    
    if (index !== -1) {
        if (operacao === 'somar') {
            listaFavoritos[index].quantidade = (listaFavoritos[index].quantidade || 1) + 1;
        } else if (operacao === 'subtrair' && listaFavoritos[index].quantidade > 1) {
            listaFavoritos[index].quantidade--;
        }
        sincronizarLocalStorage();
    }
    return listaFavoritos;
}

export function obterQuantidade(idProduto) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
    if (index !== -1) {
        return listaFavoritos[index].quantidade || 1;
    }
    return 0;
}