import { buscarTodosOsProdutos, buscarProdutosPorNome } from "./api.js";
import { renderizarProdutos } from "./ui.js";

async function iniciarLoja() {
    try {
        const produtos = await buscarTodosOsProdutos();
        renderizarProdutos(produtos);
    }
    catch (erro) {
       console.error('Falha ao iniciar loja', erro);
    }
}

function configurarPesquisa() {
    const btnLupa = document.getElementById('lupa');
    const campoLupa = document.getElementById('campo-lupa');
    let tempo = null;
    async function executarBusca() {
        const valorCampoLupa = campoLupa.value.trim();

        if (valorCampoLupa === '') {
            const todosOsProdutos = await buscarTodosOsProdutos();
            renderizarProdutos(todosOsProdutos);
            return;
        }

        const produtosFiltrados = await buscarProdutosPorNome(valorCampoLupa);
        renderizarProdutos(produtosFiltrados);
    }

    btnLupa.addEventListener('click', executarBusca);
    campoLupa.addEventListener('input', () =>{
        clearTimeout(tempo);
        tempo = setTimeout(executarBusca, 300);
    });
}

document.addEventListener('DOMContentLoaded', () =>{
    iniciarLoja();
    configurarPesquisa();

});
