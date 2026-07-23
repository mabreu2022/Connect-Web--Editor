import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashData {
  mrr: number; arr: number; totalUsuarios: number; totalPendentes: number; assinaturasAtivas: number;
  faturasPendentes: { quantidade: number; valor: number };
  receitaMes: number;
  ultimasTransacoes: any[];
  usuariosPorPlano: any[];
}

interface Usuario { 
  usu_id: number; usu_nome: string; usu_email: string; usu_empresa: string; usu_status: number; 
  usu_criado: string; pla_nome: string; ass_status: string; comprovante_pix?: string; 
}
interface Plano { pla_id: number; pla_nome: string; pla_preco_mes: number; pla_preco_ano: number; pla_max_pag: number; pla_max_proj: number; pla_max_exp: number; pla_ativo: number; pla_destaque: number; }

type Tab = 'dashboard' | 'pendentes' | 'usuarios' | 'planos' | 'faturas' | 'config' | 'bot' | 'store';

export const AdminPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dash, setDash] = useState<DashData | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editPlano, setEditPlano] = useState<Plano | null>(null);
  const [msgAction, setMsgAction] = useState('');

  // Estados para a Loja Admin
  const [storeComps, setStoreComps] = useState<any[]>([]);
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [newCompTitle, setNewCompTitle] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompCategory, setNewCompCategory] = useState('sections');
  const [newCompPrice, setNewCompPrice] = useState('19.90');
  const [newCompThumb, setNewCompThumb] = useState('');
  const [newCompPayload, setNewCompPayload] = useState('');

  // Estados para a Fábrica de Componentes por IA
  const [aiDescription, setAiDescription] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'ollama'>('gemini');
  const [aiModel, setAiModel] = useState('');
  const [aiOllamaUrl, setAiOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  const fetchOllamaModels = async (url: string) => {
    try {
      const response = await fetch(`${url}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name);
          setOllamaModels(names);
          if (names.length > 0) {
            setAiModel(prev => names.includes(prev) ? prev : names[0]);
          }
        } else {
          setOllamaModels([]);
        }
      } else {
        setOllamaModels([]);
      }
    } catch (e) {
      console.warn('Erro ao listar modelos do Ollama:', e);
      setOllamaModels([]);
    }
  };

  // Configurações PIX do Admin
  const [pixConfig, setPixConfig] = useState({ chavePix: '', nomeRecebedor: '', cidadeRecebedor: '' });

  // Configurações do Bot & QAP
  const [botConfig, setBotConfig] = useState({ qapPhone: '', startTime: '08:00', endTime: '18:00', outOfHoursMessage: '', backendPublicUrl: '' });

  // Modal de Comprovante com Zoom
  const [viewComprovante, setViewComprovante] = useState<{ url: string; usuario: Usuario } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const downloadComprovante = () => {
    if (!viewComprovante?.url) return;
    const a = document.createElement('a');
    a.href = viewComprovante.url;
    a.download = `comprovante_pix_usuario_${viewComprovante.usuario.usu_id}_${(viewComprovante.usuario.usu_nome || 'cliente').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'dashboard') { const r = await axios.get(`${API_URL}/admin/dashboard`); setDash(r.data); }
      else if (t === 'usuarios' || t === 'pendentes') { const r = await axios.get(`${API_URL}/admin/usuarios`); setUsuarios(r.data.data || []); }
      else if (t === 'planos') { const r = await axios.get(`${API_URL}/admin/planos`); setPlanos(r.data); }
      else if (t === 'faturas') { const r = await axios.get(`${API_URL}/admin/faturas`); setFaturas(r.data); }
      else if (t === 'config') { const r = await axios.get(`${API_URL}/admin/config-pix`); setPixConfig(r.data); }
      else if (t === 'bot') { const r = await axios.get(`${API_URL}/admin/config-bot`); setBotConfig(r.data); }
      else if (t === 'store') {
        const [compsRes, ordersRes] = await Promise.all([
          axios.get(`${API_URL}/store/components`),
          axios.get(`${API_URL}/store/admin/orders`)
        ]);
        setStoreComps(compsRes.data || []);
        setStoreOrders(ordersRes.data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const savedProvider = localStorage.getItem('cwe_ai_provider');
    const savedApiKey = localStorage.getItem('cwe_ai_api_key');
    const savedModel = localStorage.getItem('cwe_ai_model');
    const savedOllamaUrl = localStorage.getItem('cwe_ai_ollama_url');

    if (savedProvider) setAiProvider(savedProvider as any);
    if (savedApiKey) setAiApiKey(savedApiKey);
    if (savedModel) setAiModel(savedModel);
    if (savedOllamaUrl) {
      setAiOllamaUrl(savedOllamaUrl);
      if (savedProvider === 'ollama') {
        fetchOllamaModels(savedOllamaUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (aiProvider === 'ollama') {
      fetchOllamaModels(aiOllamaUrl);
    }
  }, [aiProvider, aiOllamaUrl]);

  useEffect(() => { loadTab(tab); }, [tab]);

  const aprovarPix = async (id: number) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/admin/usuarios/${id}/aprovar-pix`);
      setMsgAction(data.message);
      setViewComprovante(null);
      setTimeout(() => setMsgAction(''), 4000);
      loadTab(tab);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Erro ao aprovar PIX.');
    } finally {
      setLoading(false);
    }
  };

  const savePixConfig = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/admin/config-pix`, pixConfig);
      setMsgAction('Chave PIX atualizada com sucesso!');
      setTimeout(() => setMsgAction(''), 4000);
    } catch (e) { alert('Erro ao salvar chave PIX.'); }
    finally { setLoading(false); }
  };

  const saveBotConfig = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/admin/config-bot`, botConfig);
      setMsgAction('Configurações do Bot & QAP atualizadas com sucesso!');
      setTimeout(() => setMsgAction(''), 4000);
    } catch (e) { alert('Erro ao salvar configurações do Bot & QAP.'); }
    finally { setLoading(false); }
  };

  const handleGenerateWithIA = async () => {
    if (!aiDescription.trim()) {
      alert('Por favor, descreva o componente que deseja criar!');
      return;
    }
    setAiLoading(true);

    // Salva preferências no navegador
    localStorage.setItem('cwe_ai_provider', aiProvider);
    localStorage.setItem('cwe_ai_api_key', aiApiKey);
    localStorage.setItem('cwe_ai_model', aiModel);
    localStorage.setItem('cwe_ai_ollama_url', aiOllamaUrl);

    try {
      let resultData: any = null;

      if (aiProvider === 'ollama') {
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

Descrição do usuário: "${aiDescription}"`;

        const response = await fetch(`${aiOllamaUrl || 'http://localhost:11434'}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: aiModel || 'llama3',
            messages: [{ role: 'user', content: systemPrompt }],
            stream: false,
            format: 'json'
          })
        });

        if (!response.ok) {
          throw new Error(`Erro na conexão com o Ollama local: status ${response.status}. Certifique-se de que o Ollama está rodando e com CORS habilitado (OLLAMA_ORIGINS=*).`);
        }

        const data = await response.json();
        const contentText = data.message?.content;
        if (!contentText) {
          throw new Error('Nenhum conteúdo retornado pelo Ollama local.');
        }
        resultData = JSON.parse(contentText.trim());
      } else {
        const res = await axios.post(`${API_URL}/store/admin/generate-component`, {
          description: aiDescription,
          provider: aiProvider,
          apiKey: aiApiKey || undefined,
          model: aiModel || undefined
        });
        resultData = res.data;
      }

      if (resultData) {
        setNewCompTitle(resultData.title || '');
        setNewCompDesc(resultData.description || '');
        if (resultData.category) setNewCompCategory(resultData.category);
        if (resultData.price) setNewCompPrice(String(resultData.price));
        if (resultData.thumbnail_url) setNewCompThumb(resultData.thumbnail_url);
        if (resultData.component_payload) {
          setNewCompPayload(JSON.stringify(resultData.component_payload, null, 2));
        }
        alert('✨ Estrutura gerada com sucesso pela IA e preenchida no formulário!');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar componente com a IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleStatus = async (id: number, status: number) => {
    await axios.patch(`${API_URL}/admin/usuarios/${id}/status`, { status });
    setUsuarios(prev => prev.map(u => u.usu_id === id ? { ...u, usu_status: status } : u));
  };

  const savePlano = async () => {
    if (!editPlano) return;
    await axios.put(`${API_URL}/admin/planos/${editPlano.pla_id}`, {
      nome: editPlano.pla_nome, descricao: '', preco_mes: editPlano.pla_preco_mes, preco_ano: editPlano.pla_preco_ano,
      max_pag: editPlano.pla_max_pag, max_proj: editPlano.pla_max_proj, max_exp: editPlano.pla_max_exp,
      destaque: editPlano.pla_destaque, ativo: editPlano.pla_ativo
    });
    setEditPlano(null);
    loadTab('planos');
  };

  const usuariosPendentes = usuarios.filter(u => u.usu_status === 2);

  const navItems: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'pendentes', icon: '⏳', label: 'Liberar PIX', count: dash?.totalPendentes || usuariosPendentes.length },
    { id: 'usuarios', icon: '👥', label: 'Todos Usuários' },
    { id: 'planos', icon: '📦', label: 'Planos' },
    { id: 'faturas', icon: '🧾', label: 'Faturas' },
    { id: 'config', icon: '⚙️', label: 'Config PIX' },
    { id: 'bot', icon: '🤖', label: 'Bot & QAP' },
    { id: 'store', icon: '🛍️', label: 'Loja Admin', count: storeOrders.filter((o: any) => o.status === 'pending').length || undefined }
  ];

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#a5b4fc' }}>Admin CWE</span>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ ...S.navBtn, ...(tab === n.id ? S.navBtnActive : {}) }}>
              <span>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {Boolean(n.count) && <span style={S.badgeCount}>{n.count}</span>}
            </button>
          ))}
        </nav>
        <div style={S.sidebarUser}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{user?.nome}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', wordBreak: 'break-all' }}>{user?.email}</div>
          <button onClick={logout} style={S.logoutBtn}>🚪 Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <header style={S.header}>
          <h1 style={S.headerTitle}>
            {navItems.find(n => n.id === tab)?.icon} {navItems.find(n => n.id === tab)?.label}
          </h1>
          <span style={S.badge}>Admin Master</span>
        </header>

        {msgAction && <div style={S.successAlert}>✅ {msgAction}</div>}

        {loading && <div style={S.loading}>Carregando dados...</div>}

        {/* ===== DASHBOARD ===== */}
        {!loading && tab === 'dashboard' && dash && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={S.kpiGrid}>
              {[
                { label: 'MRR (Receita Mensal)', value: formatBRL(dash.mrr), icon: '💰', color: '#6366f1' },
                { label: 'ARR (Receita Anual)', value: formatBRL(dash.arr), icon: '📈', color: '#0ea5e9' },
                { label: 'Receita Este Mês', value: formatBRL(dash.receitaMes), icon: '💵', color: '#10b981' },
                { label: 'Usuários Ativos', value: dash.totalUsuarios, icon: '👥', color: '#10b981' },
                { label: 'Pendentes de Liberação', value: dash.totalPendentes, icon: '⏳', color: '#f59e0b' },
                { label: 'Faturas Pendentes', value: `${dash.faturasPendentes.quantidade} (${formatBRL(dash.faturasPendentes.valor)})`, icon: '🧾', color: '#ef4444' },
              ].map(kpi => (
                <div key={kpi.label} style={{ ...S.kpiCard, borderLeft: `4px solid ${kpi.color}` }}>
                  <div style={{ fontSize: '28px' }}>{kpi.icon}</div>
                  <div>
                    <div style={S.kpiValue}>{kpi.value}</div>
                    <div style={S.kpiLabel}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              <div style={S.panel}>
                <h3 style={S.panelTitle}>Usuários por Plano</h3>
                {dash.usuariosPorPlano.map((p: any) => (
                  <div key={p.pla_nome} style={S.planoRow}>
                    <span style={{ color: '#e2e8f0' }}>{p.pla_nome}</span>
                    <span style={S.badge2}>{p.total}</span>
                  </div>
                ))}
              </div>
              <div style={S.panel}>
                <h3 style={S.panelTitle}>Últimas Transações PIX</h3>
                <table style={S.table}>
                  <thead><tr>
                    {['Usuário', 'Valor', 'Comprovante PIX', 'Status', 'Data'].map(h => <th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {dash.ultimasTransacoes.map((t: any) => (
                      <tr key={t.tra_id}>
                        <td style={S.td}><div>{t.usu_nome}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{t.usu_email}</div></td>
                        <td style={S.td}>{formatBRL(t.tra_valor)}</td>
                        <td style={S.td}>
                          {t.tra_external && t.tra_external.startsWith('data:') ? (
                            <button onClick={() => setViewComprovante({ url: t.tra_external, usuario: { usu_id: t.usu_id, usu_nome: t.usu_nome, usu_email: t.usu_email } as any })} style={S.viewBtn}>
                              🖼️ Ver Imagem
                            </button>
                          ) : (
                            <code style={S.codeBox}>{t.tra_external || 'Pendente'}</code>
                          )}
                        </td>
                        <td style={S.td}><span style={{ ...S.statusChip, backgroundColor: t.tra_status === 'aprovada' ? '#064e3b' : '#78350f' }}>{t.tra_status}</span></td>
                        <td style={S.td}>{new Date(t.tra_criado).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== PENDENTES DE LIBERAÇÃO PIX ===== */}
        {!loading && tab === 'pendentes' && (
          <div style={S.panel}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 16px', fontSize: '16px' }}>
              ⏳ Solicitações Pendentes de Liberação PIX ({usuariosPendentes.length})
            </h3>
            <table style={S.table}>
              <thead><tr>
                {['ID', 'Usuário', 'Empresa', 'Plano Desejado', 'Comprovante PIX', 'Data Cadastro', 'Ação de Liberação'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {usuariosPendentes.map(u => (
                  <tr key={u.usu_id}>
                    <td style={S.td}>#{u.usu_id}</td>
                    <td style={S.td}>
                      <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{u.usu_nome}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.usu_email}</div>
                    </td>
                    <td style={S.td}>{u.usu_empresa || '—'}</td>
                    <td style={S.td}><span style={S.badge2}>{u.pla_nome || 'Básico'}</span></td>
                    <td style={S.td}>
                      {u.comprovante_pix && u.comprovante_pix !== 'Pendente' && u.comprovante_pix !== 'Aguardando Comprovante' ? (
                        <button onClick={() => { setZoomLevel(1); setViewComprovante({ url: u.comprovante_pix!, usuario: u }); }} style={S.viewBtn}>
                          🖼️ Ver Comprovante (Zoom)
                        </button>
                      ) : (
                        <code style={S.codeBox}>{u.comprovante_pix || 'Pendente'}</code>
                      )}
                    </td>
                    <td style={S.td}>{new Date(u.usu_criado).toLocaleDateString('pt-BR')}</td>
                    <td style={S.td}>
                      <button onClick={() => aprovarPix(u.usu_id)} style={S.approveBtn}>
                        ✅ Verificado - Liberar Acesso
                      </button>
                    </td>
                  </tr>
                ))}
                {usuariosPendentes.length === 0 && (
                  <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#10b981', padding: '32px' }}>
                    🎉 Nenhum cadastro pendente de aprovação PIX no momento!
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== TODOS OS USUÁRIOS ===== */}
        {!loading && tab === 'usuarios' && (
          <div style={S.panel}>
            <table style={S.table}>
              <thead><tr>
                {['Nome', 'E-mail', 'Empresa', 'Plano', 'Status', 'Comprovante PIX', 'Ações'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.usu_id}>
                    <td style={S.td}>{u.usu_nome}</td>
                    <td style={S.td}>{u.usu_email}</td>
                    <td style={S.td}>{u.usu_empresa || '—'}</td>
                    <td style={S.td}>{u.pla_nome || 'Gratuito'}</td>
                    <td style={S.td}>
                      <span style={{ 
                        ...S.statusChip, 
                        backgroundColor: u.usu_status === 1 ? '#064e3b' : u.usu_status === 2 ? '#78350f' : '#7f1d1d' 
                      }}>
                        {u.usu_status === 1 ? 'Ativo' : u.usu_status === 2 ? 'Pendente PIX' : 'Bloqueado'}
                      </span>
                    </td>
                    <td style={S.td}>
                      {u.comprovante_pix && u.comprovante_pix.startsWith('data:') ? (
                        <button onClick={() => { setZoomLevel(1); setViewComprovante({ url: u.comprovante_pix!, usuario: u }); }} style={S.viewBtn}>
                          🖼️ Ver Imagem
                        </button>
                      ) : (
                        <code style={S.codeBox}>{u.comprovante_pix || '—'}</code>
                      )}
                    </td>
                    <td style={S.td}>
                      {u.usu_status === 2 ? (
                        <button onClick={() => aprovarPix(u.usu_id)} style={S.approveBtn}>
                          ✅ Liberar PIX
                        </button>
                      ) : (
                        <button onClick={() => toggleStatus(u.usu_id, u.usu_status === 1 ? 0 : 1)}
                          style={{ ...S.actionBtn, backgroundColor: u.usu_status === 1 ? '#7f1d1d' : '#064e3b' }}>
                          {u.usu_status === 1 ? '🔒 Bloquear' : '✅ Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== CONFIGURAÇÕES PIX DO ADMIN ===== */}
        {!loading && tab === 'config' && (
          <div style={{ ...S.panel, maxWidth: '600px' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>⚙️ Configurações da Chave PIX do Administrador</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              Estas informações serão utilizadas pelo módulo <code>pix.js</code> para gerar os QR Codes e payloads Copia e Cola dos pagamentos dos novos assinantes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={S.label2}>Chave PIX do Administrador (CPF/CNPJ, E-mail, Celular ou Aleatória) *</label>
                <input 
                  style={S.modalInput} 
                  value={pixConfig.chavePix} 
                  placeholder="Ex: pix@connectwebeditor.com.br ou 11999999999"
                  onChange={e => setPixConfig(p => ({ ...p, chavePix: e.target.value }))}
                />
              </div>

              <div>
                <label style={S.label2}>Nome do Recebedor (Empresa ou Nome) *</label>
                <input 
                  style={S.modalInput} 
                  value={pixConfig.nomeRecebedor} 
                  placeholder="Ex: Connect Web Editor"
                  onChange={e => setPixConfig(p => ({ ...p, nomeRecebedor: e.target.value }))}
                />
              </div>

              <div>
                <label style={S.label2}>Cidade do Recebedor *</label>
                <input 
                  style={S.modalInput} 
                  value={pixConfig.cidadeRecebedor} 
                  placeholder="Ex: Sao Paulo"
                  onChange={e => setPixConfig(p => ({ ...p, cidadeRecebedor: e.target.value }))}
                />
              </div>

              <button onClick={savePixConfig} style={{ ...S.submitBtn, width: '100%', marginTop: '12px' }}>
                💾 Salvar Configurações PIX
              </button>
            </div>
          </div>
        )}

        {/* ===== BOT & QAP WHATSAPP ===== */}
        {!loading && tab === 'bot' && (
          <div style={S.panel}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>🤖 Configuração Global do Bot & QAP WhatsApp</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
              Configure o número do QAP para atendimento e a URL pública do seu servidor backend para os links das chamadas de vídeo funcionarem no celular.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
              <div>
                <label style={S.label2}>Número do WhatsApp / QAP do Atendente (DDD + Número):</label>
                <input 
                  style={S.modalInput} 
                  value={botConfig.qapPhone} 
                  placeholder="Ex: 5511999998888"
                  onChange={e => setBotConfig(b => ({ ...b, qapPhone: e.target.value }))}
                />
                <span style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '6px', display: 'block' }}>
                  📞 Este é o número que recebe as mensagens do bot e os links das chamadas de vídeo.
                </span>
              </div>

              <div>
                <label style={S.label2}>URL Pública do Backend (para o Celular carregar a chamada):</label>
                <input 
                  style={S.modalInput} 
                  value={botConfig.backendPublicUrl} 
                  placeholder="Ex: http://192.168.15.168:3001"
                  onChange={e => setBotConfig(b => ({ ...b, backendPublicUrl: e.target.value }))}
                />
                <span style={{ fontSize: '11px', color: '#fca5a5', marginTop: '6px', display: 'block' }}>
                  🔗 Defina como o IP local da sua máquina (ex: <code>http://192.168.15.168:3001</code>) ou domínio de produção para o celular conseguir abrir a chamada.
                </span>
              </div>

              <button 
                onClick={saveBotConfig} 
                style={{ ...S.submitBtn, width: '100%', marginTop: '8px' }}
              >
                💾 Salvar Configurações do Bot & QAP
              </button>

              <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '13px', marginTop: '8px' }}>
                💡 Para personalização completa de horários e respostas no Editor Web, clique no botão <strong>🤖 (Bot & QAP)</strong> na barra superior do topo!
              </div>
            </div>
          </div>
        )}

        {/* ===== PLANOS ===== */}
        {!loading && tab === 'planos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {planos.map(p => (
              <div key={p.pla_id} style={{ ...S.panel, ...(p.pla_destaque ? { border: '2px solid #6366f1' } : {}) }}>
                {p.pla_destaque === 1 && <div style={S.destaqueBadge}>⭐ Destaque</div>}
                <h3 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>{p.pla_nome}</h3>
                <div style={{ color: '#a5b4fc', fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
                  {p.pla_preco_mes === 0 ? 'Grátis' : `R$ ${p.pla_preco_mes.toFixed(2).replace('.', ',')}/mês`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                  <span>📄 {p.pla_max_pag === -1 ? 'Páginas ilimitadas' : `${p.pla_max_pag} páginas`}</span>
                  <span>📁 {p.pla_max_proj === -1 ? 'Projetos ilimitados' : `${p.pla_max_proj} projetos`}</span>
                  <span>📤 {p.pla_max_exp === -1 ? 'Exportações ilimitadas' : `${p.pla_max_exp} exportações/mês`}</span>
                </div>
                <button onClick={() => setEditPlano(p)} style={S.editBtn}>✏️ Editar Plano</button>
              </div>
            ))}
          </div>
        )}

        {/* ===== FATURAS ===== */}
        {!loading && tab === 'faturas' && (
          <div style={S.panel}>
            <table style={S.table}>
              <thead><tr>
                {['Nº Fatura', 'Cliente', 'Plano', 'Valor', 'Vencimento', 'Status', 'Comprovante PIX', 'Ação'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {faturas.map((f: any) => (
                  <tr key={f.fat_id}>
                    <td style={S.td}>{f.fat_numero}</td>
                    <td style={S.td}><div>{f.usu_nome}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{f.usu_email}</div></td>
                    <td style={S.td}>{f.pla_nome}</td>
                    <td style={S.td}>{formatBRL(f.fat_valor_liq)}</td>
                    <td style={S.td}>{new Date(f.fat_vencto).toLocaleDateString('pt-BR')}</td>
                    <td style={S.td}>
                      <span style={{ ...S.statusChip, backgroundColor: { paga: '#064e3b', pendente: '#78350f', vencida: '#7f1d1d' }[f.fat_status as string] || '#1e293b' }}>
                        {f.fat_status}
                      </span>
                    </td>
                    <td style={S.td}>
                      {f.comprovante_pix && f.comprovante_pix.startsWith('data:') ? (
                        <button onClick={() => { setZoomLevel(1); setViewComprovante({ url: f.comprovante_pix, usuario: { usu_id: f.usu_id, usu_nome: f.usu_nome, usu_email: f.usu_email } as any }); }} style={S.viewBtn}>
                          🖼️ Ver Imagem
                        </button>
                      ) : (
                        <code style={S.codeBox}>{f.comprovante_pix || '—'}</code>
                      )}
                    </td>
                    <td style={S.td}>
                      {f.fat_status === 'pendente' && (
                        <button onClick={() => aprovarPix(f.usu_id)} style={S.approveBtn}>
                          ✅ Liberar Acesso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== LOJA ADMIN ===== */}
        {!loading && tab === 'store' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px', margin: '0' }}>
            
            {/* Listagem de Comprovantes & Catálogo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Pedidos Pix Pendentes da Loja */}
              <div style={S.panel}>
                <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '16px' }}>⏳ Pedidos Pix Pendentes (Componentes)</h3>
                {storeOrders.filter(o => o.status === 'pending').length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Nenhum Pix de componentes pendente de aprovação.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {storeOrders.filter(o => o.status === 'pending').map((ord: any) => (
                      <div key={ord.id} style={{ background: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                          <span>Cliente: <strong>{ord.usuario.nome}</strong> ({ord.usuario.email})</span>
                          <span>{new Date(ord.criado).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
                          <span>Componente: <strong>{ord.componente.title}</strong></span>
                          <strong style={{ color: '#fb7185' }}>R$ {ord.componente.price.toFixed(2)}</strong>
                        </div>
                        {ord.comprovante && (
                          <button 
                            onClick={() => {
                              setZoomLevel(1);
                              setViewComprovante({
                                url: ord.comprovante,
                                usuario: { usu_id: ord.usuario.id, usu_nome: ord.usuario.nome, usu_email: ord.usuario.email } as any
                              });
                            }}
                            style={S.viewBtn}
                          >
                            🖼️ Ver Comprovante Pix
                          </button>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={async () => {
                              if (!confirm('Aprovar este pagamento e liberar o componente?')) return;
                              await axios.post(`${API_URL}/store/admin/orders/${ord.id}/approve`);
                              alert('Aprovado!');
                              loadTab('store');
                            }} 
                            style={{ ...S.approveBtn, flex: 1, padding: '8px' }}
                          >
                            ✔️ Aprovar
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm('Rejeitar este pagamento?')) return;
                              await axios.post(`${API_URL}/store/admin/orders/${ord.id}/reject`);
                              alert('Rejeitado!');
                              loadTab('store');
                            }} 
                            style={{ ...S.editBtn, background: '#ef4444', color: '#fff', border: 'none', padding: '8px' }}
                          >
                            ❌ Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catálogo de Componentes à Venda */}
              <div style={S.panel}>
                <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '16px' }}>🛍️ Catálogo de Componentes à Venda</h3>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Imagem</th>
                      <th style={S.th}>Título</th>
                      <th style={S.th}>Categoria</th>
                      <th style={S.th}>Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeComps.map((comp: any) => (
                      <tr key={comp.id}>
                        <td style={S.td}>
                          <img src={comp.thumbnail_url} alt={comp.title} style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '4px' }} />
                        </td>
                        <td style={S.td}><strong>{comp.title}</strong></td>
                        <td style={S.td}>{comp.category}</td>
                        <td style={S.td}>R$ {comp.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Coluna 2: Cadastro de Novo Componente */}
            <div style={S.panel}>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '16px' }}>➕ Cadastrar Componente</h3>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCompTitle || !newCompPayload) {
                    alert('Preencha o título e a estrutura JSON.');
                    return;
                  }
                  let parsedPayload;
                  try {
                    parsedPayload = JSON.parse(newCompPayload);
                  } catch(e) {
                    alert('JSON de estrutura inválido!');
                    return;
                  }
                  setLoading(true);
                  try {
                    await axios.post(`${API_URL}/store/admin/components`, {
                      title: newCompTitle,
                      description: newCompDesc,
                      category: newCompCategory,
                      price: parseFloat(newCompPrice),
                      thumbnail_url: newCompThumb || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300',
                      component_payload: parsedPayload
                    });
                    alert('Componente cadastrado com sucesso!');
                    setNewCompTitle('');
                    setNewCompDesc('');
                    setNewCompPayload('');
                    setNewCompThumb('');
                    loadTab('store');
                  } catch (err) {
                    alert('Erro ao cadastrar componente.');
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {/* Fábrica por IA */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '12px', color: '#fb7185', fontWeight: 600 }}>🤖 Fábrica de Componentes por IA</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Provedor IA</label>
                      <select 
                        value={aiProvider} 
                        onChange={e => setAiProvider(e.target.value as any)}
                        style={{ ...S.modalInput, color: '#f8fafc', backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: '11px', height: '30px', padding: '0 8px', margin: 0, borderRadius: '4px' }}
                      >
                        <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="gemini">Google Gemini</option>
                        <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="openai">OpenAI</option>
                        <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="groq">Groq</option>
                        <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="ollama">Ollama Local</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '10px', color: '#94a3b8' }}>Modelo {aiProvider === 'ollama' && ollamaModels.length > 0 ? '' : '(Opcional)'}</label>
                      {aiProvider === 'ollama' && ollamaModels.length > 0 ? (
                        <select
                          value={aiModel}
                          onChange={e => setAiModel(e.target.value)}
                          style={{ ...S.modalInput, color: '#f8fafc', backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: '11px', height: '30px', padding: '0 8px', margin: 0, borderRadius: '4px' }}
                        >
                          {ollamaModels.map(m => (
                            <option key={m} style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value={m}>{m}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          placeholder={aiProvider === 'gemini' ? 'gemini-1.5-flash' : aiProvider === 'openai' ? 'gpt-4o-mini' : aiProvider === 'groq' ? 'llama-3.1-70b-versatile' : 'llama3'} 
                          value={aiModel} 
                          onChange={e => setAiModel(e.target.value)}
                          style={{ ...S.modalInput, fontSize: '11px', height: '30px', margin: 0 }}
                        />
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Descreva o que quer gerar. Ex: Seção Hero futurista com um botão de gradiente roxo e título animado"
                    value={aiDescription}
                    onChange={e => setAiDescription(e.target.value)}
                    style={{ ...S.modalInput, fontSize: '11px', margin: 0 }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {aiProvider === 'ollama' ? (
                      <input
                        type="text"
                        placeholder="http://localhost:11434"
                        value={aiOllamaUrl}
                        onChange={e => setAiOllamaUrl(e.target.value)}
                        style={{ ...S.modalInput, fontSize: '11px', flex: 1, height: '30px', margin: 0 }}
                      />
                    ) : (
                      <input
                        type="password"
                        placeholder="Chave API (opcional se no .env)"
                        value={aiApiKey}
                        onChange={e => setAiApiKey(e.target.value)}
                        style={{ ...S.modalInput, fontSize: '11px', flex: 1, height: '30px', margin: 0 }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateWithIA}
                      disabled={aiLoading}
                      style={{
                        height: '30px',
                        padding: '0 12px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '11px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {aiLoading ? 'Gerando...' : 'Gerar IA'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={S.label2}>Título do Componente</label>
                  <input type="text" style={S.modalInput} value={newCompTitle} onChange={e => setNewCompTitle(e.target.value)} placeholder="Ex: Galeria Premium" />
                </div>
                <div>
                  <label style={S.label2}>Descrição</label>
                  <textarea style={S.modalInput} rows={2} value={newCompDesc} onChange={e => setNewCompDesc(e.target.value)} placeholder="Detalhes do componente..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={S.label2}>Categoria</label>
                    <select style={{ ...S.modalInput, color: '#f1f5f9', backgroundColor: '#0f172a' }} value={newCompCategory} onChange={e => setNewCompCategory(e.target.value)}>
                      <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="sections">Seções (Sections)</option>
                      <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="forms">Formulários</option>
                      <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="ui">Componentes UI</option>
                      <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="templates">Templates</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label2}>Preço (R$)</label>
                    <input type="number" step="0.01" style={S.modalInput} value={newCompPrice} onChange={e => setNewCompPrice(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={S.label2}>Thumbnail URL</label>
                  <input type="text" style={S.modalInput} value={newCompThumb} onChange={e => setNewCompThumb(e.target.value)} placeholder="https://images.unsplash.com/..." />
                </div>
                <div>
                  <label style={S.label2}>Payload JSON da Estrutura</label>
                  <textarea 
                    style={{ ...S.modalInput, fontFamily: 'monospace', fontSize: '11px' }} 
                    rows={6} 
                    value={newCompPayload} 
                    onChange={e => setNewCompPayload(e.target.value)} 
                    placeholder='{ "type": "container", "tagName": "div", "children": [] }'
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    💡 Dica: Você também pode abrir o editor, selecionar um componente e cadastrá-lo por lá usando o botão "Usar Selecionado no Canvas" na aba Loja!
                  </span>
                </div>
                <button type="submit" style={{ ...S.submitBtn, width: '100%', marginTop: '10px' }}>🚀 Publicar na Loja</button>
              </form>
            </div>

          </div>
        )}
      </main>

      {/* ===== MODAL DE LEITURA DO COMPROVANTE COM ZOOM ===== */}
      {viewComprovante && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, maxWidth: '850px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '18px' }}>📄 Comprovante PIX de {viewComprovante.usuario.usu_nome}</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>E-mail: {viewComprovante.usuario.usu_email}</div>
              </div>
              <button onClick={() => setViewComprovante(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            {/* Toolbar do Zoom e Download */}
            <div style={S.zoomToolbar}>
              <button onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))} style={S.zoomBtn}>🔍 Zoom In (+)</button>
              <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: '700' }}>{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))} style={S.zoomBtn}>🔍 Zoom Out (-)</button>
              <button onClick={() => setZoomLevel(1)} style={S.zoomBtn}>🔄 Reset Zoom</button>
              <button onClick={downloadComprovante} style={{ ...S.zoomBtn, background: '#10b981', color: '#fff', fontWeight: '700' }}>
                📥 Baixar para HD
              </button>
              <a href={viewComprovante.url} target="_blank" rel="noreferrer" style={{ ...S.zoomBtn, textDecoration: 'none' }}>🌐 Nova Aba</a>
            </div>

            {/* Container da Imagem com Scroll + Zoom */}
            <div style={S.imageViewerBox}>
              {viewComprovante.url.startsWith('data:image') || viewComprovante.url.startsWith('data:') ? (
                <img 
                  src={viewComprovante.url} 
                  alt="Comprovante de Pagamento" 
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                    maxWidth: '100%',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '8px'
                  }} 
                />
              ) : (
                <iframe src={viewComprovante.url} title="Comprovante PDF" style={{ width: '100%', height: '500px', border: 'none' }} />
              )}
            </div>

            {/* Rodapé do Modal com Ação de Aprovação e Download */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1e293b', gap: '12px' }}>
              <button onClick={() => setViewComprovante(null)} style={S.backBtn}>Fechar</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={downloadComprovante} style={{ ...S.approveBtnLarge, background: '#10b981' }}>
                  📥 Baixar Comprovante (HD)
                </button>
                <button onClick={() => aprovarPix(viewComprovante.usuario.usu_id)} style={S.approveBtnLarge}>
                  ✅ Aprovar PIX & Liberar Acesso do Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Plano */}
      {editPlano && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={{ color: '#e2e8f0', marginBottom: '20px' }}>✏️ Editar Plano: {editPlano.pla_nome}</h3>
            {[
              { label: 'Nome', key: 'pla_nome', type: 'text' },
              { label: 'Preço Mensal (R$)', key: 'pla_preco_mes', type: 'number' },
              { label: 'Preço Anual (R$)', key: 'pla_preco_ano', type: 'number' },
              { label: 'Máx. Páginas (-1 = ilimitado)', key: 'pla_max_pag', type: 'number' },
              { label: 'Máx. Projetos (-1 = ilimitado)', key: 'pla_max_proj', type: 'number' },
              { label: 'Máx. Exportações (-1 = ilimitado)', key: 'pla_max_exp', type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={S.label2}>{f.label}</label>
                <input type={f.type} value={(editPlano as any)[f.key]} style={S.modalInput}
                  onChange={e => setEditPlano(prev => prev ? { ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value } : null)} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setEditPlano(null)} style={{ ...S.actionBtn, background: '#334155' }}>Cancelar</button>
              <button onClick={savePlano} style={{ ...S.actionBtn, background: '#4f46e5' }}>💾 Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  root: { display: 'flex', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  sidebar: { width: '230px', minWidth: '230px', background: '#0d1326', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '20px 0' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px 20px', borderBottom: '1px solid #1e293b', marginBottom: '12px' },
  navBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', textAlign: 'left' },
  navBtnActive: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderLeft: '3px solid #6366f1' },
  badgeCount: { background: '#f59e0b', color: '#0f172a', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' },
  sidebarUser: { padding: '16px 20px', borderTop: '1px solid #1e293b' },
  logoutBtn: { background: 'none', border: '1px solid #334155', color: '#64748b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%' },
  main: { flex: 1, overflow: 'auto', padding: '28px 32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 },
  badge: { background: '#312e81', color: '#a5b4fc', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badge2: { background: '#312e81', color: '#a5b4fc', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  successAlert: { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' },
  loading: { color: '#64748b', fontSize: '16px', padding: '40px', textAlign: 'center' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  kpiCard: { background: '#0d1326', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
  kpiValue: { fontSize: '20px', fontWeight: '700', color: '#f1f5f9' },
  kpiLabel: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  panel: { background: '#0d1326', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', position: 'relative' },
  panelTitle: { color: '#e2e8f0', margin: '0 0 16px', fontSize: '15px' },
  planoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#64748b', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #0f172a' },
  codeBox: { background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#a5b4fc', fontSize: '11px' },
  statusChip: { padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#e2e8f0' },
  approveBtn: { padding: '6px 12px', background: '#10b981', color: '#0f172a', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' },
  approveBtnLarge: { padding: '12px 24px', background: '#10b981', color: '#0f172a', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' },
  viewBtn: { padding: '4px 10px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  actionBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', color: '#e2e8f0', fontSize: '12px' },
  editBtn: { width: '100%', padding: '8px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '13px' },
  submitBtn: { padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: '700', fontSize: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer' },
  backBtn: { padding: '10px 16px', background: '#334155', color: '#e2e8f0', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px' },
  destaqueBadge: { position: 'absolute', top: '12px', right: '12px', background: '#312e81', color: '#a5b4fc', padding: '2px 10px', borderRadius: '20px', fontSize: '11px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0d1326', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' },
  label2: { display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' },
  modalInput: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', boxSizing: 'border-box' },
  zoomToolbar: { display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '12px' },
  zoomBtn: { padding: '6px 12px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  imageViewerBox: { flex: 1, overflow: 'auto', maxHeight: '55vh', background: '#050811', borderRadius: '8px', padding: '16px', border: '1px solid #1e293b' }
};
