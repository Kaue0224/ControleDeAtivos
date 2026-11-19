# Parte da Flavia

Feito em cima da versão do Pedro (que já tem as partes do Rafael, do José e do Pedro).

Tarefas:
- Detalhes do Ativo (já estava pronta, agora usa o banco)
- Histórico geral de movimentações (/historico)
- Dados compartilhados: tipos e movimentação

## Rodar

npm install
npm run dev

## O que fiz

Os tipos Evento, TipoEvento e TipoMovimentacao saíram do DetalheControle.vue e foram para
services/movimentacoes.ts. A regra de cada movimentação ficou em utils/movimentacao.ts.

O tipo Ativo ganhou o campo foto (fica vazio até o José fazer a parte da câmera).
Quem já tinha o banco antigo não perde nada, a coluna é criada sozinha.

Criei a tabela eventos e a função movimentar(), que atualiza o ativo e grava no histórico
ao mesmo tempo.

O Detalhe do Ativo agora abre o ativo certo pela URL, mostra o histórico salvo e grava as
movimentações. A baixa pede confirmação. Não deixa data no futuro.

A linha do tempo virou o componente LinhaDoTempo.vue, usado no Detalhe e no Histórico geral.

Histórico geral: todas as movimentações de todos os ativos, filtro por tipo e por período
(de/até). Clicando no patrimônio abre o ativo. O link fica na página Resumo.

Cadastrar um ativo novo já cria o evento "Cadastro do ativo".
O restaurar dados de exemplo também volta o histórico.

## Para o pessoal

- José: o campo foto já existe no Ativo, é só salvar a imagem nele.
- Kaue: dá para usar a data dos eventos de manutenção para calcular o tempo parado.
- Combinado 3 (registrar no histórico as mudanças feitas na edição) ainda não foi decidido,
  continua a função aoEditarAtivo vazia no FormAtivo.vue.
