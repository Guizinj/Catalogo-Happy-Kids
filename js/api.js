import { supabase } from './config.js'

export async function buscarTodosOsProdutos(){
    try{
        const {data, error} = await supabase.from('produtos').select('*').order('id', { ascending: false });
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