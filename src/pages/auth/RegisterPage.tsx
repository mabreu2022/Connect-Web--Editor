import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Props {
  onSwitchToLogin: () => void;
}

interface Plano {
  pla_id: number;
  pla_nome: string;
  pla_preco_mes: number;
  pla_descricao: string;
  pla_max_pag: number;
  pla_max_proj: number;
  pla_destaque: number;
}

interface PixData {
  payload: string;
  qrCode: string;
  chavePix: string;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor: number;
}

export const RegisterPage: React.FC<Props> = ({ onSwitchToLogin }) => {
  const { registro } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<number>(2);
  const [pixInfo, setPixInfo] = useState<PixData | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [comprovanteBase64, setComprovanteBase64] = useState('');
  const [comprovanteFileName, setComprovanteFileName] = useState('');
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ nome: '', email: '', empresa: '', senha: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/planos`)
      .then(r => {
        setPlanos(r.data);
        const dest = r.data.find((p: Plano) => p.pla_destaque === 1);
        if (dest) setSelectedPlano(dest.pla_id);
      })
      .catch(() => {});
  }, []);

  // Sempre que mudar o plano selecionado, buscar QR Code via backend/pix.js
  useEffect(() => {
    if (step === 2 && selectedPlano) {
      setLoadingPix(true);
      axios.get(`${API_URL}/planos/gerar-pix?planoId=${selectedPlano}`)
        .then(r => setPixInfo(r.data))
        .catch(err => console.error(err))
        .finally(() => setLoadingPix(false));
    }
  }, [step, selectedPlano]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.senha !== form.confirmar) return setError('As senhas não coincidem.');
    if (form.senha.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprovanteFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprovanteBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!comprovanteBase64) {
      setError('Por favor, faça o upload da imagem/arquivo do comprovante PIX antes de enviar.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registro(form.nome, form.email, form.senha, form.empresa, selectedPlano, comprovanteBase64);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixPayload = () => {
    if (!pixInfo?.payload) return;
    navigator.clipboard.writeText(pixInfo.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const currentPlanoObj = planos.find(p => p.pla_id === selectedPlano);

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.card, maxWidth: step === 2 ? '720px' : '440px' }}>
        {/* Header */}
        <div style={styles.logoArea}>
          <div style={{ fontSize: '32px' }}>⚡</div>
          <h1 style={styles.logoText}>Connect Web Editor</h1>
          <p style={styles.subText}>Crie sua conta de usuário e faça o pagamento via PIX</p>
        </div>

        {/* STEP 1: DADOS DE CADASTRO */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={styles.title}>Passo 1 de 2: Seus Dados</h2>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div>
              <label style={styles.label}>Nome completo *</label>
              <input style={styles.input} name="nome" placeholder="João Silva" value={form.nome} onChange={handleChange} required />
            </div>
            <div>
              <label style={styles.label}>E-mail *</label>
              <input style={styles.input} name="email" type="email" placeholder="joao@empresa.com.br" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label style={styles.label}>Empresa (opcional)</label>
              <input style={styles.input} name="empresa" placeholder="Minha Empresa Ltda" value={form.empresa} onChange={handleChange} />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={styles.label}>Senha *</label>
              <input style={{ ...styles.input, paddingRight: '44px' }} name="senha" type={showPass ? 'text' : 'password'} placeholder="Mín. 6 caracteres" value={form.senha} onChange={handleChange} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <div>
              <label style={styles.label}>Confirmar senha *</label>
              <input style={styles.input} name="confirmar" type="password" placeholder="Repita a senha" value={form.confirmar} onChange={handleChange} required />
            </div>

            <button type="submit" style={styles.submitBtn}>
              Avançar para Escolha do Plano & PIX ➔
            </button>

            <p style={styles.switchText}>
              Já tem conta? <button type="button" onClick={onSwitchToLogin} style={styles.linkBtn}>Fazer login</button>
            </p>
          </form>
        )}

        {/* STEP 2: ESCOLHA DE PLANO + QR CODE PIX + UPLOAD COMPROVANTE */}
        {step === 2 && (
          <div>
            <h2 style={styles.title}>Passo 2 de 2: Escolha o Plano & Pagamento PIX</h2>

            {error && <div style={styles.errorBox}>{error}</div>}

            {/* Grid de Planos */}
            <div style={styles.planGrid}>
              {planos.map(p => (
                <div 
                  key={p.pla_id} 
                  onClick={() => setSelectedPlano(p.pla_id)}
                  style={{
                    ...styles.planCard,
                    ...(selectedPlano === p.pla_id ? styles.planCardSelected : {})
                  }}
                >
                  {p.pla_destaque === 1 && <span style={styles.destaqueTag}>Mais Popular</span>}
                  <div style={styles.planName}>{p.pla_nome}</div>
                  <div style={styles.planPrice}>
                    {p.pla_preco_mes === 0 ? 'Grátis' : `R$ ${p.pla_preco_mes.toFixed(2).replace('.', ',')}`}
                    <span style={{ fontSize: '11px', color: '#64748b' }}>/mês</span>
                  </div>
                  <div style={styles.planDesc}>{p.pla_descricao}</div>
                </div>
              ))}
            </div>

            {/* Gerador PIX Dinâmico com QR Code + Copia e Cola */}
            <div style={styles.pixBox}>
              <div style={styles.pixHeader}>
                <span>📱 Pague com PIX (QR Code & Copia e Cola)</span>
                <span style={{ fontSize: '13px', background: '#312e81', color: '#a5b4fc', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                  Total: R$ {(pixInfo?.valor || currentPlanoObj?.pla_preco_mes || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {loadingPix ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#a5b4fc' }}>🔄 Gerando QR Code PIX...</div>
              ) : pixInfo ? (
                <div style={styles.pixContentGrid}>
                  {/* QR Code Imagem */}
                  <div style={{ textAlign: 'center' }}>
                    <img src={pixInfo.qrCode} alt="QR Code PIX" style={styles.qrImage} />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Escaneie no App do seu Banco</div>
                  </div>

                  {/* Detalhes + Copia e Cola */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      <strong>Favorecido:</strong> {pixInfo.nomeRecebedor} ({pixInfo.cidadeRecebedor})
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      <strong>Chave PIX:</strong> <code>{pixInfo.chavePix}</code>
                    </div>

                    <label style={{ ...styles.label, marginTop: '4px' }}>Código PIX Copia e Cola:</label>
                    <textarea 
                      readOnly 
                      value={pixInfo.payload} 
                      rows={3}
                      style={styles.textareaPayload}
                      onClick={e => (e.target as HTMLTextAreaElement).select()}
                    />
                    <button type="button" onClick={copyPixPayload} style={styles.copyBtnLarge}>
                      {copied ? '✅ Código PIX Copiado!' : '📋 Copiar Código PIX (Copia e Cola)'}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Upload de Comprovante */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                <label style={{ ...styles.label, fontSize: '13px', color: '#f1f5f9' }}>
                  📄 Enviar Comprovante de Pagamento (Imagem / PDF) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                  <label htmlFor="fileUpload" style={styles.fileUploadBtn}>
                    📁 Escolher Arquivo do Comprovante
                  </label>
                  <span style={{ fontSize: '12px', color: comprovanteFileName ? '#34d399' : '#64748b' }}>
                    {comprovanteFileName ? `✅ ${comprovanteFileName}` : 'Nenhum arquivo selecionado'}
                  </span>
                </div>

                {comprovanteBase64 && comprovanteBase64.startsWith('data:image') && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={comprovanteBase64} alt="Preview Comprovante" style={styles.previewThumb} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
                ⬅️ Voltar
              </button>
              <button 
                type="button" 
                onClick={handleRegister} 
                style={{ ...styles.submitBtn, flex: 1, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : '🚀 Finalizar Cadastro & Enviar Comprovante'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMAÇÃO / PENDENTE */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '54px', marginBottom: '12px' }}>⏳</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 10px' }}>
              Comprovante Enviado com Sucesso!
            </h2>
            <div style={styles.infoAlert}>
              Sua conta no plano <strong>{currentPlanoObj?.pla_nome}</strong> está em análise.
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '16px 0' }}>
              Seu comprovante de pagamento via <strong>PIX</strong> foi enviado. O administrador analisará o comprovante no painel financeiro e <strong>liberará o seu acesso</strong> em breve.
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Notificação enviada para <strong>{form.email}</strong>!
            </p>

            <button onClick={onSwitchToLogin} style={{ ...styles.submitBtn, marginTop: '20px', width: '100%' }}>
              Ir para Tela de Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', padding: '24px' },
  card: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '36px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', transition: 'max-width 0.3s' },
  logoArea: { textAlign: 'center', marginBottom: '20px' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#a5b4fc', margin: '4px 0 0' },
  subText: { fontSize: '12px', color: '#64748b', margin: '4px 0 0' },
  title: { fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '16px' },
  errorBox: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' },
  input: { padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#f1f5f9', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: '12px', bottom: '11px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  submitBtn: { padding: '13px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: '700', fontSize: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  backBtn: { padding: '13px 18px', background: '#334155', color: '#e2e8f0', fontWeight: '600', fontSize: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  linkBtn: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' },
  switchText: { textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '14px' },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' },
  planCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' },
  planCardSelected: { border: '2px solid #6366f1', background: 'rgba(99,102,241,0.15)' },
  destaqueTag: { position: 'absolute', top: '-8px', right: '8px', background: '#4f46e5', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' },
  planName: { fontSize: '14px', fontWeight: '700', color: '#f1f5f9' },
  planPrice: { fontSize: '16px', fontWeight: '800', color: '#a5b4fc', margin: '4px 0' },
  planDesc: { fontSize: '11px', color: '#64748b', lineHeight: '1.3' },
  pixBox: { background: 'rgba(15,23,42,0.6)', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' },
  pixHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', color: '#f1f5f9', fontSize: '14px', marginBottom: '12px' },
  pixContentGrid: { display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' },
  qrImage: { width: '150px', height: '150px', borderRadius: '8px', background: '#fff', padding: '4px' },
  textareaPayload: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', borderRadius: '6px', color: '#a5b4fc', fontSize: '11px', fontFamily: 'monospace', padding: '8px', resize: 'none', boxSizing: 'border-box' },
  copyBtnLarge: { width: '100%', padding: '8px 14px', background: '#4f46e5', color: '#fff', fontWeight: '700', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  fileUploadBtn: { padding: '8px 14px', background: '#334155', color: '#e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  previewThumb: { maxHeight: '100px', borderRadius: '6px', border: '1px solid #4f46e5' },
  infoAlert: { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#a5b4fc', fontSize: '13px', margin: '12px 0' }
};
