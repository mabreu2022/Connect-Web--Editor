import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { ElementNode, EditorMode, ViewportMode, ComponentType, PageItem, SEOSettings, BotConfig } from '../types/editor';
import { createDefaultNode } from '../utils/defaults';
import { generateFullDoc, generateHTML, generateCSS } from '../utils/codeGenerator';
import { parseHTMLToNodes } from '../utils/htmlParser';
import { useAuth } from './AuthContext';

interface EditorContextType {
  nodes: ElementNode[];
  selectedId: string | null;
  hoveredId: string | null;
  mode: EditorMode;
  viewport: ViewportMode;
  rawHtml: string;
  rawCss: string;
  rawJs: string;
  canUndo: boolean;
  canRedo: boolean;

  // Multi-Page & SEO
  pages: PageItem[];
  activePageId: string;
  activePage: PageItem;
  addPage: (fileName: string, title: string) => void;
  removePage: (id: string) => void;
  switchPage: (id: string) => void;
  updatePageSEO: (seo: Partial<SEOSettings>) => void;
  
  // Actions
  setMode: (mode: EditorMode) => void;
  setViewport: (vp: ViewportMode) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  addNode: (type: ComponentType, parentId?: string | null) => void;
  updateNode: (id: string, updates: Partial<ElementNode>) => void;
  updateNodeStyles: (id: string, newStyles: Record<string, string>) => void;
  updateNodeAttributes: (id: string, newAttrs: Record<string, string>) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  moveNodeInTree: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  clearCanvas: () => void;
  loadTemplate: (templateType: 'template-login' | 'template-contact') => void;
  setRawHtml: (html: string) => void;
  setRawCss: (css: string) => void;
  setRawJs: (js: string) => void;
  undo: () => void;
  redo: () => void;
  openHTMLFile: (htmlContent: string) => void;
  getFullDocument: () => string;

  // Project Management (Database Sync)
  currentProjectId: number | null;
  projectsList: any[];
  loadProjects: () => Promise<any>;
  saveProjectToDb: () => Promise<void>;
  createProject: (nome: string, descricao?: string) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  selectProject: (id: number) => Promise<void>;

  // Bot & QAP Config
  botConfig: BotConfig;
  updateBotConfig: (config: Partial<BotConfig>) => void;
  isBotModalOpen: boolean;
  setIsBotModalOpen: (open: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const initialDefaultPages: PageItem[] = [
  {
    id: 'p_index',
    fileName: 'index.html',
    title: 'Página Inicial (Home)',
    nodes: [
      createDefaultNode('nav'),
      createDefaultNode('hero'),
      createDefaultNode('section-pricing')
    ],
    seo: {
      title: 'Minha Empresa - Página Inicial',
      description: 'Bem vindo ao nosso site profissional.',
      keywords: 'empresa, serviços, negócios',
      author: 'Connect Web Editor',
      ogImage: ''
    }
  },
  {
    id: 'p_servicos',
    fileName: 'servicos.html',
    title: 'Nossos Serviços',
    nodes: [
      createDefaultNode('nav'),
      createDefaultNode('section')
    ],
    seo: {
      title: 'Nossos Serviços - Soluções Profissionais',
      description: 'Conheça nossos serviços e soluções.',
      keywords: 'serviços, produtos, soluções',
      author: 'Connect Web Editor',
      ogImage: ''
    }
  },
  {
    id: 'p_precos',
    fileName: 'precos.html',
    title: 'Planos & Preços',
    nodes: [
      createDefaultNode('nav'),
      createDefaultNode('section-pricing')
    ],
    seo: {
      title: 'Planos e Preços - Tabela de Valores',
      description: 'Confira nossos planos e preços flexíveis.',
      keywords: 'preços, planos, assinaturas',
      author: 'Connect Web Editor',
      ogImage: ''
    }
  },
  {
    id: 'p_contato',
    fileName: 'contato.html',
    title: 'Fale Conosco',
    nodes: [
      createDefaultNode('nav'),
      createDefaultNode('template-contact')
    ],
    seo: {
      title: 'Fale Conosco - Atendimento',
      description: 'Entre em contato com nossa equipe.',
      keywords: 'contato, suporte, e-mail',
      author: 'Connect Web Editor',
      ogImage: ''
    }
  }
];

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<PageItem[]>(() => {
    try {
      const saved = localStorage.getItem('cwe_saved_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialDefaultPages;
  });
  const [activePageId, setActivePageId] = useState<string>(() => {
    return localStorage.getItem('cwe_active_page_id') || 'p_index';
  });

  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const nodes = activePage.nodes;

  const setNodes = (newNodes: ElementNode[]) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === activePageId ? { ...page, nodes: newNodes } : page
      )
    );
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('split');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  
  const [rawHtml, setRawHtml] = useState<string>('');
  const [customCss, setCustomCss] = useState<string>('');
  const [rawCss, setRawCss] = useState<string>('');
  const [rawJs, setRawJs] = useState<string>('');
  const [botConfig, setBotConfig] = useState<BotConfig>({
    qapPhone: '5511999998888',
    startTime: '08:00',
    endTime: '18:00',
    outOfHoursMessage: '🔴 Nosso atendimento ao vivo funciona de 08:00 às 18:00. Deixe sua mensagem!',
    faqList: [
      {
        id: 'faq_1',
        keywords: ['preço', 'preco', 'valor', 'quanto custa', 'plano', 'mensalidade', 'comprar'],
        reply: '💡 Nossos planos começam com 5 dias gratuitos para você testar tudo! O plano Enterprise custa apenas R$ 149,90/mês. Deseja ver a página de preços?'
      },
      {
        id: 'faq_2',
        keywords: ['suporte', 'ajuda', 'atendimento', 'contato', 'falar', 'humano', 'telefone', 'email'],
        reply: '📞 Nosso atendimento funciona de Segunda a Sexta, das 08h às 18h. Você também pode chamar diretamente no nosso QAP WhatsApp!'
      },
      {
        id: 'faq_3',
        keywords: ['vídeo', 'video', 'câmera', 'camera', 'webrtc', 'ligação', 'ligacao', 'áudio', 'audio', 'qap'],
        reply: '📹 Para iniciar uma chamada de vídeo ou atendimento no QAP WhatsApp, basta clicar no botão verde "📹 Iniciar Vídeo / QAP"!'
      },
      {
        id: 'faq_4',
        keywords: ['funciona', 'como usar', 'ferramenta', 'editor', 'site', 'criar'],
        reply: '⚡ Nossa ferramenta é um Editor Web drag-and-drop completo! Você pode criar páginas, personalizar componentes, salvar seu site e publicar facilmente.'
      }
    ]
  });

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [isBotModalOpen, setIsBotModalOpen] = useState<boolean>(false);

  const { token } = useAuth();
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem('cwe_current_project_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [projectsList, setProjectsList] = useState<any[]>([]);

  // Carrega lista de projetos
  const loadProjects = async () => {
    if (!token) return [];
    try {
      const res = await axios.get(`${API_URL}/projetos`);
      setProjectsList(res.data);
      return res.data;
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
      return [];
    }
  };

  // Carrega um projeto específico (com suas páginas)
  const selectProject = async (id: number) => {
    try {
      const res = await axios.get(`${API_URL}/projetos/${id}`);
      setCurrentProjectId(id);
      localStorage.setItem('cwe_current_project_id', id.toString());
      if (res.data.paginas && res.data.paginas.length > 0) {
        const mappedPages: PageItem[] = res.data.paginas.map((p: any) => {
          let nodes = [];
          try {
            nodes = typeof p.pag_nodes === 'string' ? JSON.parse(p.pag_nodes) : p.pag_nodes;
          } catch(e) {
            nodes = [];
          }
          return {
            id: p.pag_id.toString(),
            fileName: p.pag_filename,
            title: p.pag_nome,
            nodes: nodes || [],
            seo: {
              title: p.pag_seo_title || '',
              description: p.pag_seo_desc || '',
              keywords: p.pag_seo_keys || '',
              author: 'Connect Web Editor',
              ogImage: ''
            }
          };
        });
        setPages(mappedPages);
        const homePage = mappedPages.find(p => p.fileName === 'index.html') || mappedPages[0];
        setActivePageId(homePage.id);
      } else {
        setPages(initialDefaultPages);
        setActivePageId('p_index');
        await axios.put(`${API_URL}/projetos/${id}/paginas`, { paginas: initialDefaultPages });
      }
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
    }
  };

  // Salva o projeto ativo no banco de dados
  const saveProjectToDb = async () => {
    if (!currentProjectId || !token) return;
    await axios.put(`${API_URL}/projetos/${currentProjectId}/paginas`, { paginas: pages });
  };

  // Cria um novo projeto
  const createProject = async (nome: string, descricao?: string) => {
    if (!token) return;
    try {
      const res = await axios.post(`${API_URL}/projetos`, { nome, descricao });
      const newId = res.data.id;
      await loadProjects();
      await selectProject(newId);
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
    }
  };

  // Exclui um projeto
  const deleteProject = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/projetos/${id}`);
      const projs = await loadProjects();
      if (currentProjectId === id) {
        if (projs && projs.length > 0) {
          const firstProjId = projs[0].pro_id !== undefined ? projs[0].pro_id : projs[0].PRO_ID;
          selectProject(firstProjId);
        } else {
          setCurrentProjectId(null);
          localStorage.removeItem('cwe_current_project_id');
          setPages(initialDefaultPages);
          setActivePageId('p_index');
        }
      }
    } catch (err) {
      console.error('Erro ao remover projeto:', err);
    }
  };

  // Salva no localStorage como cache rápido/autosave local
  useEffect(() => {
    localStorage.setItem('cwe_saved_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('cwe_active_page_id', activePageId);
  }, [activePageId]);

  // Efeito de sincronização de projetos ao logar/deslogar
  useEffect(() => {
    if (token) {
      loadProjects().then(projs => {
        if (projs && projs.length > 0) {
          const savedId = localStorage.getItem('cwe_current_project_id');
          const parsedId = savedId ? parseInt(savedId, 10) : null;
          const exists = projs.some((p: any) => (p.pro_id !== undefined ? p.pro_id : p.PRO_ID) === parsedId);
          const firstProjId = projs[0].pro_id !== undefined ? projs[0].pro_id : projs[0].PRO_ID;
          const targetId = parsedId && exists ? parsedId : firstProjId;
          if (targetId) selectProject(targetId);
        } else if (projs && projs.length === 0) {
          createProject('Meu Primeiro Site', 'Criado automaticamente');
        }
      });
    } else {
      setProjectsList([]);
      setCurrentProjectId(null);
      setPages(initialDefaultPages);
      setActivePageId('p_index');
    }
  }, [token]);

  useEffect(() => {
    // Busca configurações salvas do Bot e QAP no banco de dados Firebird
    axios.get(`${API_URL}/admin/config-bot`)
      .then(res => {
        if (res.data) {
          setBotConfig(prev => {
            const updated = { ...prev, ...res.data };
            rebuildRawJs(updated);
            return updated;
          });
        }
      })
      .catch(err => console.log('Uso de padrão local para bot:', err));
  }, []);

  // Atalho de teclado: deletar componente com a tecla DEL
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId) {
        const active = document.activeElement;
        if (active) {
          const tagName = active.tagName.toLowerCase();
          const isEditable = active.getAttribute('contenteditable') === 'true' || 
                             active.hasAttribute('contenteditable') ||
                             active.classList.contains('monaco-editor') ||
                             active.closest('.monaco-editor');
          if (tagName === 'input' || tagName === 'textarea' || isEditable) {
            return;
          }
        }
        if (e.key === 'Delete' || e.key === 'Del') {
          removeNode(selectedId);
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const updateBotConfig = (newConfig: Partial<BotConfig>) => {
    setBotConfig(prev => {
      const updated = { ...prev, ...newConfig };
      rebuildRawJs(updated);
      // Persiste no banco de dados Firebird
      axios.put(`${API_URL}/admin/config-bot`, updated)
        .then(() => console.log('✅ Configurações do Bot gravadas no Firebird DB com sucesso!'))
        .catch(err => console.error('Erro ao gravar no Firebird DB:', err));
      return updated;
    });
  };

  const rebuildRawJs = (config: BotConfig) => {
    const scriptStr = `// Destaca automaticamente no menu a página atual navegada
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (!path) path = 'index.html';

  var items = document.querySelectorAll('nav a, nav button, header a, header button');
  items.forEach(function(item) {
    var href = item.getAttribute('href') || '';
    if (!href) {
      var onclickStr = item.getAttribute('onclick') || '';
      var match = onclickStr.match(/'([^']+)'/);
      if (match) href = match[1];
    }
    if (href && (href === path || (path === 'index.html' && (href === '#' || href === 'index.html')))) {
      item.classList.add('active-menu-link');
    }
  });
});

// Configurações Dinâmicas do Bot & QAP WhatsApp
var botConfig = ${JSON.stringify(config, null, 2)};

// Verifica se está dentro do Horário de Atendimento
function isWithinBusinessHours() {
  if (!botConfig.startTime || !botConfig.endTime) return true;
  var now = new Date();
  var currentMinutes = now.getHours() * 60 + now.getMinutes();

  var startParts = botConfig.startTime.split(':');
  var startMinutes = parseInt(startParts[0] || '0', 10) * 60 + parseInt(startParts[1] || '0', 10);

  var endParts = botConfig.endTime.split(':');
  var endMinutes = parseInt(endParts[0] || '23', 10) * 60 + parseInt(endParts[1] || '59', 10);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

var _cwePC = null;       // RTCPeerConnection
var _cweLocalStream = null;
var _cweRoomId = null;
var _cweSocket = null;
var _cweMuted = false;
var _cweCamOff = false;

// Carrega o socket.io do backend e conecta
function _cweGetSocket(backendUrl) {
  if (_cweSocket && _cweSocket.connected) return Promise.resolve(_cweSocket);
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.src = backendUrl + '/socket.io/socket.io.js';
    script.onload = function() {
      _cweSocket = window.io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'] });
      _cweSocket.on('connect', function() { resolve(_cweSocket); });
      _cweSocket.on('connect_error', function(e) { reject(e); });
    };
    script.onerror = function() { reject(new Error('Socket.IO não carregado')); };
    document.head.appendChild(script);
  });
}

// Inicia Chamada de Vídeo P2P Real via QAP Messenger
function startWebRTCVideo() {
  var widget = document.querySelector('.cwe-webrtc-widget');
  var phone = (widget && widget.getAttribute('data-qap-phone')) || botConfig.qapPhone || '';
  phone = phone.replace(/\\D/g, '');
  var backendUrl = (widget && widget.getAttribute('data-backend-url')) || 
                   (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);
  var siteUrl = window.location.origin || backendUrl;

  showQapNotification('⏳ Iniciando chamada de vídeo...');

  // 1. Cria sala WebRTC e notifica o atendente via QAP
  fetch(backendUrl + '/api/admin/qap/video-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone, siteUrl: siteUrl })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data.success) throw new Error(data.error || 'Erro na criação da sala');
    _cweRoomId = data.roomId;
    showQapNotification('📲 Atendente notificado via QAP! Aguardando ele atender...');

    // 2. Ativa câmera local
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(stream) {
        _cweLocalStream = stream;
        var videoEl = document.getElementById('cwe-local-video');
        if (videoEl) { videoEl.srcObject = stream; videoEl.play(); }
        return stream;
      });
  })
  .then(function(stream) {
    // 3. Conecta ao servidor de sinalização
    return _cweGetSocket(backendUrl).then(function(sock) {
      sock.emit('join-room', { roomId: _cweRoomId, role: 'caller' });

      // 4. Quando atendente entrar, envia o Offer
      sock.on('callee-joined', function() {
        showQapNotification('✅ Atendente conectou! Estabelecendo vídeo...');
        _cwePC = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        stream.getTracks().forEach(function(t) { _cwePC.addTrack(t, stream); });

        _cwePC.ontrack = function(e) {
          var remoteVideo = document.getElementById('cwe-remote-video');
          var placeholder = document.getElementById('cwe-video-placeholder');
          if (remoteVideo) { remoteVideo.srcObject = e.streams[0]; remoteVideo.play(); }
          if (placeholder) placeholder.style.display = 'none';
          showQapNotification('🎉 Chamada de vídeo ativa!');
        };

        _cwePC.onicecandidate = function(e) {
          if (e.candidate) sock.emit('ice-candidate', { roomId: _cweRoomId, candidate: e.candidate });
        };

        _cwePC.createOffer()
          .then(function(offer) { return _cwePC.setLocalDescription(offer).then(function() { return offer; }); })
          .then(function(offer) { sock.emit('offer', { roomId: _cweRoomId, offer: offer }); });
      });

      // Recebe Answer do atendente
      sock.on('answer', function(d) {
        if (_cwePC) _cwePC.setRemoteDescription(new RTCSessionDescription(d.answer));
      });

      // Recebe ICE Candidates do atendente
      sock.on('ice-candidate', function(d) {
        if (_cwePC && d.candidate) _cwePC.addIceCandidate(new RTCIceCandidate(d.candidate));
      });

      // Atendente encerrou
      sock.on('peer-left', function() {
        showQapNotification('🔴 O atendente encerrou a chamada.');
        stopWebRTC();
      });
    });
  })
  .catch(function(err) {
    console.error('[WebRTC Error]', err);
    showQapNotification('❌ Erro: ' + err.message);
    showQapDownloadBanner();
  });
}

function toggleWebRTCAudio() {
  _cweMuted = !_cweMuted;
  if (_cweLocalStream) {
    _cweLocalStream.getAudioTracks().forEach(function(t) { t.enabled = !_cweMuted; });
  }
  var btn = document.getElementById('cwe-btn-audio');
  if (btn) btn.textContent = _cweMuted ? '🔊' : '🎙️';
  showQapNotification(_cweMuted ? '🔇 Microfone desligado.' : '🔊 Microfone ativo.');
}

function stopWebRTC() {
  if (_cwePC) { _cwePC.close(); _cwePC = null; }
  if (_cweLocalStream) { _cweLocalStream.getTracks().forEach(function(t) { t.stop(); }); _cweLocalStream = null; }
  if (_cweSocket && _cweRoomId) { _cweSocket.emit('leave-room', { roomId: _cweRoomId }); }
  _cweRoomId = null;
  var vLocal = document.getElementById('cwe-local-video');
  var vRemote = document.getElementById('cwe-remote-video');
  if (vLocal) vLocal.srcObject = null;
  if (vRemote) vRemote.srcObject = null;
  showQapNotification('🔴 Chamada encerrada.');
}

// Exibe uma notificação elegante no widget
function showQapNotification(msg) {
  var feed = document.getElementById('cwe-chat-messages');
  if (!feed) return;
  var el = document.createElement('div');
  el.style.cssText = 'background: #10b981; color: #fff; padding: 10px 12px; border-radius: 10px; font-size: 12px; text-align: center; font-family: system-ui, sans-serif; margin: 4px 0;';
  el.innerText = msg;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

// Exibe banner para baixar o QAP caso a chamada não funcione via API
function showQapDownloadBanner() {
  var feed = document.getElementById('cwe-chat-messages');
  if (!feed) return;
  var el = document.createElement('div');
  el.style.cssText = 'background: #1e293b; border: 1px solid #6366f1; color: #f1f5f9; padding: 12px; border-radius: 10px; font-size: 12px; text-align: center; font-family: system-ui, sans-serif; margin: 4px 0; line-height: 1.6;';
  el.innerHTML = '<strong>📲 Para atendimento por vídeo/áudio, use o QAP Messenger</strong><br>' +
    '<a href="https://conectsolutionsti.dev.br/Messenger" target="_blank" style="color:#6366f1; text-decoration:underline;">🌐 Abrir QAP no navegador</a>&nbsp;&nbsp;' +
    '<a href="https://drive.google.com/file/d/1Bp5Xzj4va2_xe5ItNfImjqUNYi7kw94R/view?usp=sharing" target="_blank" style="color:#10b981; text-decoration:underline;">📱 Baixar QAP (Android)</a>';
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

function getBotReply(userQuery) {
  if (!isWithinBusinessHours()) {
    return botConfig.outOfHoursMessage || "🔴 Nosso atendimento ao vivo funciona das " + botConfig.startTime + " às " + botConfig.endTime + ". Deixe sua mensagem!";
  }

  var queryLower = userQuery.toLowerCase();
  var faqList = botConfig.faqList || [];

  for (var i = 0; i < faqList.length; i++) {
    var item = faqList[i];
    for (var k = 0; k < item.keywords.length; k++) {
      if (queryLower.indexOf(item.keywords[k]) !== -1) {
        return item.reply;
      }
    }
  }
  return '🤖 Obrigado pelo seu contato! Recebemos sua mensagem: "' + userQuery + '". Um de nossos especialistas responderá em breve.';
}

function sendChatMessage(event) {
  if (event) event.preventDefault();
  var input = document.getElementById('cwe-chat-input');
  var msgFeed = document.getElementById('cwe-chat-messages');
  if (!input || !input.value.trim() || !msgFeed) return;

  var userText = input.value.trim();
  input.value = '';

  var userMsgDiv = document.createElement('div');
  userMsgDiv.style.cssText = 'background: #6366f1; color: #fff; padding: 10px 12px; border-radius: 12px 12px 2px 12px; max-width: 85%; font-size: 12px; align-self: flex-end; line-height: 1.4; font-family: system-ui, sans-serif;';
  userMsgDiv.innerText = userText;
  msgFeed.appendChild(userMsgDiv);
  msgFeed.scrollTop = msgFeed.scrollHeight;

  var botReply = getBotReply(userText);

  setTimeout(function() {
    var agentMsgDiv = document.createElement('div');
    agentMsgDiv.style.cssText = 'background: #1e293b; color: #f1f5f9; padding: 10px 12px; border-radius: 12px 12px 12px 2px; max-width: 85%; font-size: 12px; align-self: flex-start; line-height: 1.4; font-family: system-ui, sans-serif; border: 1px solid #334155;';
    agentMsgDiv.innerText = botReply;
    msgFeed.appendChild(agentMsgDiv);
    msgFeed.scrollTop = msgFeed.scrollHeight;
  }, 600);
}
`;
    setRawJs(scriptStr);
  };

  useEffect(() => {
    rebuildRawJs(botConfig);
  }, []);

  // History Undo/Redo
  const [history, setHistory] = useState<ElementNode[][]>([activePage.nodes]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  // Auto update generated rawHtml / rawCss when nodes change
  useEffect(() => {
    setRawHtml(generateHTML(nodes));
    const generated = generateCSS(nodes);
    setRawCss(customCss ? `${customCss}\n\n${generated}`.trim() : generated);
  }, [nodes, customCss]);

  const pushHistory = (newNodes: ElementNode[]) => {
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(newNodes);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
    setNodes(newNodes);
  };

  const undo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setNodes(history[prevIdx]);
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setNodes(history[nextIdx]);
    }
  };

  // Multi-Page functions
  const addPage = (fileName: string, title: string) => {
    const cleanFileName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    const newPage: PageItem = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      fileName: cleanFileName,
      title: title || cleanFileName,
      nodes: [createDefaultNode('nav'), createDefaultNode('section')],
      seo: {
        title: title || cleanFileName,
        description: 'Nova página do site.',
        keywords: 'site, web',
        author: 'Connect Web Editor',
        ogImage: ''
      }
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setHistory([newPage.nodes]);
    setHistoryIdx(0);
    setSelectedId(null);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) {
      alert('O projeto precisa ter pelo menos uma página!');
      return;
    }
    const filtered = pages.filter(p => p.id !== id);
    setPages(filtered);
    if (activePageId === id) {
      setActivePageId(filtered[0].id);
      setHistory([filtered[0].nodes]);
      setHistoryIdx(0);
    }
  };

  const switchPage = (id: string) => {
    const target = pages.find(p => p.id === id);
    if (target) {
      setActivePageId(id);
      setHistory([target.nodes]);
      setHistoryIdx(0);
      setSelectedId(null);
    }
  };

  const updatePageSEO = (seoUpdates: Partial<SEOSettings>) => {
    setPages(prev =>
      prev.map(p =>
        p.id === activePageId ? { ...p, seo: { ...p.seo, ...seoUpdates } } : p
      )
    );
  };

  const findAndModifyNode = (
    list: ElementNode[],
    targetId: string,
    modifier: (node: ElementNode) => ElementNode | null
  ): ElementNode[] => {
    return list
      .map(node => {
        if (node.id === targetId) {
          return modifier(node);
        }
        if (node.children && node.children.length > 0) {
          const updatedChildren = findAndModifyNode(node.children, targetId, modifier);
          return { ...node, children: updatedChildren };
        }
        return node;
      })
      .filter((n): n is ElementNode => n !== null);
  };

  const addNode = (type: ComponentType, parentId?: string | null) => {
    const newNode = createDefaultNode(type);
    let updated: ElementNode[];

    if (!parentId || parentId === 'root') {
      updated = [...nodes, newNode];
    } else {
      updated = findAndModifyNode(nodes, parentId, node => ({
        ...node,
        children: [...node.children, newNode]
      }));
    }

    pushHistory(updated);
    setSelectedId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<ElementNode>) => {
    const updated = findAndModifyNode(nodes, id, node => ({
      ...node,
      ...updates
    }));
    pushHistory(updated);
  };

  const updateNodeStyles = (id: string, newStyles: Record<string, string>) => {
    const updated = findAndModifyNode(nodes, id, node => ({
      ...node,
      styles: { ...node.styles, ...newStyles }
    }));
    pushHistory(updated);
  };

  const updateNodeAttributes = (id: string, newAttrs: Record<string, string>) => {
    const updated = findAndModifyNode(nodes, id, node => ({
      ...node,
      attributes: { ...node.attributes, ...newAttrs }
    }));
    pushHistory(updated);
  };

  const removeNode = (id: string) => {
    const updated = findAndModifyNode(nodes, id, () => null);
    pushHistory(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateNode = (id: string) => {
    let nodeToCopy: ElementNode | null = null;
    
    function findNode(list: ElementNode[]) {
      for (const n of list) {
        if (n.id === id) {
          nodeToCopy = JSON.parse(JSON.stringify(n));
          return;
        }
        if (n.children) findNode(n.children);
      }
    }
    findNode(nodes);

    if (nodeToCopy) {
      const resetIds = (n: ElementNode): ElementNode => ({
        ...n,
        id: 'el_' + Math.random().toString(36).substring(2, 9),
        children: n.children ? n.children.map(resetIds) : []
      });
      const duplicated = resetIds(nodeToCopy);
      pushHistory([...nodes, duplicated]);
      setSelectedId(duplicated.id);
    }
  };

  const moveNodeInTree = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (draggedId === targetId) return;

    let draggedNode: ElementNode | null = null;
    const listWithoutDragged = findAndModifyNode(nodes, draggedId, n => {
      draggedNode = n;
      return null;
    });

    if (!draggedNode) return;
    const nodeToInsert = draggedNode;

    if (position === 'inside') {
      const updated = findAndModifyNode(listWithoutDragged, targetId, parent => ({
        ...parent,
        children: [...parent.children, nodeToInsert]
      }));
      pushHistory(updated);
    } else {
      const insertInSiblings = (list: ElementNode[]): ElementNode[] => {
        const result: ElementNode[] = [];
        for (const item of list) {
          if (item.id === targetId) {
            if (position === 'before') {
              result.push(nodeToInsert);
              result.push(item);
            } else {
              result.push(item);
              result.push(nodeToInsert);
            }
          } else {
            const updatedItem = item.children ? { ...item, children: insertInSiblings(item.children) } : item;
            result.push(updatedItem);
          }
        }
        return result;
      };
      const updated = insertInSiblings(listWithoutDragged);
      pushHistory(updated);
    }
  };

  const clearCanvas = () => {
    pushHistory([]);
    setCustomCss('');
    setSelectedId(null);
  };

  const loadTemplate = (templateType: 'template-login' | 'template-contact') => {
    const tplNode = createDefaultNode(templateType);
    pushHistory([tplNode]);
    setCustomCss('');
    setSelectedId(tplNode.id);
  };

  const openHTMLFile = (htmlContent: string) => {
    const { nodes: parsedNodes, css, js } = parseHTMLToNodes(htmlContent);
    pushHistory(parsedNodes);
    setCustomCss(css || '');
    if (js) setRawJs(js);
    setSelectedId(null);
  };

  const handleSetRawCss = (css: string) => {
    setCustomCss(css);
    setRawCss(css);
  };

  const getFullDocument = () => {
    return generateFullDoc(nodes, rawCss, rawJs, activePage.seo.title, activePage.seo.description, activePage.seo.keywords);
  };

  return (
    <EditorContext.Provider
      value={{
        nodes,
        selectedId,
        hoveredId,
        mode,
        viewport,
        rawHtml,
        rawCss,
        rawJs,
        canUndo: historyIdx > 0,
        canRedo: historyIdx < history.length - 1,
        pages,
        activePageId,
        activePage,
        addPage,
        removePage,
        switchPage,
        updatePageSEO,
        setMode,
        setViewport,
        setSelectedId,
        setHoveredId,
        addNode,
        updateNode,
        updateNodeStyles,
        updateNodeAttributes,
        removeNode,
        duplicateNode,
        moveNodeInTree,
        clearCanvas,
        loadTemplate,
        setRawHtml,
        setRawCss: handleSetRawCss,
        setRawJs,
        undo,
        redo,
        openHTMLFile,
        getFullDocument,
        currentProjectId,
        projectsList,
        loadProjects,
        saveProjectToDb,
        createProject,
        deleteProject,
        selectProject,
        botConfig,
        updateBotConfig,
        isBotModalOpen,
        setIsBotModalOpen
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor deve ser usado dentro de um EditorProvider');
  return context;
};
