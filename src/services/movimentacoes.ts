/**
 * Histórico dos ativos (tabela `eventos`) e movimentação.
 *
 * - Os tipos Evento, TipoEvento e TipoMovimentacao saíram do DetalheControle.vue e ficam aqui.
 * - movimentar() atualiza o ativo e grava o evento na mesma transação.
 * - Na primeira vez (tabela vazia), cada ativo recebe o seu histórico de exemplo.
 */
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

import { buscarAtivo, dadosExemplo, listarAtivos, type Ativo } from './ativos';
import { aguardarCargaInicial } from './cadastroSimples';
import { obterBanco, salvarAlteracoes } from './db';

import { aplicarMovimentacao, hoje, validarMovimentacao } from '@/utils/movimentacao';

export type TipoEvento = 'cadastro' | 'transferencia' | 'manutencao' | 'devolucao' | 'baixa';
export type TipoMovimentacao = Exclude<TipoEvento, 'cadastro'>;

export const ROTULO_TIPO_EVENTO: Record<TipoEvento, string> = {
  cadastro: 'Cadastro',
  transferencia: 'Transferência',
  manutencao: 'Manutenção',
  devolucao: 'Devolução',
  baixa: 'Baixa',
};

export const TIPOS_EVENTO = Object.keys(ROTULO_TIPO_EVENTO) as TipoEvento[];

export interface Evento {
  id: number;
  patrimonio: string;
  /** AAAA-MM-DD */
  data: string;
  tipo: TipoEvento;
  titulo: string;
  /** Vazio quando não se aplica. */
  responsavel: string;
  /** Vazio quando não há detalhes. */
  detalhe: string;
}

export type NovoEvento = Omit<Evento, 'id'>;

/** Evento com o modelo do ativo, para o histórico geral. */
export type EventoComAtivo = Evento & { modelo: string };

/** Dados do formulário "Registrar movimentação". */
export interface DadosMovimentacao {
  tipo: TipoMovimentacao | '';
  data: string;
  responsavel: string;
  servico: string;
  localizacao: string;
  motivo: string;
  observacoes: string;
}

// ---------- Exemplos ----------

/** Evento de cadastro de um ativo. */
export function eventoCadastro(ativo: Ativo, data = hoje()): NovoEvento {
  return {
    patrimonio: ativo.patrimonio,
    data,
    tipo: 'cadastro',
    titulo: 'Cadastro do ativo',
    responsavel: '',
    detalhe: `Status inicial: ${ativo.status}`,
  };
}

/** Histórico de exemplo dos ativos de exemplo (do mais antigo para o mais novo). */
const HISTORICO_EXEMPLO: Record<string, Omit<NovoEvento, 'patrimonio'>[]> = {
  'PAT-00112': [
    {
      data: '2026-02-03',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-02-10',
      tipo: 'transferencia',
      titulo: 'Responsável: — → Mariana Lopes',
      responsavel: '',
      detalhe: 'Local: Almoxarifado → Financeiro · 2º andar',
    },
  ],
  'PAT-00113': [
    {
      data: '2026-01-15',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-01-20',
      tipo: 'transferencia',
      titulo: 'Responsável: — → Carlos Pereira',
      responsavel: '',
      detalhe: 'Local: Almoxarifado → TI · 3º andar',
    },
    {
      data: '2026-10-28',
      tipo: 'manutencao',
      titulo: 'Troca da bateria',
      responsavel: 'Assistência TechFix',
      detalhe: 'Status: Em uso → Manutenção',
    },
  ],
  'PAT-00087': [
    {
      data: '2025-08-12',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
  ],
  'PAT-00095': [
    {
      data: '2025-08-12',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
  ],
  'PAT-00041': [
    {
      data: '2024-03-05',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-06-12',
      tipo: 'baixa',
      titulo: 'Baixa do ativo',
      responsavel: 'Ana Souza',
      detalhe: 'Motivo: tracionador de papel quebrado, conserto mais caro que uma nova · Status: Em uso → Baixado',
    },
  ],
  'PAT-00150': [
    {
      data: '2026-04-01',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-07-14',
      tipo: 'devolucao',
      titulo: 'Devolvido a Bruno Martins',
      responsavel: '',
      detalhe: 'Voltou da troca de tela',
    },
  ],
  'PAT-00151': [
    {
      data: '2026-04-01',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-11-05',
      tipo: 'manutencao',
      titulo: 'Tela trincada',
      responsavel: 'Assistência TechFix',
      detalhe: 'Status: Em uso → Manutenção',
    },
  ],
  'PAT-00063': [
    {
      data: '2023-05-20',
      tipo: 'cadastro',
      titulo: 'Cadastro do ativo',
      responsavel: '',
      detalhe: 'Status inicial: Em uso',
    },
    {
      data: '2026-09-01',
      tipo: 'baixa',
      titulo: 'Baixa do ativo',
      responsavel: 'Carlos Pereira',
      detalhe: 'Motivo: placa-mãe queimada · Status: Em uso → Baixado',
    },
  ],
};

/**
 * Eventos iniciais para uma lista de ativos: o histórico de exemplo de quem tem,
 * e só o evento de cadastro (com a data de hoje) para os outros.
 */
export function eventosExemplo(ativos: Ativo[] = dadosExemplo()): NovoEvento[] {
  return ativos.flatMap((ativo) => {
    const historico = HISTORICO_EXEMPLO[ativo.patrimonio];
    return historico ? historico.map((e) => ({ ...e, patrimonio: ativo.patrimonio })) : [eventoCadastro(ativo)];
  });
}

// ---------- Banco ----------

export const SQL_INSERIR_EVENTO = `INSERT INTO eventos (patrimonio, data, tipo, titulo, responsavel, detalhe)
  VALUES (?, ?, ?, ?, ?, ?)`;

export function valoresEvento(e: NovoEvento): unknown[] {
  return [e.patrimonio, e.data, e.tipo, e.titulo, e.responsavel, e.detalhe];
}

let pronto: Promise<SQLiteDBConnection> | null = null;

function banco(): Promise<SQLiteDBConnection> {
  if (!pronto) {
    pronto = (async () => {
      // Espera as outras tabelas terminarem a carga inicial (uma transação por vez na mesma conexão).
      await aguardarCargaInicial();
      const db = await obterBanco();
      const res = await db.query('SELECT COUNT(*) AS total FROM eventos');
      if ((res.values?.[0]?.total ?? 0) === 0) {
        const eventos = eventosExemplo(await listarAtivos());
        if (eventos.length) {
          await db.executeSet(eventos.map((e) => ({ statement: SQL_INSERIR_EVENTO, values: valoresEvento(e) })));
          await salvarAlteracoes();
        }
      }
      return db;
    })().catch((erro) => {
      pronto = null;
      throw erro;
    });
  }
  return pronto;
}

/** Garante que todas as tabelas (inclusive eventos) já terminaram a carga inicial. */
export async function aguardarCargaEventos(): Promise<void> {
  await banco();
}

// Mais recente primeiro; no mesmo dia, o último registrado primeiro.
const ORDEM = 'ORDER BY e.data DESC, e.id DESC';

/** Histórico de um ativo, do mais recente para o mais antigo. */
export async function listarEventosDoAtivo(patrimonio: string): Promise<Evento[]> {
  const db = await banco();
  const res = await db.query(`SELECT e.* FROM eventos e WHERE e.patrimonio = ? ${ORDEM}`, [patrimonio.trim()]);
  return (res.values ?? []) as Evento[];
}

/** Todas as movimentações de todos os ativos, com o modelo do ativo. */
export async function listarEventos(): Promise<EventoComAtivo[]> {
  const db = await banco();
  const res = await db.query(
    `SELECT e.*, COALESCE(a.modelo, '') AS modelo FROM eventos e LEFT JOIN ativos a ON a.patrimonio = e.patrimonio ${ORDEM}`,
  );
  return (res.values ?? []) as EventoComAtivo[];
}

/** Grava o evento de cadastro de um ativo novo. */
export async function registrarCadastro(ativo: Ativo): Promise<void> {
  const db = await banco();
  await db.run(SQL_INSERIR_EVENTO, valoresEvento(eventoCadastro(ativo)));
  await salvarAlteracoes();
}

/**
 * Registra uma movimentação: atualiza responsável, localização e status do ativo
 * e grava o evento no histórico, tudo na mesma transação.
 * Lança erro se o ativo não existir, já estiver baixado ou os dados forem inválidos.
 */
export async function movimentar(patrimonio: string, dados: DadosMovimentacao): Promise<Ativo> {
  const db = await banco();
  const atual = await buscarAtivo(patrimonio);
  if (!atual) throw new Error(`Ativo ${patrimonio} não encontrado.`);
  if (atual.status === 'Baixado') throw new Error('Este ativo foi baixado e não aceita novas movimentações.');

  const erro = validarMovimentacao(dados);
  if (erro) throw new Error(erro);

  const { ativo, evento } = aplicarMovimentacao(atual, dados);
  await db.executeSet([
    {
      statement: 'UPDATE ativos SET responsavel = ?, localizacao = ?, status = ? WHERE patrimonio = ?',
      values: [ativo.responsavel, ativo.localizacao, ativo.status, atual.patrimonio],
    },
    { statement: SQL_INSERIR_EVENTO, values: valoresEvento(evento) },
  ]);
  await salvarAlteracoes();
  return ativo;
}
