/**
 * UC10 — Restaurar dados de exemplo (Pedro).
 *
 * Apaga tudo o que foi cadastrado e volta o banco para os dados de exemplo:
 * ativos, colaboradores, localizações/setores, categorias/tipos e histórico (eventos).
 * Tudo acontece numa única transação: se algo falhar, nada é apagado.
 */
import { dadosExemplo } from './ativos';
import { colaboradoresExemplo } from './colaboradores';
import { obterBanco, salvarAlteracoes } from './db';
import { aguardarCargaEventos, eventosExemplo, SQL_INSERIR_EVENTO, valoresEvento } from './movimentacoes';

import { CATEGORIAS_EXEMPLO, LOCALIZACOES_EXEMPLO } from '@/data/opcoes';

/** Tabelas apagadas na restauração. */
export const TABELAS_RESTAURADAS = ['ativos', 'colaboradores', 'localizacoes', 'categorias', 'eventos'] as const;

interface Comando {
  statement: string;
  /** Obrigatório no executeSet da web, mesmo vazio. */
  values: unknown[];
}

/** Monta a lista de comandos SQL da restauração (separado para poder ser testado sem banco). */
export function comandosRestauracao(): Comando[] {
  const comandos: Comando[] = TABELAS_RESTAURADAS.map((tabela) => ({ statement: `DELETE FROM ${tabela}`, values: [] }));

  // Zera os ids automáticos, para os colaboradores voltarem a ser /colaboradores/1, 2, 3…
  comandos.push({
    statement: `DELETE FROM sqlite_sequence WHERE name IN (${TABELAS_RESTAURADAS.map(() => '?').join(', ')})`,
    values: [...TABELAS_RESTAURADAS],
  });

  for (const a of dadosExemplo()) {
    comandos.push({
      statement: `INSERT INTO ativos (patrimonio, tipo, modelo, numero_serie, responsavel, localizacao, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      values: [a.patrimonio, a.tipo, a.modelo, a.numeroSerie, a.responsavel, a.localizacao, a.status],
    });
  }
  for (const c of colaboradoresExemplo()) {
    comandos.push({
      statement: 'INSERT INTO colaboradores (nome, matricula, email, setor) VALUES (?, ?, ?, ?)',
      values: [c.nome, c.matricula, c.email, c.setor],
    });
  }
  for (const nome of LOCALIZACOES_EXEMPLO) {
    comandos.push({ statement: 'INSERT INTO localizacoes (nome) VALUES (?)', values: [nome] });
  }
  for (const nome of CATEGORIAS_EXEMPLO) {
    comandos.push({ statement: 'INSERT INTO categorias (nome) VALUES (?)', values: [nome] });
  }
  for (const evento of eventosExemplo()) {
    comandos.push({ statement: SQL_INSERIR_EVENTO, values: valoresEvento(evento) });
  }
  return comandos;
}

/** Apaga todos os dados e grava novamente os dados de exemplo. */
export async function restaurarDadosExemplo(): Promise<void> {
  // Espera a carga inicial de todas as tabelas terminar antes de abrir a transação.
  await aguardarCargaEventos();
  const db = await obterBanco();
  await db.executeSet(comandosRestauracao());
  await salvarAlteracoes();
}
