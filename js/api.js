import { supabase } from './config.js';

// Cliente Supabase configurado em config.js — todas as consultas dessa camada passam por ele.


/**
 * Busca produtos disponíveis em estoque, com paginação (14 por página por padrão).
 *
 * Chamada por: cordenador.js
 *   - iniciarLoja() → busca a página 0 ao carregar a loja
 *   - carregarProximaPagina() → busca as páginas seguintes no botão "ver mais"
 *
 * Retorna: array de produtos (ou [] em caso de erro) → vai direto para
 * renderizarProdutos() em ui.js
 */
export async function buscarTodosOsProdutos(pagina = 0, limite = 14) {
    const inicio = pagina * limite;
    const fim = inicio + limite - 1;

    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('estoque', true)
            .order('codigo', { ascending: true })
            .range(inicio, fim);

        if (error) {
            console.error('Erro na aquisição', error.message);
            return [];
        }

        return data;
    } catch (erroCatch) {
        console.error('Erro crítico', erroCatch);
        return [];
    }
}


/**
 * Busca produtos em estoque cujo nome contenha o termo digitado (case-insensitive).
 *
 * Chamada por: cordenador.js → configurarPesquisa()
 *   (listener do submit em #form-pesquisa, usando o valor de #campo-lupa)
 *
 * Retorna: array de produtos → substitui produtosAtuais e vai para
 * renderizarProdutos() em ui.js
 */
export async function buscarProdutosPorNome(filtro) {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('estoque', true)
            .ilike('nome', `%${filtro}%`);

        if (error) {
            console.error('Erro no filtro', error.message);
            return [];
        }

        return data;
    } catch (erroCatch) {
        console.error('Erro específico no filtro', erroCatch);
        return [];
    }
}


/**
 * Busca produtos em estoque aplicando filtros opcionais de idade e gênero.
 * Monta a query dinamicamente conforme os filtros recebidos.
 *
 * Chamada por: cordenador.js → configurarFiltroMagico()
 *   (listener do submit em #formFiltro, dados vindos do modal "Magic" / #meuModal)
 *
 * Recebe: objeto { idade, genero } montado a partir do FormData do formulário
 * Retorna: array de produtos → substitui produtosAtuais e vai para
 * renderizarProdutos() em ui.js
 */
export async function buscarProdutosPorFiltros(filtros) {
    try {
        let consulta = supabase
            .from('produtos')
            .select('*')
            .eq('estoque', true);

        // Filtro de idade só entra na query se foi de fato informado
        if (filtros.idade !== null && filtros.idade !== undefined) {
            consulta = consulta.lte('idade_recomendada', filtros.idade);
        }

        // Filtro de gênero é opcional
        if (filtros.genero) {
            consulta = consulta.eq('genero', filtros.genero);
        }

        const { data, error } = await consulta;

        if (error) {
            console.error('erro no filtro', error.message);
            return [];
        }

        return data;
    } catch (erroCatch) {
        console.error('erro critico', erroCatch);
        return [];
    }
}