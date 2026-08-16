# Happy Kids — Catálogo Digital

Catálogo público de brinquedos da Happy Kids. O cliente pode pesquisar produtos, aplicar filtros, guardar favoritos no próprio navegador e enviar uma solicitação de disponibilidade para o WhatsApp.

## Funcionalidades

> Regra de interface: **Ver catálogo completo** fica oculto no catálogo inicial. Ele só aparece após uma busca, filtro mágico ou seleção de categoria, permitindo desfazer essa consulta.

- Catálogo paginado de produtos em estoque, ordenado por destaque e código.
- Busca textual, filtro por idade/gênero/marca e categorias comerciais.
- Modal de detalhes com galeria de imagens.
- Favoritos persistidos localmente com quantidade e atualização de preço ao abrir a loja.
- Orçamento estimado para WhatsApp; a loja confirma estoque, preço e pedido.
- FAQ, localização de lojas e atalhos de atendimento.

## Tecnologia e dependências

- HTML, CSS e JavaScript ES Modules, sem framework.
- Supabase JavaScript 2.111.0 carregado por CDN.
- Supabase Database para produtos e Supabase Storage público para imagens.
- Google Fonts e Material Symbols.
- Nenhum dado de pedido, login ou pagamento é processado pelo site.

## Estrutura

    index.html                 estrutura da página e dialogs
    imagens/                   assets locais estáticos (logo, fundo e favicon)
    css/                       estilos globais e por componente
    js/config.js               cliente Supabase e telefones públicos
    js/domain.js               contrato, validação e formatação de dados
    js/api.js                  consultas públicas ao catálogo
    js/catalogo.js             estado e paginação do catálogo
    js/storage.js              favoritos em localStorage
    js/ui.js                   renderização segura e feedback visual
    js/whatsapp.js             links e mensagem de consulta
    js/cordenador.js           bootstrap e ligação de eventos
    tests/                     testes de funções puras
    docs/ARQUITETURA.md        referência técnica e checklist operacional

## Executar localmente

Abra o projeto por um servidor HTTP, não pelo protocolo file://, para que os módulos JavaScript funcionem corretamente.

No PowerShell:

    py -m http.server 8000

Depois, abra http://localhost:8000. A página consulta o Supabase real configurado em js/config.js.

## Verificação

O projeto não instala dependências para testar. Com Node.js atual:

    npm run check
    npm test

No PowerShell com execução de scripts bloqueada, use npm.cmd run check e npm.cmd test.

## Configuração pública

js/config.js contém somente informações que precisam chegar ao navegador:

- URL do projeto Supabase.
- Chave publishable do Supabase.
- URL pública do bucket de produtos.
- Telefones usados em links wa.me.

Chaves secret, service_role, senha de banco, token administrativo ou webhook privado nunca podem aparecer neste repositório, no HTML ou no DevTools do navegador. A chave publishable só é aceitável quando as políticas RLS estiverem corretas.

## Convenção de imagens

Cada produto precisa de um código seguro formado por letras, números, hífen ou sublinhado. As imagens seguem:

    {codigo}_1.webp
    {codigo}_2.webp

Elas são buscadas no bucket público definido em js/config.js. Se uma imagem falhar, a interface mantém o produto navegável e sinaliza indisponibilidade visual.

Logo, fundo e favicon são assets estáticos locais e ficam em `imagens/`. Referências feitas por `index.html` usam `imagens/arquivo.ext`; arquivos CSS, por estarem em `css/`, usam `../imagens/arquivo.ext`.

## Antes de publicar

- Execute npm run check e npm test.
- Valide os cenários manuais em docs/ARQUITETURA.md.
- Confirme RLS, políticas de bucket e Security Advisor no Supabase.
- Confirme que a chave do navegador começa com sb_publishable e não é administrativa.
- Publique somente via HTTPS.
- Configure cabeçalhos de segurança na hospedagem, principalmente Content-Security-Policy, X-Content-Type-Options e Referrer-Policy.
- Teste todos os links externos, números de WhatsApp, lojas, FAQ e imagens.

## Limitações conhecidas

- Favoritos pertencem apenas ao navegador/dispositivo atual.
- O site não cria pedido nem reserva estoque; o WhatsApp inicia uma consulta.
- Categorias ainda dependem do rótulo comercial gravado no banco. A evolução recomendada é usar um identificador estável de categoria.
- RLS e as configurações da hospedagem não ficam neste repositório; o procedimento de verificação está documentado.

## Como contribuir

1. Preserve o uso de JavaScript Vanilla e módulos ES.
2. Não use innerHTML com dados de banco, formulário ou localStorage.
3. Atualize docs/ARQUITETURA.md se mudar contrato, fluxo, configuração ou regra de negócio.
4. Inclua teste para funções puras novas e execute a matriz de regressão para mudanças de interface.
