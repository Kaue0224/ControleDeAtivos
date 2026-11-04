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
          <ion-segment v-model="aba">
            <ion-segment-button value="ativos">
              <ion-label>Ativos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="resumo">
              <ion-label>Resumo</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <slot></slot>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
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
} from '@ionic/vue';

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

const aba = ref('ativos');
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
