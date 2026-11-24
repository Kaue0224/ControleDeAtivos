<template>
  <BaseLayout titulo="Meu perfil" mostrar-voltar voltar-para="/ativos">
    <div v-if="carregando" class="estado">
      <ion-spinner name="crescent" />
    </div>

    <div v-else-if="erroCarga" class="estado">
      <p class="erro">{{ erroCarga }}</p>
    </div>

    <template v-else>
      <div class="card-form">
        <h2 class="secao">Dados do usuário</h2>

        <p class="form-label">Usuário</p>
        <p class="valor-fixo">{{ login }}</p>

        <label class="form-label" for="campo-nome">Nome <span class="obrigatorio">*</span></label>
        <ion-input
          id="campo-nome"
          v-model="form.nome"
          fill="outline"
          autocapitalize="words"
          :maxlength="80"
          class="form-input"
          :class="{ invalido: erros.nome }"
        />
        <p v-if="erros.nome" class="erro-campo">{{ erros.nome }}</p>

        <label class="form-label" for="campo-email">E-mail <span class="obrigatorio">*</span></label>
        <ion-input
          id="campo-email"
          v-model="form.email"
          type="email"
          inputmode="email"
          fill="outline"
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
          Salvar alterações
        </ion-button>
      </div>

      <div class="card-form">
        <h2 class="secao">Alterar senha</h2>

        <label class="form-label" for="campo-senha-atual">Senha atual <span class="obrigatorio">*</span></label>
        <ion-input
          id="campo-senha-atual"
          v-model="formSenha.atual"
          type="password"
          fill="outline"
          :clear-on-edit="false"
          autocomplete="current-password"
          :maxlength="40"
          class="form-input"
          :class="{ invalido: errosSenha.atual }"
        >
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <p v-if="errosSenha.atual" class="erro-campo">{{ errosSenha.atual }}</p>

        <label class="form-label" for="campo-senha-nova">Nova senha <span class="obrigatorio">*</span></label>
        <ion-input
          id="campo-senha-nova"
          v-model="formSenha.nova"
          type="password"
          fill="outline"
          :clear-on-edit="false"
          autocomplete="new-password"
          :maxlength="40"
          class="form-input"
          :class="{ invalido: errosSenha.nova }"
        >
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <p v-if="errosSenha.nova" class="erro-campo">{{ errosSenha.nova }}</p>

        <label class="form-label" for="campo-senha-confirmacao"
          >Confirmar nova senha <span class="obrigatorio">*</span></label
        >
        <ion-input
          id="campo-senha-confirmacao"
          v-model="formSenha.confirmacao"
          type="password"
          fill="outline"
          :clear-on-edit="false"
          autocomplete="new-password"
          :maxlength="40"
          class="form-input"
          :class="{ invalido: errosSenha.confirmacao }"
        >
          <ion-input-password-toggle slot="end" />
        </ion-input>
        <p v-if="errosSenha.confirmacao" class="erro-campo">{{ errosSenha.confirmacao }}</p>

        <p v-if="erroSenhaGeral" class="erro">{{ erroSenhaGeral }}</p>

        <ion-button expand="block" class="btn-salvar" :disabled="alterandoSenha" @click="trocarSenha">
          <ion-spinner v-if="alterandoSenha" slot="start" name="crescent" />
          Alterar senha
        </ion-button>
      </div>
    </template>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  onIonViewWillEnter,
  toastController,
} from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import { listarNomesLocalizacoes } from '@/services/localizacoes';
import { alterarSenha, salvarPerfil, usuarioLogado, type DadosPerfil } from '@/services/usuarios';
import {
  validarPerfil,
  validarTrocaSenha,
  type ErrosPerfil,
  type ErrosSenha,
  type FormularioSenha,
} from '@/utils/validacaoUsuario';

const login = ref('');
const setorOriginal = ref('');
const setores = ref<string[]>([]);

const form = ref<DadosPerfil>({ nome: '', email: '', setor: '' });
const erros = ref<ErrosPerfil>({});
const erroGeral = ref('');
const erroCarga = ref('');
const tentouSalvar = ref(false);
const carregando = ref(false);
const salvando = ref(false);

const senhaVazia = (): FormularioSenha => ({ atual: '', nova: '', confirmacao: '' });
const formSenha = ref<FormularioSenha>(senhaVazia());
const errosSenha = ref<ErrosSenha>({});
const erroSenhaGeral = ref('');
const tentouTrocarSenha = ref(false);
const alterandoSenha = ref(false);

const opcoesSetor = computed(() =>
  setorOriginal.value && !setores.value.includes(setorOriginal.value)
    ? [...setores.value, setorOriginal.value]
    : setores.value,
);

watch(
  form,
  () => {
    if (!tentouSalvar.value) return;
    erros.value = validarPerfil(form.value);
    if (Object.keys(erros.value).length === 0) erroGeral.value = '';
  },
  { deep: true },
);

watch(
  formSenha,
  () => {
    erroSenhaGeral.value = '';
    if (tentouTrocarSenha.value) errosSenha.value = validarTrocaSenha(formSenha.value);
  },
  { deep: true },
);

function limparSenha() {
  formSenha.value = senhaVazia();
  errosSenha.value = {};
  erroSenhaGeral.value = '';
  tentouTrocarSenha.value = false;
}

async function preparar() {
  limparSenha();
  erros.value = {};
  erroGeral.value = '';
  erroCarga.value = '';
  tentouSalvar.value = false;

  carregando.value = true;
  try {
    const usuario = await usuarioLogado();
    if (!usuario) {
      erroCarga.value = 'Nenhum usuário logado.';
      return;
    }
    setores.value = await listarNomesLocalizacoes();
    login.value = usuario.login;
    setorOriginal.value = usuario.setor;
    form.value = { nome: usuario.nome, email: usuario.email, setor: usuario.setor };
  } catch (e) {
    console.error(e);
    erroCarga.value = 'Não foi possível carregar o perfil.';
  } finally {
    carregando.value = false;
  }
}

onIonViewWillEnter(preparar);

async function salvar() {
  tentouSalvar.value = true;
  erroGeral.value = '';
  erros.value = validarPerfil(form.value);
  if (Object.keys(erros.value).length > 0) {
    erroGeral.value = 'Corrija os campos destacados.';
    return;
  }

  salvando.value = true;
  try {
    const usuario = await salvarPerfil(form.value);
    form.value = { nome: usuario.nome, email: usuario.email, setor: usuario.setor };
    setorOriginal.value = usuario.setor;
    tentouSalvar.value = false;
    const toast = await toastController.create({
      message: 'Perfil salvo.',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  } catch (e) {
    console.error(e);
    erroGeral.value = e instanceof Error ? e.message : 'Não foi possível salvar o perfil.';
  } finally {
    salvando.value = false;
  }
}

async function trocarSenha() {
  tentouTrocarSenha.value = true;
  errosSenha.value = validarTrocaSenha(formSenha.value);
  if (Object.keys(errosSenha.value).length > 0) return;

  alterandoSenha.value = true;
  try {
    await alterarSenha(formSenha.value);
    limparSenha();
    const toast = await toastController.create({
      message: 'Senha alterada.',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  } catch (e) {
    console.error(e);
    erroSenhaGeral.value = e instanceof Error ? e.message : 'Não foi possível alterar a senha.';
  } finally {
    alterandoSenha.value = false;
  }
}
</script>

<style scoped>
.card-form {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 18px 16px;
}
.card-form + .card-form {
  margin-top: 16px;
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
  margin: 0 0 6px;
}
.valor-fixo {
  margin: 0 0 16px;
  color: #5f6670;
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
</style>
