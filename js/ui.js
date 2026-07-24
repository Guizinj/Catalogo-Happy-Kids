export function renderizarProdutos(listaDeProdutos, deveAcrescentar = false) {
    const grid = document.getElementById('grid');
    const btnPlus = document.getElementById('btn-proxima-pagina');

    if (listaDeProdutos.length === 0) {
        if(!deveAcrescentar){
        grid.textContent = 'Nenhum produto encontrado na loja';
        };
        btnPlus.style.display = 'none';
        return;
    }

    const htmlCards = listaDeProdutos.map(produto => `
        <div class="card-produto" data-id="${produto.codigo}">
            <img class="img-card" src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
            <button class="btn-comprar">Ver detalhes</button>
            <button class="btn-header"><span class="material-symbols-outlined favorite">favorite</span></button>
        </div>
    `).join('');

    if(deveAcrescentar){
        grid.insertAdjacentHTML('beforeend', htmlCards);
    }
    else {
    grid.innerHTML = htmlCards;
    }
};