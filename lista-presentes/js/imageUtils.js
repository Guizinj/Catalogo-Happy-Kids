// js/imageUtils.js

export function processarEComprimirImagem(arquivoFoto, larguraMaxima = 800, qualidade = 0.7) {
    return new Promise((resolve, reject) => {
        if (!arquivoFoto) {
            reject(new Error('Nenhum arquivo fornecido.'));
            return;
        }

        const leitor = new FileReader();

        leitor.onload = (evento) => {
            const imagem = new Image();
            imagem.src = evento.target.result;

            imagem.onload = () => {
                const escala = larguraMaxima / imagem.width;
                const novaLargura = larguraMaxima;
                const novaAltura = imagem.height * escala;

                const canvas = document.createElement('canvas');
                canvas.width = novaLargura;
                canvas.height = novaAltura;

                const contexto = canvas.getContext('2d');
                contexto.drawImage(imagem, 0, 0, novaLargura, novaAltura);

                const fotoComprimida = canvas.toDataURL('image/jpeg', qualidade);
                resolve(fotoComprimida);
            };

            imagem.onerror = () => reject(new Error('Erro ao carregar a imagem.'));
        };

        leitor.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
        leitor.readAsDataURL(arquivoFoto);
    });
}