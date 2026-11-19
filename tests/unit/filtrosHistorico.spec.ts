import { describe, expect, test } from 'vitest';

import type { Evento } from '@/services/movimentacoes';
import { filtrarEventos, filtrosHistoricoVazios, temFiltroHistorico, validarPeriodo } from '@/utils/filtrosHistorico';

function evento(id: number, data: string, tipo: Evento['tipo']): Evento {
  return { id, patrimonio: 'PAT-1', data, tipo, titulo: '', responsavel: '', detalhe: '' };
}

const eventos = [
  evento(1, '2026-01-10', 'cadastro'),
  evento(2, '2026-02-10', 'transferencia'),
  evento(3, '2026-03-10', 'manutencao'),
  evento(4, '2026-03-20', 'manutencao'),
];

describe('filtrarEventos', () => {
  test('sem filtro devolve tudo', () => {
    expect(filtrarEventos(eventos, filtrosHistoricoVazios())).toHaveLength(4);
  });

  test('filtra por tipo', () => {
    const r = filtrarEventos(eventos, { ...filtrosHistoricoVazios(), tipo: 'manutencao' });
    expect(r.map((e) => e.id)).toEqual([3, 4]);
  });

  test('filtra por período, incluindo as duas pontas', () => {
    const r = filtrarEventos(eventos, { tipo: '', de: '2026-02-10', ate: '2026-03-10' });
    expect(r.map((e) => e.id)).toEqual([2, 3]);
  });

  test('tipo e período juntos', () => {
    const r = filtrarEventos(eventos, { tipo: 'manutencao', de: '2026-03-15', ate: '' });
    expect(r.map((e) => e.id)).toEqual([4]);
  });
});

test('temFiltroHistorico e validarPeriodo', () => {
  expect(temFiltroHistorico(filtrosHistoricoVazios())).toBe(false);
  expect(temFiltroHistorico({ tipo: '', de: '2026-01-01', ate: '' })).toBe(true);
  expect(validarPeriodo({ tipo: '', de: '2026-05-01', ate: '2026-04-01' })).not.toBe('');
  expect(validarPeriodo({ tipo: '', de: '2026-04-01', ate: '2026-04-01' })).toBe('');
});
