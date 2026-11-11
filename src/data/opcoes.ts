/**
 * Opções PROVISÓRIAS dos campos de seleção do formulário de ativo.
 *
 * - LOCALIZACOES será substituída pelos setores cadastrados na página de Setores (Pedro).
 * - TIPOS_ATIVO será substituída pelas categorias cadastradas na página de Categorias (Pedro).
 *
 * Para trocar, basta o FormAtivo.vue passar a buscar as opções no service correspondente
 * em vez de importar daqui.
 */

export const TIPOS_ATIVO: string[] = ['Celular', 'Desktop', 'Impressora', 'Monitor', 'Notebook', 'Tablet'];

export const LOCALIZACOES: string[] = [
  'Almoxarifado',
  'Comercial · 2º andar',
  'Financeiro · 2º andar',
  'Recepção · Térreo',
  'RH · 1º andar',
  'TI · 3º andar',
];
