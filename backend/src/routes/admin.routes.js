const express = require('express');
const router = express.Router();
const db = require('../db/firebird');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const emailService = require('../services/email.service');

// GET /api/admin/dashboard - KPIs financeiros
router.get('/dashboard', authenticate, adminOnly, async (req, res) => {
  try {
    const [mrr] = await db.query(
      `SELECT COALESCE(SUM(p.PLA_PRECO_MES), 0) AS MRR
       FROM TB_ASSINATURAS a
       JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       WHERE a.ASS_STATUS = 'ativa' AND a.ASS_CICLO = 'mensal'`
    );
    const [totalUsuarios] = await db.query(`SELECT COUNT(*) AS TOTAL FROM TB_USUARIOS WHERE USU_STATUS = 1`);
    const [totalPendentes] = await db.query(`SELECT COUNT(*) AS TOTAL FROM TB_USUARIOS WHERE USU_STATUS = 2`);
    const [totalAtivos] = await db.query(`SELECT COUNT(*) AS TOTAL FROM TB_ASSINATURAS WHERE ASS_STATUS = 'ativa'`);
    const [faturasPendentes] = await db.query(`SELECT COUNT(*) AS TOTAL, COALESCE(SUM(FAT_VALOR_LIQ),0) AS VALOR FROM TB_FATURAS WHERE FAT_STATUS = 'pendente'`);
    const [receitaMes] = await db.query(
      `SELECT COALESCE(SUM(TRA_VALOR),0) AS VALOR FROM TB_TRANSACOES
       WHERE TRA_STATUS = 'aprovada'
       AND EXTRACT(MONTH FROM TRA_CRIADO) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM TRA_CRIADO) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    // Últimas 10 transações
    const ultimasTransacoes = await db.query(
      `SELECT t.TRA_ID, u.USU_NOME, u.USU_EMAIL, t.TRA_VALOR, t.TRA_METODO, t.TRA_STATUS, t.TRA_EXTERNAL, t.TRA_CRIADO
       FROM TB_TRANSACOES t
       JOIN TB_USUARIOS u ON u.USU_ID = t.TRA_USU_ID
       ORDER BY t.TRA_CRIADO DESC ROWS 10`
    );

    // Usuários por plano
    const usuariosPorPlano = await db.query(
      `SELECT p.PLA_NOME, COUNT(a.ASS_ID) AS TOTAL
       FROM TB_ASSINATURAS a
       JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       WHERE a.ASS_STATUS = 'ativa'
       GROUP BY p.PLA_NOME ORDER BY TOTAL DESC`
    );

    res.json({
      mrr: mrr?.mrr || 0,
      arr: (mrr?.mrr || 0) * 12,
      totalUsuarios: totalUsuarios?.total || 0,
      totalPendentes: totalPendentes?.total || 0,
      assinaturasAtivas: totalAtivos?.total || 0,
      faturasPendentes: { quantidade: faturasPendentes?.total || 0, valor: faturasPendentes?.valor || 0 },
      receitaMes: receitaMes?.valor || 0,
      ultimasTransacoes,
      usuariosPorPlano
    });
  } catch (err) {
    console.error('[DASHBOARD]', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
});

// GET /api/admin/usuarios - Lista todos os usuários
router.get('/usuarios', authenticate, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const rows = await db.query(
      `SELECT u.USU_ID, u.USU_NOME, u.USU_EMAIL, u.USU_EMPRESA, u.USU_STATUS, u.USU_CRIADO, u.USU_ULTIMO_AC,
              p.PLA_NOME, a.ASS_STATUS, a.ASS_RENOVACAO, t.TRA_EXTERNAL AS COMPROVANTE_PIX
       FROM TB_USUARIOS u
       LEFT JOIN TB_ASSINATURAS a ON a.ASS_USU_ID = u.USU_ID
       LEFT JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       LEFT JOIN TB_TRANSACOES t ON t.TRA_USU_ID = u.USU_ID
       WHERE (? = '' OR UPPER(u.USU_NOME) CONTAINING UPPER(?) OR UPPER(u.USU_EMAIL) CONTAINING UPPER(?))
       ORDER BY u.USU_CRIADO DESC
       ROWS ? TO ?`,
      [search, search, search, parseInt(offset) + 1, parseInt(offset) + parseInt(limit)]
    );
    res.json({ data: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// POST /api/admin/usuarios/:id/aprovar-pix - Liberação do Admin
router.post('/usuarios/:id/aprovar-pix', authenticate, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Atualiza usuário para ATIVO (USU_STATUS = 1)
    await db.execute('UPDATE TB_USUARIOS SET USU_STATUS = 1 WHERE USU_ID = ?', [userId]);

    // 2. Atualiza assinatura para ATIVA
    await db.execute(
      `UPDATE TB_ASSINATURAS SET ASS_STATUS = 'ativa', ASS_INICIO = CURRENT_DATE, ASS_RENOVACAO = CURRENT_DATE + 30 WHERE ASS_USU_ID = ?`,
      [userId]
    );

    // 3. Atualiza fatura para PAGA
    await db.execute(
      `UPDATE TB_FATURAS SET FAT_STATUS = 'paga', FAT_PAGTO = CURRENT_TIMESTAMP WHERE FAT_USU_ID = ? AND FAT_STATUS = 'pendente'`,
      [userId]
    );

    // 4. Atualiza transação para APROVADA
    await db.execute(
      `UPDATE TB_TRANSACOES SET TRA_STATUS = 'aprovada' WHERE TRA_USU_ID = ? AND TRA_STATUS = 'pendente'`,
      [userId]
    );

    // 5. Notifica usuário por e-mail se possível
    const [user] = await db.query('SELECT USU_NOME, USU_EMAIL FROM TB_USUARIOS WHERE USU_ID = ?', [userId]);
    if (user) {
      emailService.sendWelcome(user.usu_email, user.usu_nome).catch(e => console.error('[EMAIL ACC KILLED]', e));
    }

    res.json({ message: 'Pagamento PIX verificado e acesso liberado com sucesso!' });
  } catch (err) {
    console.error('[APROVAR PIX]', err);
    res.status(500).json({ error: 'Erro ao aprovar pagamento PIX.' });
  }
});

// PATCH /api/admin/usuarios/:id/status - Bloquear/Ativar/Pendente manual
router.patch('/usuarios/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE TB_USUARIOS SET USU_STATUS = ? WHERE USU_ID = ?', [status, req.params.id]);
    res.json({ message: 'Status atualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

// GET /api/admin/planos - Lista planos
router.get('/planos', authenticate, adminOnly, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM TB_PLANOS ORDER BY PLA_ORDEM');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar planos.' });
  }
});

// PUT /api/admin/planos/:id - Atualiza plano
router.put('/planos/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { nome, descricao, preco_mes, preco_ano, max_pag, max_proj, max_exp, destaque, ativo } = req.body;
    await db.execute(
      `UPDATE TB_PLANOS SET PLA_NOME=?, PLA_DESCRICAO=?, PLA_PRECO_MES=?, PLA_PRECO_ANO=?,
       PLA_MAX_PAG=?, PLA_MAX_PROJ=?, PLA_MAX_EXP=?, PLA_DESTAQUE=?, PLA_ATIVO=?
       WHERE PLA_ID=?`,
      [nome, descricao, preco_mes, preco_ano, max_pag, max_proj, max_exp, destaque, ativo, req.params.id]
    );
    res.json({ message: 'Plano atualizado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar plano.' });
  }
});

// GET /api/admin/faturas
router.get('/faturas', authenticate, adminOnly, async (req, res) => {
  try {
    const { status = '' } = req.query;
    const rows = await db.query(
      `SELECT f.FAT_ID, f.FAT_NUMERO, f.FAT_VALOR_LIQ, f.FAT_STATUS, f.FAT_VENCTO, f.FAT_PAGTO, f.FAT_PERIODO,
              u.USU_ID, u.USU_NOME, u.USU_EMAIL, p.PLA_NOME, t.TRA_EXTERNAL AS COMPROVANTE_PIX
       FROM TB_FATURAS f
       JOIN TB_USUARIOS u ON u.USU_ID = f.FAT_USU_ID
       JOIN TB_ASSINATURAS a ON a.ASS_ID = f.FAT_ASS_ID
       JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       LEFT JOIN TB_TRANSACOES t ON t.TRA_FAT_ID = f.FAT_ID
       WHERE (? = '' OR f.FAT_STATUS = ?)
       ORDER BY f.FAT_CRIADO DESC ROWS 100`,
      [status, status]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar faturas.' });
  }
});
// GET /api/admin/config-pix - Busca chave PIX atual do admin
router.get('/config-pix', authenticate, adminOnly, async (req, res) => {
  try {
    let chave = 'pix@connectwebeditor.com.br';
    let nome = 'Connect Web Editor';
    let cidade = 'Sao Paulo';

    try {
      const rows = await db.query('SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG');
      rows.forEach(r => {
        if (r.cfg_chave === 'PIX_CHAVE') chave = r.cfg_valor;
        if (r.cfg_chave === 'PIX_NOME') nome = r.cfg_valor;
        if (r.cfg_chave === 'PIX_CIDADE') cidade = r.cfg_valor;
      });
    } catch (e) {
      // Se a tabela ainda não existir no Firebird
    }

    res.json({ chavePix: chave, nomeRecebedor: nome, cidadeRecebedor: cidade });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configuração PIX.' });
  }
});

// PUT /api/admin/config-pix - Salva chave PIX do admin
router.put('/config-pix', authenticate, adminOnly, async (req, res) => {
  try {
    const { chavePix, nomeRecebedor, cidadeRecebedor } = req.body;
    if (!chavePix) return res.status(400).json({ error: 'Chave PIX é obrigatória.' });

    // Garante tabela TB_CONFIG se não existir
    try {
      await db.execute('CREATE TABLE TB_CONFIG (CFG_CHAVE VARCHAR(50) PRIMARY KEY, CFG_VALOR VARCHAR(500))');
    } catch (e) {}

    const saveCfg = async (k, v) => {
      const ex = await db.query('SELECT CFG_CHAVE FROM TB_CONFIG WHERE CFG_CHAVE = ?', [k]);
      if (ex && ex.length > 0) {
        await db.execute('UPDATE TB_CONFIG SET CFG_VALOR = ? WHERE CFG_CHAVE = ?', [v || '', k]);
      } else {
        await db.execute('INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (?, ?)', [k, v || '']);
      }
    };

    await saveCfg('PIX_CHAVE', chavePix);
    await saveCfg('PIX_NOME', nomeRecebedor || 'Connect Web Editor');
    await saveCfg('PIX_CIDADE', cidadeRecebedor || 'Sao Paulo');

    res.json({ message: 'Chave PIX salva com sucesso!' });
  } catch (err) {
    console.error('[SAVE PIX CONFIG]', err);
    res.status(500).json({ error: 'Erro ao salvar chave PIX.' });
  }
});

module.exports = router;
