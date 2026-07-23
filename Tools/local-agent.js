import { io } from 'socket.io-client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const LOCAL_API_URL = 'http://localhost:3002';
const SAAS_URL = process.env.SAAS_URL || 'http://localhost:3001'; // Ajustar para 'https://gerador.connecttask.com.br' em produção
const CONFIG_FILE = path.join(__dirname, 'agent-config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Carregar ou solicitar credenciais
async function getCredentials() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.token && config.userId) {
        return config;
      }
    } catch (e) {}
  }

  console.log('\n🔐 [Agente Local] É necessário autenticar-se no Gerador SaaS.');
  const email = await question('E-mail: ');
  const senha = await question('Senha: ');

  try {
    console.log(`📡 Conectando a ${SAAS_URL}/api/saas/auth/login...`);
    const res = await axios.post(`${SAAS_URL}/api/saas/auth/login`, { email, senha });
    
    const config = {
      token: res.data.token,
      userId: res.data.user.id,
      email: res.data.user.email,
      nome: res.data.user.nome
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Autenticado com sucesso como: ${config.nome}`);
    return config;
  } catch (err) {
    console.error('❌ Falha na autenticação:', err.response?.data?.error || err.message);
    process.exit(1);
  }
}

// Iniciar Agente
async function startAgent() {
  console.log('🤖 Inicializando Agente Local de Conexão Híbrida...');
  
  // 1. Obter credenciais do SaaS
  const config = await getCredentials();

  // 2. Conectar ao WebSocket do SaaS
  console.log(`🔌 Conectando ao WebSocket do SaaS em: ${SAAS_URL}/saas`);
  const socket = io(`${SAAS_URL}/saas`, {
    transports: ['websocket'],
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('✅ Conectado ao servidor WebSocket da nuvem!');
    
    // Registrar o agente
    socket.emit('register-agent', { userId: config.userId });
    console.log(`🤖 Agente registrado e escutando requisições do usuário ID: ${config.userId}`);
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Conexão com o servidor da nuvem perdida. Tentando reconectar...');
  });

  socket.on('error', (err) => {
    console.error('❌ Erro no WebSocket:', err);
  });

  // Notificar status do agente
  socket.on('agent-status', (status) => {
    console.log('Status de emparelhamento:', status);
  });

  // 3. Ouvir requisições de controle enviadas pelo navegador (SaaS)
  socket.on('agent-request', async (reqData) => {
    const { requestId, action, params } = reqData;
    console.log(`📥 [REQUISIÇÃO] ID: ${requestId} | Ação: ${action}`);

    try {
      let responseData;

      switch (action) {
        case 'check-lazarus':
          const lazbuildPath = 'C:\\lazarus\\lazbuild.exe';
          const exists = fs.existsSync(lazbuildPath);
          responseData = { exists, path: lazbuildPath };
          break;

        case 'templates':
          const resTemplates = await axios.get(`${LOCAL_API_URL}/api/templates`);
          responseData = resTemplates.data;
          break;

        case 'read-schema':
          const resSchema = await axios.post(`${LOCAL_API_URL}/api/database/schema`, params);
          responseData = resSchema.data;
          break;

        case 'generate-project':
          const resGenerate = await axios.post(`${LOCAL_API_URL}/api/generate-project`, params);
          responseData = resGenerate.data;
          break;

        case 'compile':
          const resCompile = await axios.post(`${LOCAL_API_URL}/api/compile`, params);
          responseData = resCompile.data;
          break;

        case 'dialog-file':
          const resDialogFile = await axios.get(`${LOCAL_API_URL}/api/dialog/file`);
          responseData = resDialogFile.data;
          break;

        case 'dialog-folder':
          const resDialogFolder = await axios.get(`${LOCAL_API_URL}/api/dialog/folder`);
          responseData = resDialogFolder.data;
          break;

        default:
          throw new Error(`Ação '${action}' não reconhecida pelo Agente Local.`);
      }

      // Envia resposta de sucesso de volta
      socket.emit('agent-response', {
        requestId,
        success: true,
        data: responseData
      });
      console.log(`📤 [RESPOSTA ENVIADA] ID: ${requestId} - Sucesso: true`);

    } catch (err) {
      console.error(`❌ Erro ao processar ação '${action}':`, err.response?.data || err.message);
      
      socket.emit('agent-response', {
        requestId,
        success: false,
        error: err.response?.data?.erro || err.response?.data?.error || err.message
      });
      console.log(`📤 [RESPOSTA ENVIADA] ID: ${requestId} - Sucesso: false`);
    }
  });

  // Manter viva a CLI
  console.log('\nPressione Ctrl+C para encerrar o Agente Local.\n');
}

startAgent().catch(console.error);
