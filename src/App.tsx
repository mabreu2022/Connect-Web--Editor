import React, { useState } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ComponentPalette } from './components/Sidebar/ComponentPalette';
import { DOMTree } from './components/Sidebar/DOMTree';
import { PageManager } from './components/Sidebar/PageManager';
import { VisualCanvas } from './components/Canvas/VisualCanvas';
import { MonacoPanel } from './components/CodeEditor/MonacoPanel';
import { PropertyInspector } from './components/Inspector/PropertyInspector';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { AdminPanel } from './pages/admin/AdminPanel';
import { ManualPage } from './pages/manual/ManualPage';
import { Box, Layers, Files } from 'lucide-react';

// ---- Editor principal ----
const EditorLayout: React.FC = () => {
  const { mode } = useEditor();
  const [activeSidebarTab, setActiveSidebarTab] = useState<'palette' | 'tree' | 'pages'>('palette');

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-workspace">
        <aside className="left-sidebar">
          <div className="sidebar-tabs">
            <button className={`tab-btn ${activeSidebarTab === 'palette' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('palette')}>
              <Box size={14} /> Componentes
            </button>
            <button className={`tab-btn ${activeSidebarTab === 'pages' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('pages')}>
              <Files size={14} /> Páginas
            </button>
            <button className={`tab-btn ${activeSidebarTab === 'tree' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('tree')}>
              <Layers size={14} /> Árvore DOM
            </button>
          </div>
          <div className="sidebar-content">
            {activeSidebarTab === 'palette' && <ComponentPalette />}
            {activeSidebarTab === 'pages' && <PageManager />}
            {activeSidebarTab === 'tree' && <DOMTree />}
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {mode === 'design' && <VisualCanvas />}
          {mode === 'code' && <MonacoPanel />}
          {mode === 'split' && (
            <div className="split-view-container">
              <div className="split-pane divider"><VisualCanvas /></div>
              <div className="split-pane"><MonacoPanel /></div>
            </div>
          )}
        </div>

        <PropertyInspector />
      </div>
    </div>
  );
};

// ---- Roteador interno (sem instalar react-router) ----
type Screen = 'login' | 'register' | 'forgot' | 'editor' | 'admin' | 'manual';

const AppRouter: React.FC = () => {
  // Se a rota for /manual, renderiza a documentação sem exigir login
  if (window.location.pathname.startsWith('/manual')) {
    return <ManualPage />;
  }

  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [loginPreset, setLoginPreset] = useState<{ email?: string; password?: string }>({});

  // Quando autenticado, navega automaticamente
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#6366f1', fontSize: '18px' }}>
        ⚡ Carregando...
      </div>
    );
  }

  if (user) {
    // Admin vai para o painel admin
    if (user.perfil === 1 && screen !== 'editor') {
      return (
        <>
          <AdminPanel />
          {/* Botão para acessar o editor */}
          <button
            onClick={() => setScreen('editor')}
            style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '10px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', zIndex: 9999, fontSize: '13px', fontWeight: '600' }}
          >
            ⚡ Abrir Editor
          </button>
        </>
      );
    }
    return (
      <EditorProvider>
        <EditorLayout />
      </EditorProvider>
    );
  }

  // Telas de autenticação
  if (screen === 'register') return <RegisterPage onSwitchToLogin={() => setScreen('login')} />;
  if (screen === 'forgot') {
    return (
      <ForgotPasswordPage
        onSwitchToLogin={(email, password) => {
          if (email || password) setLoginPreset({ email, password });
          setScreen('login');
        }}
      />
    );
  }

  return (
    <LoginPage
      initialEmail={loginPreset.email}
      initialPassword={loginPreset.password}
      onSwitchToRegister={() => setScreen('register')}
      onSwitchToForgot={() => setScreen('forgot')}
    />
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
