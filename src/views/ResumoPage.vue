<template>
  <!-- Página Resumo: por enquanto só com o botão de restaurar dados de exemplo (UC10). -->
  <BaseLayout titulo="Resumo" mostrar-voltar voltar-para="/ativos">
    <div class="card">
      <h2 class="secao">Atalhos</h2>
      <ion-list lines="full" class="lista">
        <ion-item router-link="/localizacoes" detail>
          <ion-label>Localizações / Setores</ion-label>
        </ion-item>
        <ion-item router-link="/categorias" detail>
          <ion-label>Categorias / Tipos de ativo</ion-label>
        </ion-item>
        <ion-item router-link="/historico" detail>
          <ion-label>Histórico de movimentações</ion-label>
        </ion-item>
        <ion-item router-link="/colaboradores" detail>
          <ion-label>Colaboradores</ion-label>
        </ion-item>
      </ion-list>
    </div>

    <div class="card">
      <h2 class="secao">Dados de exemplo</h2>
      <p class="texto">Apaga tudo o que foi cadastrado e volta para os 8 ativos de exemplo.</p>
      <BotaoRestaurarExemplo />
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonList } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import BotaoRestaurarExemplo from '@/components/BotaoRestaurarExemplo.vue';
</script>

<style scoped>
.card {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.secao {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
  margin: 0 0 12px;
}
.texto {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 14px;
}
.lista {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 0;
}
.lista ion-item:last-child {
  --border-width: 0;
}
</style>
