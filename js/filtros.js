export function converterFaixaDePreco(faixa){
    switch(faixa){
        case "ate-50":
            return {min: null, max: 50};
        case "50-100":
            return {min: null, max: 100};
        case "100-200":
            return {min: null, max: 200};
        case "200+":
            return{min: 200, max: null};   
        case "livre":
            return {min: null, max: null};            
    };
};