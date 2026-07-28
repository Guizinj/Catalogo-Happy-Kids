export function configurarGestosGaleria(imagemPrincipal, imagensProduto) {

    let inicioX = 0;
    let imagemAtual = 0;

    imagemPrincipal.addEventListener('touchstart', (evento) => {
        inicioX = evento.touches[0].clientX;
    });

    imagemPrincipal.addEventListener('touchend', (evento) => {
        const finalX = evento.changedTouches[0].clientX;
        const distancia = inicioX - finalX;

        if (distancia > 50) {
            imagemAtual++;
            if(imagemAtual >= imagensProduto.length){
                imagemAtual = imagensProduto.length - 1;
            }
            imagemPrincipal.src = imagensProduto[imagemAtual];
        }

        if (distancia < -50) {
            imagemAtual--;
            if(imagemAtual < 0){
                imagemAtual = 0;
            }
            imagemPrincipal.src = imagensProduto[imagemAtual];
        }
    });
}