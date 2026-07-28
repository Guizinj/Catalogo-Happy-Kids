import { configurarGestosGaleria } from './gestos.js';
import { URL_BUCKET_PRODUTOS } from "./config.js";
import { buscarTodosOsProdutos, buscarProdutosPorNome, buscarProdutosPorFiltros } from "./api.js";
import { renderizarListaFavoritos, renderizarProdutos, controlarVisibilidadeBotaoPaginacao, ocultarLoader, favNavbar, atualizarTotalFavoritos, mostrarToast, enviarOrcamentoWhatsApp } from "./ui.js";
import { configurarModalMenu, configurarModalFavoritos, configurarModalMagic } from "./modais.js";
import { mensagensNoTopo } from "./banner.js";

// IMPORT DO NOVO MÓDULO DE DADOS
import { carregarFavoritos, obterFavoritos, verificarFavorito, buscarFavorito, alternarFavorito, removerFavorito, alterarQuantidade, obterQuantidade } from "./storage.js";

/* ESTADOS GLOBAIS DA PÁGINA ATUAL */
let produtosAtuais = [];
let paginaAtual = 0;
const limitePorPagina = 14;

/* PONTE DE COMUNICAÇÃO: DADOS -> UI */
function sincronizarInterfaceFavoritos() {
    const lista = obterFavoritos();
    renderizarListaFavoritos(lista);
    favNavbar(lista.length);
    atualizarTotalFavoritos(lista);
}

/* ORQUESTRAÇÃO DE INICIALIZAÇÃO */
async function iniciarLoja() {
    try {
        paginaAtual = 0;
        const [produtos] = await Promise.all([
            buscarTodosOsProdutos(paginaAtual, limitePorPagina),
            new Promise(resolve => setTimeout(resolve, 100)) 
        ]);

        produtosAtuais = produtos;
        
        // Puxa a memória local
        carregarFavoritos();
        
        // Renderiza tudo injetando os favoritos para a verificação de corações ativos
        renderizarProdutos(produtosAtuais, false, obterFavoritos());
        sincronizarInterfaceFavoritos();
        
        controlarVisibilidadeBotaoPaginacao(true);
        ocultarLoader();
    } catch (erro) {
        console.error('Falha ao iniciar loja', erro);
        ocultarLoader();
    }
}

async function carregarProximaPagina() {
    try {
        paginaAtual++;
        const novosProdutos = await buscarTodosOsProdutos(paginaAtual, limitePorPagina);

        if (novosProdutos.length > 0) {
            produtosAtuais = produtosAtuais.concat(novosProdutos);
            renderizarProdutos(novosProdutos, true, obterFavoritos());
        } else {
            controlarVisibilidadeBotaoPaginacao(false);
        }
    } catch (erro) {
        console.error('Falha ao carregar próxima página', erro);
    }
}

function configurarProximaPagina() {
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');
    if (btnProximaPagina) {
        btnProximaPagina.addEventListener('click', carregarProximaPagina);
    }
}

/* FILTROS E BUSCAS */
function configurarPesquisa() {
    const campoLupa = document.getElementById('campo-lupa');
    const modalMenu = document.getElementById('modal-menu');
    const formPesquisa = document.getElementById('form-pesquisa');

    formPesquisa.addEventListener('submit', async (evento) => {
        evento.preventDefault(); 
        const valorCampoLupa = campoLupa.value.trim();
        
        if (valorCampoLupa === '') {
            campoLupa.placeholder = 'Digite algo para buscar!';
            campoLupa.focus();
            return; 
        }

        produtosAtuais = await buscarProdutosPorNome(valorCampoLupa);
        renderizarProdutos(produtosAtuais, false, obterFavoritos());
        controlarVisibilidadeBotaoPaginacao(false);

        campoLupa.blur();
        modalMenu.close();
        
        setTimeout(() => {
            const gridProdutos = document.querySelector('.conteudo');
            if (gridProdutos) gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1000); 
    });
}

function configurarFiltroMagico() {
    const formFiltro = document.getElementById('formFiltro');
    const modalMagic = document.getElementById('meuModal');

    formFiltro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosForm = new FormData(formFiltro);
        
        const filtros = {
            idade: Number(dadosForm.get('idade')),
            genero: dadosForm.get('para_quem'),
        };

        produtosAtuais = await buscarProdutosPorFiltros(filtros);
        renderizarProdutos(produtosAtuais, false, obterFavoritos());
        controlarVisibilidadeBotaoPaginacao(false);
        modalMagic.close();

        const gridProdutos = document.querySelector('.conteudo');
        if (gridProdutos) gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

/* EVENTOS DE MODAL DE PRODUTO */
function configurarModalProduto() {
    const modalProduto = document.getElementById('modal-produto');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');
    let produtoAtualNoModal = null;

    function atualizarTextoBotaoModal() {
        if (!produtoAtualNoModal || !btnFavoritarModal) return;
        
        // Verifica no storage se o item está salvo
        const jaEhFavorito = verificarFavorito(produtoAtualNoModal.codigo);
        
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

    function exibirDetalhes(produtoSelecionado) {
        produtoAtualNoModal = produtoSelecionado;
        const containerMiniaturas = document.getElementById('miniaturas');
        containerMiniaturas.innerHTML = '';
        const imagemPrincipal = document.getElementById('modal-img');
        const imagensDosProdutos = [];
        let imagemAtual = 0
        imagemPrincipal.src = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_1.webp`;
        imagemPrincipal.alt = produtoSelecionado.nome;
        for(let i = 1 ; i <= 3 ; i++){
            const urlImagem = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_${i}.webp`;
            const miniatura = document.createElement('img');
            miniatura.src = urlImagem;
            miniatura.alt = produtoSelecionado.nome;
            if (i === 1) {
                miniatura.classList.add('ativa');
            }
             miniatura.onload = () => {
                imagensDosProdutos.push(urlImagem);
                containerMiniaturas.appendChild(miniatura);
            };
            miniatura.addEventListener('click', () =>{
                imagemPrincipal.src = urlImagem;
                document.querySelectorAll('#miniaturas img').forEach(img => img.classList.remove('ativa'));
                miniatura.classList.add('ativa');
            })
        };
            
        configurarGestosGaleria(imagemPrincipal, imagensDosProdutos);

        document.getElementById('modal-nome').textContent = produtoSelecionado.nome;
        document.getElementById('modal-preco').textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
        
        const parcelaModal = document.getElementById('modal-parcela');
        if(produtoSelecionado.preco > 100){
            parcelaModal.textContent = `ou 2x de R$ ${(produtoSelecionado.preco / 2).toFixed(2)} sem juros`;
        } 
        else if(produtoSelecionado.preco > 200 ){
             parcelaModal.textContent = `ou até 3x de R$ ${(produtoSelecionado.preco / 3).toFixed(2)} sem juros`;
        }
        else {
            parcelaModal.textContent = 'pagamento à vista ou em 1x no crtão'; 
        }
        
        document.getElementById('modal-descricao').textContent = produtoSelecionado.descricao || "Descrição não informada.";
        atualizarTextoBotaoModal();
        modalProduto.showModal();
    }

    // Abertura do Modal via Delegação de Eventos
    document.addEventListener('click', (evento) => {
        const cardClicado = evento.target.closest('.card-produto');
        if (cardClicado) {
            if (evento.target.classList.contains('favorite') || evento.target.closest('.btn-header')) return; 
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == cardClicado.getAttribute('data-id'));
            if (produtoSelecionado) exibirDetalhes(produtoSelecionado);
            return; 
        }

        const miniCardClicado = evento.target.closest('.card-favorito-mini');
        if (miniCardClicado) {
            if (evento.target.closest('.pilula-quantidade') || evento.target.closest('.btn-remover-favorito')) return;
            const produtoSelecionado = buscarFavorito(miniCardClicado.getAttribute('data-id'));
            if (produtoSelecionado) exibirDetalhes(produtoSelecionado);
        }
    });

    // Ação do Botão Interno
    if (btnFavoritarModal) {
        btnFavoritarModal.addEventListener('click', () => {
            if (!produtoAtualNoModal) return;
            
            const { foiAdicionado } = alternarFavorito(produtoAtualNoModal);
            const iconeCoracaoNoGrid = document.querySelector(`.card-produto[data-id="${produtoAtualNoModal.codigo}"] .favorite`);

            if (foiAdicionado) {
                if (iconeCoracaoNoGrid) iconeCoracaoNoGrid.classList.add('favoritado');
                mostrarToast('Item adicionado aos favoritos', 'sucesso');
            } else {
                if (iconeCoracaoNoGrid) iconeCoracaoNoGrid.classList.remove('favoritado');
                mostrarToast('Item removido dos favoritos', 'removido');
            }
            
            sincronizarInterfaceFavoritos(); 
            atualizarTextoBotaoModal();
        });
    }

    btnFecharModal.addEventListener('click', () => modalProduto.close());
}

/* EVENTOS DE FAVORITOS (GRID E CARRINHO) */
const grid = document.getElementById('grid');
grid.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite')) {
        const idProduto = e.target.closest('.card-produto').getAttribute('data-id');
        const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);

        if (produtoSelecionado) {
            const { foiAdicionado } = alternarFavorito(produtoSelecionado);
            
            if (foiAdicionado) {
                e.target.classList.add('favoritado');
                mostrarToast('Item adicionado aos favoritos', 'sucesso');
            } else {
                e.target.classList.remove('favoritado');
                mostrarToast('Item removido dos favoritos', 'removido');
            }
            
            sincronizarInterfaceFavoritos();
        }
    }
});

function configurarEventosModalFavoritosConteudo() {
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
    let idProdutoPendente = null;

    document.getElementById('btn-cancelar-remocao').addEventListener('click', () => {
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    document.getElementById('btn-confirmar-remocao').addEventListener('click', () => {
        if (idProdutoPendente) {
            removerFavorito(idProdutoPendente);
            const iconeCoracao = document.querySelector(`.card-produto[data-id="${idProdutoPendente}"] .favorite`);
            if (iconeCoracao) iconeCoracao.classList.remove('favoritado');
            sincronizarInterfaceFavoritos();
            mostrarToast('Item removido dos favoritos', 'removido');
        }
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    document.addEventListener('click', (e) => {
        const btnMenos = e.target.closest('.btn-menos');
        if (btnMenos) {
            const idProduto = btnMenos.closest('.card-favorito-mini').getAttribute('data-id');
            const qtdAtual = obterQuantidade(idProduto);
            
            if (qtdAtual > 1) {
                alterarQuantidade(idProduto, 'subtrair');
                sincronizarInterfaceFavoritos();
            } else if (qtdAtual === 1) {
                idProdutoPendente = idProduto;
                modalConfirmacao.showModal();
            }
        }

        const btnMais = e.target.closest('.btn-mais');
        if (btnMais) {
            const idProduto = btnMais.closest('.card-favorito-mini').getAttribute('data-id');
            alterarQuantidade(idProduto, 'somar');
            sincronizarInterfaceFavoritos();
        }
    });

   
}

function configurarBotaoConsultar() {
    const btnConsultar = document.getElementById('btn-consultar-favoritos');
    if (btnConsultar) {
        btnConsultar.addEventListener('click', () => enviarOrcamentoWhatsApp(obterFavoritos()));
    }
}

/* INICIALIZAÇÃO GERAL */
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
    configurarBotaoConsultar();
});
