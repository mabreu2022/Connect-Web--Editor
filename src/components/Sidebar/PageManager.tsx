import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { FileText, Plus, Trash2, Globe } from 'lucide-react';

export const PageManager: React.FC = () => {
  const { pages, activePageId, switchPage, addPage, removePage, activePage, updatePageSEO } = useEditor();
  const [newPageName, setNewPageName] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;
    addPage(newPageName.trim(), newPageTitle.trim() || newPageName.trim());
    setNewPageName('');
    setNewPageTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="page-manager-container" style={{ padding: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="category-title" style={{ margin: 0 }}>
          📑 Páginas do Projeto ({pages.length})
        </span>
        <button
          className="action-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-primary)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
        >
          <Plus size={12} />
          Nova Página
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreatePage} style={{ background: 'var(--bg-panel)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)' }}>
          <div className="field-group" style={{ marginBottom: 0 }}>
            <label>Nome do Arquivo (ex: sobre.html)</label>
            <input
              type="text"
              className="field-input"
              value={newPageName}
              onChange={e => setNewPageName(e.target.value)}
              placeholder="ex: servicos.html"
              required
            />
          </div>
          <div className="field-group" style={{ marginBottom: 0 }}>
            <label>Título da Página (SEO)</label>
            <input
              type="text"
              className="field-input"
              value={newPageTitle}
              onChange={e => setNewPageTitle(e.target.value)}
              placeholder="ex: Nossos Serviços"
            />
          </div>
          <button type="submit" className="btn-export" style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
            Criar Página
          </button>
        </form>
      )}

      {/* Lista de Páginas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {pages.map(page => {
          const isActive = page.id === activePageId;
          return (
            <div
              key={page.id}
              onClick={() => switchPage(page.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-panel)',
                border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-main)' }}>
                    {page.fileName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {page.title}
                  </div>
                </div>
              </div>

              {pages.length > 1 && (
                <button
                  className="action-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(page.id);
                  }}
                  title="Excluir Página"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* SEO & Meta Tags */}
      <div className="inspector-section" style={{ padding: 0, border: 'none' }}>
        <div className="category-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Globe size={14} style={{ color: 'var(--accent-secondary)' }} />
          Configurações de SEO ({activePage.fileName})
        </div>

        <div className="field-group">
          <label>Meta Title (&lt;title&gt;)</label>
          <input
            type="text"
            className="field-input"
            value={activePage.seo.title}
            onChange={e => updatePageSEO({ title: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Meta Description</label>
          <textarea
            className="field-input"
            rows={3}
            value={activePage.seo.description}
            onChange={e => updatePageSEO({ description: e.target.value })}
          />
        </div>

        <div className="field-group">
          <label>Keywords (Palavras-chave)</label>
          <input
            type="text"
            className="field-input"
            value={activePage.seo.keywords}
            onChange={e => updatePageSEO({ keywords: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
