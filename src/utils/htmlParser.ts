import type { ElementNode } from '../types/editor';

export function parseHTMLToNodes(htmlContent: string): { nodes: ElementNode[]; css: string; js: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  let css = '';
  let js = '';

  // Extract <link rel="stylesheet">
  const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
  linkTags.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      css += `@import url("${href}");\n`;
    }
  });

  // Extract <style>
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach(st => {
    css += st.textContent + '\n';
  });

  // Extract <script>
  const scriptTags = doc.querySelectorAll('script');
  scriptTags.forEach(sc => {
    if (!sc.src && sc.textContent) {
      js += sc.textContent + '\n';
    }
  });

  const body = doc.body;

  function domToNode(domElement: Element): ElementNode {
    const tagName = domElement.tagName.toLowerCase();
    const id = domElement.getAttribute('data-node-id') || 'el_' + Math.random().toString(36).substring(2, 9);

    const attributes: Record<string, string> = {};
    for (let i = 0; i < domElement.attributes.length; i++) {
      const attr = domElement.attributes[i];
      if (attr.name !== 'data-node-id' && attr.name !== 'style') {
        attributes[attr.name] = attr.value;
      }
    }

    const styles: Record<string, string> = {};
    const styleAttr = domElement.getAttribute('style');
    if (styleAttr) {
      styleAttr.split(';').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) {
          const camelKey = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
          styles[camelKey] = v.trim();
        }
      });
    }

    const children: ElementNode[] = [];
    let content = '';

    const hasElementChildren = Array.from(domElement.childNodes).some(
      c => c.nodeType === Node.ELEMENT_NODE && !['script', 'style'].includes((c as Element).tagName.toLowerCase())
    );

    domElement.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (!['script', 'style'].includes(el.tagName.toLowerCase())) {
          children.push(domToNode(el));
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          if (hasElementChildren) {
            children.push({
              id: 'el_' + Math.random().toString(36).substring(2, 9),
              type: 'paragraph',
              tagName: 'span',
              label: 'TEXTO',
              content: text,
              attributes: {},
              styles: {},
              children: []
            });
          } else {
            content += (content ? ' ' : '') + text;
          }
        }
      }
    });

    return {
      id,
      type: 'container',
      tagName,
      label: tagName.toUpperCase(),
      content: children.length === 0 ? content : undefined,
      attributes,
      styles,
      children
    };
  }

  const nodes: ElementNode[] = [];
  Array.from(body.children).forEach(child => {
    if (!['script', 'style'].includes(child.tagName.toLowerCase())) {
      nodes.push(domToNode(child));
    }
  });

  return { nodes, css: css.trim(), js: js.trim() };
}
