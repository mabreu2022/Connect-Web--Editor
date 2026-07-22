const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/firebird');
const emailService = require('../services/email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'connect_saas_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

    const rows = await db.query(
      `SELECT u.USU_ID, u.USU_NOME, u.USU_EMAIL, u.USU_SENHA, u.USU_PERFIL, u.USU_STATUS, u.USU_EMPRESA,
              a.ASS_STATUS, p.PLA_NOME, p.PLA_MAX_PAG, p.PLA_MAX_PROJ, p.PLA_MAX_EXP
       FROM TB_USUARIOS u
       LEFT JOIN TB_ASSINATURAS a ON a.ASS_USU_ID = u.USU_ID AND a.ASS_STATUS IN ('ativa', 'pendente')
       LEFT JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       WHERE u.USU_EMAIL = ?`, [email]
    );

    if (!rows || rows.length === 0) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const user = rows[0];

    const senhaOk = await bcrypt.compare(senha, user.usu_senha);
    if (!senhaOk) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    // Verifica status do usuário
    if (user.usu_status === 0) {
      return res.status(403).json({ error: 'Sua conta está bloqueada pelo administrador.' });
    }
    if (user.usu_status === 2) {
      return res.status(403).json({ 
        error: 'Sua conta está aguardando liberação do administrador após a verificação do pagamento PIX.' 
      });
    }

    // Atualiza último acesso
    await db.execute('UPDATE TB_USUARIOS SET USU_ULTIMO_AC = CURRENT_TIMESTAMP WHERE USU_ID = ?', [user.usu_id]);

    const token = jwt.sign({ id: user.usu_id, perfil: user.usu_perfil }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({
      token,
      user: {
        id: user.usu_id,
        nome: user.usu_nome,
        email: user.usu_email,
        empresa: user.usu_empresa,
        perfil: user.usu_perfil,
        plano: user.pla_nome || 'Gratuito',
        limites: {
          maxPaginas: user.pla_max_pag ?? 3,
          maxProjetos: user.pla_max_proj ?? 1,
          maxExportacoes: user.pla_max_exp ?? 5,
        }
      }
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
}

// POST /api/auth/registro
async function registro(req, res) {
  try {
    const { nome, email, senha, empresa, planoId = 2, comprovantePix = '' } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    if (senha.length < 6) return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });

    // Verifica duplicado
    const existe = await db.query('SELECT USU_ID FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email]);
    if (existe && existe.length > 0) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });

    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere usuário com STATUS = 2 (Pendente de aprovação/liberação do Admin)
    await db.execute(
      `INSERT INTO TB_USUARIOS (USU_NOME, USU_EMAIL, USU_SENHA, USU_EMPRESA, USU_PERFIL, USU_STATUS, USU_EMAIL_VER)
       VALUES (?, ?, ?, ?, 0, 2, 0)`,
      [nome, email, senhaHash, empresa || '']
    );

    // Busca ID criado
    const newUser = await db.query('SELECT USU_ID FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email]);
    const userId = newUser[0].usu_id;

    // Busca plano selecionado
    const plano = await db.query('SELECT * FROM TB_PLANOS WHERE PLA_ID = ?', [planoId]);
    const selectedPlano = plano[0] || { pla_id: 1, pla_preco_mes: 0, pla_nome: 'Gratuito' };

    // Cria assinatura pendente
    await db.execute(
      `INSERT INTO TB_ASSINATURAS (ASS_USU_ID, ASS_PLA_ID, ASS_STATUS, ASS_INICIO, ASS_CICLO)
       VALUES (?, ?, 'pendente', CURRENT_DATE, 'mensal')`,
      [userId, selectedPlano.pla_id]
    );

    const ass = await db.query('SELECT ASS_ID FROM TB_ASSINATURAS WHERE ASS_USU_ID = ? ORDER BY ASS_ID DESC ROWS 1', [userId]);
    const assId = ass[0]?.ass_id;

    // Cria Fatura pendente
    await db.execute(
      `INSERT INTO TB_FATURAS (FAT_ASS_ID, FAT_USU_ID, FAT_VALOR, FAT_VALOR_LIQ, FAT_STATUS, FAT_VENCTO, FAT_DESCRICAO, FAT_PERIODO)
       VALUES (?, ?, ?, ?, 'pendente', CURRENT_DATE + 3, ?, ?)`,
      [assId, userId, selectedPlano.pla_preco_mes, selectedPlano.pla_preco_mes, 
       `Plano ${selectedPlano.pla_nome} - PIX enviado: ${comprovantePix || 'Pendente'}`, 
       'Mensalidade Inicial']
    );

    const fat = await db.query('SELECT FAT_ID FROM TB_FATURAS WHERE FAT_USU_ID = ? ORDER BY FAT_ID DESC ROWS 1', [userId]);
    const fatId = fat[0]?.fat_id;

    // Registra Transação PIX Pendente
    await db.execute(
      `INSERT INTO TB_TRANSACOES (TRA_FAT_ID, TRA_USU_ID, TRA_VALOR, TRA_TIPO, TRA_METODO, TRA_STATUS, TRA_GATEWAY, TRA_EXTERNAL)
       VALUES (?, ?, ?, 'pagamento', 'PIX', 'pendente', 'pix.js', ?)`,
      [fatId, userId, selectedPlano.pla_preco_mes, comprovantePix || 'Aguardando Comprovante']
    );

    res.status(201).json({ 
      pending: true,
      message: 'Conta registrada com sucesso! Seu pagamento PIX / cadastro está pendente de aprovação. O administrador liberará seu acesso em breve.' 
    });
  } catch (err) {
    console.error('[REGISTRO]', err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
}

// POST /api/auth/recuperar-senha
async function recuperarSenha(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    const rows = await db.query('SELECT USU_ID, USU_NOME FROM TB_USUARIOS WHERE USU_EMAIL = ?', [email]);
    if (!rows || rows.length === 0) return res.json({ message: 'Se o e-mail existir, você receberá um link de recuperação.' });

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 3600000);

    await db.execute(
      `UPDATE TB_USUARIOS SET USU_TOK_RESET = ?, USU_TOK_EXPIR = ? WHERE USU_ID = ?`,
      [token, expiracao, user.usu_id]
    );

    await emailService.sendPasswordReset(email, user.usu_nome, token);
    res.json({ message: 'Link de recuperação enviado para seu e-mail.' });
  } catch (err) {
    console.error('[RECUPERAR SENHA]', err);
    res.status(500).json({ error: 'Erro ao enviar e-mail de recuperação.' });
  }
}

// POST /api/auth/redefinir-senha
async function redefinirSenha(req, res) {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });

    const rows = await db.query(
      `SELECT USU_ID FROM TB_USUARIOS WHERE USU_TOK_RESET = ? AND USU_TOK_EXPIR > CURRENT_TIMESTAMP`,
      [token]
    );

    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Token inválido ou expirado.' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await db.execute(
      `UPDATE TB_USUARIOS SET USU_SENHA = ?, USU_TOK_RESET = NULL, USU_TOK_EXPIR = NULL WHERE USU_ID = ?`,
      [senhaHash, rows[0].usu_id]
    );

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('[REDEFINIR SENHA]', err);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const rows = await db.query(
      `SELECT u.USU_ID, u.USU_NOME, u.USU_EMAIL, u.USU_EMPRESA, u.USU_TELEFONE, u.USU_PERFIL, u.USU_STATUS,
              p.PLA_NOME, p.PLA_MAX_PAG, p.PLA_MAX_PROJ, p.PLA_MAX_EXP, a.ASS_STATUS, a.ASS_RENOVACAO
       FROM TB_USUARIOS u
       LEFT JOIN TB_ASSINATURAS a ON a.ASS_USU_ID = u.USU_ID AND a.ASS_STATUS IN ('ativa', 'pendente')
       LEFT JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       WHERE u.USU_ID = ?`, [req.user.usu_id]
    );

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const u = rows[0];
    res.json({
      id: u.usu_id, nome: u.usu_nome, email: u.usu_email,
      empresa: u.usu_empresa, telefone: u.usu_telefone, perfil: u.usu_perfil, status: u.usu_status,
      plano: u.pla_nome || 'Gratuito',
      assinatura: { status: u.ass_status || 'gratuita', renovacao: u.ass_renovacao },
      limites: { maxPaginas: u.pla_max_pag ?? 3, maxProjetos: u.pla_max_proj ?? 1, maxExportacoes: u.pla_max_exp ?? 5 }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
}

module.exports = { login, registro, recuperarSenha, redefinirSenha, me };
