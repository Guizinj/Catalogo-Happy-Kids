     /*ABRIR E FECHAR O MODAL DIALOG DO MENU */
export function configurarModalMenu() {
    const modalMenu = document.getElementById('modal-menu');
    const btnAbrirMenu = document.getElementById('bar');
    const btnFecharMenu = document.getElementById('btn-fechar-menu');
    const search =  document.getElementById('search');
    const campoLupa = document.getElementById('campo-lupa');

    fecharAoClicarFora(modalMenu);

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
export function configurarModalFavoritos() {
    const modalFav = document.getElementById('dialog-favorite');
    const btnAbrirFav = document.getElementById('btn-favorite');
    const btnFecharFav = document.getElementById('btn-fechar-fav');
    const btnExplorar = document.getElementById('btn-explorar-favoritos');

    fecharAoClicarFora(modalFav);

    btnAbrirFav.addEventListener('click', () =>{
        modalFav.showModal();
    })
    btnFecharFav.addEventListener('click', () =>{
        modalFav.close();
    })
    if(btnExplorar){
        btnExplorar.addEventListener('click', () =>{
        modalFav.close();
        const gridProdutos = document.querySelector('.conteudo');
                if (gridProdutos) {
                    gridProdutos.scrollIntoView({ 
                        behavior: 'smooth'
                    });
                };
    });
    }
};

    /*ABRIR E FECHAR O MODAL DIALOG DO MAGIC */
export function configurarModalMagic(){
    const modalMagic = document.getElementById('meuModal');
    const btnAbrirMagic = document.getElementById('btn-cta');
    const btnFecharMagic = document.getElementById('btn-fechar');

    fecharAoClicarFora(modalMagic);

    btnAbrirMagic.addEventListener('click', () => {
        modalMagic.showModal()
    });
    btnFecharMagic.addEventListener('click', () => {
        modalMagic.close()
    });

};

/**
 * Escuta os cliques em um modal do tipo <dialog> e o fecha se o clique 
 * for na área escura (backdrop). 
 **/


export function fecharAoClicarFora(modalElement) {
    // Adicionamos o ouvinte de evento 'click' DIRETAMENTE no modal passado
    modalElement.addEventListener('click', (evento) => {
        // A MÁGICA DA TAG <DIALOG>:
        // O evento.target é o elemento exato onde o mouse/dedo encostou.
        // Como o seu HTML tem divs internas (ex: .modal, .modal-menu, .modal-produto-container),
        // se o usuário clicar no conteúdo, o target será uma dessas divs (ou algo dentro delas).
        // Mas se ele clicar na parte escura (backdrop), o navegador entende que o 
        // target é o PRÓPRIO modalElement.
        if (evento.target === modalElement) {
            // Se bateu exatamente no elemento raiz do modal, significa clique fora. Pode fechar!
            modalElement.close();
        }
    });
}