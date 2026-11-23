<template>
  <ion-app>
    <!-- Menu lateral: abre pelo botão ☰ da barra ou arrastando da borda esquerda. Desligado no login. -->
    <ion-menu content-id="conteudo-principal" type="overlay" :disabled="paginaPublica">
      <ion-header>
        <ion-toolbar color="light" mode="ios">
          <ion-title class="titulo-menu">Controle de Ativos</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list v-for="secao in MENU" :key="secao.titulo" lines="none" class="secao">
          <ion-list-header>
            <ion-label class="secao-titulo">{{ secao.titulo }}</ion-label>
          </ion-list-header>

          <ion-menu-toggle v-for="item in secao.itens" :key="item.rota" :auto-hide="false">
            <ion-item
              button
              :disabled="!item.ativo"
              :router-link="item.ativo ? item.rota : undefined"
              router-direction="root"
              :detail="false"
              class="item-menu"
              :class="{ marcado: item.rota === marcada }"
            >
              <ion-icon slot="start" :icon="item.icone" />
              <ion-label>{{ item.titulo }}</ion-label>
              <ion-note v-if="!item.ativo" slot="end">em breve</ion-note>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="conteudo-principal" />
  </ion-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { MENU, rotaMarcada } from '@/data/menu';

const route = useRoute();
const paginaPublica = computed(() => route.meta.publica === true);
const marcada = computed(() => rotaMarcada(route.path));
</script>

<style scoped>
.titulo-menu {
  position: static;
  text-align: start;
  padding-inline: 16px;
  font-size: 15px;
  font-weight: 600;
}

.secao {
  padding: 8px 8px 0;
}
.secao-titulo {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
}

.item-menu {
  --border-radius: 8px;
  --padding-start: 12px;
  font-size: 15px;
  margin-bottom: 2px;
}
.item-menu ion-icon {
  color: #5f6670;
  margin-inline-end: 16px;
}
.item-menu.marcado {
  --background: #eef3ff;
  --color: var(--ion-color-primary);
  font-weight: 600;
}
.item-menu.marcado ion-icon {
  color: var(--ion-color-primary);
}
</style>
