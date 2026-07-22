import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Save, 
  Download, 
  Bot, 
  Keyboard, 
  Code2, 
  Layout, 
  Columns2,
  FileCode,
  MessageSquare
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const ManualPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const sections: DocSection[] = [
    {
      id: 'intro',
      title: '1. Introdução',
      icon: <BookOpen size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Bem-vindo ao Connect Web Editor 🚀</h2>
          <p>
            O <strong>Connect Web Editor</strong> é uma plataforma moderna e intuitiva de arrastar e soltar (drag-and-drop) 
            desenvolvida para acelerar a criação, edição e implantação de websites institucionais, landing pages e portfólios responsivos.
          </p>
          
          <div className="info-card info-success">
            <h4>⚡ Principais Recursos do Sistema</h4>
            <ul>
              <li>Edição Visual em Tempo Real com gerador de código limpo.</li>
              <li>Sincronização na Nuvem em banco de dados Firebird integrado.</li>
              <li>Segurança robusta e cache local anti-F5 para prevenção de perda de dados.</li>
              <li>Widget nativo de Chatbot WhatsApp com Suporte a Vídeo Chamadas WebRTC criptografadas.</li>
              <li>Exportador ZIP de projeto completo contendo HTML/CSS puro.</li>
            </ul>
          </div>

          <h3 className="mt-4">Estrutura de Trabalho</h3>
          <p>
            O editor opera no conceito de <strong>Componentes Modulares</strong>. Você monta sua página combinando blocos pré-desenvolvidos de alta qualidade, personalizando as cores, imagens, textos e links diretamente pelo painel de propriedades.
          </p>
        </div>
      )
    },
    {
      id: 'layout',
      title: '2. Layout do Editor',
      icon: <Layout size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Layout da Área de Trabalho 🖥️</h2>
          <p>A tela principal do sistema é dividida em quatro áreas de controle altamente especializadas:</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-header">
                <span className="badge">Esquerda</span>
                <h4>Paleta & Árvore DOM</h4>
              </div>
              <p>O menu lateral contém as abas para arrastar novos componentes para a página, gerenciar o menu de páginas do projeto e visualizar a árvore hierárquica do DOM.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-header">
                <span className="badge badge-indigo">Centro</span>
                <h4>Canvas de Design</h4>
              </div>
              <p>A área central renderiza o seu site de forma interativa. É onde você clica para selecionar elementos, alterar textos diretamente na tela e arrastar componentes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="badge badge-success">Direita</span>
                <h4>Inspetor de Propriedades</h4>
              </div>
              <p>Ao selecionar qualquer elemento (título, botão, imagem) no canvas, a barra direita é ativada permitindo editar classes CSS, textos, links e fontes personalizadas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-header">
                <span className="badge badge-purple">Topo</span>
                <h4>Barra de Navegação</h4>
              </div>
              <p>Centraliza as ações de troca de projetos, criação de páginas adicionais, alternador de visualização (Visual/Código/Split), salvar, botões de desfazer/refazer e exportação ZIP.</p>
            </div>
          </div>

          <h3 className="mt-4">Modos de Visualização</h3>
          <p>No topo central, você pode selecionar como prefere trabalhar:</p>
          <div className="mode-explain">
            <div className="mode-item">
              <Layout size={18} className="text-indigo" />
              <div>
                <strong>Visual:</strong> Foco total no design arrasta-e-solta em tempo real.
              </div>
            </div>
            <div className="mode-item">
              <Columns2 size={18} className="text-cyan" />
              <div>
                <strong>Split View:</strong> Visualização dividida ao meio. Qualquer alteração visual atualiza o editor de código e vice-versa.
              </div>
            </div>
            <div className="mode-item">
              <Code2 size={18} className="text-emerald" />
              <div>
                <strong>Código (Monaco):</strong> Acesso direto ao código-fonte HTML da página pelo mesmo editor de código utilizado no VS Code.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'components',
      title: '3. Componentes do Canvas',
      icon: <Layers size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Componentes Disponíveis 🧱</h2>
          <p>
            O editor disponibiliza uma coleção de componentes modernos desenvolvidos em HTML5 semântico e estilizados com CSS limpo. Todos são 100% responsivos.
          </p>

          <table className="doc-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Componentes</th>
                <th>Finalidade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Headers (Cabeçalhos)</strong></td>
                <td>Navbar Clássica, Compacta ou com Contatos</td>
                <td>Menu superior de navegação e branding do website.</td>
              </tr>
              <tr>
                <td><strong>Heros (Destaques)</strong></td>
                <td>Hero Banner, Split Hero, Centralizado</td>
                <td>Primeira seção de impacto do site, com títulos e botões Call To Action.</td>
              </tr>
              <tr>
                <td><strong>Features (Vantagens)</strong></td>
                <td>Grid de Recursos, Lista com Ícones, Benefícios</td>
                <td>Apresentação de diferenciais do seu produto ou serviço.</td>
              </tr>
              <tr>
                <td><strong>Pricing (Preços)</strong></td>
                <td>Tabelas de Preços, Cards de Assinatura</td>
                <td>Exibição de valores de planos com botões para pagamento ou contratação.</td>
              </tr>
              <tr>
                <td><strong>Forms & Contact</strong></td>
                <td>Formulário de Contato, Localização, Rodapé</td>
                <td>Formulários de captura de leads e informações gerais da empresa.</td>
              </tr>
              <tr>
                <td><strong>Widgets</strong></td>
                <td>WhatsApp Chatbot CWE Widget</td>
                <td>Botão flutuante de atendimento ao vivo com suporte a vídeo.</td>
              </tr>
            </tbody>
          </table>

          <div className="info-card info-warning mt-4">
            <h4>💡 Dica para Imagens e Ícones</h4>
            <p>
              Você pode alterar qualquer imagem do canvas clicando nela e inserindo uma URL no painel direito. Utilize URLs diretas (como as do Unsplash) ou imagens carregadas em serviços de CDN para garantir que funcionem em produção.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'saving',
      title: '4. Salvamento & Banco de Dados',
      icon: <Save size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Salvamento Automatizado & Nuvem ☁️</h2>
          <p>
            O Connect Web Editor protege o seu trabalho contra quedas de energia ou cliques acidentais de duas formas integradas:
          </p>

          <div className="save-flow">
            <div className="save-step">
              <div className="step-num">1</div>
              <h4>Cache Local Anti-F5 (Instantâneo)</h4>
              <p>Ao realizar qualquer alteração (escrever texto, mudar de cor, arrastar elemento), a alteração é armazenada instantaneamente no cache do seu navegador (LocalStorage). Mesmo que você dê F5 ou Ctrl+R, nada é perdido.</p>
            </div>
            
            <div className="save-step">
              <div className="step-num">2</div>
              <h4>Banco de Dados Centralizado (Nuvem)</h4>
              <p>Quando você clica no botão de <strong>Salvar (Ícone do Disquete Verde)</strong> na barra de ferramentas, o projeto completo é salvo de forma definitiva no banco de dados Firebird 5 da VPS, associado à sua conta de usuário.</p>
            </div>
          </div>

          <h3 className="mt-4">Múltiplos Projetos</h3>
          <p>
            Na barra de navegação, o badge verde **Projeto:** permite gerenciar todos os seus sites hospedados em nuvem:
          </p>
          <ul>
            <li><strong>Trocar de Projeto:</strong> Altere a seleção para que o editor carregue instantaneamente o layout daquele site específico do banco de dados.</li>
            <li><strong>➕ Novo Projeto:</strong> Cria um novo site do zero no banco de dados.</li>
            <li><strong>❌ Excluir Projeto Atual:</strong> Apaga permanentemente o projeto e todas as suas sub-páginas da nuvem.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'chatbot',
      title: '5. Chatbot WhatsApp & Vídeo',
      icon: <Bot size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Integração com WhatsApp & Vídeo Chamadas 📞</h2>
          <p>
            O grande diferencial do Connect Web Editor é o widget nativo de suporte ao cliente (**Chatbot CWE**). Ele adiciona um botão flutuante inteligente do WhatsApp no seu site gerado.
          </p>

          <h3>Configurações do Chatbot</h3>
          <p>Ao clicar no botão de robô (<Bot size={14} />) na barra superior, você acessa a central de controle do Bot:</p>
          <ul>
            <li><strong>WhatsApp do Atendente:</strong> O número oficial para onde o cliente será redirecionado caso queira falar por mensagem (padrão do sistema: `5511945457934`).</li>
            <li><strong>Horários de Funcionamento:</strong> Defina a hora de abertura e fechamento do atendimento. Se o cliente tentar falar fora desse horário, o bot responderá automaticamente com uma mensagem personalizada definida por você.</li>
            <li><strong>Frequência de Perguntas (FAQ):</strong> Adicione respostas rápidas para dúvidas frequentes. O bot filtrará palavras-chave e responderá de forma instantânea.</li>
          </ul>

          <h3 className="mt-4">Chamada de Vídeo WebRTC (Em Tempo Real)</h3>
          <p>
            Caso o cliente necessite de um atendimento presencial ou suporte complexo, ele pode clicar no botão <strong>📹 Iniciar Chamada de Vídeo</strong> dentro do widget no site.
          </p>
          <div className="video-flow-box">
            <h4>Como Funciona a Chamada de Vídeo?</h4>
            <ol>
              <li>O visitante clica no botão de vídeo no site.</li>
              <li>O sistema cria uma sala segura criptografada ponta-a-ponta.</li>
              <li>O atendente cadastrado recebe um link direto no WhatsApp via QAP Messenger.</li>
              <li>Ao clicar no link, o atendente acessa a sala de chamada no navegador do seu smartphone ou PC, e a videoconferência começa instantaneamente em alta qualidade (via WebRTC P2P).</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: '6. Exportação ZIP',
      icon: <Download size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Exportando seu Site para Produção 📦</h2>
          <p>
            Uma vez que seu site esteja pronto, você pode exportar todos os arquivos necessários para hospedá-lo em qualquer servidor de hospedagem compartilhada, VPS ou CDN.
          </p>
          
          <p>
            Basta clicar no botão <strong>ZIP</strong> na barra superior. O navegador fará o download de um arquivo compactado contendo:
          </p>

          <div className="zip-structure">
            <div className="zip-file">📂 / (Diretório Raiz)</div>
            <div className="zip-file indent-1">📄 index.html <span className="text-muted">(Página Inicial)</span></div>
            <div className="zip-file indent-1">📄 [outras-paginas].html <span className="text-muted">(Páginas secundárias)</span></div>
            <div className="zip-file indent-1">📄 style.css <span className="text-muted">(Estilos limpos compilados)</span></div>
            <div className="zip-file indent-1">📂 js/</div>
            <div className="zip-file indent-2">📄 webrtc-widget.js <span className="text-muted">(Script do Chatbot e chamada de vídeo)</span></div>
          </div>

          <div className="info-card info-success mt-4">
            <h4>🌐 Hospedagem Fácil</h4>
            <p>
              Basta extrair o conteúdo do arquivo ZIP na pasta pública (`public_html`, `www` ou similar) do seu serviço de hospedagem. O site funcionará instantaneamente sem necessidade de configurar bancos de dados externos no servidor de destino.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'shortcuts',
      title: '7. Atalhos & Teclado',
      icon: <Keyboard size={18} />,
      content: (
        <div className="doc-section-content">
          <h2>Atalhos de Teclado Rápidos ⌨️</h2>
          <p>Agilize seu fluxo de trabalho utilizando os seguintes atalhos de teclado suportados no editor:</p>

          <table className="doc-table text-left">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Atalho</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>DEL</kbd> ou <kbd>Backspace</kbd></td>
                <td>Exclui o componente que está selecionado no canvas de visualização (ignorado ao editar textos ou códigos).</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>Z</kbd></td>
                <td>Desfaz a última ação realizada no editor.</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></td>
                <td>Refaz a última ação desfeita.</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                <td>Salva as páginas atuais no disco ou envia para a nuvem se estiver logado.</td>
              </tr>
              <tr>
                <td><kbd>ESC</kbd></td>
                <td>Limpa a seleção atual do componente ativo.</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
  ];

  return (
    <div className="manual-container">
      {/* Top Header */}
      <header className="manual-header">
        <div className="manual-logo">
          <FileCode className="logo-icon" size={26} />
          <div>
            <h1>Documentação Oficial</h1>
            <p>Connect Web Editor SaaS Platform</p>
          </div>
        </div>
        <button className="manual-close-btn" onClick={() => window.close()}>
          Fechar Manual
        </button>
      </header>

      {/* Main Grid Layout */}
      <div className="manual-layout">
        {/* Sidebar Nav */}
        <aside className="manual-sidebar">
          <nav className="manual-nav">
            {sections.map(sec => (
              <button
                key={sec.id}
                className={`manual-nav-item ${activeSection === sec.id ? 'active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
              >
                {sec.icon}
                <span>{sec.title}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer-card">
            <h4>💡 Suporte Técnico</h4>
            <p>Precisa de ajuda com alguma funcionalidade?</p>
            <a 
              href="https://wa.me/5511945457934" 
              target="_blank" 
              rel="noopener noreferrer"
              className="support-link"
            >
              <MessageSquare size={14} />
              Chamar no WhatsApp
            </a>
          </div>
        </aside>

        {/* Content Viewer */}
        <main className="manual-main">
          <div className="content-card">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </main>
      </div>
    </div>
  );
};
