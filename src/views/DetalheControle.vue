<template>
  <BaseLayout titulo="Detalhes do Ativo" mostrar-voltar>
    <div class="topo">
      <span class="status-chip" :class="classeStatus(ativo.status)">
        <span class="bolinha"></span>
        {{ ativo.status }}
      </span>
      <ion-button fill="outline" size="small" class="btn-editar">Editar</ion-button>
    </div>

    <div class="card-detalhes">
      <div class="campo" v-for="campo in campos" :key="campo.rotulo">
        <span class="rotulo">{{ campo.rotulo }}</span>
        <span class="valor">{{ campo.valor }}</span>
      </div>
    </div>

    <h2 class="secao">Histórico · {{ historico.length }} registros</h2>

    <ul class="timeline">
      <li v-for="(item, i) in historico" :key="i" class="evento">
        <span class="marcador" :class="item.tipo"></span>
        <div class="evento-conteudo">
          <div class="evento-meta">
            <span class="data">{{ formatarData(item.data) }}</span>
            <span class="tipo">{{ rotuloTipo[item.tipo] }}</span>
          </div>
          <strong class="evento-titulo">{{ item.titulo }}</strong>
          <span v-if="item.responsavel" class="evento-detalhe"> Responsável: {{ item.responsavel }} </span>
          <span v-if="item.detalhe" class="evento-detalhe">{{ item.detalhe }}</span>
        </div>
      </li>
    </ul>

    <div class="card-form">
      <h2 class="secao secao-form">Registrar movimentação</h2>

      <p v-if="baixado" class="aviso-baixa">Este ativo foi baixado e não aceita novas movimentações.</p>

      <template v-else>
        <label class="form-label">Tipo <span class="obrigatorio">*</span></label>
        <ion-select
          v-model="mov.tipo"
          interface="action-sheet"
          fill="outline"
          placeholder="Selecione"
          cancel-text="Cancelar"
          class="form-input"
        >
          <ion-select-option value="manutencao">Manutenção</ion-select-option>
          <ion-select-option value="transferencia">Transferência</ion-select-option>
          <ion-select-option value="devolucao">Devolvido ao usuário</ion-select-option>
          <ion-select-option value="baixa">Baixa</ion-select-option>
        </ion-select>

        <label class="form-label">Data <span class="obrigatorio">*</span></label>
        <ion-input v-model="mov.data" type="date" fill="outline" class="form-input" />

        <label class="form-label"> {{ rotuloResponsavel }} <span class="obrigatorio">*</span> </label>
        <ion-input v-model="mov.responsavel" fill="outline" placeholder="Nome completo" class="form-input" />

        <template v-if="mov.tipo === 'manutencao'">
          <label class="form-label">Serviço <span class="obrigatorio">*</span></label>
          <ion-input v-model="mov.servico" fill="outline" placeholder="Ex.: troca de bateria" class="form-input" />
        </template>

        <template v-if="mov.tipo === 'transferencia'">
          <label class="form-label">Nova localização <span class="obrigatorio">*</span></label>
          <ion-input v-model="mov.localizacao" fill="outline" placeholder="Ex.: RH · 1º andar" class="form-input" />
        </template>

        <template v-if="mov.tipo === 'baixa'">
          <label class="form-label">Motivo <span class="obrigatorio">*</span></label>
          <ion-input
            v-model="mov.motivo"
            fill="outline"
            placeholder="Ex.: equipamento sem conserto"
            class="form-input"
          />
        </template>

        <label class="form-label">Observações</label>
        <ion-textarea v-model="mov.observacoes" fill="outline" auto-grow placeholder="Opcional" class="form-input" />

        <p v-if="erro" class="erro">{{ erro }}</p>

        <ion-button
          expand="block"
          class="btn-registrar"
          :color="mov.tipo === 'baixa' ? 'danger' : 'primary'"
          @click="registrar"
        >
          {{ mov.tipo === 'baixa' ? 'Confirmar baixa' : 'Registrar' }}
        </ion-button>
      </template>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonButton, IonInput, IonTextarea, IonSelect, IonSelectOption } from '@ionic/vue';
import BaseLayout from '@/components/Toolbar-site.vue';

type StatusAtivo = 'Em uso' | 'Manutenção' | 'Baixado';
type TipoEvento = 'cadastro' | 'transferencia' | 'manutencao' | 'devolucao' | 'baixa';
type TipoMovimentacao = 'manutencao' | 'transferencia' | 'devolucao' | 'baixa';

interface Evento {
  data: string;
  tipo: TipoEvento;
  titulo: string;
  responsavel?: string;
  detalhe?: string;
}

const ativo = ref({
  tipo: 'Notebook',
  numeroSerie: 'DL5440-7HQ2K93',
  patrimonio: 'PAT-00112',
  responsavel: 'Mariana Lopes',
  localizacao: 'Financeiro · 2º andar',
  status: 'Em uso' as StatusAtivo,
});

const campos = computed(() => [
  { rotulo: 'Tipo', valor: ativo.value.tipo },
  { rotulo: 'Número de série', valor: ativo.value.numeroSerie },
  { rotulo: 'Patrimônio', valor: ativo.value.patrimonio },
  { rotulo: 'Responsável', valor: ativo.value.responsavel },
  { rotulo: 'Localização', valor: ativo.value.localizacao },
  { rotulo: 'Status', valor: ativo.value.status },
]);

const historico = ref<Evento[]>([
  {
    data: '2026-02-10',
    tipo: 'transferencia',
    titulo: 'Responsável: — → Mariana Lopes',
    detalhe: 'Local: Almoxarifado → Financeiro · 2º andar',
  },
  {
    data: '2026-02-03',
    tipo: 'cadastro',
    titulo: 'Cadastro do ativo',
    detalhe: 'Status inicial: Em uso',
  },
]);

const rotuloTipo: Record<TipoEvento, string> = {
  cadastro: 'Cadastro',
  transferencia: 'Transferência',
  manutencao: 'Manutenção',
  devolucao: 'Devolução',
  baixa: 'Baixa',
};

const statusPorTipo: Record<TipoMovimentacao, StatusAtivo> = {
  manutencao: 'Manutenção',
  transferencia: 'Em uso',
  devolucao: 'Em uso',
  baixa: 'Baixado',
};

const hoje = () => new Date().toISOString().slice(0, 10);

const movVazia = () => ({
  tipo: '' as TipoMovimentacao | '',
  data: hoje(),
  responsavel: '',
  servico: '',
  localizacao: '',
  motivo: '',
  observacoes: '',
});

const mov = ref(movVazia());
const erro = ref('');

const baixado = computed(() => ativo.value.status === 'Baixado');

const rotuloResponsavel = computed(() => {
  switch (mov.value.tipo) {
    case 'manutencao':
      return 'Técnico responsável';
    case 'transferencia':
      return 'Novo responsável';
    case 'devolucao':
      return 'Usuário que recebeu';
    case 'baixa':
      return 'Responsável pela baixa';
    default:
      return 'Responsável';
  }
});

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function classeStatus(status: StatusAtivo) {
  return {
    'em-uso': status === 'Em uso',
    'em-manutencao': status === 'Manutenção',
    baixado: status === 'Baixado',
  };
}

function validar(): string {
  const m = mov.value;
  if (!m.tipo) return 'Selecione o tipo da movimentação.';
  if (!m.data) return 'Informe a data.';
  if (!m.responsavel.trim()) return `Informe o campo "${rotuloResponsavel.value}".`;
  if (m.tipo === 'manutencao' && !m.servico.trim()) return 'Informe o serviço.';
  if (m.tipo === 'transferencia' && !m.localizacao.trim()) return 'Informe a nova localização.';
  if (m.tipo === 'baixa' && !m.motivo.trim()) return 'Informe o motivo da baixa.';
  return '';
}

function registrar() {
  erro.value = validar();
  if (erro.value) return;

  const m = mov.value;
  const a = ativo.value;
  const tipo = m.tipo as TipoMovimentacao;
  const responsavel = m.responsavel.trim();
  const statusAnterior = a.status;
  const novoStatus = statusPorTipo[tipo];
  const detalhes: string[] = [];
  let evento: Evento;

  switch (tipo) {
    case 'manutencao':
      evento = { data: m.data, tipo, titulo: m.servico.trim(), responsavel };
      break;

    case 'transferencia': {
      const respAnterior = a.responsavel || '—';
      const localAnterior = a.localizacao || '—';
      a.responsavel = responsavel;
      a.localizacao = m.localizacao.trim();
      evento = { data: m.data, tipo, titulo: `Responsável: ${respAnterior} → ${responsavel}` };
      detalhes.push(`Local: ${localAnterior} → ${a.localizacao}`);
      break;
    }

    case 'devolucao':
      a.responsavel = responsavel;
      evento = { data: m.data, tipo, titulo: `Devolvido a ${responsavel}` };
      break;

    case 'baixa':
      evento = { data: m.data, tipo, titulo: 'Baixa do ativo', responsavel };
      detalhes.push(`Motivo: ${m.motivo.trim()}`);
      break;
  }

  if (novoStatus !== statusAnterior) {
    detalhes.push(`Status: ${statusAnterior} → ${novoStatus}`);
    a.status = novoStatus;
  }

  const obs = m.observacoes.trim();
  if (obs) detalhes.push(obs);

  if (detalhes.length) evento!.detalhe = detalhes.join(' · ');

  historico.value.unshift(evento!);
  mov.value = movVazia();
}
</script>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  transition:
    background-color 0.3s,
    color 0.3s;
}
.bolinha {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.em-uso {
  background: #e6f6ea;
  color: #1e7a3a;
}
.em-manutencao {
  background: #fff4e0;
  color: #a35f00;
}
.baixado {
  background: #fdecec;
  color: #b42318;
}

.btn-editar {
  --border-radius: 8px;
  --border-width: 1.5px;
  text-transform: none;
  font-size: 15px;
  margin: 0;
}

.card-detalhes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 28px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-bottom: 1px solid #e3e5e8;
}
.campo:nth-last-child(-n + 2) {
  border-bottom: none;
}
.rotulo {
  font-size: 13px;
  color: #6b7280;
}
.valor {
  font-size: 16px;
  color: #1f2328;
  word-break: break-word;
}

.secao {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5f6670;
  margin: 0 0 16px;
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
}
.evento {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
}
.evento:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: #e3e5e8;
}
.marcador {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #d0d4d9;
}
.marcador.transferencia {
  background: #6d3ff0;
}
.marcador.cadastro {
  background: #5f6670;
}
.marcador.manutencao {
  background: #e08a00;
}
.marcador.devolucao {
  background: #1e9e4a;
}
.marcador.baixa {
  background: #d92d20;
}

.evento-conteudo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.evento-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
}
.data {
  color: #6b7280;
}
.tipo {
  color: #5f6670;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.evento-titulo {
  font-size: 15px;
  color: #1f2328;
}
.evento-detalhe {
  font-size: 14px;
  color: #6b7280;
}

.card-form {
  border: 1px solid #e3e5e8;
  border-radius: 12px;
  padding: 18px 16px;
}
.secao-form {
  margin-bottom: 18px;
}
.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.obrigatorio {
  color: #d32f2f;
}
.form-input {
  --border-radius: 8px;
  margin-bottom: 16px;
}
.erro {
  color: #b42318;
  font-size: 14px;
  margin: 0 0 12px;
}
.aviso-baixa {
  margin: 0;
  font-size: 15px;
  color: #b42318;
}
.btn-registrar {
  --border-radius: 8px;
  text-transform: none;
  margin-top: 4px;
}
</style>
