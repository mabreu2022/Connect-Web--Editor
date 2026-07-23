import React, { useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import type { ElementNode } from '../../types/editor';
import { Sliders, Settings, Trash2, Copy, Database, ListPlus, ChevronRight, Link as LinkIcon, Upload, Image as ImageIcon, Bot } from 'lucide-react';

export const PropertyInspector: React.FC = () => {
  const { 
    nodes, 
    selectedId, 
    setSelectedId, 
    updateNode, 
    updateNodeStyles, 
    updateNodeAttributes, 
    removeNode, 
    duplicateNode, 
    setRawJs,
    pages,
    botConfig,
    updateBotConfig,
    setIsBotModalOpen
  } = useEditor();

  const imgInputRef = useRef<HTMLInputElement>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);

  if (!selectedId) {
    return (
      <aside className="right-inspector">
        <div className="inspector-empty">
          <Sliders size={40} />
          <h4 style={{ color: 'var(--text-main)', fontSize: '15px' }}>Inspetor de Propriedades</h4>
          <p style={{ fontSize: '13px' }}>
            Selecione um componente no Canvas ou na Árvore DOM para editar seus estilos, atributos e formulários.
          </p>
        </div>
      </aside>
    );
  }

  // Find selected node in tree and build parent breadcrumb path
  let selectedNode: ElementNode | null = null;
  let nodeAncestors: ElementNode[] = [];

  function findNodeAndPath(list: ElementNode[], currentPath: ElementNode[]) {
    for (const item of list) {
      const pathWithItem = [...currentPath, item];
      if (item.id === selectedId) {
        selectedNode = item;
        nodeAncestors = pathWithItem;
        return;
      }
      if (item.children && item.children.length > 0) {
        findNodeAndPath(item.children, pathWithItem);
      }
    }
  }

  findNodeAndPath(nodes, []);

  if (!selectedNode) return null;

  const node: ElementNode = selectedNode;
  const styles = node.styles || {};
  const attrs = node.attributes || {};
  const tagLower = (node.tagName || 'div').toLowerCase();

  const handleStyleChange = (key: string, value: string) => {
    updateNodeStyles(node.id, { [key]: value });
  };

  const handleAttrChange = (key: string, value: string) => {
    updateNodeAttributes(node.id, { [key]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && node) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          updateNodeAttributes(node.id, { src: dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && node) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          handleStyleChange('backgroundImage', `url('${dataUrl}')`);
          handleStyleChange('backgroundSize', 'cover');
          handleStyleChange('backgroundPosition', 'center');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSelectOption = () => {
    const newOption: ElementNode = {
      id: 'el_' + Math.random().toString(36).substring(2, 9),
      type: 'heading',
      tagName: 'option',
      label: 'Opção',
      content: `Nova Opção ${(node.children ? node.children.length : 0) + 1}`,
      attributes: { value: `opcao_${(node.children ? node.children.length : 0) + 1}` },
      styles: {},
      children: []
    };
    updateNode(node.id, { children: [...(node.children || []), newOption] });
  };

  const handleUpdateOption = (optId: string, content: string, val: string) => {
    const updatedChildren = (node.children || []).map(child =>
      child.id === optId
        ? { ...child, content, attributes: { ...child.attributes, value: val } }
        : child
    );
    updateNode(node.id, { children: updatedChildren });
  };

  const handleRemoveOption = (optId: string) => {
    const updatedChildren = (node.children || []).filter(child => child.id !== optId);
    updateNode(node.id, { children: updatedChildren });
  };

  const handleGenerateDBCode = () => {
    const table = attrs['data-db-table'] || 'clientes';
    const endpoint = attrs['data-api-endpoint'] || `http://localhost:3000/api/${table}`;

    const dbScript = `// --- CONEXÃO AO BANCO DE DADOS (${table.toUpperCase()}) ---
async function enviarParaBancoDados(event) {
  if (event) event.preventDefault();
  const formElement = event ? event.target : document.querySelector('form');
  const formData = new FormData(formElement);
  const payload = Object.fromEntries(formData.entries());

  console.log('Enviando registro para a tabela ${table}:', payload);

  try {
    const response = await fetch('${endpoint}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      alert('Registro salvo com sucesso no banco de dados!');
      console.log('Resposta do Servidor:', data);
    } else {
      alert('Simulação de Banco de Dados: Dados enviados para ${endpoint}');
    }
  } catch (err) {
    console.error('Falha na comunicação com o banco:', err);
    alert('Dados vinculados prontos para API/Banco de Dados (${endpoint})');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', enviarParaBancoDados);
  }
});`;

    setRawJs(dbScript.trim());
    alert('Script de conexão com Banco de Dados gerado com sucesso no script.js!');
  };

  return (
    <aside className="right-inspector">
      {/* Breadcrumb Hierarchy Navigation */}
      <div style={{ padding: '8px 12px', background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', fontSize: '11px' }}>
        {nodeAncestors.map((ancestor, idx) => (
          <React.Fragment key={ancestor.id}>
            <span
              onClick={() => setSelectedId(ancestor.id)}
              style={{
                color: ancestor.id === selectedId ? 'var(--accent-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                fontWeight: ancestor.id === selectedId ? 700 : 400,
                whiteSpace: 'nowrap'
              }}
            >
              &lt;{ancestor.tagName}&gt;
            </span>
            {idx < nodeAncestors.length - 1 && <ChevronRight size={10} style={{ color: 'var(--text-dim)' }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="inspector-header">
        <div className="inspector-title">
          <Settings size={18} className="node-type-icon" />
          <span>{node.label}</span>
          <span className="node-tag-name">&lt;{node.tagName}&gt;</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="action-btn"
            onClick={() => duplicateNode(node.id)}
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          <button
            className="action-btn danger"
            onClick={() => removeNode(node.id)}
            title="Excluir"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Editor Específico para Widget Chat & WebRTC / QAP */}
      {(node.type === 'widget-chat' || (node.attributes.class && node.attributes.class.includes('cwe-webrtc-widget'))) && (
        <div className="inspector-section" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div className="section-label" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '12px' }}>
            <Bot size={16} />
            📹 Configuração QAP — Vídeo Atendimento
          </div>

          <div className="field-group" style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              📞 Número QAP do Atendente <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="tel"
                id="qap-phone-input-inspector"
                className="field-input"
                placeholder="ex: 5511945457934"
                defaultValue={node.attributes['data-qap-phone'] || botConfig.qapPhone || ''}
                style={{ flex: 1, padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
              />
              <button
                title="Salvar número no componente"
                onClick={() => {
                  const input = document.getElementById('qap-phone-input-inspector') as HTMLInputElement;
                  const val = input?.value?.trim();
                  if (!val) return;
                  updateNodeAttributes(node.id, { 'data-qap-phone': val });
                  updateBotConfig({ qapPhone: val });
                  input.style.borderColor = '#10b981';
                  input.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.3)';
                  setTimeout(() => {
                    input.style.borderColor = '#334155';
                    input.style.boxShadow = 'none';
                  }, 2000);
                }}
                style={{ padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                💾 Salvar
              </button>
            </div>
            <span style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '4px', display: 'block' }}>
              Número salvo: <strong style={{ color: '#fff' }}>{node.attributes['data-qap-phone'] || botConfig.qapPhone || '(não configurado)'}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Início (Abertura):</label>
              <input
                type="time"
                className="field-input"
                value={node.attributes['data-qap-start'] || botConfig.startTime || '08:00'}
                onChange={e => {
                  const val = e.target.value;
                  updateNodeAttributes(node.id, { 'data-qap-start': val });
                  updateBotConfig({ startTime: val });
                }}
                style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Fim (Fechamento):</label>
              <input
                type="time"
                className="field-input"
                value={node.attributes['data-qap-end'] || botConfig.endTime || '18:00'}
                onChange={e => {
                  const val = e.target.value;
                  updateNodeAttributes(node.id, { 'data-qap-end': val });
                  updateBotConfig({ endTime: val });
                }}
                style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
              />
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Mensagem Fora de Horário:</label>
            <textarea
              className="field-input"
              rows={2}
              value={node.attributes['data-qap-out-msg'] || botConfig.outOfHoursMessage || ''}
              onChange={e => {
                const val = e.target.value;
                updateNodeAttributes(node.id, { 'data-qap-out-msg': val });
                updateBotConfig({ outOfHoursMessage: val });
              }}
              style={{ width: '100%', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
            />
          </div>

          <button
            className="btn-export"
            style={{ width: '100%', backgroundColor: '#6366f1', justifyContent: 'center', fontSize: '12px', padding: '8px' }}
            onClick={() => setIsBotModalOpen(true)}
          >
            <Bot size={14} /> Gerenciador Completo de FAQ do Bot
          </button>
        </div>
      )}

      {/* Editor Específico para Imagem (Upload do HD e Redimensionamento) */}
      {tagLower === 'img' && (
        <div className="inspector-section" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
          <input
            type="file"
            ref={imgInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <div className="section-label" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={14} />
            Imagem do HD & Redimensionamento
          </div>

          <button
            className="btn-export"
            style={{ width: '100%', marginBottom: '12px', backgroundColor: 'var(--accent-primary)', justifyContent: 'center' }}
            onClick={() => imgInputRef.current?.click()}
          >
            <Upload size={14} />
            Escolher Imagem do HD
          </button>

          <div className="field-group">
            <label>URL / Fonte da Imagem (Src)</label>
            <input
              type="text"
              className="field-input"
              value={attrs.src || ''}
              onChange={(e) => handleAttrChange('src', e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          <div className="box-model-grid">
            <div className="field-group">
              <label>Largura (Width)</label>
              <input
                type="text"
                className="field-input"
                value={styles.width || attrs.width || ''}
                onChange={(e) => {
                  handleStyleChange('width', e.target.value);
                  handleAttrChange('width', e.target.value);
                }}
                placeholder="ex: 100%, 300px"
              />
            </div>
            <div className="field-group">
              <label>Altura Máx (Height)</label>
              <input
                type="text"
                className="field-input"
                value={styles.maxHeight || ''}
                onChange={(e) => handleStyleChange('maxHeight', e.target.value)}
                placeholder="ex: 300px, auto"
              />
            </div>
          </div>

          <div className="field-group">
            <label>Modo de Enquadramento (Object Fit)</label>
            <select
              className="field-input"
              value={styles.objectFit || 'cover'}
              onChange={(e) => handleStyleChange('objectFit', e.target.value)}
            >
              <option value="cover">Cover (Preencher sem distorcer)</option>
              <option value="contain">Contain (Manter inteira)</option>
              <option value="fill">Fill (Esticar)</option>
              <option value="none">None (Tamanho real)</option>
            </select>
          </div>
        </div>
      )}

      {/* Editor Específico para Select / Dropdowns */}
      {tagLower === 'select' && (
        <div className="inspector-section" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
          <div className="section-label" style={{ color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListPlus size={14} />
              Opções da Seleção (Select Options)
            </span>
            <button
              onClick={handleAddSelectOption}
              style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              + Opção
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {(node.children || []).map((opt) => (
              <div key={opt.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Rótulo"
                  value={opt.content || ''}
                  onChange={(e) => handleUpdateOption(opt.id, e.target.value, opt.attributes.value || e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  className="field-input"
                  placeholder="Value"
                  value={opt.attributes.value || ''}
                  onChange={(e) => handleUpdateOption(opt.id, opt.content || '', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="action-btn danger"
                  onClick={() => handleRemoveOption(opt.id)}
                  title="Remover Opção"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vinculação de Links de Navegação */}
      {tagLower === 'a' && (
        <div className="inspector-section" style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)' }}>
          <div className="section-label" style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkIcon size={14} />
            Destino do Menu / Link
          </div>

          <div className="field-group">
            <label>Link de Página do Projeto</label>
            <select
              className="field-input"
              value={attrs.href || '#'}
              onChange={(e) => handleAttrChange('href', e.target.value)}
            >
              <option value="#">Link Interno (#)</option>
              {pages.map(p => (
                <option key={p.id} value={p.fileName}>
                  {p.fileName} ({p.title})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Vinculação de Banco de Dados / Data Binding */}
      <div className="inspector-section">
        <div className="section-label" style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} />
          Conexão & Banco de Dados
        </div>
        
        <div className="field-group">
          <label>Tabela do Banco (Entity)</label>
          <input
            type="text"
            className="field-input"
            value={attrs['data-db-table'] || ''}
            onChange={(e) => handleAttrChange('data-db-table', e.target.value)}
            placeholder="ex: clientes, usuarios, chamados"
          />
        </div>

        <div className="field-group">
          <label>Coluna do Banco (Field)</label>
          <input
            type="text"
            className="field-input"
            value={attrs['data-db-field'] || ''}
            onChange={(e) => handleAttrChange('data-db-field', e.target.value)}
            placeholder="ex: nome, email, status"
          />
        </div>

        <div className="field-group">
          <label>URL API Endpoint (REST / Backend)</label>
          <input
            type="text"
            className="field-input"
            value={attrs['data-api-endpoint'] || ''}
            onChange={(e) => handleAttrChange('data-api-endpoint', e.target.value)}
            placeholder="http://localhost:3000/api/clientes"
          />
        </div>

        <button
          className="btn-export"
          style={{ width: '100%', marginTop: '6px', backgroundColor: '#06b6d4' }}
          onClick={handleGenerateDBCode}
        >
          Gerar Script JS de Banco
        </button>
      </div>

      {/* Conteúdo de Texto */}
      {node.content !== undefined && (
        <div className="inspector-section">
          <div className="section-label">Conteúdo do Texto</div>
          <div className="field-group">
            <textarea
              className="field-input"
              rows={3}
              value={node.content}
              onChange={(e) => updateNode(node.id, { content: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Atributos Gerais e de Formulário */}
      <div className="inspector-section">
        <div className="section-label">Atributos & Formulário</div>
        
        <div className="field-group">
          <label>ID do Elemento</label>
          <input
            type="text"
            className="field-input"
            value={attrs.id || ''}
            onChange={(e) => handleAttrChange('id', e.target.value)}
            placeholder="ex: form_login"
          />
        </div>

        <div className="field-group">
          <label>Classes CSS</label>
          <input
            type="text"
            className="field-input"
            value={attrs.class || ''}
            onChange={(e) => handleAttrChange('class', e.target.value)}
            placeholder="ex: btn btn-primary"
          />
        </div>

        {attrs.placeholder !== undefined && (
          <div className="field-group">
            <label>Placeholder</label>
            <input
              type="text"
              className="field-input"
              value={attrs.placeholder || ''}
              onChange={(e) => handleAttrChange('placeholder', e.target.value)}
            />
          </div>
        )}

        {attrs.name !== undefined && (
          <div className="field-group">
            <label>Nome do Campo (Name)</label>
            <input
              type="text"
              className="field-input"
              value={attrs.name || ''}
              onChange={(e) => handleAttrChange('name', e.target.value)}
            />
          </div>
        )}

        {attrs.type !== undefined && (
          <div className="field-group">
            <label>Tipo (Type)</label>
            <input
              type="text"
              className="field-input"
              value={attrs.type || ''}
              onChange={(e) => handleAttrChange('type', e.target.value)}
            />
          </div>
        )}

        {attrs.action !== undefined && (
          <div className="field-group">
            <label>Form Action URL</label>
            <input
              type="text"
              className="field-input"
              value={attrs.action || ''}
              onChange={(e) => handleAttrChange('action', e.target.value)}
            />
          </div>
        )}

        {attrs.method !== undefined && (
          <div className="field-group">
            <label>Método de Envio</label>
            <select
              className="field-input"
              value={attrs.method || 'POST'}
              onChange={(e) => handleAttrChange('method', e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>
        )}

        {(attrs.href !== undefined || tagLower === 'a' || tagLower === 'button') && (
          <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Link de Destino (Href)</span>
              {(attrs.href === '#' || !attrs.href) && (
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>⚠️ Pendente</span>
              )}
            </label>

            {/* Seletor de Páginas do Projeto */}
            <select
              className="field-input"
              style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 600 }}
              value={pages.some(p => p.fileName === attrs.href) ? attrs.href : (attrs.href === '#' || !attrs.href ? '#' : 'custom')}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                  handleAttrChange('href', val);
                }
              }}
            >
              <option value="#">⚠️ # (Link Pendente - Sem Destino)</option>
              <optgroup label="📄 Páginas Criadas no Projeto">
                {pages.map(p => (
                  <option key={p.id} value={p.fileName}>
                    📄 {p.fileName} ({p.title})
                  </option>
                ))}
              </optgroup>
              <option value="custom">🌐 URL Externa / Personalizada...</option>
            </select>

            {/* Input para URL manual ou externa */}
            <input
              type="text"
              className="field-input"
              placeholder="ex: contato.html ou https://..."
              value={attrs.href || ''}
              onChange={(e) => handleAttrChange('href', e.target.value)}
            />

            {(attrs.href === '#' || !attrs.href) && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#fca5a5', lineHeight: '1.4' }}>
                ⚠️ <strong>Link sem destino:</strong> Escolha uma página acima (ex: <code>contato.html</code>) para que a navegação funcione após salvar o site.
              </div>
            )}
          </div>
        )}

        {attrs.src !== undefined && (
          <div className="field-group">
            <label>URL da Imagem (Src)</label>
            <input
              type="text"
              className="field-input"
              value={attrs.src || ''}
              onChange={(e) => handleAttrChange('src', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Imagem de Fundo & Efeito Parallax */}
      {['section', 'div', 'header', 'footer'].includes(tagLower) && (
        <div className="inspector-section" style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', padding: '12px' }}>
          <input
            type="file"
            ref={bgImgInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleBgImageUpload}
          />

          <div className="section-label" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '12px' }}>
            <ImageIcon size={14} />
            Imagem de Fundo & Parallax
          </div>

          <button
            className="btn-export"
            style={{ width: '100%', marginBottom: '12px', backgroundColor: 'var(--accent-primary)', justifyContent: 'center' }}
            onClick={() => bgImgInputRef.current?.click()}
          >
            <Upload size={14} />
            Carregar Imagem de Fundo (HD)
          </button>

          <div className="field-group" style={{ marginBottom: '10px' }}>
            <label>Ou URL da Imagem de Fundo</label>
            <input
              type="text"
              className="field-input"
              value={styles.backgroundImage ? styles.backgroundImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '') : ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  handleStyleChange('backgroundImage', `url('${val}')`);
                  handleStyleChange('backgroundSize', 'cover');
                  handleStyleChange('backgroundPosition', 'center');
                } else {
                  handleStyleChange('backgroundImage', '');
                }
              }}
              placeholder="https://exemplo.com/fundo.jpg"
            />
          </div>

          {styles.backgroundImage && (
            <>
              <div className="field-group" style={{ marginBottom: '10px' }}>
                <label>Efeito Parallax (Fundo Fixo)</label>
                <select
                  className="field-input"
                  value={styles.backgroundAttachment || 'scroll'}
                  onChange={(e) => handleStyleChange('backgroundAttachment', e.target.value)}
                >
                  <option value="scroll">Normal (Rolar com o site)</option>
                  <option value="fixed">✨ Parallax (Imagem Fixa ao Rolar)</option>
                </select>
              </div>

              <div className="box-model-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field-group">
                  <label>Tamanho do Fundo</label>
                  <select
                    className="field-input"
                    value={styles.backgroundSize || 'cover'}
                    onChange={(e) => handleStyleChange('backgroundSize', e.target.value)}
                  >
                    <option value="cover">Cover (Preencher)</option>
                    <option value="contain">Contain (Manter Proporção)</option>
                    <option value="auto">Auto (Original)</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Posição do Fundo</label>
                  <select
                    className="field-input"
                    value={styles.backgroundPosition || 'center'}
                    onChange={(e) => handleStyleChange('backgroundPosition', e.target.value)}
                  >
                    <option value="center">Centro</option>
                    <option value="top">Topo</option>
                    <option value="bottom">Rodapé</option>
                    <option value="left">Esquerda</option>
                    <option value="right">Direita</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tipografia e Cores */}
      <div className="inspector-section">
        <div className="section-label">Cores & Tipografia</div>
        
        <div className="field-group">
          <label>Cor do Texto</label>
          <div className="color-picker-row">
            <input
              type="color"
              className="color-swatch-input"
              value={styles.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
            <input
              type="text"
              className="field-input"
              value={styles.color || ''}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              placeholder="#000000"
            />
          </div>
          <div className="preset-color-grid">
            {['#ffffff', '#f8fafc', '#cbd5e1', '#64748b', '#1e293b', '#0f172a', '#000000', '#6366f1', '#4f46e5', '#3b82f6', '#0284c7', '#06b6d4', '#10b981', '#059669', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#ec4899', '#8b5cf6', 'transparent'].map((c) => (
              <div
                key={'txt_' + c}
                className="preset-color-circle"
                style={{ backgroundColor: c === 'transparent' ? '#fff' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '6px 6px' }}
                onClick={() => handleStyleChange('color', c)}
                title={`Selecionar cor ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="field-group">
          <label>Cor de Fundo</label>
          <div className="color-picker-row">
            <input
              type="color"
              className="color-swatch-input"
              value={styles.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            />
            <input
              type="text"
              className="field-input"
              value={styles.backgroundColor || ''}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              placeholder="#ffffff"
            />
          </div>
          <div className="preset-color-grid">
            {['#ffffff', '#f8fafc', '#cbd5e1', '#64748b', '#1e293b', '#0f172a', '#000000', '#6366f1', '#4f46e5', '#3b82f6', '#0284c7', '#06b6d4', '#10b981', '#059669', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#ec4899', '#8b5cf6', 'transparent'].map((c) => (
              <div
                key={'bg_' + c}
                className="preset-color-circle"
                style={{ backgroundColor: c === 'transparent' ? '#fff' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '6px 6px' }}
                onClick={() => handleStyleChange('backgroundColor', c)}
                title={`Selecionar cor ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="field-group">
          <label>Tamanho da Fonte (Font Size)</label>
          <input
            type="text"
            className="field-input"
            value={styles.fontSize || ''}
            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            placeholder="ex: 16px"
          />
        </div>

        <div className="field-group">
          <label>Alinhamento de Texto</label>
          <select
            className="field-input"
            value={styles.textAlign || 'left'}
            onChange={(e) => handleStyleChange('textAlign', e.target.value)}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centralizado</option>
            <option value="right">Direita</option>
            <option value="justify">Justificado</option>
          </select>
        </div>
      </div>

      {/* Espaçamento e Bordas */}
      <div className="inspector-section">
        <div className="section-label">Espaçamento & Bordas</div>

        <div className="box-model-grid">
          <div className="field-group">
            <label>Padding Internal</label>
            <input
              type="text"
              className="field-input"
              value={styles.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              placeholder="ex: 12px 20px"
            />
          </div>
          <div className="field-group">
            <label>Margin External</label>
            <input
              type="text"
              className="field-input"
              value={styles.margin || ''}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
              placeholder="ex: 0 auto"
            />
          </div>
        </div>

        <div className="box-model-grid">
          <div className="field-group">
            <label>Arredondamento (Radius)</label>
            <input
              type="text"
              className="field-input"
              value={styles.borderRadius || ''}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
              placeholder="ex: 8px"
            />
          </div>
          <div className="field-group">
            <label>Sombra (Box Shadow)</label>
            <input
              type="text"
              className="field-input"
              value={styles.boxShadow || ''}
              onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
              placeholder="ex: 0 4px 12px rgba(0,0,0,0.1)"
            />
          </div>
        </div>
      </div>

      {/* Layout Flex & Grid */}
      <div className="inspector-section">
        <div className="section-label">Layout & Display</div>
        
        <div className="field-group">
          <label>Display</label>
          <select
            className="field-input"
            value={styles.display || 'block'}
            onChange={(e) => handleStyleChange('display', e.target.value)}
          >
            <option value="block">Block</option>
            <option value="flex">Flexbox</option>
            <option value="grid">Grid Responsivo</option>
            <option value="inline-block">Inline-Block</option>
          </select>
        </div>

        {styles.display === 'flex' && (
          <>
            <div className="field-group">
              <label>Flex Direction</label>
              <select
                className="field-input"
                value={styles.flexDirection || 'row'}
                onChange={(e) => handleStyleChange('flexDirection', e.target.value)}
              >
                <option value="row">Linha (Row)</option>
                <option value="column">Coluna (Column)</option>
              </select>
            </div>

            <div className="field-group">
              <label>Gap Espaçamento</label>
              <input
                type="text"
                className="field-input"
                value={styles.gap || ''}
                onChange={(e) => handleStyleChange('gap', e.target.value)}
                placeholder="ex: 16px"
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
