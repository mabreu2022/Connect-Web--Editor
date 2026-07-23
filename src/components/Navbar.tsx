import React, { useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { useAuth } from '../context/AuthContext';
import { 
  Layout, 
  Code2, 
  Columns2, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Trash2, 
  Sparkles,
  FileCode2,
  FolderOpen,
  Save,
  ExternalLink,
  FileText,
  LogOut,
  Bot,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateFullDoc, generateHTML, generateCSS } from '../utils/codeGenerator';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    mode, 
    setMode, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    clearCanvas,
    loadTemplate,
    openHTMLFile,
    activePage,
    pages,
    activePageId,
    switchPage,
    rawCss,
    rawJs,
    setIsBotModalOpen,
    setIsStoreOpen,
    currentProjectId,
    projectsList,
    selectProject,
    createProject,
    deleteProject,
    saveProjectToDb
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          openHTMLFile(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const createPageHTML = (page: typeof pages[0]) => {
    return generateFullDoc(
      page.nodes,
      rawCss,
      rawJs,
      page.seo.title || page.title,
      page.seo.description || '',
      page.seo.keywords || ''
    );
  };

  const handleSaveAllPages = async () => {
    // Attempt to use native Directory Picker API if available
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads'
        });

        // Write each HTML page to the selected folder
        for (const page of pages) {
          const fileHandle = await dirHandle.getFileHandle(page.fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(createPageHTML(page));
          await writable.close();
        }

        // Write styles.css and script.js
        const cssHandle = await dirHandle.getFileHandle('styles.css', { create: true });
        const cssWritable = await cssHandle.createWritable();
        await cssWritable.write(rawCss);
        await cssWritable.close();

        const jsHandle = await dirHandle.getFileHandle('script.js', { create: true });
        const jsWritable = await jsHandle.createWritable();
        await jsWritable.write(rawJs);
        await jsWritable.close();

        alert(`Todas as ${pages.length} páginas salvas diretamente na pasta escolhida no seu computador!`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User canceled folder selection
        console.warn('Salvar em pasta não suportado ou negado, usando download ZIP:', err);
      }
    }

    // Fallback: Save all pages as ZIP package
    await handleExportZip();
  };

  const handleSaveAction = async () => {
    if (user) {
      try {
        await saveProjectToDb();
        // Também salva localmente na pasta/HD
        await handleSaveAllPages();
      } catch (err) {
        console.error('Erro ao salvar projeto:', err);
        alert('Erro ao salvar o projeto no banco de dados. Tentando salvar no HD...');
        await handleSaveAllPages();
      }
    } else {
      await handleSaveAllPages();
    }
  };

  const handleLiveBrowserPreview = () => {
    // 1. Gera o CSS de todas as páginas combinados para evitar que elementos de outras páginas fiquem sem estilo
    const allPagesCSS = pages.map(p => generateCSS(p.nodes)).join('\n\n');
    const combinedCSS = `${rawCss}\n\n/* === ESTILOS DOS COMPONENTES === */\n${allPagesCSS}`;

    // 2. Cria um dicionário de páginas com título e conteúdo HTML
    const pagesDictionary = pages.reduce((acc, p) => {
      acc[p.fileName] = {
        title: p.seo.title || p.title,
        body: generateHTML(p.nodes, 2)
      };
      return acc;
    }, {} as Record<string, { title: string; body: string }>);

    // 3. Script para interceptar cliques nos links e simular navegação SPA
    const previewNavigationScript = `
      window.projectPages = ${JSON.stringify(pagesDictionary)};
      
      window.previewNavigate = function(href) {
        const page = window.projectPages[href];
        if (page) {
          document.body.innerHTML = page.body;
          document.title = page.title;
          
          // Atualiza estilos do menu ativo
          document.querySelectorAll('a, button').forEach(el => {
            const targetHref = el.getAttribute('href') || el.getAttribute('data-href');
            if (targetHref === href || (href === 'index.html' && targetHref === '#')) {
              el.classList.add('active-menu-link');
              el.style.color = '#38bdf8';
              el.style.fontWeight = '700';
              el.style.borderBottom = '2px solid #38bdf8';
              el.style.paddingBottom = '4px';
            } else {
              el.classList.remove('active-menu-link');
              el.style.color = '';
              el.style.fontWeight = '';
              el.style.borderBottom = '';
              el.style.paddingBottom = '';
            }
          });
          
          window.scrollTo(0, 0);
          return true;
        }
        return false;
      };

      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
            if (window.previewNavigate(href)) {
              e.preventDefault();
            }
          }
        }
      });
    `;

    // 4. Constrói o documento HTML inicial
    const activePageBody = generateHTML(activePage.nodes, 2);
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${activePage.seo.title || activePage.title}</title>
  <meta name="description" content="${activePage.seo.description || ''}" />
  <meta name="keywords" content="${activePage.seo.keywords || ''}" />
  <style>
${combinedCSS}
  </style>
</head>
<body>
${activePageBody}
  <script>
    // Scripts customizados
${rawJs}
  </script>
  <script>
    // Navegação SPA de visualização
${previewNavigationScript}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleExportZip = async () => {
    const zip = new JSZip();

    // Export each page in the project!
    pages.forEach(page => {
      zip.file(page.fileName, createPageHTML(page));
    });

    zip.file('styles.css', rawCss);
    zip.file('script.js', rawJs);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'meu-website-todas-paginas.zip');
  };

  return (
    <header className="top-navbar">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".html,.htm"
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="brand-logo">
          <FileCode2 size={24} />
          <span>Connect Web Editor</span>
        </div>

        {user && (
          <div className="active-page-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.12)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <FolderOpen size={15} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Projeto:</span>
            <select
              value={currentProjectId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'new') {
                  const name = prompt('Nome do novo projeto:');
                  if (name) createProject(name);
                } else if (val === 'delete') {
                  if (currentProjectId && confirm('Tem certeza que deseja excluir o projeto atual? Todas as páginas dele serão apagadas.')) {
                    deleteProject(currentProjectId);
                  }
                } else if (val) {
                  selectProject(parseInt(val, 10));
                }
              }}
              style={{
                background: 'transparent',
                color: '#10b981',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none'
              }}
              title="Selecione o projeto ativo ou crie um novo"
            >
              {projectsList.map((p) => {
                const idVal = p.pro_id !== undefined ? p.pro_id : p.PRO_ID;
                const nameVal = p.pro_nome !== undefined ? p.pro_nome : p.PRO_NOME;
                return (
                  <option key={idVal} value={idVal} style={{ background: '#0f172a', color: '#fff' }}>
                    📁 {nameVal}
                  </option>
                );
              })}
              <option value="new" style={{ background: '#0f172a', color: '#10b981', fontWeight: 'bold' }}>
                ➕ Novo Projeto...
              </option>
              {projectsList.length > 1 && (
                <option value="delete" style={{ background: '#0f172a', color: '#ef4444', fontWeight: 'bold' }}>
                  ❌ Excluir Projeto Atual
                </option>
              )}
            </select>
          </div>
        )}

        <div className="active-page-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.12)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <FileText size={15} style={{ color: 'var(--accent-secondary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Página Ativa:</span>
          <select
            value={activePageId}
            onChange={(e) => switchPage(e.target.value)}
            style={{
              background: 'transparent',
              color: '#38bdf8',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Página que está sendo editada no projeto"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#fff' }}>
                📄 {p.fileName} — {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="nav-center-controls">
        <button
          className={`btn-mode-toggle ${mode === 'design' ? 'active' : ''}`}
          onClick={() => setMode('design')}
          title="Modo Design Visual"
        >
          <Layout size={16} />
          Visual
        </button>
        <button
          className={`btn-mode-toggle ${mode === 'split' ? 'active' : ''}`}
          onClick={() => setMode('split')}
          title="Modo Split (Código + Visual Lado a Lado)"
        >
          <Columns2 size={16} />
          Split View
        </button>
        <button
          className={`btn-mode-toggle ${mode === 'code' ? 'active' : ''}`}
          onClick={() => setMode('code')}
          title="Modo Somente Código Monaco"
        >
          <Code2 size={16} />
          Código
        </button>
      </div>

      <div className="nav-actions">
        {/* Grupo 1: Arquivos e Salvamento */}
        <div className="toolbar-group">
          <button 
            className="btn-icon" 
            onClick={handleOpenClick} 
            title="Abrir Arquivo HTML do Disco"
          >
            <FolderOpen size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            onClick={handleSaveAction} 
            title={user ? `Salvar projeto no Banco de Dados (Nuvem)` : `Salvar TODAS as ${pages.length} Páginas no Disco (Local)`}
            style={user ? { color: '#10b981' } : {}}
          >
            <Save size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            onClick={handleLiveBrowserPreview} 
            title="Visualizar Página ao Vivo no Navegador (Nova Aba)"
            style={{ color: '#06b6d4' }}
          >
            <ExternalLink size={15} />
          </button>
        </div>

        {/* Grupo 2: Histórico e Edição */}
        <div className="toolbar-group">
          <button 
            className="btn-icon" 
            disabled={!canUndo} 
            onClick={undo} 
            title="Desfazer (Ctrl+Z)"
          >
            <RotateCcw size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            disabled={!canRedo} 
            onClick={redo} 
            title="Refazer (Ctrl+Y)"
          >
            <RotateCw size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            onClick={clearCanvas} 
            title="Limpar Canvas"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Grupo 3: Assistentes e Configurações */}
        <div className="toolbar-group">
          <button 
            className="btn-icon" 
            onClick={() => setIsBotModalOpen(true)} 
            title="Configurar Bot & QAP WhatsApp"
            style={{ color: '#818cf8' }}
          >
            <Bot size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            onClick={() => setIsStoreOpen(true)} 
            title="Loja de Componentes Nativos"
            style={{ color: '#fb7185' }}
          >
            <ShoppingBag size={15} />
          </button>
          <div className="toolbar-divider"></div>
          <button 
            className="btn-icon" 
            onClick={() => loadTemplate('template-login')}
            title="Carregar Template de Login"
            style={{ color: '#fbbf24' }}
          >
            <Sparkles size={15} />
          </button>
        </div>

        <button 
          className="btn-icon" 
          onClick={() => window.open('/manual', '_blank')} 
          title="Manual e Documentação da Ferramenta"
          style={{ color: '#a855f7' }}
        >
          <HelpCircle size={15} />
        </button>

        <button className="btn-export" onClick={handleExportZip} style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}>
          <Download size={14} />
          ZIP ({pages.length} pág)
        </button>

        {user && (
          <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.nome || user.email}>
              👤 {user.nome || user.email.split('@')[0]}
            </span>

            <button
              className="btn-icon danger"
              onClick={logout}
              title="Sair da Conta (Logout)"
              style={{
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                width: '28px',
                height: '28px'
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>

    </header>
  );
};
