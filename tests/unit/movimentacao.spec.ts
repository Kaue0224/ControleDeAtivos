import { describe, expect, test } from 'vitest';

import type { Ativo } from '@/services/ativos';
import { dadosExemplo } from '@/services/ativos';
import { eventosExemplo, type DadosMovimentacao } from '@/services/movimentacoes';
import { aplicarMovimentacao, formatarData, hoje, movimentacaoVazia, validarMovimentacao } from '@/utils/movimentacao';

const ativo: Ativo = {
  patrimonio: 'PAT-00112',
  tipo: 'Notebook',
  modelo: 'Dell Latitude 5440',
  numeroSerie: 'DL5440-7HQ2K93',
  responsavel: 'Mariana Lopes',
  localizacao: 'Financeiro · 2º andar',
  status: 'Em uso',
};

function mov(dados: Partial<DadosMovimentacao>): DadosMovimentacao {
  return { ...movimentacaoVazia(), data: '2026-03-01', ...dados };
}

describe('validarMovimentacao', () => {
  test('exige tipo, data e responsável', () => {
    expect(validarMovimentacao(movimentacaoVazia())).toBe('Selecione o tipo da movimentação.');
    expect(validarMovimentacao(mov({ tipo: 'devolucao', data: '' }))).toBe('Informe a data.');
    expect(validarMovimentacao(mov({ tipo: 'devolucao', responsavel: '  ' }))).toContain('Usuário que recebeu');
  });

  test('cada tipo exige o seu campo', () => {
    expect(validarMovimentacao(mov({ tipo: 'manutencao', responsavel: 'TechFix' }))).toBe('Informe o serviço.');
    expect(validarMovimentacao(mov({ tipo: 'transferencia', responsavel: 'Ana Souza' }))).toBe(
      'Informe a nova localização.',
    );
    expect(validarMovimentacao(mov({ tipo: 'baixa', responsavel: 'Ana Souza' }))).toBe('Informe o motivo da baixa.');
  });

  test('não aceita data no futuro', () => {
    expect(validarMovimentacao(mov({ tipo: 'devolucao', responsavel: 'Ana Souza', data: '2999-01-01' }))).toBe(
      'A data não pode ser no futuro.',
    );
    expect(validarMovimentacao(mov({ tipo: 'devolucao', responsavel: 'Ana Souza', data: hoje() }))).toBe('');
  });
});

describe('aplicarMovimentacao', () => {
  test('transferência troca responsável e localização', () => {
    const { ativo: novo, evento } = aplicarMovimentacao(
      ativo,
      mov({ tipo: 'transferencia', responsavel: 'Ana Souza', localizacao: 'RH · 1º andar' }),
    );
    expect(novo.responsavel).toBe('Ana Souza');
    expect(novo.localizacao).toBe('RH · 1º andar');
    expect(novo.status).toBe('Em uso');
    expect(evento.titulo).toBe('Responsável: Mariana Lopes → Ana Souza');
    expect(evento.detalhe).toBe('Local: Financeiro · 2º andar → RH · 1º andar');
  });

  test('manutenção muda o status e não troca o responsável', () => {
    const { ativo: novo, evento } = aplicarMovimentacao(
      ativo,
      mov({ tipo: 'manutencao', responsavel: 'TechFix', servico: 'Troca de tela', observacoes: 'Garantia' }),
    );
    expect(novo.status).toBe('Manutenção');
    expect(novo.responsavel).toBe('Mariana Lopes');
    expect(evento.titulo).toBe('Troca de tela');
    expect(evento.responsavel).toBe('TechFix');
    expect(evento.detalhe).toBe('Status: Em uso → Manutenção · Garantia');
  });

  test('devolução de um ativo em manutenção volta para Em uso', () => {
    const emManutencao: Ativo = { ...ativo, status: 'Manutenção' };
    const { ativo: novo, evento } = aplicarMovimentacao(
      emManutencao,
      mov({ tipo: 'devolucao', responsavel: 'Mariana Lopes' }),
    );
    expect(novo.status).toBe('Em uso');
    expect(evento.titulo).toBe('Devolvido a Mariana Lopes');
    expect(evento.detalhe).toBe('Status: Manutenção → Em uso');
  });

  test('baixa guarda o motivo e não altera o ativo original', () => {
    const { ativo: novo, evento } = aplicarMovimentacao(
      ativo,
      mov({ tipo: 'baixa', responsavel: 'Carlos Pereira', motivo: 'sem conserto' }),
    );
    expect(novo.status).toBe('Baixado');
    expect(ativo.status).toBe('Em uso');
    expect(evento.detalhe).toBe('Motivo: sem conserto · Status: Em uso → Baixado');
  });
});

describe('eventos de exemplo', () => {
  test('todo ativo de exemplo tem o evento de cadastro', () => {
    const eventos = eventosExemplo();
    for (const a of dadosExemplo()) {
      expect(eventos.some((e) => e.patrimonio === a.patrimonio && e.tipo === 'cadastro')).toBe(true);
    }
  });

  test('ativo sem histórico de exemplo ganha só o cadastro', () => {
    const novo: Ativo = { ...ativo, patrimonio: 'PAT-99999', status: 'Manutenção' };
    const eventos = eventosExemplo([novo]);
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({
      patrimonio: 'PAT-99999',
      tipo: 'cadastro',
      detalhe: 'Status inicial: Manutenção',
    });
  });

  test('o status final do histórico de exemplo bate com o status do ativo', () => {
    const eventos = eventosExemplo();
    for (const a of dadosExemplo()) {
      const mudancas = eventos
        .filter((e) => e.patrimonio === a.patrimonio)
        .map((e) => /Status: .* → (.*?)( ·|$)/.exec(e.detalhe)?.[1])
        .filter(Boolean);
      const statusFinal = mudancas.length ? mudancas[mudancas.length - 1] : 'Em uso';
      expect(statusFinal).toBe(a.status);
    }
  });
});

test('formatarData', () => {
  expect(formatarData('2026-02-10')).toBe('10/02/2026');
});
