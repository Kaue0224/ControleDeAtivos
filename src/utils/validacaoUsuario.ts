import type { DadosPerfil } from '@/services/usuarios';

export interface FormularioLogin {
  login: string;
  senha: string;
}

export type ErrosLogin = Partial<Record<keyof FormularioLogin, string>>;
export type ErrosPerfil = Partial<Record<keyof DadosPerfil, string>>;

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limparEspacos(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

export function validarLogin(f: FormularioLogin): ErrosLogin {
  const erros: ErrosLogin = {};
  if (!f.login.trim()) erros.login = 'Informe o usuário.';
  if (!f.senha) erros.senha = 'Informe a senha.';
  return erros;
}

export function validarPerfil(f: DadosPerfil): ErrosPerfil {
  const erros: ErrosPerfil = {};
  const nome = limparEspacos(f.nome);
  const email = f.email.trim();

  if (!nome) erros.nome = 'Informe o nome.';
  else if (nome.length > 80) erros.nome = 'Use no máximo 80 caracteres.';

  if (!email) erros.email = 'Informe o e-mail.';
  else if (!FORMATO_EMAIL.test(email)) erros.email = 'Informe um e-mail válido.';

  if (!f.setor) erros.setor = 'Selecione o setor.';

  return erros;
}

export function paraPerfil(f: DadosPerfil): DadosPerfil {
  return {
    nome: limparEspacos(f.nome),
    email: f.email.trim().toLowerCase(),
    setor: f.setor,
  };
}
