import { URL_BUCKET_PRODUTOS } from "./config.js";
import { buscarTodosOsProdutos, buscarProdutosPorNome, buscarProdutosPorFiltros, buscarProdutosPorCodigos } from "./api.js";
import { renderizarListaFavoritos, renderizarProdutos, controlarVisibilidadeBotaoPaginacao, controlarVisibilidadeBotaoCatalogoCompleto, ocultarLoader, favNavbar, atualizarTotalFavoritos, mostrarToast, enviarOrcamentoWhatsApp, atualizarModalProdutoUI } from "./ui.js";
import { configurarModalMenu, configurarModalFavoritos, configurarModalMagic } from "./modais.js";
import { mensagensNoTopo } from "./banner.js";
import { carregarFavoritos, obterFavoritos, verificarFavorito, buscarFavorito, alternarFavorito, removerFavorito, alterarQuantidade, obterQuantidade, atualizarPrecosFavoritos } from "./storage.js";

// Este arquivo é o "maestro" da aplicação: importa dados (api.js), estado (storage.js)
// e visual (ui.js) e conecta tudo através de eventos de clique/submit do usuário.
// Nenhuma manipulação direta de HTML deveria acontecer aqui — isso é papel do ui.js.


/* ESTADOS GLOBAIS DA PÁGINA ATUAL */
// Guardam o que está sendo exibido no grid AGORA, pra outras funções (como abrir
// o modal de detalhes) saberem qual produto foi clicado sem precisar buscar de novo na API.
let produtosAtuais = [];
let paginaAtual = 0;
const limitePorPagina = 14;


/**
 * Ponte de comunicação: pega o estado atual de favoritos (storage.js)
 * e manda atualizar TUDO que depende dele na tela (ui.js).
 *
 * Chamada sempre que a lista de favoritos muda: adicionar, remover, alterar quantidade.
 * Chamadores: configurarModalProduto(), configurarCliqueNoGrid(),
 * configurarEventosModalFavoritosConteudo() (várias vezes neste arquivo)
 */
function sincronizarInterfaceFavoritos() {
    const lista = obterFavoritos(); // vem de storage.js

    renderizarListaFavoritos(lista);     // desenha os mini-cards no modal de favoritos (ui.js)
    favNavbar(lista.length);             // acende o coração da navbar se lista.length > 0 (ui.js)
    atualizarTotalFavoritos(lista);      // calcula e escreve o preço total (ui.js)
}


/**
 * Faz o "miolo" comum de favoritar/desfavoritar um produto: chama o toggle em
 * storage.js, decide qual toast mostrar, marca ou desmarca o ícone de coração
 * indicado, e sincroniza o resto da interface (modal de favoritos, navbar, total).
 *
 * Correção de bug (duplicação): antes, esse bloco de 10 linhas existia repetido
 * em DOIS lugares — no botão do modal de detalhes e no clique do coração no
 * grid — cada um com uma pequena variação. Se um dia precisássemos mudar o
 * texto do toast, por exemplo, teríamos que lembrar de mudar nos dois lugares.
 * Agora existe uma única versão, e cada chamador só cuida do que é
 * ESPECÍFICO dele (abrir modal com ou sem atraso, atualizar botão interno, etc.)
 *
 * Chamada por: configurarModalProduto() e configurarCliqueNoGrid()
 *
 * Recebe: o produto sendo favoritado/desfavoritado, e o elemento do ícone de
 * coração que deve ser marcado/desmarcado na tela (pode ser null, se por
 * algum motivo o ícone não existir no momento — ex: produto não está mais
 * visível no grid)
 *
 * Retorna: { foiAdicionado } — quem chamou usa isso pra decidir a parte
 * específica (abrir modal de favoritos, com ou sem atraso, etc.)
 */
function favoritarComFeedback(produto, iconeCoracao) {
    const { foiAdicionado } = alternarFavorito(produto); // storage.js

    // .toggle(classe, condicao) adiciona a classe se condicao for true,
    // remove se for false — substitui o if/else que existia antes
    if (iconeCoracao) {
        iconeCoracao.classList.toggle('favoritado', foiAdicionado);
    }

    mostrarToast(
        foiAdicionado ? 'Item adicionado aos favoritos' : 'Item removido dos favoritos',
        foiAdicionado ? 'sucesso' : 'removido'
    );

    sincronizarInterfaceFavoritos();

    return { foiAdicionado };
}


/**
 * Orquestra o carregamento inicial da loja: busca a primeira página de produtos,
 * carrega os favoritos salvos, renderiza tudo e esconde o loader.
 *
 * Chamada por: o próprio arquivo, no listener de DOMContentLoaded (final do arquivo)
 * Busca dados em: api.js → buscarTodosOsProdutos()
 * Manda desenhar em: ui.js → renderizarProdutos(), ocultarLoader(), etc.
 */
async function iniciarLoja() {
    try {
        paginaAtual = 0;

        // Promise.all roda as duas promises AO MESMO TEMPO e só continua quando
        // AMBAS terminarem. Aqui é um truque de UX: garante que o loader fique
        // visível por pelo menos 100ms, mesmo se a busca no Supabase for instantânea
        // (evita um "piscar" feio na tela).
        const [produtos] = await Promise.all([
            buscarTodosOsProdutos(paginaAtual, limitePorPagina),
            new Promise(resolve => setTimeout(resolve, 100))
        ]);

        produtosAtuais = produtos;

        // Puxa a memória local (localStorage → variável em storage.js)
        carregarFavoritos();

        // CORREÇÃO "preço congelado": os favoritos salvos no localStorage podem
        // ter dados antigos (o cliente favoritou há dias/semanas e o preço pode
        // ter mudado desde então no banco). Antes de desenhar qualquer coisa na
        // tela, buscamos os dados de HOJE desses produtos específicos e
        // corrigimos o que está guardado localmente.
        //
        // Nota: isso só acontece aqui, uma vez, ao carregar a página — não em
        // tempo real. Se o preço mudar enquanto o cliente já está com a loja
        // aberta, ele só vai ver o valor novo na próxima vez que recarregar.
        // Pra essa loja isso é suficiente: o cenário raro de alguém ficar com
        // a aba aberta por dias enquanto o preço muda no meio do caminho não
        // compensa o custo de ficar consultando o banco toda hora.
        const codigosFavoritados = obterFavoritos().map(favorito => favorito.codigo);
        const favoritosAtualizados = await buscarProdutosPorCodigos(codigosFavoritados);
        atualizarPrecosFavoritos(favoritosAtualizados);

        // Renderiza tudo injetando os favoritos (já com preços em dia) para
        // a verificação de corações ativos
        renderizarProdutos(produtosAtuais, false, obterFavoritos());
        sincronizarInterfaceFavoritos();

        controlarVisibilidadeBotaoPaginacao(true);
        controlarVisibilidadeBotaoCatalogoCompleto(false); // sem busca/filtro ativo ainda, então escondido
        ocultarLoader();
    } catch (erro) {
        console.error('Falha ao iniciar loja', erro);
        ocultarLoader(); // mesmo com erro, tira o loader pra não travar o usuário
        // Antes, o cliente só via a loja vazia sem entender por quê. Agora
        // ele sabe que foi um problema técnico, não que "não tem produto".
        mostrarToast('Não foi possível carregar a loja. Tente recarregar a página.', 'removido');
    }
}


/**
 * Busca a próxima página de produtos e ACRESCENTA ao grid existente (não substitui).
 *
 * Chamada por: configurarProximaPagina() → clique em #btn-proxima-pagina
 * Busca dados em: api.js → buscarTodosOsProdutos()
 */
async function carregarProximaPagina() {
    try {
        paginaAtual++;
        const novosProdutos = await buscarTodosOsProdutos(paginaAtual, limitePorPagina);

        if (novosProdutos.length > 0) {
            // .concat() junta os arrays sem alterar o original — mantém produtosAtuais
            // sempre com TODOS os produtos já carregados (necessário pra abrir o modal depois)
            produtosAtuais = produtosAtuais.concat(novosProdutos);
            renderizarProdutos(novosProdutos, true, obterFavoritos()); // true = acrescentar
        } else {
            controlarVisibilidadeBotaoPaginacao(false); // acabaram os produtos, esconde o botão
        }
    } catch (erro) {
        console.error('Falha ao carregar próxima página', erro);
        // Antes, esse erro só ia pro console — o cliente clicava em "Carregar
        // mais" e nada acontecia, sem entender por quê. Agora avisamos.
        mostrarToast('Não foi possível carregar mais produtos. Tente novamente.', 'removido');
    }
}


/**
 * Liga o clique do botão "próxima página" à função que busca mais produtos.
 */
function configurarProximaPagina() {
    const btnProximaPagina = document.getElementById('btn-proxima-pagina');
    if (btnProximaPagina) {
        btnProximaPagina.addEventListener('click', carregarProximaPagina);
    }
}


/**
 * Correção de bug (paginação sem caminho de volta): depois de uma busca por
 * nome ou do filtro mágico, produtosAtuais deixa de ser a lista paginada
 * original, e não existia nenhum jeito de voltar pra ela sem recarregar a
 * página inteira (F5) — o que fecharia qualquer modal aberto e perderia o
 * scroll do cliente. Esta função refaz exatamente o que iniciarLoja() faz
 * pra buscar a página 0, mas sem mexer no loader de tela cheia (a loja já
 * está carregada, não faz sentido mostrar aquele overlay de novo).
 *
 * Chamada por: configurarBotaoVerCatalogoCompleto() → clique em
 * #btn-ver-catalogo-completo (que só aparece depois de busca/filtro)
 */
async function voltarParaCatalogoCompleto() {
    try {
        paginaAtual = 0;
        produtosAtuais = await buscarTodosOsProdutos(paginaAtual, limitePorPagina);

        renderizarProdutos(produtosAtuais, false, obterFavoritos()); // false = substitui o grid inteiro

        controlarVisibilidadeBotaoPaginacao(true);           // catálogo normal tem paginação de volta
        controlarVisibilidadeBotaoCatalogoCompleto(false);    // já voltamos, esconde este botão

        const gridProdutos = document.querySelector('.conteudo');
        if (gridProdutos) gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (erro) {
        console.error('Falha ao voltar para o catálogo completo', erro);
        mostrarToast('Não foi possível carregar o catálogo. Tente novamente.', 'removido');
    }
}


/**
 * Liga o clique do botão "← Ver catálogo completo" à função que volta
 * pro catálogo paginado normal.
 */
function configurarBotaoVerCatalogoCompleto() {
    const btnVerCatalogoCompleto = document.getElementById('btn-ver-catalogo-completo');
    if (btnVerCatalogoCompleto) {
        btnVerCatalogoCompleto.addEventListener('click', voltarParaCatalogoCompleto);
    }
}


/* FILTROS E BUSCAS */

/**
 * Configura o formulário de busca por nome (a lupa).
 *
 * Busca dados em: api.js → buscarProdutosPorNome()
 * Manda desenhar em: ui.js → renderizarProdutos()
 */
function configurarPesquisa() {
    const campoLupa = document.getElementById('campo-lupa');
    const modalMenu = document.getElementById('modal-menu');
    const formPesquisa = document.getElementById('form-pesquisa');

    formPesquisa.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // impede o formulário de recarregar a página (comportamento padrão do HTML)
        const valorCampoLupa = campoLupa.value.trim(); // .trim() remove espaços em branco do início/fim

        if (valorCampoLupa === '') {
            campoLupa.placeholder = 'Digite algo para buscar!';
            campoLupa.focus();
            return;
        }

        // try/catch aqui: se buscarProdutosPorNome() lançar erro (falha real de
        // conexão/banco), NÃO queremos sobrescrever produtosAtuais com um resultado
        // ambíguo nem fechar o modal como se a busca tivesse dado certo — melhor
        // avisar o cliente e deixar ele tentar de novo.
        try {
            produtosAtuais = await buscarProdutosPorNome(valorCampoLupa);
        } catch (erro) {
            console.error('Falha na busca por nome', erro);
            mostrarToast('Não foi possível buscar. Tente novamente.', 'removido');
            return;
        }

        renderizarProdutos(produtosAtuais, false, obterFavoritos()); // false = substitui o grid inteiro
        controlarVisibilidadeBotaoPaginacao(false); // busca não tem paginação
        controlarVisibilidadeBotaoCatalogoCompleto(true); // mostra o caminho de volta pro catálogo completo

        campoLupa.blur();   // tira o foco do campo (fecha teclado no celular)
        modalMenu.close();  // fecha o modal do menu onde fica a busca

        setTimeout(() => {
            const gridProdutos = document.querySelector('.conteudo');
            if (gridProdutos) gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1000);
    });
}


/**
 * Configura o formulário do filtro "Magic" (idade + gênero).
 *
 * Busca dados em: api.js → buscarProdutosPorFiltros()
 * Manda desenhar em: ui.js → renderizarProdutos()
 */
function configurarFiltroMagico() {
    const formFiltro = document.getElementById('formFiltro');
    const modalMagic = document.getElementById('meuModal');

    formFiltro.addEventListener('submit', async (e) => {
        e.preventDefault();

        // FormData lê todos os campos (input/select) de dentro do <form> de uma vez,
        // sem precisar pegar cada um por getElementById. dadosForm.get('nome_do_campo')
        // retorna o valor daquele input específico (baseado no atributo "name" do HTML).
        const dadosForm = new FormData(formFiltro);

        const filtros = {
            idade: Number(dadosForm.get('idade')),   // Number() converte a string do input pra número
            genero: dadosForm.get('para_quem'),
        };

        // Mesmo raciocínio da busca por nome: se a consulta falhar de verdade,
        // avisamos e paramos aqui — não fechamos o modal nem mexemos no grid.
        try {
            produtosAtuais = await buscarProdutosPorFiltros(filtros);
        } catch (erro) {
            console.error('Falha no filtro mágico', erro);
            mostrarToast('Não foi possível buscar. Tente novamente.', 'removido');
            return;
        }

        renderizarProdutos(produtosAtuais, false, obterFavoritos());
        controlarVisibilidadeBotaoPaginacao(false);
        controlarVisibilidadeBotaoCatalogoCompleto(true); // mostra o caminho de volta pro catálogo completo
        modalMagic.close();

        const gridProdutos = document.querySelector('.conteudo');
        if (gridProdutos) gridProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}


/* EVENTOS DE MODAL DE PRODUTO */

/**
 * Configura a abertura do modal de detalhes do produto e o botão de favoritar
 * que fica DENTRO desse modal.
 *
 * Usa: storage.js → verificarFavorito(), buscarFavorito(), alternarFavorito()
 * Manda desenhar em: ui.js → atualizarModalProdutoUI(), mostrarToast()
 */
function configurarModalProduto() {
    const modalFav = document.getElementById('dialog-favorite');
    const modalProduto = document.getElementById('modal-produto');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnFavoritarModal = document.getElementById('btn-favoritar-modal');
    let produtoAtualNoModal = null; // guarda qual produto está aberto no modal agora

    function exibirDetalhes(produtoSelecionado) {
        produtoAtualNoModal = produtoSelecionado;
        // Chama a função visual isolada no ui.js, passando verificarFavorito como
        // callback (função repassada como argumento) pra ui.js poder checar o
        // estado de favorito sem precisar importar storage.js diretamente
        atualizarModalProdutoUI(produtoSelecionado, verificarFavorito);
        modalProduto.showModal();
    }

    // Abertura do Modal via Delegação de Eventos: em vez de colocar um listener
    // em CADA card (que nem existem todos ainda, já que a página carrega aos poucos),
    // colocamos UM listener no document inteiro e usamos .closest() pra descobrir
    // se o clique aconteceu dentro de um card. Isso funciona até com cards criados depois.
    document.addEventListener('click', (evento) => {
        const cardClicado = evento.target.closest('.card-produto');
        if (cardClicado) {
            // .contains() aqui checa se a classe 'favorite' está entre as classes do
            // elemento clicado — usado pra NÃO abrir o modal quando o clique foi no coração
            if (evento.target.classList.contains('favorite') || evento.target.closest('.btn-header')) return;

            // == (e não ===) porque data-id vem como string do HTML e p.codigo pode ser number
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == cardClicado.getAttribute('data-id'));
            if (produtoSelecionado) exibirDetalhes(produtoSelecionado);
            return;
        }

        const miniCardClicado = evento.target.closest('.card-favorito-mini');
        if (miniCardClicado) {
            if (evento.target.closest('.pilula-quantidade') || evento.target.closest('.btn-remover-favorito')) return;
            const produtoSelecionado = buscarFavorito(miniCardClicado.getAttribute('data-id'));
            if (produtoSelecionado) exibirDetalhes(produtoSelecionado);
        }
    });

    // Ação do Botão Interno (favoritar/desfavoritar de dentro do modal de detalhes)
    if (btnFavoritarModal) {
        btnFavoritarModal.addEventListener('click', () => {
            if (!produtoAtualNoModal) return;

            // O ícone que precisa ser atualizado aqui é o do GRID, não o botão
            // deste modal — o botão do modal é tratado à parte, logo abaixo,
            // por atualizarModalProdutoUI (que muda texto e cor, não só a classe)
            const iconeCoracaoNoGrid = document.querySelector(`.card-produto[data-id="${produtoAtualNoModal.codigo}"] .favorite`);
            const { foiAdicionado } = favoritarComFeedback(produtoAtualNoModal, iconeCoracaoNoGrid);

            // Parte específica deste fluxo: se acabou de adicionar, fecha o
            // modal de produto e abre o de favoritos, com um pequeno atraso
            // pra dar tempo da animação de fechar não brigar com a de abrir
            if (foiAdicionado) {
                setTimeout(() => { modalProduto.close(); }, 500);
                setTimeout(() => { modalFav.showModal(); }, 500);
            }

            // Atualiza o estado visual do botão após o clique utilizando a função do ui.js
            atualizarModalProdutoUI(produtoAtualNoModal, verificarFavorito);
        });
    }

    btnFecharModal.addEventListener('click', () => modalProduto.close());
}


/* EVENTOS DE FAVORITOS (GRID E CARRINHO) */

/**
 * Configura o clique no coração de favoritar DIRETO no grid de produtos (sem abrir modal).
 * Usa delegação de evento no #grid, igual à ideia explicada acima.
 */
function configurarCliqueNoGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        // .classList.contains() checa se o elemento clicado tem a classe 'favorite'
        // (ou seja, se o clique foi exatamente no ícone de coração)
        if (e.target.classList.contains('favorite')) {
            const modalFav = document.getElementById('dialog-favorite');
            const idProduto = e.target.closest('.card-produto').getAttribute('data-id');

            // .find() percorre o array e retorna o PRIMEIRO item que bate com a condição
            // (ou undefined se nenhum bater) — diferente de .some(), que só responde true/false
            const produtoSelecionado = produtosAtuais.find(p => p.codigo == idProduto);

            if (produtoSelecionado) {
                const { foiAdicionado } = favoritarComFeedback(produtoSelecionado, e.target);

                if (foiAdicionado) {
                   setTimeout(() => { modalFav.showModal(); }, 500);
                }
            }
        }
    });
}


/**
 * Configura os controles de quantidade (+/-) e a confirmação de remoção
 * dentro do modal de favoritos.
 *
 * Usa: storage.js → obterQuantidade(), alterarQuantidade(), removerFavorito()
 */
function configurarEventosModalFavoritosConteudo() {
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    let idProdutoPendente = null; // guarda o produto aguardando confirmação de remoção

    document.getElementById('btn-cancelar-remocao').addEventListener('click', () => {
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    document.getElementById('btn-confirmar-remocao').addEventListener('click', () => {
        if (idProdutoPendente) {
            removerFavorito(idProdutoPendente);
            const iconeCoracao = document.querySelector(`.card-produto[data-id="${idProdutoPendente}"] .favorite`);
            if (iconeCoracao) iconeCoracao.classList.remove('favoritado');
            sincronizarInterfaceFavoritos();
            mostrarToast('Item removido dos favoritos', 'removido');
        }
        idProdutoPendente = null;
        modalConfirmacao.close();
    });

    // Delegação de evento de novo: os mini-cards de favorito são recriados toda hora
    // (renderizarListaFavoritos reescreve o innerHTML), então um listener fixo em
    // cada botão não funcionaria — por isso o listener fica no document
    document.addEventListener('click', (e) => {
        const btnMenos = e.target.closest('.btn-menos');
        if (btnMenos) {
            const idProduto = btnMenos.closest('.card-favorito-mini').getAttribute('data-id');
            const qtdAtual = obterQuantidade(idProduto);

            if (qtdAtual > 1) {
                alterarQuantidade(idProduto, 'subtrair');
                sincronizarInterfaceFavoritos();
            } else if (qtdAtual === 1) {
                // Se a quantidade é 1 e o usuário clica em "-", em vez de zerar direto,
                // abre um modal pedindo confirmação (evita remoção acidental)
                idProdutoPendente = idProduto;
                modalConfirmacao.showModal();
            }
        }

        const btnMais = e.target.closest('.btn-mais');
        if (btnMais) {
            const idProduto = btnMais.closest('.card-favorito-mini').getAttribute('data-id');
            alterarQuantidade(idProduto, 'somar');
            sincronizarInterfaceFavoritos();
        }
    });
}


/**
 * Liga o clique do botão "Consultar no WhatsApp" à função que monta e abre a mensagem.
 */
function configurarBotaoConsultar() {
    const btnConsultar = document.getElementById('btn-consultar-favoritos');
    if (btnConsultar) {
        btnConsultar.addEventListener('click', () => enviarOrcamentoWhatsApp(obterFavoritos()));
    }
}


/* INICIALIZAÇÃO GERAL */
// DOMContentLoaded dispara quando o HTML terminou de ser carregado e montado
// (antes de imagens/CSS externos terminarem, o que é mais rápido que 'load').
// É aqui que TODAS as funções de configuração ligam seus eventos, e a loja começa a carregar.
document.addEventListener('DOMContentLoaded', () => {
    iniciarLoja();
    configurarPesquisa();
    configurarCliqueNoGrid();
    configurarModalProduto();
    configurarModalFavoritos();               // vem de modais.js
    configurarEventosModalFavoritosConteudo();
    configurarModalMagic();                    // vem de modais.js
    configurarModalMenu();                     // vem de modais.js
    mensagensNoTopo();                         // vem de banner.js
    configurarFiltroMagico();
    configurarProximaPagina();
    configurarBotaoVerCatalogoCompleto();
    configurarBotaoConsultar();
});