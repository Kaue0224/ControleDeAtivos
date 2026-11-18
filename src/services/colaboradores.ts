/**
 * Colaboradores (responsáveis pelos ativos), na tabela `colaboradores` do SQLite.
 *
 * O ativo guarda o responsável como texto, então o vínculo é feito pelo nome, comparado com normalizar()
 * (sem diferenciar maiúsculas, acentos e espaços extras). Por isso o nome também é único.
 */
import { atualizarAtivo, listarAtivos, type Ativo } from './ativos';
import { obterBanco, salvarAlteracoes } from './db';

import { normalizar } from '@/utils/validacaoColaborador';

export interface Colaborador {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  setor: string;
}

export type DadosColaborador = Omit<Colaborador, 'id'>;

export type ColaboradorComAtivos = Colaborador & { totalAtivos: number };

// Os responsáveis dos ativos de exemplo.
const EXEMPLOS: DadosColaborador[] = [
  { nome: 'Ana Souza', matricula: 'COL-0001', email: 'ana.souza@empresa.com.br', setor: 'RH · 1º andar' },
  {
    nome: 'Bruno Martins',
    matricula: 'COL-0002',
    email: 'bruno.martins@empresa.com.br',
    setor: 'Comercial · 2º andar',
  },
  { nome: 'Carlos Pereira', matricula: 'COL-0003', email: 'carlos.pereira@empresa.com.br', setor: 'TI · 3º andar' },
  {
    nome: 'Juliana Costa',
    matricula: 'COL-0004',
    email: 'juliana.costa@empresa.com.br',
    setor: 'Comercial · 2º andar',
  },
  {
    nome: 'Mariana Lopes',
    matricula: 'COL-0005',
    email: 'mariana.lopes@empresa.com.br',
    setor: 'Financeiro · 2º andar',
  },
];

/** Colaboradores de exemplo (usado também pelo "Restaurar dados de exemplo"). */
export function colaboradoresExemplo(): DadosColaborador[] {
  return EXEMPLOS.map((c) => ({ ...c }));
}

const SQL_INSERIR = 'INSERT INTO colaboradores (nome, matricula, email, setor) VALUES (?, ?, ?, ?)';

function valores(c: DadosColaborador) {
  return [c.nome, c.matricula, c.email, c.setor];
}

let pronto: ReturnType<typeof obterBanco> | null = null;

function banco() {
  if (!pronto) {
    pronto = (async () => {
      // Espera a carga inicial dos ativos terminar: duas cargas ao mesmo tempo abririam
      // duas transações na mesma conexão ("cannot start a transaction within a transaction").
      await listarAtivos();
      const db = await obterBanco();
      const res = await db.query('SELECT COUNT(*) AS total FROM colaboradores');
      if ((res.values?.[0]?.total ?? 0) === 0) {
        await db.executeSet(EXEMPLOS.map((c) => ({ statement: SQL_INSERIR, values: valores(c) })));
        await salvarAlteracoes();
      }
      return db;
    })().catch((erro) => {
      pronto = null;
      throw erro;
    });
  }
  return pronto;
}

/** Todos os colaboradores, em ordem alfabética. */
export async function listarColaboradores(): Promise<Colaborador[]> {
  const db = await banco();
  const res = await db.query('SELECT * FROM colaboradores');
  return ((res.values ?? []) as Colaborador[]).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Todos os colaboradores, cada um com a quantidade de ativos sob sua responsabilidade. */
export async function listarColaboradoresComAtivos(): Promise<ColaboradorComAtivos[]> {
  const colaboradores = await listarColaboradores();
  const totalPorNome = new Map<string, number>();
  for (const ativo of await listarAtivos()) {
    const chave = normalizar(ativo.responsavel);
    totalPorNome.set(chave, (totalPorNome.get(chave) ?? 0) + 1);
  }
  return colaboradores.map((c) => ({ ...c, totalAtivos: totalPorNome.get(normalizar(c.nome)) ?? 0 }));
}

export async function buscarColaborador(id: number): Promise<Colaborador | undefined> {
  const db = await banco();
  const res = await db.query('SELECT * FROM colaboradores WHERE id = ?', [id]);
  return res.values?.[0] as Colaborador | undefined;
}

/** Ativos cujo responsável é o nome informado. */
export async function ativosDoColaborador(nome: string): Promise<Ativo[]> {
  const chave = normalizar(nome);
  return (await listarAtivos()).filter((a) => normalizar(a.responsavel) === chave);
}

/** `ignorarId` é o próprio colaborador, na edição. */
export async function matriculaExiste(matricula: string, ignorarId = 0): Promise<boolean> {
  const db = await banco();
  const res = await db.query('SELECT id FROM colaboradores WHERE matricula = ? AND id <> ?', [
    matricula.trim(),
    ignorarId,
  ]);
  return (res.values ?? []).length > 0;
}

/** `ignorarId` é o próprio colaborador, na edição. */
export async function nomeExiste(nome: string, ignorarId = 0): Promise<boolean> {
  const chave = normalizar(nome);
  return (await listarColaboradores()).some((c) => c.id !== ignorarId && normalizar(c.nome) === chave);
}

async function verificarDuplicados(dados: DadosColaborador, ignorarId = 0) {
  if (await matriculaExiste(dados.matricula, ignorarId)) {
    throw new Error(`Já existe um colaborador com a matrícula ${dados.matricula}.`);
  }
  if (await nomeExiste(dados.nome, ignorarId)) {
    throw new Error(`Já existe um colaborador com o nome ${dados.nome}.`);
  }
}

/** Cadastra um novo colaborador. Lança erro se a matrícula ou o nome já existirem. */
export async function cadastrarColaborador(dados: DadosColaborador): Promise<void> {
  await verificarDuplicados(dados);
  const db = await banco();
  await db.run(SQL_INSERIR, valores(dados));
  await salvarAlteracoes();
}

/**
 * Atualiza um colaborador. Se o nome mudar, os ativos dele passam a mostrar o nome novo.
 * Devolve quantos ativos foram atualizados.
 */
export async function atualizarColaborador(id: number, dados: DadosColaborador): Promise<number> {
  const atual = await buscarColaborador(id);
  if (!atual) {
    throw new Error('Colaborador não encontrado.');
  }
  await verificarDuplicados(dados, id);

  // Os ativos são atualizados antes do colaborador: se algo falhar no meio, salvar de novo completa a troca.
  // Um de cada vez, porque cada atualização abre uma transação na mesma conexão.
  let ativosAtualizados = 0;
  if (atual.nome !== dados.nome) {
    for (const { patrimonio, ...ativo } of await ativosDoColaborador(atual.nome)) {
      await atualizarAtivo(patrimonio, { ...ativo, responsavel: dados.nome });
      ativosAtualizados++;
    }
  }

  const db = await banco();
  await db.run('UPDATE colaboradores SET nome = ?, matricula = ?, email = ?, setor = ? WHERE id = ?', [
    ...valores(dados),
    id,
  ]);
  await salvarAlteracoes();
  return ativosAtualizados;
}

/** Exclui um colaborador. Lança erro se ele ainda tiver ativos. */
export async function excluirColaborador(id: number): Promise<void> {
  const atual = await buscarColaborador(id);
  if (!atual) {
    throw new Error('Colaborador não encontrado.');
  }
  const total = (await ativosDoColaborador(atual.nome)).length;
  if (total > 0) {
    throw new Error(
      total === 1 ? 'Transfira o ativo antes de excluir.' : `Transfira os ${total} ativos antes de excluir.`,
    );
  }
  const db = await banco();
  await db.run('DELETE FROM colaboradores WHERE id = ?', [id]);
  await salvarAlteracoes();
}
