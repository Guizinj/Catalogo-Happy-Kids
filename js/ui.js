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

        return `
            <div class="card-produto" data-id="${produto.codigo}">
                <img class="img-card" src="${produto.imagem}" alt="${produto.nome}">
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

// NOVA FUNÇÃO: Desenha os itens dentro do modal de favoritos
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
        
        // Como re-criamos o botão explorar no DOM, precisamos plugar o evento nele de novo
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

    return `
    <div class="card-favorito-mini" data-id="${produto.codigo}">
        <img class="img-favorito-mini" src="${produto.imagem}" alt="${produto.nome}">
        
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

    let texto = "Olá! Gostaria de consultar a disponibilidade dos seguintes brinquedos: ";
    listaFavoritos.forEach(produto => {
        texto += ` ${produto.quantidade}x ${produto.nome} (Ref: ${produto.codigo})%0A`;
    });

    const valorTotal = listaFavoritos.reduce((acc, p) => acc + (p.preco * (p.quantidade || 1)), 0);
    texto += `%0A*Total estimado: R$ ${valorTotal.toFixed(2)}*`;

    const numeroWhatsApp = "558130463443"; 
    window.open(`https://wa.me/${numeroWhatsApp}?text=${texto}`, '_blank');
}