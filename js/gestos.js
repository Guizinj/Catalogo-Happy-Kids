/**
 * Configura o swipe (arrastar o dedo) na imagem principal do modal de produto.
 *
 * A função pode ser chamada várias vezes sobre o mesmo <img>. Os eventos são
 * registrados apenas na primeira chamada; as demais atualizam somente as imagens
 * e o índice do produto atual. Isso evita o acúmulo de listeners.
 */
export function configurarGestosGaleria(imagemPrincipal, imagensProduto) {
  if (!imagemPrincipal.dataset.gestosAtivos) {
    imagemPrincipal.dataset.gestosAtivos = 'true';

    let inicioX = 0;

    imagemPrincipal.addEventListener('touchstart', (evento) => {
      inicioX = evento.touches[0].clientX;
    });

    imagemPrincipal.addEventListener('touchend', (evento) => {
      const finalX = evento.changedTouches[0].clientX;
      const distancia = inicioX - finalX;

      const imagens = imagemPrincipal._imagensGaleria || [];
      let indice = imagemPrincipal._indiceGaleria ?? 0;

      if (distancia > 50) {
        if (indice >= imagens.length - 1) return;
        indice++;
      } else if (distancia < -50) {
        if (indice <= 0) return;
        indice--;
      } else {
        return;
      }

      imagemPrincipal._indiceGaleria = indice;
      imagemPrincipal.src = imagens[indice];
    });
  }

  imagemPrincipal._imagensGaleria = imagensProduto;
  imagemPrincipal._indiceGaleria = 0;
}
