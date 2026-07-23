# Walkthrough: Gerador Lazarus SaaS (Pasta Tools)

Implementamos com sucesso a estrutura completa do **Gerador Lazarus MVC SaaS** de forma 100% contida dentro do diretório [Tools/](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/).

---

## 🛠️ O que foi feito

### 1. Banco de Dados (Firebird 5)
- **DDL da Estrutura**: Criamos [saas_schema.sql](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/database/saas_schema.sql) definindo tabelas de usuários, diárias, pagamentos e parametrizações.
- **Inicializador & Semente de Dados**: Criamos [initGeradorDb.cjs](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/database/initGeradorDb.cjs). O script cria o banco `GERADOR_SAAS.FDB`, executa os DDLs e semeia:
  - O administrador: `conectsolutions@hotmail.com` / `Mmpa@2025` (com senha criptografada via `bcryptjs`).
  - A chave Pix padrão configurada: **`+5511945457934`** (solicitada pelo usuário).
  - O valor padrão da diária (R$ 10,00), recebedor e cidade.
- **Conectores do Banco**: Criamos o utilitário [saas-db.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/saas-db.js) com tratamento automático de Blobs assíncronos do Firebird.

### 2. Backend & Comunicação WebSocket Híbrida
- **Gerador Pix**: Copiamos e criamos o módulo [pix.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/pix.js) como um módulo ES para compatibilidade com o servidor local.
- **Backend SaaS Integrado**: Criamos [saas-backend.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/saas-backend.js) expondo:
  - **Rotas de Autenticação**: Cadastro, login, checagem `/me` e redefinição de senha via SMTP Gmail.
  - **Rotas de Pagamento**: Solicitação de diária, geração dinâmica de QR Code/Copia e Cola e upload de arquivos de comprovantes (via Multer).
  - **Rotas de Admin**: Aprovação/rejeição manual de pagamentos, bloqueio de usuários, resumo financeiro e alteração de parâmetros.
  - **WebSocket Relay**: Gerencia conexões entre o navegador do usuário (SaaS) e o agente rodando no PC local, permitindo ler esquemas e compilar remotamente sem problemas de CORS ou HTTPS misto.
- **Modularização**: Atualizamos o [server-logs.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/server-logs.js) para inicializar dinamicamente o `saas-backend.js`. Tornamos o diretório `templates/` dinâmico para rodar tanto no Windows local quanto no Linux VPS.

### 3. Interfaces HTML Estáticas (Premium)
Desenvolvemos telas estáticas estilizadas com CSS moderno em dark mode no diretório [Tools/](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/):
- [login.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/login.html): Login com redirecionamento inteligente baseado no status de diária ou privilégio.
- [register.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/register.html): Tela de cadastro.
- [forgot-password.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/forgot-password.html) e [reset-password.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/reset-password.html): Fluxo de redefinição de senha.
- [payment.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/payment.html): Tela de checkout Pix com cópia rápida e formulário de upload de comprovante.
- [admin.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/admin.html): Painel administrativo com resumo de faturamento, controle de usuários, parametrização do Pix e modal de visualização de comprovantes com controle de **zoom** (+ / - / Reset).
- [manual.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/manual.html): Guia de download do Node/Lazarus e recomendações de modelos do Ollama por RAM/VRAM.
- [monitor.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/monitor.html): Dashboard do Gerador, integrado com bloqueio de acesso caso a diária expire e link para o painel administrativo.

---

## 🚢 Passo a Passo para Implantação via SSH na VPS Linux

O diretório destino na VPS Linux é: `/home/ubuntu/Projestos Antigravity/Gerador`

### 1. Upload dos arquivos para a VPS
Envie o conteúdo da pasta `Tools/` (incluindo as subpastas `database`, `templates` e `uploads`) para a VPS utilizando `scp`, `rsync` ou um cliente FTP:
```bash
scp -r "./Tools/*" ubuntu@gerador.connecttask.com.br:"/home/ubuntu/Projestos Antigravity/Gerador"
```

### 2. Instalar dependências na VPS
Conecte-se via SSH na VPS, acesse a pasta e instale as dependências:
```bash
cd "/home/ubuntu/Projestos Antigravity/Gerador"
npm install express cors node-firebird bcryptjs jsonwebtoken nodemailer qrcode multer socket.io socket.io-client faz-um-pix axios
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta do Gerador na VPS:
```env
SAAS_MODE=true
PORT=3012
JWT_SECRET=gerador_lazarus_secret_key_2026
SMTP_USER=seu-gmail-para-enviar@gmail.com
SMTP_PASS=senha-de-aplicativo-do-gmail
```

### 4. Inicializar o Banco de Dados na VPS
Rode o script para criar o banco de dados físico e criar o admin inicial com a chave Pix semeada:
```bash
node database/initGeradorDb.cjs
```

### 5. Iniciar no PM2
Inicie a ferramenta sob o gerenciamento do PM2 em porta isolada (3012):
```bash
pm2 start server-logs.js --name "gerador-saas" --update-env
pm2 save
```

### 6. Configurar Nginx Reverse Proxy
Edite as configurações do Nginx na VPS para direcionar o subdomínio `gerador.connecttask.com.br` para a porta 3012:
```nginx
server {
    listen 80;
    server_name gerador.connecttask.com.br;

    location / {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*(Lembre-se de rodar o Certbot/Let's Encrypt para ativar o HTTPS: `sudo certbot --nginx -d gerador.connecttask.com.br`)*
