const jwt = require('jsonwebtoken');
const db = require('../db/firebird');

const JWT_SECRET = process.env.JWT_SECRET || 'connect_saas_secret';

/**
 * Middleware: verifica se o token JWT é válido
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Busca usuário no banco para garantir que ainda está ativo
    const rows = await db.query(
      'SELECT USU_ID, USU_NOME, USU_EMAIL, USU_PERFIL, USU_STATUS FROM TB_USUARIOS WHERE USU_ID = ?',
      [decoded.id]
    );
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }
    const user = rows[0];
    if (user.usu_status === 0) {
      return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Middleware: apenas administradores (USU_PERFIL = 1)
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.usu_perfil !== 1) {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { authenticate, adminOnly };
