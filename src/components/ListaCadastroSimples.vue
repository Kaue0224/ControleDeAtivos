<template>
  <div>
    <div class="topo">
      <p class="contador" data-testid="contador">
        {{ visiveis.length }} de {{ itens.length }} {{ itens.length === 1 ? textos.singular : textos.plural }}
      </p>
      <ion-button size="small" class="btn-novo" data-testid="btn-novo" @click="abrirFormulario()">
        <ion-icon slot="start" :icon="add" />
        Novo
      </ion-button>
    </div>

    <p class="descricao">{{ textos.descricao }}</p>

    <ion-searchbar v-model="busca" mode="ios" :debounce="200" placeholder="Buscar pelo nome…" class="busca" />

    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erro" class="estado">
      <p class="erro">{{ erro }}</p>
      <ion-button fill="outline" size="small" @click="carregar">Tentar novamente</ion-button>
    </div>

    <div v-else-if="visiveis.length === 0" class="estado">
      <template v-if="itens.length === 0">
        <p>Nada cadastrado ainda.</p>
        <ion-button size="small" @click="abrirFormulario()">Cadastrar o primeiro</ion-button>
      </template>
      <template v-else>
        <p>Nada encontrado com essa busca.</p>
        <ion-button fill="outline" size="small" @click="busca = ''">Limpar busca</ion-button>
      </template>
    </div>

    <ion-list v-else lines="full" class="lista">
      <ion-item v-for="item in visiveis" :key="item.id" data-testid="item">
        <ion-label>
          <h2 class="nome">{{ item.nome }}</h2>
          <p>{{ resumoUso(item) }}</p>
        </ion-label>
        <ion-button
          slot="end"
          fill="clear"
          size="small"
          :aria-label="`Editar ${item.nome}`"
          :disabled="ocupado"
          @click="abrirFormulario(item)"
        >
          <ion-icon slot="icon-only" :icon="createOutline" />
        </ion-button>
        <ion-button
          slot="end"
          fill="clear"
          size="small"
          color="danger"
          :aria-label="`Excluir ${item.nome}`"
          :title="motivoBloqueioExclusao(item) || 'Excluir'"
          :disabled="ocupado || !!motivoBloqueioExclusao(item)"
          @click="confirmarExclusao(item)"
        >
          <ion-icon slot="icon-only" :icon="trashOutline" />
        </ion-button>
      </ion-item>
    </ion-list>

    <p v-if="itens.some((i) => motivoBloqueioExclusao(i))" class="ajuda">
      Itens em uso não podem ser excluídos. Renomear um item atualiza os registros que o usam.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  alertController,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import { add, createOutline, trashOutline } from 'ionicons/icons';
import { motivoBloqueioExclusao, type ItemComUso } from '@/services/cadastroSimples';
import { chaveNome, NOME_MAX, validarNome } from '@/utils/validacaoCadastroSimples';
import type { ServicoCadastro, TextosCadastro } from './cadastroSimples';

const props = defineProps<{ servico: ServicoCadastro; textos: TextosCadastro }>();

const itens = ref<ItemComUso[]>([]);
const busca = ref('');
const carregando = ref(true);
const ocupado = ref(false);
const erro = ref('');

const visiveis = computed(() => {
  const termo = chaveNome(busca.value);
  return termo ? itens.value.filter((i) => chaveNome(i.nome).includes(termo)) : itens.value;
});

function resumoUso(item: ItemComUso) {
  const ativos = `${item.totalAtivos} ${item.totalAtivos === 1 ? 'ativo' : 'ativos'}`;
  if (!props.textos.mostrarColaboradores) return ativos;
  return `${ativos} · ${item.totalColaboradores} ${item.totalColaboradores === 1 ? 'colaborador' : 'colaboradores'}`;
}

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    itens.value = await props.servico.listarComUso();
  } catch (e) {
    console.error(e);
    erro.value = 'Não foi possível carregar a lista.';
  } finally {
    carregando.value = false;
  }
}

/** Abre o formulário (alerta com um campo). Sem `item` = novo cadastro; com `item` = edição. */
async function abrirFormulario(item?: ItemComUso) {
  const editando = !!item;
  const alerta = await alertController.create({
    header: editando ? `Editar ${props.textos.singular}` : `Nova ${props.textos.singular}`,
    message:
      editando && (item.totalAtivos || item.totalColaboradores)
        ? 'Os registros que usam este nome também serão atualizados.'
        : undefined,
    inputs: [
      {
        name: 'nome',
        type: 'text',
        value: item?.nome ?? '',
        placeholder: props.textos.placeholder,
        attributes: { maxlength: NOME_MAX, 'data-testid': 'campo-nome' },
      },
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: editando ? 'Salvar' : 'Cadastrar',
        role: 'confirm',
        // A validação é feita aqui para o alerta continuar aberto se o nome for inválido.
        handler: (dados: { nome: string }) => {
          const mensagem = validarNome(dados.nome, itens.value, item?.id ?? 0);
          if (mensagem) {
            alerta.message = mensagem;
            alerta.classList.add('alerta-erro');
            return false;
          }
          return true;
        },
      },
    ],
  });
  await alerta.present();

  const { role, data } = await alerta.onDidDismiss<{ values: { nome: string } }>();
  if (role !== 'confirm' || !data) return;
  await salvar(data.values.nome, item);
}

async function salvar(nome: string, item?: ItemComUso) {
  ocupado.value = true;
  try {
    if (item) {
      const afetados = await props.servico.renomear(item.id, nome);
      await avisar(
        afetados === 0
          ? 'Alterações salvas.'
          : `Alterações salvas. Nome atualizado em ${afetados} ${afetados === 1 ? 'registro' : 'registros'}.`,
        'success',
      );
    } else {
      await props.servico.cadastrar(nome);
      await avisar('Cadastro salvo.', 'success');
    }
  } catch (e) {
    console.error(e);
    await avisar(e instanceof Error ? e.message : 'Não foi possível salvar.', 'danger');
  } finally {
    ocupado.value = false;
    await carregar();
  }
}

async function confirmarExclusao(item: ItemComUso) {
  const alerta = await alertController.create({
    header: `Excluir ${props.textos.singular}`,
    message: `Excluir "${item.nome}"? Essa ação não pode ser desfeita.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Excluir', role: 'destructive' },
    ],
  });
  await alerta.present();
  const { role } = await alerta.onDidDismiss();
  if (role !== 'destructive') return;

  ocupado.value = true;
  try {
    await props.servico.excluir(item.id);
    await avisar('Cadastro excluído.', 'success');
  } catch (e) {
    console.error(e);
    await avisar(e instanceof Error ? e.message : 'Não foi possível excluir.', 'danger');
  } finally {
    ocupado.value = false;
    await carregar();
  }
}

async function avisar(mensagem: string, cor: 'success' | 'danger') {
  const toast = await toastController.create({ message: mensagem, duration: 2000, color: cor, position: 'bottom' });
  await toast.present();
}

// A página chama carregar() no onIonViewWillEnter (os hooks do Ionic só funcionam na página).
defineExpose({ carregar });
</script>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
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
.descricao {
  margin: 4px 0 4px;
  font-size: 14px;
  color: #6b7280;
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
.ajuda {
  margin: 12px 0 0;
  font-size: 13px;
  color: #6b7280;
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

<style>
/* O alerta é criado fora do componente, então este estilo não pode ser "scoped". */
ion-alert.alerta-erro .alert-message {
  color: #b42318;
}
</style>
