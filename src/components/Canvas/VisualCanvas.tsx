import React from 'react';
import { useEditor } from '../../context/EditorContext';
import type { ElementNode, ComponentType } from '../../types/editor';
import { Monitor, Tablet, Smartphone, FileText } from 'lucide-react';

interface RenderNodeProps {
  node: ElementNode;
}

const RenderNode: React.FC<RenderNodeProps> = ({ node }) => {
  const { activePage, selectedId, setSelectedId, setHoveredId, updateNode, updateNodeStyles, addNode } = useEditor();
  const isSelected = selectedId === node.id;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const typeDropped = e.dataTransfer.getData('text/plain') as ComponentType;
    if (typeDropped) {
      addNode(typeDropped, node.id);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(node.id);
  };

  const handleBlurText = (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText;
    if (newText !== node.content) {
      updateNode(node.id, { content: newText });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, targetNode: ElementNode) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    
    const domEl = document.querySelector(`[data-node-id="${targetNode.id}"]`) as HTMLElement;
    if (!domEl) return;

    const startWidth = domEl.offsetWidth;
    const startHeight = domEl.offsetHeight;

    const handleMouseMove = (moveEv: MouseEvent) => {
      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;

      const newWidth = Math.max(30, startWidth + deltaX);
      const newHeight = Math.max(20, startHeight + deltaY);

      updateNodeStyles(targetNode.id, {
        width: `${newWidth}px`,
        height: `${newHeight}px`,
        maxHeight: 'none'
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const tagLower = (node.tagName || 'div').toLowerCase();

  // Clean React properties from raw HTML attributes
  const { class: rawClass, for: rawFor, ...cleanAttrs } = node.attributes;
  
  const isActivePageLink = Boolean(
    activePage && 
    (tagLower === 'a' || tagLower === 'button') && 
    (
      node.attributes.href === activePage.fileName ||
      (activePage.fileName === 'index.html' && (node.attributes.href === '#' || node.attributes.href === 'index.html'))
    )
  );

  const activeStyle = isActivePageLink ? {
    color: '#38bdf8',
    fontWeight: '700',
    borderBottom: '2px solid #38bdf8',
    paddingBottom: '4px'
  } : {};

  const computedClassName = `${rawClass || ''} ${isSelected ? 'selected-node' : ''} ${isActivePageLink ? 'active-menu-link' : ''}`.trim();

  const elementProps: any = {
    'data-node-id': node.id,
    className: computedClassName,
    style: { ...node.styles, ...activeStyle, position: 'relative' },
    onClick: handleClick,
    onMouseEnter: (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredId(node.id);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation();
      setHoveredId(null);
    },
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    ...(rawFor ? { htmlFor: rawFor } : {}),
    ...cleanAttrs
  };

  // 1. Self Closing Elements (input, img, hr, br)
  const isSelfClosing = ['input', 'img', 'hr', 'br'].includes(tagLower);
  if (isSelfClosing) {
    const Tag = tagLower as React.ElementType;
    return (
      <div style={{ display: 'inline-block', width: node.styles.width || '100%', position: 'relative' }}>
        {isSelected && <span className="node-label-badge">{node.label}</span>}
        {isSelected && (
          <div
            className="resize-handle-corner"
            onMouseDown={(e) => handleResizeStart(e, node)}
            title="Arraste para redimensionar com o mouse"
          />
        )}
        <Tag {...elementProps} />
      </div>
    );
  }

  // 2. Special handling for Textarea in React
  if (tagLower === 'textarea') {
    return (
      <div style={{ display: 'inline-block', width: node.styles.width || '100%', position: 'relative' }}>
        {isSelected && <span className="node-label-badge">{node.label}</span>}
        {isSelected && (
          <div
            className="resize-handle-corner"
            onMouseDown={(e) => handleResizeStart(e, node)}
            title="Arraste para redimensionar com o mouse"
          />
        )}
        <textarea
          {...elementProps}
          value={node.content || ''}
          onChange={(e) => updateNode(node.id, { content: e.target.value })}
        />
      </div>
    );
  }

  // 3. Select / Options dropdown
  if (tagLower === 'select') {
    return (
      <div style={{ display: 'inline-block', width: node.styles.width || '100%', position: 'relative' }}>
        {isSelected && <span className="node-label-badge">{node.label}</span>}
        {isSelected && (
          <div
            className="resize-handle-corner"
            onMouseDown={(e) => handleResizeStart(e, node)}
            title="Arraste para redimensionar com o mouse"
          />
        )}
        <select {...elementProps}>
          {node.children && node.children.map(child => (
            <RenderNode key={child.id} node={child} />
          ))}
        </select>
      </div>
    );
  }

  // 4. Standard container & typography elements
  const Tag = tagLower as React.ElementType;
  const isEditable = ['h1', 'h2', 'h3', 'h4', 'p', 'span', 'button', 'a', 'label', 'option'].includes(tagLower);

  return (
    <Tag {...elementProps}>
      {isSelected && <span className="node-label-badge">{node.label}</span>}
      {tagLower === 'a' && (node.attributes.href === '#' || !node.attributes.href) && (
        <span 
          title="⚠️ Link Pendente: Clique para definir a página de destino no painel de propriedades" 
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 800,
            borderRadius: '50%',
            width: '15px',
            height: '15px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            zIndex: 10,
            cursor: 'pointer'
          }}
        >
          !
        </span>
      )}
      {isSelected && (
        <div
          className="resize-handle-corner"
          onMouseDown={(e) => handleResizeStart(e, node)}
          title="Arraste para redimensionar com o mouse"
        />
      )}
      
      {node.content !== undefined && node.content !== '' && (
        <span
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={handleBlurText}
          style={{ outline: 'none' }}
        >
          {node.content}
        </span>
      )}

      {node.children && node.children.map(child => (
        <RenderNode key={child.id} node={child} />
      ))}
    </Tag>
  );
};

export const VisualCanvas: React.FC = () => {
  const { nodes, viewport, setViewport, addNode, setSelectedId, rawCss, activePage } = useEditor();

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const typeDropped = e.dataTransfer.getData('text/plain') as ComponentType;
    if (typeDropped) {
      addNode(typeDropped, null);
    }
  };

  // Replace body selector with .visual-canvas so body CSS rules apply directly to canvas
  const canvasStyle = rawCss ? rawCss.replace(/\bbody\b/g, '.visual-canvas') : '';

  return (
    <div className="canvas-wrapper" onClick={() => setSelectedId(null)}>
      {canvasStyle && <style>{canvasStyle}</style>}

      <div className="viewport-bar" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: 600, paddingRight: '12px', borderRight: '1px solid var(--border-color)' }}>
          <FileText size={14} />
          <span>{activePage ? activePage.fileName : 'Página Ativa'}</span>
          {activePage?.title && (
            <span style={{ color: '#64748b', fontWeight: 400, fontSize: '11px' }}>({activePage.title})</span>
          )}
        </div>

        <button
          className={`vp-btn ${viewport === 'desktop' ? 'active' : ''}`}
          onClick={() => setViewport('desktop')}
        >
          <Monitor size={14} />
          Desktop (100%)
        </button>
        <button
          className={`vp-btn ${viewport === 'tablet' ? 'active' : ''}`}
          onClick={() => setViewport('tablet')}
        >
          <Tablet size={14} />
          Tablet (768px)
        </button>
        <button
          className={`vp-btn ${viewport === 'mobile' ? 'active' : ''}`}
          onClick={() => setViewport('mobile')}
        >
          <Smartphone size={14} />
          Mobile (375px)
        </button>
      </div>

      <div
        className={`visual-canvas ${viewport}`}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {nodes.length === 0 ? (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: '#94a3b8',
              border: '2px dashed #cbd5e1',
              margin: '40px',
              borderRadius: '12px'
            }}
          >
            <h3>Canvas Vazio</h3>
            <p style={{ marginTop: '8px', fontSize: '14px' }}>
              Arraste componentes da paleta lateral ou clique neles para iniciar seu formulário/página.
            </p>
          </div>
        ) : (
          nodes.map(node => <RenderNode key={node.id} node={node} />)
        )}
      </div>
    </div>
  );
};
