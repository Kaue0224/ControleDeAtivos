/**
 * Validação dos cadastros auxiliares que só têm nome: Localizações/Setores e Categorias/Tipos (Pedro).
 */

export const NOME_MIN = 2;
export const NOME_MAX = 40;

/** Remove espaços nas pontas e espaços repetidos no meio. */
export function limparNome(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

/** Minúsculas, sem acentos e sem espaços extras: "rh · 1º ANDAR" e "RH · 1º andar" contam como iguais. */
export function chaveNome(texto: string): string {
  return limparNome(texto).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export interface ItemComNome {
  id: number;
  nome: string;
}

/**
 * Devolve a mensagem de erro do nome, ou '' se estiver válido.
 * `existentes` são os itens já cadastrados; `ignorarId` é o próprio item, na edição.
 */
export function validarNome(nome: string, existentes: ItemComNome[], ignorarId = 0): string {
  const limpo = limparNome(nome);

  if (!limpo) return 'Informe o nome.';
  if (limpo.length < NOME_MIN) return `Use pelo menos ${NOME_MIN} caracteres.`;
  if (limpo.length > NOME_MAX) return `Use no máximo ${NOME_MAX} caracteres.`;
  // Precisa ter ao menos uma letra ou número (evita nomes como "--" ou "··").
  if (!/[\p{L}\p{N}]/u.test(limpo)) return 'Use letras ou números no nome.';

  const chave = chaveNome(limpo);
  if (existentes.some((item) => item.id !== ignorarId && chaveNome(item.nome) === chave)) {
    return 'Já existe um cadastro com este nome.';
  }
  return '';
}

/** Junta a lista cadastrada com o valor atual de um registro, caso ele não esteja mais cadastrado. */
export function comValorAtual(lista: string[], atual: string | undefined): string[] {
  return atual && !lista.includes(atual) ? [...lista, atual] : lista;
}
