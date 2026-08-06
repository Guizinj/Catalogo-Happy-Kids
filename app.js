// ELEMENTOS DO DOM
const telaLogin = document.getElementById('tela-login');
const telaApp = document.getElementById('tela-app');

const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const erroLogin = document.getElementById('erro-login');
const btnLogout = document.getElementById('btn-logout');

const formAniversariante = document.getElementById('form-aniversariante');
const inputNomeAniversariante = document.getElementById('nome-aniversariante');
const inputDataFesta = document.getElementById('data-festa');

const formProduto = document.getElementById('form-produto');
const inputFoto = document.getElementById('foto-produto');
const inputNomeProduto = document.getElementById('nome-produto');
const inputPrecoProduto = document.getElementById('preco-produto');

const listaProdutos = document.getElementById('lista-produtos');
const btnFinalizar = document.getElementById('btn-finalizar');

// ESTRUTURA DO RASCUNHO LOCAL
let rascunho = {
    aniversariante: '',
    dataFesta: '',
    produtos: []
};

// SESSÃO DE LOGIN
formLogin.addEventListener('submit', function (evento) {
    evento.preventDefault();
    
    if (inputEmail.value && inputSenha.value) {
        localStorage.setItem('usuario_logado', 'true');
        exibirTelaApp();
        formLogin.reset();
        erroLogin.textContent = '';
    } else {
        erroLogin.textContent = 'Por favor, preencha todos os campos.';
    }
});

btnLogout.addEventListener('click', function () {
    localStorage.removeItem('usuario_logado');
    exibirTelaLogin();
});

function exibirTelaApp() {
    telaLogin.style.display = 'none';
    telaApp.style.display = 'block';
}

function exibirTelaLogin() {
    telaLogin.style.display = 'flex';
    telaApp.style.display = 'none';
}

function checarSessao() {
    const estaLogado = localStorage.getItem('usuario_logado') === 'true';
    if (estaLogado) {
        exibirTelaApp();
    } else {
        exibirTelaLogin();
    }
}

// AUTO-SALVAMENTO DO ANIVERSARIANTE
inputNomeAniversariante.addEventListener('input', function() {
    rascunho.aniversariante = this.value;
    salvarRascunho();
});

inputDataFesta.addEventListener('change', function() {
    rascunho.dataFesta = this.value;
    salvarRascunho();
});

// ADICIONAR E COMPRIMIR PRODUTO
formProduto.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const nome = inputNomeProduto.value;
    const preco = inputPrecoProduto.value;
    const arquivoFoto = inputFoto.files[0];

    if (!arquivoFoto) {
        alert('Por favor, tire uma foto do produto.');
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function () {
        const fotoBase64 = leitor.result;
        comprimirImagem(fotoBase64, function (fotoComprimida) {
            adicionarProduto(nome, preco, fotoComprimida);
        });
    };

    leitor.readAsDataURL(arquivoFoto);
});

function comprimirImagem(fotoBase64, callback) {
    const imagem = new Image();

    imagem.onload = function () {
        const larguraMaxima = 800;
        const escala = larguraMaxima / imagem.width;
        const novaLargura = larguraMaxima;
        const novaAltura = imagem.height * escala;

        const canvas = document.createElement('canvas');
        canvas.width = novaLargura;
        canvas.height = novaAltura;

        const contexto = canvas.getContext('2d');
        contexto.drawImage(imagem, 0, 0, novaLargura, novaAltura);

        const fotoComprimida = canvas.toDataURL('image/jpeg', 0.7);
        callback(fotoComprimida);
    };

    imagem.src = fotoBase64;
}

function adicionarProduto(nome, preco, fotoBase64) {
    const novoProduto = {
        id: Date.now(),
        nome: nome,
        preco: Number(preco),
        foto: fotoBase64,
        vendido: false
    };

    rascunho.produtos.push(novoProduto);
    salvarRascunho();
    renderizarLista();

    formProduto.reset();
}

function removerProduto(id) {
    rascunho.produtos = rascunho.produtos.filter(produto => produto.id !== id);
    salvarRascunho();
    renderizarLista();
}

// RENDERIZAÇÃO NA TELA
function renderizarLista() {
    listaProdutos.innerHTML = '';

    rascunho.produtos.forEach(function (produto) {
        const item = document.createElement('li');

        item.innerHTML = `
            <img src="${produto.foto}" alt="${produto.nome}">
            <div class="info-produto">
                <span class="nome-item">${produto.nome}</span>
                <span class="preco-item">R$ ${produto.preco.toFixed(2)}</span>
            </div>
            <button type="button" class="btn-remover" onclick="removerProduto(${produto.id})">Excluir</button>
        `;

        listaProdutos.appendChild(item);
    });
}

// PERSISTÊNCIA LOCAL
// 1. ABRINDO O BANCO DE DADOS (IndexedDB)
const dbPromise = new Promise((resolve, reject) => {
    // Cria um banco chamado 'AppPresentesDB' na versão 1
    const request = indexedDB.open('AppPresentesDB', 1);

    // Se for a primeira vez, ele cria a "tabela" (object store)
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('rascunho_loja')) {
            db.createObjectStore('rascunho_loja');
        }
    };

    request.onsuccess = function(event) {
        resolve(event.target.result); // Banco aberto com sucesso!
    };

    request.onerror = function(event) {
        reject('Erro ao abrir o IndexedDB');
    };
});

// 2. NOVA FUNÇÃO DE SALVAR (Assíncrona)
async function salvarRascunho() {
    const db = await dbPromise; // Aguarda o banco abrir
    const transacao = db.transaction('rascunho_loja', 'readwrite');
    const tabela = transacao.objectStore('rascunho_loja');
    
    // Salva o objeto 'rascunho' inteiro com a chave 'dados-atuais'
    tabela.put(rascunho, 'dados-atuais'); 
}

// 3. NOVA FUNÇÃO DE CARREGAR
async function carregarRascunho() {
    const db = await dbPromise;
    const transacao = db.transaction('rascunho_loja', 'readonly');
    const tabela = transacao.objectStore('rascunho_loja');
    
    const request = tabela.get('dados-atuais');
    
    request.onsuccess = function() {
        if (request.result) {
            // Se achou dados salvos, atualiza as variáveis e a tela
            rascunho = request.result;
            inputNomeAniversariante.value = rascunho.aniversariante || '';
            inputDataFesta.value = rascunho.dataFesta || '';
            renderizarLista();
        }
    };
}

// 4. NOVA FUNÇÃO DE RESETAR
async function resetarAplicacao() {
    const db = await dbPromise;
    const transacao = db.transaction('rascunho_loja', 'readwrite');
    const tabela = transacao.objectStore('rascunho_loja');
    
    tabela.delete('dados-atuais'); // Apaga tudo do banco

    // Limpa a tela
    rascunho = { aniversariante: '', dataFesta: '', produtos: [] };
    inputNomeAniversariante.value = '';
    inputDataFesta.value = '';
    renderizarLista();
}

// BOTÃO FINALIZAR (Aguardando integração Supabase)
btnFinalizar.addEventListener('click', function() {
    if (!rascunho.aniversariante || !rascunho.dataFesta) {
        alert('Por favor, preencha o nome do aniversariante e a data da festa.');
        return;
    }

    if (rascunho.produtos.length === 0) {
        alert('Adicione pelo menos um produto à lista.');
        return;
    }

    alert('Lista salva localmente com sucesso! Em breve sincronizaremos com o Supabase para gerar o link.');
});

// INICIALIZAÇÃO
checarSessao();
carregarRascunho();