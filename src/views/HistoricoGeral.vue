<template>
  <BaseLayout titulo="Histórico de movimentações" mostrar-voltar voltar-para="/ativos">
    <p class="contador" data-testid="contador">
      {{ visiveis.length }} de {{ eventos.length }} {{ eventos.length === 1 ? 'movimentação' : 'movimentações' }}
    </p>

    <div class="filtros">
      <ion-select
        v-model="filtros.tipo"
        label="Tipo"
        label-placement="stacked"
        fill="outline"
        interface="popover"
        class="filtro filtro-tipo"
      >
        <ion-select-option value="">Todos</ion-select-option>
        <ion-select-option v-for="tipo in TIPOS_EVENTO" :key="tipo" :value="tipo">
          {{ ROTULO_TIPO_EVENTO[tipo] }}
        </ion-select-option>
      </ion-select>

      <ion-input
        v-model="filtros.de"
        type="date"
        label="De"
        label-placement="stacked"
        fill="outline"
        :max="filtros.ate || undefined"
        class="filtro"
      />
      <ion-input
        v-model="filtros.ate"
        type="date"
        label="Até"
        label-placement="stacked"
        fill="outline"
        :min="filtros.de || undefined"
        class="filtro"
      />
    </div>

    <div class="limpar">
      <p v-if="erroPeriodo" class="erro">{{ erroPeriodo }}</p>
      <ion-button fill="clear" size="small" :disabled="!temFiltro" @click="limparFiltros">Limpar filtros</ion-button>
    </div>

    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" @click="carregar">Tentar novamente</ion-button>
    </div>

    <div v-else-if="visiveis.length === 0" class="estado">
      <template v-if="eventos.length === 0">
        <p>Nenhuma movimentação registrada ainda.</p>
      </template>
      <template v-else>
        <p>Nenhuma movimentação encontrada com esses filtros.</p>
        <ion-button fill="outline" size="small" @click="limparFiltros">Limpar filtros</ion-button>
      </template>
    </div>

    <LinhaDoTempo v-else :eventos="visiveis" mostrar-ativo />
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonButton, IonInput, IonSelect, IonSelectOption, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import LinhaDoTempo from '@/components/LinhaDoTempo.vue';
import { listarEventos, ROTULO_TIPO_EVENTO, TIPOS_EVENTO, type EventoComAtivo } from '@/services/movimentacoes';
import {
  filtrarEventos,
  filtrosHistoricoVazios,
  temFiltroHistorico,
  validarPeriodo,
  type FiltrosHistorico,
} from '@/utils/filtrosHistorico';

const eventos = ref<EventoComAtivo[]>([]);
const filtros = ref<FiltrosHistorico>(filtrosHistoricoVazios());
const carregando = ref(true);
const erro = ref('');

const erroPeriodo = computed(() => validarPeriodo(filtros.value));
const temFiltro = computed(() => temFiltroHistorico(filtros.value));
// Com o período invertido não mostra nada até a pessoa corrigir.
const visiveis = computed(() => (erroPeriodo.value ? [] : filtrarEventos(eventos.value, filtros.value)));

function limparFiltros() {
  filtros.value = filtrosHistoricoVazios();
}

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    eventos.value = await listarEventos();
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar o histórico.';
  } finally {
    carregando.value = false;
  }
}

// Recarrega ao entrar para mostrar movimentações feitas em outras páginas.
onIonViewWillEnter(carregar);
</script>

<style scoped>
.contador {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
}
.filtros {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.filtro {
  --border-radius: 8px;
}
@media (max-width: 520px) {
  .filtros {
    grid-template-columns: 1fr 1fr;
  }
  .filtro-tipo {
    grid-column: 1 / -1;
  }
}
.limpar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin: 4px 0 12px;
}
.limpar .erro {
  margin: 0;
  margin-right: auto;
  font-size: 13px;
}
.limpar ion-button {
  text-transform: none;
}
.estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
}
.estado p {
  margin: 0;
}
.estado ion-button {
  text-transform: none;
}
.erro {
  color: #b42318;
}
</style>
