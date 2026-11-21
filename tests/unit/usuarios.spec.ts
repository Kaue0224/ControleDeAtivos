import { beforeEach, describe, expect, test } from 'vitest';

import { entrar, estaLogado, sair, salvarPerfil, usuarioLogado } from '@/services/usuarios';
import { paraPerfil, validarLogin, validarPerfil } from '@/utils/validacaoUsuario';

describe('validarLogin', () => {
  test('exige usuário e senha', () => {
    expect(validarLogin({ login: '  ', senha: '' })).toEqual({
      login: 'Informe o usuário.',
      senha: 'Informe a senha.',
    });
  });

  test('aceita campos preenchidos', () => {
    expect(validarLogin({ login: 'admin', senha: '123' })).toEqual({});
  });
});

describe('validarPerfil', () => {
  test('exige nome, e-mail válido e setor', () => {
    const erros = validarPerfil({ nome: ' ', email: 'sem-arroba', setor: '' });
    expect(erros.nome).toBeDefined();
    expect(erros.email).toBe('Informe um e-mail válido.');
    expect(erros.setor).toBeDefined();
  });

  test('paraPerfil limpa espaços e deixa o e-mail em minúsculas', () => {
    expect(paraPerfil({ nome: '  Ana   Souza ', email: ' Ana@Empresa.COM ', setor: 'TI · 3º andar' })).toEqual({
      nome: 'Ana Souza',
      email: 'ana@empresa.com',
      setor: 'TI · 3º andar',
    });
  });
});

describe('service de usuários', () => {
  beforeEach(async () => {
    await sair();
  });

  test('senha errada não loga', async () => {
    await expect(entrar('admin', 'errada')).rejects.toThrow('Usuário ou senha incorretos.');
    expect(await estaLogado()).toBe(false);
  });

  test('login, perfil salvo e logout', async () => {
    const usuario = await entrar(' ADMIN ', '123');
    expect(usuario.login).toBe('admin');
    expect(await estaLogado()).toBe(true);

    await salvarPerfil({ nome: 'Novo Nome', email: 'novo@empresa.com', setor: 'RH · 1º andar' });
    expect((await usuarioLogado())?.nome).toBe('Novo Nome');

    await sair();
    expect(await estaLogado()).toBe(false);
    expect(await usuarioLogado()).toBeNull();
  });

  test('não salva perfil inválido', async () => {
    await entrar('operador', '123');
    await expect(salvarPerfil({ nome: '', email: 'x', setor: '' })).rejects.toThrow('Dados do perfil inválidos.');
  });
});
