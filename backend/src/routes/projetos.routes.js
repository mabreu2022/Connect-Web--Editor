const express = require('express');
const router = express.Router();
const db = require('../db/firebird');
const { authenticate } = require('../middlewares/auth.middleware');

// GET /api/projetos - Lista projetos do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT PRO_ID, PRO_NOME, PRO_DESCRICAO, PRO_STATUS, PRO_PUBLICADO, PRO_URL_PUB, PRO_CRIADO, PRO_ATUALIZ
       FROM TB_PROJETOS WHERE PRO_USU_ID = ? AND PRO_STATUS = 1 ORDER BY PRO_ATUALIZ DESC`,
      [req.user.usu_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar projetos.' });
  }
});

// GET /api/projetos/:id - Busca projeto com páginas
router.get('/:id', authenticate, async (req, res) => {
  try {
    const projeto = await db.query(
      `SELECT * FROM TB_PROJETOS WHERE PRO_ID = ? AND PRO_USU_ID = ?`,
      [req.params.id, req.user.usu_id]
    );
    if (!projeto || projeto.length === 0) return res.status(404).json({ error: 'Projeto não encontrado.' });

    const paginas = await db.query(
      `SELECT * FROM TB_PAGINAS WHERE PAG_PRO_ID = ? AND PAG_STATUS = 1 ORDER BY PAG_ORDEM`,
      [req.params.id]
    );
    res.json({ ...projeto[0], paginas });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projeto.' });
  }
});

// POST /api/projetos - Criar novo projeto
router.post('/', authenticate, async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do projeto é obrigatório.' });

    await db.execute(
      `INSERT INTO TB_PROJETOS (PRO_USU_ID, PRO_NOME, PRO_DESCRICAO, PRO_STATUS, PRO_DADOS)
       VALUES (?, ?, ?, 1, '{}')`,
      [req.user.usu_id, nome, descricao || '']
    );
    const rows = await db.query(
      `SELECT PRO_ID FROM TB_PROJETOS WHERE PRO_USU_ID = ? AND PRO_NOME = ? ORDER BY PRO_CRIADO DESC ROWS 1`,
      [req.user.usu_id, nome]
    );
    res.status(201).json({ id: rows[0]?.pro_id, message: 'Projeto criado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

// PUT /api/projetos/:id/paginas - Salva todas as páginas de um projeto
router.put('/:id/paginas', authenticate, async (req, res) => {
  try {
    const { paginas } = req.body; // array de PageItem
    if (!Array.isArray(paginas)) return res.status(400).json({ error: 'Dados de páginas inválidos.' });

    for (const pag of paginas) {
      const existe = await db.query('SELECT PAG_ID FROM TB_PAGINAS WHERE PAG_PRO_ID = ? AND PAG_FILENAME = ?', [req.params.id, pag.fileName]);
      if (existe && existe.length > 0) {
        await db.execute(
          `UPDATE TB_PAGINAS SET PAG_NOME=?, PAG_SEO_TITLE=?, PAG_SEO_DESC=?, PAG_SEO_KEYS=?,
           PAG_NODES=?, PAG_ATUALIZ=CURRENT_TIMESTAMP WHERE PAG_ID=?`,
          [pag.title, pag.seo?.title || '', pag.seo?.description || '', pag.seo?.keywords || '',
           JSON.stringify(pag.nodes), existe[0].pag_id]
        );
      } else {
        await db.execute(
          `INSERT INTO TB_PAGINAS (PAG_PRO_ID, PAG_NOME, PAG_FILENAME, PAG_SEO_TITLE, PAG_SEO_DESC, PAG_SEO_KEYS, PAG_NODES, PAG_STATUS, PAG_ORDEM)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [req.params.id, pag.title, pag.fileName, pag.seo?.title || '', pag.seo?.description || '',
           pag.seo?.keywords || '', JSON.stringify(pag.nodes), paginas.indexOf(pag)]
        );
      }
    }

    await db.execute(`UPDATE TB_PROJETOS SET PRO_ATUALIZ=CURRENT_TIMESTAMP WHERE PRO_ID=?`, [req.params.id]);
    res.json({ message: 'Projeto salvo com sucesso!' });
  } catch (err) {
    console.error('[SALVAR PROJETO]', err);
    res.status(500).json({ error: 'Erro ao salvar projeto.' });
  }
});

// DELETE /api/projetos/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.execute(`UPDATE TB_PROJETOS SET PRO_STATUS = 0 WHERE PRO_ID = ? AND PRO_USU_ID = ?`, [req.params.id, req.user.usu_id]);
    res.json({ message: 'Projeto removido.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover projeto.' });
  }
});

module.exports = router;
