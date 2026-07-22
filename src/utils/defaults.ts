import type { ElementNode, ComponentType } from '../types/editor';

const generateId = () => 'el_' + Math.random().toString(36).substring(2, 9);

export function createDefaultNode(type: ComponentType): ElementNode {
  const id = generateId();

  switch (type) {
    // --- LAYOUT ---
    case 'container':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Container',
        attributes: { class: 'container-box' },
        styles: {
          padding: '24px',
          margin: '0 auto',
          maxWidth: '1200px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        },
        children: []
      };

    case 'section':
      return {
        id,
        type,
        tagName: 'section',
        label: 'Seção',
        attributes: { class: 'page-section' },
        styles: {
          padding: '32px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        },
        children: []
      };

    case 'grid-2':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Grid 2 Colunas',
        attributes: { class: 'grid-2-cols' },
        styles: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          width: '100%'
        },
        children: [
          createDefaultNode('container'),
          createDefaultNode('container')
        ]
      };

    case 'grid-3':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Grid 3 Colunas',
        attributes: { class: 'grid-3-cols' },
        styles: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          width: '100%'
        },
        children: [
          createDefaultNode('container'),
          createDefaultNode('container'),
          createDefaultNode('container')
        ]
      };

    case 'card':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Card UI',
        attributes: { class: 'ui-card' },
        styles: {
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h3',
            label: 'Título do Card',
            content: 'Título do Card',
            attributes: {},
            styles: { fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'paragraph',
            tagName: 'p',
            label: 'Texto do Card',
            content: 'Este é um exemplo de texto descritivo dentro de um card responsivo.',
            attributes: {},
            styles: { fontSize: '14px', color: '#64748b', margin: '0', lineHeight: '1.5' },
            children: []
          }
        ]
      };

    case 'divider':
      return {
        id,
        type,
        tagName: 'hr',
        label: 'Divisor',
        attributes: {},
        styles: {
          border: 'none',
          borderTop: '1px solid #e2e8f0',
          margin: '16px 0',
          width: '100%'
        },
        children: []
      };

    // --- FORMULÁRIOS ---
    case 'form':
      return {
        id,
        type,
        tagName: 'form',
        label: 'Formulário Base',
        attributes: { action: '#', method: 'POST', class: 'custom-form' },
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        },
        children: []
      };

    case 'form-group':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Grupo de Campo',
        attributes: { class: 'form-group' },
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'label',
            label: 'Rótulo',
            content: 'Nome do Campo',
            attributes: { for: 'input_' + id },
            styles: { fontSize: '14px', fontWeight: '500', color: '#334155' },
            children: []
          },
          {
            id: generateId(),
            type: 'input-text',
            tagName: 'input',
            label: 'Input Texto',
            attributes: { type: 'text', id: 'input_' + id, placeholder: 'Digite aqui...', class: 'form-control' },
            styles: {
              padding: '10px 14px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              width: '100%',
              backgroundColor: '#f8fafc'
            },
            children: []
          }
        ]
      };

    case 'input-text':
      return {
        id,
        type,
        tagName: 'input',
        label: 'Input de Texto',
        attributes: { type: 'text', placeholder: 'Digite seu texto...', name: 'campo_texto' },
        styles: {
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          width: '100%',
          outline: 'none',
          boxSizing: 'border-box'
        },
        children: []
      };

    case 'input-email':
      return {
        id,
        type,
        tagName: 'input',
        label: 'Input E-mail',
        attributes: { type: 'email', placeholder: 'seu@email.com', name: 'email', required: 'true' },
        styles: {
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          width: '100%',
          outline: 'none',
          boxSizing: 'border-box'
        },
        children: []
      };

    case 'input-password':
      return {
        id,
        type,
        tagName: 'input',
        label: 'Input Senha',
        attributes: { type: 'password', placeholder: '••••••••', name: 'senha' },
        styles: {
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          width: '100%',
          outline: 'none',
          boxSizing: 'border-box'
        },
        children: []
      };

    case 'textarea':
      return {
        id,
        type,
        tagName: 'textarea',
        label: 'Área de Texto',
        content: '',
        attributes: { placeholder: 'Escreva sua mensagem...', rows: '4', name: 'mensagem' },
        styles: {
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          width: '100%',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical'
        },
        children: []
      };

    case 'select':
      return {
        id,
        type,
        tagName: 'select',
        label: 'Caixa Seleção (Select)',
        attributes: { name: 'opcoes' },
        styles: {
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          width: '100%',
          backgroundColor: '#ffffff'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'option',
            label: 'Opção 1',
            content: 'Opção 1',
            attributes: { value: '1' },
            styles: {},
            children: []
          },
          {
            id: generateId(),
            type: 'heading',
            tagName: 'option',
            label: 'Opção 2',
            content: 'Opção 2',
            attributes: { value: '2' },
            styles: {},
            children: []
          }
        ]
      };

    case 'checkbox':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Caixa de Seleção (Checkbox)',
        attributes: {},
        styles: { display: 'flex', alignItems: 'center', gap: '8px' },
        children: [
          {
            id: generateId(),
            type: 'input-text',
            tagName: 'input',
            label: 'Checkbox Input',
            attributes: { type: 'checkbox', id: 'chk_' + id, name: 'aceito' },
            styles: { width: '16px', height: '16px', accentColor: '#4f46e5' },
            children: []
          },
          {
            id: generateId(),
            type: 'heading',
            tagName: 'label',
            label: 'Label Checkbox',
            content: 'Concordo com os termos e condições',
            attributes: { for: 'chk_' + id },
            styles: { fontSize: '14px', color: '#475569', cursor: 'pointer' },
            children: []
          }
        ]
      };

    case 'radio':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Botão de Opção (Radio)',
        attributes: {},
        styles: { display: 'flex', alignItems: 'center', gap: '8px' },
        children: [
          {
            id: generateId(),
            type: 'input-text',
            tagName: 'input',
            label: 'Radio Input',
            attributes: { type: 'radio', id: 'rad_' + id, name: 'grupo_opcao', value: '1' },
            styles: { width: '16px', height: '16px', accentColor: '#4f46e5' },
            children: []
          },
          {
            id: generateId(),
            type: 'heading',
            tagName: 'label',
            label: 'Label Radio',
            content: 'Opção 1',
            attributes: { for: 'rad_' + id },
            styles: { fontSize: '14px', color: '#475569', cursor: 'pointer' },
            children: []
          }
        ]
      };

    case 'button':
      return {
        id,
        type,
        tagName: 'button',
        label: 'Botão',
        content: 'Enviar Formulário',
        attributes: { type: 'submit' },
        styles: {
          padding: '10px 20px',
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '14px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center'
        },
        children: []
      };

    // --- ELEMENTOS DE UI E TIPOGRAFIA ---
    case 'heading':
      return {
        id,
        type,
        tagName: 'h2',
        label: 'Título (H2)',
        content: 'Título Principal da Página',
        attributes: {},
        styles: { fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0' },
        children: []
      };

    case 'paragraph':
      return {
        id,
        type,
        tagName: 'p',
        label: 'Parágrafo',
        content: 'Este é um parágrafo editável. Altere o texto e os estilos facilmente no painel lateral.',
        attributes: {},
        styles: { fontSize: '16px', color: '#475569', lineHeight: '1.6', margin: '0' },
        children: []
      };

    case 'image':
      return {
        id,
        type,
        tagName: 'img',
        label: 'Imagem',
        attributes: {
          src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
          alt: 'Exemplo de Imagem',
          width: '100%'
        },
        styles: { borderRadius: '8px', objectFit: 'cover', maxHeight: '400px', width: '100%' },
        children: []
      };

    case 'link':
      return {
        id,
        type,
        tagName: 'a',
        label: 'Link Href',
        content: 'Clique aqui para saber mais →',
        attributes: { href: '#', target: '_blank' },
        styles: { color: '#4f46e5', textDecoration: 'none', fontWeight: '500', fontSize: '14px' },
        children: []
      };

    case 'badge':
      return {
        id,
        type,
        tagName: 'span',
        label: 'Badge / Tag',
        content: 'Novo Recurso',
        attributes: {},
        styles: {
          display: 'inline-block',
          padding: '4px 10px',
          backgroundColor: '#e0e7ff',
          color: '#4338ca',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600'
        },
        children: []
      };

    case 'nav':
      return {
        id,
        type,
        tagName: 'nav',
        label: 'Navegação (Header)',
        attributes: { class: 'navbar' },
        styles: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '8px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Logo',
            content: 'MeuSite',
            attributes: {},
            styles: { fontSize: '20px', fontWeight: '700', color: '#6366f1', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Menu Links',
            attributes: {},
            styles: { display: 'flex', gap: '20px', alignItems: 'center' },
            children: [
              {
                id: generateId(),
                type: 'link',
                tagName: 'a',
                label: 'Link 1',
                content: 'Início',
                attributes: { href: 'index.html' },
                styles: { color: '#94a3b8', textDecoration: 'none' },
                children: []
              },
              {
                id: generateId(),
                type: 'link',
                tagName: 'a',
                label: 'Link 2',
                content: 'Serviços',
                attributes: { href: 'servicos.html' },
                styles: { color: '#94a3b8', textDecoration: 'none' },
                children: []
              },
              {
                id: generateId(),
                type: 'link',
                tagName: 'a',
                label: 'Link 3',
                content: 'Preços',
                attributes: { href: 'precos.html' },
                styles: { color: '#94a3b8', textDecoration: 'none' },
                children: []
              },
              {
                id: generateId(),
                type: 'link',
                tagName: 'a',
                label: 'Link 4',
                content: 'Contato',
                attributes: { href: 'contato.html' },
                styles: { color: '#94a3b8', textDecoration: 'none' },
                children: []
              }
            ]
          }
        ]
      };

    case 'hero':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Hero Banner',
        attributes: { class: 'hero-section' },
        styles: {
          padding: '60px 40px',
          textAlign: 'center',
          backgroundColor: '#1e1b4b',
          color: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h1',
            label: 'Título Hero',
            content: 'Construa Aplicações Web Incríveis',
            attributes: {},
            styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'paragraph',
            tagName: 'p',
            label: 'Subtítulo Hero',
            content: 'Crie formulários e interfaces com edição visual e gerador de código profissional em tempo real.',
            attributes: {},
            styles: { fontSize: '18px', color: '#c7d2fe', maxWidth: '600px', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'button',
            tagName: 'button',
            label: 'CTA Hero',
            content: 'Começar Agora mesmo',
            attributes: {},
            styles: {
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            },
            children: []
          }
        ]
      };

    // --- SEÇÕES COMPOSTAS ---
    case 'section-pricing':
      return {
        id,
        type,
        tagName: 'section',
        label: 'Tabela de Preços & Planos',
        attributes: { class: 'pricing-section' },
        styles: {
          padding: '40px 20px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          color: '#ffffff'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título Preços',
            content: 'Escolha o Plano Perfeito para Você',
            attributes: {},
            styles: { fontSize: '28px', fontWeight: '700', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'grid-3',
            tagName: 'div',
            label: 'Grid de Planos',
            attributes: {},
            styles: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', width: '100%' },
            children: [
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Plano Básico',
                attributes: {},
                styles: { padding: '24px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Básico', content: 'Iniciante', attributes: {}, styles: { fontSize: '20px', color: '#94a3b8' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h2', label: 'Preço Básico', content: 'R$ 49/mês', attributes: {}, styles: { fontSize: '32px', color: '#ffffff' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc', content: 'Ideal para pequenos projetos e landing pages.', attributes: {}, styles: { fontSize: '14px', color: '#cbd5e1' }, children: [] },
                  { id: generateId(), type: 'button', tagName: 'button', label: 'Assinar', content: 'Escolher Básico', attributes: {}, styles: { padding: '10px', backgroundColor: '#334155', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }, children: [] }
                ]
              },
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Plano Pro',
                attributes: {},
                styles: { padding: '24px', backgroundColor: '#312e81', borderRadius: '12px', border: '2px solid #6366f1', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' },
                children: [
                  { id: generateId(), type: 'badge', tagName: 'span', label: 'Destaque', content: 'MAIS POPULAR', attributes: {}, styles: { backgroundColor: '#6366f1', color: '#fff', width: 'fit-content', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Pro', content: 'Profissional', attributes: {}, styles: { fontSize: '20px', color: '#a5b4fc' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h2', label: 'Preço Pro', content: 'R$ 99/mês', attributes: {}, styles: { fontSize: '32px', color: '#ffffff' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc', content: 'Para empresas em crescimento com banco de dados.', attributes: {}, styles: { fontSize: '14px', color: '#e0e7ff' }, children: [] },
                  { id: generateId(), type: 'button', tagName: 'button', label: 'Assinar', content: 'Começar Teste Pro', attributes: {}, styles: { padding: '10px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }, children: [] }
                ]
              },
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Plano Enterprise',
                attributes: {},
                styles: { padding: '24px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Enterprise', content: 'Corporativo', attributes: {}, styles: { fontSize: '20px', color: '#94a3b8' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h2', label: 'Preço Ent', content: 'Sob Consulta', attributes: {}, styles: { fontSize: '28px', color: '#ffffff' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc', content: 'Suporte 24/7 e banco de dados dedicado.', attributes: {}, styles: { fontSize: '14px', color: '#cbd5e1' }, children: [] },
                  { id: generateId(), type: 'button', tagName: 'button', label: 'Contato', content: 'Falar com Consultor', attributes: {}, styles: { padding: '10px', backgroundColor: '#334155', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }, children: [] }
                ]
              }
            ]
          }
        ]
      };

    case 'section-testimonials':
      return {
        id,
        type,
        tagName: 'section',
        label: 'Depoimentos de Clientes',
        attributes: { class: 'testimonials-section' },
        styles: {
          padding: '40px 20px',
          backgroundColor: '#020617',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          color: '#ffffff'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título Depoimentos',
            content: 'O que nossos clientes dizem',
            attributes: {},
            styles: { fontSize: '28px', fontWeight: '700', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'grid-2',
            tagName: 'div',
            label: 'Grid Depoimentos',
            attributes: {},
            styles: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' },
            children: [
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Depoimento 1',
                attributes: {},
                styles: { padding: '20px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' },
                children: [
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Avaliação', content: '⭐⭐⭐⭐⭐ "O Connect Web Editor revolucionou a velocidade de entrega de sites na nossa agência!"', attributes: {}, styles: { fontSize: '15px', fontStyle: 'italic', color: '#e2e8f0' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h4', label: 'Nome', content: '— Carlos Silva, Diretor de Tecnologia', attributes: {}, styles: { fontSize: '13px', color: '#6366f1', marginTop: '10px' }, children: [] }
                ]
              },
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Depoimento 2',
                attributes: {},
                styles: { padding: '20px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' },
                children: [
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Avaliação', content: '⭐⭐⭐⭐⭐ "A facilidade de conectar formulários ao banco de dados sem complicação é incrível!"', attributes: {}, styles: { fontSize: '15px', fontStyle: 'italic', color: '#e2e8f0' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h4', label: 'Nome', content: '— Mariana Souza, Desenvolvedora Web', attributes: {}, styles: { fontSize: '13px', color: '#6366f1', marginTop: '10px' }, children: [] }
                ]
              }
            ]
          }
        ]
      };

    // --- TEMPLATES PRONTOS DE FORMULÁRIO ---
    case 'template-login':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Formulário de Login Completo',
        attributes: { class: 'login-wrapper' },
        styles: {
          maxWidth: '420px',
          margin: '40px auto',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título Login',
            content: 'Acessar Conta',
            attributes: {},
            styles: { fontSize: '24px', fontWeight: '700', color: '#0f172a', textAlign: 'center', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'form',
            tagName: 'form',
            label: 'Form Login',
            attributes: { action: '#', method: 'POST' },
            styles: { display: 'flex', flexDirection: 'column', gap: '16px' },
            children: [
              {
                id: generateId(),
                type: 'form-group',
                tagName: 'div',
                label: 'Grupo Email',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '6px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'label',
                    label: 'Label Email',
                    content: 'Endereço de E-mail',
                    attributes: {},
                    styles: { fontSize: '14px', fontWeight: '500', color: '#334155' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'input-email',
                    tagName: 'input',
                    label: 'Input Email',
                    attributes: { type: 'email', placeholder: 'seu.email@empresa.com', required: 'true' },
                    styles: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },
                    children: []
                  }
                ]
              },
              {
                id: generateId(),
                type: 'form-group',
                tagName: 'div',
                label: 'Grupo Senha',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '6px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'label',
                    label: 'Label Senha',
                    content: 'Senha de Acesso',
                    attributes: {},
                    styles: { fontSize: '14px', fontWeight: '500', color: '#334155' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'input-password',
                    tagName: 'input',
                    label: 'Input Password',
                    attributes: { type: 'password', placeholder: '••••••••', required: 'true' },
                    styles: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },
                    children: []
                  }
                ]
              },
              {
                id: generateId(),
                type: 'checkbox',
                tagName: 'div',
                label: 'Lembrar de mim',
                attributes: {},
                styles: { display: 'flex', alignItems: 'center', gap: '8px' },
                children: [
                  {
                    id: generateId(),
                    type: 'input-text',
                    tagName: 'input',
                    label: 'Check',
                    attributes: { type: 'checkbox' },
                    styles: { width: '16px', height: '16px' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'label',
                    label: 'Label',
                    content: 'Manter conectado',
                    attributes: {},
                    styles: { fontSize: '13px', color: '#64748b' },
                    children: []
                  }
                ]
              },
              {
                id: generateId(),
                type: 'button',
                tagName: 'button',
                label: 'Botão Entrar',
                content: 'Entrar na Plataforma',
                attributes: { type: 'submit' },
                styles: {
                  padding: '12px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%'
                },
                children: []
              }
            ]
          }
        ]
      };

    case 'template-contact':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Formulário de Contato Completo',
        attributes: {},
        styles: {
          maxWidth: '560px',
          margin: '30px auto',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título',
            content: 'Fale Conosco',
            attributes: {},
            styles: { fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0' },
            children: []
          },
          {
            id: generateId(),
            type: 'paragraph',
            tagName: 'p',
            label: 'Subtítulo',
            content: 'Preencha os campos abaixo e entraremos em contato o mais rápido possível.',
            attributes: {},
            styles: { fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' },
            children: []
          },
          createDefaultNode('form-group'),
          {
            id: generateId(),
            type: 'form-group',
            tagName: 'div',
            label: 'Grupo Mensagem',
            attributes: {},
            styles: { display: 'flex', flexDirection: 'column', gap: '6px' },
            children: [
              {
                id: generateId(),
                type: 'heading',
                tagName: 'label',
                label: 'Label Mensagem',
                content: 'Sua Mensagem',
                attributes: {},
                styles: { fontSize: '14px', fontWeight: '500', color: '#334155' },
                children: []
              },
              {
                id: generateId(),
                type: 'textarea',
                tagName: 'textarea',
                label: 'Textarea Mensagem',
                attributes: { placeholder: 'Digite aqui os detalhes da sua solicitação...', rows: '5' },
                styles: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },
                children: []
              }
            ]
          },
          createDefaultNode('button')
        ]
      };


    case 'footer': {
      const g1 = generateId();
      const g2 = generateId();
      const g3 = generateId();
      const g4 = generateId();
      return {
        id,
        type,
        tagName: 'footer',
        label: 'Rodapé do Site',
        attributes: { class: 'site-footer' },
        styles: {
          backgroundColor: '#0a0f1e',
          color: '#94a3b8',
          padding: '48px 40px 24px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        },
        children: [
          // Top section: Logo + 3 link columns
          {
            id: generateId(),
            type: 'grid-3',
            tagName: 'div',
            label: 'Grid Colunas Footer',
            attributes: {},
            styles: {
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '40px',
              width: '100%'
            },
            children: [
              // Coluna 1: Logo + descrição
              {
                id: g1,
                type: 'container',
                tagName: 'div',
                label: 'Coluna Logo',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'h3',
                    label: 'Logo Footer',
                    content: '🚀 MeuSite',
                    attributes: {},
                    styles: { fontSize: '22px', fontWeight: '700', color: '#6366f1', margin: '0' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'paragraph',
                    tagName: 'p',
                    label: 'Descrição Footer',
                    content: 'Criamos soluções digitais incríveis para empresas em crescimento. Qualidade, inovação e excelência em cada projeto.',
                    attributes: {},
                    styles: { fontSize: '13px', lineHeight: '1.7', color: '#64748b', margin: '0', maxWidth: '280px' },
                    children: []
                  }
                ]
              },
              // Coluna 2: Links de Serviços
              {
                id: g2,
                type: 'container',
                tagName: 'div',
                label: 'Coluna Serviços',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'h4',
                    label: 'Título Coluna',
                    content: 'Serviços',
                    attributes: {},
                    styles: { fontSize: '14px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' },
                    children: []
                  },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Serviço 1', content: 'Desenvolvimento Web', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Serviço 2', content: 'Design de Interfaces', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Serviço 3', content: 'Consultoria Digital', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Serviço 4', content: 'Marketing Digital', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] }
                ]
              },
              // Coluna 3: Links Empresa
              {
                id: g3,
                type: 'container',
                tagName: 'div',
                label: 'Coluna Empresa',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'h4',
                    label: 'Título Coluna',
                    content: 'Empresa',
                    attributes: {},
                    styles: { fontSize: '14px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' },
                    children: []
                  },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Empresa 1', content: 'Sobre Nós', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Empresa 2', content: 'Portfólio', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Empresa 3', content: 'Blog', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Link Empresa 4', content: 'Carreiras', attributes: { href: '#' }, styles: { color: '#64748b', textDecoration: 'none', fontSize: '13px', display: 'block' }, children: [] }
                ]
              },
              // Coluna 4: Contato
              {
                id: g4,
                type: 'container',
                tagName: 'div',
                label: 'Coluna Contato',
                attributes: {},
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  {
                    id: generateId(),
                    type: 'heading',
                    tagName: 'h4',
                    label: 'Título Coluna',
                    content: 'Contato',
                    attributes: {},
                    styles: { fontSize: '14px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' },
                    children: []
                  },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Email', content: '📧 contato@meusite.com.br', attributes: {}, styles: { color: '#64748b', fontSize: '13px', margin: '0' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Telefone', content: '📞 (11) 9 9999-9999', attributes: {}, styles: { color: '#64748b', fontSize: '13px', margin: '0' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Endereço', content: '📍 São Paulo, Brasil', attributes: {}, styles: { color: '#64748b', fontSize: '13px', margin: '0' }, children: [] }
                ]
              }
            ]
          },
          // Bottom bar: copyright + social links
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Barra Inferior Footer',
            attributes: {},
            styles: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #1e293b',
              paddingTop: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            },
            children: [
              {
                id: generateId(),
                type: 'paragraph',
                tagName: 'p',
                label: 'Copyright',
                content: `© ${new Date().getFullYear()} MeuSite. Todos os direitos reservados.`,
                attributes: {},
                styles: { fontSize: '12px', color: '#475569', margin: '0' },
                children: []
              },
              {
                id: generateId(),
                type: 'container',
                tagName: 'div',
                label: 'Links Legais',
                attributes: {},
                styles: { display: 'flex', gap: '16px' },
                children: [
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Privacidade', content: 'Política de Privacidade', attributes: { href: '#' }, styles: { color: '#475569', fontSize: '12px', textDecoration: 'none' }, children: [] },
                  { id: generateId(), type: 'link', tagName: 'a', label: 'Termos', content: 'Termos de Uso', attributes: { href: '#' }, styles: { color: '#475569', fontSize: '12px', textDecoration: 'none' }, children: [] }
                ]
              }
            ]
          }
        ]
      };
    }

    case 'section-cta':
      return {
        id,
        type,
        tagName: 'section',
        label: 'CTA – Call to Action',
        attributes: { class: 'cta-section' },
        styles: {
          padding: '64px 40px',
          backgroundColor: '#4f46e5',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
          color: '#ffffff'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título CTA',
            content: 'Pronto para começar seu próximo projeto?',
            attributes: {},
            styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: '0', maxWidth: '600px' },
            children: []
          },
          {
            id: generateId(),
            type: 'paragraph',
            tagName: 'p',
            label: 'Subtítulo CTA',
            content: 'Entre em contato com nossa equipe hoje mesmo e descubra como podemos impulsionar seu negócio digital.',
            attributes: {},
            styles: { fontSize: '16px', color: '#c7d2fe', margin: '0', maxWidth: '500px' },
            children: []
          },
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Botões CTA',
            attributes: {},
            styles: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' },
            children: [
              {
                id: generateId(),
                type: 'button',
                tagName: 'button',
                label: 'Botão Principal CTA',
                content: 'Falar com Especialista',
                attributes: {},
                styles: { padding: '14px 28px', backgroundColor: '#ffffff', color: '#4f46e5', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' },
                children: []
              },
              {
                id: generateId(),
                type: 'button',
                tagName: 'button',
                label: 'Botão Secundário CTA',
                content: 'Ver Portfólio',
                attributes: {},
                styles: { padding: '14px 28px', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '600', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '15px' },
                children: []
              }
            ]
          }
        ]
      };

    case 'section-features-list':
      return {
        id,
        type,
        tagName: 'section',
        label: 'Seção de Features / Recursos',
        attributes: { class: 'features-section' },
        styles: {
          padding: '60px 40px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px'
        },
        children: [
          {
            id: generateId(),
            type: 'heading',
            tagName: 'h2',
            label: 'Título Features',
            content: 'Por que escolher nossa plataforma?',
            attributes: {},
            styles: { fontSize: '30px', fontWeight: '700', color: '#0f172a', margin: '0', textAlign: 'center' },
            children: []
          },
          {
            id: generateId(),
            type: 'grid-3',
            tagName: 'div',
            label: 'Grid Features',
            attributes: {},
            styles: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', width: '100%' },
            children: [
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Feature 1',
                attributes: {},
                styles: { padding: '28px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Ícone Feature', content: '⚡', attributes: {}, styles: { fontSize: '32px', margin: '0' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h4', label: 'Nome Feature', content: 'Alta Performance', attributes: {}, styles: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc Feature', content: 'Aplicações otimizadas para carregamento ultra-rápido e melhor experiência do usuário.', attributes: {}, styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0' }, children: [] }
                ]
              },
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Feature 2',
                attributes: {},
                styles: { padding: '28px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Ícone Feature', content: '🔒', attributes: {}, styles: { fontSize: '32px', margin: '0' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h4', label: 'Nome Feature', content: 'Segurança Total', attributes: {}, styles: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc Feature', content: 'Proteção de dados e privacidade garantidas com criptografia de ponta a ponta.', attributes: {}, styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0' }, children: [] }
                ]
              },
              {
                id: generateId(),
                type: 'card',
                tagName: 'div',
                label: 'Feature 3',
                attributes: {},
                styles: { padding: '28px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'h3', label: 'Ícone Feature', content: '📱', attributes: {}, styles: { fontSize: '32px', margin: '0' }, children: [] },
                  { id: generateId(), type: 'heading', tagName: 'h4', label: 'Nome Feature', content: 'Totalmente Responsivo', attributes: {}, styles: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0' }, children: [] },
                  { id: generateId(), type: 'paragraph', tagName: 'p', label: 'Desc Feature', content: 'Design adaptado para qualquer dispositivo: desktop, tablet ou celular.', attributes: {}, styles: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0' }, children: [] }
                ]
              }
            ]
          }
        ]
      };

    case 'widget-chat':
      return {
        id,
        type,
        tagName: 'div',
        label: 'Widget Chat & WebRTC Vídeo',
        attributes: { 
          class: 'cwe-webrtc-widget',
          'data-qap-phone': '5511999998888',
          'data-qap-start': '08:00',
          'data-qap-end': '18:00',
          'data-qap-out-msg': '🔴 Nosso atendimento ao vivo funciona das 08:00 às 18:00. Deixe sua mensagem!'
        },
        styles: {
          margin: '32px auto',
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif'
        },
        children: [
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Cabeçalho do Chat',
            attributes: {},
            styles: {
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            },
            children: [
              {
                id: generateId(),
                type: 'container',
                tagName: 'div',
                label: 'Status do Atendente',
                attributes: {},
                styles: { display: 'flex', alignItems: 'center', gap: '10px' },
                children: [
                  { id: generateId(), type: 'heading', tagName: 'span', label: 'Avatar', content: '💬', attributes: {}, styles: { fontSize: '20px' }, children: [] },
                  {
                    id: generateId(),
                    type: 'container',
                    tagName: 'div',
                    label: 'Texto Status',
                    attributes: {},
                    styles: { display: 'flex', flexDirection: 'column' },
                    children: [
                      { id: generateId(), type: 'heading', tagName: 'strong', label: 'Nome Atendimento', content: 'Suporte Ao Vivo WebRTC', attributes: {}, styles: { fontSize: '14px', color: '#ffffff' }, children: [] },
                      { id: generateId(), type: 'paragraph', tagName: 'span', label: 'Status Online', content: '🟢 Atendente Online', attributes: {}, styles: { fontSize: '11px', color: '#a7f3d0' }, children: [] }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Container Vídeo WebRTC',
            attributes: { id: 'webrtc-video-box' },
            styles: {
              padding: '12px',
              backgroundColor: '#1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderBottom: '1px solid #334155'
            },
            children: [
              {
                id: generateId(),
                type: 'container',
                tagName: 'div',
                label: 'Tela de Vídeo',
                attributes: {},
                styles: { position: 'relative', height: '200px', backgroundColor: '#000000', borderRadius: '10px', overflow: 'hidden' },
                children: [
                  {
                    id: generateId(),
                    type: 'paragraph',
                    tagName: 'video',
                    label: 'Stream Remoto (Atendente)',
                    attributes: { id: 'cwe-remote-video', autoplay: 'true', playsinline: 'true' },
                    styles: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'paragraph',
                    tagName: 'video',
                    label: 'Stream Local (Visitante)',
                    attributes: { id: 'cwe-local-video', autoplay: 'true', playsinline: 'true', muted: 'true' },
                    styles: { position: 'absolute', bottom: '8px', right: '8px', width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid rgba(255,255,255,0.4)', backgroundColor: '#1e293b' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'paragraph',
                    tagName: 'div',
                    label: 'Placeholder aguardando',
                    attributes: { id: 'cwe-video-placeholder' },
                    content: '📹 Aguardando conexão...',
                    styles: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#64748b', fontSize: '12px', fontFamily: 'system-ui,sans-serif', textAlign: 'center', pointerEvents: 'none' },
                    children: []
                  }
                ]
              },
              {
                id: generateId(),
                type: 'container',
                tagName: 'div',
                label: 'Controles WebRTC',
                attributes: {},
                styles: { display: 'flex', gap: '6px', justifyContent: 'center' },
                children: [
                  {
                    id: generateId(),
                    type: 'button',
                    tagName: 'button',
                    label: 'Iniciar Vídeo',
                    content: '📹 Iniciar Vídeo',
                    attributes: { id: 'btn-start-video', onclick: 'startWebRTCVideo()' },
                    styles: { padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'button',
                    tagName: 'button',
                    label: 'Áudio Mudo',
                    content: '🎙️ Áudio',
                    attributes: { id: 'btn-toggle-audio', onclick: 'toggleWebRTCAudio()' },
                    styles: { padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
                    children: []
                  },
                  {
                    id: generateId(),
                    type: 'button',
                    tagName: 'button',
                    label: 'Desconectar',
                    content: '🔴 Encerrar',
                    attributes: { id: 'btn-stop-webrtc', onclick: 'stopWebRTC()' },
                    styles: { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
                    children: []
                  }
                ]
              }
            ]
          },
          {
            id: generateId(),
            type: 'container',
            tagName: 'div',
            label: 'Histórico de Mensagens',
            attributes: { id: 'cwe-chat-messages' },
            styles: {
              padding: '14px',
              height: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#0f172a'
            },
            children: [
              {
                id: generateId(),
                type: 'paragraph',
                tagName: 'div',
                label: 'Mensagem Atendente',
                content: '👋 Olá! Seja bem-vindo ao suporte ao vivo. Como posso te ajudar com o seu projeto hoje?',
                attributes: {},
                styles: { backgroundColor: '#1e293b', color: '#f1f5f9', padding: '10px 12px', borderRadius: '12px 12px 12px 2px', maxWidth: '85%', fontSize: '12px' },
                children: []
              }
            ]
          },
          {
            id: generateId(),
            type: 'form',
            tagName: 'form',
            label: 'Formulário de Envio Chat',
            attributes: { id: 'cwe-chat-form', onsubmit: 'sendChatMessage(event)' },
            styles: {
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              borderTop: '1px solid #334155',
              display: 'flex',
              gap: '8px'
            },
            children: [
              {
                id: generateId(),
                type: 'input-text',
                tagName: 'input',
                label: 'Campo Mensagem',
                attributes: { id: 'cwe-chat-input', type: 'text', placeholder: 'Digite sua mensagem...' },
                styles: { flex: '1', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', padding: '8px 12px', fontSize: '12px' },
                children: []
              },
              {
                id: generateId(),
                type: 'button',
                tagName: 'button',
                label: 'Botão Enviar',
                content: 'Enviar 🚀',
                attributes: { type: 'submit' },
                styles: { padding: '8px 14px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
                children: []
              }
            ]
          }
        ]
      };

    default:
      return {
        id,
        type: 'container',
        tagName: 'div',
        label: 'Bloco Simples',
        attributes: {},
        styles: { padding: '16px', border: '1px dashed #cbd5e1' },
        children: []
      };
  }
}
