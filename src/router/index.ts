import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import ListaAtivos from '../views/ListaAtivos.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/ativos' },
  { path: '/home', redirect: '/ativos' },

  // Ativos — o :id é o número de patrimônio (ex.: /ativos/PAT-00112).
  // "/ativos/novo" precisa vir antes de "/ativos/:id", senão "novo" seria lido como patrimônio.
  { path: '/ativos', name: 'ListaAtivos', component: ListaAtivos },
  { path: '/ativos/novo', name: 'NovoAtivo', component: () => import('../views/FormAtivo.vue') },
  { path: '/ativos/:id/editar', name: 'EditarAtivo', component: () => import('../views/FormAtivo.vue') },
  { path: '/ativos/:id', name: 'DetalheAtivo', component: () => import('../views/DetalheControle.vue') },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
