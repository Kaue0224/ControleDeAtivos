<template>
  <BaseLayout :titulo="modo === 'editar' ? 'Editar ativo' : 'Novo ativo'" mostrar-voltar :voltar-para="voltarPara">
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erroCarga" class="estado">
      <p class="erro">{{ erroCarga }}</p>
      <ion-button fill="outline" size="small" router-link="/ativos" router-direction="back">
        Voltar para a lista
      </ion-button>
    </div>

    <div v-else class="card-form">
      <h2 class="secao">{{ modo === 'editar' ? 'Dados do ativo' : 'Cadastrar ativo' }}</h2>

      <!-- Patrimônio: identificador, bloqueado na edição -->
      <label class="form-label" for="campo-patrimonio">Patrimônio <span class="obrigatorio">*</span></label>
      <ion-input
        id="campo-patrimonio"
        v-model="form.patrimonio"
        fill="outline"
        placeholder="Ex.: PAT-00200"
        autocapitalize="characters"
        :maxlength="30"
        :disabled="modo === 'editar'"
        class="form-input"
        :class="{ invalido: erros.patrimonio }"
      />
      <p v-if="modo === 'editar'" class="ajuda">O patrimônio não pode ser alterado depois do cadastro.</p>
      <p v-if="erros.patrimonio" class="erro-campo">{{ erros.patrimonio }}</p>

      <label class="form-label">Tipo <span class="obrigatorio">*</span></label>
      <ion-select
        v-model="form.tipo"
        fill="outline"
        interface="action-sheet"
        placeholder="Selecione"
        cancel-text="Cancelar"
        class="form-input"
        :class="{ invalido: erros.tipo }"
      >
        <ion-select-option v-for="tipo in opcoesTipo" :key="tipo" :value="tipo">{{ tipo }}</ion-select-option>
      </ion-select>
      <p v-if="erros.tipo" class="erro-campo">{{ erros.tipo }}</p>

      <label class="form-label" for="campo-modelo">Modelo <span class="obrigatorio">*</span></label>
      <ion-input
        id="campo-modelo"
        v-model="form.modelo"
        fill="outline"
        placeholder="Ex.: Dell Latitude 5440"
        :maxlength="80"
        class="form-input"
        :class="{ invalido: erros.modelo }"
      />
      <p v-if="erros.modelo" class="erro-campo">{{ erros.modelo }}</p>

      <label class="form-label" for="campo-serie">Número de série <span class="obrigatorio">*</span></label>
      <ion-input
        id="campo-serie"
        v-model="form.numeroSerie"
        fill="outline"
        placeholder="Ex.: DL5440-7HQ2K93"
        :maxlength="60"
        class="form-input"
        :class="{ invalido: erros.numeroSerie }"
      />
      <p v-if="erros.numeroSerie" class="erro-campo">{{ erros.numeroSerie }}</p>

      <label class="form-label">Status <span class="obrigatorio">*</span></label>
      <ion-select
        v-model="form.status"
        fill="outline"
        interface="action-sheet"
        placeholder="Selecione"
        cancel-text="Cancelar"
        class="form-input"
        :class="{ invalido: erros.status }"
      >
        <ion-select-option v-for="status in STATUS_ATIVO" :key="status" :value="status">{{ status }}</ion-select-option>
      </ion-select>
      <p v-if="erros.status" class="erro-campo">{{ erros.status }}</p>

      <label class="form-label" for="campo-responsavel">
        Responsável <span v-if="form.status === 'Em uso'" class="obrigatorio">*</span>
      </label>
      <ion-input
        id="campo-responsavel"
        v-model="form.responsavel"
        fill="outline"
        placeholder="Nome completo"
        :maxlength="80"
        class="form-input"
        :class="{ invalido: erros.responsavel }"
      />
      <p v-if="erros.responsavel" class="erro-campo">{{ erros.responsavel }}</p>

      <label class="form-label">Localização <span class="obrigatorio">*</span></label>
      <ion-select
        v-model="form.localizacao"
        fill="outline"
        interface="action-sheet"
        placeholder="Selecione"
        cancel-text="Cancelar"
        class="form-input"
        :class="{ invalido: erros.localizacao }"
      >
        <ion-select-option v-for="local in opcoesLocalizacao" :key="local" :value="local">{{
          local
        }}</ion-select-option>
      </ion-select>
      <p v-if="erros.localizacao" class="erro-campo">{{ erros.localizacao }}</p>

      <p v-if="erroGeral" class="erro">{{ erroGeral }}</p>

      <ion-button expand="block" class="btn-salvar" :disabled="salvando" @click="salvar">
        <ion-spinner v-if="salvando" slot="start" name="crescent" />
        {{ modo === 'editar' ? 'Salvar alterações' : 'Cadastrar ativo' }}
      </ion-button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  onIonViewWillEnter,
  toastController,
  useIonRouter,
} from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import { listarNomesCategorias } from '@/services/categorias';
import { listarNomesLocalizacoes } from '@/services/localizacoes';
import { registrarCadastro } from '@/services/movimentacoes';
import {
  atualizarAtivo,
  buscarAtivo,
  cadastrarAtivo,
  patrimonioExiste,
  STATUS_ATIVO,
  type Ativo,
} from '@/services/ativos';
import { formularioVazio, paraAtivo, validarAtivo, type ErrosAtivo } from '@/utils/validacaoAtivo';

const route = useRoute();
const ionRouter = useIonRouter();

// O Ionic mantém a página em memória, então o modo e o patrimônio são definidos
// a cada entrada na página (onIonViewWillEnter), e não lidos direto da rota.
const modo = ref<'novo' | 'editar'>('novo');
const patrimonioOriginal = ref('');
const ativoOriginal = shallowRef<Ativo | null>(null);

const form = ref(formularioVazio());
const erros = ref<ErrosAtivo>({});
const erroGeral = ref('');
const erroCarga = ref('');
const tentouSalvar = ref(false);
const carregando = ref(false);
const salvando = ref(false);

const voltarPara = computed(() =>
  modo.value === 'editar' ? `/ativos/${encodeURIComponent(patrimonioOriginal.value)}` : '/ativos',
);

// Opções vindas dos cadastros de Categorias e Localizações (Pedro), carregadas a cada entrada na página.
const categorias = ref<string[]>([]);
const localizacoes = ref<string[]>([]);

/** Garante que o valor atual do ativo apareça nas opções, mesmo que não esteja mais cadastrado. */
function comValorAtual(lista: string[], atual: string | undefined) {
  return atual && !lista.includes(atual) ? [...lista, atual] : lista;
}
const opcoesTipo = computed(() => comValorAtual(categorias.value, ativoOriginal.value?.tipo));
const opcoesLocalizacao = computed(() => comValorAtual(localizacoes.value, ativoOriginal.value?.localizacao));

// Depois da primeira tentativa de salvar, os erros somem conforme o usuário corrige.
watch(
  form,
  () => {
    if (!tentouSalvar.value) return;
    erros.value = validarAtivo(form.value);
    if (Object.keys(erros.value).length === 0) erroGeral.value = '';
  },
  { deep: true },
);

async function preparar() {
  const id = typeof route.params.id === 'string' ? route.params.id : '';
  modo.value = id ? 'editar' : 'novo';
  patrimonioOriginal.value = id;
  ativoOriginal.value = null;
  erros.value = {};
  erroGeral.value = '';
  erroCarga.value = '';
  tentouSalvar.value = false;
  form.value = formularioVazio();

  carregando.value = true;
  try {
    // Uma de cada vez: as duas usam a mesma conexão com o banco.
    categorias.value = await listarNomesCategorias();
    localizacoes.value = await listarNomesLocalizacoes();
    if (!id) return;

    const ativo = await buscarAtivo(id);
    if (!ativo) {
      erroCarga.value = `Ativo ${id} não encontrado.`;
      return;
    }
    ativoOriginal.value = { ...ativo };
    patrimonioOriginal.value = ativo.patrimonio;
    form.value = { ...ativo };
  } catch (e) {
    console.error(e);
    erroCarga.value = 'Não foi possível carregar o ativo.';
  } finally {
    carregando.value = false;
  }
}

onIonViewWillEnter(preparar);

async function salvar() {
  tentouSalvar.value = true;
  erroGeral.value = '';
  erros.value = validarAtivo(form.value);
  if (Object.keys(erros.value).length > 0) {
    erroGeral.value = 'Corrija os campos destacados.';
    return;
  }

  salvando.value = true;
  try {
    const dados = paraAtivo(form.value);

    if (modo.value === 'novo') {
      if (await patrimonioExiste(dados.patrimonio)) {
        erros.value = { patrimonio: 'Já existe um ativo com este patrimônio.' };
        erroGeral.value = 'Corrija os campos destacados.';
        return;
      }
      const novo = await cadastrarAtivo(dados);
      await registrarCadastro(novo);
      await avisar('Ativo cadastrado.');
      voltar('/ativos');
    } else {
      const atualizado = await atualizarAtivo(patrimonioOriginal.value, dados);
      await aoEditarAtivo(ativoOriginal.value!, atualizado);
      await avisar('Alterações salvas.');
      voltar(voltarPara.value);
    }
  } catch (e) {
    console.error(e);
    erroGeral.value = e instanceof Error ? e.message : 'Não foi possível salvar o ativo.';
  } finally {
    salvando.value = false;
  }
}

/**
 * PONTO DE LIGAÇÃO DO HISTÓRICO — decisão pendente do grupo.
 *
 * É chamada logo depois que uma edição é salva, com o ativo como estava antes e como ficou.
 * Se o grupo decidir que mudanças de status e de responsável feitas na edição geram evento
 * no histórico, implemente aqui, por exemplo:
 *
 *   if (anterior.status !== atualizado.status)           -> registrar evento de mudança de status
 *   if (anterior.responsavel !== atualizado.responsavel) -> registrar evento de mudança de responsável
 *
 * usando a função de registrar evento do service de histórico (Guilherme/Flavia).
 * Por enquanto não faz nada.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function aoEditarAtivo(anterior: Ativo, atualizado: Ativo): Promise<void> {}

async function avisar(mensagem: string) {
  const toast = await toastController.create({
    message: mensagem,
    duration: 2000,
    color: 'success',
    position: 'bottom',
  });
  await toast.present();
}

/** Volta para a página anterior; se o formulário foi aberto direto pela URL, vai para `destino`. */
function voltar(destino: string) {
  if (ionRouter.canGoBack()) ionRouter.back();
  else ionRouter.navigate(destino, 'back', 'replace');
}
</script>

<style scoped>
.card-form {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 18px 16px;
}
.secao {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
  margin: 0 0 18px;
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
.form-input.invalido {
  --border-color: #d92d20;
  --highlight-color-focused: #d92d20;
  margin-bottom: 4px;
}
.ajuda {
  margin: -10px 0 16px;
  font-size: 13px;
  color: #6b7280;
}
.erro-campo {
  margin: 0 0 16px;
  font-size: 13px;
  color: #b42318;
}
.erro {
  color: #b42318;
  font-size: 14px;
  margin: 0 0 12px;
}
.btn-salvar {
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
