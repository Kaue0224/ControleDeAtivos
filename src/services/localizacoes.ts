/**
 * Localizações/Setores (usadas em ativos.localizacao e colaboradores.setor) — Pedro.
 * A lógica fica em cadastroSimples.ts; aqui só se escolhe a tabela.
 */
import {
  CONFIG_LOCALIZACOES,
  buscar,
  cadastrar,
  excluir,
  listarComUso,
  listarNomes,
  renomear,
  type ItemCadastro,
  type ItemComUso,
} from './cadastroSimples';

export type { ItemCadastro as Localizacao, ItemComUso as LocalizacaoComUso };

/** Nomes em ordem alfabética, para os campos de seleção. */
export const listarNomesLocalizacoes = (): Promise<string[]> => listarNomes(CONFIG_LOCALIZACOES);
export const listarLocalizacoesComUso = (): Promise<ItemComUso[]> => listarComUso(CONFIG_LOCALIZACOES);
export const buscarLocalizacao = (id: number): Promise<ItemCadastro | undefined> => buscar(CONFIG_LOCALIZACOES, id);
export const cadastrarLocalizacao = (nome: string): Promise<void> => cadastrar(CONFIG_LOCALIZACOES, nome);
export const renomearLocalizacao = (id: number, nome: string): Promise<number> =>
  renomear(CONFIG_LOCALIZACOES, id, nome);
export const excluirLocalizacao = (id: number): Promise<void> => excluir(CONFIG_LOCALIZACOES, id);
