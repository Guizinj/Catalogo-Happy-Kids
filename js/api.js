import { supabase } from './config.js'

export async function buscarTodosOsProdutos(){
    try{
        const {data, error} = await supabase.from('produtos').select('*').order('codigo', { ascending: false });
        if(error){
            console.error('Erro na aquisição', error.message);
            return [];
        }
        return data;
    }
    catch (erroCatch) {
         console.error ('Erro crítico', erroCatch);
         return [];
        }
};

export async function buscarProdutosPorNome (filtro){
    try {
        const {data, error} = await supabase.from('produtos')
        .select('*').ilike('nome' , `%${filtro}%`);
        if (error){
            console.error ('Erro no filtro', error.message);
            return [];
        }
        return data;
    }
    catch (erroCatch){
        console.error('Erro específico no filtro', erroCatch)
        return [];
    }
}

export async function buscarProdutosPorFiltros(filtros){
    try{
        let consulta = supabase.from('produtos').select('*');

        if(filtros.idade !== null && filtros.idade !== undefined){
            consulta = consulta.lte('idade_recomendada', filtros.idade);
        }
        if(filtros.genero){
            consulta = consulta.eq('genero', filtros.genero);
        }

        const {data, error} = await consulta;
        if(error){
            console.error('erro no filtro', error.message);
            return [];
        }
        return data;
    }
    catch(erroCatch){
        console.error('erro critico', erroCatch);
        return [];
    }
}

