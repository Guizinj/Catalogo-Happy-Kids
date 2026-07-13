import { buscarTodosOsProdutos, buscarProdutosPorNome } from "./api.js";
import { renderizarProdutos } from "./ui.js";

async function iniciarLoja() {
    try {
        const produtos = await buscarTodosOsProdutos();
        renderizarProdutos(produtos);
    }
    catch (erro) {
       console.error('Falha ao iniciar loja', erro);
    }
}

function configurarPesquisa() {
    const btnLupa = document.getElementById('lupa');
    const campoLupa = document.getElementById('campo-lupa');
    const modalMenu = document.getElementById('modal-menu');
    let tempo = null;
    async function executarBusca() {
        const valorCampoLupa = campoLupa.value.trim();

        if (valorCampoLupa === '') {
            const todosOsProdutos = await buscarTodosOsProdutos();
            renderizarProdutos(todosOsProdutos);
            return;
        }

        const produtosFiltrados = await buscarProdutosPorNome(valorCampoLupa);
        renderizarProdutos(produtosFiltrados);

        btnLupa.addEventListener('click', () => {
            modalMenu.close();
        })
    }

    btnLupa.addEventListener('click', () => {
        modalMenu.close();
        executarBusca();
    });

    /* campoLupa.addEventListener('input', () =>{
        clearTimeout(tempo);
        tempo = setTimeout(executarBusca, 300);
    }); */
}

document.addEventListener('DOMContentLoaded', () =>{
    iniciarLoja();
    configurarPesquisa();
});




/*MANIPULAÇÕES DE DOM: BOTÕES, MODAL, REVEAL, MESSAGENS NO TOPO */

   /*BOTÃO DE FAVORITO DOS CARDS */
const grid = document.getElementById('grid');
    grid.addEventListener('click', (e) => {
    if(e.target.classList.contains('favorite')){
    e.target.classList.toggle('favoritado')
    };
});

/* ABRIR E FECHAR DIALOG DE FAVORITOS*/
const modalFav = document.getElementById('dialog-favorite');
const btnAbrirFav = document.getElementById('btn-favorite');
const btnFecharFav = document.getElementById('btn-fechar-fav');

btnAbrirFav.addEventListener('click', () =>{
    modalFav.showModal();
})
btnFecharFav.addEventListener('click', () => {
    modalFav.close();
})

   /*ABRIR E FECHAR O MODAL DIALOG DO MAGIC */
const modalMagic = document.getElementById('meuModal');
const btnAbrirMagic = document.getElementById('btn-cta');
const btnFecharMagic = document.getElementById('btn-fechar');

btnAbrirMagic.addEventListener('click', () => {
    modalMagic.showModal()
});
btnFecharMagic.addEventListener('click', () => {
    modalMagic.close()
});

   /*ABRIR E FECHAR O MODAL DIALOG DO MAGIC */
const modalMenu = document.getElementById('modal-menu');
const btnAbrirMenu = document.getElementById('bar');
const btnFecharMenu = document.getElementById('btn-fechar-menu');

btnAbrirMenu.addEventListener('click', () => {
    modalMenu.showModal();
});
btnFecharMenu.addEventListener('click', () => {
    modalMenu.close();
});



   /* MENSAGENS NO TOPO*/
// Seleciona todas as mensagens
const messages = document.querySelectorAll('.message');
let currentIndex = 0;

// Configuração dos tempos (em milissegundos)
const tempoLeitura = 5000; // 3 segundos parada para o usuário ler
const tempoAnimacao = 300; // 0.5 segundos (deve ser igual ao transition do CSS)

function trocarMensagem() {
  const currentMsg = messages[currentIndex];
  
  // 1. Faz a mensagem atual sumir rápido indo para a DIREITA
  currentMsg.classList.remove('active');
  currentMsg.classList.add('exit');

  // Calcula qual é a próxima mensagem
  currentIndex = (currentIndex + 1) % messages.length;
  const nextMsg = messages[currentIndex];

  // Remove a classe 'exit' da próxima para garantir que ela venha da ESQUERDA
  nextMsg.classList.remove('exit');

  // 2. Espera a mensagem atual sair da tela, e então faz a próxima entrar
  setTimeout(() => {
    nextMsg.classList.add('active');
  }, tempoAnimacao);
}

// 3. Fica repetindo esse ciclo infinitamente
setInterval(trocarMensagem, tempoLeitura + tempoAnimacao);
