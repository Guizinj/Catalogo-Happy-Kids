/**
 * Configura o swipe (arrastar o dedo) na imagem principal do modal de produto.
 *
 * IMPORTANTE (correção de bug): esta função é chamada TODA VEZ que o modal de
 * produto é atualizado (abrir produto novo, ou só atualizar o botão de favorito).
 * Como o elemento <img id="modal-img"> é sempre o mesmo, se a gente registrasse
 * addEventListener de novo a cada chamada, os listeners iam se acumular pra sempre
 * (cada swipe dispararia a troca de imagem várias vezes, uma por listener antigo).
 *
 * Por isso: os listeners de touchstart/touchend são registrados UMA ÚNICA VEZ por
 * elemento (guardamos isso em imagemPrincipal.dataset.gestosAtivos). O que muda a
 * cada chamada é só o ESTADO (lista de imagens do produto atual + índice), que fica
 * guardado como propriedades no próprio elemento (_imagensGaleria / _indiceGaleria).
 *
 * Chamada por: ui.js → atualizarModalProdutoUI()
 */
export function configurarGestosGaleria(imagemPrincipal, imagensProduto) {

    // Só entra aqui na PRIMEIRA vez que essa imagem passa por essa função.
    // Nas próximas vezes, o dataset já existe e a gente pula direto pra
    // atualização do estado, lá embaixo.
    if (!imagemPrincipal.dataset.gestosAtivos) {
        imagemPrincipal.dataset.gestosAtivos = 'true';

        let inicioX = 0;

        imagemPrincipal.addEventListener('touchstart', (evento) => {
            inicioX = evento.touches[0].clientX;
        });

        imagemPrincipal.addEventListener('touchend', (evento) => {
            const finalX = evento.changedTouches[0].clientX;
            const distancia = inicioX - finalX;

            // Lê o estado atual direto do elemento (sempre o mais recente,
            // mesmo que o produto tenha trocado desde que o listener foi criado)
            const imagens = imagemPrincipal._imagensGaleria || [];
            let indice = imagemPrincipal._indiceGaleria ?? 0;

            if (distancia > 50) {
                // Arrastou pra esquerda → próxima imagem (sem passar do fim)
                if (indice >= imagens.length - 1) return;
                indice++;
            } else if (distancia < -50) {
                // Arrastou pra direita → imagem anterior (sem passar do início)
                if (indice <= 0) return;
                indice--;
            } else {
                // Arrasto curto demais, ignora
                return;
            }

            imagemPrincipal._indiceGaleria = indice;
            imagemPrincipal.src = imagens[indice];
        });
    }

    // Isso roda em TODA chamada (inclusive nas repetidas) — é só a
    // atualização do estado, não cria listener novo.
    imagemPrincipal._imagensGaleria = imagensProduto;
    imagemPrincipal._indiceGaleria = 0;
}