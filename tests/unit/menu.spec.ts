import { describe, expect, test } from 'vitest';

import { MENU, rotaMarcada } from '@/data/menu';

describe('rotaMarcada', () => {
  test('marca a página exata', () => {
    expect(rotaMarcada('/ativos')).toBe('/ativos');
    expect(rotaMarcada('/resumo')).toBe('/resumo');
    expect(rotaMarcada('/categorias')).toBe('/categorias');
  });

  test('subpáginas marcam a seção de origem', () => {
    expect(rotaMarcada('/ativos/PAT-00112')).toBe('/ativos');
    expect(rotaMarcada('/ativos/PAT-00112/editar')).toBe('/ativos');
    expect(rotaMarcada('/colaboradores/3')).toBe('/colaboradores');
  });

  test('prefere o item mais específico', () => {
    expect(rotaMarcada('/ativos/novo')).toBe('/ativos/novo');
  });

  test('não confunde rotas com o mesmo começo', () => {
    expect(rotaMarcada('/ativosx')).toBeNull();
    expect(rotaMarcada('/login')).toBeNull();
  });
});

describe('MENU', () => {
  test('não tem rotas repetidas', () => {
    const rotas = MENU.flatMap((s) => s.itens.map((i) => i.rota));
    expect(new Set(rotas).size).toBe(rotas.length);
  });
});
