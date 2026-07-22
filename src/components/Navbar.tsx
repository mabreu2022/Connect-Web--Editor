import React, { useRef } from 'react';
import { useEditor } from '../context/EditorContext';
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
  ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateFullDoc } from '../utils/codeGenerator';

export const Navbar: React.FC = () => {
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
    getFullDocument,
    pages,
    rawCss,
    rawJs
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

  const handleLiveBrowserPreview = () => {
    const fullDoc = getFullDocument();
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
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

      <div className="brand-logo">
        <FileCode2 size={24} />
        <span>Connect Web Editor</span>
        <span className="tag">Dreamweaver</span>
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
        <button 
          className="btn-icon" 
          onClick={handleOpenClick} 
          title="Abrir Arquivo HTML do Disco"
        >
          <FolderOpen size={16} />
        </button>

        <button 
          className="btn-icon" 
          onClick={handleSaveAllPages} 
          title={`Salvar TODAS as ${pages.length} Páginas do Projeto no Disco`}
        >
          <Save size={16} />
        </button>

        <button 
          className="btn-icon" 
          onClick={handleLiveBrowserPreview} 
          title="Visualizar Página ao Vivo no Navegador (Nova Aba)"
          style={{ color: '#06b6d4' }}
        >
          <ExternalLink size={16} />
        </button>

        <button 
          className="btn-icon" 
          disabled={!canUndo} 
          onClick={undo} 
          title="Desfazer (Ctrl+Z)"
        >
          <RotateCcw size={16} />
        </button>
        <button 
          className="btn-icon" 
          disabled={!canRedo} 
          onClick={redo} 
          title="Refazer (Ctrl+Y)"
        >
          <RotateCw size={16} />
        </button>

        <button 
          className="btn-icon" 
          onClick={() => loadTemplate('template-login')}
          title="Carregar Template de Login"
        >
          <Sparkles size={16} />
        </button>

        <button 
          className="btn-icon" 
          onClick={clearCanvas} 
          title="Limpar Canvas"
        >
          <Trash2 size={16} />
        </button>

        <button className="btn-export" onClick={handleExportZip}>
          <Download size={16} />
          ZIP Project ({pages.length} pág)
        </button>
      </div>
    </header>
  );
};
