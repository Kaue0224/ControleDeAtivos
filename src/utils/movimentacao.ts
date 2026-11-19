/**
 * Regras da movimentação de ativo (manutenção, transferência, devolução e baixa).
 * Antes ficavam dentro do DetalheControle.vue; aqui podem ser usadas pelo service e testadas.
 */
import type { Ativo, StatusAtivo } from '@/services/ativos';
import type { DadosMovimentacao, NovoEvento, TipoMovimentacao } from '@/services/movimentacoes';

/** Status que o ativo passa a ter depois de cada movimentação. */
export const STATUS_POR_MOVIMENTACAO: Record<TipoMovimentacao, StatusAtivo> = {
  manutencao: 'Manutenção',
  transferencia: 'Em uso',
  devolucao: 'Em uso',
  baixa: 'Baixado',
};

export function hoje(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function movimentacaoVazia(): DadosMovimentacao {
  return {
    tipo: '',
    data: hoje(),
    responsavel: '',
    servico: '',
    localizacao: '',
    motivo: '',
    observacoes: '',
  };
}

/** Rótulo do campo de responsável, que muda conforme o tipo da movimentação. */
export function rotuloResponsavel(tipo: TipoMovimentacao | ''): string {
  switch (tipo) {
    case 'manutencao':
      return 'Técnico responsável';
    case 'transferencia':
      return 'Novo responsável';
    case 'devolucao':
      return 'Usuário que recebeu';
    case 'baixa':
      return 'Responsável pela baixa';
    default:
      return 'Responsável';
  }
}

/** Devolve a mensagem de erro, ou '' se a movimentação estiver válida. */
export function validarMovimentacao(m: DadosMovimentacao): string {
  if (!m.tipo) return 'Selecione o tipo da movimentação.';
  if (!m.data) return 'Informe a data.';
  if (m.data > hoje()) return 'A data não pode ser no futuro.';
  if (!m.responsavel.trim()) return `Informe o campo "${rotuloResponsavel(m.tipo)}".`;
  if (m.tipo === 'manutencao' && !m.servico.trim()) return 'Informe o serviço.';
  if (m.tipo === 'transferencia' && !m.localizacao.trim()) return 'Informe a nova localização.';
  if (m.tipo === 'baixa' && !m.motivo.trim()) return 'Informe o motivo da baixa.';
  return '';
}

/**
 * Calcula como o ativo fica depois da movimentação e o evento que vai para o histórico.
 * Não grava nada: quem grava é a função movimentar() do service.
 */
export function aplicarMovimentacao(atual: Ativo, m: DadosMovimentacao): { ativo: Ativo; evento: NovoEvento } {
  const tipo = m.tipo as TipoMovimentacao;
  const responsavel = m.responsavel.trim();
  const ativo: Ativo = { ...atual };
  const detalhes: string[] = [];
  let titulo = '';
  let responsavelEvento = '';

  switch (tipo) {
    case 'manutencao':
      titulo = m.servico.trim();
      responsavelEvento = responsavel;
      break;

    case 'transferencia':
      titulo = `Responsável: ${atual.responsavel || '—'} → ${responsavel}`;
      ativo.responsavel = responsavel;
      ativo.localizacao = m.localizacao.trim();
      detalhes.push(`Local: ${atual.localizacao || '—'} → ${ativo.localizacao}`);
      break;

    case 'devolucao':
      titulo = `Devolvido a ${responsavel}`;
      ativo.responsavel = responsavel;
      break;

    case 'baixa':
      titulo = 'Baixa do ativo';
      responsavelEvento = responsavel;
      detalhes.push(`Motivo: ${m.motivo.trim()}`);
      break;
  }

  const novoStatus = STATUS_POR_MOVIMENTACAO[tipo];
  if (novoStatus !== atual.status) {
    detalhes.push(`Status: ${atual.status} → ${novoStatus}`);
    ativo.status = novoStatus;
  }

  const obs = m.observacoes.trim();
  if (obs) detalhes.push(obs);

  return {
    ativo,
    evento: {
      patrimonio: atual.patrimonio,
      data: m.data,
      tipo,
      titulo,
      responsavel: responsavelEvento,
      detalhe: detalhes.join(' · '),
    },
  };
}

/** "2026-02-10" -> "10/02/2026" */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
