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

type Tab = 'dashboard' | 'pendentes' | 'usuarios' | 'planos' | 'faturas' | 'config';

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

  // Configurações PIX do Admin
  const [pixConfig, setPixConfig] = useState({ chavePix: '', nomeRecebedor: '', cidadeRecebedor: '' });

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

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
