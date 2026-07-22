const express = require('express');
const router = express.Router();
const db = require('../db/firebird');
const { authenticate } = require('../middlewares/auth.middleware');
const PixGenerator = require('../utils/pix');

// GET /api/planos - Todos os planos ativos (público)
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM TB_PLANOS WHERE PLA_ATIVO = 1 ORDER BY PLA_ORDEM');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar planos.' });
  }
});

// GET /api/planos/gerar-pix - Gera QR Code e Copia e Cola via pix.js com a Chave PIX do Admin
router.get('/gerar-pix', async (req, res) => {
  try {
    const { planoId, valor } = req.query;
    
    // Busca configurações de PIX do admin no banco (fallback para padrões)
    let pixChave = 'pix@connectwebeditor.com.br';
    let pixNome = 'Connect Web Editor';
    let pixCidade = 'Sao Paulo';

    try {
      const configs = await db.query('SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG');
      configs.forEach(c => {
        if (c.cfg_chave === 'PIX_CHAVE' && c.cfg_valor) pixChave = c.cfg_valor;
        if (c.cfg_chave === 'PIX_NOME' && c.cfg_valor) pixNome = c.cfg_valor;
        if (c.cfg_chave === 'PIX_CIDADE' && c.cfg_valor) pixCidade = c.cfg_valor;
      });
    } catch (e) {
      // Se a tabela ainda não existir, usa padrão
    }

    let finalValor = parseFloat(valor || 0);
    if (!finalValor && planoId) {
      const plano = await db.query('SELECT PLA_PRECO_MES FROM TB_PLANOS WHERE PLA_ID = ?', [planoId]);
      if (plano && plano[0]) finalValor = parseFloat(plano[0].pla_preco_mes);
    }

    if (!finalValor || finalValor <= 0) {
      finalValor = 1.00; // Valor simbólico de teste se for 0
    }

    const generator = new PixGenerator(pixChave, pixNome, pixCidade);
    const result = await generator.generateQRCode(finalValor, 'CWE' + Date.now().toString().slice(-6));

    res.json({
      chavePix: pixChave,
      nomeRecebedor: pixNome,
      cidadeRecebedor: pixCidade,
      valor: finalValor,
      payload: result.payload,
      qrCode: result.qrCode
    });
  } catch (err) {
    console.error('[GERAR PIX ERR]', err);
    res.status(500).json({ error: 'Erro ao gerar QR Code PIX: ' + err.message });
  }
});

// GET /api/planos/meu - Plano do usuário logado
router.get('/meu', authenticate, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT p.*, a.ASS_STATUS, a.ASS_INICIO, a.ASS_RENOVACAO, a.ASS_CICLO
       FROM TB_ASSINATURAS a JOIN TB_PLANOS p ON p.PLA_ID = a.ASS_PLA_ID
       WHERE a.ASS_USU_ID = ? AND a.ASS_STATUS = 'ativa' ROWS 1`, [req.user.usu_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar seu plano.' });
  }
});

module.exports = router;
