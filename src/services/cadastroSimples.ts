/**
 * Base dos cadastros auxiliares que só têm nome (Pedro):
 * - Localizações/Setores  -> tabela `localizacoes` (usada em ativos.localizacao e colaboradores.setor)
 * - Categorias/Tipos      -> tabela `categorias`   (usada em ativos.tipo)
 *
 * Como o ativo e o colaborador guardam o NOME (texto) e não o id:
 * - renomear atualiza, na mesma transação, todos os registros que usam o nome antigo;
 * - excluir só é permitido quando nenhum registro usa o nome.
 */
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

import { listarColaboradores } from './colaboradores';
import { obterBanco, salvarAlteracoes } from './db';

import { CATEGORIAS_EXEMPLO, LOCALIZACOES_EXEMPLO } from '@/data/opcoes';
import { chaveNome, limparNome, validarNome, type ItemComNome } from '@/utils/validacaoCadastroSimples';

export type ItemCadastro = ItemComNome;

export interface ItemComUso extends ItemCadastro {
  totalAtivos: number;
  totalColaboradores: number;
}

/** Onde o nome do cadastro é usado, ex.: { tabela: 'ativos', coluna: 'localizacao' }. */
interface Uso {
  tabela: 'ativos' | 'colaboradores';
  coluna: string;
}

export interface ConfigCadastro {
  tabela: 'localizacoes' | 'categorias';
  usos: Uso[];
  exemplos: () => string[];
}

export const CONFIG_LOCALIZACOES: ConfigCadastro = {
  tabela: 'localizacoes',
  usos: [
    { tabela: 'ativos', coluna: 'localizacao' },
    { tabela: 'colaboradores', coluna: 'setor' },
  ],
  exemplos: () => [...LOCALIZACOES_EXEMPLO],
};

export const CONFIG_CATEGORIAS: ConfigCadastro = {
  tabela: 'categorias',
  usos: [{ tabela: 'ativos', coluna: 'tipo' }],
  exemplos: () => [...CATEGORIAS_EXEMPLO],
};

// ---------- Banco pronto (com dados iniciais na primeira vez) ----------

let pronto: Promise<SQLiteDBConnection> | null = null;

/** Nomes iniciais: os exemplos + os que já estiverem em uso no banco (para quem já tinha dados). */
async function nomesIniciais(db: SQLiteDBConnection, config: ConfigCadastro): Promise<string[]> {
  const nomes = new Map<string, string>();
  const incluir = (nome: string) => {
    const limpo = limparNome(nome);
    if (limpo && !nomes.has(chaveNome(limpo))) nomes.set(chaveNome(limpo), limpo);
  };
  config.exemplos().forEach(incluir);
  for (const uso of config.usos) {
    const res = await db.query(`SELECT DISTINCT ${uso.coluna} AS nome FROM ${uso.tabela}`);
    for (const linha of res.values ?? []) incluir(String(linha.nome ?? ''));
  }
  return [...nomes.values()];
}

function banco(): Promise<SQLiteDBConnection> {
  if (!pronto) {
    pronto = (async () => {
      // Espera ativos e colaboradores terminarem a carga inicial: duas cargas ao mesmo tempo abririam
      // duas transações na mesma conexão ("cannot start a transaction within a transaction").
      // Pelo mesmo motivo, as duas tabelas são preenchidas aqui, uma depois da outra.
      await listarColaboradores();
      const db = await obterBanco();
      for (const config of [CONFIG_LOCALIZACOES, CONFIG_CATEGORIAS]) {
        const res = await db.query(`SELECT COUNT(*) AS total FROM ${config.tabela}`);
        if ((res.values?.[0]?.total ?? 0) === 0) {
          const nomes = await nomesIniciais(db, config);
          await db.executeSet(
            nomes.map((nome) => ({ statement: `INSERT INTO ${config.tabela} (nome) VALUES (?)`, values: [nome] })),
          );
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

// ---------- Funções ----------

function ordenar<T extends ItemCadastro>(itens: T[]): T[] {
  return itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function listar(config: ConfigCadastro): Promise<ItemCadastro[]> {
  const db = await banco();
  const res = await db.query(`SELECT id, nome FROM ${config.tabela}`);
  return ordenar((res.values ?? []) as ItemCadastro[]);
}

/** Só os nomes, em ordem alfabética: é o que os campos de seleção usam. */
export async function listarNomes(config: ConfigCadastro): Promise<string[]> {
  return (await listar(config)).map((item) => item.nome);
}

/** Quantos registros usam cada nome, por tabela de uso. A chave do Map é chaveNome(nome). */
async function contarUsos(db: SQLiteDBConnection, config: ConfigCadastro) {
  const contagem = { ativos: new Map<string, number>(), colaboradores: new Map<string, number>() };
  for (const uso of config.usos) {
    const res = await db.query(
      `SELECT ${uso.coluna} AS nome, COUNT(*) AS total FROM ${uso.tabela} GROUP BY ${uso.coluna}`,
    );
    for (const linha of res.values ?? []) {
      const chave = chaveNome(String(linha.nome ?? ''));
      const mapa = contagem[uso.tabela];
      mapa.set(chave, (mapa.get(chave) ?? 0) + Number(linha.total ?? 0));
    }
  }
  return contagem;
}

export async function listarComUso(config: ConfigCadastro): Promise<ItemComUso[]> {
  const itens = await listar(config);
  const db = await banco();
  const contagem = await contarUsos(db, config);
  return itens.map((item) => ({
    ...item,
    totalAtivos: contagem.ativos.get(chaveNome(item.nome)) ?? 0,
    totalColaboradores: contagem.colaboradores.get(chaveNome(item.nome)) ?? 0,
  }));
}

export async function buscar(config: ConfigCadastro, id: number): Promise<ItemCadastro | undefined> {
  const db = await banco();
  const res = await db.query(`SELECT id, nome FROM ${config.tabela} WHERE id = ?`, [id]);
  return res.values?.[0] as ItemCadastro | undefined;
}

async function validarOuFalhar(config: ConfigCadastro, nome: string, ignorarId = 0) {
  const erro = validarNome(nome, await listar(config), ignorarId);
  if (erro) throw new Error(erro);
}

/** Cadastra um novo item. Lança erro se o nome for inválido ou já existir. */
export async function cadastrar(config: ConfigCadastro, nome: string): Promise<void> {
  await validarOuFalhar(config, nome);
  const db = await banco();
  await db.run(`INSERT INTO ${config.tabela} (nome) VALUES (?)`, [limparNome(nome)]);
  await salvarAlteracoes();
}

/**
 * Renomeia um item e, na mesma transação, todos os ativos/colaboradores que usavam o nome antigo.
 * Devolve quantos registros foram atualizados (além do próprio item).
 */
export async function renomear(config: ConfigCadastro, id: number, nome: string): Promise<number> {
  const atual = await buscar(config, id);
  if (!atual) throw new Error('Cadastro não encontrado.');
  await validarOuFalhar(config, nome, id);

  const novoNome = limparNome(nome);
  if (novoNome === atual.nome) return 0;

  const db = await banco();
  const contagem = await contarUsos(db, config);
  const afetados =
    (contagem.ativos.get(chaveNome(atual.nome)) ?? 0) + (contagem.colaboradores.get(chaveNome(atual.nome)) ?? 0);

  await db.executeSet([
    ...config.usos.map((uso) => ({
      statement: `UPDATE ${uso.tabela} SET ${uso.coluna} = ? WHERE ${uso.coluna} = ?`,
      values: [novoNome, atual.nome],
    })),
    { statement: `UPDATE ${config.tabela} SET nome = ? WHERE id = ?`, values: [novoNome, id] },
  ]);
  await salvarAlteracoes();
  return afetados;
}

/** Mensagem que explica por que um item em uso não pode ser excluído ('' = pode excluir). */
export function motivoBloqueioExclusao(item: Pick<ItemComUso, 'totalAtivos' | 'totalColaboradores'>): string {
  const partes: string[] = [];
  if (item.totalAtivos > 0) partes.push(`${item.totalAtivos} ${item.totalAtivos === 1 ? 'ativo' : 'ativos'}`);
  if (item.totalColaboradores > 0) {
    partes.push(`${item.totalColaboradores} ${item.totalColaboradores === 1 ? 'colaborador' : 'colaboradores'}`);
  }
  return partes.length ? `Em uso por ${partes.join(' e ')}. Altere-os antes de excluir.` : '';
}

/** Exclui um item. Lança erro se ainda estiver em uso. */
export async function excluir(config: ConfigCadastro, id: number): Promise<void> {
  const item = (await listarComUso(config)).find((i) => i.id === id);
  if (!item) throw new Error('Cadastro não encontrado.');
  const motivo = motivoBloqueioExclusao(item);
  if (motivo) throw new Error(motivo);

  const db = await banco();
  await db.run(`DELETE FROM ${config.tabela} WHERE id = ?`, [id]);
  await salvarAlteracoes();
}

/** Usado pelo "Restaurar dados de exemplo": garante que a carga inicial já terminou. */
export async function aguardarCargaInicial(): Promise<void> {
  await banco();
}
