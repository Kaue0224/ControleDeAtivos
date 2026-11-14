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

  // Colaboradores — o :id é o código numérico do colaborador (ex.: /colaboradores/3).
  // "/colaboradores/novo" precisa vir antes de "/colaboradores/:id".
  { path: '/colaboradores', name: 'ListaColaboradores', component: () => import('../views/ListaColaboradores.vue') },
  { path: '/colaboradores/novo', name: 'NovoColaborador', component: () => import('../views/FormColaborador.vue') },
  {
    path: '/colaboradores/:id(\\d+)/editar',
    name: 'EditarColaborador',
    component: () => import('../views/FormColaborador.vue'),
  },
  {
    path: '/colaboradores/:id(\\d+)',
    name: 'DetalheColaborador',
    component: () => import('../views/DetalheColaborador.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
