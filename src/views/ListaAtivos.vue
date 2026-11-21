<template>
  <BaseLayout titulo="Ativos">
    <div class="topo">
      <p class="contador" data-testid="contador">
        {{ visiveis.length }} de {{ ativos.length }} {{ ativos.length === 1 ? 'ativo' : 'ativos' }}
      </p>
      <ion-button size="small" router-link="/ativos/novo" class="btn-novo">
        <ion-icon slot="start" :icon="add" />
        Novo ativo
      </ion-button>
    </div>

    <ion-searchbar
      v-model="filtros.busca"
      mode="ios"
      :debounce="200"
      placeholder="Modelo, série, patrimônio, responsável…"
      class="busca"
    />

    <div class="filtros">
      <ion-select
        v-model="filtros.tipo"
        label="Tipo"
        label-placement="stacked"
        fill="outline"
        interface="popover"
        class="filtro"
      >
        <ion-select-option value="">Todos</ion-select-option>
        <ion-select-option v-for="tipo in tipos" :key="tipo" :value="tipo">{{ tipo }}</ion-select-option>
      </ion-select>

      <ion-select
        v-model="filtros.status"
        label="Status"
        label-placement="stacked"
        fill="outline"
        interface="popover"
        class="filtro"
      >
        <ion-select-option value="">Todos</ion-select-option>
        <ion-select-option v-for="status in STATUS_ATIVO" :key="status" :value="status">
          {{ status }}
        </ion-select-option>
      </ion-select>
    </div>

    <div class="limpar">
      <ion-button fill="clear" size="small" :disabled="!temFiltro" @click="limparFiltros">
        Limpar filtros
      </ion-button>
    </div>

    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" @click="carregar">Tentar novamente</ion-button>
    </div>

    <div v-else-if="visiveis.length === 0" class="estado">
      <template v-if="ativos.length === 0">
        <p>Nenhum ativo cadastrado ainda.</p>
        <ion-button size="small" router-link="/ativos/novo">Cadastrar o primeiro ativo</ion-button>
      </template>
      <template v-else>
        <p>Nenhum ativo encontrado com esses filtros.</p>
        <ion-button fill="outline" size="small" @click="limparFiltros">Limpar filtros</ion-button>
      </template>
    </div>

    <ion-list v-else lines="full" class="lista">
      <ion-item
        v-for="ativo in visiveis"
        :key="ativo.patrimonio"
        :router-link="`/ativos/${encodeURIComponent(ativo.patrimonio)}`"
        router-direction="forward"
        detail
      >
        <ion-label>
          <h2 class="modelo">{{ ativo.modelo }}</h2>
          <p>{{ ativo.tipo }} · {{ ativo.patrimonio }} · Série {{ ativo.numeroSerie }}</p>
          <p>{{ ativo.responsavel || 'Sem responsável' }} · {{ ativo.localizacao }}</p>
          <p v-if="ativo.status === 'Manutenção'" class="parado">
            {{ textoParado(ativo.patrimonio) }}
          </p>
        </ion-label>
        <ion-chip slot="end" class="status-chip" :class="classeStatus(ativo.status)">
          <span class="bolinha"></span>
          {{ ativo.status }}
        </ion-chip>
      </ion-item>
    </ion-list>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  onIonViewWillEnter,
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import BaseLayout from '@/components/Toolbar-site.vue';
import { listarAtivos, STATUS_ATIVO, type Ativo, type StatusAtivo } from '@/services/ativos';
import { listarEventos } from '@/services/movimentacoes';
import { filtrarAtivos, filtrosVazios, temFiltroAtivo, type FiltrosAtivos } from '@/utils/filtrosAtivos';

const ativos = ref<Ativo[]>([]);
const carregando = ref(true);
const erro = ref('');

// patrimônio -> data (AAAA-MM-DD) em que entrou em manutenção
const inicioManutencao = ref<Record<string, string>>({});

// Estado único dos filtros (busca, tipo e status).
const filtros = ref<FiltrosAtivos>(filtrosVazios());

const visiveis = computed(() => filtrarAtivos(ativos.value, filtros.value));
const temFiltro = computed(() => temFiltroAtivo(filtros.value));

// Os tipos do filtro vêm dos próprios ativos cadastrados.
const tipos = computed(() => [...new Set(ativos.value.map((a) => a.tipo))].sort((a, b) => a.localeCompare(b)));

function limparFiltros() {
  filtros.value = filtrosVazios();
}

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    ativos.value = await listarAtivos();

    // listarEventos já vem do mais recente para o mais antigo,
    // então o primeiro evento 'manutencao' de cada patrimônio é o que vale.
    const mapa: Record<string, string> = {};
    const cadastro: Record<string, string> = {};
    for (const e of await listarEventos()) {
      if (e.tipo === 'manutencao' && !mapa[e.patrimonio]) mapa[e.patrimonio] = e.data;
      if (e.tipo === 'cadastro') cadastro[e.patrimonio] = e.data;
    }
    // Sem evento de manutenção (ativo criado já em manutenção): usa a data do cadastro.
    for (const [patrimonio, data] of Object.entries(cadastro)) {
      if (!mapa[patrimonio]) mapa[patrimonio] = data;
    }
    inicioManutencao.value = mapa;
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar os ativos.';
  } finally {
    carregando.value = false;
  }
}

// O Ionic mantém a página em memória; recarregar ao entrar garante que um ativo
// recém-cadastrado ou editado já apareça ao voltar para a lista.
onIonViewWillEnter(carregar);

function classeStatus(status: StatusAtivo) {
  return {
    'em-uso': status === 'Em uso',
    'em-manutencao': status === 'Manutenção',
    baixado: status === 'Baixado',
  };
}

function textoParado(patrimonio: string): string {
  const data = inicioManutencao.value[patrimonio];
  if (!data) return 'Em manutenção (data não registrada)';

  const [ano, mes, dia] = data.split('-').map(Number);
  const inicio = new Date(ano, mes - 1, dia); // data local, evita erro de fuso
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dias = Math.max(0, Math.round((hoje.getTime() - inicio.getTime()) / 86_400_000));

  if (dias === 0) return 'Parado desde hoje';
  return `Parado há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}
</script>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.contador {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
}
.btn-novo {
  --border-radius: 8px;
  text-transform: none;
  margin: 0;
}

.busca {
  padding-inline: 0;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.filtro {
  --border-radius: 8px;
}

.limpar {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
.limpar ion-button {
  text-transform: none;
  margin: 0;
}

.lista {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 0;
}
.lista ion-item:last-child {
  --border-width: 0;
}
.modelo {
  font-size: 16px;
  font-weight: 600;
  color: #1f2328;
}

.parado {
  font-weight: 600;
  color: #a35f00;
}

.status-chip {
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
}
.bolinha {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.em-uso {
  --background: #e6f6ea;
  --color: #1e7a3a;
}
.em-manutencao {
  --background: #fff4e0;
  --color: #a35f00;
}
.baixado {
  --background: #fdecec;
  --color: #b42318;
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