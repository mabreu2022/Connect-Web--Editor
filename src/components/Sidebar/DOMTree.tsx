import React from 'react';
import { useEditor } from '../../context/EditorContext';
import type { ElementNode } from '../../types/editor';
import { ChevronRight, ChevronDown, Layers, Trash2, Copy } from 'lucide-react';

interface TreeNodeProps {
  node: ElementNode;
  depth: number;
}

const TreeNodeItem: React.FC<TreeNodeProps> = ({ node, depth }) => {
  const { selectedId, setSelectedId, removeNode, duplicateNode, hoveredId, setHoveredId, moveNodeInTree } = useEditor();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isHovered = hoveredId === node.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('existingNodeId', node.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('existingNodeId');
    if (draggedId && draggedId !== node.id) {
      moveNodeInTree(draggedId, node.id, 'after');
    }
  };

  return (
    <div className="dom-tree-node">
      <div
        draggable
        className={`tree-item-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          ...(isDragOver ? { borderBottom: '2px solid #38bdf8', background: 'rgba(56, 189, 248, 0.15)' } : {})
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(node.id);
        }}
        onMouseEnter={() => setHoveredId(node.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <span 
          className="toggle-icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span style={{ width: 14, display: 'inline-block' }} />
          )}
        </span>

        <Layers size={14} className="node-type-icon" />
        <span className="node-label-text">{node.label}</span>
        <span className="node-tag-name">&lt;{node.tagName}&gt;</span>

        <div className="tree-item-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              duplicateNode(node.id);
            }}
            title="Duplicar Nó"
          >
            <Copy size={12} />
          </button>
          <button
            className="action-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              removeNode(node.id);
            }}
            title="Excluir Nó"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="tree-children-container">
          {node.children.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DOMTree: React.FC = () => {
  const { nodes } = useEditor();

  if (nodes.length === 0) {
    return (
      <div className="inspector-empty">
        <Layers size={32} />
        <p style={{ fontSize: '13px' }}>Nenhum elemento no canvas.</p>
      </div>
    );
  }

  return (
    <div className="dom-tree-wrapper">
      <div className="category-title" style={{ padding: '0 8px 12px 8px' }}>
        Estrutura em Árvore DOM
      </div>
      {nodes.map(node => (
        <TreeNodeItem key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
};
