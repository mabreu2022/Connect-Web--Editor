import type { ElementNode } from '../types/editor';

function styleObjectToCSS(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, val]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${kebabKey}: ${val};`;
    })
    .join('\n');
}

function attributesToString(attrs: Record<string, string>): string {
  const entries = Object.entries(attrs).filter(([_, val]) => val !== undefined && val !== null);
  if (entries.length === 0) return '';
  return ' ' + entries.map(([key, val]) => `${key}="${val}"`).join(' ');
}

export function generateHTML(nodes: ElementNode[], indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  let html = '';

  for (const node of nodes) {
    const mergedAttrs = { ...node.attributes };
    if (node.tagName.toLowerCase() === 'button' && mergedAttrs.href && mergedAttrs.href !== '#') {
      mergedAttrs.onclick = `location.href='${mergedAttrs.href}'`;
    }
    const attrsStr = attributesToString({ ...mergedAttrs, 'data-node-id': node.id });
    const isSelfClosing = ['input', 'img', 'hr', 'br'].includes(node.tagName.toLowerCase());

    if (isSelfClosing) {
      html += `${indent}<${node.tagName}${attrsStr} />\n`;
    } else {
      const hasChildren = node.children && node.children.length > 0;
      const content = node.content ? node.content : '';

      html += `${indent}<${node.tagName}${attrsStr}>`;
      if (hasChildren) {
        html += '\n' + generateHTML(node.children, indentLevel + 1) + indent;
      } else {
        html += content;
      }
      html += `</${node.tagName}>\n`;
    }
  }

  return html;
}

export function generateCSS(nodes: ElementNode[]): string {
  let cssRules: string[] = [];

  function extractNodeStyles(nodeList: ElementNode[]) {
    for (const node of nodeList) {
      if (node.styles && Object.keys(node.styles).length > 0) {
        const rules = styleObjectToCSS(node.styles);
        cssRules.push(`[data-node-id="${node.id}"] {\n${rules}\n}`);
      }
      if (node.children && node.children.length > 0) {
        extractNodeStyles(node.children);
      }
    }
  }

  extractNodeStyles(nodes);
  return cssRules.join('\n\n');
}

const RESPONSIVE_BASE_CSS = `
/* =====================================================
   RESET & BASE RESPONSIVE STYLES
   Connect Web Editor - Sistema de Layout Responsivo
   ===================================================== */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  background-color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* =====================================================
   LAYOUT RESPONSIVO GLOBAL
   ===================================================== */

/* Grids ficam em coluna única em mobile */
@media (max-width: 767px) {
  [style*="grid-template-columns"],
  .grid-2-cols,
  .grid-3-cols {
    display: flex !important;
    flex-direction: column !important;
  }

  /* Containers e seções não transbordam */
  [style*="max-width"],
  .container-box {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  /* Héros ficam menores */
  .hero-section,
  [data-node-id] h1 {
    font-size: clamp(22px, 5vw, 36px) !important;
    padding: 32px 16px !important;
  }

  /* Navbar colapsa */
  .navbar {
    flex-direction: column !important;
    gap: 12px !important;
    padding: 16px !important;
  }

  /* Footer em coluna única */
  .site-footer {
    padding: 32px 16px !important;
  }

  /* Botões ficam largura total em mobile */
  .cta-section [data-node-id] div {
    flex-direction: column !important;
    width: 100%;
  }

  /* Texto legível em mobile */
  p, [data-node-id] p {
    font-size: clamp(13px, 3.5vw, 16px);
  }
}

/* =====================================================
   TABLET (768px - 1023px)
   ===================================================== */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid-3-cols,
  [style*="grid-template-columns: 1fr 1fr 1fr"] {
    grid-template-columns: 1fr 1fr !important;
  }

  [style*="grid-template-columns: 2fr 1fr 1fr 1fr"] {
    grid-template-columns: 1fr 1fr !important;
  }

  .container-box {
    max-width: 100% !important;
    padding: 20px !important;
  }

  .hero-section,
  [data-node-id] h1 {
    font-size: clamp(26px, 4vw, 36px) !important;
  }
}

/* =====================================================
   DESKTOP (1024px+)
   ===================================================== */
@media (min-width: 1024px) {
  .container-box {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* =====================================================
   COMPONENTES RESPONSIVOS
   ===================================================== */

/* Imagens sempre adaptáveis */
[data-node-id] img {
  max-width: 100%;
  height: auto;
}

/* Inputs e botões com largura total em formulários */
[data-node-id] form input,
[data-node-id] form textarea,
[data-node-id] form select {
  width: 100%;
}

/* Evita overflow horizontal */
section, footer, nav, header, main, div {
  max-width: 100%;
  overflow-x: clip;
}

/* Melhora toque em mobile */
button, a, input, select, textarea {
  touch-action: manipulation;
}

/* Marcação do item ativo no menu da página atual */
nav a.active-menu-link,
header a.active-menu-link,
nav button.active-menu-link,
header button.active-menu-link,
.active-menu-link {
  color: #38bdf8 !important;
  font-weight: 700 !important;
  border-bottom: 2px solid #38bdf8 !important;
  padding-bottom: 4px !important;
  transition: all 0.2s ease;
}
`;

export function generateFullDoc(nodes: ElementNode[], customCSS = '', customJS = '', seoTitle = 'Página', seoDescription = '', seoKeywords = ''): string {
  const htmlBody = generateHTML(nodes, 2);
  const generatedCSS = generateCSS(nodes);
  const combinedCSS = `${RESPONSIVE_BASE_CSS}\n\n/* === ESTILOS DOS COMPONENTES === */\n${generatedCSS}\n\n/* === ESTILOS PERSONALIZADOS === */\n${customCSS}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDescription}" />
  <meta name="keywords" content="${seoKeywords}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="${seoTitle}" />
  <meta property="og:description" content="${seoDescription}" />
  <style>
${combinedCSS}
  </style>
</head>
<body>
${htmlBody}
  <script>
${customJS}
  </script>
</body>
</html>`;
}
