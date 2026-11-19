<template>
  <ion-button
    fill="outline"
    color="medium"
    size="small"
    class="btn-restaurar"
    data-testid="btn-restaurar"
    :disabled="restaurando"
    @click="confirmar"
  >
    <ion-spinner v-if="restaurando" slot="start" name="crescent" />
    <ion-icon v-else slot="start" :icon="refreshOutline" />
    Restaurar dados de exemplo
  </ion-button>
</template>

<script setup lang="ts">
/**
 * UC10 — Botão "Restaurar dados de exemplo" (Pedro).
 * Fica na página Resumo (Kaue). Emite `restaurado` para a página recarregar os números.
 */
import { ref } from 'vue';
import { alertController, IonButton, IonIcon, IonSpinner, toastController } from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import { restaurarDadosExemplo } from '@/services/dadosExemplo';

const emit = defineEmits<{ restaurado: [] }>();

const restaurando = ref(false);

async function confirmar() {
  const alerta = await alertController.create({
    header: 'Restaurar dados de exemplo',
    message:
      'Todos os ativos, colaboradores, localizações, categorias e o histórico serão apagados e substituídos ' +
      'pelos dados de exemplo. Essa ação não pode ser desfeita.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Restaurar', role: 'destructive' },
    ],
  });
  await alerta.present();
  const { role } = await alerta.onDidDismiss();
  if (role === 'destructive') await restaurar();
}

async function restaurar() {
  restaurando.value = true;
  try {
    await restaurarDadosExemplo();
    await avisar('Dados de exemplo restaurados.', 'success');
    emit('restaurado');
  } catch (e) {
    console.error(e);
    await avisar('Não foi possível restaurar os dados de exemplo.', 'danger');
  } finally {
    restaurando.value = false;
  }
}

async function avisar(mensagem: string, cor: 'success' | 'danger') {
  const toast = await toastController.create({ message: mensagem, duration: 2000, color: cor, position: 'bottom' });
  await toast.present();
}
</script>

<style scoped>
.btn-restaurar {
  --border-radius: 8px;
  text-transform: none;
  margin: 0;
}
</style>
