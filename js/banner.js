export function mensagensNoTopo(){
    const messages = document.querySelectorAll('.message');
    let currentIndex = 0;

    const tempoLeitura = 2500; 
    const tempoAnimacao = 300; 

    function trocarMensagem() {
    const currentMsg = messages[currentIndex];
    currentMsg.classList.remove('active');
    currentMsg.classList.add('exit');
    currentIndex = (currentIndex + 1) % messages.length;
    const nextMsg = messages[currentIndex];
    nextMsg.classList.remove('exit');
    setTimeout(() => {
        nextMsg.classList.add('active');
    }, tempoAnimacao);
    };

    setInterval(trocarMensagem, tempoLeitura + tempoAnimacao);
};