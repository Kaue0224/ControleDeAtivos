import { Preferences } from '@capacitor/preferences';

import { paraPerfil, validarPerfil, validarTrocaSenha, type FormularioSenha } from '@/utils/validacaoUsuario';

export interface DadosPerfil {
  nome: string;
  email: string;
  setor: string;
}

export interface Usuario extends DadosPerfil {
  login: string;
}

interface Conta extends Usuario {
  senha: string;
}

const CONTAS: Conta[] = [
  {
    login: 'admin',
    senha: '1234',
    nome: 'Administrador do Sistema',
    email: 'admin@empresa.com',
    setor: 'TI · 3º andar',
  },
  {
    login: 'operador',
    senha: '1234',
    nome: 'Operador de Ativos',
    email: 'operador@empresa.com',
    setor: 'Almoxarifado',
  },
];

const CHAVE_SESSAO = 'sessao';
const chavePerfil = (login: string) => `perfil:${login}`;
const chaveSenha = (login: string) => `senha:${login}`;

let sessao: string | null | undefined;

function buscarConta(login: string): Conta | undefined {
  const chave = login.trim().toLowerCase();
  return CONTAS.find((c) => c.login === chave);
}

async function lerSessao(): Promise<string | null> {
  if (sessao === undefined) {
    const { value } = await Preferences.get({ key: CHAVE_SESSAO });
    sessao = value && buscarConta(value) ? value : null;
  }
  return sessao;
}

async function senhaDaConta(conta: Conta): Promise<string> {
  const { value } = await Preferences.get({ key: chaveSenha(conta.login) });
  return value ?? conta.senha;
}

async function carregarUsuario(conta: Conta): Promise<Usuario> {
  const { value } = await Preferences.get({ key: chavePerfil(conta.login) });
  let salvo: Partial<DadosPerfil> = {};
  if (value) {
    try {
      salvo = JSON.parse(value);
    } catch {
      salvo = {};
    }
  }
  return {
    login: conta.login,
    nome: salvo.nome ?? conta.nome,
    email: salvo.email ?? conta.email,
    setor: salvo.setor ?? conta.setor,
  };
}

export async function estaLogado(): Promise<boolean> {
  return (await lerSessao()) !== null;
}

export async function entrar(login: string, senha: string): Promise<Usuario> {
  const conta = buscarConta(login);
  if (!conta || (await senhaDaConta(conta)) !== senha) {
    throw new Error('Usuário ou senha incorretos.');
  }
  await Preferences.set({ key: CHAVE_SESSAO, value: conta.login });
  sessao = conta.login;
  return carregarUsuario(conta);
}

export async function sair(): Promise<void> {
  await Preferences.remove({ key: CHAVE_SESSAO });
  sessao = null;
}

export async function usuarioLogado(): Promise<Usuario | null> {
  const login = await lerSessao();
  const conta = login ? buscarConta(login) : undefined;
  return conta ? carregarUsuario(conta) : null;
}

export async function salvarPerfil(dados: DadosPerfil): Promise<Usuario> {
  const login = await lerSessao();
  if (!login) {
    throw new Error('Nenhum usuário logado.');
  }
  if (Object.keys(validarPerfil(dados)).length > 0) {
    throw new Error('Dados do perfil inválidos.');
  }
  const perfil = paraPerfil(dados);
  await Preferences.set({ key: chavePerfil(login), value: JSON.stringify(perfil) });
  return { login, ...perfil };
}

export async function alterarSenha(dados: FormularioSenha): Promise<void> {
  const login = await lerSessao();
  const conta = login ? buscarConta(login) : undefined;
  if (!conta) {
    throw new Error('Nenhum usuário logado.');
  }
  if (Object.keys(validarTrocaSenha(dados)).length > 0) {
    throw new Error('Dados da senha inválidos.');
  }
  if ((await senhaDaConta(conta)) !== dados.atual) {
    throw new Error('Senha atual incorreta.');
  }
  await Preferences.set({ key: chaveSenha(conta.login), value: dados.nova });
}
