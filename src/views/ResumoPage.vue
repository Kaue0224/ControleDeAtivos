<template>
  <BaseLayout titulo="Resumo" mostrar-voltar voltar-para="/ativos">
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" @click="carregar">Tentar novamente</ion-button>
    </div>

    <template v-else>
      <!-- Total e percentual por status -->
      <div class="card">
        <h2 class="secao">Ativos por status</h2>
        <p class="total-geral" data-testid="total-geral">
          {{ ativos.length }} {{ ativos.length === 1 ? 'ativo cadastrado' : 'ativos cadastrados' }}
        </p>

        <div v-for="item in resumoStatus" :key="item.status" class="status-linha">
          <div class="status-topo">
            <span class="status-nome" :class="item.classe">
              <span class="bolinha"></span>
              {{ item.status }}
            </span>
            <span class="status-valor">
              <strong>{{ item.total }}</strong>
              <span class="percentual">{{ item.percentual }}%</span>
            </span>
          </div>
          <ion-progress-bar :value="item.percentual / 100" :class="item.classe" class="barra" />
        </div>
      </div>

      <!-- Tabela por tipo e status -->
      <div class="card">
        <h2 class="secao">Tipo e status</h2>

        <p v-if="tipos.length === 0" class="texto">Nenhum ativo cadastrado ainda.</p>

        <div v-else class="tabela-wrap">
          <table class="tabela">
            <thead>
              <tr>
                <th class="col-tipo">Tipo</th>
                <th v-for="status in STATUS_ATIVO" :key="status">{{ status }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tipo in tipos" :key="tipo">
                <td class="col-tipo">{{ tipo }}</td>
                <td v-for="status in STATUS_ATIVO" :key="status">{{ contar(tipo, status) }}</td>
                <td class="col-total">{{ contar(tipo) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="col-tipo">Total</td>
                <td v-for="status in STATUS_ATIVO" :key="status">{{ contar(undefined, status) }}</td>
                <td class="col-total">{{ ativos.length }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <div class="card">
      <h2 class="secao">Atalhos</h2>
      <ion-list lines="full" class="lista">
        <ion-item router-link="/localizacoes" detail>
          <ion-label>Localizações / Setores</ion-label>
        </ion-item>
        <ion-item router-link="/categorias" detail>
          <ion-label>Categorias / Tipos de ativo</ion-label>
        </ion-item>
        <ion-item router-link="/historico" detail>
          <ion-label>Histórico de movimentações</ion-label>
        </ion-item>
        <ion-item router-link="/colaboradores" detail>
          <ion-label>Colaboradores</ion-label>
        </ion-item>
      </ion-list>
    </div>

    <div class="card">
      <h2 class="secao">Dados de exemplo</h2>
      <p class="texto">Apaga tudo o que foi cadastrado e volta para os 8 ativos de exemplo.</p>
      <BotaoRestaurarExemplo />
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonButton, IonItem, IonLabel, IonList, IonProgressBar, IonSpinner, onIonViewWillEnter } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import BotaoRestaurarExemplo from '@/components/BotaoRestaurarExemplo.vue';
import { listarAtivos, STATUS_ATIVO, type Ativo, type StatusAtivo } from '@/services/ativos';

const ativos = ref<Ativo[]>([]);
const carregando = ref(true);
const erro = ref('');

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    ativos.value = await listarAtivos();
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar o resumo.';
  } finally {
    carregando.value = false;
  }
}

// O Ionic mantém a página em memória; recarregar ao entrar atualiza os números.
onIonViewWillEnter(carregar);

function classeDoStatus(status: StatusAtivo): string {
  if (status === 'Em uso') return 'em-uso';
  if (status === 'Manutenção') return 'em-manutencao';
  return 'baixado';
}

// Total e percentual de cada status.
const resumoStatus = computed(() =>
  STATUS_ATIVO.map((status) => {
    const total = ativos.value.filter((a) => a.status === status).length;
    const percentual = ativos.value.length ? Math.round((total / ativos.value.length) * 100) : 0;
    return { status, total, percentual, classe: classeDoStatus(status) };
  }),
);

// Linhas da tabela: um tipo por linha.
const tipos = computed(() => [...new Set(ativos.value.map((a) => a.tipo))].sort((a, b) => a.localeCompare(b)));

// Conta ativos por tipo e/ou status. Sem argumentos de um dos lados, ignora aquele filtro.
function contar(tipo?: string, status?: StatusAtivo): number {
  return ativos.value.filter((a) => (tipo === undefined || a.tipo === tipo) && (status === undefined || a.status === status))
    .length;
}
</script>

<style scoped>
.card {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.secao {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
  margin: 0 0 12px;
}
.texto {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 14px;
}
.lista {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 0;
}
.lista ion-item:last-child {
  --border-width: 0;
}

.total-geral {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2328;
}

.status-linha {
  margin-bottom: 14px;
}
.status-linha:last-child {
  margin-bottom: 0;
}
.status-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.status-nome {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}
.status-valor {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-size: 18px;
  color: #1f2328;
}
.percentual {
  font-size: 13px;
  color: #6b7280;
}
.bolinha {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.barra {
  height: 8px;
  border-radius: 4px;
  --background: #eceef1;
}

.em-uso {
  color: #1e7a3a;
  --progress-background: #1e7a3a;
}
.em-manutencao {
  color: #a35f00;
  --progress-background: #d98a00;
}
.baixado {
  color: #b42318;
  --progress-background: #b42318;
}

.tabela-wrap {
  overflow-x: auto;
}
.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.tabela th,
.tabela td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #e3e5e8;
  white-space: nowrap;
}
.tabela th {
  font-weight: 600;
  color: #5f6670;
}
.tabela .col-tipo {
  text-align: left;
}
.tabela .col-total {
  font-weight: 600;
}
.tabela tfoot td {
  font-weight: 600;
  border-bottom: 0;
  border-top: 2px solid #e3e5e8;
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