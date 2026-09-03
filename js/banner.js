export function mensagensNoTopo() {
  const mensagens = document.querySelectorAll('.message');
  const tempoLeitura = 2500;
  const tempoAnimacao = 300;
  let indiceAtual = 0;

  if (mensagens.length < 2) return;

  function trocarMensagem() {
    const mensagemAtual = mensagens[indiceAtual];
    mensagemAtual.classList.remove('active');
    mensagemAtual.classList.add('exit');

    indiceAtual = (indiceAtual + 1) % mensagens.length;
    const proximaMensagem = mensagens[indiceAtual];
    proximaMensagem.classList.remove('exit');

    setTimeout(() => {
      proximaMensagem.classList.add('active');
    }, tempoAnimacao);
  }

  setInterval(trocarMensagem, tempoLeitura + tempoAnimacao);
}
