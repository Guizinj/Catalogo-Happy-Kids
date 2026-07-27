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
    
    // Se a lista estiver vazia, renderizamos o "Empty State" (ursinho)
    if (favoritos.length === 0) {
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

    const htmlFavoritos = favoritos.map(produto => `
    <div class="card-favorito-mini" data-id="${produto.codigo}">
        <img class="img-favorito-mini" src="${produto.imagem}" alt="${produto.nome}">
        
        <div class="info-favorito-mini">
            <h4>${produto.nome}</h4>
            <p>R$ ${produto.preco.toFixed(2)}</p>
        </div>
        
        <button class="btn-remover-favorito" title="Remover dos favoritos">
            <span class="material-symbols-outlined">delete</span>
        </button>
    </div>
`).join('');

    containerFavoritos.innerHTML = htmlFavoritos;
}