import { buscarTodosOsProdutos, buscarProdutosPorNome, buscarProdutosPorFiltros } from "./api.js";

import { renderizarListaFavoritos, renderizarProdutos } from "./ui.js";

import { configurarModalMenu, configurarModalFavoritos, configurarModalMagic } from "./modais.js";

import { mensagensNoTopo } from "./banner.js";




let produtosAtuais = [];
let paginaAtual = 0;
const limitePorPagina = 20;
let listaFavoritos = [];

function controlarVisibilidadeBotaoPaginacao(deveMostrar) {
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');
    if (btnProximaPagina) {
        btnProximaPagina.style.display = deveMostrar ? 'inline-block' : 'none';
    }
}

function carregarFavoritos(){
    const favoritosSalvos = localStorage.getItem('happyKidsFavoritos');
    if(favoritosSalvos){
        listaFavoritos = JSON.parse(favoritosSalvos);
    }
    renderizarListaFavoritos(listaFavoritos);
    favNavbar()
    
}

function salvarFavoritos(){
    localStorage.setItem('happyKidsFavoritos', JSON.stringify(listaFavoritos));

    renderizarListaFavoritos(listaFavoritos);
    favNavbar();
}

async function iniciarLoja() {
    try {
        carregarFavoritos();
        paginaAtual = 0;
        const produtos = await buscarTodosOsProdutos(paginaAtual, limitePorPagina);
        renderizarProdutos(produtos, false, listaFavoritos);
        produtosAtuais = produtos;

        controlarVisibilidadeBotaoPaginacao(true);
    }
    catch (erro) {
       console.error('Falha ao iniciar loja', erro);
    }
}

async function carregarProximaPagina() {
    try {
        paginaAtual++;

        const novosProdutos = await buscarTodosOsProdutos(paginaAtual, limitePorPagina);

        if(novosProdutos.length > 0){
            renderizarProdutos(novosProdutos, true, listaFavoritos);
            produtosAtuais = produtosAtuais.concat(novosProdutos);
        }
        else{
            controlarVisibilidadeBotaoPaginacao(false)
        }
    }
     catch (erro) {
        console.error('Falha ao carregar próxima página', erro);
    }
}

function configurarProximaPagina(){
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');

    if(btnProximaPagina){
        btnProximaPagina.addEventListener('click', () =>{
            carregarProximaPagina();
        });
    }
}



function configurarPesquisa() {
    const btnLupa = document.getElementById('lupa');
    const campoLupa = document.getElementById('campo-lupa');
    const modalMenu = document.getElementById('modal-menu');
    async function executarBusca() {
        const valorCampoLupa = campoLupa.value.trim();
        const produtosFiltrados = await buscarProdutosPorNome(valorCampoLupa);
        renderizarProdutos(produtosFiltrados, false, listaFavoritos);
        produtosAtuais = produtosFiltrados;

        controlarVisibilidadeBotaoPaginacao(false);

    };

    const formPesquisa = document.getElementById('form-pesquisa');

    formPesquisa.addEventListener('submit', (evento) => {
        evento.preventDefault(); 
        const valorCampoLupa = campoLupa.value.trim();
        if (valorCampoLupa === '') {
            campoLupa.placeholder = 'Digite algo para buscar!';
            campoLupa.focus();
            return; 
        };

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

        const filtros = {
            idade: Number(idade),
            genero: paraQuem,
        };

        const produtosFiltrados = await buscarProdutosPorFiltros(filtros);
        renderizarProdutos(produtosFiltrados, false, listaFavoritos);
        produtosAtuais = produtosFiltrados;
        
        controlarVisibilidadeBotaoPaginacao(false)

        modalMagic.close();

        const gridProdutos = document.querySelector('.conteudo');
        if (gridProdutos) {
            gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}


/*======= ABRIR E CONTROLAR MODAL DE CADA PRODUTO =======*/
function configurarModalProduto() {
    const modalProduto = document.getElementById('modal-produto');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    const imgModal = document.getElementById('modal-img');
    const nomeModal = document.getElementById('modal-nome');
    const precoModal = document.getElementById('modal-preco');
    const parcelaModal = document.getElementById('modal-parcela');
    const descricaoModal = document.getElementById('modal-descricao');
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');

    let produtoAtualNoModal = null;

    function atualizarTextoBotaoModal() {
        if (!produtoAtualNoModal || !btnFavoritarModal) return;

        const jaEhFavorito = listaFavoritos.some(p => String(p.codigo) === String(produtoAtualNoModal.codigo));
        
        if (jaEhFavorito) {
            btnFavoritarModal.textContent = "Remover dos Favoritos";
            btnFavoritarModal.style.backgroundColor = "var(--logo-rosa)";
            btnFavoritarModal.style.color = "#ffffff";
        } else {
            btnFavoritarModal.textContent = "Adicionar aos Favoritos";
            btnFavoritarModal.style.backgroundColor = ""; 
            btnFavoritarModal.style.color = "";
        }
    }

    // NOVA ROTINA: Função encapsulada para não repetir código ao abrir o modal
    function exibirDetalhes(produtoSelecionado) {
        produtoAtualNoModal = produtoSelecionado;

        imgModal.src = produtoSelecionado.imagem;
        imgModal.alt = produtoSelecionado.nome;
        nomeModal.textContent = produtoSelecionado.nome;
        precoModal.textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
        
        if(produtoSelecionado.preco > 100){
            const valorParcela = (produtoSelecionado.preco / 10).toFixed(2);
            parcelaModal.textContent = `ou até 10x de R$ ${valorParcela} sem juros`;
        } else {
            parcelaModal.textContent = 'pagamento à vista'; 
        }
        
        descricaoModal.textContent = produtoSelecionado.descricao || "Descrição não informada.";

        atualizarTextoBotaoModal();
        modalProduto.showModal();
    }

    // DELEGAÇÃO GLOBAL DE CLIQUES PARA ABRIR O MODAL
    document.addEventListener('click', (evento) => {
        
        // 1. Se clicou no GRID PRINCIPAL (Cards Grandes)
        const cardClicado = evento.target.closest('.card-produto');
        if (cardClicado) {
            // Ignora se clicou no coração para não dar conflito
            if (evento.target.classList.contains('favorite') || evento.target.closest('.btn-header')) return; 

            const idProduto = cardClicado.getAttribute('data-id');
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);
            
            if (produtoSelecionado) {
                exibirDetalhes(produtoSelecionado);
            }
            return; // Encerra a verificação
        }

        // 2. Se clicou no MINI CARD DE FAVORITOS (O "Buraco" consertado!)
        const miniCardClicado = evento.target.closest('.card-favorito-mini');
        if (miniCardClicado) {
            // SEGURANÇA: Ignora se clicou na pílula de quantidade (+ / - / Lixeira)
            if (evento.target.closest('.pilula-quantidade') || evento.target.closest('.btn-remover-favorito')) {
                return;
            }

            const idProduto = miniCardClicado.getAttribute('data-id');
            // Busca os dados diretamente da memória de favoritos
            const produtoSelecionado = listaFavoritos.find(p => String(p.codigo) === String(idProduto));
            
            if (produtoSelecionado) {
                exibirDetalhes(produtoSelecionado);
            }
            return;
        }
    });

    // LÓGICA DE CLIQUE NO BOTÃO INTERNO DO MODAL (Sem alterações)
    if (btnFavoritarModal) {
        btnFavoritarModal.addEventListener('click', () => {
            if (!produtoAtualNoModal) return;

            const idProduto = produtoAtualNoModal.codigo;
            const indexFavorito = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            const iconeCoracaoNoGrid = document.querySelector(`.card-produto[data-id="${idProduto}"] .favorite`);

            if (indexFavorito !== -1) {
                listaFavoritos.splice(indexFavorito, 1);
                if (iconeCoracaoNoGrid) iconeCoracaoNoGrid.classList.remove('favoritado');
            } else {
                listaFavoritos.push({ ...produtoAtualNoModal, quantidade: 1 });
                if (iconeCoracaoNoGrid) iconeCoracaoNoGrid.classList.add('favoritado');
            }
            
            salvarFavoritos(); 
            atualizarTextoBotaoModal();
        });
    }

    btnFecharModal.addEventListener('click', () => {
        modalProduto.close();
    });
}


     /* BOTÃO DE FAVORITO DOS CARDS*/
const grid = document.getElementById('grid');
/* BOTÃO DE FAVORITO DOS CARDS NO GRID PRINCIPAL */
grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite')) {
        const cardClicado = e.target.closest('.card-produto');
        const idProduto = cardClicado.getAttribute('data-id');
        const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);

        if (produtoSelecionado) {
            // Verifica se já existe na lista
            const indexFavorito = listaFavoritos.findIndex(p => p.codigo == idProduto);
            
            if (indexFavorito !== -1) {
                // Se já for favorito, tira da array e remove a classe
                listaFavoritos.splice(indexFavorito, 1);
                e.target.classList.remove('favoritado');
            } else {
                // Se não for, adiciona o objeto completo na array e põe a classe
                listaFavoritos.push({...produtoSelecionado, quantidade:1});
                e.target.classList.add('favoritado');
            }
            
            salvarFavoritos(); // Sincroniza com o localStorage e o Modal
        }
    }
});

/* EXCLUIR E ALTERAR QUANTIDADE PELO MODAL */
function configurarEventosModalFavoritosConteudo() {
    document.addEventListener('click', (e) => {
        
        // --- SE CLICAR NO BOTÃO DE MENOS (-) ---
        const btnMenos = e.target.closest('.btn-menos');
        if (btnMenos) {
            const cardMini = btnMenos.closest('.card-favorito-mini');
            const idProduto = cardMini.getAttribute('data-id');
            const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            
            if (index !== -1) {
                // Se a quantidade atual for maior que 1, apenas subtrai
                if (listaFavoritos[index].quantidade > 1) {
                    listaFavoritos[index].quantidade--;
                } else {
                    // Se a quantidade for 1, o próximo clique remove o item
                    listaFavoritos.splice(index, 1);
                    
                    // Sincronização: apaga o coração do grid de fundo
                    const iconeCoracao = document.querySelector(`.card-produto[data-id="${idProduto}"] .favorite`);
                    if (iconeCoracao) {
                        iconeCoracao.classList.remove('favoritado');
                    }
                }
                salvarFavoritos(); // Salva e recarrega o modal na mesma hora
            }
        }

        // --- SE CLICAR NO BOTÃO DE MAIS (+) ---
        const btnMais = e.target.closest('.btn-mais');
        if (btnMais) {
            const cardMini = btnMais.closest('.card-favorito-mini');
            const idProduto = cardMini.getAttribute('data-id');
            const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            
            if (index !== -1) {
                // Soma +1 na quantidade (garantindo que se for antigo, parta de 1)
                listaFavoritos[index].quantidade = (listaFavoritos[index].quantidade || 1) + 1;
                salvarFavoritos();
            }
        }
    });
}

function favNavbar(){
    const btnFavorite = document.getElementById('btn-favorite');

    if(btnFavorite){
        btnFavorite.classList.toggle('favoritado', listaFavoritos.length > 0);
    }
}

/* INICIALIZAÇÃO */
document.addEventListener('DOMContentLoaded', () => {
    iniciarLoja();
    configurarPesquisa();
    configurarModalProduto(); 
    configurarModalFavoritos();
    configurarEventosModalFavoritosConteudo();
    configurarModalMagic();
    configurarModalMenu();
    mensagensNoTopo();
    configurarFiltroMagico();
    configurarProximaPagina();
});