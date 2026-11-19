import { describe, expect, test } from 'vitest';

import type { Ativo } from '@/services/ativos';
import { filtrarAtivos, filtrosVazios, temFiltroAtivo } from '@/utils/filtrosAtivos';

const ativos: Ativo[] = [
  {
    patrimonio: 'PAT-1',
    tipo: 'Notebook',
    modelo: 'Dell Latitude',
    numeroSerie: 'SN-AAA',
    responsavel: 'Mariana Lopes',
    localizacao: 'Financeiro',
    status: 'Em uso',
  },
  {
    patrimonio: 'PAT-2',
    tipo: 'Celular',
    modelo: 'Galaxy A54',
    numeroSerie: 'SN-BBB',
    responsavel: 'João Simões',
    localizacao: 'Comercial',
    status: 'Manutenção',
  },
  {
    patrimonio: 'PAT-3',
    tipo: 'Notebook',
    modelo: 'ThinkPad',
    numeroSerie: 'SN-CCC',
    responsavel: '',
    localizacao: 'TI',
    status: 'Baixado',
  },
];

const patrimonios = (lista: Ativo[]) => lista.map((a) => a.patrimonio);

describe('filtrarAtivos', () => {
  test('sem filtros devolve todos', () => {
    expect(filtrarAtivos(ativos, filtrosVazios())).toHaveLength(3);
  });

  test('busca em modelo, tipo, série, patrimônio e responsável', () => {
    const buscar = (busca: string) => patrimonios(filtrarAtivos(ativos, { ...filtrosVazios(), busca }));
    expect(buscar('latitude')).toEqual(['PAT-1']);
    expect(buscar('celular')).toEqual(['PAT-2']);
    expect(buscar('sn-ccc')).toEqual(['PAT-3']);
    expect(buscar('pat-2')).toEqual(['PAT-2']);
    expect(buscar('mariana')).toEqual(['PAT-1']);
  });

  test('busca ignora acentos e maiúsculas', () => {
    expect(patrimonios(filtrarAtivos(ativos, { ...filtrosVazios(), busca: 'SIMOES' }))).toEqual(['PAT-2']);
  });

  test('busca não olha a localização', () => {
    expect(filtrarAtivos(ativos, { ...filtrosVazios(), busca: 'financeiro' })).toHaveLength(0);
  });

  test('filtra por tipo e status combinados com a busca', () => {
    expect(patrimonios(filtrarAtivos(ativos, { ...filtrosVazios(), tipo: 'Notebook' }))).toEqual(['PAT-1', 'PAT-3']);
    expect(patrimonios(filtrarAtivos(ativos, { busca: '', tipo: 'Notebook', status: 'Baixado' }))).toEqual(['PAT-3']);
    expect(filtrarAtivos(ativos, { busca: 'dell', tipo: 'Celular', status: '' })).toHaveLength(0);
  });
});

describe('temFiltroAtivo', () => {
  test('detecta quando há algum filtro', () => {
    expect(temFiltroAtivo(filtrosVazios())).toBe(false);
    expect(temFiltroAtivo({ ...filtrosVazios(), busca: '  ' })).toBe(false);
    expect(temFiltroAtivo({ ...filtrosVazios(), status: 'Baixado' })).toBe(true);
    expect(temFiltroAtivo({ ...filtrosVazios(), tipo: 'Notebook' })).toBe(true);
    expect(temFiltroAtivo({ ...filtrosVazios(), busca: 'dell' })).toBe(true);
  });
});
