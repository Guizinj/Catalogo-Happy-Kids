import { supabase } from './config.js';

// Cliente Supabase configurado em config.js — todas as consultas dessa camada passam por ele.


/**
 * Busca produtos disponíveis em estoque, com paginação (14 por página por padrão).
 *
 * Chamada por: cordenador.js
 *   - iniciarLoja() → busca a página 0 ao carregar a loja
 *   - carregarProximaPagina() → busca as páginas seguintes no botão "ver mais"
 *
 * Retorna: array de produtos em caso de sucesso.
 *
 * IMPORTANTE (correção de bug): antes, um ERRO de verdade (sem internet, banco
 * fora do ar) retornava [] — o mesmo valor de uma busca que simplesmente não
 * achou nada. Isso fazia o cliente ver "Nenhum produto encontrado" quando na
 * verdade era uma falha técnica. Agora, em caso de erro, a função lança
 * (`throw`) uma exceção — quem chamou (cordenador.js) captura isso num
 * try/catch e mostra um aviso apropriado ("erro ao carregar", não "vazio").
 */
export async function buscarTodosOsProdutos(pagina = 0, limite = 14) {
    const inicio = pagina * limite;
    const fim = inicio + limite - 1;

    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('estoque', true)
        // Puxa os destaques (1 a 10) primeiro e joga quem for NULL para o fim da fila
        .order('destaque', { ascending: true, nullsFirst: false })
        .order('codigo', { ascending: true })
        .range(inicio, fim);

    if (error) {
        console.error('Erro na aquisição', error.message);
        // Lança um erro novo, com mensagem amigável, pra quem chamou saber
        // que isso foi uma FALHA, não uma lista vazia de verdade.
        throw new Error('Não foi possível buscar os produtos.');
    }

    return data;
}


/**
 * Busca produtos em estoque cujo nome contenha o termo digitado (case-insensitive).
 *
 * Chamada por: cordenador.js → configurarPesquisa()
 *   (listener do submit em #form-pesquisa, usando o valor de #campo-lupa)
 *
 * Retorna: array de produtos em caso de sucesso (mesmo que vazio, se a busca
 * simplesmente não encontrar nada — isso NÃO é erro).
 *
 * Em caso de falha real na consulta, lança uma exceção (ver explicação
 * completa em buscarTodosOsProdutos, acima) — quem chamou trata isso.
 */
export async function buscarProdutosPorNome(filtro) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('estoque', true)
        .ilike('nome', `%${filtro}%`);

    if (error) {
        console.error('Erro no filtro', error.message);
        throw new Error('Não foi possível buscar os produtos.');
    }

    return data;
}


/**
 * Busca produtos em estoque aplicando filtros opcionais de idade e gênero.
 * Monta a query dinamicamente conforme os filtros recebidos.
 *
 * Chamada por: cordenador.js → configurarFiltroMagico()
 *   (listener do submit em #formFiltro, dados vindos do modal "Magic" / #meuModal)
 *
 * Recebe: objeto { idade, genero } montado a partir do FormData do formulário
 * Retorna: array de produtos em caso de sucesso.
 *
 * Em caso de falha real na consulta, lança uma exceção (ver explicação
 * completa em buscarTodosOsProdutos, no topo do arquivo).
 */
export async function buscarProdutosPorFiltros(filtros) {
    let consulta = supabase
        .from('produtos')
        .select('*')
        .eq('estoque', true);

    // Filtro de idade só entra na query se foi de fato informado
    if (filtros.idade !== null && filtros.idade !== undefined) {
        consulta = consulta.lte('idade_recomendada', filtros.idade);
    }
    if(filtros.marca){
        consulta = consulta.eq('marca', filtros.marca);
    }

    // Filtro de gênero é opcional
    if (filtros.genero) {
        consulta = consulta.eq('genero', filtros.genero);
    }

    const { data, error } = await consulta;

    if (error) {
        console.error('erro no filtro', error.message);
        throw new Error('Não foi possível buscar os produtos.');
    }

    return data;
}


/**
 * Busca os dados ATUAIS de uma lista específica de produtos, pelo código.
 *
 * Existe pra resolver o problema do "preço congelado" nos favoritos: quando o
 * cliente favorita um produto, guardamos uma cópia dele no localStorage —
 * e essa cópia não se atualiza sozinha se o preço mudar no banco depois.
 * Essa função busca a versão mais recente desses produtos específicos, pra
 * corrigirmos a cópia salva localmente.
 *
 * Não filtramos por `estoque: true` de propósito: um produto favoritado pode
 * ter saído de estoque, mas o cliente continua enxergando ele nos favoritos
 * (só o preço/nome são atualizados, a decisão de remover não é desta função).
 *
 * Chamada por: cordenador.js → iniciarLoja()
 *   (uma vez, logo após carregarFavoritos(), antes de desenhar a tela)
 *
 * Recebe: array de códigos, ex: [12, 45, 78]
 * Retorna: array de produtos atualizados (ou [] em caso de erro/lista vazia)
 */
export async function buscarProdutosPorCodigos(codigos) {
    // Sem códigos pra buscar (ex: cliente ainda não tem favoritos)?
    // Nem chama o Supabase — evita uma consulta desnecessária.
    if (!codigos || codigos.length === 0) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .in('codigo', codigos); // .in() busca, numa consulta só, todos os códigos da lista

        if (error) {
            console.error('Erro ao atualizar preços dos favoritos', error.message);
            return [];
        }

        return data;
    } catch (erroCatch) {
        console.error('Erro crítico ao atualizar preços dos favoritos', erroCatch);
        return [];
    }
}

/**
 * Busca produtos em estoque que pertençam a uma categoria específica.
 *
 * Chamada por: cordenador.js → configurarFiltroCategoria()
 *
 * Recebe: nome da categoria desejada (ex: "Bonecos", "Carros")
 * Retorna: array de produtos daquela categoria em caso de sucesso.
 *
 * Em caso de falha na consulta (sem internet ou erro no banco), lança uma exceção 
 * (throw new Error) para que o coordenador trate o erro e avise o usuário com um toast.
 */
export async function buscarProdutosPorCategoria(categoria) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('estoque', true)
        // Usamos .ilike para ignorar maiúsculas/minúsculas e garantir que ache a categoria
        // Exemplo: se no banco estiver "bonecos" e você passar "Bonecos", ele encontra normal.
        .ilike('categoria', `%${categoria}%`);

    if (error) {
        console.error('Erro ao buscar por categoria:', error.message);
        throw new Error('Não foi possível buscar os produtos desta categoria.');
    }

    return data;
}