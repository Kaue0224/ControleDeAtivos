import { describe, expect, test } from 'vitest';

import { formularioVazio, paraAtivo, validarAtivo, type FormularioAtivo } from '@/utils/validacaoAtivo';

const valido: FormularioAtivo = {
  patrimonio: 'PAT-00200',
  tipo: 'Notebook',
  modelo: 'Dell Latitude',
  numeroSerie: 'SN-1',
  responsavel: 'Rafael',
  localizacao: 'TI · 3º andar',
  status: 'Em uso',
};

describe('validarAtivo', () => {
  test('formulário completo não tem erros', () => {
    expect(validarAtivo(valido)).toEqual({});
  });

  test('formulário vazio aponta todos os obrigatórios', () => {
    expect(Object.keys(validarAtivo(formularioVazio())).sort()).toEqual(
      ['localizacao', 'modelo', 'numeroSerie', 'patrimonio', 'responsavel', 'tipo'].sort(),
    );
  });

  test('campos só com espaços contam como vazios', () => {
    const erros = validarAtivo({ ...valido, modelo: '   ', numeroSerie: ' ' });
    expect(erros.modelo).toBeDefined();
    expect(erros.numeroSerie).toBeDefined();
  });

  test('patrimônio aceita só letras, números e hífen', () => {
    expect(validarAtivo({ ...valido, patrimonio: 'PAT/1' }).patrimonio).toBeDefined();
    expect(validarAtivo({ ...valido, patrimonio: 'PAT 1' }).patrimonio).toBeDefined();
    expect(validarAtivo({ ...valido, patrimonio: 'pat-001' }).patrimonio).toBeUndefined();
  });

  test('responsável é obrigatório só para ativo em uso', () => {
    expect(validarAtivo({ ...valido, responsavel: '' }).responsavel).toBeDefined();
    expect(validarAtivo({ ...valido, responsavel: '', status: 'Manutenção' }).responsavel).toBeUndefined();
    expect(validarAtivo({ ...valido, responsavel: '', status: 'Baixado' }).responsavel).toBeUndefined();
  });
});

describe('paraAtivo', () => {
  test('tira espaços e deixa o patrimônio em maiúsculas', () => {
    const a = paraAtivo({ ...valido, patrimonio: ' pat-9 ', modelo: ' Dell ', responsavel: ' Ana ' });
    expect(a.patrimonio).toBe('PAT-9');
    expect(a.modelo).toBe('Dell');
    expect(a.responsavel).toBe('Ana');
  });
});
