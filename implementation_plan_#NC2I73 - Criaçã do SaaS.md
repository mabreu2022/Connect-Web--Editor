# 📋 Plano de Implementação: SaaS Connect Web Editor
**Versão 1.0 — Aprovação Técnica**

---

## 🎯 Objetivo do Projeto

Transformar o **Connect Web Editor** em uma plataforma **SaaS completa** com:
- Autenticação segura (Login / Registro / Recuperação de senha)
- Painel Administrativo financeiro para gestão de clientes e assinaturas
- Sistema de Planos e Assinaturas com controle de limites por plano
- Banco de dados **Firebird 5** como backend de dados
- API REST (Node.js + Express) para comunicação front ↔ banco

---

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────┐
│          FRONTEND (React + Vite)        │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Login   │ │  Painel  │ │ Editor  │ │
│  │  /auth   │ │  /admin  │ │  /app   │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└───────────────────┬─────────────────────┘
                    │ REST API (Axios / Fetch)
┌───────────────────▼─────────────────────┐
│         BACKEND (Node.js + Express)     │
│  Auth · Assinaturas · Financeiro · CRUD │
└───────────────────┬─────────────────────┘
                    │ node-firebird driver
┌───────────────────▼─────────────────────┐
│         BANCO DE DADOS (Firebird 5)     │
│  Usuários · Planos · Assinaturas ·      │
│  Faturas · Transações · Projetos        │
└─────────────────────────────────────────┘
```

---

## 📑 Módulos do Sistema

### 1. 🔐 Módulo de Autenticação
| Tela | Funcionalidades |
|---|---|
| **Login** | E-mail + senha, "Lembrar de mim", recuperação de senha |
| **Registro** | Nome, e-mail, empresa, senha, confirmação, aceite de termos |
| **Recuperar Senha** | Envio de link por e-mail com token de 1 hora |
| **2FA (futuro)** | Código via app autenticador |

### 2. 💰 Módulo Financeiro (Painel Admin)
| Funcionalidade | Detalhes |
|---|---|
| **Dashboard Financeiro** | Receita mensal, anual, MRR, churn rate, ARR |
| **Faturas** | Geração automática, status (paga/pendente/vencida) |
| **Cobranças** | Integração para pagamento (Stripe / Pagar.me / Asaas) |
| **Relatórios** | Receita por período, por plano, inadimplência |
| **Exportação** | CSV, PDF das faturas |

### 3. 📦 Módulo de Planos de Assinatura
| Plano | Preço | Páginas/Projeto | Projetos | Exportações/mês |
|---|---|---|---|---|
| **Gratuito** | R$ 0 | 3 | 1 | 5 |
| **Básico** | R$ 49/mês | 10 | 5 | 50 |
| **Pro** | R$ 99/mês | Ilimitado | 20 | Ilimitado |
| **Enterprise** | Sob consulta | Ilimitado | Ilimitado | Ilimitado + SLA |

### 4. 🗂️ Módulo de Gestão de Clientes (Admin)
- Listagem de todos os usuários com status de assinatura
- Upgrade/Downgrade manual de plano
- Bloqueio/Desbloqueio de contas
- Histórico de ações do usuário
- Suporte: anotações e tickets

---

## 🗄️ Banco de Dados — Firebird 5

### Script SQL Completo

```sql
/* =============================================================
   CONNECT WEB EDITOR — SaaS Database
   Banco de Dados: Firebird 5
   Codificação: UTF8
   Criado em: 2026
   ============================================================= */

/* ========================
   DOMÍNIOS (TIPOS CUSTOM)
   ======================== */

CREATE DOMAIN D_ID AS INTEGER NOT NULL;
CREATE DOMAIN D_NOME AS VARCHAR(150) CHARACTER SET UTF8 NOT NULL;
CREATE DOMAIN D_EMAIL AS VARCHAR(200) CHARACTER SET UTF8 NOT NULL;
CREATE DOMAIN D_SENHA AS VARCHAR(255) CHARACTER SET UTF8 NOT NULL;
CREATE DOMAIN D_STATUS AS SMALLINT DEFAULT 1;
CREATE DOMAIN D_VALOR AS NUMERIC(15,2) DEFAULT 0;
CREATE DOMAIN D_DATA AS DATE;
CREATE DOMAIN D_DATETIME AS TIMESTAMP;
CREATE DOMAIN D_TOKEN AS VARCHAR(500) CHARACTER SET UTF8;
CREATE DOMAIN D_JSON AS BLOB SUB_TYPE TEXT CHARACTER SET UTF8;

/* ========================
   SEQUENCES (AUTO-INCREMENT)
   ======================== */

CREATE SEQUENCE SEQ_USUARIOS;
CREATE SEQUENCE SEQ_PLANOS;
CREATE SEQUENCE SEQ_ASSINATURAS;
CREATE SEQUENCE SEQ_FATURAS;
CREATE SEQUENCE SEQ_TRANSACOES;
CREATE SEQUENCE SEQ_PROJETOS;
CREATE SEQUENCE SEQ_PAGINAS;
CREATE SEQUENCE SEQ_TICKETS;
CREATE SEQUENCE SEQ_LOGS;

/* ========================
   TABELA: TB_PLANOS
   Planos de assinatura disponíveis
   ======================== */

CREATE TABLE TB_PLANOS (
  PLA_ID        D_ID,
  PLA_NOME      D_NOME,
  PLA_DESCRICAO VARCHAR(500) CHARACTER SET UTF8,
  PLA_PRECO_MES D_VALOR,
  PLA_PRECO_ANO D_VALOR,
  PLA_MAX_PAG   INTEGER DEFAULT -1,     /* -1 = ilimitado */
  PLA_MAX_PROJ  INTEGER DEFAULT -1,
  PLA_MAX_EXP   INTEGER DEFAULT -1,     /* exportações/mês */
  PLA_ORDEM     SMALLINT DEFAULT 0,
  PLA_DESTAQUE  D_STATUS,               /* 1=plano em destaque */
  PLA_ATIVO     D_STATUS,
  PLA_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_PLANOS PRIMARY KEY (PLA_ID)
);

/* ========================
   TABELA: TB_USUARIOS
   Usuários da plataforma
   ======================== */

CREATE TABLE TB_USUARIOS (
  USU_ID        D_ID,
  USU_NOME      D_NOME,
  USU_EMAIL     D_EMAIL,
  USU_SENHA     D_SENHA,               /* bcrypt hash */
  USU_TELEFONE  VARCHAR(20),
  USU_EMPRESA   VARCHAR(200) CHARACTER SET UTF8,
  USU_AVATAR    VARCHAR(500),
  USU_PERFIL    SMALLINT DEFAULT 0,    /* 0=Cliente, 1=Admin, 2=Suporte */
  USU_STATUS    D_STATUS,              /* 1=Ativo, 0=Bloqueado, 2=Pendente */
  USU_EMAIL_VER D_STATUS DEFAULT 0,   /* 1=Email verificado */
  USU_TOK_RESET D_TOKEN,              /* Token recuperação de senha */
  USU_TOK_EXPIR D_DATETIME,           /* Expiração do token */
  USU_ULTIMO_AC D_DATETIME,           /* Último acesso */
  USU_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  USU_ATUALIZ   D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_USUARIOS PRIMARY KEY (USU_ID),
  CONSTRAINT UQ_EMAIL UNIQUE (USU_EMAIL)
);

/* ========================
   TABELA: TB_ASSINATURAS
   Vincula usuário a um plano
   ======================== */

CREATE TABLE TB_ASSINATURAS (
  ASS_ID        D_ID,
  ASS_USU_ID    D_ID,
  ASS_PLA_ID    D_ID,
  ASS_STATUS    VARCHAR(20) DEFAULT 'ativa',
                /* ativa | cancelada | suspensa | trial | vencida */
  ASS_INICIO    D_DATA,
  ASS_FIM       D_DATA,
  ASS_RENOVACAO D_DATA,
  ASS_TRIAL     D_STATUS DEFAULT 0,     /* 1=em período trial */
  ASS_TRIAL_FIM D_DATA,
  ASS_CICLO     VARCHAR(10) DEFAULT 'mensal',  /* mensal | anual */
  ASS_DISCOUNT  D_VALOR DEFAULT 0,      /* % de desconto aplicado */
  ASS_CANCEL_DT D_DATETIME,            /* Data de cancelamento */
  ASS_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_ASSINATURAS PRIMARY KEY (ASS_ID),
  CONSTRAINT FK_ASS_USU FOREIGN KEY (ASS_USU_ID) REFERENCES TB_USUARIOS(USU_ID),
  CONSTRAINT FK_ASS_PLA FOREIGN KEY (ASS_PLA_ID) REFERENCES TB_PLANOS(PLA_ID)
);

/* ========================
   TABELA: TB_FATURAS
   Faturas geradas por assinatura
   ======================== */

CREATE TABLE TB_FATURAS (
  FAT_ID        D_ID,
  FAT_ASS_ID    D_ID,
  FAT_USU_ID    D_ID,
  FAT_NUMERO    VARCHAR(20) CHARACTER SET UTF8,  /* ex: FAT-2026-00001 */
  FAT_VALOR     D_VALOR,
  FAT_DESCONTO  D_VALOR DEFAULT 0,
  FAT_VALOR_LIQ D_VALOR,
  FAT_STATUS    VARCHAR(20) DEFAULT 'pendente',
                /* pendente | paga | vencida | cancelada | estornada */
  FAT_VENCTO    D_DATA,
  FAT_PAGTO     D_DATETIME,
  FAT_DESCRICAO VARCHAR(500) CHARACTER SET UTF8,
  FAT_PERIODO   VARCHAR(30),             /* "Jun/2026 - Jul/2026" */
  FAT_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_FATURAS PRIMARY KEY (FAT_ID),
  CONSTRAINT FK_FAT_ASS FOREIGN KEY (FAT_ASS_ID) REFERENCES TB_ASSINATURAS(ASS_ID),
  CONSTRAINT FK_FAT_USU FOREIGN KEY (FAT_USU_ID) REFERENCES TB_USUARIOS(USU_ID)
);

/* ========================
   TABELA: TB_TRANSACOES
   Registro de cada pagamento/estorno
   ======================== */

CREATE TABLE TB_TRANSACOES (
  TRA_ID        D_ID,
  TRA_FAT_ID    D_ID,
  TRA_USU_ID    D_ID,
  TRA_VALOR     D_VALOR,
  TRA_TIPO      VARCHAR(20),    /* pagamento | estorno | ajuste */
  TRA_METODO    VARCHAR(30),    /* cartao_credito | pix | boleto | transferencia */
  TRA_STATUS    VARCHAR(20),    /* aprovada | recusada | pendente | estornada */
  TRA_GATEWAY   VARCHAR(50),    /* stripe | pagar.me | asaas | manual */
  TRA_EXTERNAL  VARCHAR(200),   /* ID da transação no gateway */
  TRA_DADOS     D_JSON,         /* payload JSON do gateway */
  TRA_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_TRANSACOES PRIMARY KEY (TRA_ID),
  CONSTRAINT FK_TRA_FAT FOREIGN KEY (TRA_FAT_ID) REFERENCES TB_FATURAS(FAT_ID),
  CONSTRAINT FK_TRA_USU FOREIGN KEY (TRA_USU_ID) REFERENCES TB_USUARIOS(USU_ID)
);

/* ========================
   TABELA: TB_PROJETOS
   Projetos de websites criados pelos usuários
   ======================== */

CREATE TABLE TB_PROJETOS (
  PRO_ID        D_ID,
  PRO_USU_ID    D_ID,
  PRO_NOME      D_NOME,
  PRO_DESCRICAO VARCHAR(500) CHARACTER SET UTF8,
  PRO_DADOS     D_JSON,          /* JSON com nodes, CSS, JS do projeto */
  PRO_THUMB     VARCHAR(500),    /* URL thumbnail */
  PRO_STATUS    D_STATUS,
  PRO_PUBLICADO D_STATUS DEFAULT 0,
  PRO_URL_PUB   VARCHAR(300),    /* URL de publicação */
  PRO_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRO_ATUALIZ   D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_PROJETOS PRIMARY KEY (PRO_ID),
  CONSTRAINT FK_PRO_USU FOREIGN KEY (PRO_USU_ID) REFERENCES TB_USUARIOS(USU_ID)
);

/* ========================
   TABELA: TB_PAGINAS
   Páginas de cada projeto
   ======================== */

CREATE TABLE TB_PAGINAS (
  PAG_ID        D_ID,
  PAG_PRO_ID    D_ID,
  PAG_NOME      D_NOME,
  PAG_FILENAME  VARCHAR(100) CHARACTER SET UTF8,
  PAG_SEO_TITLE VARCHAR(200) CHARACTER SET UTF8,
  PAG_SEO_DESC  VARCHAR(500) CHARACTER SET UTF8,
  PAG_SEO_KEYS  VARCHAR(500) CHARACTER SET UTF8,
  PAG_NODES     D_JSON,          /* JSON de ElementNode[] */
  PAG_ORDEM     SMALLINT DEFAULT 0,
  PAG_STATUS    D_STATUS,
  PAG_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  PAG_ATUALIZ   D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_PAGINAS PRIMARY KEY (PAG_ID),
  CONSTRAINT FK_PAG_PRO FOREIGN KEY (PAG_PRO_ID) REFERENCES TB_PROJETOS(PRO_ID)
);

/* ========================
   TABELA: TB_TICKETS
   Tickets de suporte dos usuários
   ======================== */

CREATE TABLE TB_TICKETS (
  TKT_ID        D_ID,
  TKT_USU_ID    D_ID,
  TKT_TITULO    VARCHAR(300) CHARACTER SET UTF8,
  TKT_MENSAGEM  BLOB SUB_TYPE TEXT CHARACTER SET UTF8,
  TKT_STATUS    VARCHAR(20) DEFAULT 'aberto',
                /* aberto | em_atendimento | resolvido | fechado */
  TKT_PRIOR     SMALLINT DEFAULT 1,  /* 1=Normal, 2=Alta, 3=Urgente */
  TKT_RESPOSTA  BLOB SUB_TYPE TEXT CHARACTER SET UTF8,
  TKT_ATN_ID    D_ID,             /* ID do admin que atendeu */
  TKT_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  TKT_ATUALIZ   D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_TICKETS PRIMARY KEY (TKT_ID),
  CONSTRAINT FK_TKT_USU FOREIGN KEY (TKT_USU_ID) REFERENCES TB_USUARIOS(USU_ID)
);

/* ========================
   TABELA: TB_LOGS
   Auditoria de ações do sistema
   ======================== */

CREATE TABLE TB_LOGS (
  LOG_ID        D_ID,
  LOG_USU_ID    INTEGER,           /* nullable - ações do sistema */
  LOG_ACAO      VARCHAR(100) CHARACTER SET UTF8,
  LOG_TABELA    VARCHAR(50),
  LOG_REGISTRO  INTEGER,
  LOG_DADOS     D_JSON,           /* snapshot do dado alterado */
  LOG_IP        VARCHAR(50),
  LOG_CRIADO    D_DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT PK_LOGS PRIMARY KEY (LOG_ID)
);

/* ========================
   TRIGGERS AUTO-INCREMENT
   ======================== */

SET TERM ^ ;

CREATE OR ALTER TRIGGER TRG_PLANOS_BI FOR TB_PLANOS
BEFORE INSERT AS BEGIN
  IF (NEW.PLA_ID IS NULL) THEN
    NEW.PLA_ID = NEXT VALUE FOR SEQ_PLANOS;
END^

CREATE OR ALTER TRIGGER TRG_USUARIOS_BI FOR TB_USUARIOS
BEFORE INSERT AS BEGIN
  IF (NEW.USU_ID IS NULL) THEN
    NEW.USU_ID = NEXT VALUE FOR SEQ_USUARIOS;
END^

CREATE OR ALTER TRIGGER TRG_ASSINATURAS_BI FOR TB_ASSINATURAS
BEFORE INSERT AS BEGIN
  IF (NEW.ASS_ID IS NULL) THEN
    NEW.ASS_ID = NEXT VALUE FOR SEQ_ASSINATURAS;
END^

CREATE OR ALTER TRIGGER TRG_FATURAS_BI FOR TB_FATURAS
BEFORE INSERT AS BEGIN
  IF (NEW.FAT_ID IS NULL) THEN
    NEW.FAT_ID = NEXT VALUE FOR SEQ_FATURAS;
  IF (NEW.FAT_NUMERO IS NULL) THEN
    NEW.FAT_NUMERO = 'FAT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(NEW.FAT_ID, 6, '0');
END^

CREATE OR ALTER TRIGGER TRG_TRANSACOES_BI FOR TB_TRANSACOES
BEFORE INSERT AS BEGIN
  IF (NEW.TRA_ID IS NULL) THEN
    NEW.TRA_ID = NEXT VALUE FOR SEQ_TRANSACOES;
END^

CREATE OR ALTER TRIGGER TRG_PROJETOS_BI FOR TB_PROJETOS
BEFORE INSERT AS BEGIN
  IF (NEW.PRO_ID IS NULL) THEN
    NEW.PRO_ID = NEXT VALUE FOR SEQ_PROJETOS;
END^

CREATE OR ALTER TRIGGER TRG_PAGINAS_BI FOR TB_PAGINAS
BEFORE INSERT AS BEGIN
  IF (NEW.PAG_ID IS NULL) THEN
    NEW.PAG_ID = NEXT VALUE FOR SEQ_PAGINAS;
END^

CREATE OR ALTER TRIGGER TRG_TICKETS_BI FOR TB_TICKETS
BEFORE INSERT AS BEGIN
  IF (NEW.TKT_ID IS NULL) THEN
    NEW.TKT_ID = NEXT VALUE FOR SEQ_TICKETS;
END^

CREATE OR ALTER TRIGGER TRG_LOGS_BI FOR TB_LOGS
BEFORE INSERT AS BEGIN
  IF (NEW.LOG_ID IS NULL) THEN
    NEW.LOG_ID = NEXT VALUE FOR SEQ_LOGS;
END^

SET TERM ; ^

/* ========================
   DADOS INICIAIS (SEED)
   ======================== */

/* Planos de assinatura */
INSERT INTO TB_PLANOS (PLA_NOME, PLA_DESCRICAO, PLA_PRECO_MES, PLA_PRECO_ANO, PLA_MAX_PAG, PLA_MAX_PROJ, PLA_MAX_EXP, PLA_ORDEM, PLA_DESTAQUE, PLA_ATIVO)
VALUES ('Gratuito', 'Ideal para explorar a plataforma.', 0, 0, 3, 1, 5, 1, 0, 1);

INSERT INTO TB_PLANOS (PLA_NOME, PLA_DESCRICAO, PLA_PRECO_MES, PLA_PRECO_ANO, PLA_MAX_PAG, PLA_MAX_PROJ, PLA_MAX_EXP, PLA_ORDEM, PLA_DESTAQUE, PLA_ATIVO)
VALUES ('Básico', 'Para freelancers e pequenas empresas.', 49.90, 479.00, 10, 5, 50, 2, 0, 1);

INSERT INTO TB_PLANOS (PLA_NOME, PLA_DESCRICAO, PLA_PRECO_MES, PLA_PRECO_ANO, PLA_MAX_PAG, PLA_MAX_PROJ, PLA_MAX_EXP, PLA_ORDEM, PLA_DESTAQUE, PLA_ATIVO)
VALUES ('Profissional', 'Para agências em crescimento com recursos ilimitados.', 99.90, 959.00, -1, 20, -1, 3, 1, 1);

INSERT INTO TB_PLANOS (PLA_NOME, PLA_DESCRICAO, PLA_PRECO_MES, PLA_PRECO_ANO, PLA_MAX_PAG, PLA_MAX_PROJ, PLA_MAX_EXP, PLA_ORDEM, PLA_DESTAQUE, PLA_ATIVO)
VALUES ('Enterprise', 'Suporte dedicado, SLA e banco de dados exclusivo.', 0, 0, -1, -1, -1, 4, 0, 1);

/* Usuário Administrador padrão */
INSERT INTO TB_USUARIOS (USU_NOME, USU_EMAIL, USU_SENHA, USU_PERFIL, USU_STATUS, USU_EMAIL_VER)
VALUES ('Administrador', 'admin@connectwebeditor.com', '$2b$10$placeholder_bcrypt_hash_aqui', 1, 1, 1);

COMMIT;
```

---

## 📁 Estrutura de Pastas do Projeto SaaS

```
connect-saas/
├── frontend/              ← React + Vite (Connect Web Editor)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── admin/
│   │   │   │   ├── DashboardAdmin.tsx     ← KPIs financeiros
│   │   │   │   ├── UsuariosAdmin.tsx
│   │   │   │   ├── AssinaturasAdmin.tsx
│   │   │   │   ├── FaturasAdmin.tsx
│   │   │   │   └── PlanosAdmin.tsx
│   │   │   └── app/
│   │   │       ├── EditorPage.tsx         ← Editor principal
│   │   │       ├── ProjetosPage.tsx
│   │   │       └── ContaPage.tsx
│   │   └── components/
├── backend/               ← Node.js + Express + Firebird 5
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── planos.routes.ts
│   │   │   ├── assinaturas.routes.ts
│   │   │   ├── faturas.routes.ts
│   │   │   └── projetos.routes.ts
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    ← JWT verification
│   │   │   └── plan.middleware.ts    ← Limites do plano
│   │   └── db/
│   │       └── firebird.ts
│   └── package.json
└── database/
    └── create_database.sql            ← Script acima
```

---

## 🗓️ Cronograma de Implementação

| Fase | Descrição | Prazo Estimado |
|---|---|---|
| **Fase 1** | Banco Firebird 5 + API de autenticação JWT | 1 semana |
| **Fase 2** | Telas de Login / Registro / Recuperação de senha | 4 dias |
| **Fase 3** | Dashboard Admin com KPIs financeiros | 1 semana |
| **Fase 4** | Gestão de planos + assinaturas + faturas | 1 semana |
| **Fase 5** | Integração Editor ↔ Banco (salvar projetos) | 3 dias |
| **Fase 6** | Testes, ajustes e publicação em servidor | 1 semana |
| **TOTAL** | | ~5 semanas |

---

## ✅ Itens Pendentes de Decisão

> [!IMPORTANT]
> Precisamos definir os seguintes pontos antes de iniciar o desenvolvimento:

1. **Gateway de pagamento**: Stripe (internacional) ou Pagar.me / Asaas (Brasil)?
2. **E-mail transacional**: SendGrid, Amazon SES ou SMTP próprio?
3. **Servidor**: VPS Linux, Windows Server ou cloud (Azure/AWS)?
4. **Subdomínio**: O editor ficará em `app.seusite.com.br` ou mesmo domínio?
5. **Autenticação Social**: Deseja login com Google/Microsoft além do e-mail?

> [!WARNING]
> O campo `USU_SENHA` no banco deve sempre armazenar o **hash bcrypt** da senha. **NUNCA** armazenar a senha em texto puro.

---

## 🚀 Próximos Passos Após Aprovação

Após sua aprovação neste plano, implementarei na seguinte ordem:

1. **Criar as telas de Login e Registro** no frontend React
2. **Montar o Painel Admin** com Dashboard Financeiro
3. **Criar o backend Node.js** com conexão Firebird 5
4. **Integrar** o Editor com autenticação e salvamento de projetos no banco

---

*Aprovado por: _________________ Data: _____________*
