# Controle de Ativos

Aplicativo para cadastrar e acompanhar os ativos de uma empresa (notebooks, monitores, celulares…).
Com ele é possível ver quem está com cada equipamento, onde ele está, o status (Em uso, Em manutenção,
Baixado) e o histórico de movimentações.

Projeto acadêmico feito em grupo com **Ionic + Vue 3 + Capacitor**.

**Integrantes:** Rafael, Guilherme, Kaue, José, Pedro e Flavia.

---

## Sumário

1. [O framework: Ionic](#1-o-framework-ionic)
2. [Tecnologias usadas](#2-tecnologias-usadas)
3. [Passo a passo para instalar e rodar](#3-passo-a-passo-para-instalar-e-rodar)
4. [Rodar no celular Android (opcional)](#4-rodar-no-celular-android-opcional)
5. [Comandos disponíveis](#5-comandos-disponíveis)
6. [Estrutura do projeto](#6-estrutura-do-projeto)
7. [Telas do app](#7-telas-do-app)
8. [Problemas comuns](#8-problemas-comuns)

---

## 1. O framework: Ionic

### O que é

O [Ionic](https://ionicframework.com/) é um framework de código aberto para criar **aplicativos móveis
e web com um único código**, usando tecnologias da web: HTML, CSS e JavaScript/TypeScript.

Ele oferece uma biblioteca de **componentes de interface prontos**, com aparência de aplicativo nativo:
botões, listas, campos, menus, avisos. Os componentes se adaptam sozinhos ao visual do Android
(Material Design) e do iOS.

O Ionic não está preso a um framework. Ele funciona com **Angular, React ou Vue**. Neste projeto
usamos o **Vue 3**.

### Como as peças se encaixam

```
┌─────────────────────────────────────────────┐
│  Vue 3          → lógica e reatividade das telas
│  Ionic          → componentes visuais (ion-*) e navegação
│  Capacitor      → empacota o app e acessa recursos do celular
└─────────────────────────────────────────────┘
          ↓ mesmo código
   Navegador (web)   ·   Android   ·   iOS
```

- **Vue 3**: cuida dos dados e da reatividade. Por exemplo, a lista atualiza sozinha quando o filtro muda.
- **Ionic**: entrega os componentes `ion-*` e a navegação com animações entre páginas.
- **Capacitor**: transforma o app web em app instalável e dá acesso a recursos nativos, como o banco
  SQLite e o armazenamento de preferências.

### Principais conceitos do Ionic usados no projeto

**Componentes `ion-*`.** São tags prontas que usamos no lugar do HTML comum:

| Componente | Uso no app |
|---|---|
| `ion-page`, `ion-header`, `ion-toolbar`, `ion-content` | Estrutura de cada tela (barra superior + conteúdo) |
| `ion-list`, `ion-item`, `ion-label` | Lista de ativos e de colaboradores |
| `ion-searchbar` | Busca na lista de ativos |
| `ion-select`, `ion-select-option` | Filtros e campos de escolha (tipo, status, localização) |
| `ion-input` | Campos dos formulários |
| `ion-button`, `ion-icon` | Botões com ícones ([Ionicons](https://ionic.io/ionicons)) |
| `ion-chip` | Etiqueta colorida do status do ativo |
| `ion-spinner` | Indicador de carregamento |
| `ion-menu`, `ion-menu-button`, `ion-menu-toggle` | Menu lateral (botão ☰) |
| `ion-back-button` | Seta de voltar |
| `ion-segment` | Abas "Ativos / Resumo" na barra superior |

Exemplo real, a busca da Lista de Ativos:

```vue
<ion-searchbar
  v-model="filtros.busca"
  :debounce="200"
  placeholder="Modelo, série, patrimônio, responsável…"
/>
```

**Navegação (`@ionic/vue-router`).** O Ionic tem um roteador próprio, construído sobre o Vue Router.
Ele mantém as páginas já visitadas **em cache** e anima a troca de tela, como em um app nativo.

```ts
import { createRouter, createWebHistory } from '@ionic/vue-router';
```

As páginas aparecem dentro do `<ion-router-outlet>`, no `App.vue`.

**Ciclo de vida das páginas.** Como as páginas ficam em cache, o `onMounted` do Vue roda só uma vez.
Por isso usamos os eventos do Ionic, que rodam **toda vez que a tela aparece**:

```ts
onIonViewWillEnter(() => {
  carregar(); // recarrega os dados ao voltar para a tela
});
```

**Controladores e utilitários:**
- `useIonRouter()`: navegar e voltar pelo código (por exemplo, voltar à lista depois de salvar).
- `toastController`: mostrar avisos rápidos na tela, como "Ativo cadastrado".

---

## 2. Tecnologias usadas

| Tecnologia | Versão | Para quê |
|---|---|---|
| [Ionic Vue](https://ionicframework.com/docs/vue/overview) | 9 | Componentes visuais e navegação |
| [Vue](https://vuejs.org/) | 3 | Framework das telas (`<script setup>` + TypeScript) |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Tipagem do código |
| [Vite](https://vite.dev/) | 8 | Servidor de desenvolvimento e build |
| [Capacitor](https://capacitorjs.com/) | 8 | Empacotar para Android/iOS e acessar recursos nativos |
| [@capacitor-community/sqlite](https://github.com/capacitor-community/sqlite) | 8.1.1 | Banco de dados SQLite (ativos, histórico, cadastros) |
| jeep-sqlite + sql.js | 2.8.0 / 1.11.0 | SQLite no navegador (os dados ficam no IndexedDB) |
| @capacitor/preferences | 8 | Guardar a sessão do usuário logado |
| [Vitest](https://vitest.dev/) / [Playwright](https://playwright.dev/) | 5 / 1.64 | Testes unitários / testes de ponta a ponta |

### Onde ficam os dados

- **No navegador:** o SQLite roda via WebAssembly (sql.js) e é salvo no **IndexedDB** do navegador,
  no banco `jeepSqliteStore`.
- **No celular:** fica num arquivo SQLite nativo (`controle_ativosSQLite.db`).
- **Na primeira execução** o banco é criado e preenchido com **dados de exemplo**.

---

## 3. Passo a passo para instalar e rodar

### Pré-requisitos

| Programa | Versão | Como conferir |
|---|---|---|
| [Node.js](https://nodejs.org/) | **22.18 ou mais nova** (LTS) | `node -v` |
| npm | vem junto com o Node | `npm -v` |
| [Git](https://git-scm.com/) | qualquer versão recente | `git --version` |

> Não é necessário instalar o Ionic CLI globalmente. O projeto roda com os comandos do `npm`.

### Passo 1: Baixar o projeto

```bash
git clone https://github.com/Kaue0224/ControleDeAtivos.git
cd ControleDeAtivos
```

### Passo 2: Instalar as dependências

```bash
npm install
```

Esse comando baixa todas as bibliotecas para a pasta `node_modules`. Ao terminar, ele copia sozinho
o arquivo `sql-wasm.wasm` (o motor do SQLite no navegador) para `public/assets`. Esse passo é o
script `postinstall`.

### Passo 3: Iniciar o app

```bash
npm run dev
```

O terminal mostra um endereço parecido com este:

```
  ➜  Local:   http://localhost:5173/
```

### Passo 4: Abrir no navegador

1. Abra **http://localhost:5173** no Chrome ou no Edge.
2. Entre com um dos usuários de exemplo:

   | Usuário | Senha |
   |---|---|
   | `admin` | `123` |
   | `operador` | `123` |

3. Você cai na **Lista de Ativos**. Use o botão **☰** para abrir o menu com todas as telas.

> **Dica:** para ver como fica no celular, aperte `F12` no navegador e ative o modo dispositivo
> (`Ctrl + Shift + M`).

### Passo 5 (opcional): Gerar a versão final

```bash
npm run build     # gera a pasta dist/
npm run preview   # serve a versão gerada para conferir
```

---

## 4. Rodar no celular Android (opcional)

É preciso ter o [Android Studio](https://developer.android.com/studio) instalado.

```bash
npm install @capacitor/android@8   # adiciona a plataforma Android
npm run build                      # gera a versão web em dist/
npx cap add android                # cria a pasta android/ (só na primeira vez)
npx cap sync android               # copia o app para o projeto Android
npx cap open android               # abre no Android Studio
```

No Android Studio, conecte um celular (com depuração USB ativada) ou crie um emulador e clique em
**Run ▶**.

Sempre que alterar o código, rode de novo `npm run build` e `npx cap sync android`.

---

## 5. Comandos disponíveis

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências e copia o `sql-wasm.wasm` |
| `npm run dev` | Inicia o servidor de desenvolvimento (recarrega sozinho ao salvar) |
| `npm run build` | Confere os tipos (`vue-tsc`) e gera a versão final em `dist/` |
| `npm run preview` | Serve a pasta `dist/` |
| `npm run test:unit` | Roda os testes unitários (Vitest) |
| `npm run test:e2e` | Roda os testes de ponta a ponta (Playwright) |
| `npm run lint` | Verifica o padrão do código (ESLint + Prettier) |

---

## 6. Estrutura do projeto

```
ControleDeAtivos/
├── public/              # arquivos estáticos (o sql-wasm.wasm é copiado para cá)
├── src/
│   ├── App.vue          # raiz do app: menu lateral + <ion-router-outlet>
│   ├── main.ts          # inicia o Vue, o Ionic e o roteador
│   ├── router/          # rotas e proteção de login
│   ├── views/           # páginas (telas) do app
│   ├── components/      # componentes reaproveitados (barra superior, linha do tempo…)
│   ├── services/        # acesso ao banco: db.ts (SQLite), ativos.ts, usuarios.ts…
│   ├── utils/           # regras puras: filtros, validações, movimentações (testadas)
│   ├── data/            # dados fixos: itens do menu, opções de exemplo
│   └── theme/           # cores e variáveis do Ionic
├── tests/
│   ├── unit/            # testes Vitest
│   └── e2e/             # testes Playwright
├── capacitor.config.ts  # configuração do Capacitor (nome e id do app)
├── vite.config.ts       # configuração do Vite
└── package.json         # dependências e comandos
```

**Organização em camadas:** as páginas (`views`) usam as regras (`utils`) e os serviços (`services`).
Só os serviços conversam com o banco (`db.ts`). Isso mantém as telas simples e permite testar as
regras sem abrir o app.

---

## 7. Telas do app

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/ativos` | Lista de ativos: busca, filtros por tipo e status, contador |
| `/ativos/novo` | Cadastro de ativo |
| `/ativos/:id` | Detalhe do ativo, com histórico e movimentações |
| `/ativos/:id/editar` | Edição do ativo |
| `/resumo` | Resumo (painel) dos ativos e tempo em manutenção |
| `/historico` | Histórico geral de movimentações |
| `/colaboradores` | Colaboradores (lista, cadastro, detalhe) |
| `/localizacoes` | Localizações |
| `/categorias` | Categorias |
| `/perfil` | Meu perfil |

Todas as telas, menos o login, exigem usuário logado.

---

## 8. Problemas comuns

**`npm install` mostra avisos `EBADENGINE`.**
Sua versão do Node é antiga. Instale o Node 22.18 ou mais novo e rode `npm install` de novo.

**Tela branca ou erro `WebAssembly ... LinkError` / `sql-wasm.wasm` não encontrado.**
O arquivo do SQLite não foi copiado. Rode:

```bash
npm run postinstall
```

Não atualize o `sql.js`. Ele precisa ficar na versão **1.11.0**, a mesma que o `jeep-sqlite` usa.

**Erro `Outdated Optimize Dep` (504) no navegador.**
Pare o servidor (`Ctrl + C`), rode `npm run dev` de novo e recarregue a página.

**Quero apagar os dados e começar do zero.**
No navegador, aperte `F12` e vá em **Application → IndexedDB**. Apague `jeepSqliteStore` e recarregue
a página: o banco é recriado com os dados de exemplo.

**A porta 5173 já está em uso.**
O Vite escolhe outra porta sozinho (5174, 5175…). Use o endereço que aparecer no terminal.
