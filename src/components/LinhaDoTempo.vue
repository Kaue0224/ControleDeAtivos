<template>
  <ul class="timeline">
    <li v-for="item in eventos" :key="item.id" class="evento" data-testid="evento">
      <span class="marcador" :class="item.tipo"></span>
      <div class="evento-conteudo">
        <div class="evento-meta">
          <span class="data">{{ formatarData(item.data) }}</span>
          <span class="tipo">{{ ROTULO_TIPO_EVENTO[item.tipo] }}</span>
        </div>
        <router-link v-if="mostrarAtivo" :to="`/ativos/${encodeURIComponent(item.patrimonio)}`" class="evento-ativo">
          {{ item.patrimonio }}<template v-if="item.modelo"> · {{ item.modelo }}</template>
        </router-link>
        <strong class="evento-titulo">{{ item.titulo }}</strong>
        <span v-if="item.responsavel" class="evento-detalhe">Responsável: {{ item.responsavel }}</span>
        <span v-if="item.detalhe" class="evento-detalhe">{{ item.detalhe }}</span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ROTULO_TIPO_EVENTO, type Evento } from '@/services/movimentacoes';
import { formatarData } from '@/utils/movimentacao';

withDefaults(
  defineProps<{
    eventos: (Evento & { modelo?: string })[];
    /** Mostra o patrimônio e o modelo do ativo em cada evento (usado no histórico geral). */
    mostrarAtivo?: boolean;
  }>(),
  { mostrarAtivo: false },
);
</script>

<style scoped>
.timeline {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
}
.evento {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
}
.evento:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: #e3e5e8;
}
.marcador {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #d0d4d9;
}
.marcador.transferencia {
  background: #6d3ff0;
}
.marcador.cadastro {
  background: #5f6670;
}
.marcador.manutencao {
  background: #e08a00;
}
.marcador.devolucao {
  background: #1e9e4a;
}
.marcador.baixa {
  background: #d92d20;
}

.evento-conteudo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.evento-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}
.data {
  color: #6b7280;
}
.tipo {
  color: #5f6670;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.evento-ativo {
  font-size: 13px;
  font-weight: 600;
  color: #1a56db;
  text-decoration: none;
}
.evento-titulo {
  font-size: 15px;
  color: #1f2328;
}
.evento-detalhe {
  font-size: 14px;
  color: #6b7280;
}
</style>
