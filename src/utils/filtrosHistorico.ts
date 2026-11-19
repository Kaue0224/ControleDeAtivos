/**
 * Filtros do Histórico geral de movimentações (tipo e período).
 */
import type { Evento, TipoEvento } from '@/services/movimentacoes';

export interface FiltrosHistorico {
  /** '' = todos os tipos */
  tipo: TipoEvento | '';
  /** AAAA-MM-DD; '' = sem limite */
  de: string;
  /** AAAA-MM-DD; '' = sem limite */
  ate: string;
}

export function filtrosHistoricoVazios(): FiltrosHistorico {
  return { tipo: '', de: '', ate: '' };
}

export function temFiltroHistorico(f: FiltrosHistorico): boolean {
  return f.tipo !== '' || f.de !== '' || f.ate !== '';
}

/** Mensagem de erro do período, ou '' se estiver certo. */
export function validarPeriodo(f: FiltrosHistorico): string {
  return f.de && f.ate && f.de > f.ate ? 'A data inicial não pode ser depois da final.' : '';
}

/** As datas estão em AAAA-MM-DD, então dá para comparar como texto. As duas pontas entram no período. */
export function filtrarEventos<T extends Evento>(eventos: T[], f: FiltrosHistorico): T[] {
  return eventos.filter((e) => {
    if (f.tipo && e.tipo !== f.tipo) return false;
    if (f.de && e.data < f.de) return false;
    if (f.ate && e.data > f.ate) return false;
    return true;
  });
}
