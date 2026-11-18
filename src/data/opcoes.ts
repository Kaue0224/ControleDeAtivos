/**
 * Valores de EXEMPLO dos cadastros auxiliares (Pedro).
 *
 * As opções dos campos de seleção agora vêm do banco (tabelas `localizacoes` e `categorias`),
 * cadastradas nas páginas /localizacoes e /categorias. Estas listas só são usadas para:
 * - preencher as tabelas na primeira vez que o app abre (tabela vazia);
 * - "Restaurar dados de exemplo" (UC10).
 *
 * Elas cobrem todos os tipos e localizações usados nos ativos e colaboradores de exemplo.
 */

export const CATEGORIAS_EXEMPLO: string[] = ['Celular', 'Desktop', 'Impressora', 'Monitor', 'Notebook', 'Tablet'];

export const LOCALIZACOES_EXEMPLO: string[] = [
  'Almoxarifado',
  'Comercial · 2º andar',
  'Financeiro · 2º andar',
  'Recepção · Térreo',
  'RH · 1º andar',
  'TI · 3º andar',
];
