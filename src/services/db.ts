/**
 * ⚠️ VERSÃO PROVISÓRIA — conexão SQLite criada pelo Rafael; será revisada com Guilherme e Flavia.
 *
 * Abre (uma única vez) o banco SQLite usado pelo app, via @capacitor-community/sqlite.
 * - Android/iOS: usa o SQLite nativo do aparelho.
 * - Navegador (npm run dev): usa o componente <jeep-sqlite> (sql.js + IndexedDB). Ele precisa do arquivo
 *   public/assets/sql-wasm.wasm, que é copiado automaticamente no `npm install` (script "postinstall").
 *   Na web, as alterações só ficam gravadas depois de `salvarAlteracoes()`.
 *
 * Para criar novas tabelas (ex.: histórico de eventos), acrescente o CREATE TABLE em ESQUEMA.
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';

const NOME_BANCO = 'controle_ativos';

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS ativos (
  patrimonio   TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
  tipo         TEXT NOT NULL,
  modelo       TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  responsavel  TEXT NOT NULL DEFAULT '',
  localizacao  TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('Em uso', 'Manutenção', 'Baixado'))
);

CREATE TABLE IF NOT EXISTS colaboradores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  matricula  TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email      TEXT NOT NULL DEFAULT '',
  setor      TEXT NOT NULL
);

-- Cadastros auxiliares (Pedro): alimentam os campos de seleção de localização/setor e de tipo.
-- O ativo e o colaborador guardam o NOME (texto), então renomear aqui atualiza os dois.
CREATE TABLE IF NOT EXISTS localizacoes (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS categorias (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE COLLATE NOCASE
);
`;

const naWeb = Capacitor.getPlatform() === 'web';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let conexao: Promise<SQLiteDBConnection> | null = null;

async function prepararWeb() {
  const { defineCustomElements } = await import('jeep-sqlite/loader');
  await defineCustomElements(window);
  if (!document.querySelector('jeep-sqlite')) {
    document.body.appendChild(document.createElement('jeep-sqlite'));
  }
  await customElements.whenDefined('jeep-sqlite');
  await sqlite.initWebStore();
}

async function abrir(): Promise<SQLiteDBConnection> {
  if (naWeb) await prepararWeb();

  const consistente = (await sqlite.checkConnectionsConsistency()).result;
  const jaExiste = (await sqlite.isConnection(NOME_BANCO, false)).result;
  const db =
    consistente && jaExiste
      ? await sqlite.retrieveConnection(NOME_BANCO, false)
      : await sqlite.createConnection(NOME_BANCO, false, 'no-encryption', 1, false);

  await db.open();
  await db.execute(ESQUEMA);
  return db;
}

/** Devolve a conexão aberta com o banco (abre na primeira chamada). */
export function obterBanco(): Promise<SQLiteDBConnection> {
  if (!conexao) {
    conexao = abrir().catch((erro) => {
      conexao = null; // permite tentar de novo na próxima chamada
      throw erro;
    });
  }
  return conexao;
}

/** Na web, grava as alterações no IndexedDB. No celular não faz nada (já é gravado na hora). */
export async function salvarAlteracoes(): Promise<void> {
  if (naWeb) await sqlite.saveToStore(NOME_BANCO);
}
