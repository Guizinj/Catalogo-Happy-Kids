import { URL_BUCKET_PRODUTOS } from "./config.js";
import { configurarGestosGaleria } from './gestos.js';


/**
 * Renderiza os cards de produto no grid principal da loja.
 * Pode substituir o grid inteiro ou apenas acrescentar (paginação).
 *
 * Chamada por: cordenador.js
 *   - iniciarLoja() → primeira renderização (deveAcrescentar = false)
 *   - carregarProximaPagina() → acrescenta itens (deveAcrescentar = true)
 *   - configurarPesquisa() → resultado da busca por nome
 *   - configurarFiltroMagico() → resultado do filtro de idade/gênero
 *
 * Recebe: produtosAtuais (vindo de api.js) + obterFavoritos() (vindo de storage.js)
 * para saber quais corações já devem aparecer marcados.
 */
export function renderizarProdutos(listaDeProdutos, deveAcrescentar = false, listaFavoritos = []) {
    const grid = document.getElementById('grid');

    if (listaDeProdutos.length === 0) {
        if (!deveAcrescentar) {
            grid.textContent = 'Nenhum produto encontrado na loja';
        }
        return;
    }

    const htmlCards = listaDeProdutos.map(produto => {
        // Verifica se o produto atual existe na array de favoritos
        const ehFavorito = listaFavoritos.some(fav => fav.codigo == produto.codigo);
        const classeFavorito = ehFavorito ? 'favoritado' : '';
        const imagem = `${URL_BUCKET_PRODUTOS}${produto.codigo}_1.webp`;

        return `
            <div class="card-produto" data-id="${produto.codigo}">
                <img class="img-card" src="${imagem}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
                <button class="btn-comprar">Ver detalhes</button>
                <button class="btn-header"><span class="material-symbols-outlined favorite ${classeFavorito}">favorite</span></button>
            </div>
        `;
    }).join('');

    if (deveAcrescentar) {
        grid.insertAdjacentHTML('beforeend', htmlCards);
    } else {
        grid.innerHTML = htmlCards;
    }
}


/**
 * Desenha os itens dentro do modal de favoritos.
 * Se a lista estiver vazia, mostra o "empty state" (ursinho triste).
 *
 * Chamada por: cordenador.js → sincronizarInterfaceFavoritos()
 * (disparada toda vez que a lista de favoritos muda: adicionar, remover, alterar quantidade)
 *
 * Recebe: obterFavoritos() vindo de storage.js
 * Dispara: clique em "Explorar brinquedos" fecha #dialog-favorite e rola até .conteudo
 */
export function renderizarListaFavoritos(favoritos = []) {
    const containerFavoritos = document.querySelector('.modal-favoritos-conteudo');
    const footerFav = document.querySelector('.footer-modal-favoritos');

    if (favoritos.length === 0) {
        footerFav.style.display = 'none';

        containerFavoritos.innerHTML = `
            <div class="empty-state-favoritos" id="empty-state">
                <div class="ilustracao-ursinho">
                    <span class="material-symbols-outlined">sentiment_dissatisfied</span>
                </div>
                <h3 class="titulo-empty">Seu coração está vazio!</h3>
                <p class="texto-empty">Você ainda não escolheu nenhum brinquedo favorito para a sua criança.</p>
                <button class="btn-explorar" id="btn-explorar-favoritos">Explorar brinquedos</button>
            </div>
        `;

        const btnExplorar = document.getElementById('btn-explorar-favoritos');
        if (btnExplorar) {
            btnExplorar.addEventListener('click', () => {
                document.getElementById('dialog-favorite').close();

                const gridProdutos = document.querySelector('.conteudo');
                if (gridProdutos) {
                    gridProdutos.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        return;
    }

    const htmlFavoritos = favoritos.map(produto => {
        const qtd = produto.quantidade || 1;
        const imagem = `${URL_BUCKET_PRODUTOS}${produto.codigo}_1.webp`;

        return `
            <div class="card-favorito-mini" data-id="${produto.codigo}">
                <img class="img-favorito-mini" src="${imagem}" alt="${produto.nome}">

                <div class="info-favorito-mini">
                    <h4>${produto.nome}</h4>
                    <!-- Opcional e muito usado: multiplica o preço pela quantidade -->
                    <p>R$ ${(produto.preco * qtd).toFixed(2)}</p>
                </div>

                <div class="pilula-quantidade">
                    <button class="btn-qtd btn-menos" title="Diminuir">
                        <span class="material-symbols-outlined">${qtd === 1 ? 'delete' : 'remove'}</span>
                    </button>
                    <span class="qtd-numero">${qtd}</span>
                    <button class="btn-qtd btn-mais" title="Aumentar">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>
        `;
        // Nota: os cliques em .btn-menos/.btn-mais/.pilula-quantidade NÃO são
        // tratados aqui — o listener fica em cordenador.js →
        // configurarEventosModalFavoritosConteudo() (delegação de evento)
    }).join('');

    containerFavoritos.innerHTML = htmlFavoritos;
    footerFav.style.display = 'flex';
}


/**
 * Mostra ou esconde o botão de "carregar mais produtos" (paginação).
 *
 * Chamada por: cordenador.js
 *   - iniciarLoja() → mostra (true) após carregar a primeira página
 *   - carregarProximaPagina() → esconde (false) quando não há mais produtos
 *   - configurarPesquisa() / configurarFiltroMagico() → esconde (false),
 *     pois busca/filtro trazem resultado único, sem paginação
 */
export function controlarVisibilidadeBotaoPaginacao(deveMostrar) {
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');
    if (btnProximaPagina) {
        btnProximaPagina.style.display = deveMostrar ? 'inline-block' : 'none';
    }
}


/**
 * Mostra ou esconde o botão "← Ver catálogo completo", que só faz sentido
 * quando o cliente está vendo resultado de busca ou do filtro mágico —
 * é o caminho de volta pro catálogo paginado normal, sem precisar dar F5.
 *
 * Chamada por: cordenador.js
 *   - configurarPesquisa() / configurarFiltroMagico() → mostra (true) depois
 *     de um resultado de busca/filtro
 *   - voltarParaCatalogoCompleto() → esconde (false) ao voltar pro catálogo normal
 *   - iniciarLoja() → garante que começa escondido (false)
 */
export function controlarVisibilidadeBotaoCatalogoCompleto(deveMostrar) {
    const btnVerCatalogoCompleto = document.getElementById('btn-ver-catalogo-completo');
    if (btnVerCatalogoCompleto) {
        btnVerCatalogoCompleto.style.display = deveMostrar ? 'inline-block' : 'none';
    }
}


/**
 * Remove o overlay de carregamento da tela após a loja estar pronta.
 *
 * Chamada por: cordenador.js → iniciarLoja()
 * (tanto no fluxo de sucesso quanto no catch de erro, pra não travar o usuário no loader)
 */
export function ocultarLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.add('oculto');
        setTimeout(() => loader.remove(), 400);
    }
}


/**
 * Ativa/desativa o destaque visual do ícone de favoritos na navbar (#btn-favorite).
 *
 * Chamada por: cordenador.js → sincronizarInterfaceFavoritos()
 * Recebe: lista.length (vindo de obterFavoritos() em storage.js)
 */
export function favNavbar(quantidade) {
    const btnFavorite = document.getElementById('btn-favorite');
    if (btnFavorite) {
        btnFavorite.classList.toggle('favoritado', quantidade > 0);
    }
}


/**
 * Calcula e exibe o valor total (preço x quantidade) dos favoritos.
 *
 * Chamada por: cordenador.js → sincronizarInterfaceFavoritos()
 * Recebe: obterFavoritos() vindo de storage.js
 */
export function atualizarTotalFavoritos(listaFavoritos) {
    const elTotal = document.getElementById('total-favoritos');
    if (!elTotal) return;

    const valorTotal = listaFavoritos.reduce((acumulador, produto) => {
        return acumulador + (produto.preco * (produto.quantidade || 1));
    }, 0);

    elTotal.textContent = `R$ ${valorTotal.toFixed(2)}`;
}


/**
 * Exibe uma notificação temporária (toast) de sucesso ou remoção.
 * Se já existir um toast na tela, remove antes de criar outro.
 *
 * Chamada por: cordenador.js
 *   - configurarModalProduto() → ao favoritar/desfavoritar pelo modal de detalhes
 *   - configurarCliqueNoGrid() → ao favoritar/desfavoritar direto no card do grid
 *   - configurarEventosModalFavoritosConteudo() → ao confirmar remoção de favorito
 * Chamada internamente por: enviarOrcamentoWhatsApp() (nesse mesmo arquivo), quando a lista está vazia
 */
export function mostrarToast(mensagem, tipo = 'sucesso') {
    const toastAntigo = document.getElementById('toast-feedback');
    if (toastAntigo) toastAntigo.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-feedback';
    toast.className = `mostrar ${tipo}`;
    toast.textContent = mensagem;

    // Se tiver um modal aberto, o toast entra dentro dele (senão fica escondido atrás)
    const dialogAberto = document.querySelector('dialog[open]');
    if (dialogAberto) {
        dialogAberto.appendChild(toast);
    } else {
        document.body.appendChild(toast);
    }

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
    }, 500);
}


/**
 * Monta a mensagem de orçamento com os itens favoritados
 * e abre o WhatsApp já com o texto preenchido.
 *
 * Chamada por: cordenador.js → configurarBotaoConsultar()
 * (listener do clique em #btn-consultar-favoritos)
 *
 * Recebe: obterFavoritos() vindo de storage.js
 * Vai para: window.open() abrindo o wa.me em nova aba — fim do fluxo, não retorna nada pro chamador
 */
export function enviarOrcamentoWhatsApp(listaFavoritos) {
    if (listaFavoritos.length === 0) {
        mostrarToast('Sua lista de favoritos está vazia!', 'removido');
        return;
    }

    // Iniciamos o texto usando \n para pular linha no JavaScript de forma limpa
    let texto = "Olá! Gostaria de consultar a disponibilidade dos seguintes brinquedos:\n";

    listaFavoritos.forEach(produto => {
        const qtd = produto.quantidade || 1; // segurança caso venha zerado/nulo
        texto += `\n• ${qtd}x ${produto.nome} (Ref: ${produto.codigo})`;
    });

    const valorTotal = listaFavoritos.reduce((acc, p) => acc + (p.preco * (p.quantidade || 1)), 0);
    texto += `\n\n*Total estimado: R$ ${valorTotal.toFixed(2)}*`;

    const numeroWhatsApp = "558130463443";

    // encodeURIComponent transforma \n em %0A e protege os espaços na URL
    const urlFormatada = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

    window.open(urlFormatada, '_blank');
}


/**
 * Preenche o modal de detalhes do produto: imagem principal, miniaturas,
 * nome, preço, condição de parcelamento, descrição e estado do botão de favorito.
 *
 * Chamada por: cordenador.js → configurarModalProduto()
 *   - exibirDetalhes() → ao abrir o modal (clique em card do grid ou mini-card de favorito)
 *   - listener de btnFavoritarModal → pra atualizar o texto/cor do botão após favoritar/desfavoritar
 *
 * Recebe: produtoSelecionado (objeto do produto) + verificarFavorito (função vinda de storage.js,
 * passada como parâmetro para checar se o produto já está nos favoritos)
 * Usa: configurarGestosGaleria() de gestos.js para habilitar o swipe nas imagens
 */
export function atualizarModalProdutoUI(produtoSelecionado, verificarFavorito) {
    const imagemPrincipal = document.getElementById('modal-img');
    const containerMiniaturas = document.getElementById('miniaturas');
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');
    const parcelaModal = document.getElementById('modal-parcela');

    containerMiniaturas.innerHTML = '';
    const imagensDosProdutos = [];

    imagemPrincipal.src = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_1.webp`;
    imagemPrincipal.alt = produtoSelecionado.nome;

    // Monta as 3 miniaturas do produto e habilita clique pra trocar a imagem principal
    for (let i = 1; i <= 3; i++) {
        const urlImagem = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_${i}.webp`;
        imagensDosProdutos.push(urlImagem); // monta na ordem certa, sem depender do load

        const miniatura = document.createElement('img');
        miniatura.src = urlImagem;
        miniatura.alt = produtoSelecionado.nome;
        if (i === 1) miniatura.classList.add('ativa');

        miniatura.addEventListener('click', () => {
            imagemPrincipal.src = urlImagem;
            document.querySelectorAll('#miniaturas img').forEach(img => img.classList.remove('ativa'));
            miniatura.classList.add('ativa');
        });

        containerMiniaturas.appendChild(miniatura); // aparece na tela na ordem, mesmo com carregamento assíncrono
    }

    // Habilita o swipe (arrastar o dedo) na galeria de imagens do modal → gestos.js
    configurarGestosGaleria(imagemPrincipal, imagensDosProdutos);

    document.getElementById('modal-nome').textContent = produtoSelecionado.nome;
    document.getElementById('modal-preco').textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;

    // Define a condição de parcelamento de acordo com a faixa de preço
    if (produtoSelecionado.preco > 200) {
        parcelaModal.textContent = `ou até 3x de R$ ${(produtoSelecionado.preco / 3).toFixed(2)} sem juros`;
    } else if (produtoSelecionado.preco > 100) {
        parcelaModal.textContent = `ou 2x de R$ ${(produtoSelecionado.preco / 2).toFixed(2)} sem juros`;
    } else {
        parcelaModal.textContent = 'pagamento à vista ou em 1x no cartão';
    }

    document.getElementById('modal-descricao').textContent = produtoSelecionado.descricao || "Descrição não informada.";

    // Atualização visual do botão de favoritos interno do modal
    const jaEhFavorito = verificarFavorito(produtoSelecionado.codigo);
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