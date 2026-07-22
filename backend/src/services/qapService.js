const axios = require('axios');

const BASE_URL = process.env.QAP_API_URL || 'https://conectsolutionsti.dev.br/Messenger';
const USERNAME = process.env.QAP_USERNAME || 'Mauricio Abreu';
const PASSWORD = process.env.QAP_PASSWORD || 'Mmpa@2025';

let authToken = null;
let tokenExpiry = null;

const login = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: USERNAME,
      password: PASSWORD
    });

    if (response.status === 200 && response.data && response.data.token) {
      authToken = response.data.token;
      tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      console.log('[QAP Messenger Service] Autenticado com sucesso como:', USERNAME);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[QAP Messenger Service] Erro de Login:', error.message);
    return false;
  }
};

const ensureAuthenticated = async () => {
  if (!authToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    const success = await login();
    if (!success) {
      throw new Error('Falha ao autenticar na API do QAP Messenger');
    }
  }
  return authToken;
};

const getContacts = async () => {
  await ensureAuthenticated();
  try {
    const response = await axios.get(`${BASE_URL}/api/users/contacts`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    console.error('[QAP Messenger] Erro ao buscar contatos:', error.message);
    return [];
  }
};

const startCall = async (phone, type = 'video') => {
  try {
    await ensureAuthenticated();
    const contacts = await getContacts();
    const targetPhone = String(phone).replace(/[^0-9]/g, '');
    const match = contacts.find(c => String(c.phone || '').replace(/[^0-9]/g, '').endsWith(targetPhone));

    const targetUserId = match ? match.id : null;
    if (!targetUserId) {
      console.warn('[QAP Messenger] Contato não encontrado por telefone:', phone);
      return { success: false, message: 'Contato não encontrado na base do QAP' };
    }

    const response = await axios.post(`${BASE_URL}/api/calls/start`, {
      targetIds: [targetUserId],
      type: type
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[QAP Messenger] Erro ao iniciar chamada:', error.message);
    return { success: false, error: error.message };
  }
};

const sendMessage = async (phone, message) => {
  try {
    await ensureAuthenticated();
    const contacts = await getContacts();
    
    console.log('[QAP sendMessage] Procurando contato pelo phone:', phone);
    console.log('[QAP sendMessage] Contatos disponíveis:', JSON.stringify(contacts.map(c => ({ id: c.contact_id || c.id, name: c.username, phone: c.phone }))));

    const targetPhone = String(phone).replace(/[^0-9]/g, '');
    
    // Tenta match completo, depois por sufixo (8 dígitos), depois pega o primeiro contato
    let match = contacts.find(c => String(c.phone || '').replace(/[^0-9]/g, '') === targetPhone);
    if (!match) match = contacts.find(c => String(c.phone || '').replace(/[^0-9]/g, '').endsWith(targetPhone.slice(-8)));
    if (!match && contacts.length > 0) {
      console.warn('[QAP sendMessage] Contato não encontrado pelo phone, usando primeiro contato disponível:', contacts[0].username);
      match = contacts[0];
    }

    const targetUserId = match ? (match.contact_id || match.id) : null;
    console.log('[QAP sendMessage] Usando contato:', match?.username, '| userId:', targetUserId);

    if (!targetUserId) {
      return { success: false, message: 'Nenhum contato disponível no QAP' };
    }

    // Criar ou recuperar conversa privada
    const convoRes = await axios.post(`${BASE_URL}/api/conversations/private`, {
      otherUserId: targetUserId
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const conversationId = convoRes.data?.id;
    console.log('[QAP sendMessage] Conversa ID:', conversationId);

    if (!conversationId) {
      return { success: false, message: 'Não foi possível obter ID de conversa QAP' };
    }

    const msgRes = await axios.post(`${BASE_URL}/api/messages`, {
      conversationId: conversationId,
      content: message,
      replyTo: 0
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('[QAP sendMessage] Mensagem enviada! ID:', msgRes.data?.id);
    return { success: true, data: msgRes.data };
  } catch (error) {
    console.error('[QAP Messenger] Erro ao enviar mensagem:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};


module.exports = {
  login,
  getContacts,
  startCall,
  sendMessage
};
