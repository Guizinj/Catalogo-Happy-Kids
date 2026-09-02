import { URL_BUCKET_PRODUTOS } from './config.js';
import {
    criarUrlImagem,
    formatarMoeda,
    normalizarListaFavoritos,
    normalizarListaProdutos,
    normalizarProduto
} from './domain.js';
import { configurarGestosGaleria } from './gestos.js';
import { criarUrlWhatsApp, montarMensagemOrcamento } from './whatsapp.js';

let temporizadorToast;

function criarElemento(tag, { classes = [], texto, atributos = {} } = {}) {
    const elemento = document.createElement(tag);

    classes.filter(Boolean).forEach((classe) => elemento.classList.add(classe));

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    Object.entries(atributos).forEach(([nome, valor]) => {
        if (valor !== undefined && valor !== null) {
            elemento.setAttribute(nome, String(valor));
        }
    });

    return elemento;
}

function configurarImagemDeProduto(imagem, codigo, nome, indice = 1) {
    const url = criarUrlImagem(URL_BUCKET_PRODUTOS, codigo, indice);

    imagem.classList.remove('imagem-indisponivel');
    imagem.parentElement?.removeAttribute('data-imagem-indisponivel');
    imagem.alt = nome;
    imagem.decoding = 'async';
    imagem.onerror = () => {
        imagem.classList.add('imagem-indisponivel');
        imagem.removeAttribute('src');
        imagem.parentElement?.setAttribute('data-imagem-indisponivel', 'true');
    };

    if (url) {
        imagem.src = url;
    }
}

function criarIcone(nome, classes = []) {
    return criarElemento('span', {
        classes: ['material-symbols-outlined', ...classes],
        texto: nome,
        atributos: { 'aria-hidden': 'true' }
    });
}

function criarBotao({ classes = [], texto, rotulo, acao, titulo } = {}) {
    const botao = criarElemento('button', {
        classes,
        texto,
        atributos: {
            type: 'button',
            'aria-label': rotulo,
            'data-action': acao,
            title: titulo
        }
    });

    return botao;
}

export function renderizarProdutos(listaDeProdutos, deveAcrescentar = false, listaFavoritos = []) {
    const grid = document.getElementById('grid');
    if (!grid) return;

    const produtos = normalizarListaProdutos(listaDeProdutos);
    const codigosFavoritos = new Set(
        normalizarListaFavoritos(listaFavoritos).map((favorito) => favorito.codigo)
    );

    if (!deveAcrescentar) {
        grid.replaceChildren();
    }

    if (produtos.length === 0) {
        if (!deveAcrescentar) {
            const estadoVazio = criarElemento('p', {
                classes: ['estado-catalogo'],
                texto: 'Nenhum produto encontrado na loja.',
                atributos: { role: 'status' }
            });
            grid.appendChild(estadoVazio);
        }
        return;
    }

    const fragmento = document.createDocumentFragment();

    produtos.forEach((produto) => {
        const card = criarElemento('article', {
            classes: ['card-produto'],
            atributos: { 'data-id': produto.codigo }
        });

        const imagem = criarElemento('img', {
            classes: ['img-card'],
            atributos: {
                loading: 'lazy',
                width: 200,
                height: 200
            }
        });
        configurarImagemDeProduto(imagem, produto.codigo, produto.nome);

        const titulo = criarElemento('h3', { texto: produto.nome });
        const preco = criarElemento('p', {
            classes: ['preco'],
            texto: formatarMoeda(produto.preco)
        });
        const botaoDetalhes = criarBotao({
            classes: ['btn-comprar'],
            texto: 'Ver detalhes',
            rotulo: 'Ver detalhes de ' + produto.nome,
            acao: 'ver-detalhes'
        });
        const botaoFavorito = criarBotao({
            classes: ['btn-header', 'btn-favorito-produto'],
            rotulo: (codigosFavoritos.has(produto.codigo) ? 'Remover' : 'Adicionar')
                + ' ' + produto.nome + ' dos favoritos',
            acao: 'favoritar'
        });
        const iconeFavorito = criarIcone('favorite', [
            'favorite',
            codigosFavoritos.has(produto.codigo) ? 'favoritado' : ''
        ]);

        botaoFavorito.appendChild(iconeFavorito);
        card.append(imagem, titulo, preco, botaoDetalhes, botaoFavorito);
        fragmento.appendChild(card);
    });

    grid.appendChild(fragmento);
}

export function renderizarListaFavoritos(favoritos = []) {
    const container = document.querySelector('.modal-favoritos-conteudo');
    const rodape = document.querySelector('.footer-modal-favoritos');
    if (!container || !rodape) return;

    const lista = normalizarListaFavoritos(favoritos);
    container.replaceChildren();

    if (lista.length === 0) {
        rodape.hidden = true;

        const estadoVazio = criarElemento('div', {
            classes: ['empty-state-favoritos'],
            atributos: { id: 'empty-state' }
        });
        const ilustracao = criarElemento('div', { classes: ['ilustracao-ursinho'] });
        ilustracao.appendChild(criarIcone('sentiment_dissatisfied'));

        const titulo = criarElemento('h3', {
            classes: ['titulo-empty'],
            texto: 'Seu coração está vazio!'
        });
        const texto = criarElemento('p', {
            classes: ['texto-empty'],
            texto: 'Você ainda não escolheu nenhum brinquedo favorito para a sua criança.'
        });
        const explorar = criarBotao({
            classes: ['btn-explorar'],
            texto: 'Explorar brinquedos',
            rotulo: 'Fechar favoritos e explorar brinquedos',
            acao: 'explorar-favoritos'
        });

        explorar.addEventListener('click', () => {
            document.getElementById('dialog-favorite')?.close();
            document.querySelector('.conteudo')?.scrollIntoView({ behavior: 'smooth' });
        });

        estadoVazio.append(ilustracao, titulo, texto, explorar);
        container.appendChild(estadoVazio);
        return;
    }

    rodape.hidden = false;
    const fragmento = document.createDocumentFragment();

    lista.forEach((produto) => {
        const card = criarElemento('article', {
            classes: ['card-favorito-mini'],
            atributos: { 'data-id': produto.codigo }
        });
        const detalhes = criarBotao({
            classes: ['btn-detalhe-favorito'],
            rotulo: 'Ver detalhes de ' + produto.nome,
            acao: 'ver-detalhes-favorito'
        });
        const imagem = criarElemento('img', {
            classes: ['img-favorito-mini'],
            atributos: { loading: 'lazy', width: 60, height: 60 }
        });
        configurarImagemDeProduto(imagem, produto.codigo, produto.nome);

        const informacoes = criarElemento('div', { classes: ['info-favorito-mini'] });
        informacoes.append(
            criarElemento('h4', { texto: produto.nome }),
            criarElemento('p', { texto: formatarMoeda(produto.preco * produto.quantidade) })
        );
        detalhes.append(imagem, informacoes);

        const quantidade = criarElemento('div', {
            classes: ['pilula-quantidade'],
            atributos: { 'aria-label': 'Quantidade de ' + produto.nome }
        });
        const diminuir = criarBotao({
            classes: ['btn-qtd', 'btn-menos'],
            rotulo: produto.quantidade === 1 ? 'Remover ' + produto.nome : 'Diminuir quantidade de ' + produto.nome,
            acao: 'diminuir-favorito',
            titulo: produto.quantidade === 1 ? 'Remover' : 'Diminuir'
        });
        diminuir.appendChild(criarIcone(produto.quantidade === 1 ? 'delete' : 'remove'));

        const numero = criarElemento('span', {
            classes: ['qtd-numero'],
            texto: produto.quantidade,
            atributos: { 'aria-live': 'polite' }
        });
        const aumentar = criarBotao({
            classes: ['btn-qtd', 'btn-mais'],
            rotulo: 'Aumentar quantidade de ' + produto.nome,
            acao: 'aumentar-favorito',
            titulo: 'Aumentar'
        });
        aumentar.appendChild(criarIcone('add'));

        quantidade.append(diminuir, numero, aumentar);
        card.append(detalhes, quantidade);
        fragmento.appendChild(card);
    });

    container.appendChild(fragmento);
}

export function controlarVisibilidadeBotaoPaginacao(deveMostrar, carregando = false) {
    const botao = document.getElementById('btn-proxima-pagina');
    if (!botao) return;

    botao.hidden = !deveMostrar;
    botao.disabled = carregando;
    botao.textContent = carregando ? 'Carregando...' : 'Carregar mais';
    botao.setAttribute('aria-busy', String(carregando));
}

export function controlarVisibilidadeBotaoCatalogoCompleto(deveMostrar) {
    const botao = document.getElementById('btn-ver-catalogo-completo');
    if (botao) {
        botao.hidden = !deveMostrar;
    }
}

export function atualizarTituloCatalogo(modo = 'catalogo', parametros = {}) {
    const titulo = document.getElementById('titulo-catalogo');

    if (!titulo) return;

    switch (modo) {
        case 'busca':
            titulo.textContent = parametros.termo
                ? `Resultados para “${parametros.termo}”`
                : 'Resultados da busca';
            break;

        case 'filtro':
            titulo.textContent = 'Presentes escolhidos para você';
            break;

        case 'categoria':
            titulo.textContent = parametros.categoria || 'Produtos da categoria';
            break;

        default:
            titulo.textContent = 'Destaques';
    }
}

export function ocultarLoader() {
    const loader = document.getElementById('loader-overlay');
    if (!loader) return;

    loader.classList.add('oculto');
    setTimeout(() => loader.remove(), 400);
}

export function favNavbar(quantidade) {
    const botao = document.getElementById('btn-favorite');
    if (!botao) return;

    botao.classList.toggle('favoritado', quantidade > 0);
    botao.setAttribute('aria-label', quantidade > 0
        ? 'Abrir favoritos, ' + quantidade + ' itens'
        : 'Abrir favoritos');
}

export function atualizarTotalFavoritos(listaFavoritos) {
    const total = document.getElementById('total-favoritos');
    if (!total) return;

    const valorTotal = normalizarListaFavoritos(listaFavoritos).reduce((acumulador, produto) => {
        return acumulador + (produto.preco * produto.quantidade);
    }, 0);

    total.textContent = formatarMoeda(valorTotal);
}

export function mostrarToast(mensagem, tipo = 'sucesso') {
    document.getElementById('toast-feedback')?.remove();
    clearTimeout(temporizadorToast);

    const toast = criarElemento('div', {
        atributos: {
            id: 'toast-feedback',
            role: 'status',
            'aria-live': 'polite'
        },
        texto: mensagem
    });
    toast.className = 'mostrar ' + tipo;

    const dialogAberto = document.querySelector('dialog[open]');
    (dialogAberto || document.body).appendChild(toast);

    temporizadorToast = setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

export function enviarOrcamentoWhatsApp(listaFavoritos) {
    const mensagem = montarMensagemOrcamento(listaFavoritos);

    if (!mensagem) {
        mostrarToast('Sua lista de favoritos está vazia!', 'removido');
        return;
    }

    const url = criarUrlWhatsApp('principal', mensagem);
    window.open(url, '_blank', 'noopener,noreferrer');
}

export function atualizarModalProdutoUI(produtoSelecionado, verificarFavorito) {
    const produto = normalizarProduto(produtoSelecionado);
    const imagemPrincipal = document.getElementById('modal-img');
    const containerMiniaturas = document.getElementById('miniaturas');
    const botaoFavoritar = document.getElementById('btn-favoritar-modal');
    const parcela = document.getElementById('modal-parcela');

    if (!produto || !imagemPrincipal || !containerMiniaturas || !botaoFavoritar || !parcela) {
        return;
    }

    containerMiniaturas.replaceChildren();
    configurarImagemDeProduto(imagemPrincipal, produto.codigo, produto.nome);

    const imagens = [1, 2, 3].map((indice) => criarUrlImagem(URL_BUCKET_PRODUTOS, produto.codigo, indice));
    const fragmento = document.createDocumentFragment();

    imagens.forEach((urlImagem, indice) => {
        const wrapper = criarElemento('div', {
            classes: ['miniatura-wrapper', 'skeleton']
        });
        const miniatura = criarElemento('img', {
            atributos: {
                alt: produto.nome,
                loading: 'lazy',
                width: 60,
                height: 60
            }
        });

        if (indice === 0) {
            miniatura.classList.add('ativa');
        }

        miniatura.decoding = 'async';
        miniatura.addEventListener('load', () => wrapper.classList.remove('skeleton'), { once: true });
        miniatura.addEventListener('error', () => {
            wrapper.remove();
        }, { once: true });
        miniatura.src = urlImagem;

        miniatura.addEventListener('click', () => {
            imagemPrincipal.src = urlImagem;
            containerMiniaturas.querySelectorAll('img').forEach((imagem) => imagem.classList.remove('ativa'));
            miniatura.classList.add('ativa');
        });

        wrapper.appendChild(miniatura);
        fragmento.appendChild(wrapper);
    });

    containerMiniaturas.appendChild(fragmento);
    configurarGestosGaleria(imagemPrincipal, imagens);

    document.getElementById('modal-nome').textContent = produto.nome;
    document.getElementById('modal-preco').textContent = formatarMoeda(produto.preco);
    if (produto.preco > 600) {
        parcela.textContent = 'ou até 6x de ' + formatarMoeda(produto.preco / 6) + ' sem juros';
    }
    else if (produto.preco > 500) {
        parcela.textContent = 'ou até 5x de ' + formatarMoeda(produto.preco / 5) + ' sem juros';
    }
    else if (produto.preco > 300) {
        parcela.textContent = 'ou até 4x de ' + formatarMoeda(produto.preco / 4) + ' sem juros';
    }
    else if (produto.preco > 120) {
        parcela.textContent = 'ou até 3x de ' + formatarMoeda(produto.preco / 3) + ' sem juros';
    } 
    else if (produto.preco > 60) {
        parcela.textContent = 'ou 2x de ' + formatarMoeda(produto.preco / 2) + ' sem juros';
    } else {
        parcela.textContent = 'pagamento à vista ou em 1x no cartão';
    }

    const categoria = document.getElementById('modal-categoria');
    categoria.textContent = produto.categoria;
    categoria.hidden = !produto.categoria;
    document.getElementById('modal-descricao').textContent = produto.descricao || 'Descrição não informada.';

    const jaEhFavorito = verificarFavorito(produto.codigo);
    botaoFavoritar.textContent = jaEhFavorito ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
    botaoFavoritar.classList.toggle('esta-favoritado', jaEhFavorito);
    botaoFavoritar.setAttribute('aria-label', botaoFavoritar.textContent + ': ' + produto.nome);
}
