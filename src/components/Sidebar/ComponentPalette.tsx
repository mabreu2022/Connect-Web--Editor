import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import type { ComponentType, ComponentCategory } from '../../types/editor';
import { 
  Box, 
  LayoutGrid, 
  FormInput, 
  Mail, 
  Lock, 
  Type, 
  FileText, 
  SlidersHorizontal, 
  CheckSquare, 
  CircleDot, 
  MousePointerClick, 
  Heading as HeadingIcon, 
  AlignLeft, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Tag, 
  Navigation, 
  Sparkles,
  LayoutTemplate,
  Minus,
  Search,
  DollarSign,
  MessageSquareQuote,
  PanelBottom,
  Megaphone,
  Star,
  Video
} from 'lucide-react';

interface PaletteItemDef {
  type: ComponentType;
  label: string;
  category: ComponentCategory;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItemDef[] = [
  // Layout
  { type: 'container', label: 'Container', category: 'layout', icon: <Box size={20} /> },
  { type: 'section', label: 'Seção', category: 'layout', icon: <LayoutTemplate size={20} /> },
  { type: 'grid-2', label: 'Grid 2 Cols', category: 'layout', icon: <LayoutGrid size={20} /> },
  { type: 'grid-3', label: 'Grid 3 Cols', category: 'layout', icon: <LayoutGrid size={20} /> },
  { type: 'card', label: 'Card UI', category: 'layout', icon: <Box size={20} /> },
  { type: 'divider', label: 'Divisor HR', category: 'layout', icon: <Minus size={20} /> },

  // Sections Compostas
  { type: 'section-pricing', label: 'Tabela de Preços', category: 'sections', icon: <DollarSign size={20} /> },
  { type: 'section-testimonials', label: 'Depoimentos', category: 'sections', icon: <MessageSquareQuote size={20} /> },
  { type: 'section-features-list', label: 'Features / Recursos', category: 'sections', icon: <Star size={20} /> },
  { type: 'section-cta', label: 'CTA – Call to Action', category: 'sections', icon: <Megaphone size={20} /> },
  { type: 'footer', label: 'Rodapé do Site', category: 'sections', icon: <PanelBottom size={20} /> },

  // Forms
  { type: 'form', label: 'Formulário', category: 'forms', icon: <FormInput size={20} /> },
  { type: 'form-group', label: 'Grupo de Campo', category: 'forms', icon: <FormInput size={20} /> },
  { type: 'input-text', label: 'Input Texto', category: 'forms', icon: <Type size={20} /> },
  { type: 'input-email', label: 'Input E-mail', category: 'forms', icon: <Mail size={20} /> },
  { type: 'input-password', label: 'Input Senha', category: 'forms', icon: <Lock size={20} /> },
  { type: 'textarea', label: 'Textarea', category: 'forms', icon: <FileText size={20} /> },
  { type: 'select', label: 'Select / Dropdown', category: 'forms', icon: <SlidersHorizontal size={20} /> },
  { type: 'checkbox', label: 'Checkbox', category: 'forms', icon: <CheckSquare size={20} /> },
  { type: 'radio', label: 'Radio Button', category: 'forms', icon: <CircleDot size={20} /> },
  { type: 'button', label: 'Botão Submit', category: 'forms', icon: <MousePointerClick size={20} /> },

  // Typography & UI
  { type: 'heading', label: 'Título (H2)', category: 'typography', icon: <HeadingIcon size={20} /> },
  { type: 'paragraph', label: 'Parágrafo', category: 'typography', icon: <AlignLeft size={20} /> },
  { type: 'image', label: 'Imagem', category: 'ui', icon: <ImageIcon size={20} /> },
  { type: 'link', label: 'Link Href', category: 'ui', icon: <LinkIcon size={20} /> },
  { type: 'badge', label: 'Badge Tag', category: 'ui', icon: <Tag size={20} /> },
  { type: 'nav', label: 'Navegação Bar', category: 'ui', icon: <Navigation size={20} /> },
  { type: 'hero', label: 'Hero Section', category: 'ui', icon: <Sparkles size={20} /> },

  // Templates & WebRTC
  { type: 'template-login', label: 'Form de Login', category: 'templates', icon: <Sparkles size={20} /> },
  { type: 'template-contact', label: 'Form de Contato', category: 'templates', icon: <Sparkles size={20} /> },
  { type: 'widget-chat', label: 'Chat & WebRTC Vídeo', category: 'templates', icon: <Video size={20} /> }
];

export const ComponentPalette: React.FC = () => {
  const { addNode, selectedId } = useEditor();
  const [search, setSearch] = useState('');

  const filteredItems = PALETTE_ITEMS.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const categories: { key: ComponentCategory; title: string }[] = [
    { key: 'sections', title: '⭐ Seções Prontas (Preços/Depoimentos)' },
    { key: 'templates', title: '🚀 Templates Prontos' },
    { key: 'forms', title: '📋 Formulários' },
    { key: 'layout', title: '📦 Layout & Estrutura' },
    { key: 'typography', title: '✍️ Tipografia' },
    { key: 'ui', title: '🎨 Componentes UI' }
  ];

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('text/plain', type);
  };

  return (
    <div className="palette-container">
      <div className="field-group" style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="field-input"
            placeholder="Buscar componentes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {categories.map(cat => {
        const itemsInCat = filteredItems.filter(i => i.category === cat.key);
        if (itemsInCat.length === 0) return null;

        return (
          <div key={cat.key} className="palette-category">
            <div className="category-title">{cat.title}</div>
            <div className="palette-grid">
              {itemsInCat.map(item => (
                <div
                  key={item.type}
                  className="palette-item"
                  draggable
                  onDragStart={e => handleDragStart(e, item.type)}
                  onClick={() => addNode(item.type, selectedId)}
                  title="Clique para adicionar ou Arraste para o Canvas"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
