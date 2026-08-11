     /*ABRIR E FECHAR O MODAL DIALOG DO MENU */
export function configurarModalMenu() {
    const modalMenu = document.getElementById('modal-menu');
    const btnsAbrirMenu = document.querySelectorAll('.abrir-menu');
    const btnFecharMenu = document.getElementById('btn-fechar-menu');
    const search =  document.getElementById('search');
    const campoLupa = document.getElementById('campo-lupa');

    fecharAoClicarFora(modalMenu);

    if (btnsAbrirMenu.length > 0) {
        btnsAbrirMenu.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Evita recarregar a página
                modalMenu.showModal(); // Abre o modal nativo
            });
        });
    }
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

export function configurarFaq(){
    // Seleciona os elementos do modal de ajuda
    const modalAjuda = document.getElementById('modal-ajuda');
    const btnFecharAjuda = document.getElementById('btn-fechar-ajuda');
    
    // Seleciona o link/botão "Ajuda" que fica dentro do .footer-menu
    const btnsAbrirAjuda = document.querySelectorAll('.faqui');
    
    // Percorre cada botão da lista e adiciona o evento
    if (btnsAbrirAjuda.length > 0 && modalAjuda) {
        btnsAbrirAjuda.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Evita recarregar a página
                modalAjuda.showModal(); // Abre o modal nativo
            });
        });
    }
    
    if (btnFecharAjuda && modalAjuda) {
        btnFecharAjuda.addEventListener('click', () => {
            modalAjuda.close(); // Fecha o modal nativo
        });
    }

    fecharAoClicarFora(modalAjuda);
}

export function configurarModalLoja(){
    // Seleciona os elementos da loja
    const modalLojas = document.getElementById('modal-lojas');
    const btnAbrirLojas = document.getElementById('abrir-lojas');
    const btnFecharLojas = document.querySelector('.btn-fechar-modal-lojas');
    
    // Abrir modal
    if (btnAbrirLojas && modalLojas) {
        btnAbrirLojas.addEventListener('click', (e) => {
            e.preventDefault();
            modalLojas.showModal();
        });
    }
    
    // Fechar modal no botão (X)
    if (btnFecharLojas && modalLojas) {
        btnFecharLojas.addEventListener('click', (e) => {
            e.preventDefault();
            modalLojas.close();
        });
    }
    fecharAoClicarFora(modalLojas);
}