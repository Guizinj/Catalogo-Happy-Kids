// =========================================
// BANCO DE DADOS LOCAL (CARRINHO/FAVORITOS)
// =========================================
// Estado em memória + persistência via localStorage.
// É a "fonte da verdade" dos favoritos — ui.js só desenha o que vem daqui,
// cordenador.js é quem decide QUANDO chamar cada função abaixo.

let listaFavoritos = [];


/**
 * Salva o estado atual de listaFavoritos no localStorage.
 * Função interna e privada deste arquivo — chamada por toda função
 * que altera listaFavoritos (alternarFavorito, removerFavorito, alterarQuantidade).
 */
function sincronizarLocalStorage() {
    localStorage.setItem('happyKidsFavoritos', JSON.stringify(listaFavoritos));
}


/**
 * Carrega os favoritos salvos no localStorage para a memória (listaFavoritos).
 *
 * Chamada por: cordenador.js → iniciarLoja()
 * (uma única vez, ao abrir a página, antes de renderizar a interface)
 */
export function carregarFavoritos() {
    const favoritosSalvos = localStorage.getItem('happyKidsFavoritos');
    if (favoritosSalvos) {
        listaFavoritos = JSON.parse(favoritosSalvos);
    }
    return listaFavoritos;
}


/**
 * Retorna a lista de favoritos atual (em memória).
 *
 * Chamada por: cordenador.js, em praticamente todo fluxo de favoritos
 *   - sincronizarInterfaceFavoritos() → repassa pra renderizarListaFavoritos(),
 *     favNavbar() e atualizarTotalFavoritos() em ui.js
 *   - configurarPesquisa() / configurarFiltroMagico() → repassa pra renderizarProdutos()
 *     em ui.js, pra saber quais corações marcar
 *   - configurarBotaoConsultar() → repassa pra enviarOrcamentoWhatsApp() em ui.js
 */
export function obterFavoritos() {
    return listaFavoritos;
}


/**
 * Verifica se um produto (pelo código) já está na lista de favoritos.
 *
 * Chamada por: ui.js → atualizarModalProdutoUI()
 * (recebida como parâmetro/callback, não importada diretamente — quem passa a
 * referência é cordenador.js → configurarModalProduto() → exibirDetalhes())
 */
export function verificarFavorito(idProduto) {
    return listaFavoritos.some(p => String(p.codigo) === String(idProduto));
}


/**
 * Busca o objeto completo de um favorito pelo código.
 *
 * Chamada por: cordenador.js → configurarModalProduto()
 * (ao clicar num mini-card dentro do modal de favoritos, pra abrir o modal de detalhes)
 */
export function buscarFavorito(idProduto) {
    return listaFavoritos.find(p => String(p.codigo) === String(idProduto));
}


/**
 * Adiciona ou remove um produto dos favoritos (toggle).
 * Se adicionar, entra com quantidade inicial 1.
 *
 * Chamada por: cordenador.js
 *   - configurarModalProduto() → clique no botão de favoritar dentro do modal de detalhes
 *   - configurarCliqueNoGrid() → clique no ícone de coração direto no card do grid
 *
 * Retorna: { listaAtualizada, foiAdicionado } → o chamador usa foiAdicionado
 * pra decidir qual toast mostrar (mostrarToast, em ui.js) e se abre o modal de favoritos
 */
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


/**
 * Remove um produto dos favoritos pelo código, sem toggle (remoção direta).
 *
 * Chamada por: cordenador.js → configurarEventosModalFavoritosConteudo()
 * (confirmação do modal #modal-confirmacao, disparada quando o usuário tenta
 * zerar a quantidade de um item pelo botão "menos")
 */
export function removerFavorito(idProduto) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
    if (index !== -1) {
        listaFavoritos.splice(index, 1);
        sincronizarLocalStorage();
    }
    return listaFavoritos;
}


/**
 * Soma ou subtrai 1 na quantidade de um favorito (mínimo 1 — não zera por aqui).
 *
 * Chamada por: cordenador.js → configurarEventosModalFavoritosConteudo()
 * (listeners de .btn-mais e .btn-menos dentro do modal de favoritos)
 * Nota: quando a quantidade chegaria a 0, quem decide é o cordenador.js,
 * que abre o modal de confirmação e chama removerFavorito() em vez desta função
 */
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


/**
 * Retorna a quantidade atual de um favorito (0 se não existir na lista).
 *
 * Chamada por: cordenador.js → configurarEventosModalFavoritosConteudo()
 * (usada antes de decidir se subtrai a quantidade ou abre o modal de confirmação)
 */
export function obterQuantidade(idProduto) {
    const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
    if (index !== -1) {
        return listaFavoritos[index].quantidade || 1;
    }
    return 0;
}


/**
 * Atualiza os favoritos já salvos com dados FRESCOS vindos do banco
 * (preço, nome, descrição, etc.) — sem adicionar nem remover nenhum favorito.
 *
 * Correção do bug do "preço congelado": até aqui, `alternarFavorito` salvava
 * uma FOTOGRAFIA do produto no momento de favoritar. Se o preço mudasse no
 * banco depois, essa fotografia continuava com o valor antigo pra sempre —
 * o cliente veria um preço errado no modal de favoritos e no orçamento do
 * WhatsApp. Esta função "revela" a fotografia de novo com os dados de hoje.
 *
 * Chamada por: cordenador.js → iniciarLoja()
 * (uma vez, ao carregar a página — não em tempo real, veja observação abaixo)
 *
 * Recebe: array de produtos atualizados (vindo de api.js → buscarProdutosPorCodigos)
 */
export function atualizarPrecosFavoritos(produtosAtualizados) {
    // Nada pra atualizar (sem favoritos, ou a busca no banco falhou/voltou vazia)?
    // Sai sem fazer nada — evita reescrever o localStorage à toa.
    if (!produtosAtualizados || produtosAtualizados.length === 0) {
        return listaFavoritos;
    }
 
    listaFavoritos = listaFavoritos.map(favorito => {
        // Procura, entre os produtos atualizados, a versão que bate com este favorito
        const versaoAtualizada = produtosAtualizados.find(
            p => String(p.codigo) === String(favorito.codigo)
        );
 
        // Achou a versão atual no banco? Usa os dados dela (preço, nome, etc.),
        // mas MANTÉM a quantidade que o cliente já tinha escolhido — a
        // quantidade é decisão do cliente, não vem do banco de produtos.
        if (versaoAtualizada) {
            return { ...versaoAtualizada, quantidade: favorito.quantidade };
        }
 
        // Produto não foi encontrado no banco (ex: foi excluído)?
        // Mantém o favorito como estava — decidir se remove ou não é
        // responsabilidade de outra parte do código, não desta função.
        return favorito;
    });
 
    sincronizarLocalStorage();
    return listaFavoritos;
}