/**
 * Itens do menu lateral (App.vue).
 *
 * Para acrescentar uma página: crie a rota no router/index.ts e adicione um item aqui.
 * Se a página ainda não existir, deixe `ativo: false` — o item aparece desabilitado, com "em breve".
 * Quando a página ficar pronta, é só trocar para `ativo: true`.
 */
import {
  addCircleOutline,
  cubeOutline,
  locationOutline,
  peopleOutline,
  personCircleOutline,
  pricetagsOutline,
  statsChartOutline,
  timeOutline,
} from 'ionicons/icons';

export interface ItemMenu {
  titulo: string;
  rota: string;
  icone: string;
  ativo: boolean;
}

export interface SecaoMenu {
  titulo: string;
  itens: ItemMenu[];
}

export const MENU: SecaoMenu[] = [
  {
    titulo: 'Ativos',
    itens: [
      { titulo: 'Lista de ativos', rota: '/ativos', icone: cubeOutline, ativo: true },
      { titulo: 'Novo ativo', rota: '/ativos/novo', icone: addCircleOutline, ativo: true },
      { titulo: 'Resumo', rota: '/resumo', icone: statsChartOutline, ativo: true },
      { titulo: 'Histórico geral', rota: '/historico', icone: timeOutline, ativo: true },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { titulo: 'Colaboradores', rota: '/colaboradores', icone: peopleOutline, ativo: true },
      { titulo: 'Localizações', rota: '/localizacoes', icone: locationOutline, ativo: true },
      { titulo: 'Categorias', rota: '/categorias', icone: pricetagsOutline, ativo: true },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ titulo: 'Meu perfil', rota: '/perfil', icone: personCircleOutline, ativo: true }],
  },
];

/**
 * Rota do item que deve aparecer marcado para o caminho atual: a mais específica que combina.
 * Ex.: /ativos/PAT-00112 marca "Lista de ativos"; /ativos/novo marca "Novo ativo".
 */
export function rotaMarcada(caminho: string): string | null {
  const rotas = MENU.flatMap((s) => s.itens.map((i) => i.rota));
  const combinam = rotas.filter((r) => caminho === r || caminho.startsWith(r + '/'));
  return combinam.sort((a, b) => b.length - a.length)[0] ?? null;
}
