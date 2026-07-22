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

// GET /api/admin/config-bot - Busca configurações do Bot e QAP WhatsApp do Firebird DB
router.get('/config-bot', async (req, res) => {
  try {
    let qapPhone = '';
    let startTime = '08:00';
    let endTime = '18:00';
    let outOfHoursMessage = '🔴 Nosso atendimento ao vivo funciona das 08:00 às 18:00. Deixe sua mensagem!';
    let backendPublicUrl = process.env.BACKEND_PUBLIC_URL || '';
    let faqList = [
      { id: 'faq_1', keywords: ['preço', 'valor', 'plano'], reply: '💡 Nossos planos custam a partir de R$ 149,90/mês com 5 dias grátis.' },
      { id: 'faq_2', keywords: ['suporte', 'atendimento', 'contato'], reply: '📞 Atendimento de Segunda a Sexta das 08h às 18h.' }
    ];

    try {
      // Garante tabela TB_CONFIG no Firebird DB
      await db.execute('CREATE TABLE TB_CONFIG (CFG_CHAVE VARCHAR(50) PRIMARY KEY, CFG_VALOR VARCHAR(2000))');
    } catch (e) {}

    try {
      const rows = await db.query('SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG');
      rows.forEach(r => {
        const k = (r.cfg_chave || r.CFG_CHAVE || '').toUpperCase();
        const v = r.cfg_valor || r.CFG_VALOR || '';
        if (k === 'QAP_PHONE') qapPhone = v;
        if (k === 'BOT_START_TIME') startTime = v;
        if (k === 'BOT_END_TIME') endTime = v;
        if (k === 'BOT_OUT_HOURS_MSG') outOfHoursMessage = v;
        if (k === 'BACKEND_PUBLIC_URL') backendPublicUrl = v;
        if (k === 'BOT_FAQ_JSON' && v) {
          try { faqList = JSON.parse(v); } catch (err) {}
        }
      });
    } catch (e) {}

    res.json({ qapPhone, startTime, endTime, outOfHoursMessage, faqList, backendPublicUrl });
  } catch (err) {
    console.error('[GET BOT CONFIG DB]', err);
    res.status(500).json({ error: 'Erro ao buscar configuração do Bot.' });
  }
});

// PUT /api/admin/config-bot - Grava configurações do Bot e QAP WhatsApp no Firebird DB
router.put('/config-bot', async (req, res) => {
  try {
    const { qapPhone, startTime, endTime, outOfHoursMessage, faqList, backendPublicUrl } = req.body;

    try {
      await db.execute('CREATE TABLE TB_CONFIG (CFG_CHAVE VARCHAR(50) PRIMARY KEY, CFG_VALOR VARCHAR(2000))');
    } catch (e) {}

    const saveCfg = async (k, v) => {
      const ex = await db.query('SELECT CFG_CHAVE FROM TB_CONFIG WHERE CFG_CHAVE = ?', [k]);
      if (ex && ex.length > 0) {
        await db.execute('UPDATE TB_CONFIG SET CFG_VALOR = ? WHERE CFG_CHAVE = ?', [v || '', k]);
      } else {
        await db.execute('INSERT INTO TB_CONFIG (CFG_CHAVE, CFG_VALOR) VALUES (?, ?)', [k, v || '']);
      }
    };

    if (qapPhone !== undefined) await saveCfg('QAP_PHONE', qapPhone);
    if (startTime !== undefined) await saveCfg('BOT_START_TIME', startTime);
    if (endTime !== undefined) await saveCfg('BOT_END_TIME', endTime);
    if (outOfHoursMessage !== undefined) await saveCfg('BOT_OUT_HOURS_MSG', outOfHoursMessage);
    if (faqList !== undefined) await saveCfg('BOT_FAQ_JSON', JSON.stringify(faqList));
    if (backendPublicUrl !== undefined) await saveCfg('BACKEND_PUBLIC_URL', backendPublicUrl);

    res.json({ message: 'Configurações do Bot e QAP gravadas com sucesso no banco de dados Firebird!' });
  } catch (err) {
    console.error('[SAVE BOT CONFIG DB]', err);
    res.status(500).json({ error: 'Erro ao gravar configurações do Bot no Firebird DB.' });
  }
});

const qapService = require('../services/qapService');

// POST /api/admin/qap/call - Inicia chamada de vídeo/áudio via QAP Messenger API
router.post('/qap/call', async (req, res) => {
  try {
    const { phone, type = 'video' } = req.body;
    const result = await qapService.startCall(phone, type);
    res.json(result);
  } catch (err) {
    console.error('[QAP CALL ERROR]', err);
    res.status(500).json({ error: 'Erro ao iniciar chamada QAP.' });
  }
});

// POST /api/admin/qap/message - Envia mensagem via QAP Messenger API
router.post('/qap/message', async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await qapService.sendMessage(phone, message);
    res.json(result);
  } catch (err) {
    console.error('[QAP MESSAGE ERROR]', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem QAP.' });
  }
});


// POST /api/admin/qap/video-call - Cria sala WebRTC e envia link pelo QAP para o atendente
router.post('/qap/video-call', async (req, res) => {
  try {
    const { phone, siteUrl } = req.body;
    if (!phone) return res.status(400).json({ error: 'Número do atendente não informado.' });

    const { v4: uuidv4 } = require('uuid');
    const roomId = uuidv4();

    // Busca BACKEND_PUBLIC_URL do banco de dados (configurado no Painel Admin)
    let backendPublicUrl = process.env.BACKEND_PUBLIC_URL || '';
    try {
      const rows = await db.query("SELECT CFG_VALOR FROM TB_CONFIG WHERE CFG_CHAVE = 'BACKEND_PUBLIC_URL'");
      if (rows && rows.length > 0) {
        const dbUrl = rows[0].cfg_valor || rows[0].CFG_VALOR || '';
        if (dbUrl) backendPublicUrl = dbUrl;
      }
    } catch (e) { /* Ignora se tabela não existir ainda */ }

    const base = backendPublicUrl || siteUrl || `http://localhost:${process.env.PORT || 3001}`;
    const callLink = `${base}/call?room=${roomId}`;

    // Envia mensagem QAP para o atendente com o link da sala
    const msgText =
      `📹 *CHAMADA DE VÍDEO RECEBIDA*\n` +
      `Um visitante do seu site quer falar com você!\n\n` +
      `▶️ Toque aqui para atender:\n${callLink}\n\n` +
      `_(Abra o link no navegador do celular para iniciar o vídeo)_`;

    const qapResult = await qapService.sendMessage(phone, msgText);

    res.json({
      success: true,
      roomId,
      callLink,
      qap: qapResult
    });
  } catch (err) {
    console.error('[QAP VIDEO-CALL ERROR]', err);
    res.status(500).json({ error: 'Erro ao criar sala de chamada.', detail: err.message });
  }
});

module.exports = router;
