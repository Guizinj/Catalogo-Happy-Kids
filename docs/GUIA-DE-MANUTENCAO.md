# Guia prático de manutenção

Este documento é o manual do dia a dia do Catálogo Happy Kids. Para entender os fluxos internos e os contratos completos, consulte [ARQUITETURA.md](ARQUITETURA.md).

## 1. Mapa rápido: onde alterar cada coisa

| Quero alterar...                                        | Arquivo ou local principal      |
| ------------------------------------------------------- | ------------------------------- |
| Estrutura, textos fixos, categorias ou opções do filtro | `index.html`                    |
| Cores e medidas reutilizadas                            | `css/root.css`                  |
| Cards e grade do catálogo                               | `css/produtos.css` e `js/ui.js` |
| Aparência do carrossel                                  | `css/mais-vendidos.css`         |
| Tempo e movimento do carrossel                          | `js/carrossel.js`               |
| Consultas e filtros do Supabase                         | `js/api.js`                     |
| Validação dos dados recebidos                           | `js/domain.js`                  |
| Estado e paginação do catálogo                          | `js/catalogo.js`                |
| Eventos e ligação entre os módulos                      | `js/coordenador.js`             |
| Favoritos salvos no navegador                           | `js/storage.js`                 |
| Abertura e fechamento de dialogs                        | `js/modais.js`                  |
| Galeria e gestos das imagens                            | `js/ui.js` e `js/gestos.js`     |
| Telefones, Supabase ou bucket                           | `js/config.js`                  |
| Mensagem enviada ao WhatsApp                            | `js/whatsapp.js`                |
| Mensagens rotativas do topo                             | `js/banner.js`                  |
| Logo, fundo ou favicon                                  | pasta `imagens/`                |

## 2. Rodar e conferir o projeto

### Primeira preparação

Com Node.js instalado, execute uma vez:

```powershell
npm install
```

Isso instala somente a ferramenta de formatação. O site continua sendo HTML, CSS e JavaScript puro.

### Abrir localmente

Na raiz do projeto:

```powershell
py -m http.server 8000
```

Depois acesse <http://localhost:8000>. Use `Ctrl + C` no terminal para encerrar o servidor.

Não abra o arquivo com duplo clique. O protocolo `file://` pode impedir o carregamento correto dos módulos JavaScript.

### Verificações automáticas

```powershell
npm run format        # organiza os arquivos automaticamente
npm run format:check  # somente verifica a organização
npm run check         # procura erros de sintaxe no JavaScript
npm test              # testa validação, favoritos e funções puras
```

Antes de publicar, execute os quatro comandos e faça os testes manuais de [ARQUITETURA.md](ARQUITETURA.md#7-matriz-de-regressão).

## 3. Cadastrar ou editar um produto

Faça a alteração na tabela `produtos` do Supabase. Confira estes pontos:

1. `codigo` é único, tem no máximo 64 caracteres e não contém espaço, barra ou acento.
2. `nome` está preenchido.
3. `preco` é um número maior ou igual a zero.
4. `estoque` está como `true` para o produto aparecer.
5. `descricao`, `marca`, `genero` e `categoria` usam o padrão já adotado nos outros registros.
6. `termos_busca` contém palavras úteis que o cliente pode digitar.
7. `destaque` possui a prioridade desejada ou está vazio.
8. `mais_vendido` está marcado somente quando o produto deve aparecer no carrossel.

Exemplo de conteúdo para `termos_busca`:

```text
bicicleta infantil bike aro passeio menina rosa presente
```

A busca faz comparação parcial e não depende apenas do nome. Inclua sinônimos úteis, mas evite uma lista enorme ou termos que não representam o produto.

### Como funciona a ordem

O catálogo e o carrossel usam a mesma regra:

1. menor valor de `destaque` primeiro;
2. valores vazios de `destaque` no final;
3. em caso de empate, menor `codigo` primeiro.

Como a ordem dos mais vendidos não é uma regra comercial importante atualmente, basta controlar a flag `mais_vendido`.

## 4. Adicionar imagens de produto

No bucket público configurado em `js/config.js`, envie arquivos WebP usando exatamente o `codigo` do banco:

```text
ABC_123_1.webp
ABC_123_2.webp
ABC_123_3.webp
```

- `_1` é a imagem principal e deve existir.
- `_2` e `_3` são opcionais.
- Use letras maiúsculas e minúsculas exatamente como aparecem no código.
- Não use espaços antes ou depois do nome.
- Substituir um arquivo mantendo o mesmo nome pode exigir limpar o cache do navegador ou do CDN para enxergar a versão nova.

Teste o card e abra o modal após o upload. Uma miniatura opcional que não carrega é removida da tela. Existe uma melhoria pendente: o gesto de deslizar ainda pode tentar a terceira URL mesmo quando esse arquivo não existe.

## 5. Controlar o carrossel Mais vendidos

Para adicionar um produto:

1. Abra o registro no Supabase.
2. Confirme `estoque = true`.
3. Defina `mais_vendido = true`.
4. Recarregue o site.

Para retirar, defina `mais_vendido = false`. Não apague o produto.

O carrossel:

- busca no máximo dez itens;
- avança automaticamente a cada 6 segundos;
- pausa no hover somente em computadores com mouse;
- continua automático no celular;
- não usa botão de pausar;
- respeita a preferência de movimento reduzido do sistema;
- fica oculto quando não há itens válidos.

Para alterar os 6 segundos, mude `INTERVALO_AUTOMATICO` em `js/carrossel.js`. O valor é dado em milissegundos: `6000` equivale a 6 segundos.

## 6. Alterar busca, filtros e categorias

### Busca

A consulta está em `buscarProdutosPorNome`, dentro de `js/api.js`, e pesquisa a coluna `termos_busca`. O texto é tratado para impedir que `%`, `_` e barra invertida funcionem como curingas involuntários.

### Filtro mágico

As opções visíveis ficam no formulário `#form-filtro-magico` em `index.html`. Os valores enviados precisam combinar com o banco:

- `genero`: atualmente `ambos`, `menino` ou `menina`;
- `marca`: comparação exata, inclusive espaços;
- `idade`: valor numérico comparado com `idade_recomendada` usando `<=`.

Se adicionar uma marca ao HTML, use em `value` exatamente o conteúdo existente na coluna `marca`.

### Categorias

As categorias ficam na lista `.lista-modal-categoria` em `index.html`. O texto visível é enviado como filtro parcial para a coluna `categoria`.

Ao renomear uma categoria, atualize também os produtos no Supabase. Caso contrário, a opção poderá ficar sem resultados.

## 7. Alterar telefones e mensagens do WhatsApp

Os números públicos ficam somente em `NUMEROS_WHATSAPP`, dentro de `js/config.js`:

```js
export const NUMEROS_WHATSAPP = Object.freeze({
  principal: '558130463443',
  filialGaranhuns: '5587991384045'
});
```

Use somente números, com código do país e DDD. Não inclua `+`, espaço, hífen ou parênteses.

- Links comuns usam atributos `data-whatsapp` no HTML.
- Mensagens fixas podem usar `data-whatsapp-mensagem`.
- A mensagem dos favoritos é criada por `montarMensagemOrcamento` em `js/whatsapp.js`.

Depois de qualquer alteração, teste o link em um celular e confirme o destinatário antes de publicar.

## 8. Trabalhar com favoritos

Os favoritos ficam no `localStorage` do navegador, na chave `happyKidsFavoritos`. Não existe conta de cliente nem sincronização entre aparelhos.

Para limpar somente os favoritos durante um teste, abra o DevTools do navegador e execute no Console:

```js
localStorage.removeItem('happyKidsFavoritos');
location.reload();
```

O código aceita quantidade de 1 a 99. Na abertura da loja, ele consulta novamente os produtos favoritados para atualizar preço e outros dados públicos sem apagar a quantidade escolhida.

## 9. Solução de problemas

### A loja inteira não carrega

1. Abra o DevTools com `F12` e consulte a aba **Console**.
2. Confirme se está usando `http://localhost` ou uma hospedagem HTTPS, nunca `file://`.
3. Verifique a URL e a chave publishable em `js/config.js`.
4. No Supabase, confirme se a tabela existe e se RLS permite o `SELECT` público esperado.
5. Execute `npm run check` para encontrar erro de sintaxe.

### O carrossel não aparece

1. Confirme que existe ao menos um registro com `estoque = true` e `mais_vendido = true`.
2. Confira se a coluna se chama exatamente `mais_vendido` e é booleana.
3. Veja no Console se aparece `Falha ao carregar mais vendidos`.
4. Se a consulta falhar, o catálogo principal continua carregando de propósito.

### Um produto não aparece no catálogo

1. Confirme `estoque = true`.
2. Confira se `codigo` e `preco` são válidos; itens inválidos são descartados.
3. Verifique a policy de leitura no Supabase.
4. Se estiver em busca ou filtro, clique em **Ver catálogo completo**.

### A busca não encontra um produto

1. Verifique se `termos_busca` está preenchido.
2. Inclua no campo a palavra que o cliente está digitando.
3. Confirme que a policy permite ler o registro.
4. Recarregue e teste novamente.

### A imagem não aparece

1. Compare o `codigo` do produto com o nome do arquivo, caractere por caractere.
2. Confirme o sufixo `_1.webp`, `_2.webp` ou `_3.webp`.
3. Verifique se o arquivo foi enviado ao bucket configurado.
4. Abra a URL do arquivo em uma aba anônima para testar a leitura pública.
5. Limpe o cache se a imagem foi substituída recentemente.

### Favoritos somem ou não salvam

O navegador pode bloquear ou limpar o `localStorage` em modo privado, por política de privacidade ou por falta de espaço. O site desfaz a alteração quando não consegue persistir e mostra um aviso ao usuário.

### O WhatsApp abre o número errado

Revise `NUMEROS_WHATSAPP` e o atributo `data-whatsapp` do link. A chave do HTML deve existir no objeto de configuração.

## 10. Checklist de uma alteração segura

- [ ] Fiz a mudança no arquivo responsável, sem duplicar a mesma regra.
- [ ] Não adicionei senha, chave secret ou `service_role`.
- [ ] Mantive IDs e classes usados pelo JavaScript e CSS.
- [ ] Atualizei a documentação quando alterei comportamento ou dados.
- [ ] Executei `npm run format`.
- [ ] Executei `npm run check`.
- [ ] Executei `npm test`.
- [ ] Testei a área alterada em desktop e celular.
- [ ] Testei teclado e movimento reduzido quando a mudança envolve interação.
- [ ] Confirmei RLS e Storage quando a mudança envolve Supabase.

## 11. Melhorias futuras já identificadas

- Fazer a galeria navegar somente pelas imagens que realmente carregaram.
- Versionar schema, índices e policies do Supabase por migrations.
- Trocar o texto livre de categoria por um identificador estável.
- Ampliar os testes automatizados para os componentes do DOM e para o controlador do catálogo.
- Adicionar validação automatizada do HTML e do CSS no fluxo de publicação.

Essa lista é um backlog, não significa que o funcionamento atual esteja quebrado. Priorize as melhorias conforme a necessidade comercial e teste uma mudança por vez.
