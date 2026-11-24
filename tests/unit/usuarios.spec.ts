import { beforeEach, describe, expect, test } from 'vitest';

import { alterarSenha, entrar, estaLogado, sair, salvarPerfil, usuarioLogado } from '@/services/usuarios';
import { paraPerfil, validarLogin, validarPerfil, validarTrocaSenha } from '@/utils/validacaoUsuario';

describe('validarLogin', () => {
  test('exige usuário e senha', () => {
    expect(validarLogin({ login: '  ', senha: '' })).toEqual({
      login: 'Informe o usuário.',
      senha: 'Informe a senha.',
    });
  });

  test('aceita campos preenchidos', () => {
    expect(validarLogin({ login: 'admin', senha: '1234' })).toEqual({});
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

describe('validarTrocaSenha', () => {
  test('exige os três campos', () => {
    expect(validarTrocaSenha({ atual: '', nova: '', confirmacao: '' })).toEqual({
      atual: 'Informe a senha atual.',
      nova: 'Informe a nova senha.',
      confirmacao: 'Confirme a nova senha.',
    });
  });

  test('recusa senha curta, igual à atual ou com confirmação diferente', () => {
    expect(validarTrocaSenha({ atual: '1234', nova: '12', confirmacao: '12' }).nova).toBe(
      'Use pelo menos 4 caracteres.',
    );
    expect(validarTrocaSenha({ atual: 'abcd', nova: 'abcd', confirmacao: 'abcd' }).nova).toBe(
      'A nova senha deve ser diferente da atual.',
    );
    expect(validarTrocaSenha({ atual: '1234', nova: 'nova1', confirmacao: 'nova2' }).confirmacao).toBe(
      'As senhas não conferem.',
    );
  });

  test('aceita troca válida', () => {
    expect(validarTrocaSenha({ atual: '1234', nova: 'nova123', confirmacao: 'nova123' })).toEqual({});
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
    const usuario = await entrar(' ADMIN ', '1234');
    expect(usuario.login).toBe('admin');
    expect(await estaLogado()).toBe(true);

    await salvarPerfil({ nome: 'Novo Nome', email: 'novo@empresa.com', setor: 'RH · 1º andar' });
    expect((await usuarioLogado())?.nome).toBe('Novo Nome');

    await sair();
    expect(await estaLogado()).toBe(false);
    expect(await usuarioLogado()).toBeNull();
  });

  test('não salva perfil inválido', async () => {
    await entrar('operador', '1234');
    await expect(salvarPerfil({ nome: '', email: 'x', setor: '' })).rejects.toThrow('Dados do perfil inválidos.');
  });

  test('troca de senha: exige a senha atual e o login passa a usar a nova', async () => {
    await entrar('operador', '1234');
    await expect(alterarSenha({ atual: 'errada', nova: 'nova123', confirmacao: 'nova123' })).rejects.toThrow(
      'Senha atual incorreta.',
    );

    await alterarSenha({ atual: '1234', nova: 'nova123', confirmacao: 'nova123' });
    await sair();

    await expect(entrar('operador', '1234')).rejects.toThrow('Usuário ou senha incorretos.');
    expect((await entrar('operador', 'nova123')).login).toBe('operador');
  });
});
