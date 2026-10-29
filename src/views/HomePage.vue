<template>
  <BaseLayout titulo="Controle de Ativos">
    <p>
      Conteúdo da página aqui
      <ion-button mode="ios" router-link="/detalhes" router-direction="forward">Default</ion-button>
    </p>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '@/components/Toolbar-site.vue';
import { IonButton } from '@ionic/vue';
</script>
