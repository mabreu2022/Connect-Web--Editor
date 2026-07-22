require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const planosRoutes = require('./routes/planos.routes');
const assinaturasRoutes = require('./routes/assinaturas.routes');
const faturasRoutes = require('./routes/faturas.routes');
const projetosRoutes = require('./routes/projetos.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/planos', planosRoutes);
app.use('/api/assinaturas', assinaturasRoutes);
app.use('/api/faturas', faturasRoutes);
app.use('/api/projetos', projetosRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend Connect SaaS rodando na porta ${PORT}`);
});
