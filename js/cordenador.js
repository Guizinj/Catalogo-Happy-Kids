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
    const grid = document.getElementById('grid');
    const modalProduto = document.getElementById('modal-produto');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    const imgModal = document.getElementById('modal-img');
    const nomeModal = document.getElementById('modal-nome');
    const precoModal = document.getElementById('modal-preco');
    const parcelaModal = document.getElementById('modal-parcela');
    const descricaoModal = document.getElementById('modal-descricao');
    
    // Captura o botão do modal que você alterou no HTML
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');

    // Variável de controle: guarda o objeto do produto que está aberto na tela do usuário
    let produtoAtualNoModal = null;

    // Função auxiliar para mudar o texto do botão baseado no estado atual do produto
    function atualizarTextoBotaoModal() {
        if (!produtoAtualNoModal || !btnFavoritarModal) return;

        const jaEhFavorito = listaFavoritos.some(p => String(p.codigo) === String(produtoAtualNoModal.codigo));
        
        if (jaEhFavorito) {
            btnFavoritarModal.textContent = "Remover dos Favoritos";
            btnFavoritarModal.style.backgroundColor = "var(--logo-rosa)"; // Opcional: muda a cor para combinar
            btnFavoritarModal.style.color = "#ffffff";
        } else {
            btnFavoritarModal.textContent = "Adicionar aos Favoritos";
            btnFavoritarModal.style.backgroundColor = ""; // Volta para o estilo padrão do seu CSS
            btnFavoritarModal.style.color = "";
        }
    }

    grid.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('favorite') || evento.target.closest('.btn-header')) {
            return; 
        }

        const cardClicado = evento.target.closest('.card-produto');
        
        if (cardClicado) {
            const idProduto = cardClicado.getAttribute('data-id');
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);
            
            if (produtoSelecionado) {
                // Guarda o produto selecionado na nossa variável de controle antes de abrir
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

                // Atualiza o texto do botão (se vai abrir como Adicionar ou Remover)
                atualizarTextoBotaoModal();

                modalProduto.showModal();
            }
        }
    });

    // LÓGICA DE CLIQUE NO BOTÃO INTERNO DO MODAL
    if (btnFavoritarModal) {
        btnFavoritarModal.addEventListener('click', () => {
            if (!produtoAtualNoModal) return;

            const idProduto = produtoAtualNoModal.codigo;
            const indexFavorito = listaFavoritos.findIndex(p => String(p.codigo) === String(idProduto));
            
            // Captura o coração correspondente lá no grid de fundo (caso ele esteja visível na tela)
            const iconeCoracaoNoGrid = document.querySelector(`.card-produto[data-id="${idProduto}"] .favorite`);

            if (indexFavorito !== -1) {
                // Se já for favorito, remove da lista global
                listaFavoritos.splice(indexFavorito, 1);
                
                // Sincroniza: desliga o coração do card no fundo
                if (iconeCoracaoNoGrid) {
                    iconeCoracaoNoGrid.classList.remove('favoritado');
                }
            } else {
                // Se não for favorito, adiciona respeitando a regra da pílula (quantidade inicial 1)
                listaFavoritos.push({ ...produtoAtualNoModal, quantidade: 1 });
                
                // Sincroniza: acende o coração do card no fundo
                if (iconeCoracaoNoGrid) {
                    iconeCoracaoNoGrid.classList.add('favoritado');
                }
            }
            
            // Atualiza o localStorage, reconstrói o modal de lista e atualiza o coração do topo (navbar)
            salvarFavoritos(); 
            
            // Recalcula o texto do próprio botão interno do modal instantaneamente
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