<template>
  <BaseLayout titulo="Detalhes do Ativo" mostrar-voltar>
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erroCarga || !ativo" class="estado">
      <p class="erro">{{ erroCarga }}</p>
      <ion-button fill="outline" size="small" router-link="/ativos" router-direction="back">
        Voltar para a lista
      </ion-button>
    </div>

    <template v-else>
      <div class="topo">
        <span class="status-chip" :class="classeStatus(ativo.status)">
          <span class="bolinha"></span>
          {{ ativo.status }}
        </span>
        <ion-button
          fill="outline"
          size="small"
          class="btn-editar"
          :router-link="`/ativos/${encodeURIComponent(ativo.patrimonio)}/editar`"
          >Editar</ion-button
        >
      </div>

      <div class="card-detalhes">
        <div class="campo" v-for="campo in campos" :key="campo.rotulo">
          <span class="rotulo">{{ campo.rotulo }}</span>
          <span class="valor">{{ campo.valor }}</span>
        </div>
      </div>

      <h2 class="secao">Histórico · {{ historico.length }} {{ historico.length === 1 ? 'registro' : 'registros' }}</h2>

      <p v-if="historico.length === 0" class="vazio">Nenhum registro no histórico.</p>
      <LinhaDoTempo v-else :eventos="historico" />

      <div class="card-form">
        <h2 class="secao secao-form">Registrar movimentação</h2>

        <p v-if="baixado" class="aviso-baixa">Este ativo foi baixado e não aceita novas movimentações.</p>

        <template v-else>
          <label class="form-label">Tipo <span class="obrigatorio">*</span></label>
          <ion-select
            v-model="mov.tipo"
            interface="action-sheet"
            fill="outline"
            placeholder="Selecione"
            cancel-text="Cancelar"
            class="form-input"
          >
            <ion-select-option value="manutencao">Manutenção</ion-select-option>
            <ion-select-option value="transferencia">Transferência</ion-select-option>
            <ion-select-option value="devolucao">Devolvido ao usuário</ion-select-option>
            <ion-select-option value="baixa">Baixa</ion-select-option>
          </ion-select>

          <label class="form-label">Data <span class="obrigatorio">*</span></label>
          <ion-input v-model="mov.data" type="date" :max="hoje()" fill="outline" class="form-input" />

          <label class="form-label"> {{ rotuloResponsavel(mov.tipo) }} <span class="obrigatorio">*</span> </label>
          <ion-input v-model="mov.responsavel" fill="outline" placeholder="Nome completo" class="form-input" />

          <template v-if="mov.tipo === 'manutencao'">
            <label class="form-label">Serviço <span class="obrigatorio">*</span></label>
            <ion-input v-model="mov.servico" fill="outline" placeholder="Ex.: troca de bateria" class="form-input" />
          </template>

          <template v-if="mov.tipo === 'transferencia'">
            <label class="form-label">Nova localização <span class="obrigatorio">*</span></label>
            <!-- Opções vindas do cadastro de Localizações/Setores -->
            <ion-select
              v-model="mov.localizacao"
              fill="outline"
              interface="action-sheet"
              placeholder="Selecione"
              cancel-text="Cancelar"
              class="form-input"
            >
              <ion-select-option v-for="local in opcoesLocalizacao" :key="local" :value="local">
                {{ local }}
              </ion-select-option>
            </ion-select>
          </template>

          <template v-if="mov.tipo === 'baixa'">
            <label class="form-label">Motivo <span class="obrigatorio">*</span></label>
            <ion-input
              v-model="mov.motivo"
              fill="outline"
              placeholder="Ex.: equipamento sem conserto"
              class="form-input"
            />
          </template>

          <label class="form-label">Observações</label>
          <ion-textarea v-model="mov.observacoes" fill="outline" auto-grow placeholder="Opcional" class="form-input" />

          <p v-if="erro" class="erro">{{ erro }}</p>

          <ion-button
            expand="block"
            class="btn-registrar"
            :color="mov.tipo === 'baixa' ? 'danger' : 'primary'"
            :disabled="salvando"
            @click="registrar"
          >
            <ion-spinner v-if="salvando" slot="start" name="crescent" />
            {{ mov.tipo === 'baixa' ? 'Confirmar baixa' : 'Registrar' }}
          </ion-button>
        </template>
      </div>
    </template>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  alertController,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  onIonViewWillEnter,
  toastController,
} from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import LinhaDoTempo from '@/components/LinhaDoTempo.vue';
import { buscarAtivo, type Ativo, type StatusAtivo } from '@/services/ativos';
import { listarNomesLocalizacoes } from '@/services/localizacoes';
import { listarEventosDoAtivo, movimentar, type Evento } from '@/services/movimentacoes';
import { hoje, movimentacaoVazia, rotuloResponsavel, validarMovimentacao } from '@/utils/movimentacao';

const route = useRoute();

const ativo = ref<Ativo | null>(null);
const historico = ref<Evento[]>([]);
const opcoesLocalizacao = ref<string[]>([]);
const mov = ref(movimentacaoVazia());

const carregando = ref(true);
const salvando = ref(false);
const erroCarga = ref('');
const erro = ref('');

const campos = computed(() => [
  { rotulo: 'Modelo', valor: ativo.value?.modelo },
  { rotulo: 'Tipo', valor: ativo.value?.tipo },
  { rotulo: 'Número de série', valor: ativo.value?.numeroSerie },
  { rotulo: 'Patrimônio', valor: ativo.value?.patrimonio },
  { rotulo: 'Responsável', valor: ativo.value?.responsavel || '—' },
  { rotulo: 'Localização', valor: ativo.value?.localizacao },
]);

const baixado = computed(() => ativo.value?.status === 'Baixado');

async function carregar() {
  carregando.value = true;
  erroCarga.value = '';
  erro.value = '';
  mov.value = movimentacaoVazia();
  try {
    const patrimonio = typeof route.params.id === 'string' ? route.params.id : '';
    const encontrado = await buscarAtivo(patrimonio);
    if (!encontrado) {
      ativo.value = null;
      erroCarga.value = `Ativo ${patrimonio} não encontrado.`;
      return;
    }
    historico.value = await listarEventosDoAtivo(encontrado.patrimonio);
    opcoesLocalizacao.value = await listarNomesLocalizacoes();
    ativo.value = encontrado;
  } catch (e) {
    console.error(e);
    erroCarga.value = 'Não foi possível carregar o ativo.';
  } finally {
    carregando.value = false;
  }
}

// Recarrega ao entrar (inclusive ao voltar da edição).
onIonViewWillEnter(carregar);

function classeStatus(status: StatusAtivo) {
  return {
    'em-uso': status === 'Em uso',
    'em-manutencao': status === 'Manutenção',
    baixado: status === 'Baixado',
  };
}

async function registrar() {
  if (!ativo.value) return;
  erro.value = validarMovimentacao(mov.value);
  if (erro.value) return;

  // A baixa não pode ser desfeita, então pede confirmação.
  if (mov.value.tipo === 'baixa') {
    const alerta = await alertController.create({
      header: 'Confirmar baixa',
      message: `Dar baixa em ${ativo.value.patrimonio}? Depois disso ele não aceita novas movimentações.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Dar baixa', role: 'destructive' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    if (role !== 'destructive') return;
  }

  salvando.value = true;
  try {
    ativo.value = await movimentar(ativo.value.patrimonio, mov.value);
    historico.value = await listarEventosDoAtivo(ativo.value.patrimonio);
    mov.value = movimentacaoVazia();
    const toast = await toastController.create({
      message: 'Movimentação registrada.',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  } catch (e) {
    console.error(e);
    erro.value = e instanceof Error ? e.message : 'Não foi possível registrar a movimentação.';
  } finally {
    salvando.value = false;
  }
}
</script>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  transition:
    background-color 0.3s,
    color 0.3s;
}
.bolinha {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.em-uso {
  background: #e6f6ea;
  color: #1e7a3a;
}
.em-manutencao {
  background: #fff4e0;
  color: #a35f00;
}
.baixado {
  background: #fdecec;
  color: #b42318;
}

.btn-editar {
  --border-radius: 8px;
  --border-width: 1.5px;
  text-transform: none;
  font-size: 15px;
  margin: 0;
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
  margin: 0 0 28px;
  color: #6b7280;
}

.card-form {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 18px 16px;
}
.secao-form {
  margin-bottom: 18px;
}
.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.obrigatorio {
  color: #d32f2f;
}
.form-input {
  --border-radius: 8px;
  margin-bottom: 16px;
}
.erro {
  color: #b42318;
  font-size: 14px;
  margin: 0 0 12px;
}
.aviso-baixa {
  margin: 0;
  font-size: 15px;
  color: #b42318;
}
.btn-registrar {
  --border-radius: 8px;
  text-transform: none;
  margin-top: 4px;
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
</style>
