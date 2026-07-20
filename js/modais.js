  
     /*ABRIR E FECHAR O MODAL DIALOG DO MENU */
export function configurarModalMenu() {
    const modalMenu = document.getElementById('modal-menu');
    const btnAbrirMenu = document.getElementById('bar');
    const btnFecharMenu = document.getElementById('btn-fechar-menu');
    const search =  document.getElementById('search');
    const campoLupa = document.getElementById('campo-lupa');

    btnAbrirMenu.addEventListener('click', () => {
        modalMenu.showModal();
    });
    btnFecharMenu.addEventListener('click', () => {
        modalMenu.close();
    });
    search.addEventListener('click', () => {
        modalMenu.showModal();
        campoLupa.focus();
    });
};

     /* ABRIR E FECHAR DIALOG DE FAVORITOS*/
export function configurarModalFavorito() {
    const modalFav = document.getElementById('dialog-favorite');
    const btnAbrirFav = document.getElementById('btn-favorite');
    const btnFecharFav = document.getElementById('btn-fechar-fav');
    const btnExplorar = document.getElementById('btn-explorar-favoritos');

    btnAbrirFav.addEventListener('click', () =>{
        modalFav.showModal();
    })
    btnFecharFav.addEventListener('click', () =>{
        modalFav.close();
    })
    btnExplorar.addEventListener('click', () =>{
        modalFav.close();
        const gridProdutos = document.querySelector('.conteudo');
                if (gridProdutos) {
                    gridProdutos.scrollIntoView({ 
                        behavior: 'smooth'
                    });
                };
    });
};

    /*ABRIR E FECHAR O MODAL DIALOG DO MAGIC */
export function configurarModalMagic(){
    const modalMagic = document.getElementById('meuModal');
    const btnAbrirMagic = document.getElementById('btn-cta');
    const btnFecharMagic = document.getElementById('btn-fechar');

    btnAbrirMagic.addEventListener('click', () => {
        modalMagic.showModal()
    });
    btnFecharMagic.addEventListener('click', () => {
        modalMagic.close()
    });

};