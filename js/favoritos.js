export function buscarFavoritosNoLocalStorage() {
    const favoritosEmTexto = localStorage.getItem('meusFavoritos');
    if(favoritosEmTexto){
        return JSON.parse(favoritosEmTexto);
    }
    return [];
};

export function alternarFavoritos(id) {
    const listaDeFavoritos = buscarFavoritosNoLocalStorage();

    const index = listaDeFavoritos.indexOf(id);
    if(index > -1){
        listaDeFavoritos.splice(index, 1);
    }
    else {
        listaDeFavoritos.push(id)
    }
    const novaListaDeFavoritosEmTexto = listaDeFavoritos.JSON.stringify(listaDeFavoritos);
    localStorage.setItem('meusFavorits', novaListaDeFavoritosEmTexto);

    return listaDeFavoritos;
}