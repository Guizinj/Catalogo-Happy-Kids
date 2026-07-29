import { URL_BUCKET_PRODUTOS } from "./config.js";
import { configurarGestosGaleria } from './gestos.js';


export function renderizarProdutos(listaDeProdutos, deveAcrescentar = false, listaFavoritos = []) {
    const grid = document.getElementById('grid');

    if (listaDeProdutos.length === 0) {
        if(!deveAcrescentar){
            grid.textContent = 'Nenhum produto encontrado na loja';
        };
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

    if(deveAcrescentar){
        grid.insertAdjacentHTML('beforeend', htmlCards);
    }
    else {
        grid.innerHTML = htmlCards;
    }
};

// FUNÇÃO: Desenha os itens dentro do modal de favoritos
export function renderizarListaFavoritos(favoritos = []) {
    const containerFavoritos = document.querySelector('.modal-favoritos-conteudo');
    const footerFav = document.querySelector('.footer-modal-favoritos');
    
    // Se a lista estiver vazia, renderizamos o "Empty State" (ursinho)
    if (favoritos.length === 0) {
        footerFav.style.display= 'none'
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
            btnExplorar.addEventListener('click', () =>{
                document.getElementById('dialog-favorite').close();
                const gridProdutos = document.querySelector('.conteudo');
                if (gridProdutos) {
                    gridProdutos.scrollIntoView({ behavior: 'smooth' });
                };
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
    }).join('');
    containerFavoritos.innerHTML = htmlFavoritos;
    footerFav.style.display = 'flex'
}

export function controlarVisibilidadeBotaoPaginacao(deveMostrar) {
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');
    if (btnProximaPagina) {
        btnProximaPagina.style.display = deveMostrar ? 'inline-block' : 'none';
    }
}

export function ocultarLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.add('oculto');
        setTimeout(() => loader.remove(), 400);
    }
}

export function favNavbar(quantidade) {
    const btnFavorite = document.getElementById('btn-favorite');
    if (btnFavorite) {
        btnFavorite.classList.toggle('favoritado', quantidade > 0);
    }
}

export function atualizarTotalFavoritos(listaFavoritos) {
    const elTotal = document.getElementById('total-favoritos');
    if (!elTotal) return;

    const valorTotal = listaFavoritos.reduce((acumulador, produto) => {
        return acumulador + (produto.preco * (produto.quantidade || 1));
    }, 0);

    elTotal.textContent = `R$ ${valorTotal.toFixed(2)}`;
}

export function mostrarToast(mensagem, tipo = 'sucesso') {
    const toastAntigo = document.getElementById('toast-feedback');
    if (toastAntigo) toastAntigo.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast-feedback';
    toast.className = `mostrar ${tipo}`;
    toast.textContent = mensagem;

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

export function enviarOrcamentoWhatsApp(listaFavoritos) {
    if (listaFavoritos.length === 0) {
        mostrarToast('Sua lista de favoritos está vazia!', 'removido');
        return;
    }

    // 1. Iniciamos o texto usando \n para pular linha no JavaScript de forma limpa
    let texto = "Olá! Gostaria de consultar a disponibilidade dos seguintes brinquedos:\n";

    listaFavoritos.forEach(produto => {
        // Criamos uma segurança para a quantidade caso ela venha zerada/nula
        const qtd = produto.quantidade || 1;
        
        // Adicionei um pontinho (•) para listar os itens de forma mais elegante
        texto += `\n• ${qtd}x ${produto.nome} (Ref: ${produto.codigo})`;
    });

    const valorTotal = listaFavoritos.reduce((acc, p) => acc + (p.preco * (p.quantidade || 1)), 0);
    
    // Adicionamos duas quebras de linha antes do total para separá-lo da lista
    texto += `\n\n*Total estimado: R$ ${valorTotal.toFixed(2)}*`;

    const numeroWhatsApp = "558130463443"; 
    
    // 2. A MÁGICA: O encodeURIComponent transforma todos os \n em %0A e protege os espaços
    const urlFormatada = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

    window.open(urlFormatada, '_blank');
}

// No final do arquivo ui.js

export function atualizarModalProdutoUI(produtoSelecionado, verificarFavorito) {
    const imagemPrincipal = document.getElementById('modal-img');
    const containerMiniaturas = document.getElementById('miniaturas');
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');
    const parcelaModal = document.getElementById('modal-parcela');
    
    containerMiniaturas.innerHTML = '';
    const imagensDosProdutos = [];
    
    imagemPrincipal.src = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_1.webp`;
    imagemPrincipal.alt = produtoSelecionado.nome;
    
    for (let i = 1; i <= 3; i++) {
        const urlImagem = `${URL_BUCKET_PRODUTOS}${produtoSelecionado.codigo}_${i}.webp`;
        const miniatura = document.createElement('img');
        miniatura.src = urlImagem;
        miniatura.alt = produtoSelecionado.nome;
        if (i === 1) miniatura.classList.add('ativa');
        
        miniatura.onload = () => {
            imagensDosProdutos.push(urlImagem);
            containerMiniaturas.appendChild(miniatura);
        };
        
        miniatura.addEventListener('click', () => {
            imagemPrincipal.src = urlImagem;
            document.querySelectorAll('#miniaturas img').forEach(img => img.classList.remove('ativa'));
            miniatura.classList.add('ativa');
        });
    }
    
    configurarGestosGaleria(imagemPrincipal, imagensDosProdutos);

    document.getElementById('modal-nome').textContent = produtoSelecionado.nome;
    document.getElementById('modal-preco').textContent = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
    
    // CORREÇÃO LÓGICA: Inverti a ordem para que valores acima de R$ 200 entrem na condição correta
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