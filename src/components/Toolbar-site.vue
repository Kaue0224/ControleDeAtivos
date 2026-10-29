<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="light" mode="ios">
        <ion-title class="titulo">{{ titulo }}</ion-title>

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
} from '@ionic/vue';

defineProps<{ titulo?: string }>();

const aba = ref('ativos');
</script>

<style scoped>
.titulo {
  position: static;
  text-align: start;
  padding-inline: 16px;
  font-size: 12px;
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
