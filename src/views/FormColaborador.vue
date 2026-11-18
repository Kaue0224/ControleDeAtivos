<template>
  <BaseLayout
    :titulo="modo === 'editar' ? 'Editar colaborador' : 'Novo colaborador'"
    mostrar-voltar
    :voltar-para="voltarPara"
  >
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erroCarga" class="estado">
      <p class="erro">{{ erroCarga }}</p>
      <ion-button fill="outline" size="small" router-link="/colaboradores" router-direction="back">
        Voltar para a lista
      </ion-button>
    </div>

    <div v-else class="card-form">
      <h2 class="secao">{{ modo === 'editar' ? 'Dados do colaborador' : 'Cadastrar colaborador' }}</h2>

      <label class="form-label" for="campo-nome">Nome completo <span class="obrigatorio">*</span></label>
      <ion-input
        id="campo-nome"
        v-model="form.nome"
        fill="outline"
        placeholder="Ex.: Ana Souza"
        autocapitalize="words"
        :maxlength="80"
        class="form-input"
        :class="{ invalido: erros.nome }"
      />
      <p v-if="erros.nome" class="erro-campo">{{ erros.nome }}</p>
      <p v-if="modo === 'editar'" class="ajuda">Se o nome mudar, os ativos deste colaborador também são atualizados.</p>

      <label class="form-label" for="campo-matricula">Matrícula <span class="obrigatorio">*</span></label>
      <ion-input
        id="campo-matricula"
        v-model="form.matricula"
        fill="outline"
        placeholder="Ex.: COL-0006"
        autocapitalize="characters"
        :maxlength="20"
        class="form-input"
        :class="{ invalido: erros.matricula }"
      />
      <p v-if="erros.matricula" class="erro-campo">{{ erros.matricula }}</p>

      <label class="form-label" for="campo-email">E-mail</label>
      <ion-input
        id="campo-email"
        v-model="form.email"
        type="email"
        inputmode="email"
        fill="outline"
        placeholder="Opcional"
        :maxlength="120"
        class="form-input"
        :class="{ invalido: erros.email }"
      />
      <p v-if="erros.email" class="erro-campo">{{ erros.email }}</p>

      <label class="form-label">Setor <span class="obrigatorio">*</span></label>
      <ion-select
        v-model="form.setor"
        fill="outline"
        interface="action-sheet"
        placeholder="Selecione"
        cancel-text="Cancelar"
        class="form-input"
        :class="{ invalido: erros.setor }"
      >
        <ion-select-option v-for="setor in opcoesSetor" :key="setor" :value="setor">{{ setor }}</ion-select-option>
      </ion-select>
      <p v-if="erros.setor" class="erro-campo">{{ erros.setor }}</p>

      <p v-if="erroGeral" class="erro">{{ erroGeral }}</p>

      <ion-button expand="block" class="btn-salvar" :disabled="salvando" @click="salvar">
        <ion-spinner v-if="salvando" slot="start" name="crescent" />
        {{ modo === 'editar' ? 'Salvar alterações' : 'Cadastrar colaborador' }}
      </ion-button>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
import { listarNomesLocalizacoes } from '@/services/localizacoes';
import {
  atualizarColaborador,
  buscarColaborador,
  cadastrarColaborador,
  matriculaExiste,
  nomeExiste,
} from '@/services/colaboradores';
import {
  formularioVazio,
  paraColaborador,
  validarColaborador,
  type ErrosColaborador,
} from '@/utils/validacaoColaborador';

const route = useRoute();
const ionRouter = useIonRouter();

// O Ionic mantém a página em memória, então o modo e o id são definidos a cada entrada na página.
const modo = ref<'novo' | 'editar'>('novo');
const id = ref(0);
const setorOriginal = ref('');

const form = ref(formularioVazio());
const erros = ref<ErrosColaborador>({});
const erroGeral = ref('');
const erroCarga = ref('');
const tentouSalvar = ref(false);
const carregando = ref(false);
const salvando = ref(false);

const voltarPara = computed(() => (modo.value === 'editar' ? `/colaboradores/${id.value}` : '/colaboradores'));

// Setores vêm do cadastro de Localizações/Setores (Pedro).
const setores = ref<string[]>([]);

// Mantém o setor atual nas opções, mesmo que ele não esteja mais cadastrado.
const opcoesSetor = computed(() =>
  setorOriginal.value && !setores.value.includes(setorOriginal.value)
    ? [...setores.value, setorOriginal.value]
    : setores.value,
);

// Depois da primeira tentativa de salvar, os erros somem conforme o usuário corrige.
watch(
  form,
  () => {
    if (!tentouSalvar.value) return;
    erros.value = validarColaborador(form.value);
    if (Object.keys(erros.value).length === 0) erroGeral.value = '';
  },
  { deep: true },
);

async function preparar() {
  const param = typeof route.params.id === 'string' ? route.params.id : '';
  modo.value = param ? 'editar' : 'novo';
  id.value = Number(param);
  setorOriginal.value = '';
  erros.value = {};
  erroGeral.value = '';
  erroCarga.value = '';
  tentouSalvar.value = false;
  form.value = formularioVazio();

  carregando.value = true;
  try {
    setores.value = await listarNomesLocalizacoes();
    if (!param) return;

    const colaborador = await buscarColaborador(id.value);
    if (!colaborador) {
      erroCarga.value = 'Colaborador não encontrado.';
      return;
    }
    setorOriginal.value = colaborador.setor;
    form.value = {
      nome: colaborador.nome,
      matricula: colaborador.matricula,
      email: colaborador.email,
      setor: colaborador.setor,
    };
  } catch (e) {
    console.error(e);
    erroCarga.value = 'Não foi possível carregar o colaborador.';
  } finally {
    carregando.value = false;
  }
}

onIonViewWillEnter(preparar);

async function salvar() {
  tentouSalvar.value = true;
  erroGeral.value = '';
  erros.value = validarColaborador(form.value);
  if (Object.keys(erros.value).length > 0) {
    erroGeral.value = 'Corrija os campos destacados.';
    return;
  }

  salvando.value = true;
  try {
    const dados = paraColaborador(form.value);
    const ignorarId = modo.value === 'editar' ? id.value : 0;

    const duplicados: ErrosColaborador = {};
    if (await nomeExiste(dados.nome, ignorarId)) duplicados.nome = 'Já existe um colaborador com este nome.';
    if (await matriculaExiste(dados.matricula, ignorarId)) {
      duplicados.matricula = 'Já existe um colaborador com esta matrícula.';
    }
    if (Object.keys(duplicados).length > 0) {
      erros.value = duplicados;
      erroGeral.value = 'Corrija os campos destacados.';
      return;
    }

    if (modo.value === 'novo') {
      await cadastrarColaborador(dados);
      await avisar('Colaborador cadastrado.');
      voltar('/colaboradores');
    } else {
      const ativosAtualizados = await atualizarColaborador(id.value, dados);
      await avisar(
        ativosAtualizados === 0
          ? 'Alterações salvas.'
          : `Alterações salvas. Nome atualizado em ${ativosAtualizados} ${ativosAtualizados === 1 ? 'ativo' : 'ativos'}.`,
      );
      voltar(voltarPara.value);
    }
  } catch (e) {
    console.error(e);
    erroGeral.value = e instanceof Error ? e.message : 'Não foi possível salvar o colaborador.';
  } finally {
    salvando.value = false;
  }
}

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
