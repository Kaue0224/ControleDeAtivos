<template>
  <BaseLayout titulo="Detalhes do colaborador" mostrar-voltar voltar-para="/colaboradores">
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro || !colaborador" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" router-link="/colaboradores" router-direction="back">
        Voltar para a lista
      </ion-button>
    </div>

    <template v-else>
      <div class="topo">
        <ion-button
          fill="outline"
          size="small"
          class="btn-acao"
          :router-link="`/colaboradores/${colaborador.id}/editar`"
        >
          Editar
        </ion-button>
        <ion-button
          fill="outline"
          size="small"
          color="danger"
          class="btn-acao"
          :disabled="ativos.length > 0 || excluindo"
          @click="confirmarExclusao"
        >
          Excluir
        </ion-button>
      </div>
      <p v-if="ativos.length > 0" class="ajuda">
        {{
          ativos.length === 1
            ? 'Transfira o ativo antes de excluir.'
            : `Transfira os ${ativos.length} ativos antes de excluir.`
        }}
      </p>

      <div class="card-detalhes">
        <div v-for="campo in campos" :key="campo.rotulo" class="campo">
          <span class="rotulo">{{ campo.rotulo }}</span>
          <span class="valor">{{ campo.valor }}</span>
        </div>
      </div>

      <h2 class="secao">Ativos sob responsabilidade · {{ ativos.length }}</h2>

      <p v-if="ativos.length === 0" class="vazio">Nenhum ativo com este colaborador.</p>

      <ion-list v-else lines="full" class="lista">
        <ion-item
          v-for="ativo in ativos"
          :key="ativo.patrimonio"
          :router-link="`/ativos/${encodeURIComponent(ativo.patrimonio)}`"
          router-direction="forward"
          detail
        >
          <ion-label>
            <h2 class="modelo">{{ ativo.modelo }}</h2>
            <p>{{ ativo.tipo }} · {{ ativo.patrimonio }}</p>
            <p>{{ ativo.localizacao }}</p>
          </ion-label>
          <ion-chip slot="end" class="status-chip" :class="classeStatus(ativo.status)">
            <span class="bolinha"></span>
            {{ ativo.status }}
          </ion-chip>
        </ion-item>
      </ion-list>
    </template>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  alertController,
  IonButton,
  IonChip,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  onIonViewWillEnter,
  toastController,
  useIonRouter,
} from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import type { Ativo, StatusAtivo } from '@/services/ativos';
import { ativosDoColaborador, buscarColaborador, excluirColaborador, type Colaborador } from '@/services/colaboradores';

const route = useRoute();
const ionRouter = useIonRouter();

const colaborador = ref<Colaborador | null>(null);
const ativos = ref<Ativo[]>([]);
const carregando = ref(true);
const erro = ref('');
const excluindo = ref(false);

const campos = computed(() => [
  { rotulo: 'Nome', valor: colaborador.value?.nome },
  { rotulo: 'Matrícula', valor: colaborador.value?.matricula },
  { rotulo: 'E-mail', valor: colaborador.value?.email || 'Não informado' },
  { rotulo: 'Setor', valor: colaborador.value?.setor },
]);

async function carregar() {
  carregando.value = true;
  erro.value = '';
  colaborador.value = null;
  ativos.value = [];
  try {
    const id = typeof route.params.id === 'string' ? Number(route.params.id) : 0;
    const encontrado = await buscarColaborador(id);
    if (!encontrado) {
      erro.value = 'Colaborador não encontrado.';
      return;
    }
    ativos.value = await ativosDoColaborador(encontrado.nome);
    colaborador.value = encontrado;
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar o colaborador.';
  } finally {
    carregando.value = false;
  }
}

// Recarrega ao entrar (inclusive ao voltar da edição).
onIonViewWillEnter(carregar);

async function confirmarExclusao() {
  const alerta = await alertController.create({
    header: 'Excluir colaborador',
    message: `Excluir ${colaborador.value?.nome}? Essa ação não pode ser desfeita.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Excluir', role: 'destructive' },
    ],
  });
  await alerta.present();
  const { role } = await alerta.onDidDismiss();
  if (role === 'destructive') await excluir();
}

async function excluir() {
  if (!colaborador.value) return;
  excluindo.value = true;
  try {
    await excluirColaborador(colaborador.value.id);
    await avisar('Colaborador excluído.', 'success');
    if (ionRouter.canGoBack()) ionRouter.back();
    else ionRouter.navigate('/colaboradores', 'back', 'replace');
  } catch (e) {
    console.error(e);
    await avisar(e instanceof Error ? e.message : 'Não foi possível excluir o colaborador.', 'danger');
    await carregar();
  } finally {
    excluindo.value = false;
  }
}

async function avisar(mensagem: string, cor: 'success' | 'danger') {
  const toast = await toastController.create({ message: mensagem, duration: 2000, color: cor, position: 'bottom' });
  await toast.present();
}

function classeStatus(status: StatusAtivo) {
  return {
    'em-uso': status === 'Em uso',
    'em-manutencao': status === 'Manutenção',
    baixado: status === 'Baixado',
  };
}
</script>

<style scoped>
.topo {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
.btn-acao {
  --border-radius: 8px;
  --border-width: 1.5px;
  text-transform: none;
  font-size: 15px;
  margin: 0;
}
.ajuda {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
  text-align: right;
}

.card-detalhes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 28px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-bottom: 1px solid #e3e5e8;
}
.campo:nth-last-child(-n + 2) {
  border-bottom: none;
}
.rotulo {
  font-size: 13px;
  color: #6b7280;
}
.valor {
  font-size: 16px;
  color: #1f2328;
  word-break: break-word;
}

.secao {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
  margin: 0 0 16px;
}
.vazio {
  margin: 0;
  color: #6b7280;
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
