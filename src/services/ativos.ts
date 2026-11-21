/**
 * Service de ativos: listar, buscar, cadastrar e atualizar.
 *
 * - Os dados ficam no SQLite (tabela `ativos`, ver db.ts). Todas as funções são assíncronas: use `await`.
 * - O `patrimonio` é o identificador do ativo (vai na URL: /ativos/PAT-00112) e não muda após o cadastro.
 * - Histórico (eventos) e movimentação (`movimentar`) ficam em movimentacoes.ts.
 * - Na primeira vez que o banco é aberto (tabela vazia), os dados de exemplo são inseridos.
 */
import { obterBanco, salvarAlteracoes } from './db';

export type StatusAtivo = 'Em uso' | 'Manutenção' | 'Baixado';

export const STATUS_ATIVO: StatusAtivo[] = ['Em uso', 'Manutenção', 'Baixado'];

export interface Ativo {
  /** Identificador único. Não pode ser alterado depois do cadastro. */
  patrimonio: string;
  tipo: string;
  modelo: string;
  numeroSerie: string;
  responsavel: string;
  localizacao: string;
  status: StatusAtivo;
  /** Foto do ativo (imagem em base64 ou caminho). Vazio ou ausente = sem foto. */
  foto?: string;
}

/** Campos que podem ser alterados na edição (tudo menos o patrimônio). */
export type DadosEditaveis = Omit<Ativo, 'patrimonio'>;

/** Dados de exemplo inseridos quando o banco está vazio. */
export function dadosExemplo(): Ativo[] {
  return [
    {
      patrimonio: 'PAT-00112',
      tipo: 'Notebook',
      modelo: 'Dell Latitude 5440',
      numeroSerie: 'DL5440-7HQ2K93',
      responsavel: 'Mariana Lopes',
      localizacao: 'Financeiro · 2º andar',
      status: 'Em uso',
    },
    {
      patrimonio: 'PAT-00113',
      tipo: 'Notebook',
      modelo: 'Lenovo ThinkPad E14',
      numeroSerie: 'LNV-E14-88213',
      responsavel: 'Carlos Pereira',
      localizacao: 'TI · 3º andar',
      status: 'Manutenção',
    },
    {
      patrimonio: 'PAT-00087',
      tipo: 'Desktop',
      modelo: 'HP ProDesk 400 G7',
      numeroSerie: 'HP400-5521XZ',
      responsavel: 'Ana Souza',
      localizacao: 'RH · 1º andar',
      status: 'Em uso',
    },
    {
      patrimonio: 'PAT-00095',
      tipo: 'Monitor',
      modelo: 'LG 24MK430H',
      numeroSerie: 'LG24-993104',
      responsavel: 'Ana Souza',
      localizacao: 'RH · 1º andar',
      status: 'Em uso',
    },
    {
      patrimonio: 'PAT-00041',
      tipo: 'Impressora',
      modelo: 'Brother HL-L2350DW',
      numeroSerie: 'BRH-L2350-0071',
      responsavel: 'Recepção',
      localizacao: 'Recepção · Térreo',
      status: 'Baixado',
    },
    {
      patrimonio: 'PAT-00150',
      tipo: 'Celular',
      modelo: 'Samsung Galaxy A54',
      numeroSerie: 'SMA54-33018',
      responsavel: 'Bruno Martins',
      localizacao: 'Comercial · 2º andar',
      status: 'Em uso',
    },
    {
      patrimonio: 'PAT-00151',
      tipo: 'Celular',
      modelo: 'Motorola Moto G84',
      numeroSerie: 'MTG84-70452',
      responsavel: 'Juliana Costa',
      localizacao: 'Comercial · 2º andar',
      status: 'Manutenção',
    },
    {
      patrimonio: 'PAT-00063',
      tipo: 'Desktop',
      modelo: 'Dell OptiPlex 3080',
      numeroSerie: 'DOP3080-1189',
      responsavel: '',
      localizacao: 'Almoxarifado',
      status: 'Baixado',
    },
  ];
}

// ---------- Conversão entre linha do banco e objeto Ativo ----------

interface LinhaAtivo {
  patrimonio: string;
  tipo: string;
  modelo: string;
  numero_serie: string;
  responsavel: string;
  localizacao: string;
  status: StatusAtivo;
  foto: string | null;
}

function linhaParaAtivo(l: LinhaAtivo): Ativo {
  return {
    patrimonio: l.patrimonio,
    tipo: l.tipo,
    modelo: l.modelo,
    numeroSerie: l.numero_serie,
    responsavel: l.responsavel,
    localizacao: l.localizacao,
    status: l.status,
    foto: l.foto ?? '',
  };
}

const SQL_INSERIR = `INSERT INTO ativos (patrimonio, tipo, modelo, numero_serie, responsavel, localizacao, status, foto)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

function valoresInsercao(a: Ativo) {
  return [a.patrimonio, a.tipo, a.modelo, a.numeroSerie, a.responsavel, a.localizacao, a.status, a.foto ?? ''];
}

// ---------- Banco pronto (com dados de exemplo na primeira vez) ----------

let pronto: ReturnType<typeof obterBanco> | null = null;

function banco() {
  if (!pronto) {
    pronto = (async () => {
      const db = await obterBanco();
      const res = await db.query('SELECT COUNT(*) AS total FROM ativos');
      if ((res.values?.[0]?.total ?? 0) === 0) {
        await db.executeSet(dadosExemplo().map((a) => ({ statement: SQL_INSERIR, values: valoresInsercao(a) })));
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

// ---------- Funções públicas ----------

/** Todos os ativos, ordenados por patrimônio. */
export async function listarAtivos(): Promise<Ativo[]> {
  const db = await banco();
  const res = await db.query('SELECT * FROM ativos ORDER BY patrimonio');
  return (res.values ?? []).map((l) => linhaParaAtivo(l as LinhaAtivo));
}

/** Busca um ativo pelo patrimônio (sem diferenciar maiúsculas/minúsculas). */
export async function buscarAtivo(patrimonio: string): Promise<Ativo | undefined> {
  const db = await banco();
  const res = await db.query('SELECT * FROM ativos WHERE patrimonio = ?', [patrimonio.trim()]);
  const linha = res.values?.[0] as LinhaAtivo | undefined;
  return linha ? linhaParaAtivo(linha) : undefined;
}

export async function patrimonioExiste(patrimonio: string): Promise<boolean> {
  return (await buscarAtivo(patrimonio)) !== undefined;
}

/** Cadastra um novo ativo. Lança erro se o patrimônio já existir. */
export async function cadastrarAtivo(dados: Ativo): Promise<Ativo> {
  if (await patrimonioExiste(dados.patrimonio)) {
    throw new Error(`Já existe um ativo com o patrimônio ${dados.patrimonio.trim()}.`);
  }
  const novo: Ativo = { ...dados, patrimonio: dados.patrimonio.trim() };
  const db = await banco();
  await db.run(SQL_INSERIR, valoresInsercao(novo));
  await salvarAlteracoes();
  return novo;
}

/** Atualiza um ativo existente. O patrimônio nunca é alterado. Lança erro se não existir. */
export async function atualizarAtivo(patrimonio: string, dados: DadosEditaveis): Promise<Ativo> {
  const atual = await buscarAtivo(patrimonio);
  if (!atual) {
    throw new Error(`Ativo ${patrimonio} não encontrado.`);
  }
  // Se a foto não vier nos dados (ex.: formulário sem campo de foto), mantém a que já estava salva.
  const foto = dados.foto ?? atual.foto ?? '';
  const db = await banco();
  await db.run(
    `UPDATE ativos SET tipo = ?, modelo = ?, numero_serie = ?, responsavel = ?, localizacao = ?, status = ?, foto = ?
     WHERE patrimonio = ?`,
    [
      dados.tipo,
      dados.modelo,
      dados.numeroSerie,
      dados.responsavel,
      dados.localizacao,
      dados.status,
      foto,
      atual.patrimonio,
    ],
  );
  await salvarAlteracoes();
  return { ...dados, foto, patrimonio: atual.patrimonio };
}
