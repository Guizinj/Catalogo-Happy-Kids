# Happy Kids — Catálogo Digital

Catálogo público de brinquedos da Happy Kids. O cliente pode navegar pelos produtos, pesquisar, aplicar filtros, guardar favoritos no navegador e enviar uma consulta de disponibilidade pelo WhatsApp.

## O que o projeto oferece

- Catálogo paginado de produtos em estoque, ordenado por `destaque` e `codigo`.
- Título contextual: **Destaques**, resultado da busca, resultado do filtro ou categoria escolhida.
- Busca pelo conteúdo da coluna `termos_busca`.
- Filtro de presentes por idade, gênero e marca.
- Navegação por categorias comerciais.
- Carrossel horizontal de **Mais vendidos**, alimentado pela coluna booleana `mais_vendido`.
- Modal do produto com galeria de até três imagens.
- Favoritos persistidos no `localStorage`, com quantidade de 1 a 99.
- Total estimado e mensagem pronta para consultar a loja pelo WhatsApp.
- FAQ, localização das lojas e atalhos de atendimento.

O botão **Ver catálogo completo** começa oculto. Ele aparece somente depois de uma busca, filtro ou seleção de categoria, permitindo desfazer a consulta ativa.

## Tecnologias

- HTML semântico.
- CSS organizado por componente.
- JavaScript Vanilla com ES Modules.
- Supabase Database e Storage.
- Supabase JavaScript `2.111.0`, carregado por CDN.
- Node.js apenas para testes, validação de sintaxe e formatação.
- Prettier `3.6.2` como dependência de desenvolvimento.

Não existe etapa de compilação: em produção, a hospedagem entrega os arquivos estáticos diretamente ao navegador.

## Estrutura do projeto

```text
Catalogo Happy Kids/
├── index.html                   Página, seções e dialogs
├── imagens/                     Logo, fundo, favicon e outros assets locais
├── css/
│   ├── root.css                 Variáveis visuais
│   ├── base.css                 Regras globais e utilitários
│   ├── produtos.css             Cards e catálogo
│   ├── mais-vendidos.css        Carrossel horizontal
│   └── ...                      Estilos dos demais componentes
├── js/
│   ├── config.js                Supabase, bucket e telefones públicos
│   ├── domain.js                Validação e normalização dos dados
│   ├── api.js                   Consultas públicas ao Supabase
│   ├── catalogo.js              Estado, modos e paginação
│   ├── carrossel.js             Movimento do carrossel Mais vendidos
│   ├── storage.js               Favoritos no localStorage
│   ├── ui.js                    Renderização e feedback visual
│   ├── modais.js                Abertura e fechamento dos dialogs
│   ├── gestos.js                Gestos da galeria do produto
│   ├── banner.js                Mensagens rotativas do topo
│   ├── whatsapp.js              Links e mensagem de consulta
│   └── coordenador.js           Inicialização e ligação dos fluxos
├── tests/domain.test.js         Testes das funções puras
├── docs/ARQUITETURA.md          Contratos e funcionamento técnico
├── docs/GUIA-DE-MANUTENCAO.md   Receitas práticas e solução de problemas
├── .editorconfig                Recuo, UTF-8 e finais de linha nos editores
├── .prettierrc.json             Padrão automático de formatação
└── package.json                 Comandos de desenvolvimento
```

## Executar localmente

Os módulos JavaScript precisam de um servidor HTTP. Não abra o `index.html` diretamente com `file://`.

1. Entre na pasta do projeto.
2. Inicie um servidor local:

   ```powershell
   py -m http.server 8000
   ```

3. Abra <http://localhost:8000>.

A página usará o projeto Supabase configurado em `js/config.js`.

## Preparar o ambiente de desenvolvimento

Instale as ferramentas locais uma vez:

```powershell
npm install
```

Comandos disponíveis:

```powershell
npm run check         # valida a sintaxe de todos os módulos JavaScript
npm test              # executa os testes automatizados
npm run format        # organiza HTML, CSS, JS, JSON e Markdown
npm run format:check  # confere a formatação sem modificar arquivos
```

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd`, por exemplo: `npm.cmd test`.

## Dados necessários no Supabase

A tabela pública `produtos` precisa manter estes campos:

| Campo               | Tipo esperado    | Uso no site                                 |
| ------------------- | ---------------- | ------------------------------------------- |
| `codigo`            | texto ou número  | Identificador e nome dos arquivos de imagem |
| `nome`              | texto            | Nome apresentado ao cliente                 |
| `preco`             | número           | Preço em reais                              |
| `descricao`         | texto            | Detalhes no modal                           |
| `estoque`           | booleano         | Somente `true` aparece no catálogo          |
| `destaque`          | número ou `null` | Prioridade crescente de exibição            |
| `idade_recomendada` | número ou `null` | Filtro por idade                            |
| `genero`            | texto            | Filtro de público                           |
| `marca`             | texto            | Filtro de marca                             |
| `categoria`         | texto            | Navegação por categoria                     |
| `termos_busca`      | texto            | Conteúdo pesquisável pelo cliente           |
| `mais_vendido`      | booleano         | Inclui o item no carrossel quando `true`    |

`termos_busca` e `mais_vendido` são usados como filtros da consulta, mas não são enviados para a interface. Consulte os detalhes e as regras de segurança em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Imagens dos produtos

O `codigo` deve ter de 1 a 64 caracteres e usar somente letras, números, hífen ou sublinhado. No bucket público configurado em `js/config.js`, use:

```text
{codigo}_1.webp   imagem principal, recomendada para todo produto
{codigo}_2.webp   imagem adicional opcional
{codigo}_3.webp   imagem adicional opcional
```

Exemplo para o produto `ABC_123`: `ABC_123_1.webp`, `ABC_123_2.webp` e `ABC_123_3.webp`.

Os assets institucionais permanecem em `imagens/`; eles não seguem a convenção do bucket.

## Configuração pública e segurança

`js/config.js` contém somente dados que precisam chegar ao navegador:

- URL do projeto Supabase.
- Chave publishable.
- URL pública do bucket de produtos.
- Telefones públicos usados nos links `wa.me`.

Nunca coloque `service_role`, senha de banco, token administrativo, chave secret ou webhook privado no repositório. Como o catálogo acessa o Supabase pelo navegador, RLS e as permissões do Storage são obrigatórias.

## Antes de publicar

- Execute `npm run format:check`, `npm run check` e `npm test`.
- Faça a matriz manual descrita em [docs/ARQUITETURA.md](docs/ARQUITETURA.md#7-matriz-de-regressão).
- Confirme RLS, policies do bucket e Security Advisor no Supabase.
- Publique por HTTPS e configure cabeçalhos de segurança na hospedagem.
- Teste imagens, busca, filtros, categorias, favoritos, lojas e WhatsApp em desktop e celular.

## Limitações conhecidas

- Os favoritos pertencem somente ao navegador e dispositivo atuais.
- O total é uma estimativa; o site não cria pedido nem reserva estoque.
- As categorias dependem do texto comercial salvo no banco.
- A interface testa até três endereços de imagem. Miniaturas inexistentes são removidas, mas o gesto da galeria ainda pode tentar um endereço ausente.
- Policies, migrations do Supabase e configuração da hospedagem não ficam versionadas neste repositório.

## Documentação

- [Arquitetura e contratos técnicos](docs/ARQUITETURA.md)
- [Guia prático de manutenção](docs/GUIA-DE-MANUTENCAO.md)

Ao alterar contrato de dados, regra comercial, configuração ou fluxo da interface, atualize também a documentação correspondente.
