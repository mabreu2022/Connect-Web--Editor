import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Props {
  onSwitchToLogin: (email?: string, password?: string) => void;
}

export const ForgotPasswordPage: React.FC<Props> = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Auto-fill token from URL if user clicked link in email (e.g. ?token=123456)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setStep(2);
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/recuperar-senha`, { email: email.trim() });
      setSuccessMsg(res.data.message || 'Código enviado para seu e-mail!');
      setToken(''); // Campo vazio para o usuário digitar o código recebido por e-mail
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Por favor, informe o código de verificação.');
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/redefinir-senha`, {
        email: email.trim(),
        token: token.trim(),
        novaSenha
      });

      alert(res.data.message || 'Senha redefinida com sucesso!');
      onSwitchToLogin(email.trim(), novaSenha);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo Header */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🔑</div>
          <h1 style={styles.logoText}>Connect Web Editor</h1>
          <p style={styles.logoSub}>Recuperação de Acesso à Conta</p>
        </div>

        <h2 style={styles.title}>
          {step === 1 ? 'Esqueceu sua senha?' : 'Criar Nova Senha'}
        </h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {successMsg && <div style={styles.successBox}>{successMsg}</div>}

        {step === 1 ? (
          /* PASSO 1: Inserir E-mail */
          <form onSubmit={handleSendCode} style={styles.form}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              Digite seu e-mail cadastrado. Enviaremos um código de verificação para você redefinir sua senha.
            </p>

            <label style={styles.label}>E-mail de Cadastro</label>
            <input
              style={styles.input}
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código de Recuperação'}
            </button>
          </form>
        ) : (
          /* PASSO 2: Código + Nova Senha */
          <form onSubmit={handleResetPassword} style={styles.form}>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              Informe o código de 6 dígitos enviado para <strong>{email}</strong> e escolha sua nova senha.
            </p>

            <label style={styles.label}>Código de Verificação</label>
            <input
              name="code_pin"
              autoComplete="one-time-code"
              style={{ ...styles.input, textAlign: 'center', letterSpacing: '6px', fontWeight: '800', fontSize: '18px', color: '#818cf8' }}
              type="text"
              placeholder="000000"
              maxLength={6}
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />

            <label style={styles.label}>Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: '44px' }}
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            <label style={styles.label}>Confirmar Nova Senha</label>
            <input
              style={styles.input}
              type={showPass ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              value={confirmaSenha}
              onChange={e => setConfirmaSenha(e.target.value)}
              required
            />

            <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Redefinindo...' : 'Alterar Senha e Entrar'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button type="button" onClick={() => onSwitchToLogin()} style={styles.linkBtn}>
            ← Voltar para o Login
          </button>
        </div>
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
  logoArea: { textAlign: 'center', marginBottom: '28px' },
  logoIcon: { fontSize: '40px', marginBottom: '8px' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#a5b4fc', margin: '0 0 4px' },
  logoSub: { fontSize: '12px', color: '#64748b', margin: 0 },
  title: { fontSize: '20px', fontWeight: '700', color: '#f1f5f9', marginBottom: '20px', textAlign: 'center' },
  errorBox: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  successBox: { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#f1f5f9', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '14px' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '14px' },
  submitBtn: { padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: '700', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginTop: '10px' },
  linkBtn: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }
};
