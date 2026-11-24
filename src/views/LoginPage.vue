<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="centro">
        <div class="cabecalho">
          <h1 class="titulo">Controle de Ativos</h1>
          <p class="subtitulo">Entre para continuar</p>
        </div>

        <form class="card-form" novalidate @submit.prevent="entrarNoApp">
          <h2 class="secao">Login</h2>

          <label class="form-label" for="campo-login">Usuário</label>
          <ion-input
            id="campo-login"
            v-model="form.login"
            fill="outline"
            placeholder="Ex.: admin"
            autocapitalize="off"
            autocomplete="username"
            :maxlength="40"
            class="form-input"
            :class="{ invalido: erros.login }"
          />
          <p v-if="erros.login" class="erro-campo">{{ erros.login }}</p>

          <label class="form-label" for="campo-senha">Senha</label>
          <ion-input
            id="campo-senha"
            v-model="form.senha"
            type="password"
            fill="outline"
            :clear-on-edit="false"
            autocomplete="current-password"
            :maxlength="40"
            class="form-input"
            :class="{ invalido: erros.senha }"
          >
            <ion-input-password-toggle slot="end" />
          </ion-input>
          <p v-if="erros.senha" class="erro-campo">{{ erros.senha }}</p>

          <p v-if="erroGeral" class="erro">{{ erroGeral }}</p>

          <ion-button type="submit" expand="block" class="btn-entrar" :disabled="entrando">
            <ion-spinner v-if="entrando" slot="start" name="crescent" />
            Entrar
          </ion-button>

          <p class="ajuda">Usuário de teste: admin / 1234</p>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonSpinner,
  onIonViewWillEnter,
  useIonRouter,
} from '@ionic/vue';
import { entrar } from '@/services/usuarios';
import { validarLogin, type ErrosLogin, type FormularioLogin } from '@/utils/validacaoUsuario';

const ionRouter = useIonRouter();

const form = ref<FormularioLogin>({ login: '', senha: '' });
const erros = ref<ErrosLogin>({});
const erroGeral = ref('');
const tentouEntrar = ref(false);
const entrando = ref(false);

watch(
  form,
  () => {
    erroGeral.value = '';
    if (tentouEntrar.value) erros.value = validarLogin(form.value);
  },
  { deep: true },
);

onIonViewWillEnter(() => {
  form.value = { login: '', senha: '' };
  erros.value = {};
  erroGeral.value = '';
  tentouEntrar.value = false;
});

async function entrarNoApp() {
  tentouEntrar.value = true;
  erros.value = validarLogin(form.value);
  if (Object.keys(erros.value).length > 0) return;

  entrando.value = true;
  try {
    await entrar(form.value.login, form.value.senha);
    ionRouter.navigate('/ativos', 'root', 'replace');
  } catch (e) {
    erroGeral.value = e instanceof Error ? e.message : 'Não foi possível entrar.';
  } finally {
    entrando.value = false;
  }
}
</script>

<style scoped>
.centro {
  max-width: 400px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.cabecalho {
  text-align: center;
  margin-bottom: 20px;
}
.titulo {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}
.subtitulo {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
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
.btn-entrar {
  --border-radius: 8px;
  text-transform: none;
  margin-top: 4px;
}
.ajuda {
  margin: 12px 0 0;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}
</style>
