export const CAMPOS_PRODUTO_PUBLICOS = [
  'codigo',
  'nome',
  'preco',
  'descricao',
  'estoque',
  'destaque',
  'idade_recomendada',
  'genero',
  'marca',
  'categoria'
].join(',');

export const LIMITE_QUANTIDADE_FAVORITO = 99;

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function normalizarCodigo(valor) {
  const codigo = String(valor ?? '').trim();
  return /^[A-Za-z0-9_-]{1,64}$/.test(codigo) ? codigo : null;
}

export function normalizarPreco(valor) {
  const preco = Number(valor);
  return Number.isFinite(preco) && preco >= 0 ? preco : null;
}

export function normalizarQuantidade(valor, padrao = 1) {
  const quantidade = Number.parseInt(valor, 10);

  if (!Number.isInteger(quantidade) || quantidade < 1) {
    return padrao;
  }

  return Math.min(quantidade, LIMITE_QUANTIDADE_FAVORITO);
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim();
}

function normalizarNumeroOpcional(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export function normalizarProduto(valor) {
  if (!valor || typeof valor !== 'object') {
    return null;
  }

  const codigo = normalizarCodigo(valor.codigo);
  const preco = normalizarPreco(valor.preco);

  if (!codigo || preco === null) {
    return null;
  }

  return {
    codigo,
    nome: normalizarTexto(valor.nome) || 'Produto sem nome',
    preco,
    descricao: normalizarTexto(valor.descricao),
    estoque: valor.estoque === true || valor.estoque === 'true',
    destaque: normalizarNumeroOpcional(valor.destaque),
    idade_recomendada: normalizarNumeroOpcional(valor.idade_recomendada),
    genero: normalizarTexto(valor.genero),
    marca: normalizarTexto(valor.marca),
    categoria: normalizarTexto(valor.categoria)
  };
}

export function normalizarListaProdutos(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return lista.map(normalizarProduto).filter(Boolean);
}

export function normalizarFavorito(valor) {
  const produto = normalizarProduto(valor);

  if (!produto) {
    return null;
  }

  return {
    ...produto,
    quantidade: normalizarQuantidade(valor.quantidade)
  };
}

export function normalizarListaFavoritos(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }

  const favoritosPorCodigo = new Map();

  lista
    .map(normalizarFavorito)
    .filter(Boolean)
    .forEach((favorito) => {
      favoritosPorCodigo.set(favorito.codigo, favorito);
    });

  return Array.from(favoritosPorCodigo.values());
}

export function formatarMoeda(valor) {
  return formatadorMoeda.format(normalizarPreco(valor) ?? 0);
}

export function criarUrlImagem(urlBase, codigo, indice = 1) {
  const codigoNormalizado = normalizarCodigo(codigo);
  const indiceNormalizado = Number.parseInt(indice, 10);

  if (
    !codigoNormalizado ||
    !Number.isInteger(indiceNormalizado) ||
    indiceNormalizado < 1 ||
    indiceNormalizado > 9
  ) {
    return '';
  }

  return urlBase + encodeURIComponent(codigoNormalizado) + '_' + indiceNormalizado + '.webp';
}

export function escaparPadraoIlike(termo) {
  return String(termo ?? '').replace(/([\\%_])/g, '\\$1');
}
