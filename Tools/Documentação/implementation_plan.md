# Plano de Implementação Revisado: Gerador de Sistemas Lazarus MVC com Firebird 5

Este plano descreve como traremos a lógica de geração por templates do projeto `C:\Projetos Antigravity\Gerador de Programas Lazarus` para o monitor web (`monitor.html` e `server-logs.js`), incorporando as seguintes diretrizes:

1. **Separação Completa de Projetos (Pastas Exclusivas)**: 
   - O diretório de saída principal será `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\`.
   - **Para cada novo sistema gerado**, o gerador criará uma **pasta exclusiva** com o nome do projeto (ex: `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\MeuSistemaERP\`).
   - Dentro desta pasta exclusiva do projeto, serão criadas as subpastas estruturais do MVC (`model`, `dao`, `controller`, `view`, `dm`, `utils`, etc.). Isso garante que múltiplos sistemas gerados fiquem totalmente isolados e nunca misturem seus arquivos.
2. **Nome do Projeto & Estrutura MVC**: A interface perguntará ao usuário o **Nome do Projeto** (ex: `MeuSistemaMVC`).
3. **Conexão Dinâmica de Banco**: O usuário fornecerá na interface todos os dados de conexão do banco Firebird que deseja utilizar (Host, Porta, Caminho do arquivo `.fdb`, Usuário e Senha).

---

## User Review Required

> [!IMPORTANT]
> - O backend do monitor lerá a pasta de templates diretamente de `C:\Projetos Antigravity\Gerador de Programas Lazarus\templates`.
> - Os arquivos gerados e o processo de compilação com `lazbuild.exe` ocorrerão inteiramente no **Diretório de Saída / Nome do Projeto** (pasta exclusiva) configurado pelo usuário, mantendo a pasta do monitor limpa e isolada dos projetos gerados.

---

## Proposed Changes

### 1. Backend (Node.js)

#### [MODIFY] [server-logs.js](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/server-logs.js)
Adicionaremos as seguintes rotas e funcionalidades em Javascript:
- **`GET /api/templates`**:
  - Escaneia a pasta de templates (`C:\Projetos Antigravity\Gerador de Programas Lazarus\templates`) e retorna a lista de modelos de design disponíveis (ex: `MVC Simples`, `ERP Cyber Dark`, etc.) lendo seus respectivos manifestos `modelo.json`.
- **`POST /api/database/schema`**:
  - Recebe os dados de conexão do Firebird (`host`, `port`, `database`, `user`, `password`) informados pelo usuário na tela.
  - Conecta via `node-firebird` e executa as queries de catálogo para extrair as tabelas, campos, chaves primárias (PK) e chaves estrangeiras (FK).
- **`POST /api/generate-project`**:
  - Recebe os dados de conexão do banco, as tabelas selecionadas, o template escolhido, o **Nome do Projeto** e o **Diretório de Saída** (ex: `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\`).
  - Cria a pasta exclusiva do projeto (`Diretório de Saída` + `Nome do Projeto`) e, a partir das pastas indicadas no manifesto do template (ex: `model`, `dao`, `controller`, `view`), cria os subdiretórios correspondentes.
  - Carrega a estrutura de metadados das tabelas selecionadas.
  - Implementa a engine de substituição de marcadores para:
    - Converter os tipos de dados Firebird para Pascal.
    - Mapear componentes visuais correspondentes.
    - Substituir blocos de loop `{{LOOP_CAMPOS}}` e marcadores globais.
    - Criar o arquivo de projeto `.lpr`, a configuração do projeto `.lpi`, o DataModule de conexão (`uDMConexao.pas`/`.lfm`), os arquivos Model/DAO/Controller e as Views.
    - Registrar todos os cadastros no menu principal (`uViewMain.pas`).
  - Grava todos os arquivos organizadamente dentro de suas respectivas subpastas da pasta exclusiva do projeto.
  - Retorna o status de sucesso e a lista dos arquivos criados para exibição.
- **`POST /api/compile`**:
  - Ajustar a rota existente para aceitar um caminho absoluto de arquivo `.lpi` externo, para compilar via `lazbuild` diretamente na pasta do projeto gerado e iniciar o executável de lá.

---

### 2. Frontend (HTML/JS)

#### [MODIFY] [monitor.html](file:///c:/Projetos%20Antigravity/Connect%20Web%20%20Editor/Tools/monitor.html)
- **Painel de Controle Firebird (Aba "Gerador Lazarus MVC")**:
  - Inputs para Host, Porta, Caminho do Banco de Dados (`.fdb`), Usuário e Senha.
  - Campo de texto **"Diretório de Saída"** (sugerindo por padrão `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\`).
  - Campo de texto **"Nome do Projeto"** (ex: `MeuSistemaMVC`).
  - Botão **"Conectar ao Banco"** para carregar e listar as tabelas com checkboxes.
  - Seletor do Template de design (lido dinamicamente da pasta de templates externa).
- **Ações de Geração**:
  - Botão **"Gerar Sistema Completo (Template)"**: Realiza a geração direta dos arquivos Pascal no diretório de saída via backend.
  - Botão **"Montar Prompt para IA (Ollama)"**: Prepara o prompt instrutivo com o esquema das tabelas para o playground se o usuário preferir usar o LLM.
- **Lista de Arquivos & Compilação**:
  - Exibe a lista de arquivos criados com um botão para **"Compilar e Executar Lazarus"** apontando para o diretório externo.

---

### 3. Dependências

- Utilizar a biblioteca `node-firebird` no projeto. Faremos a instalação no diretório principal.

---

## Verification Plan

### Manual Verification
1. Iniciar o servidor do monitor (`node server-logs.js` em `Tools`).
2. Acessar o monitor no navegador e ir na aba **"Gerador Lazarus MVC"**.
3. Informar o caminho de um banco Firebird local válido (ex: `C:\Projetos Antigravity\Connect Web  Editor\database\TEST.FDB`) e conectar.
4. Definir o diretório de destino externo (ex: `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\`) e o nome do projeto (ex: `SistemaERP`).
5. Selecionar uma tabela para CRUD e o template `modelo_mvc_simples`.
6. Clicar em **Gerar Sistema**.
7. Confirmar se a pasta `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\SistemaERP` foi criada com as subpastas `model`, `dao`, `view` etc. contendo os arquivos.
8. Repetir com outro nome (ex: `SistemaPDV`) e validar que a pasta exclusiva `C:\Projetos Antigravity\Gerador de Programas Lazarus\sistemas_gerados\SistemaPDV` foi criada separadamente, sem misturar os arquivos.
9. Clicar em **Compilar e Executar** e verificar se a compilação do executável externo rodou com sucesso.
