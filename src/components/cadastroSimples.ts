/** Tipos das props do componente ListaCadastroSimples.vue. */
import type { ItemComUso } from '@/services/cadastroSimples';

/** Funções do service (localizacoes.ts ou categorias.ts). */
export interface ServicoCadastro {
  listarComUso: () => Promise<ItemComUso[]>;
  cadastrar: (nome: string) => Promise<void>;
  renomear: (id: number, nome: string) => Promise<number>;
  excluir: (id: number) => Promise<void>;
}

export interface TextosCadastro {
  /** Ex.: "localização" */
  singular: string;
  /** Ex.: "localizações" */
  plural: string;
  descricao: string;
  placeholder: string;
  /** Mostra a contagem de colaboradores (só faz sentido em Localizações/Setores). */
  mostrarColaboradores?: boolean;
}
