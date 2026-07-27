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


function ocultarLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.add('oculto');
        // Remove do DOM após a animação acabar para liberar memória
        setTimeout(() => {
            loader.remove();
        }, 400);
    }
}


async function iniciarLoja() {
    try {
        paginaAtual = 0;
        
        // Executa a busca da API e a trava de 4 segundos em paralelo
        const [produtos] = await Promise.all([
            buscarTodosOsProdutos(paginaAtual, limitePorPagina),
            new Promise(resolve => setTimeout(resolve, 100)) // Trava exata de 4 segundos
        ]);

        renderizarProdutos(produtos, false, listaFavoritos);
        produtosAtuais = produtos;
        carregarFavoritos();

        controlarVisibilidadeBotaoPaginacao(true);
        
        // Agora o loader some com tudo 100% renderizado e sem nenhum flash de texto!
        ocultarLoader();
    }
    catch (erro) {
        console.error('Falha ao iniciar loja', erro);
        ocultarLoader();
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
        modalMenu.close();
        setTimeout(() => {
    
            const gridProdutos = document.querySelector('.conteudo');
            if (gridProdutos) {
                gridProdutos.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'      
                });
            }
        }, 1000); 
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
                mostrarToast('Item removido dos favoritos', 'removido');
            } else {
                listaFavoritos.push({ ...produtoAtualNoModal, quantidade: 1 });
                if (iconeCoracaoNoGrid) iconeCoracaoNoGrid.classList.add('favoritado');
                mostrarToast('Item adicionado aos favoritos', 'sucesso');
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
                mostrarToast('Item removido dos favoritos', 'removido');
            } else {
                // Se não for, adiciona o objeto completo na array e põe a classe
                listaFavoritos.push({...produtoSelecionado, quantidade:1});
                e.target.classList.add('favoritado');
                mostrarToast('Item adicionado aos favoritos', 'sucesso');
            }
            
            salvarFavoritos(); // Sincroniza com o localStorage e o Modal
        }
    }
});

/* EXCLUIR E ALTERAR QUANTIDADE PELO MODAL COM CONFIRMAÇÃO */
function configurarEventosModalFavoritosConteudo() {
    // Injeta o HTML do modal de confirmação no documento caso ele não exista
    if (!document.getElementById('modal-confirmacao')) {
        const dialogHTML = `
            <dialog id="modal-confirmacao">
                <div class="conteudo-confirmacao">
                    <h3>Remover Favorito</h3>
                    <p>Deseja realmente remover este brinquedo dos seus favoritos?</p>
                    <div class="botoes-confirmacao">
                        <button id="btn-cancelar-remocao">Cancelar</button>
                        <button id="btn-confirmar-remocao">Sim, remover</button>
                    </div>
                </div>
            </dialog>
        `;
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }

    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const btnCancelar = document.getElementById('btn-cancelar-remocao');
    const btnConfirmar = document.getElementById('btn-confirmar-remocao');

    let idProdutoPendente = null;

    // Ação do botão Cancelar do pop-up
    btnCancelar.addEventListener('click', () => {
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    // Ação do botão Confirmar Remoção do pop-up
    btnConfirmar.addEventListener('click', () => {
        if (idProdutoPendente) {
            const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProdutoPendente));
            
            if (index !== -1) {
                listaFavoritos.splice(index, 1);
                
                // Sincronização: apaga o coração do grid de fundo
                const iconeCoracao = document.querySelector(`.card-produto[data-id="${idProdutoPendente}"] .favorite`);
                if (iconeCoracao) {
                    iconeCoracao.classList.remove('favoritado');
                }
                
                salvarFavoritos();
                mostrarToast('Item removido dos favoritos', 'removido');
            }
        }
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    // Ouvinte global para os cliques dentro do modal de favoritos
    document.addEventListener('click', (e) => {
        
        // --- SE CLICAR NO BOTÃO DE MENOS (-) ---
        const btnMenos = e.target.closest('.btn-menos');
        if (btnMenos) {
            const cardMini = btnMenos.closest('.card-favorito-mini');
            const idProduto = cardMini.getAttribute('data-id');
            const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            
            if (index !== -1) {
                // Se a quantidade for maior que 1, apenas subtrai normalmente
                if (listaFavoritos[index].quantidade > 1) {
                    listaFavoritos[index].quantidade--;
                    salvarFavoritos();
                } else {
                    // Se a quantidade for 1, segura a exclusão e abre o pop-up de confirmação
                    idProdutoPendente = idProduto;
                    modalConfirmacao.showModal();
                }
            }
        }

        // --- SE CLICAR NO BOTÃO DE MAIS (+) ---
        const btnMais = e.target.closest('.btn-mais');
        if (btnMais) {
            const cardMini = btnMais.closest('.card-favorito-mini');
            const idProduto = cardMini.getAttribute('data-id');
            const index = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            
            if (index !== -1) {
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

/* =========================================
   FUNÇÃO GLOBAL DE TOAST
========================================= */
function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remove qualquer toast anterior para evitar duplicação na tela
    const toastAntigo = document.getElementById('toast-feedback');
    if (toastAntigo) {
        toastAntigo.remove();
    }
    
    // Cria o novo elemento do toast
    const toast = document.createElement('div');
    toast.id = 'toast-feedback';
    toast.className = `mostrar ${tipo}`;
    toast.textContent = mensagem;

    // DETECÇÃO DE TOP LAYER: Se houver um modal (<dialog>) aberto na tela, 
    // injetamos o toast dentro dele para que ele fique visível na frente do modal.
    const dialogAberto = document.querySelector('dialog[open]');
    
    if (dialogAberto) {
        dialogAberto.appendChild(toast);
    } else {
        document.body.appendChild(toast);
    }

    // Reseta o timer e remove o toast após 3 segundos com animação limpa
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300); // Tempo correspondente à transição do CSS
    }, 500);
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