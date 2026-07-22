import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ElementNode, EditorMode, ViewportMode, ComponentType, PageItem, SEOSettings } from '../types/editor';
import { createDefaultNode } from '../utils/defaults';
import { generateFullDoc, generateHTML, generateCSS } from '../utils/codeGenerator';
import { parseHTMLToNodes } from '../utils/htmlParser';

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
  const [pages, setPages] = useState<PageItem[]>(initialDefaultPages);
  const [activePageId, setActivePageId] = useState<string>('p_index');

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
  const [rawJs, setRawJs] = useState<string>('// Adicione seus scripts JavaScript aqui\nconsole.log("Connect Web Editor carregado!");');

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
        getFullDocument
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
