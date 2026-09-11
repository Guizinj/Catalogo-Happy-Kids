let elementos;
let estado = {
  imagens: [],
  indice: 0,
  nomeProduto: '',
  aoTrocarImagem: null
};

function obterElementos() {
  if (elementos) return elementos;

  elementos = {
    dialog: document.getElementById('visualizador-imagens'),
    imagem: document.getElementById('visualizador-imagem'),
    contador: document.getElementById('visualizador-imagens-contador'),
    dica: document.getElementById('visualizador-imagens-dica'),
    palco: document.getElementById('visualizador-imagens-palco'),
    botaoFechar: document.getElementById('btn-fechar-visualizador'),
    botaoAnterior: document.getElementById('btn-imagem-anterior'),
    botaoProximo: document.getElementById('btn-proxima-imagem')
  };

  return elementos;
}

function atualizarVisualizador() {
  const { dialog, imagem, contador, dica, botaoAnterior, botaoProximo } = obterElementos();
  const total = estado.imagens.length;

  if (!dialog || !imagem || !contador || !botaoAnterior || !botaoProximo || !total) {
    return;
  }

  const posicao = estado.indice + 1;
  const urlImagem = estado.imagens[estado.indice];
  const possuiNavegacao = total > 1;

  imagem.src = urlImagem;
  imagem.alt = `${estado.nomeProduto} — imagem ${posicao} de ${total}`;
  contador.textContent = `${posicao} de ${total}`;
  botaoAnterior.hidden = !possuiNavegacao;
  botaoProximo.hidden = !possuiNavegacao;
  if (dica) dica.hidden = !possuiNavegacao;
}

function navegar(direcao) {
  const total = estado.imagens.length;
  if (total < 2) return;

  estado.indice = (estado.indice + direcao + total) % total;
  atualizarVisualizador();
  estado.aoTrocarImagem?.(estado.imagens[estado.indice]);
}

function fecharVisualizador() {
  const { dialog } = obterElementos();
  if (dialog?.open) dialog.close();
}

function registrarEventos(botaoAbrir) {
  const { dialog, palco, botaoFechar, botaoAnterior, botaoProximo } = obterElementos();
  if (!dialog || !palco || !botaoFechar || !botaoAnterior || !botaoProximo) return;

  if (!botaoAbrir.dataset.visualizadorConfigurado) {
    botaoAbrir.dataset.visualizadorConfigurado = 'true';
    botaoAbrir.addEventListener('click', () => {
      if (!estado.imagens.length) return;

      const imagemOrigem = botaoAbrir.querySelector('img');
      if ((imagemOrigem?._ignorarCliqueAte || 0) > Date.now()) return;

      const urlAtual = imagemOrigem?.src;
      estado.indice = Math.max(0, estado.imagens.indexOf(urlAtual));
      atualizarVisualizador();
      dialog.showModal();
    });
  }

  if (dialog.dataset.eventosConfigurados) return;
  dialog.dataset.eventosConfigurados = 'true';

  botaoFechar.addEventListener('click', fecharVisualizador);
  botaoAnterior.addEventListener('click', () => navegar(-1));
  botaoProximo.addEventListener('click', () => navegar(1));

  palco.addEventListener('click', (evento) => {
    if (
      evento.target === palco ||
      evento.target.classList?.contains('visualizador-imagens-moldura')
    ) {
      fecharVisualizador();
    }
  });

  dialog.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      navegar(-1);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      navegar(1);
    }
  });

  let inicioX = 0;
  let inicioY = 0;

  palco.addEventListener(
    'touchstart',
    (evento) => {
      if (evento.touches.length !== 1) return;
      inicioX = evento.touches[0].clientX;
      inicioY = evento.touches[0].clientY;
    },
    { passive: true }
  );

  palco.addEventListener(
    'touchend',
    (evento) => {
      if (evento.changedTouches.length !== 1) return;

      const distanciaX = inicioX - evento.changedTouches[0].clientX;
      const distanciaY = inicioY - evento.changedTouches[0].clientY;

      if (Math.abs(distanciaX) < 50 || Math.abs(distanciaX) <= Math.abs(distanciaY)) return;
      navegar(distanciaX > 0 ? 1 : -1);
    },
    { passive: true }
  );
}

/**
 * Mantém o visualizador ampliado sincronizado com a galeria validada do produto.
 */
export function configurarVisualizadorImagens({
  botaoAbrir,
  imagensProduto,
  nomeProduto,
  urlAtual,
  aoTrocarImagem
}) {
  if (!botaoAbrir) return;

  const imagens = Array.isArray(imagensProduto) ? imagensProduto.filter(Boolean) : [];
  const urlExibida = estado.imagens[estado.indice];
  const indiceAtualizado = imagens.indexOf(urlExibida);
  const indiceDaImagemPrincipal = imagens.indexOf(urlAtual);

  estado = {
    imagens,
    indice:
      indiceAtualizado >= 0
        ? indiceAtualizado
        : Math.max(0, indiceDaImagemPrincipal),
    nomeProduto: String(nomeProduto || 'Imagem do produto'),
    aoTrocarImagem
  };

  botaoAbrir.disabled = imagens.length === 0;
  botaoAbrir.setAttribute(
    'aria-label',
    imagens.length
      ? `Ampliar imagens de ${estado.nomeProduto}`
      : 'Imagem indisponível para ampliar'
  );

  registrarEventos(botaoAbrir);

  const { dialog } = obterElementos();
  if (dialog?.open) {
    if (imagens.length) atualizarVisualizador();
    else dialog.close();
  }
}
