export function renderizarProdutos (listaDeProdutos) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    if (listaDeProdutos.length === 0){
        grid.textContent = 'Nenhum produto encontrado na loja';
        return;
    }

    listaDeProdutos.forEach(produto => {
    grid.innerHTML += `
            <div class="card-produto">
                <img class="img-card" src="${produto.imagem}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
                <button class="btn-comprar">Consultar</button>
                <button class="btn-header"><span class="material-symbols-outlined favorite">favorite</span></button>
            </div>
        `;
    });
};










