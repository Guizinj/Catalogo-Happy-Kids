export function renderizarProdutos(listaDeProdutos) {
    const grid = document.getElementById('grid');

    if (listaDeProdutos.length === 0) {
        grid.textContent = 'Nenhum produto encontrado na loja';
        return;
    }

    const htmlCards = listaDeProdutos.map(produto => `
        <div class="card-produto" data-id="${produto.id}">
            <img class="img-card" src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
            <button class="btn-comprar">Ver detalhes</button>
            <button class="btn-header"><span class="material-symbols-outlined favorite">favorite</span></button>
        </div>
    `).join('');

    grid.innerHTML = htmlCards;
};