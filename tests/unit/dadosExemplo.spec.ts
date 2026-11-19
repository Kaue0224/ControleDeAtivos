import { describe, expect, test } from 'vitest';

import { CATEGORIAS_EXEMPLO, LOCALIZACOES_EXEMPLO } from '@/data/opcoes';
import { dadosExemplo } from '@/services/ativos';
import { colaboradoresExemplo } from '@/services/colaboradores';
import { comandosRestauracao, TABELAS_RESTAURADAS } from '@/services/dadosExemplo';
import { eventosExemplo } from '@/services/movimentacoes';

describe('dados de exemplo (UC10)', () => {
  test('todo tipo e localização dos ativos de exemplo está cadastrado', () => {
    for (const ativo of dadosExemplo()) {
      expect(CATEGORIAS_EXEMPLO).toContain(ativo.tipo);
      expect(LOCALIZACOES_EXEMPLO).toContain(ativo.localizacao);
    }
  });

  test('todo setor dos colaboradores de exemplo está cadastrado', () => {
    for (const colaborador of colaboradoresExemplo()) {
      expect(LOCALIZACOES_EXEMPLO).toContain(colaborador.setor);
    }
  });

  test('a restauração apaga todas as tabelas antes de inserir', () => {
    const comandos = comandosRestauracao().map((c) => c.statement);
    const primeiroInsert = comandos.findIndex((c) => c.startsWith('INSERT'));
    for (const tabela of TABELAS_RESTAURADAS) {
      const indiceDelete = comandos.indexOf(`DELETE FROM ${tabela}`);
      expect(indiceDelete).toBeGreaterThanOrEqual(0);
      expect(indiceDelete).toBeLessThan(primeiroInsert);
    }
  });

  test('a restauração insere a quantidade certa de registros', () => {
    const inserts = comandosRestauracao().filter((c) => c.statement.trim().startsWith('INSERT'));
    const total =
      dadosExemplo().length +
      colaboradoresExemplo().length +
      LOCALIZACOES_EXEMPLO.length +
      CATEGORIAS_EXEMPLO.length +
      eventosExemplo().length;
    expect(inserts).toHaveLength(total);
  });
});
