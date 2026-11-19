/**
 * Validação do formulário de cadastro/edição de colaborador.
 */
import type { DadosColaborador } from '@/services/colaboradores';

export type ErrosColaborador = Partial<Record<keyof DadosColaborador, string>>;

// Palavras só com letras (acentuadas também), podendo ter hífen ou apóstrofo no meio: "Ana D'Ávila Souza-Lima".
const FORMATO_NOME = /^\p{L}+(['-]\p{L}+)*( \p{L}+(['-]\p{L}+)*)*$/u;
const FORMATO_MATRICULA = /^[A-Za-z0-9-]+$/;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limparEspacos(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

/** Minúsculas, sem acentos e sem espaços extras. É o que liga o colaborador ao responsável do ativo. */
export function normalizar(texto: string): string {
  return limparEspacos(texto).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function formularioVazio(): DadosColaborador {
  return { nome: '', matricula: '', email: '', setor: '' };
}

/** Devolve um erro por campo inválido. Objeto vazio = formulário válido. */
export function validarColaborador(f: DadosColaborador): ErrosColaborador {
  const erros: ErrosColaborador = {};
  const nome = limparEspacos(f.nome);
  const matricula = f.matricula.trim();
  const email = f.email.trim();

  if (!nome) erros.nome = 'Informe o nome completo.';
  else if (!FORMATO_NOME.test(nome)) erros.nome = 'Use apenas letras, hífen e apóstrofo.';
  else if (!nome.includes(' ')) erros.nome = 'Informe nome e sobrenome.';
  else if (nome.length > 80) erros.nome = 'Use no máximo 80 caracteres.';

  if (!matricula) erros.matricula = 'Informe a matrícula.';
  else if (!FORMATO_MATRICULA.test(matricula)) erros.matricula = 'Use apenas letras, números e hífen.';
  else if (matricula.length > 20) erros.matricula = 'Use no máximo 20 caracteres.';

  if (email && !FORMATO_EMAIL.test(email)) erros.email = 'Informe um e-mail válido.';

  if (!f.setor) erros.setor = 'Selecione o setor.';

  return erros;
}

/** Converte o formulário (já validado) para salvar, sem espaços sobrando. */
export function paraColaborador(f: DadosColaborador): DadosColaborador {
  return {
    nome: limparEspacos(f.nome),
    matricula: f.matricula.trim().toUpperCase(),
    email: f.email.trim().toLowerCase(),
    setor: f.setor,
  };
}
