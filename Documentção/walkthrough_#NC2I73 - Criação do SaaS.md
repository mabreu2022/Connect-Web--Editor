# Walkthrough: SaaS Connect Web Editor — Implementação Completa

## ✅ O que foi implementado

### 🔐 Autenticação
- **LoginPage** — Glassmorphism dark, validação, mostrar/ocultar senha
- **RegisterPage** — Cadastro com badge de plano gratuito
- **AuthContext** — Sessão JWT persistida no localStorage, auto-login
- **App.tsx** — Roteamento automático: não logado → Login; Admin → AdminPanel; Cliente → Editor

### 💰 Painel Admin (AdminPanel.tsx)
- **Dashboard Financeiro**: MRR, ARR, Receita do Mês, Usuários Ativos, Assinaturas, Faturas Pendentes
- **Usuários**: listagem, bloquear/ativar contas
- **Planos**: cards visuais com edição inline de limites e preços
- **Faturas**: tabela com status colorido (paga/pendente/vencida)
- **Botão "Abrir Editor"** para admin acessar o editor diretamente

### 🗄️ Backend Node.js + Firebird 5
- **server.js** — Express + CORS + rotas + error handler
- **firebird.js** — Pool de 5 conexões, query/execute/transaction
- **auth.controller.js** — Login/Registro/Recuperação/Redefinição de senha + JWT
- **admin.routes.js** — Dashboard KPIs, CRUD usuários, planos, faturas
- **projetos.routes.js** — Salvar/Carregar projetos e páginas no banco
- **email.service.js** — Templates HTML via Gmail/Nodemailer

### 🗄️ Banco de Dados Firebird 5
Script SQL completo (ver plano de implementação) com:
- 9 tabelas: TB_PLANOS · TB_USUARIOS · TB_ASSINATURAS · TB_FATURAS · TB_TRANSACOES · TB_PROJETOS · TB_PAGINAS · TB_TICKETS · TB_LOGS
- Triggers de auto-increment para todas as tabelas
- Domínios tipados (D_ID, D_EMAIL, D_VALOR, D_JSON, etc.)
- Seed de dados iniciais (4 planos + admin padrão)

---

## 🚀 Como executar

### 1. Criar o banco Firebird 5
```
isql -user SYSDBA -password masterkey
CREATE DATABASE 'C:\Projetos Antigravity\Connect Web  Editor\database\connect_saas.fdb'
  PAGE_SIZE 8192 DEFAULT CHARACTER SET UTF8;
CONNECT 'C:\Projetos Antigravity\Connect Web  Editor\database\connect_saas.fdb';
-- Cole aqui o script SQL do plano de implementação
```

### 2. Configurar o backend
- Abra: `backend/.env`
- Preencha `FB_DATABASE`, `GMAIL_USER`, `GMAIL_PASS`

### 3. Iniciar o backend
```powershell
cd "c:\Projetos Antigravity\Connect Web  Editor\backend"
npm run dev
```

### 4. Iniciar o frontend
```powershell
cd "c:\Projetos Antigravity\Connect Web  Editor"
npm run dev
```

Acesse **http://localhost:5174** — você verá a tela de Login!

---

## 📧 Configurar Gmail (Senha de App)
1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Segurança → **Verificação em duas etapas** (ativar se necessário)
3. Segurança → **Senhas de App**
4. Crie uma senha para "Mail" → copie os 16 caracteres
5. Cole em `backend/.env` → `GMAIL_PASS=xxxx xxxx xxxx xxxx`

---

## 📦 Estrutura dos Planos (já no seed SQL)
| Plano | Preço | Páginas | Projetos | Exportações |
|---|---|---|---|---|
| Gratuito | R$ 0 | 3 | 1 | 5/mês |
| Básico | R$ 49,90/mês | 10 | 5 | 50/mês |
| Profissional | R$ 99,90/mês | ∞ | 20 | ∞ |
| Enterprise | Consulta | ∞ | ∞ | ∞ |

---

## 💡 Decisões aplicadas
- ✅ **PIX**: Arquivo `pix.js` a ser integrado na rota de pagamentos
- ✅ **Gmail**: Nodemailer configurado, aguarda suas credenciais
- ✅ **Sem VPS**: Tudo roda localmente por enquanto
- ✅ **Sem login social**: apenas e-mail + senha
