/**
 * Categorias/Tipos de ativo (usadas em ativos.tipo) — Pedro.
 * A lógica fica em cadastroSimples.ts; aqui só se escolhe a tabela.
 */
import {
  CONFIG_CATEGORIAS,
  buscar,
  cadastrar,
  excluir,
  listarComUso,
  listarNomes,
  renomear,
  type ItemCadastro,
  type ItemComUso,
} from './cadastroSimples';

export type { ItemCadastro as Categoria, ItemComUso as CategoriaComUso };

/** Nomes em ordem alfabética, para os campos de seleção. */
export const listarNomesCategorias = (): Promise<string[]> => listarNomes(CONFIG_CATEGORIAS);
export const listarCategoriasComUso = (): Promise<ItemComUso[]> => listarComUso(CONFIG_CATEGORIAS);
export const buscarCategoria = (id: number): Promise<ItemCadastro | undefined> => buscar(CONFIG_CATEGORIAS, id);
export const cadastrarCategoria = (nome: string): Promise<void> => cadastrar(CONFIG_CATEGORIAS, nome);
export const renomearCategoria = (id: number, nome: string): Promise<number> => renomear(CONFIG_CATEGORIAS, id, nome);
export const excluirCategoria = (id: number): Promise<void> => excluir(CONFIG_CATEGORIAS, id);
