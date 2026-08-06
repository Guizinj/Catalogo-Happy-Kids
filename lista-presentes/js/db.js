// js/db.js

const NOME_BANCO = 'AppPresentesDB';
const VERSAO_BANCO = 1;
const TABELA_RASCUNHO = 'rascunho_loja';

// Verifica suporte ao IndexedDB
function verificarSuporteIndexedDB() {
    return 'indexedDB' in window;
}

// Inicializa a conexão com tratamento de exceções
function abrirBanco() {
    return new Promise((resolve, reject) => {
        if (!verificarSuporteIndexedDB()) {
            reject(new Error('Seu navegador não suporta armazenamento local assíncrono.'));
            return;
        }

        try {
            const request = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(TABELA_RASCUNHO)) {
                    db.createObjectStore(TABELA_RASCUNHO);
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(new Error('Erro ao abrir o banco local. Modo anônimo ativado?'));
        } catch (erro) {
            reject(erro);
        }
    });
}

// Salva o rascunho com captura de erro (try/catch)
export async function salvarRascunhoNoDB(dados) {
    try {
        const db = await abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(TABELA_RASCUNHO, 'readwrite');
            const tabela = transacao.objectStore(TABELA_RASCUNHO);
            const request = tabela.put(dados, 'dados-atuais');

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('Falha ao gravar os dados no banco local.'));
        });
    } catch (erro) {
        console.error('Erro em salvarRascunhoNoDB:', erro);
        throw erro;
    }
}

// Carrega o rascunho do banco
export async function carregarRascunhoDoDB() {
    try {
        const db = await abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(TABELA_RASCUNHO, 'readonly');
            const tabela = transacao.objectStore(TABELA_RASCUNHO);
            const request = tabela.get('dados-atuais');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(new Error('Falha ao ler dados locais.'));
        });
    } catch (erro) {
        console.error('Erro em carregarRascunhoDoDB:', erro);
        return null;
    }
}

// Limpa o rascunho do banco
export async function resetarRascunhoNoDB() {
    try {
        const db = await abrirBanco();
        return new Promise((resolve, reject) => {
            const transacao = db.transaction(TABELA_RASCUNHO, 'readwrite');
            const tabela = transacao.objectStore(TABELA_RASCUNHO);
            const request = tabela.delete('dados-atuais');

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('Falha ao limpar o banco local.'));
        });
    } catch (erro) {
        console.error('Erro em resetarRascunhoNoDB:', erro);
        throw erro;
    }
}