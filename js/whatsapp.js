import { NUMEROS_WHATSAPP } from './config.js';
import { formatarMoeda, normalizarListaFavoritos } from './domain.js';

function obterNumero(chave) {
    const numero = NUMEROS_WHATSAPP[chave];

    if (!numero || !/^\d{10,15}$/.test(numero)) {
        throw new Error('Número de WhatsApp não configurado.');
    }

    return numero;
}

export function criarUrlWhatsApp(chave = 'principal', mensagem = '') {
    const numero = obterNumero(chave);
    const texto = String(mensagem ?? '').trim();
    const urlBase = 'https://wa.me/' + numero;

    return texto ? urlBase + '?text=' + encodeURIComponent(texto) : urlBase;
}

export function montarMensagemOrcamento(favoritos) {
    const lista = normalizarListaFavoritos(favoritos);

    if (lista.length === 0) {
        return '';
    }

    const linhas = lista.map((produto) => {
        const precoUnitario = produto.quantidade > 1
            ? formatarMoeda(produto.preco) + ' cada'
            : formatarMoeda(produto.preco);

        return '• ' + produto.quantidade + 'x ' + produto.nome
            + ' (Ref: ' + produto.codigo + ') — ' + precoUnitario;
    });

    const total = lista.reduce((acumulador, produto) => {
        return acumulador + (produto.preco * produto.quantidade);
    }, 0);

    return [
        'Olá! Vim pelo site da Happy Kids Brinquedos e gostaria de consultar a disponibilidade dos seguintes brinquedos:',
        '',
        ...linhas,
        '',
        '*Total estimado: ' + formatarMoeda(total) + '*',
        '',
        'Aguardo confirmação, obrigado!'
    ].join('\n');
}

export function configurarLinksWhatsApp(raiz = document) {
    raiz.querySelectorAll('[data-whatsapp]').forEach((link) => {
        const chave = link.dataset.whatsapp || 'principal';
        const mensagem = link.dataset.whatsappMensagem || '';

        try {
            link.href = criarUrlWhatsApp(chave, mensagem);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        } catch (erro) {
            console.error('Link de WhatsApp inválido', erro);
            link.removeAttribute('href');
            link.setAttribute('aria-disabled', 'true');
        }
    });
}
