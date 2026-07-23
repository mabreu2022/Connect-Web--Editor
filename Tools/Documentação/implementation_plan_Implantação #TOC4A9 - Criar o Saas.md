# Plano de Implementação Revisado: Gerador Lazarus MVC SaaS

Este documento detalha o planejamento completo para implantar o **Gerador Lazarus MVC** como **SaaS (Software as a Service)**, incorporando as observações de faturamento manual via Pix, criação do banco na pasta `database/`, manual do usuário e integração do Ollama e parametrização do Pix.

---

## 🏗️ 1. Arquitetura da Solução Híbrida (Nuvem + Local)

Para permitir a geração dos programas e compilação na máquina física remota do usuário, usaremos uma arquitetura de **Agente WebSocket Híbrido**:

- **SaaS (VPS Linux)**: Hospeda o painel de controle, login, administração financeira e banco de dados central.
- **Agente Local (PC do Usuário)**: Um script Node.js leve que roda no PC do usuário remoto e abre uma conexão WebSocket segura com a VPS.
- **Verificação do Lazarus**: O Agente Local detecta se o Lazarus está instalado (verificando o arquivo `lazbuild.exe` no caminho configurado). Se não estiver configurado ou instalado, a aplicação SaaS exibirá um alerta em destaque para o usuário.

### 📚 Manual do Usuário e Configurações Locais
A plataforma conterá uma página dedicada de manual ("Como Configurar seu Computador") cobrindo:
1. **Requisitos de Sistema**: Instalação do Node.js local e Lazarus (configurando o executável `lazbuild.exe`).
2. **Execução do Agente**: Download do `agent.zip` (com o script e pacotes necessários) e instrução para rodá-lo (`node agent.js`).
3. **Instalação do Ollama**:
   - Link de download: [Ollama.com](https://ollama.com)
   - Comandos para baixar e rodar os modelos (ex: `ollama run qwen2.5-coder:7b`).
4. **Recomendação de Modelos baseada em Hardware**:
   - **Até 8GB RAM / 4GB VRAM**: Recomendados modelos leves como `qwen2.5-coder:1.5b` ou `llama3:8b`.
   - **16GB RAM / 6GB-8GB VRAM**: Recomendados modelos intermediários como `qwen2.5-coder:7b` ou `llama3:8b`.
   - **32GB RAM / 12GB+ VRAM**: Recomendados modelos potentes como `qwen2.5-coder:14b` ou `codegemma:7b`.

---

## 🗄️ 2. Banco de Dados do SaaS (Firebird 5)

Criaremos o banco de dados `GERADOR_SAAS.FDB` dentro de uma pasta dedicada chamada `database` na raiz do projeto do backend.

### DDL das Tabelas (Firebird 5)
```sql
/* Domínios para padronização */
CREATE DOMAIN D_ID AS INTEGER NOT NULL;
CREATE DOMAIN D_NOME AS VARCHAR(100) CHARACTER SET UTF8;
CREATE DOMAIN D_EMAIL AS VARCHAR(150) CHARACTER SET UTF8 NOT NULL;
CREATE DOMAIN D_SENHA AS VARCHAR(255) CHARACTER SET UTF8 NOT NULL;
CREATE DOMAIN D_STATUS AS SMALLINT DEFAULT 1;
CREATE DOMAIN D_VALOR AS NUMERIC(15,2) DEFAULT 0;
CREATE DOMAIN D_DATETIME AS TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

/* Tabelas Principais */
CREATE TABLE TB_USUARIOS (
    USU_ID          D_ID,
    USU_NOME        D_NOME,
    USU_EMAIL       D_EMAIL,
    USU_SENHA       D_SENHA,
    USU_IS_ADMIN    SMALLINT DEFAULT 0,
    USU_STATUS      D_STATUS,
    USU_CRIADO      D_DATETIME,
    CONSTRAINT PK_USUARIOS PRIMARY KEY (USU_ID),
    CONSTRAINT UQ_USU_EMAIL UNIQUE (USU_EMAIL)
);

CREATE TABLE TB_DIARIAS (
    DIA_ID          D_ID,
    DIA_USU_ID      D_ID,
    DIA_VALOR       D_VALOR,
    DIA_STATUS      VARCHAR(20) DEFAULT 'pendente', /* 'pendente', 'pago', 'expirado' */
    DIA_INICIO      TIMESTAMP,
    DIA_FIM         TIMESTAMP,
    DIA_CRIADO      D_DATETIME,
    CONSTRAINT PK_DIARIAS PRIMARY KEY (DIA_ID),
    CONSTRAINT FK_DIA_USU FOREIGN KEY (DIA_USU_ID) REFERENCES TB_USUARIOS(USU_ID)
);

CREATE TABLE TB_PAGAMENTOS (
    PAG_ID          D_ID,
    PAG_USU_ID      D_ID,
    PAG_DIA_ID      D_ID,
    PAG_VALOR       D_VALOR,
    PAG_STATUS      VARCHAR(20) DEFAULT 'pendente', /* 'pendente', 'aprovado', 'rejeitado' */
    PAG_COMPROVANTE VARCHAR(255), /* Nome/caminho da imagem do comprovante carregada */
    PAG_CRIADO      D_DATETIME,
    PAG_CONFIRMADO  TIMESTAMP,
    CONSTRAINT PK_PAGAMENTOS PRIMARY KEY (PAG_ID),
    CONSTRAINT FK_PAG_USU FOREIGN KEY (PAG_USU_ID) REFERENCES TB_USUARIOS(USU_ID),
    CONSTRAINT FK_PAG_DIA FOREIGN KEY (PAG_DIA_ID) REFERENCES TB_DIARIAS(DIA_ID)
);

CREATE TABLE TB_CONFIG (
    CFG_CHAVE       VARCHAR(50) NOT NULL PRIMARY KEY,
    CFG_VALOR       VARCHAR(255) CHARACTER SET UTF8
);

/* Sequences para auto-incremento */
CREATE SEQUENCE SEQ_USUARIOS;
CREATE SEQUENCE SEQ_DIARIAS;
CREATE SEQUENCE SEQ_PAGAMENTOS;
```

> [!IMPORTANT]
> **Conta Admin Padrão:**
> Ao iniciar o banco de dados, criaremos automaticamente a conta padrão informada:
> - **E-mail:** `conectsolutions@hotmail.com`
> - **Senha:** `Mmpa@2025` (com hash bcrypt seguro)
> - **Perfil:** Admin (`USU_IS_ADMIN = 1`)

---

## 💳 3. Regra de Negócio: Faturamento Pix com Parametrização e Aprovação Manual

1. **Configurações do Pix no Admin**:
   - O Administrador poderá parametrizar os dados do Pix na tabela `TB_CONFIG` via Painel Admin:
     - `'VALOR_DIARIA'`: Valor cobrado por dia de acesso (ex: `10.00`).
     - `'PIX_CHAVE'`: A chave Pix do recebedor (e-mail, telefone, CPF ou chave aleatória).
     - `'PIX_NOME'`: Nome do recebedor (ex: `ConnectTask`).
     - `'PIX_CIDADE'`: Cidade do recebedor (ex: `Sao Bernardo do Campo`).
2. **Geração do Pix (Copia e Cola + QR Code)**:
   - Quando o usuário clica em "Ativar Acesso Diário", o backend consulta estas chaves e utiliza a classe **`PixGenerator`** (já existente em [pix.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/backend/src/utils/pix.js)) para gerar o payload Pix Copia e Cola e a imagem QR Code em Base64 dinamicamente.
3. **Envio do Comprovante**:
   - O usuário realiza a transferência e faz o upload da imagem do comprovante na plataforma. A diária é criada no estado `pendente`.
4. **Validação do Admin com Zoom**:
   - O administrador analisa os comprovantes na área financeira do Painel Admin.
   - Clicar na imagem abre uma **janela modal interativa com zoom dinâmico** para facilitar a leitura dos dados do comprovante.
   - O Admin clica em **Aprovar**, ativando a diária por 24 horas (`DIA_INICIO` até `DIA_FIM`).

---

## 🖥️ 4. Telas e Componentes do Front-End

- **Página de Login e Cadastro**: Tela com estilo premium (moderno, dark mode) com a opção de criar conta e recurso "Esqueci minha Senha" utilizando Nodemailer.
- **Painel Geral (Dashboard)**:
  - Exibição de contagem regressiva da diária ativa.
  - Alerta se o Agente Local WebSocket não estiver conectado ou se o Lazarus não for detectado.
  - Manual ilustrado ensinando a baixar e executar o agente local e instalar/rodar o Ollama.
- **Painel Administrativo**:
  - **Gerenciamento de Usuários**: Lista de usuários, bloqueio de contas e controle de acessos.
  - **Área Financeira**: Visualização das diárias solicitadas, download/zoom dos comprovantes de Pix enviados e botões de "Aprovar" ou "Rejeitar".
  - **Parametrização**: Inputs para ajustar o valor da diária, a chave Pix, o nome e a cidade do recebedor (salvos em `TB_CONFIG`).

---

## 🚢 5. Implantação Segura na VPS Linux

- **Node, Firebird 5 e SSL já configurados**: O ambiente da VPS já possui o Node, Firebird e os certificados SSL instalados e ativos. Não reinstalaremos esses recursos.
- **Isolamento de Portas no PM2**: Usaremos portas específicas e parametrizáveis no arquivo `ecosystem.config.cjs` do SaaS (ex: backend na porta `3021` e frontend na porta `3022` ou conforme portas livres) para garantir que **não ocorra conflito com serviços que já estão rodando no PM2 da VPS**.

---

## 🧪 Plano de Validação do Plano

1. Criar novo usuário na interface e fazer login.
2. Verificar o redirecionamento automático para a tela de pagamento.
3. Enviar um arquivo de comprovante e atestar que a diária fica no estado `pendente`.
4. Logar como Admin (`conectsolutions@hotmail.com`/`Mmpa@2025`), abrir a aba Financeira, verificar o comprovante com o zoom modal e aprovar o pagamento.
5. Garantir que o usuário agora acessa o gerador por 24 horas.
6. Iniciar o agente local no Windows e simular a leitura do banco de dados local e a geração de código.
