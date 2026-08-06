// Formatação brasileira de moeda
export function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Sistema de Notificações Toast
export function mostrarToast(mensagem, tipo = 'sucesso') {
    let container = document.getElementById('container-toast');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'container-toast';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// Controle de exibição das telas (Login vs App)
export function alternarTelas(exibirApp) {
    const telaLogin = document.getElementById('tela-login');
    const telaApp = document.getElementById('tela-app');

    if (exibirApp) {
        telaLogin.style.display = 'none';
        telaApp.style.display = 'block';
    } else {
        telaLogin.style.display = 'flex';
        telaApp.style.display = 'none';
    }
}

// Alternância de Abas dentro da Aplicação
export function alternarAbas(abaAlvo) {
    const abas = document.querySelectorAll('.conteudo-aba');
    const botoes = document.querySelectorAll('.btn-aba');

    abas.forEach(aba => aba.classList.remove('ativa'));
    botoes.forEach(btn => btn.classList.remove('ativa'));

    if (abaAlvo === 'criar') {
        document.getElementById('aba-criar').classList.add('ativa');
        document.getElementById('btn-aba-criar').classList.add('ativa');
    } else {
        document.getElementById('aba-gerenciar').classList.add('ativa');
        document.getElementById('btn-aba-gerenciar').classList.add('ativa');
    }
}

// Renderização dos cards de produto na UL do rascunho
export function renderizarProdutos(produtos, listaContainer, callbackRemover) {
    listaContainer.innerHTML = '';

    if (!produtos || produtos.length === 0) {
        listaContainer.innerHTML = '<li style="padding:12px; color:#94a3b8; text-align:center;">Nenhum produto no rascunho.</li>';
        return;
    }

    produtos.forEach((produto) => {
        const item = document.createElement('li');

        item.innerHTML = `
            <img src="${produto.foto}" alt="${produto.nome}">
            <div class="info-produto">
                <span class="nome-item">${produto.nome}</span>
                <span class="preco-item">${formatarMoeda(produto.preco)}</span>
            </div>
            <button type="button" class="btn-remover">Excluir</button>
        `;

        item.querySelector('.btn-remover').addEventListener('click', () => {
            callbackRemover(produto.id);
        });

        listaContainer.appendChild(item);
    });
}

// Renderização das Listas Ativas (Aba Gerenciar)
export function renderizarListasGerenciamento(listas, container) {
    container.innerHTML = '';

    if (!listas || listas.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:20px;">Nenhuma lista encontrada.</p>';
        return;
    }

    listas.forEach(lista => {
        const card = document.createElement('div');
        card.className = 'card-lista-item';
        card.innerHTML = `
            <h3>${lista.aniversariante}</h3>
            <p>Data da festa: ${lista.dataFesta}</p>
            <p>Itens cadastrados: <strong>${lista.totalItens}</strong></p>
            <button type="button" class="btn-acao-card">Ver / Editar Lista</button>
        `;

        card.querySelector('.btn-acao-card').addEventListener('click', () => {
            mostrarToast(`Abrindo lista de ${lista.aniversariante}...`);
        });

        container.appendChild(card);
    });
}