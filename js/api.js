import { supabase } from './config.js';
import {
    CAMPOS_PRODUTO_PUBLICOS,
    escaparPadraoIlike,
    normalizarListaProdutos
} from './domain.js';

function aplicarOrdenacao(consulta) {
    return consulta
        .order('destaque', { ascending: true, nullsFirst: false })
        .order('codigo', { ascending: true });
}

async function executarConsultaPaginada(consulta, pagina = 0, limite = 14) {
    const paginaNormalizada = Math.max(0, Number.parseInt(pagina, 10) || 0);
    const limiteNormalizado = Math.max(1, Number.parseInt(limite, 10) || 14);
    const inicio = paginaNormalizada * limiteNormalizado;

    // Busca um registro extra para saber se existe uma próxima página sem
    // executar uma consulta de contagem adicional.
    const { data, error } = await consulta.range(inicio, inicio + limiteNormalizado);

    if (error) {
        console.error('Erro ao buscar produtos', error.message);
        throw new Error('Não foi possível buscar os produtos.');
    }

    const dados = Array.isArray(data) ? data : [];
    const produtos = normalizarListaProdutos(dados);

    return {
        produtos: produtos.slice(0, limiteNormalizado),
        temMais: dados.length > limiteNormalizado
    };
}

export async function buscarTodosOsProdutos(pagina = 0, limite = 14) {
    const consulta = aplicarOrdenacao(
        supabase
            .from('produtos')
            .select(CAMPOS_PRODUTO_PUBLICOS)
            .eq('estoque', true)
    );

    return executarConsultaPaginada(consulta, pagina, limite);
}

export async function buscarProdutosPorNome(filtro, pagina = 0, limite = 14) {
    const termo = String(filtro ?? '').trim();

    if (!termo) {
        return { produtos: [], temMais: false };
    }

    const consulta = aplicarOrdenacao(
        supabase
            .from('produtos')
            .select(CAMPOS_PRODUTO_PUBLICOS)
            .eq('estoque', true)
            .ilike('nome', '%' + escaparPadraoIlike(termo) + '%')
    );

    return executarConsultaPaginada(consulta, pagina, limite);
}

export async function buscarProdutosPorFiltros(filtros = {}, pagina = 0, limite = 14) {
    let consulta = supabase
        .from('produtos')
        .select(CAMPOS_PRODUTO_PUBLICOS)
        .eq('estoque', true);

    const idade = Number(filtros.idade);
    if (Number.isFinite(idade) && idade > 0) {
        consulta = consulta.lte('idade_recomendada', idade);
    }

    if (filtros.marca) {
        consulta = consulta.eq('marca', String(filtros.marca));
    }

    if (filtros.genero) {
        consulta = consulta.eq('genero', String(filtros.genero));
    }

    return executarConsultaPaginada(aplicarOrdenacao(consulta), pagina, limite);
}

export async function buscarProdutosPorCodigos(codigos) {
    const codigosValidos = [...new Set(
        (Array.isArray(codigos) ? codigos : [])
            .map((codigo) => String(codigo).trim())
            .filter((codigo) => /^[A-Za-z0-9_-]{1,64}$/.test(codigo))
    )];

    if (codigosValidos.length === 0) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('produtos')
            .select(CAMPOS_PRODUTO_PUBLICOS)
            .in('codigo', codigosValidos);

        if (error) {
            console.error('Erro ao atualizar favoritos', error.message);
            return [];
        }

        return normalizarListaProdutos(data);
    } catch (erro) {
        console.error('Erro crítico ao atualizar favoritos', erro);
        return [];
    }
}

export async function buscarProdutosPorCategoria(categoria, pagina = 0, limite = 14) {
    const categoriaNormalizada = String(categoria ?? '').trim();

    if (!categoriaNormalizada) {
        return { produtos: [], temMais: false };
    }

    // A categoria atual é um rótulo comercial completo. A comparação parcial
    // preserva compatibilidade com o catálogo existente; caracteres curingas
    // são escapados. Quando o banco ganhar um identificador normalizado, esta
    // consulta deve migrar para ele.
    const consulta = aplicarOrdenacao(
        supabase
            .from('produtos')
            .select(CAMPOS_PRODUTO_PUBLICOS)
            .eq('estoque', true)
            .ilike('categoria', '%' + escaparPadraoIlike(categoriaNormalizada) + '%')
    );

    return executarConsultaPaginada(consulta, pagina, limite);
}
