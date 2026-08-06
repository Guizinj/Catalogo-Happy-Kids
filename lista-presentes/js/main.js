import { salvarRascunhoNoDB, carregarRascunhoDoDB } from './db.js';
import { mostrarToast, alternarTelas, alternarAbas, renderizarProdutos, renderizarListasGerenciamento } from './ui.js';
import { processarEComprimirImagem } from './imageUtils.js';
import { estaAutenticado, realizarLogin, realizarLogout } from './auth.js';

// ELEMENTOS DOM - AUTH
const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const erroLogin = document.getElementById('erro-login');
const btnLogout = document.getElementById('btn-logout');

// ELEMENTOS DOM - ABAS
const btnAbaCriar = document.getElementById('btn-aba-criar');
const btnAbaGerenciar = document.getElementById('btn-aba-gerenciar');

// ELEMENTOS DOM - FORMULÁRIOS
const inputNomeAniversariante = document.getElementById('nome-aniversariante');
const inputDataFesta = document.getElementById('data-festa');
const formProduto = document.getElementById('form-produto');
const inputFoto = document.getElementById('foto-produto');
const inputNomeProduto = document.getElementById('nome-produto');
const inputPrecoProduto = document.getElementById('preco-produto');
const listaProdutos = document.getElementById('lista-produtos');
const btnFinalizar = document.getElementById('btn-finalizar');

// ELEMENTOS DOM - ABA GERENCIAR
const inputBusca = document.getElementById('busca-lista');
const containerListasGerenciar = document.getElementById('container-listas-gerenciar');

// ESTADO DA APLICAÇÃO
let rascunho = {
    aniversariante: '',
    dataFesta: '',
    produtos: []
};

// DADOS MOCK (SIMULADOS) PARA TESTAR A ABA DE GERENCIAMENTO ANTES DO SUPABASE
const listasSalvasMock = [
    { id: '1', aniversariante: 'João Silva', dataFesta: '2026-10-15', totalItens: 4 },
    { id: '2', aniversariante: 'Lucas Souza', dataFesta: '2026-10-20', totalItens: 3 },
    { id: '3', aniversariante: 'Maria Clara', dataFesta: '2026-11-02', totalItens: 6 }
];

// --- NAVEGAÇÃO ENTRE ABAS ---
btnAbaCriar.addEventListener('click', () => alternarAbas('criar'));
btnAbaGerenciar.addEventListener('click', () => {
    alternarAbas('gerenciar');
    renderizarListasGerenciamento(listasSalvasMock, containerListasGerenciar);
});

// BUSCA EM TEMPO REAL NA ABA GERENCIAR
inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtradas = listasSalvasMock.filter(l => l.aniversariante.toLowerCase().includes(termo));
    renderizarListasGerenciamento(filtradas, containerListasGerenciar);
});

// --- AUTENTICAÇÃO ---
formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (realizarLogin(inputEmail.value, inputSenha.value)) {
        alternarTelas(true);
        formLogin.reset();
        erroLogin.textContent = '';
        mostrarToast('Login realizado com sucesso!');
    } else {
        erroLogin.textContent = 'Preencha o e-mail e a senha.';
    }
});

btnLogout.addEventListener('click', () => {
    realizarLogout();
    alternarTelas(false);
    mostrarToast('Sessão encerrada.', 'alerta');
});

// --- SALVAMENTO AUTOMÁTICO ---
inputNomeAniversariante.addEventListener('input', (e) => {
    rascunho.aniversariante = e.target.value;
    persistirRascunho();
});

inputDataFesta.addEventListener('change', (e) => {
    rascunho.dataFesta = e.target.value;
    persistirRascunho();
});

async function persistirRascunho() {
    try {
        await salvarRascunhoNoDB(rascunho);
    } catch (erro) {
        mostrarToast('Erro ao salvar rascunho localmente.', 'erro');
    }
}

// --- PRODUTOS ---
formProduto.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const arquivoFoto = inputFoto.files[0];
    if (!arquivoFoto) {
        mostrarToast('Por favor, tire ou selecione uma foto do produto.', 'alerta');
        return;
    }

    try {
        const fotoComprimida = await processarEComprimirImagem(arquivoFoto);
        
        const novoProduto = {
            id: Date.now(),
            nome: inputNomeProduto.value,
            preco: Number(inputPrecoProduto.value),
            foto: fotoComprimida,
            vendido: false
        };

        rascunho.produtos.push(novoProduto);
        await persistirRascunho();
        
        renderizarProdutos(rascunho.produtos, listaProdutos, removerProduto);
        formProduto.reset();
        mostrarToast('Produto adicionado!');
    } catch (erro) {
        mostrarToast('Erro ao processar imagem do produto.', 'erro');
    }
});

async function removerProduto(id) {
    rascunho.produtos = rascunho.produtos.filter(p => p.id !== id);
    await persistirRascunho();
    renderizarProdutos(rascunho.produtos, listaProdutos, removerProduto);
    mostrarToast('Produto removido.', 'alerta');
}

// --- CARREGAMENTO INICIAL ---
async function inicializarApp() {
    alternarTelas(estaAutenticado());

    try {
        const dadosSalvos = await carregarRascunhoDoDB();
        if (dadosSalvos) {
            rascunho = dadosSalvos;
            inputNomeAniversariante.value = rascunho.aniversariante || '';
            inputDataFesta.value = rascunho.dataFesta || '';
            renderizarProdutos(rascunho.produtos, listaProdutos, removerProduto);
        }
    } catch (erro) {
        mostrarToast('Erro ao restaurar rascunho.', 'erro');
    }
}

btnFinalizar.addEventListener('click', () => {
    if (!rascunho.aniversariante || !rascunho.dataFesta) {
        mostrarToast('Preencha os dados do aniversariante.', 'alerta');
        return;
    }
    if (rascunho.produtos.length === 0) {
        mostrarToast('Adicione ao menos um produto.', 'alerta');
        return;
    }

    mostrarToast('Lista pronta para sincronizar com a nuvem!');
});

inicializarApp();