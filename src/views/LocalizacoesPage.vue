<template>
  <BaseLayout titulo="Localizações / Setores" mostrar-voltar voltar-para="/ativos">
    <ListaCadastroSimples ref="lista" :servico="servico" :textos="textos" />
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import ListaCadastroSimples from '@/components/ListaCadastroSimples.vue';
import type { ServicoCadastro, TextosCadastro } from '@/components/cadastroSimples';
import {
  cadastrarLocalizacao,
  excluirLocalizacao,
  listarLocalizacoesComUso,
  renomearLocalizacao,
} from '@/services/localizacoes';

const servico: ServicoCadastro = {
  listarComUso: listarLocalizacoesComUso,
  cadastrar: cadastrarLocalizacao,
  renomear: renomearLocalizacao,
  excluir: excluirLocalizacao,
};

const textos: TextosCadastro = {
  singular: 'localização',
  plural: 'localizações',
  descricao: 'Opções de localização do ativo, da transferência e de setor do colaborador.',
  placeholder: 'Ex.: Jurídico · 4º andar',
  mostrarColaboradores: true,
};

const lista = ref<InstanceType<typeof ListaCadastroSimples> | null>(null);

// Recarrega ao entrar para refletir mudanças feitas em outras páginas.
onIonViewWillEnter(() => lista.value?.carregar());
</script>
