<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="light" mode="ios">
        <ion-buttons slot="start" v-if="mostrarVoltar">
          <ion-back-button :default-href="voltarPara" text=""></ion-back-button>
        </ion-buttons>

        <ion-title class="titulo" :class="{ 'com-voltar': mostrarVoltar }">
          {{ titulo }}
        </ion-title>

        <div slot="end" class="direita">
          <ion-segment :value="aba" @ion-change="trocarAba">
            <ion-segment-button value="ativos">
              <ion-label>Ativos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="resumo">
              <ion-label>Resumo</ion-label>
            </ion-segment-button>
          </ion-segment>
          <ion-buttons>
            <ion-button router-link="/perfil" aria-label="Meu perfil">
              <ion-icon slot="icon-only" :icon="personCircleOutline" />
            </ion-button>
            <ion-button aria-label="Sair" @click="sairDaConta">
              <ion-icon slot="icon-only" :icon="logOutOutline" />
            </ion-button>
          </ion-buttons>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <slot></slot>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  useIonRouter,
  type SegmentChangeEventDetail,
} from '@ionic/vue';
import { logOutOutline, personCircleOutline } from 'ionicons/icons';
import { sair } from '@/services/usuarios';

withDefaults(
  defineProps<{
    titulo?: string;
    mostrarVoltar?: boolean;
    voltarPara?: string;
  }>(),
  {
    mostrarVoltar: false,
    voltarPara: '/ativos',
  },
);

// As abas levam às páginas /ativos e /resumo. A aba marcada acompanha a rota atual.
const route = useRoute();
const ionRouter = useIonRouter();
const aba = computed(() => (route.path.startsWith('/resumo') ? 'resumo' : 'ativos'));

function trocarAba(evento: CustomEvent<SegmentChangeEventDetail>) {
  const destino = evento.detail.value === 'resumo' ? '/resumo' : '/ativos';
  if (destino !== route.path) ionRouter.navigate(destino, 'root', 'replace');
}

async function sairDaConta() {
  await sair();
  ionRouter.navigate('/login', 'root', 'replace');
}
</script>

<style scoped>
.titulo {
  position: static;
  text-align: start;
  padding-inline: 16px;
  font-size: 12px;
}

.titulo.com-voltar {
  padding-inline-start: 4px;
}

.direita {
  display: flex;
  align-items: center;
  padding-inline-end: 8px;
}

.direita ion-segment {
  width: auto;
}
</style>
