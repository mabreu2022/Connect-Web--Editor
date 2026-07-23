require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { setupWebRTCSignaling } = require('./socket/webrtcSignaling');

const authRoutes = require('./routes/auth.routes');
const planosRoutes = require('./routes/planos.routes');
const assinaturasRoutes = require('./routes/assinaturas.routes');
const faturasRoutes = require('./routes/faturas.routes');
const projetosRoutes = require('./routes/projetos.routes');
const adminRoutes = require('./routes/admin.routes');
const storeRoutes = require('./routes/store.routes');
const { initStoreDb } = require('./db/initStoreDb');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.IO para sinalização WebRTC
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  path: '/socket.io'
});
setupWebRTCSignaling(io);

// Middlewares globais
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir a página de chamada de vídeo (atendente abre no celular)
app.use(express.static(path.join(__dirname, '../public')));
app.get('/call', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/call.html'));
});

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/planos', planosRoutes);
app.use('/api/assinaturas', assinaturasRoutes);
app.use('/api/faturas', faturasRoutes);
app.use('/api/projetos', projetosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

server.listen(PORT, () => {
  console.log(`✅ Backend Connect SaaS rodando na porta ${PORT}`);
  console.log(`📹 WebRTC Signaling ativo em ws://localhost:${PORT}/socket.io`);
  console.log(`🔗 Sala de chamada disponível em http://localhost:${PORT}/call`);
  initStoreDb().catch(err => console.error('[DB-INIT] Falha catastrófica ao iniciar banco da loja:', err));
});
