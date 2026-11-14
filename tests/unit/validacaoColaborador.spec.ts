import { describe, expect, test } from 'vitest';

import type { DadosColaborador } from '@/services/colaboradores';
import { formularioVazio, normalizar, paraColaborador, validarColaborador } from '@/utils/validacaoColaborador';

const valido: DadosColaborador = {
  nome: 'Ana Souza',
  matricula: 'COL-0001',
  email: 'ana.souza@empresa.com.br',
  setor: 'RH · 1º andar',
};

describe('validarColaborador', () => {
  test('formulário completo não tem erros', () => {
    expect(validarColaborador(valido)).toEqual({});
  });

  test('formulário vazio aponta todos os obrigatórios', () => {
    expect(Object.keys(validarColaborador(formularioVazio())).sort()).toEqual(['matricula', 'nome', 'setor']);
  });

  test('campos só com espaços contam como vazios', () => {
    const erros = validarColaborador({ ...valido, nome: '   ', matricula: ' ' });
    expect(erros.nome).toBeDefined();
    expect(erros.matricula).toBeDefined();
  });

  test('nome precisa ter nome e sobrenome', () => {
    expect(validarColaborador({ ...valido, nome: 'Ana' }).nome).toBeDefined();
    expect(validarColaborador({ ...valido, nome: '  Ana   Souza  ' }).nome).toBeUndefined();
  });

  test('nome aceita acentos, hífen e apóstrofo, mas não números nem símbolos', () => {
    expect(validarColaborador({ ...valido, nome: "João D'Ávila Souza-Lima" }).nome).toBeUndefined();
    expect(validarColaborador({ ...valido, nome: 'Ana Souza 2' }).nome).toBeDefined();
    expect(validarColaborador({ ...valido, nome: 'Ana @Souza' }).nome).toBeDefined();
    expect(validarColaborador({ ...valido, nome: 'Ana - Souza' }).nome).toBeDefined();
  });

  test('nome tem no máximo 80 caracteres', () => {
    expect(validarColaborador({ ...valido, nome: `Ana ${'a'.repeat(76)}` }).nome).toBeUndefined();
    expect(validarColaborador({ ...valido, nome: `Ana ${'a'.repeat(77)}` }).nome).toBeDefined();
  });

  test('matrícula aceita só letras, números e hífen, até 20 caracteres', () => {
    expect(validarColaborador({ ...valido, matricula: 'COL/1' }).matricula).toBeDefined();
    expect(validarColaborador({ ...valido, matricula: 'COL 1' }).matricula).toBeDefined();
    expect(validarColaborador({ ...valido, matricula: 'col-001' }).matricula).toBeUndefined();
    expect(validarColaborador({ ...valido, matricula: 'A'.repeat(20) }).matricula).toBeUndefined();
    expect(validarColaborador({ ...valido, matricula: 'A'.repeat(21) }).matricula).toBeDefined();
  });

  test('e-mail é opcional, mas precisa ter formato válido', () => {
    expect(validarColaborador({ ...valido, email: '' }).email).toBeUndefined();
    expect(validarColaborador({ ...valido, email: 'ana.souza' }).email).toBeDefined();
    expect(validarColaborador({ ...valido, email: 'ana@empresa' }).email).toBeDefined();
    expect(validarColaborador({ ...valido, email: 'ana souza@empresa.com' }).email).toBeDefined();
  });
});

describe('paraColaborador', () => {
  test('tira espaços, matrícula em maiúsculas e e-mail em minúsculas', () => {
    const c = paraColaborador({
      nome: '  Ana   Souza ',
      matricula: ' col-9 ',
      email: ' Ana.Souza@Empresa.com.br ',
      setor: 'RH · 1º andar',
    });
    expect(c).toEqual({
      nome: 'Ana Souza',
      matricula: 'COL-9',
      email: 'ana.souza@empresa.com.br',
      setor: 'RH · 1º andar',
    });
  });
});

describe('normalizar', () => {
  test('ignora maiúsculas, acentos e espaços extras', () => {
    expect(normalizar('  JOÃO   Conceição ')).toBe('joao conceicao');
    expect(normalizar('Ana Souza')).toBe(normalizar('ana  SOUZA'));
    expect(normalizar('Mariana Lopes')).not.toBe(normalizar('Mariana Lopez'));
  });
});
