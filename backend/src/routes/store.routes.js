const express = require('express');
const router = express.Router();
const db = require('../db/firebird');
const { authenticate, adminOnly } = require('../middlewares/auth.middleware');
const PixGenerator = require('../utils/pix');
const axios = require('axios');

// GET /api/store/components - Listar componentes da loja com status de aquisição do usuário
router.get('/components', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Obtenção do ID do usuário logado do token/middleware

    const rows = await db.query(
      `SELECT c.COM_ID, c.COM_TITLE, c.COM_DESCRIPTION, c.COM_CATEGORY, c.COM_PRICE, c.COM_THUMBNAIL_URL, c.COM_PAYLOAD,
              (SELECT COUNT(*) FROM TB_USER_COMPONENTS u WHERE u.USC_USU_ID = ? AND u.USC_COM_ID = c.COM_ID) AS ADQUIRIDO,
              (SELECT COUNT(*) FROM TB_ORDERS o WHERE o.ORD_USU_ID = ? AND o.ORD_COM_ID = c.COM_ID AND o.ORD_STATUS = 'pending') AS PENDENTE
       FROM TB_COMPONENTS c
       ORDER BY c.COM_TITLE ASC`,
      [userId, userId]
    );

    // Ajusta formato dos dados booleanos
    const components = rows.map(row => ({
      id: row.com_id,
      title: row.com_title,
      description: row.com_description,
      category: row.com_category,
      price: parseFloat(row.com_price || 0),
      thumbnail_url: row.com_thumbnail_url,
      component_payload: row.com_payload, // JSON string do BLOB
      adquirido: (row.adquirido || 0) > 0,
      pendente: (row.pendente || 0) > 0
    }));

    res.json(components);
  } catch (err) {
    console.error('[GET-STORE-COMPONENTS]', err);
    res.status(500).json({ error: 'Erro ao listar componentes da loja.' });
  }
});

// GET /api/store/components/:id/payment - Gerar dados do Pix (Copia e Cola + QR Code) para um componente
router.get('/components/:id/payment', authenticate, async (req, res) => {
  try {
    const compId = req.params.id;

    // 1. Buscar o componente para pegar o preço
    const compRows = await db.query('SELECT COM_TITLE, COM_PRICE FROM TB_COMPONENTS WHERE COM_ID = ?', [compId]);
    if (compRows.length === 0) {
      return res.status(404).json({ error: 'Componente não localizado.' });
    }
    const component = compRows[0];
    const price = parseFloat(component.com_price || 0);

    // 2. Buscar configurações do PIX do administrador no banco
    let chavePix = '';
    let nomeRecebedor = 'Connect Web Editor';
    let cidadeRecebedor = 'Sao Paulo';

    try {
      const rows = await db.query("SELECT CFG_CHAVE, CFG_VALOR FROM TB_CONFIG WHERE CFG_CHAVE IN ('PIX_CHAVE', 'PIX_NOME', 'PIX_CIDADE')");
      rows.forEach(r => {
        const k = (r.cfg_chave || r.CFG_CHAVE || '').toUpperCase();
        const v = r.cfg_valor || r.CFG_VALOR || '';
        if (k === 'PIX_CHAVE') chavePix = v;
        if (k === 'PIX_NOME') nomeRecebedor = v;
        if (k === 'PIX_CIDADE') cidadeRecebedor = v;
      });
    } catch (e) {
      console.warn('Erro ao buscar chaves PIX de config, usando defaults:', e);
    }

    if (!chavePix) {
      chavePix = 'pix-connect-web@exemplo.com.br';
    }

    // 3. Gerar Pix Copia e Cola e imagem do QR Code
    const generator = new PixGenerator(chavePix, nomeRecebedor, cidadeRecebedor);
    const pixData = await generator.generateQRCode(price, `COMP${compId}`);

    res.json({
      title: component.com_title,
      price: price,
      chavePix: chavePix,
      pixCopiaCola: pixData.payload,
      qrCodeBase64: pixData.qrCode
    });

  } catch (err) {
    console.error('[GET-COMPONENT-PIX-PAYMENT]', err);
    res.status(500).json({ error: 'Erro ao gerar dados de pagamento via Pix.' });
  }
});

// POST /api/store/checkout - Solicitar compra de um componente via PIX
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { componentId, comprovante } = req.body;

    if (!componentId) {
      return res.status(400).json({ error: 'ID do componente é obrigatório.' });
    }
    if (!comprovante) {
      return res.status(400).json({ error: 'Envio do comprovante é obrigatório.' });
    }

    // 1. Verificar se componente existe
    const compRows = await db.query('SELECT * FROM TB_COMPONENTS WHERE COM_ID = ?', [componentId]);
    if (compRows.length === 0) {
      return res.status(404).json({ error: 'Componente não localizado no catálogo.' });
    }

    // 2. Verificar se já possui
    const ownRows = await db.query(
      'SELECT USC_ID FROM TB_USER_COMPONENTS WHERE USC_USU_ID = ? AND USC_COM_ID = ?',
      [userId, componentId]
    );
    if (ownRows.length > 0) {
      return res.status(400).json({ error: 'Você já possui esse componente desbloqueado.' });
    }

    // 3. Verificar se já tem pedido pendente
    const pendingRows = await db.query(
      "SELECT ORD_ID FROM TB_ORDERS WHERE ORD_USU_ID = ? AND ORD_COM_ID = ? AND ORD_STATUS = 'pending'",
      [userId, componentId]
    );
    if (pendingRows.length > 0) {
      return res.status(400).json({ error: 'Você já possui um pedido pendente de aprovação para este componente.' });
    }

    // 4. Salvar pedido com comprovante
    await db.execute(
      `INSERT INTO TB_ORDERS (ORD_USU_ID, ORD_COM_ID, ORD_STATUS, ORD_COMPROVANTE, ORD_CRIADO, ORD_ATUALIZ)
       VALUES (?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, componentId, comprovante]
    );

    res.json({ success: true, message: 'Comprovante enviado com sucesso! Aguarde a aprovação do administrador.' });
  } catch (err) {
    console.error('[STORE-CHECKOUT]', err);
    res.status(500).json({ error: 'Erro ao processar pedido de compra.' });
  }
});

// GET /api/store/admin/orders - Admin: Listar pedidos pendentes
router.get('/admin/orders', authenticate, adminOnly, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT o.ORD_ID, o.ORD_STATUS, o.ORD_COMPROVANTE, o.ORD_CRIADO,
              u.USU_ID, u.USU_NOME, u.USU_EMAIL,
              c.COM_ID, c.COM_TITLE, c.COM_PRICE
       FROM TB_ORDERS o
       JOIN TB_USUARIOS u ON u.USU_ID = o.ORD_USU_ID
       JOIN TB_COMPONENTS c ON c.COM_ID = o.ORD_COM_ID
       ORDER BY o.ORD_CRIADO DESC`
    );

    const orders = rows.map(r => ({
      id: r.ord_id,
      status: r.ord_status,
      comprovante: r.ord_comprovante,
      criado: r.ord_criado,
      usuario: {
        id: r.usu_id,
        nome: r.usu_nome,
        email: r.usu_email
      },
      componente: {
        id: r.com_id,
        title: r.com_title,
        price: parseFloat(r.com_price || 0)
      }
    }));

    res.json(orders);
  } catch (err) {
    console.error('[ADMIN-GET-ORDERS]', err);
    res.status(500).json({ error: 'Erro ao carregar lista de pedidos.' });
  }
});

// POST /api/store/admin/orders/:id/approve - Admin: Aprovar pedido
router.post('/admin/orders/:id/approve', authenticate, adminOnly, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Buscar pedido correspondente
    const orderRows = await db.query('SELECT * FROM TB_ORDERS WHERE ORD_ID = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Pedido não localizado.' });
    }

    const order = orderRows[0];
    if (order.ord_status !== 'pending') {
      return res.status(400).json({ error: `Este pedido já foi finalizado com o status: ${order.ord_status}` });
    }

    // Executar aprovação e concessão dentro de uma transação isolada
    await db.transaction(async (tx) => {
      // 1. Atualizar status do pedido para approved
      await new Promise((resolve, reject) => {
        tx.execute(
          "UPDATE TB_ORDERS SET ORD_STATUS = 'approved', ORD_ATUALIZ = CURRENT_TIMESTAMP WHERE ORD_ID = ?",
          [orderId],
          (err) => (err ? reject(err) : resolve())
        );
      });

      // 2. Conceder acesso perpetuo inserindo na tabela TB_USER_COMPONENTS (Ignorando se já existir via constraint UNIQUE)
      await new Promise((resolve, reject) => {
        tx.execute(
          `INSERT INTO TB_USER_COMPONENTS (USC_USU_ID, USC_COM_ID, USC_CONCEDIDO)
           VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [order.ord_usu_id, order.ord_com_id],
          (err) => {
            // Se der erro de Unique Constraint, ignoramos pois o usuário já possui acesso. Senão, rejeitamos.
            if (err && !err.message.includes('unique') && !err.message.includes('UNQ_')) {
              return reject(err);
            }
            resolve();
          }
        );
      });
    });

    res.json({ success: true, message: 'Pedido aprovado e componente liberado com sucesso!' });
  } catch (err) {
    console.error('[ADMIN-APPROVE-ORDER]', err);
    res.status(500).json({ error: 'Erro ao aprovar pedido.' });
  }
});

// POST /api/store/admin/orders/:id/reject - Admin: Rejeitar pedido
router.post('/admin/orders/:id/reject', authenticate, adminOnly, async (req, res) => {
  try {
    const orderId = req.params.id;

    const orderRows = await db.query('SELECT * FROM TB_ORDERS WHERE ORD_ID = ?', [orderId]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Pedido não localizado.' });
    }

    const order = orderRows[0];
    if (order.ord_status !== 'pending') {
      return res.status(400).json({ error: `Este pedido já possui o status: ${order.ord_status}` });
    }

    await db.execute(
      "UPDATE TB_ORDERS SET ORD_STATUS = 'rejected', ORD_ATUALIZ = CURRENT_TIMESTAMP WHERE ORD_ID = ?",
      [orderId]
    );

    res.json({ success: true, message: 'Pedido rejeitado.' });
  } catch (err) {
    console.error('[ADMIN-REJECT-ORDER]', err);
    res.status(500).json({ error: 'Erro ao rejeitar pedido.' });
  }
});

// POST /api/store/admin/components - Admin: Criar novos componentes para venda na Loja
router.post('/admin/components', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, description, category, price, thumbnail_url, component_payload } = req.body;

    if (!title || !category || !price || !component_payload) {
      return res.status(400).json({ error: 'Título, categoria, preço e estrutura JSON do componente são obrigatórios.' });
    }

    // Se o payload vier como objeto, convertemos para string JSON
    const payloadStr = typeof component_payload === 'string'
      ? component_payload
      : JSON.stringify(component_payload);

    await db.execute(
      `INSERT INTO TB_COMPONENTS (COM_TITLE, COM_DESCRIPTION, COM_CATEGORY, COM_PRICE, COM_THUMBNAIL_URL, COM_PAYLOAD)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || '', category, parseFloat(price), thumbnail_url || '', payloadStr]
    );

    res.json({ success: true, message: 'Novo componente criado e disponibilizado na Loja com sucesso!' });
  } catch (err) {
    console.error('[ADMIN-CREATE-COMPONENT]', err);
    res.status(500).json({ error: 'Erro ao cadastrar novo componente.' });
  }
});

// POST /api/store/admin/generate-component - Gerar componente usando IA (Gemini, OpenAI, Groq ou Ollama)
router.post('/admin/generate-component', authenticate, adminOnly, async (req, res) => {
  try {
    const { description, provider = 'gemini', apiKey: customApiKey, model, ollamaUrl } = req.body;
    
    let apiKey = customApiKey;
    if (!apiKey) {
      if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY;
      else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
      else if (provider === 'groq') apiKey = process.env.GROQ_API_KEY;
    }

    if (!description) {
      return res.status(400).json({ error: 'A descrição do componente é obrigatória.' });
    }

    const systemPrompt = `Você é um arquiteto especialista em front-end e web design premium. Sua tarefa é ler a descrição de um componente web em formato livre ou markdown e gerar a estrutura JSON completa compatível com o Connect Web Editor.

O JSON retornado DEVE seguir estritamente o formato de objeto abaixo:
{
  "title": "Título comercial do componente",
  "description": "Descrição comercial curta contendo as principais características",
  "category": "sections" | "forms" | "ui" | "templates",
  "price": 19.90,
  "thumbnail_url": "uma URL de imagem do unsplash relacionada ao componente",
  "component_payload": {
    "id": "el_root",
    "type": "container" | "section" | "heading" | "paragraph" | "image" | "link" | "button" | "form" | "grid-2" | "grid-3" | "card",
    "tagName": "div" | "section" | "h1" | "h2" | "p" | "img" | "a" | "button" | "form",
    "label": "Nome amigável do nó",
    "content": "Conteúdo de texto se aplicável (ex: título, parágrafo, texto do botão)",
    "attributes": {},
    "styles": {
      "display": "flex",
      "flexDirection": "column",
      "padding": "24px",
      "backgroundColor": "#1e293b",
      "color": "#ffffff",
      "fontFamily": "sans-serif",
      "borderRadius": "8px"
    },
    "children": []
  }
}

Regras obrigatórias:
1. O nó raiz (component_payload) DEVE ter id "el_root".
2. Todos os nós filhos (children) recursivos devem ter IDs no formato "el_xxxxxxx" onde xxxxxxx é um código alfanumérico aleatório de 7 caracteres.
3. Use estilos CSS inline bonitos (cores modernas, sombras shadow, bordas suaves, layouts flex/grid limpos) em camelCase (ex: backgroundColor, borderRadius, justifyContent, alignItems, flexWrap, gap, minHeight, maxWidth, transition, boxShadow).
4. Crie estruturas complexas, organizadas e visualmente ricas com containers, headings, parágrafos, botões e imagens adequados.
5. Retorne APENAS o JSON puro, sem comentários ou blocos de código markdown.

Descrição do usuário: "${description}"`;

    let generatedText = '';

    if (provider === 'gemini') {
      if (!apiKey) {
        return res.status(400).json({ error: 'Chave API do Gemini não configurada.' });
      }
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }
      );
      generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } 
    else if (provider === 'openai') {
      if (!apiKey) {
        return res.status(400).json({ error: 'Chave API da OpenAI não configurada.' });
      }
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: systemPrompt }],
          response_format: { type: 'json_object' }
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      generatedText = response.data?.choices?.[0]?.message?.content;
    } 
    else if (provider === 'groq') {
      if (!apiKey) {
        return res.status(400).json({ error: 'Chave API do Groq não configurada.' });
      }
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: model || 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: systemPrompt }],
          response_format: { type: 'json_object' }
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      generatedText = response.data?.choices?.[0]?.message?.content;
    } 
    else if (provider === 'ollama') {
      const url = `${ollamaUrl || 'http://localhost:11434'}/api/chat`;
      const response = await axios.post(
        url,
        {
          model: model || 'llama3',
          messages: [{ role: 'user', content: systemPrompt }],
          stream: false,
          format: 'json'
        }
      );
      generatedText = response.data?.message?.content;
    } 
    else {
      return res.status(400).json({ error: `Provedor de IA desconhecido: ${provider}` });
    }

    if (!generatedText) {
      return res.status(500).json({ error: 'Nenhum conteúdo retornado pelo modelo de IA.' });
    }

    const parsedResult = JSON.parse(generatedText.trim());
    res.json(parsedResult);
  } catch (err) {
    console.error('[GENERATE-COMPONENT-IA]', err.message);
    res.status(500).json({ 
      error: 'Erro ao gerar componente pela IA. Verifique as configurações (chave API, conexões ou portas) do provedor selecionado.',
      details: err.message 
    });
  }
});

module.exports = router;
