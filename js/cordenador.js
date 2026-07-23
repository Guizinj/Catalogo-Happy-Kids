import { buscarTodosOsProdutos, buscarProdutosPorNome, buscarProdutosPorFiltros } from "./api.js";

import { renderizarProdutos } from "./ui.js";

import { configurarModalMenu, configurarModalFavoritos, configurarModalMagic } from "./modais.js";

import { mensagensNoTopo } from "./banner.js";

import { converterFaixaDePreco } from "./filtros.js";



let produtosAtuais = [];

async function iniciarLoja() {
    try {
        const produtos = await buscarTodosOsProdutos();
        renderizarProdutos(produtos);
        produtosAtuais = produtos;
    }
    catch (erro) {
       console.error('Falha ao iniciar loja', erro);
    }
}



function configurarPesquisa() {
    const btnLupa = document.getElementById('lupa');
    const campoLupa = document.getElementById('campo-lupa');
    const modalMenu = document.getElementById('modal-menu');
    async function executarBusca() {
        const valorCampoLupa = campoLupa.value.trim();

        if (valorCampoLupa === '') {
            const todosOsProdutos = await buscarTodosOsProdutos();
            renderizarProdutos(todosOsProdutos);
            produtosAtuais = todosOsProdutos;
            return;
        }

        const produtosFiltrados = await buscarProdutosPorNome(valorCampoLupa);
        renderizarProdutos(produtosFiltrados);
        produtosAtuais = produtosFiltrados;

    };

    const formPesquisa = document.getElementById('form-pesquisa');

    formPesquisa.addEventListener('submit', (evento) => {
        evento.preventDefault(); 
        executarBusca();
        campoLupa.blur();
        setTimeout(() => {
            modalMenu.close();
            const gridProdutos = document.querySelector('.conteudo');
            if (gridProdutos) {
                gridProdutos.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'      
                });
            }
        }, 250); 
    });
}


function configurarFiltroMagico() {
    const formFiltro = document.getElementById('formFiltro');
    const modalMagic = document.getElementById('meuModal');

    formFiltro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dadosForm = new FormData(formFiltro);
        const idade = dadosForm.get('idade');
        const paraQuem = dadosForm.get('para_quem');
        const preco = dadosForm.get('preco');

        const faixaPreco = converterFaixaDePreco(preco);

        const filtros = {
            idade: Number(idade),
            genero: paraQuem,
            precoMinimo: faixaPreco.min,
            precoMaximo: faixaPreco.max
        };

        const produtosFiltrados = await buscarProdutosPorFiltros(filtros);
        renderizarProdutos(produtosFiltrados);
        produtosAtuais = produtosFiltrados;

        modalMagic.close();

        const gridProdutos = document.querySelector('.conteudo');
        if (gridProdutos) {
            gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}




/*======= ABRIR MODAL DE CADA PRODUTO =======*/
function configurarModalProduto() {
    const grid = document.getElementById('grid');
    const modalProduto = document.getElementById('modal-produto');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    const imgModal = document.getElementById('modal-img');
    const nomeModal = document.getElementById('modal-nome');
    const precoModal = document.getElementById('modal-preco');
    const parcelaModal = document.getElementById('modal-parcela');
    const descricaoModal = document.getElementById('modal-descricao');

    
    grid.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('favorite') || evento.target.closest('.btn-header')) {
            return; 
        }

        const cardClicado = evento.target.closest('.card-produto');
        
        if (cardClicado) {
            const idProduto = cardClicado.getAttribute('data-id');
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);
            
            if (produtoSelecionado) {
                imgModal.src = produtoSelecionado.imagem
                imgModal.alt = produtoSelecionado.nome;
                nomeModal.textContent = produtoSelecionado.nome;
                precoModal.textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
                
                if(produtoSelecionado.preco > 100){
                const valorParcela = (produtoSelecionado.preco / 10).toFixed(2);
                parcelaModal.textContent = `ou até 10x de R$ ${valorParcela} sem juros`;
                } else {
                parcelaModal.textContent = 'pagamento avista'; 
                };
                
                descricaoModal.textContent = produtoSelecionado.descricao || "Descrição não informada.";

                modalProduto.showModal();
            }
        }
    });
    btnFecharModal.addEventListener('click', () => {
        modalProduto.close();
    });
}


     /* BOTÃO DE FAVORITO DOS CARDS*/
const grid = document.getElementById('grid');

grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite')) {
        const jaFavoritado = e.target.classList.contains('favoritado');
        const mensagem = jaFavoritado 
            ? 'Deseja remover este brinquedo dos favoritos? ' 
            : 'Deseja adicionar este brinquedo aos favoritos? ';
        const confirmacao = confirm(mensagem);
        if (confirmacao) {
            e.target.classList.toggle('favoritado');
        }
    }
});


/* INICIALIZAÇÃO */
document.addEventListener('DOMContentLoaded', () => {
    iniciarLoja();
    configurarPesquisa();
    configurarModalProduto(); 
    configurarModalFavoritos();
    configurarModalMagic();
    configurarModalMenu();
    mensagensNoTopo();
    configurarFiltroMagico();
});