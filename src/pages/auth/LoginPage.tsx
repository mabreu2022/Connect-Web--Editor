import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  initialEmail?: string;
  initialPassword?: string;
}

export const LoginPage: React.FC<Props> = ({ 
  onSwitchToRegister, 
  onSwitchToForgot, 
  initialEmail = '', 
  initialPassword = '' 
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [senha, setSenha] = useState(initialPassword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>⚡</div>
          <h1 style={styles.logoText}>Connect Web Editor</h1>
          <p style={styles.logoSub}>Plataforma SaaS de criação de websites</p>
        </div>

        <h2 style={styles.title}>Entrar na sua conta</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>E-mail</label>
          <input
            style={styles.input}
            type="email"
            placeholder="seu@email.com.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...styles.input, paddingRight: '44px' }}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button type="button" onClick={onSwitchToForgot} style={styles.linkBtn}>
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={styles.switchText}>
          Não tem conta?{' '}
          <button onClick={onSwitchToRegister} style={styles.linkBtn}>
            Criar conta grátis
          </button>
        </p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    padding: '24px'
  },
  card: {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
    padding: '48px 40px', width: '100%', maxWidth: '420px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)'
  },
  logoArea: { textAlign: 'center', marginBottom: '32px' },
  logoIcon: { fontSize: '40px', marginBottom: '8px' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#a5b4fc', margin: '0 0 4px' },
  logoSub: { fontSize: '12px', color: '#64748b', margin: 0 },
  title: { fontSize: '20px', fontWeight: '700', color: '#f1f5f9', marginBottom: '24px', textAlign: 'center' },
  errorBox: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#f1f5f9', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '14px' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '14px' },
  submitBtn: { padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: '700', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  linkBtn: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' },
  switchText: { textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }
};
