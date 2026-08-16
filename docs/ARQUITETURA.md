# Arquitetura e operação do Catálogo Happy Kids

Este documento é a referência contínua para manutenção do catálogo. Ele descreve o comportamento implementado, os contratos que não podem ser quebrados e as verificações necessárias antes de produção.

## 1. Visão de solução

    Cliente
      -> cordenador.js
         -> catalogo.js -> api.js -> Supabase Database: produtos
         -> storage.js -> localStorage: happyKidsFavoritos
         -> ui.js / modais.js / gestos.js -> DOM
         -> whatsapp.js -> wa.me

O site é uma aplicação estática, pública e sem autenticação. O Supabase é acessado no navegador somente com chave publishable e, portanto, toda proteção de dados depende de RLS e do conjunto de colunas expostas.

## 2. Responsabilidade dos módulos

| Módulo | Responsabilidade | Não deve fazer |
|---|---|---|
| config.js | Cliente Supabase, bucket público e telefones | Guardar segredo administrativo |
| domain.js | Validar produto/favorito, formatar moeda, imagem e busca | Tocar DOM ou chamar rede |
| api.js | Consultas públicas, campos explícitos e paginação | Renderizar ou persistir favoritos |
| catalogo.js | Modo atual, página, concorrência e retry seguro | Conhecer seletores do HTML |
| storage.js | Estado local validado e persistência de favoritos | Consultar Supabase |
| ui.js | Criar DOM, dialog visual, toast e formatação | Confiar em HTML de dados externos |
| whatsapp.js | Montar links e mensagem de consulta | Definir números fora de config.js |
| cordenador.js | Bootstrap, eventos e coordenação dos fluxos | Concentrar regras puras de domínio |
| modais.js, gestos.js, banner.js | Interações específicas | Buscar produtos |

## 3. Contratos de dados

### Produto público

| Campo | Tipo esperado | Regra |
|---|---|---|
| codigo | string ou número seguro | 1 a 64 caracteres: letras, números, hífen ou sublinhado |
| nome | texto | obrigatório na prática; fallback visual Produto sem nome |
| preco | número não negativo | exibido em BRL |
| descricao | texto opcional | exibido como texto simples |
| estoque | booleano | catálogo público mostra somente true |
| destaque | número opcional | ordenação crescente, null ao final |
| idade_recomendada | número opcional | filtro atual usa menor ou igual à idade selecionada |
| genero, marca, categoria | texto opcional | filtros comerciais atuais |

A API seleciona somente esses campos. Isso reduz tráfego, mas não substitui restrição de coluna e RLS no banco.

### Exposição pública aprovada

A tabela `produtos` possui RLS ativo e uma policy pública de `SELECT` com regra `true`. A decisão atual do projeto é aceitar a leitura pública de todas as colunas existentes, incluindo `quantidade` e `ref`, pois elas são dados operacionais do catálogo e não são consideradas sensíveis. O front-end continua solicitando apenas os campos necessários para renderização.

Não incluir nesta tabela informações de clientes, pedidos, fornecedores, custo, margem, credenciais ou qualquer outro dado que não possa ser público. Caso isso mude, separar os dados internos em outra tabela ou criar uma view pública antes de adicioná-los.

### Favorito local

    {
      ...produtoPublico,
      quantidade: inteiro de 1 a 99
    }

A chave é happyKidsFavoritos. Ao carregar, JSON inválido, item malformado e duplicidade são removidos de forma segura. Os dados de produto são atualizados uma vez pelo código; a quantidade continua sendo do cliente.

### Imagens

O bucket público deve conter {codigo}_1.webp e, opcionalmente, {codigo}_2.webp. A aplicação nunca aceita barra, espaço ou caracteres de caminho no código; isso protege a formação da URL.

### WhatsApp

- principal: atendimento e orçamento.
- filialGaranhuns: atendimento da filial.
- A mensagem de orçamento é URL-encoded.
- O total é estimado e precisa de confirmação humana.

Todos os links usam data-whatsapp no HTML e são configurados por whatsapp.js. Não repetir telefones em hrefs estáticos.

## 4. Fluxos operacionais

### Catálogo e paginação

1. A loja carrega favoritos locais e primeira página em paralelo.
2. A API pede limite mais um registro, permitindo saber se há próxima página sem count extra.
3. catalogo.js só confirma a nova página depois de sucesso.
4. Enquanto uma página adicional carrega, o botão é desabilitado.
5. Falha mantém página e produtos anteriores; novo clique repete a página correta.

Busca, filtro mágico e categoria usam o mesmo controlador e também podem carregar mais resultados. Voltar ao catálogo descarta o modo filtrado e solicita novamente a página inicial.

### Retorno ao catálogo completo

O botão **Ver catálogo completo** é contextual. Ele começa oculto no modo `catalogo` e só fica disponível nos modos `busca`, `filtro` e `categoria`. Ao acioná-lo, o controlador descarta a consulta ativa, recarrega a primeira página do catálogo e volta a ocultar o botão. A regra existe tanto no estado JavaScript quanto no CSS (`[hidden]`), para evitar que estilos visuais exponham um controle indisponível.

### Favoritos

1. Card ou modal solicita alternância.
2. storage.js normaliza e grava o estado.
3. cordenador.js sincroniza modal, total, ícone da navegação e card.
4. Consultar chama wa.me em nova aba sem transferir controle da página.

### Regras comerciais que precisam de confirmação

- O filtro de idade atual entende idade_recomendada como idade máxima recomendada.
- O valor ambos em genero precisa existir exatamente no banco.
- Favorito sem estoque continua visível até a loja confirmar disponibilidade.
- Categoria usa o rótulo comercial completo em busca parcial escapada. Evoluir para category_id quando houver apoio no banco.

## 5. Segurança — checklist obrigatório de RLS

Esta lista deve ser executada no Dashboard ou por migration revisada antes de publicar. Ela não pode ser considerada concluída apenas por este repositório.

### Banco

- [ ] RLS ativado em todas as tabelas do schema exposto, inclusive produtos.
- [ ] Papel anon possui somente SELECT no catálogo público.
- [ ] anon não possui INSERT, UPDATE, DELETE, RPC administrativa ou acesso a tabelas internas.
- [ ] A política de SELECT define explicitamente as linhas que podem ser públicas.
- [x] A tabela `produtos` foi revisada: todas as colunas atuais são aprovadas para leitura pública. Novos campos devem passar por esta mesma revisão antes de serem adicionados.
- [ ] Chaves secret, service_role e credenciais SQL estão somente em backend/Edge Function seguro.
- [ ] Security Advisor do Supabase revisado sem alertas críticos ignorados.
- [ ] Logs e auditoria revisados após a publicação.

### Storage

- [ ] O bucket de produtos é público apenas se as imagens forem realmente públicas.
- [ ] Bucket público não permite upload, overwrite ou delete por anon.
- [ ] Buckets de documentos, pedidos, clientes ou administração não são públicos.
- [ ] Nomes de objetos seguem a convenção documentada.

### Teste anônimo

- [ ] Sem login, listar catálogo retorna apenas colunas públicas.
- [ ] Sem login, tentar criar, editar ou apagar produto falha.
- [ ] Sem login, tentar ler tabela interna ou bucket privado falha.
- [ ] Um produto contendo HTML no nome aparece como texto e não executa script.

## 6. Regras de interface e acessibilidade

- Usar elementos semânticos, botão real para ação e label real para campo.
- Nunca desabilitar zoom do navegador.
- Manter foco visível com focus-visible.
- Para texto normal, contraste mínimo é 4.5:1; para texto grande, 3:1.
- Respeitar prefers-reduced-motion em animações.
- Todo link externo em nova aba usa rel noopener noreferrer.
- Dados externos entram no DOM via textContent, atributos controlados ou APIs DOM; não usar innerHTML.

## 7. Matriz de regressão

### Dados e rede

- Catálogo normal, sem resultado e erro inicial.
- Ver catálogo completo oculto no carregamento inicial e visível apenas depois de busca, filtro mágico ou categoria.
- Carregar mais, erro, retry e clique rápido repetido.
- Busca com acentos, porcentagem, sublinhado e sem resultado.
- Filtro mágico e categoria; retorno ao catálogo completo.
- Produto sem imagem secundária.

### Favoritos e WhatsApp

- Adicionar/remover no card e no modal.
- Alterar quantidade entre 1 e 99.
- JSON inválido em localStorage.
- Preço atualizado e produto removido de estoque.
- Nome com caracteres especiais e mensagem de WhatsApp com múltiplos itens.

### Interface

- Teclado: Tab, Enter, Espaço, Escape e retorno de foco nos dialogs.
- Zoom de 200%, viewport pequeno e desktop.
- Leitor de tela em busca, filtros, favoritos e feedback.
- prefers-reduced-motion ativo.
- Todos os links externos, mapas, lojas e WhatsApp.

## 8. Publicação e cabeçalhos

Publicar via HTTPS e configurar, conforme a hospedagem:

- Content-Security-Policy com origens mínimas para self, jsdelivr, Google Fonts e o projeto Supabase.
- X-Content-Type-Options: nosniff.
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy restritiva para recursos não usados.

Teste a CSP primeiro em modo report-only. A origem do bucket de imagens e do endpoint Supabase deve ser incluída explicitamente; não liberar curingas desnecessários.

## 9. Procedimento para mudanças

1. Identifique se muda contrato, interface, configuração ou regra comercial.
2. Atualize este documento e README quando necessário.
3. Para alteração de schema/policy, registre migration revisável antes de alterar o front-end.
4. Para dado novo do catálogo, adicione validação em domain.js e seleção explícita em api.js.
5. Execute npm run check, npm test e a matriz de regressão.
6. Revise segurança e acessibilidade antes de publicar.
