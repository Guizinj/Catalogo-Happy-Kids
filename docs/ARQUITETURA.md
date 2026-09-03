# Arquitetura e operação do Catálogo Happy Kids

Esta é a referência técnica do comportamento atual. O guia de tarefas do dia a dia está em [GUIA-DE-MANUTENCAO.md](GUIA-DE-MANUTENCAO.md).

## 1. Visão da solução

```text
Navegador
└── coordenador.js
    ├── catalogo.js ── api.js ── Supabase Database: produtos
    ├── carrossel.js ─────────── seção Mais vendidos
    ├── storage.js ───────────── localStorage: happyKidsFavoritos
    ├── ui.js / modais.js / gestos.js / banner.js ── DOM
    └── whatsapp.js ──────────── wa.me
```

O site é uma aplicação estática, pública e sem autenticação. O navegador consulta o Supabase com uma chave publishable. A proteção real dos dados depende das policies de RLS e Storage configuradas fora deste repositório.

Na inicialização, o catálogo principal, os favoritos atualizados e os mais vendidos são buscados em paralelo. Uma falha exclusiva no carrossel não impede o restante da loja de abrir.

## 2. Responsabilidade dos módulos

| Módulo           | Responsabilidade                                             | Não deve fazer                        |
| ---------------- | ------------------------------------------------------------ | ------------------------------------- |
| `config.js`      | Criar o cliente Supabase e expor bucket e telefones públicos | Guardar segredo administrativo        |
| `domain.js`      | Validar, normalizar e formatar produtos e favoritos          | Acessar DOM ou rede                   |
| `api.js`         | Construir consultas públicas e paginação                     | Renderizar ou salvar favoritos        |
| `catalogo.js`    | Manter modo, página, concorrência e retry                    | Conhecer elementos do HTML            |
| `carrossel.js`   | Controlar setas, autoplay e pausa por hover                  | Buscar produtos ou criar cards        |
| `storage.js`     | Validar e persistir favoritos no navegador                   | Consultar Supabase                    |
| `ui.js`          | Criar elementos, preencher dialogs, toast e totais           | Inserir HTML externo sem validação    |
| `modais.js`      | Abrir, fechar e restaurar foco dos dialogs                   | Aplicar regra de negócio              |
| `gestos.js`      | Trocar imagens por gesto e clique                            | Consultar banco                       |
| `banner.js`      | Alternar as mensagens do topo                                | Controlar outras áreas da página      |
| `whatsapp.js`    | Montar URLs e mensagem de consulta                           | Repetir telefones fora de `config.js` |
| `coordenador.js` | Inicializar a loja e conectar eventos aos módulos            | Concentrar funções puras de domínio   |

## 3. Contratos de dados

### Produto público

| Campo               | Tipo esperado    | Regra atual                                                    |
| ------------------- | ---------------- | -------------------------------------------------------------- |
| `codigo`            | texto ou número  | 1 a 64 caracteres; somente letras, números, hífen e sublinhado |
| `nome`              | texto            | Vazio recebe o fallback `Produto sem nome`                     |
| `preco`             | número           | Precisa ser finito e não negativo                              |
| `descricao`         | texto ou `null`  | Exibido como texto simples                                     |
| `estoque`           | booleano         | Consultas públicas exigem `true`                               |
| `destaque`          | número ou `null` | Ordem crescente; `null` fica no final                          |
| `idade_recomendada` | número ou `null` | Filtro usa `idade_recomendada <= idade selecionada`            |
| `genero`            | texto            | Comparação exata no filtro mágico                              |
| `marca`             | texto            | Comparação exata no filtro mágico                              |
| `categoria`         | texto            | Comparação parcial, com curingas escapados                     |
| `termos_busca`      | texto            | Comparação parcial da busca, com curingas escapados            |
| `mais_vendido`      | booleano         | `true` inclui o produto no carrossel se também houver estoque  |

`CAMPOS_PRODUTO_PUBLICOS`, em `domain.js`, define as colunas devolvidas ao navegador. `termos_busca` e `mais_vendido` participam dos filtros da consulta, mas não são selecionados porque não são necessários para renderizar os cards.

Um registro com `codigo` inválido ou `preco` inválido é descartado pela normalização. Dados vindos do Supabase ou `localStorage` entram na interface por APIs DOM seguras, principalmente `textContent`.

### Favorito local

```js
{
  ...produtoPublico,
  quantidade: 1 // inteiro entre 1 e 99
}
```

A chave usada é `happyKidsFavoritos`. Durante a abertura da loja:

1. JSON inválido é removido com segurança.
2. Registros malformados são descartados.
3. Duplicidades são consolidadas pelo `codigo`.
4. Dados atuais do produto são consultados novamente no Supabase.
5. A quantidade escolhida pelo cliente é preservada.

### Imagens

O Storage público pode conter até três imagens conhecidas pela interface:

```text
{codigo}_1.webp
{codigo}_2.webp
{codigo}_3.webp
```

A primeira é a principal. A segunda e a terceira são opcionais. Uma miniatura cujo carregamento falha é removida do modal. Atualmente, a lista usada pelo gesto de deslizar ainda é criada antes dessa confirmação e pode tentar uma imagem opcional ausente.

O código do produto nunca aceita barra, espaço ou caracteres de caminho. Assets institucionais como logo, fundo e favicon ficam em `imagens/` e não usam essa convenção.

### Exposição pública aprovada

A tabela `produtos` possui RLS ativo e uma policy pública de `SELECT`. A decisão registrada no projeto é permitir a leitura das colunas atuais, inclusive campos operacionais já existentes, desde que não contenham informação sensível.

Não adicione à tabela pública dados de clientes, pedidos, custo, margem, fornecedor, credenciais ou administração. Se surgir essa necessidade, use uma tabela interna ou uma view pública com colunas explícitas.

## 4. Fluxos principais

### Inicialização

1. `coordenador.js` lê os favoritos locais.
2. Em paralelo, solicita a primeira página, atualiza os produtos favoritados e busca até dez mais vendidos.
3. `domain.js` normaliza as respostas.
4. `ui.js` renderiza catálogo, carrossel e favoritos.
5. `carrossel.js` configura o movimento uma única vez.
6. O loader é ocultado mesmo quando ocorre uma falha.

### Catálogo, busca, filtro e categoria

`catalogo.js` trabalha com quatro modos: `catalogo`, `busca`, `filtro` e `categoria`.

- A API solicita 15 registros para exibir 14. O item extra informa se existe próxima página sem executar `count`.
- Uma troca de modo sempre começa na página zero.
- Respostas antigas são ignoradas por um identificador de requisição.
- A página só avança depois de uma resposta bem-sucedida.
- Em erro, produtos e página anteriores permanecem disponíveis para retry.
- O título muda conforme o modo ativo.
- **Ver catálogo completo** aparece apenas em busca, filtro e categoria.

A busca usa `termos_busca`, não apenas `nome`. Categoria usa o texto visível no menu como filtro parcial da coluna `categoria`.

### Mais vendidos

1. `api.js` filtra `estoque = true` e `mais_vendido = true`.
2. A ordenação continua sendo `destaque` crescente e depois `codigo` crescente.
3. `ui.js` reaproveita o mesmo tipo de card do catálogo.
4. Se a lista estiver vazia, a seção não é exibida.
5. O carrossel avança um card a cada 6 segundos e volta ao início no final.
6. As setas permitem controle manual e reiniciam o intervalo.
7. Em desktop com mouse, passar o cursor sobre a seção pausa o movimento.
8. Em dispositivos touch, não existe pausa por hover.
9. `prefers-reduced-motion: reduce` desativa o autoplay.
10. Uma aba oculta interrompe o intervalo até voltar a ficar visível.

### Favoritos e WhatsApp

1. O coração do card ou do modal chama `alternarFavorito`.
2. `storage.js` normaliza e persiste a lista.
3. `coordenador.js` sincroniza os corações do catálogo e do carrossel.
4. O dialog de favoritos atualiza quantidade e total estimado.
5. **Consultar** abre `wa.me` em outra aba com a mensagem codificada.

O site não confirma estoque, reserva ou fecha pedido. A mensagem é somente uma consulta e o total precisa de confirmação humana.

### Modais e foco

Os dialogs usam `showModal()` e `close()`, permitindo que o navegador controle o foco modal e a tecla Escape. Ao abrir a busca, o código move o foco diretamente para o campo. O clique no backdrop também fecha o dialog. Controles acionáveis continuam sendo elementos `button` ou `a` reais.

## 5. Regras comerciais que exigem atenção

- O valor salvo em `idade_recomendada` é comparado numericamente com a idade selecionada, usando `<=`.
- `genero` precisa corresponder exatamente a `ambos`, `menino` ou `menina` conforme as opções atuais.
- `marca` precisa corresponder exatamente ao valor do `<option>` no HTML.
- Categoria depende do rótulo comercial. Uma evolução futura é usar um `categoria_id` estável.
- Um favorito que deixou de ter estoque não é removido automaticamente do navegador; a loja confirma a disponibilidade.
- Alterar o nome de campo no Supabase exige alterar a consulta e esta documentação em conjunto.

## 6. Segurança e acessibilidade

### Checklist de Supabase

- [ ] RLS está ativo em toda tabela do schema exposto.
- [ ] O papel `anon` possui somente o `SELECT` necessário no catálogo.
- [ ] `anon` não pode executar `INSERT`, `UPDATE`, `DELETE` ou RPC administrativa.
- [ ] O bucket público permite leitura, mas não upload, substituição ou exclusão por `anon`.
- [ ] Nenhuma chave `service_role`, secret ou credencial SQL está no front-end.
- [ ] O Security Advisor não possui alerta crítico ignorado.
- [ ] Um teste sem login confirma que tabelas e buckets internos continuam inacessíveis.

### Regras da interface

- Manter foco visível com `:focus-visible`.
- Não desabilitar o zoom do navegador.
- Respeitar `prefers-reduced-motion`.
- Manter contraste mínimo de 4.5:1 para texto comum e 3:1 para texto grande.
- Links em nova aba devem usar `rel="noopener noreferrer"`.
- Não usar `innerHTML` com banco, formulário, URL ou `localStorage`.
- Manter `aria-label`, labels de formulário e retorno de foco nos dialogs.

## 7. Matriz de regressão

### Dados e navegação

- [ ] Catálogo inicial com resultados, vazio e erro de rede.
- [ ] Título **Destaques** no catálogo inicial.
- [ ] Títulos corretos em busca, filtro e categoria.
- [ ] **Ver catálogo completo** oculto inicialmente e visível nos três modos filtrados.
- [ ] Carregar mais, clique repetido, erro e retry da mesma página.
- [ ] Busca com acentos, `%`, `_`, barra invertida e nenhum resultado.
- [ ] Filtro mágico com e sem marca.
- [ ] Todas as categorias retornam ao catálogo corretamente.

### Mais vendidos

- [ ] Produto com `mais_vendido = true` e `estoque = true` aparece.
- [ ] Produto sem estoque ou com flag falsa não aparece.
- [ ] Seção fica oculta quando a consulta retorna lista vazia.
- [ ] Setas avançam e retornam circularmente.
- [ ] Autoplay ocorre em cerca de 6 segundos.
- [ ] Hover pausa apenas em desktop com mouse.
- [ ] Touch continua navegável e `prefers-reduced-motion` desativa autoplay.

### Produto, favoritos e WhatsApp

- [ ] Produto com uma, duas e três imagens.
- [ ] Imagem inexistente não deixa miniatura quebrada.
- [ ] Adicionar e remover pelo catálogo, carrossel e modal.
- [ ] Corações duplicados do mesmo produto ficam sincronizados.
- [ ] Quantidade respeita os limites de 1 a 99.
- [ ] JSON inválido no `localStorage` não quebra a loja.
- [ ] Preço atualizado é refletido nos favoritos.
- [ ] Mensagem do WhatsApp contém itens, referências e total estimado.

### Interface

- [ ] Teclas Tab, Enter, Espaço e Escape funcionam nos dialogs.
- [ ] O foco retorna ao controle que abriu o dialog.
- [ ] Layout funciona com zoom de 200%, celular e desktop.
- [ ] Leitor de tela anuncia busca, filtros, favoritos e feedback.
- [ ] Links externos, mapas, lojas e números de WhatsApp estão corretos.

## 8. Publicação e cabeçalhos

Publicar por HTTPS e configurar, conforme o provedor:

- `Content-Security-Policy` limitada a `self`, jsDelivr, Google Fonts e ao projeto Supabase.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` restritiva para recursos não usados.

Teste a CSP primeiro em modo `Report-Only`. O endpoint do banco e a origem do bucket precisam estar explicitamente liberados; evite curingas.

## 9. Procedimento para mudanças

1. Identifique se a mudança afeta contrato, regra comercial, interface ou configuração.
2. Faça a alteração no módulo responsável, sem duplicar a regra em vários arquivos.
3. Se adicionar dado público, atualize a normalização em `domain.js` e os campos explícitos em `api.js`.
4. Atualize o README e os documentos relacionados.
5. Execute `npm run format`, `npm run check` e `npm test`.
6. Percorra a parte afetada da matriz de regressão.
7. Revise RLS, segurança e acessibilidade antes de publicar.

Alterações no schema e nas policies devem ser registradas por migration revisável quando o projeto passar a versionar o banco. Atualmente essa infraestrutura não faz parte do repositório.
