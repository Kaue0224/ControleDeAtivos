<template>
  <BaseLayout titulo="Colaboradores" mostrar-voltar voltar-para="/ativos">
    <div class="topo">
      <p class="contador" data-testid="contador">
        {{ visiveis.length }} de {{ colaboradores.length }}
        {{ colaboradores.length === 1 ? 'colaborador' : 'colaboradores' }}
      </p>
      <ion-button size="small" router-link="/colaboradores/novo" class="btn-novo">
        <ion-icon slot="start" :icon="add" />
        Novo
      </ion-button>
    </div>

    <ion-searchbar v-model="busca" mode="ios" :debounce="200" placeholder="Nome, matrícula ou setor…" class="busca" />

    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" @click="carregar">Tentar novamente</ion-button>
    </div>

    <div v-else-if="visiveis.length === 0" class="estado">
      <template v-if="colaboradores.length === 0">
        <p>Nenhum colaborador cadastrado ainda.</p>
        <ion-button size="small" router-link="/colaboradores/novo">Cadastrar o primeiro colaborador</ion-button>
      </template>
      <template v-else>
        <p>Nenhum colaborador encontrado com essa busca.</p>
        <ion-button fill="outline" size="small" @click="busca = ''">Limpar busca</ion-button>
      </template>
    </div>

    <ion-list v-else lines="full" class="lista">
      <ion-item
        v-for="colaborador in visiveis"
        :key="colaborador.id"
        :router-link="`/colaboradores/${colaborador.id}`"
        router-direction="forward"
        detail
      >
        <ion-label>
          <h2 class="nome">{{ colaborador.nome }}</h2>
          <p>Matrícula {{ colaborador.matricula }} · {{ colaborador.setor }}</p>
        </ion-label>
        <ion-chip slot="end" class="chip-ativos" :class="{ 'sem-ativos': colaborador.totalAtivos === 0 }">
          {{ colaborador.totalAtivos }} {{ colaborador.totalAtivos === 1 ? 'ativo' : 'ativos' }}
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
  IonSpinner,
  onIonViewWillEnter,
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import BaseLayout from '@/components/Toolbar-site.vue';
import { listarColaboradoresComAtivos, type ColaboradorComAtivos } from '@/services/colaboradores';
import { normalizar } from '@/utils/validacaoColaborador';

const colaboradores = ref<ColaboradorComAtivos[]>([]);
const busca = ref('');
const carregando = ref(true);
const erro = ref('');

const visiveis = computed(() => {
  const termo = normalizar(busca.value);
  if (!termo) return colaboradores.value;
  return colaboradores.value.filter((c) =>
    [c.nome, c.matricula, c.setor].some((campo) => normalizar(campo).includes(termo)),
  );
});

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    colaboradores.value = await listarColaboradoresComAtivos();
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar os colaboradores.';
  } finally {
    carregando.value = false;
  }
}

// Recarrega ao entrar para refletir cadastros, edições e exclusões feitos em outras páginas.
onIonViewWillEnter(carregar);
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

.lista {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 0;
}
.lista ion-item:last-child {
  --border-width: 0;
}
.nome {
  font-size: 16px;
  font-weight: 600;
  color: #1f2328;
}

.chip-ativos {
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  --background: #e8f0fe;
  --color: #1a56db;
}
.chip-ativos.sem-ativos {
  --background: #f1f3f5;
  --color: #5f6670;
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
