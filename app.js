const telaLogin = document.getElementById('tela-login');
const telaApp = document.getElementById('tela-app');

const formAniversariante = document.getElementById('form-aniversariante');
const formProduto = document.getElementById('form-produto');

const inputFoto = document.getElementById('foto-produto');
const inputNomeProduto = document.getElementById('nome-produto');
const inputPrecoProduto = document.getElementById('preco-produto');

const listaProdutos = document.getElementById('lista-produtos');

let produtos = [];

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

function adicionarProduto(nome, preco, fotoBase64) {
    const novoProduto = {
        id: Date.now(),
        nome: nome,
        preco: Number(preco),
        foto: fotoBase64,
        vendido: false
    };

    produtos.push(novoProduto);

    salvarRascunho();
    renderizarLista();

    formProduto.reset();
}

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


function renderizarLista() {
    listaProdutos.innerHTML = '';

    produtos.forEach( function (produto) {
        const item = document.createElement('li');

        item.innerHTML = `
            <img src="${produto.foto}" alt="${produto.nome}" width="60">
            <span>${produto.nome} - R$ ${produto.preco.toFixed(2)}</span>
        `;

        listaProdutos.appendChild(item);
    });
}

function salvarRascunho() {
    localStorage.setItem('rascunho-produtos', JSON.stringify(produtos));
}

function carregarRascunho() {
    const dadosSalvos = localStorage.getItem('rascunho-produtos');

    if (dadosSalvos) {
        produtos = JSON.parse(dadosSalvos);
        renderizarLista();
    }
}

carregarRascunho();


function resetarAplicacao() {
    localStorage.clear();
    console.log('Todos os dados locais foram apagados.');
}
