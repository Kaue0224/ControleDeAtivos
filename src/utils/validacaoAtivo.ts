/**
 * Validação do formulário de cadastro/edição de ativo (UC04 e UC06).
 */
import type { Ativo, StatusAtivo } from '@/services/ativos';

/** Estado do formulário: igual ao Ativo, mas o status pode estar vazio antes de escolher. */
export type FormularioAtivo = Omit<Ativo, 'status'> & { status: StatusAtivo | '' };

export type ErrosAtivo = Partial<Record<keyof FormularioAtivo, string>>;

/** Letras, números e hífen — o patrimônio vai na URL (/ativos/PAT-00112). */
const FORMATO_PATRIMONIO = /^[A-Za-z0-9-]+$/;

export function formularioVazio(): FormularioAtivo {
  return {
    patrimonio: '',
    tipo: '',
    modelo: '',
    numeroSerie: '',
    responsavel: '',
    localizacao: '',
    status: 'Em uso',
  };
}

/** Devolve um erro por campo inválido. Objeto vazio = formulário válido. */
export function validarAtivo(f: FormularioAtivo): ErrosAtivo {
  const erros: ErrosAtivo = {};
  const patrimonio = f.patrimonio.trim();

  if (!patrimonio) erros.patrimonio = 'Informe o número de patrimônio.';
  else if (!FORMATO_PATRIMONIO.test(patrimonio)) erros.patrimonio = 'Use apenas letras, números e hífen.';

  if (!f.tipo) erros.tipo = 'Selecione o tipo.';
  if (!f.modelo.trim()) erros.modelo = 'Informe o modelo.';
  if (!f.numeroSerie.trim()) erros.numeroSerie = 'Informe o número de série.';
  if (!f.localizacao) erros.localizacao = 'Selecione a localização.';
  if (!f.status) erros.status = 'Selecione o status.';

  // Um ativo "Em uso" precisa estar com alguém; em manutenção ou baixado pode ficar sem responsável.
  if (f.status === 'Em uso' && !f.responsavel.trim()) {
    erros.responsavel = 'Informe o responsável de um ativo em uso.';
  }

  return erros;
}

/** Converte o formulário (já validado) em Ativo, sem espaços sobrando. */
export function paraAtivo(f: FormularioAtivo): Ativo {
  return {
    patrimonio: f.patrimonio.trim().toUpperCase(),
    tipo: f.tipo,
    modelo: f.modelo.trim(),
    numeroSerie: f.numeroSerie.trim(),
    responsavel: f.responsavel.trim(),
    localizacao: f.localizacao,
    status: f.status as StatusAtivo,
  };
}
