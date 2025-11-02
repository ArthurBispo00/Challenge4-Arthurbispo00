# 📱 Radar Motu - App de Gestão de Pátio (Entrega Final - Challenge 4)

### *Sua frota sob controle, seu pátio na palma da mão.*

GitHub do Projeto (Classroom): https://github.com/AntonioCarvalhoFIAP/challenge-4-ArthurBispo00
---

## 👨‍💻👩‍💻👩‍💻 Equipe de Desenvolvimento

| Nome | RM | Turma |
| :--- | :--- | :--- |
| Paulo André Carminati | 557881 | 2-TDSPZ | 
| Arthur Bispo de Lima | 557568 | 2-TDSPV | 
| João Paulo Moreira | 557808 | 2-TDSPV |

---

![Arquitetura da Solução Radar Motu](./radarmotu-app/radarmotu-app/assets/arquitetura-solucao.png)
*Diagrama da arquitetura conceitual da solução, incluindo a camada de backend e as interações do operador.*

---

# 📲 Baixe e Teste o App (Firebase App Distribution)
Esta aplicação foi publicada para testes via Firebase App Distribution. Você pode baixar e instalar o build de produção (.apk) diretamente no seu dispositivo Android usando o link de convite (requer ser adicionado como testador).

🔗 https://appdistribution.firebase.google.com/testerapps/1:216057105931:android:4ad50f0f6d2e7a8031410e/releases/063f01r762jvo?utm_source=firebase-console

## 🎯 Proposta do Aplicativo

Este projeto representa a evolução de um protótipo para um aplicativo funcional em React Native, focado em atender aos requisitos da disciplina de **Mobile Application Development**. A aplicação visa fornecer uma solução completa para a gestão de pátios de motocicletas, transformando a base de desenvolvimento anterior em um produto concreto, com código limpo, integração robusta com APIs e uma interface refinada.

O objetivo é demonstrar a aplicação prática de conceitos avançados de desenvolvimento mobile, incluindo gerenciamento de estado global, comunicação assíncrona, arquitetura escalável e funcionalidades nativas como Notificações Push e Internacionalização

---
## ✅ Atendimento aos Critérios de Avaliação

Esta seção detalha os novos requisitos implementados para a entrega final (Challenge 4).

| Mapa do Pátio (Visão Geral) | Radar de Proximidade (Localização Fina) |
| :---: | :---: |
| ![Demonstração do Mapa do Pátio](./radarmotu-app/radarmotu-app/assets/mapa-do-patio.jpg) | ![Demonstração do Radar de Proximidade](./radarmotu-app/radarmotu-app/assets/radar-de-proximidade.jpg) |

### 1. Internacionalização (i18n) e Localização

O aplicativo foi totalmente internacionalizado para suportar múltiplos idiomas, melhorando sua acessibilidade e alcance.

Suporte a PT/ES: O app agora suporta Português (padrão) e Espanhol.

Troca Dinâmica: Um seletor de idioma (PT | ES) foi adicionado ao menu lateral (Drawer), permitindo ao usuário alterar o idioma de toda a aplicação instantaneamente, sem necessidade de reiniciar.

Cobertura Completa: Todas as strings visíveis ao usuário (telas, menus, botões, alertas e títulos de navegação) foram migradas para arquivos de tradução (.json) e são gerenciadas pelo i18next.

### 2. Notificação via Push

O aplicativo implementa um ciclo completo de envio e recepção de notificações push, utilizando Expo Push Notifications e Firebase Cloud Messaging (FCM).

Cenário Realista Implementado: Foi implementado um cenário de notificação automático e relevante ao contexto do app.

Envio Automático: Após o usuário cadastrar um novo veículo ou armazenar um veículo (nas telas Cadastro.tsx ou OperacoesPorPlaca.tsx), o aplicativo obtém seu próprio Push Token (compartilhado via Context API) e dispara uma chamada para a API da Expo, enviando uma notificação push para o próprio dispositivo.

Mensagem de Confirmação: A notificação serve como uma confirmação da ação (ex: "Veículo Cadastrado: Veículo X placa Y cadastrado com sucesso.").

Recepção (Foreground): O app está configurado (setNotificationHandler) para exibir o banner da notificação mesmo que o usuário esteja com o app aberto (em primeiro plano) no momento do cadastro.

### 3. Publicação do App (Firebase App Distribution)

O aplicativo foi configurado para builds de produção e distribuído via Firebase App Distribution, atendendo aos requisitos de publicação para testes.

Build de Produção: O build final foi gerado como um .apk assinado através do EAS Build (eas build --profile production).

Hospedagem: O .apk foi publicado na plataforma Firebase App Distribution.

Gerenciamento de Testadores: O e-mail do professor foi adicionado à lista de testadores, permitindo o download e a verificação do build de produção entregue. (Obs: A tela "Sobre" com hash do commit foi pulada a pedido para focar na publicação.)

### 4. Histórico: Atendimento aos Critérios (3ª Sprint Intermediária)

A seguir, detalhamos como o projeto atendeu a cada um dos critérios exigidos para a 3ª Sprint.

O projeto foi estruturado com foco em clareza, manutenibilidade, separação de responsabilidades e utilizando as melhores práticas do desenvolvimento mobile.

#### 4.1  Telas Funcionais Integradas com API
a. Duas Funcionalidades Completas com API:

 Autenticação de Usuários: Cadastro, Login e Logout completos via Firebase Authentication.

 Reconhecimento de Placa (OCR): Integração com um servidor de OCR próprio (ArthurBispo00/servidor_OCR).

b. Operações Completas (CRUD - em andamento): As telas de Cadastro e Listagem foram evoluídas para o consumo de uma API .NET (ou similar).

c. Tratamento Completo de Formulários: Todos os formulários (Login, Cadastro de Usuário e Veículo) possuem validação, mensagens de erro e feedback.

d. Indicadores de Carregamento: Todas as operações de rede (ActivityIndicator) informam o usuário que uma ação está em andamento.

#### 4.2 Sistema de Login 
O fluxo de autenticação foi implementado de forma completa e segura, utilizando Firebase Authentication. a. Tela de Login: Gerencia a sessão do Firebase e persiste o login. b. Tela de Cadastro: Permite que novos usuários criem uma conta. c. Logout Funcional: Presente no menu lateral (Drawer) e na tela "Sobre", encerra a sessão do Firebase e redireciona para o Login.

#### 4.3 Estilização com Tema 
a. Modo Claro e Escuro: O app detecta o tema do sistema e permite a troca manual. b. Personalização Consistente: Através da Context API (ThemeContext), um objeto de tema centralizado distribui as paletas de cores e estilos. c. Adesão às Guidelines e Criatividade: A interface segue boas práticas de design (Material Design) e mantém a identidade visual do projeto.

#### 4.4 Arquitetura de Código
Organização e Separação de Responsabilidades: O código-fonte está no diretório src/, dividido em: screens, components, contexts, navigation, services e themes. Código Limpo e Boas Práticas: Uso de Hooks, componentes funcionais, Context API e separação da lógica de navegação condicional no App.tsx.

### 5. Documentação e Apresentação

> **README.md:** Este arquivo serve como a documentação técnica central do projeto, detalhando a proposta, as funcionalidades, a estrutura de pastas, as tecnologias utilizadas e os integrantes, atendendo a todos os requisitos.

---

### 6. Demonstração em Vídeo

Para uma visão completa da solução em funcionamento, desde o escaneamento da placa até a localização em tempo real com o radar, assista à nossa apresentação e demonstração no YouTube.

> #### 🎥 **[ASSISTIR AO VÍDEO DE DEMONSTRAÇÃO NO YOUTUBE]**
> **

---

### 5. Tecnologias Utilizadas

Este projeto foi construído com uma combinação de tecnologias modernas e eficientes, focadas no desenvolvimento mobile em React Native e na integração com serviços de backend.

| Categoria | Tecnologias |
| :--- | :--- |
| **Frontend Mobile** | ![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) |
| **Autenticação** | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) |
| **Backend (Planejado)** | ![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white) ![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white) |
| **Ferramentas** | ![VSCode](https://img.shields.io/badge/VSCode-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) 

## 6. Estrutura do Projeto

O código-fonte foi organizado em um formato de monorepo, separando de forma clara e lógica as três principais frentes do projeto: `radarmotu-api` (backend) e `radarmotu-app` (frontend). Essa abordagem facilita o desenvolvimento, a manutenção e a escalabilidade da solução.

## 6. Estrutura do Projeto

O código-fonte foi organizado em um formato de monorepo, separando de forma clara e lógica as três principais frentes do projeto:  `radarmotu-api` (backend) e `radarmotu-app` (frontend). Essa abordagem facilita o desenvolvimento, a manutenção e a escalabilidade da solução.

### 📁 `radarmotu-api` (Backend)

A API segue uma arquitetura robusta e modular, inspirada nas melhores práticas de desenvolvimento com FastAPI.

```t
radarmotu-api/
└── radarmotu-api/
    └── radarmotu-api/
        ├── routers/        # Define os endpoints da API (as "rotas")
        ├── services/       # Contém a lógica de negócio principal
        ├── .env.example    # Exemplo de variáveis de ambiente
        ├── anchors.json    # Configuração das posições das âncoras
        ├── database.py     # Gerencia a conexão com o banco de dados
        ├── estimator.py    # Módulo com o algoritmo de triangulação/localização
        ├── main.py         # Ponto de entrada principal da aplicação FastAPI
        ├── models.py       # Define as tabelas do banco de dados (SQLAlchemy)
        ├── schemas.py      # Define os schemas de dados para validação (Pydantic)
        ├── security.py     # Lógica de autenticação e segurança
        └── radarmotu.db    # Arquivo do banco de dados SQLite
```

main.py: Inicializa a aplicação e inclui os roteadores.

routers/: Cada arquivo aqui define um grupo de endpoints (ex: /vehicles, /tags), mantendo o código de roteamento organizado.

services/ e estimator.py: O coração da API. services orquestra as regras de negócio, enquanto estimator.py contém a lógica matemática para calcular a posição do veículo com base no RSSI.

models.py e schemas.py: Trabalham juntos para garantir que os dados que entram e saem da API e do banco de dados sejam sempre bem estruturados e validados.
---

## 📁 `radarmotu-app` (Frontend)

O aplicativo mobile foi arquitetado com uma estrutura de pastas clara e modular, seguindo as melhores práticas do desenvolvimento React Native para garantir a separação de responsabilidades, facilitar a manutenção e promover a escalabilidade do código.

```t
radarmotu-app/
├── assets/             # Ícones, logos e outras imagens estáticas do projeto.
├── src/                # Diretório principal do CÓDIGO-FONTE da aplicação.
│   ├── components/     # Componentes de UI genéricos e reutilizáveis (ex: botões, cards).
│   ├── config/         # Configurações de serviços (ex: Firebase e .env).
│   ├── locales/        # Arquivos de tradução (pt/translation.json, es/translation.json).
│   ├── contexts/       # Gerenciadores de estado global (Tema, Autenticação).
│   ├── navigation/     # Lógica de navegação e definição de tipos das rotas.
│   ├── screens/        # Componentes que representam as telas completas do app.
│   ├── services/       # Funções para comunicação com APIs externas.
│   └── themes/         # Definição dos temas (claro/escuro).
│
├── App.tsx             # Ponto de entrada. Responsável por carregar os provedores e a navegação.
├── package.json        # Lista de dependências e scripts do projeto.
├── eas.json            # Configuração do EAS Build (ex: legacy-peer-deps, buildType: apk).
├── google-services.json # Chaves do Firebase para serviços nativos (Push, Auth).

```

## 7. Como Rodar o Projeto do Zero

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento completo em sua máquina local.

### Pré-requisitos
* **Node.js (LTS)** e **npm**
* **Python 3.9+** e **pip**
* **Git**
* **Android Studio** com um Emulador Android configurado (ou um dispositivo físico)
* **Expo Go App** instalado no seu dispositivo físico (caso opte por não usar o emulador)

---
### Passo 1: Clonar o Repositório
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd [NOME_DA_PASTA_DO_PROJETO]

### Passo 2: Configurar e Rodar o Backend (API)

# Navegue até a pasta da API
cd radarmotu-api

# Crie e ative um ambiente virtual
python -m venv venv
# No Windows:
.\venv\Scripts\activate
# No Linux/Mac:
# source venv/bin/activate

# Instale as dependências do Python
pip install -r requirements.txt

# Entre na pasta da aplicação
cd radarmotu-api

# Inicie o servidor de desenvolvimento
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

✅ Pronto! A API estará rodando e acessível na sua rede local. Anote o seu endereço de IP (ex: 192.168.1.10), você precisará dele no App.

### Passo 3: Configurar e Rodar o Frontend (App)

# Em um novo terminal, navegue até a pasta do App
cd radarmotu-app

# Instale as dependências do Node.js
npm install

# (Opcional) Se encontrar erros de dependência, use:
npm install --legacy-peer-deps

# Inicie a aplicação Android
npx expo run:android

❗ Importante: Após iniciar a aplicação, abra o arquivo radarmotu-app/config/env.ts (ou similar) e atualize o endereço da API para o IP da máquina onde o backend está rodando (ex: http://192.168.1.10:8000).


Após configurar o IP, você pode:

Escanear o QR Code com o app Expo Go no seu celular.

