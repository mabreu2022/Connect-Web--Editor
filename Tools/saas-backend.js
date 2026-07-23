import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import multer from 'multer';
import http from 'http';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import PixGenerator from './pix.js';
import * as db from './saas-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'gerador_lazarus_secret_key_2026';
const SMTP_USER = process.env.SMTP_USER || 'seu-gmail@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'sua-senha-app';

// Configurar Multer para Comprovantes Pix
const uploadDir = path.join(__dirname, 'uploads', 'comprovantes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'comprovante-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Formato não permitido. Apenas JPG, JPEG, PNG e PDF são aceitos.'), false);
};

const upload = multer({ storage, fileFilter });

// Middlewares de Autenticação
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso não fornecido ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Sessão expirada ou token inválido.' });
    req.user = decoded;
    next();
  });
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.isAdmin !== 1) {
    return res.status(403).json({ error: 'Acesso restrito apenas para administradores.' });
  }
  next();
}

// Inicializar e configurar o Backend SaaS
export function startSaaSBackend(app) {
  const isSaaSMode = process.env.SAAS_MODE === 'true';
  const PORT = isSaaSMode ? (process.env.PORT || 3012) : 3002;

  // Servir comprovantes estáticos
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, expressStaticWithOrigin());

  function expressStaticWithOrigin() {
    return (req, res, next) => {
      const file = path.join(uploadDir, req.path);
      if (fs.existsSync(file)) {
        return res.sendFile(file);
      }
      next();
    };
  }

  // ==========================================
  // 1. ROTAS DE AUTENTICAÇÃO (SaaS)
  // ==========================================

  // Registro de Usuário
  app.post('/api/saas/auth/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
      const check = await db.query('SELECT USU_ID FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email.trim().toLowerCase()]);
      if (check.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const hash = await bcrypt.hash(senha, 10);
      await db.execute(
        'INSERT INTO TB_USUARIOS (USU_ID, USU_NOME, USU_EMAIL, USU_SENHA, USU_IS_ADMIN, USU_STATUS) VALUES (NEXT VALUE FOR SEQ_USUARIOS, ?, ?, ?, 0, 1)',
        [nome.trim(), email.trim().toLowerCase(), hash]
      );

      res.status(201).json({ message: 'Conta criada com sucesso!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar conta: ' + err.message });
    }
  });

  // Login de Usuário
  app.post('/api/saas/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const rows = await db.query('SELECT USU_ID, USU_NOME, USU_EMAIL, USU_SENHA, USU_IS_ADMIN, USU_STATUS FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email.trim().toLowerCase()]);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const user = rows[0];
      if (user.usu_status === 0) {
        return res.status(403).json({ error: 'Sua conta está bloqueada pelo administrador.' });
      }

      const match = await bcrypt.compare(senha, user.usu_senha);
      if (!match) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const token = jwt.sign(
        { id: user.usu_id, email: user.usu_email, isAdmin: user.usu_is_admin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.usu_id,
          nome: user.usu_nome,
          email: user.usu_email,
          isAdmin: user.usu_is_admin
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao realizar login: ' + err.message });
    }
  });

  // Me (Obter Perfil)
  app.get('/api/saas/auth/me', authenticateJWT, (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        isAdmin: req.user.isAdmin
      }
    });
  });

  // Esqueci minha senha (SMTP Gmail)
  app.post('/api/saas/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    try {
      const rows = await db.query('SELECT USU_ID, USU_NOME FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email.trim().toLowerCase()]);
      if (rows.length === 0) {
        // Retorna sucesso para evitar enumeração de emails
        return res.json({ message: 'Se o e-mail existir em nossa base, as instruções de redefinição serão enviadas.' });
      }

      const user = rows[0];
      const token = jwt.sign({ id: user.usu_id }, JWT_SECRET, { expiresIn: '1h' });
      const resetLink = isSaaSMode
        ? `https://gerador.connecttask.com.br/reset-password.html?token=${token}`
        : `http://localhost:${PORT}/reset-password.html?token=${token}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });

      const mailOptions = {
        from: SMTP_USER,
        to: email,
        subject: 'Redefinição de Senha - Gerador Lazarus SaaS',
        html: `
          <h3>Olá, ${user.usu_nome}</h3>
          <p>Você solicitou a redefinição de sua senha.</p>
          <p>Clique no link abaixo para cadastrar uma nova senha (link válido por 1 hora):</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: 'E-mail de redefinição enviado com sucesso!' });
    } catch (err) {
      console.error('SMTP Error:', err);
      res.status(500).json({ error: 'Erro ao enviar e-mail de redefinição: ' + err.message });
    }
  });

  // Resetar Senha
  app.post('/api/saas/auth/reset-password', async (req, res) => {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const hash = await bcrypt.hash(novaSenha, 10);
      await db.execute('UPDATE TB_USUARIOS SET USU_SENHA = ? WHERE USU_ID = ?', [hash, decoded.id]);
      res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (err) {
      res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
  });


  // ==========================================
  // 2. ROTAS DE DIÁRIAS E PAGAMENTOS (SaaS)
  // ==========================================

  // Verificar se o usuário possui acesso ativo (diária ativa)
  app.get('/api/saas/payments/check-access', authenticateJWT, async (req, res) => {
    try {
      const rows = await db.query(
        'SELECT DIA_FIM FROM TB_DIARIAS WHERE DIA_USU_ID = ? AND DIA_STATUS = \'pago\' AND DIA_FIM > CURRENT_TIMESTAMP ORDER BY DIA_FIM DESC',
        [req.user.id]
      );

      if (rows.length > 0) {
        return res.json({ hasAccess: true, expiresAt: rows[0].dia_fim });
      }

      res.json({ hasAccess: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Solicitar diária (Gera QR Code + Pix Copia e Cola)
  app.post('/api/saas/payments/request-diaria', authenticateJWT, async (req, res) => {
    try {
      const configRows = await db.query('SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG');
      const configs = {};
      configRows.forEach(c => configs[c.cfg_chave] = c.cfg_valor);

      const valorDiaria = parseFloat(configs['VALOR_DIARIA'] || '10.00');
      const pixChave = configs['PIX_CHAVE'] || 'conectsolutions@hotmail.com';
      const pixNome = configs['PIX_NOME'] || 'Connect Solutions';
      const pixCidade = configs['PIX_CIDADE'] || 'Blumenau';

      // 1. Criar registro pendente da diária
      const resultDiaria = await db.execute(
        'INSERT INTO TB_DIARIAS (DIA_ID, DIA_USU_ID, DIA_VALOR, DIA_STATUS) VALUES (NEXT VALUE FOR SEQ_DIARIAS, ?, ?, \'pendente\')',
        [req.user.id, valorDiaria]
      );

      // Buscar o ID recém-criado
      const lastDiariaRows = await db.query('SELECT FIRST 1 DIA_ID FROM TB_DIARIAS WHERE DIA_USU_ID = ? ORDER BY DIA_CRIADO DESC', [req.user.id]);
      const diariaId = lastDiariaRows[0].dia_id;

      // 2. Gerar Pix
      const generator = new PixGenerator(pixChave, pixNome, pixCidade);
      const pixData = await generator.generateQRCode(valorDiaria, `DIA${diariaId}`);

      res.json({
        diariaId,
        valor: valorDiaria,
        pixCopiaCola: pixData.payload,
        qrCodeBase64: pixData.qrCode
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao gerar Pix: ' + err.message });
    }
  });

  // Enviar comprovante de pagamento
  app.post('/api/saas/payments/upload-proof/:diariaId', authenticateJWT, upload.single('comprovante'), async (req, res) => {
    const { diariaId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Por favor, envie o arquivo de comprovante.' });
    }

    try {
      const diariaCheck = await db.query('SELECT DIA_ID, DIA_VALOR FROM TB_DIARIAS WHERE DIA_ID = ? AND DIA_USU_ID = ?', [diariaId, req.user.id]);
      if (diariaCheck.length === 0) {
        return res.status(404).json({ error: 'Solicitação de diária não encontrada.' });
      }

      const diaria = diariaCheck[0];

      // Excluir comprovantes pendentes antigos para a mesma diária
      await db.execute('DELETE FROM TB_PAGAMENTOS WHERE PAG_DIA_ID = ? AND PAG_STATUS = \'pendente\'', [diariaId]);

      // Salvar pagamento pendente
      await db.execute(
        'INSERT INTO TB_PAGAMENTOS (PAG_ID, PAG_USU_ID, PAG_DIA_ID, PAG_VALOR, PAG_STATUS, PAG_COMPROVANTE) VALUES (NEXT VALUE FOR SEQ_PAGAMENTOS, ?, ?, ?, \'pendente\', ?)',
        [req.user.id, diariaId, diaria.dia_valor, req.file.filename]
      );

      res.json({ message: 'Comprovante enviado com sucesso! Aguarde a aprovação manual do administrador.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao salvar comprovante: ' + err.message });
    }
  });


  // ==========================================
  // 3. ROTAS ADMINISTRATIVAS (SaaS)
  // ==========================================

  // Listar todos os pagamentos pendentes e aprovados
  app.get('/api/saas/admin/payments', authenticateJWT, adminOnly, async (req, res) => {
    try {
      const rows = await db.query(
        `SELECT P.PAG_ID, P.PAG_VALOR, P.PAG_STATUS, P.PAG_COMPROVANTE, P.PAG_CRIADO, 
                U.USU_ID, U.USU_NOME, U.USU_EMAIL 
         FROM TB_PAGAMENTOS P
         JOIN TB_USUARIOS U ON U.USU_ID = P.PAG_USU_ID
         ORDER BY P.PAG_CRIADO DESC`
      );
      res.json({ payments: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Aprovar Pix e Liberar 24h
  app.post('/api/saas/admin/approve/:pagamentoId', authenticateJWT, adminOnly, async (req, res) => {
    const { pagamentoId } = req.params;

    try {
      await db.transaction(async (trans) => {
        const pagRows = await trans.query('SELECT PAG_DIA_ID, PAG_USU_ID FROM TB_PAGAMENTOS WHERE PAG_ID = ? AND PAG_STATUS = \'pendente\'', [pagamentoId]);
        if (pagRows.length === 0) {
          throw new Error('Pagamento não encontrado ou já processado.');
        }

        const pag = pagRows[0];

        // Atualizar pagamento para aprovado
        await trans.execute(
          'UPDATE TB_PAGAMENTOS SET PAG_STATUS = \'aprovado\', PAG_CONFIRMADO = CURRENT_TIMESTAMP WHERE PAG_ID = ?',
          [pagamentoId]
        );

        // Definir data fim: +24 horas a partir de agora
        const inicio = new Date();
        const fim = new Date();
        fim.setHours(fim.getHours() + 24);

        // Atualizar a diária correspondente
        await trans.execute(
          'UPDATE TB_DIARIAS SET DIA_STATUS = \'pago\', DIA_INICIO = ?, DIA_FIM = ? WHERE DIA_ID = ?',
          [inicio, fim, pag.pag_dia_id]
        );
      });

      res.json({ message: 'Pix aprovado com sucesso! Acesso liberado por 24 horas.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Rejeitar Pix
  app.post('/api/saas/admin/reject/:pagamentoId', authenticateJWT, adminOnly, async (req, res) => {
    const { pagamentoId } = req.params;

    try {
      await db.transaction(async (trans) => {
        const pagRows = await trans.query('SELECT PAG_DIA_ID FROM TB_PAGAMENTOS WHERE PAG_ID = ? AND PAG_STATUS = \'pendente\'', [pagamentoId]);
        if (pagRows.length === 0) {
          throw new Error('Pagamento não encontrado ou já processado.');
        }

        const pag = pagRows[0];

        // Rejeitar pagamento
        await trans.execute('UPDATE TB_PAGAMENTOS SET PAG_STATUS = \'rejeitado\' WHERE PAG_ID = ?', [pagamentoId]);
        // Cancelar diária
        await trans.execute('UPDATE TB_DIARIAS SET DIA_STATUS = \'rejeitado\' WHERE DIA_ID = ?', [pag.pag_dia_id]);
      });

      res.json({ message: 'Comprovante de pagamento rejeitado.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Listar Usuários
  app.get('/api/saas/admin/users', authenticateJWT, adminOnly, async (req, res) => {
    try {
      const rows = await db.query(
        'SELECT USU_ID, USU_NOME, USU_EMAIL, USU_IS_ADMIN, USU_STATUS, USU_CRIADO FROM TB_USUARIOS ORDER BY USU_CRIADO DESC'
      );
      res.json({ users: rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ativar/Desativar Usuário
  app.post('/api/saas/admin/users/status', authenticateJWT, adminOnly, async (req, res) => {
    const { userId, status } = req.body;
    if (userId === undefined || status === undefined) {
      return res.status(400).json({ error: 'userId e status são obrigatórios.' });
    }

    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode alterar o próprio status admin.' });
    }

    try {
      await db.execute('UPDATE TB_USUARIOS SET USU_STATUS = ? WHERE USU_ID = ?', [status, userId]);
      res.json({ message: 'Status do usuário atualizado com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resumo Financeiro
  app.get('/api/saas/admin/financial-summary', authenticateJWT, adminOnly, async (req, res) => {
    try {
      const totalAprovado = await db.query(
        'SELECT SUM(PAG_VALOR) as TOTAL, COUNT(PAG_ID) as QTD FROM TB_PAGAMENTOS WHERE PAG_STATUS = \'aprovado\''
      );
      const totalPendente = await db.query(
        'SELECT COUNT(PAG_ID) as QTD FROM TB_PAGAMENTOS WHERE PAG_STATUS = \'pendente\''
      );

      const aprovado = totalAprovado[0] || { total: 0, qtd: 0 };
      const pendente = totalPendente[0] || { qtd: 0 };

      res.json({
        summary: {
          totalFaturado: aprovado.total || 0,
          qtdAprovado: aprovado.qtd || 0,
          qtdPendente: pendente.qtd || 0
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Configurações do Pix (Obter)
  app.get('/api/saas/admin/settings', authenticateJWT, adminOnly, async (req, res) => {
    try {
      const rows = await db.query('SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG');
      const configs = {};
      rows.forEach(r => configs[r.cfg_chave] = r.cfg_valor);
      res.json({ config: configs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Configurações do Pix (Salvar)
  app.post('/api/saas/admin/settings', authenticateJWT, adminOnly, async (req, res) => {
    const { valorDiaria, pixChave, pixNome, pixCidade } = req.body;

    try {
      await db.transaction(async (trans) => {
        if (valorDiaria !== undefined) {
          await trans.execute(
            'UPDATE OR INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (\'VALOR_DIARIA\', ?) MATCHING (CFG_CHAVE)',
            [valorDiaria.toString()]
          );
        }
        if (pixChave !== undefined) {
          await trans.execute(
            'UPDATE OR INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (\'PIX_CHAVE\', ?) MATCHING (CFG_CHAVE)',
            [pixChave]
          );
        }
        if (pixNome !== undefined) {
          await trans.execute(
            'UPDATE OR INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (\'PIX_NOME\', ?) MATCHING (CFG_CHAVE)',
            [pixNome]
          );
        }
        if (pixCidade !== undefined) {
          await trans.execute(
            'UPDATE OR INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (\'PIX_CIDADE\', ?) MATCHING (CFG_CHAVE)',
            [pixCidade]
          );
        }
      });

      res.json({ message: 'Configurações salvas com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // 4. WEBSOCKET E SINALIZAÇÃO HYBRIDA (VPS & CLIENT RELAY)
  // ==========================================
  const server = http.createServer(app);

  if (isSaaSMode) {
    console.log('🌐 [WebSocket Server] Inicializando servidor Socket.IO no namespace /saas');
    const io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      path: '/socket.io'
    });

    const saasAgents = new Map();
    const saasClients = new Map();

    const saasNamespace = io.of('/saas');
    saasNamespace.on('connection', (socket) => {
      console.log(`🔌 Novo socket conectado: ${socket.id}`);

      socket.on('register-agent', (data) => {
        const { userId } = data;
        if (!userId) return;
        socket.userId = userId;
        socket.isAgent = true;
        saasAgents.set(userId, socket);
        console.log(`🤖 Agente registrado para o usuário ${userId}`);
        const client = saasClients.get(userId);
        if (client) client.emit('agent-status', { online: true });
      });

      socket.on('register-client', (data) => {
        const { userId } = data;
        if (!userId) return;
        socket.userId = userId;
        socket.isAgent = false;
        saasClients.set(userId, socket);
        console.log(`💻 Cliente registrado para o usuário ${userId}`);
        socket.emit('agent-status', { online: saasAgents.has(userId) });
      });

      socket.on('agent-request', (data) => {
        const { userId } = socket;
        const agent = saasAgents.get(userId);
        if (!agent) {
          return socket.emit('agent-response', {
            requestId: data.requestId,
            success: false,
            error: 'O Agente Local não está conectado. Certifique-se de iniciar o monitor local.'
          });
        }
        agent.emit('agent-request', data);
      });

      socket.on('agent-response', (data) => {
        const { userId } = socket;
        const client = saasClients.get(userId);
        if (client) client.emit('agent-response', data);
      });

      socket.on('disconnect', () => {
        const { userId, isAgent } = socket;
        if (!userId) return;
        if (isAgent) {
          if (saasAgents.get(userId) === socket) {
            saasAgents.delete(userId);
            const client = saasClients.get(userId);
            if (client) client.emit('agent-status', { online: false });
          }
        } else {
          if (saasClients.get(userId) === socket) {
            saasClients.delete(userId);
          }
        }
      });
    });
  } else {
    // Modo Local: Conectar-se ao servidor de nuvem para atuar como agente local
    console.log('🤖 [Agente Local Mode] Configurando cliente Socket.IO para conexão híbrida');
    
    // Tentar conectar se o arquivo de configuração existir
    const configFile = path.join(__dirname, 'agent-config.json');
    
    const connectLocalAgent = () => {
      if (!fs.existsSync(configFile)) {
        console.log('ℹ️ agent-config.json não localizado. Agente WebSocket inativo.');
        return;
      }

      try {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (!config.userId || !config.token) return;

        const SAAS_WS_URL = process.env.SAAS_URL || 'http://localhost:3012'; // Altere em prod
        console.log(`🔌 Conectando ao WebSocket SaaS em: ${SAAS_WS_URL}/saas`);
        
        const socket = io(`${SAAS_WS_URL}/saas`, {
          transports: ['websocket'],
          reconnection: true
        });

        socket.on('connect', () => {
          console.log('✅ Agente local conectado ao WebSocket SaaS com sucesso!');
          socket.emit('register-agent', { userId: config.userId });
        });

        socket.on('agent-request', async (reqData) => {
          const { requestId, action, params } = reqData;
          console.log(`📥 Recebido agent-request: ${action} (ID: ${requestId})`);

          try {
            let resData;
            // Executa as chamadas localmente fazendo requisições de loopback locais
            if (action === 'check-lazarus') {
              const lazPath = 'C:\\lazarus\\lazbuild.exe';
              resData = { exists: fs.existsSync(lazPath), path: lazPath };
            } else {
              const localEndpoint = `/api/${action === 'read-schema' ? 'database/schema' : action}`;
              const method = (action === 'templates' || action === 'dialog-file' || action === 'dialog-folder') ? 'get' : 'post';
              
              const localRes = method === 'get' 
                ? await axios.get(`http://localhost:3002${localEndpoint}`)
                : await axios.post(`http://localhost:3002${localEndpoint}`, params);
              
              resData = localRes.data;
            }

            socket.emit('agent-response', { requestId, success: true, data: resData });
          } catch (err) {
            console.error('Erro ao responder requisição remota:', err.message);
            socket.emit('agent-response', { 
              requestId, 
              success: false, 
              error: err.response?.data?.erro || err.response?.data?.error || err.message 
            });
          }
        });

        socket.on('disconnect', () => {
          console.log('⚠️ Desconectado do WebSocket SaaS. Tentando reconectar...');
        });

      } catch (err) {
        console.error('Falha ao inicializar conexão do Agente local:', err.message);
      }
    };

    // Executar após um breve delay
    setTimeout(connectLocalAgent, 2000);
  }

  // Inicializar o servidor HTTP
  server.listen(PORT, () => {
    console.log(`✅ Gerador Lazarus SaaS rodando na porta ${PORT} (SaaS Mode: ${isSaaSMode})`);
    if (isSaaSMode) {
      console.log(`🔗 Interface SaaS disponível em http://localhost:${PORT}/login.html`);
    } else {
      console.log(`🔗 Interface Local ativa em http://localhost:${PORT}/monitor.html`);
    }
  });
}
