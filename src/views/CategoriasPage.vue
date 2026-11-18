<template>
  <BaseLayout titulo="Categorias / Tipos de ativo" mostrar-voltar voltar-para="/ativos">
    <ListaCadastroSimples ref="lista" :servico="servico" :textos="textos" />
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';
import ListaCadastroSimples from '@/components/ListaCadastroSimples.vue';
import type { ServicoCadastro, TextosCadastro } from '@/components/cadastroSimples';
import { cadastrarCategoria, excluirCategoria, listarCategoriasComUso, renomearCategoria } from '@/services/categorias';

const servico: ServicoCadastro = {
  listarComUso: listarCategoriasComUso,
  cadastrar: cadastrarCategoria,
  renomear: renomearCategoria,
  excluir: excluirCategoria,
};

const textos: TextosCadastro = {
  singular: 'categoria',
  plural: 'categorias',
  descricao: 'Opções do campo "Tipo" no cadastro de ativo.',
  placeholder: 'Ex.: Projetor',
};

const lista = ref<InstanceType<typeof ListaCadastroSimples> | null>(null);

// Recarrega ao entrar para refletir mudanças feitas em outras páginas.
onIonViewWillEnter(() => lista.value?.carregar());
</script>
