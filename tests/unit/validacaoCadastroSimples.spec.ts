import { describe, expect, test } from 'vitest';

import { chaveNome, comValorAtual, limparNome, validarNome } from '@/utils/validacaoCadastroSimples';

const existentes = [
  { id: 1, nome: 'RH · 1º andar' },
  { id: 2, nome: 'Almoxarifado' },
];

describe('limparNome e chaveNome', () => {
  test('tira espaços extras', () => {
    expect(limparNome('  TI   ·  3º andar ')).toBe('TI · 3º andar');
  });

  test('ignora maiúsculas, acentos e espaços', () => {
    expect(chaveNome('  Recepção  · Térreo')).toBe(chaveNome('recepcao · terreo'));
  });
});

describe('validarNome', () => {
  test('nome novo e válido não tem erro', () => {
    expect(validarNome('Jurídico · 4º andar', existentes)).toBe('');
  });

  test('nome vazio ou só com espaços', () => {
    expect(validarNome('', existentes)).not.toBe('');
    expect(validarNome('    ', existentes)).not.toBe('');
  });

  test('tamanho mínimo e máximo', () => {
    expect(validarNome('A', existentes)).not.toBe('');
    expect(validarNome('AB', existentes)).toBe('');
    expect(validarNome('A'.repeat(40), existentes)).toBe('');
    expect(validarNome('A'.repeat(41), existentes)).not.toBe('');
  });

  test('precisa ter letra ou número', () => {
    expect(validarNome('--', existentes)).not.toBe('');
    expect(validarNome('· ·', existentes)).not.toBe('');
  });

  test('não aceita nome repetido, mesmo com outra grafia', () => {
    expect(validarNome('almoxarifado', existentes)).not.toBe('');
    expect(validarNome('  rh  ·  1º ANDAR ', existentes)).not.toBe('');
  });

  test('na edição, o próprio item não conta como repetido', () => {
    expect(validarNome('ALMOXARIFADO', existentes, 2)).toBe('');
    expect(validarNome('Almoxarifado', existentes, 1)).not.toBe('');
  });
});

describe('comValorAtual', () => {
  test('acrescenta o valor atual se ele não estiver na lista', () => {
    expect(comValorAtual(['A', 'B'], 'C')).toEqual(['A', 'B', 'C']);
    expect(comValorAtual(['A', 'B'], 'A')).toEqual(['A', 'B']);
    expect(comValorAtual(['A', 'B'], '')).toEqual(['A', 'B']);
  });
});
