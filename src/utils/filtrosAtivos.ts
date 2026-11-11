/**
 * Estado e regras de filtro da Lista de Ativos (UC02 e UC03).
 *
 * O estado dos filtros é um único objeto `FiltrosAtivos`. Para abrir a lista já filtrada
 * (ex.: vindo do Resumo pela URL — UC09), basta montar um `FiltrosAtivos` e atribuir na página.
 */
import type { Ativo, StatusAtivo } from '@/services/ativos';

export interface FiltrosAtivos {
  /** Texto buscado em modelo, tipo, série, patrimônio e responsável. */
  busca: string;
  /** Tipo exato do ativo ('' = todos). */
  tipo: string;
  /** Status exato do ativo ('' = todos). */
  status: StatusAtivo | '';
}

export function filtrosVazios(): FiltrosAtivos {
  return { busca: '', tipo: '', status: '' };
}

export function temFiltroAtivo(f: FiltrosAtivos): boolean {
  return f.busca.trim() !== '' || f.tipo !== '' || f.status !== '';
}

/** Minúsculas e sem acentos, para "manutencao" achar "Manutenção". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarAtivos(ativos: Ativo[], f: FiltrosAtivos): Ativo[] {
  const termo = normalizar(f.busca);

  return ativos.filter((a) => {
    if (f.tipo && a.tipo !== f.tipo) return false;
    if (f.status && a.status !== f.status) return false;
    if (!termo) return true;

    return [a.modelo, a.tipo, a.numeroSerie, a.patrimonio, a.responsavel].some((campo) =>
      normalizar(campo).includes(termo),
    );
  });
}
