import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  X, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  Code,
  Image as ImageIcon
} from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin, token } = useAuth();
  const { 
    storeComponents, 
    loadStoreComponents, 
    addStoreComponentNode, 
    nodes,
    selectedId 
  } = useEditor();

  const [activeTab, setActiveTab] = useState<'store' | 'admin'>('store');
  const [selectedCompForCheckout, setSelectedCompForCheckout] = useState<any | null>(null);
  const [comprovanteBase64, setComprovanteBase64] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estados do Pix Dinâmico
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [loadingPix, setLoadingPix] = useState(false);

  // Form de cadastro de novo componente (Admin)
  const [newCompTitle, setNewCompTitle] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompCategory, setNewCompCategory] = useState('sections');
  const [newCompPrice, setNewCompPrice] = useState('19.90');
  const [newCompThumb, setNewCompThumb] = useState('');
  const [newCompPayload, setNewCompPayload] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Fábrica de Componentes por IA (Gemini, OpenAI, Groq, Ollama)
  const [aiDescription, setAiDescription] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'groq' | 'ollama'>('gemini');
  const [aiModel, setAiModel] = useState('');
  const [aiOllamaUrl, setAiOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const fetchOllamaModels = async (url: string) => {
    try {
      const response = await fetch(`${url}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name);
          setOllamaModels(names);
          if (names.length > 0) {
            setAiModel(prev => names.includes(prev) ? prev : names[0]);
          }
        } else {
          setOllamaModels([]);
        }
      } else {
        setOllamaModels([]);
      }
    } catch (e) {
      console.warn('Erro ao listar modelos do Ollama:', e);
      setOllamaModels([]);
    }
  };

  useEffect(() => {
    const savedProvider = localStorage.getItem('cwe_ai_provider');
    const savedApiKey = localStorage.getItem('cwe_ai_api_key');
    const savedModel = localStorage.getItem('cwe_ai_model');
    const savedOllamaUrl = localStorage.getItem('cwe_ai_ollama_url');

    if (savedProvider) setAiProvider(savedProvider as any);
    if (savedApiKey) setAiApiKey(savedApiKey);
    if (savedModel) setAiModel(savedModel);
    if (savedOllamaUrl) {
      setAiOllamaUrl(savedOllamaUrl);
      if (savedProvider === 'ollama') {
        fetchOllamaModels(savedOllamaUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (aiProvider === 'ollama') {
      fetchOllamaModels(aiOllamaUrl);
    }
  }, [aiProvider, aiOllamaUrl]);

  useEffect(() => {
    if (isOpen && token) {
      loadStoreComponents();
      if (isAdmin) {
        loadAdminOrders();
      }
    }
  }, [isOpen, token, isAdmin]);

  const loadAdminOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_URL}/store/admin/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error('Erro ao carregar pedidos admin:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadPixPaymentInfo = async (compId: number) => {
    setLoadingPix(true);
    try {
      const res = await axios.get(`${API_URL}/store/components/${compId}/payment`);
      setPixCopiaCola(res.data.pixCopiaCola || '');
      setPixQrCodeBase64(res.data.qrCodeBase64 || '');
    } catch (err) {
      console.error('Erro ao carregar dados do Pix:', err);
      alert('Erro ao carregar dados do Pix para pagamento. Tente novamente.');
      setSelectedCompForCheckout(null);
    } finally {
      setLoadingPix(false);
    }
  };

  useEffect(() => {
    if (selectedCompForCheckout) {
      loadPixPaymentInfo(selectedCompForCheckout.id);
    } else {
      setPixCopiaCola('');
      setPixQrCodeBase64('');
    }
  }, [selectedCompForCheckout]);

  const handleComprovanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setComprovanteBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedCompForCheckout || !comprovanteBase64) {
      alert('Selecione um comprovante de pagamento Pix.');
      return;
    }
    setCheckoutLoading(true);
    try {
      await axios.post(`${API_URL}/store/checkout`, {
        componentId: selectedCompForCheckout.id,
        comprovante: comprovanteBase64
      });
      alert('Pedido enviado com sucesso! O administrador revisará o Pix e o componente será desbloqueado.');
      setSelectedCompForCheckout(null);
      setComprovanteBase64('');
      loadStoreComponents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao realizar checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    if (!window.confirm('Deseja realmente APROVAR este pagamento? O componente será liberado instantaneamente para o cliente.')) return;
    try {
      await axios.post(`${API_URL}/store/admin/orders/${orderId}/approve`);
      alert('Pedido aprovado com sucesso!');
      loadAdminOrders();
      loadStoreComponents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao aprovar pedido.');
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    if (!window.confirm('Deseja realmente REJEITAR este comprovante?')) return;
    try {
      await axios.post(`${API_URL}/store/admin/orders/${orderId}/reject`);
      alert('Pedido rejeitado.');
      loadAdminOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao rejeitar pedido.');
    }
  };

  // Preenche payload a partir do componente selecionado no editor
  const handlePopulateFromSelectedNode = () => {
    if (!selectedId) {
      alert('Selecione primeiro um componente no Canvas do Editor para capturar sua estrutura!');
      return;
    }

    let targetNode: any = null;
    function findNode(list: any[]) {
      for (const n of list) {
        if (n.id === selectedId) {
          targetNode = n;
          return;
        }
        if (n.children) findNode(n.children);
      }
    }
    findNode(nodes);

    if (targetNode) {
      setNewCompTitle(targetNode.label || '');
      setNewCompDesc(`Componente nativo do tipo ${targetNode.tagName || 'bloco'}`);
      setNewCompPayload(JSON.stringify(targetNode, null, 2));
      alert(`Estrutura do componente <${targetNode.tagName}> capturada com sucesso!`);
    } else {
      alert('Componente selecionado não encontrado na estrutura da página atual.');
    }
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompTitle || !newCompPayload) {
      alert('Título e estrutura JSON do componente são obrigatórios.');
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(newCompPayload);
    } catch (e) {
      alert('Estrutura JSON inválida. Certifique-se de que é um objeto JSON válido.');
      return;
    }

    setAdminActionLoading(true);
    try {
      await axios.post(`${API_URL}/store/admin/components`, {
        title: newCompTitle,
        description: newCompDesc,
        category: newCompCategory,
        price: parseFloat(newCompPrice),
        thumbnail_url: newCompThumb || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300',
        component_payload: parsedPayload
      });
      alert('Novo componente cadastrado e disponível na Loja com sucesso!');
      setNewCompTitle('');
      setNewCompDesc('');
      setNewCompPayload('');
      setNewCompThumb('');
      loadStoreComponents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cadastrar componente.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleGenerateWithIA = async () => {
    if (!aiDescription.trim()) {
      alert('Por favor, descreva o componente que deseja criar!');
      return;
    }
    setAiLoading(true);

    // Salva preferências no navegador
    localStorage.setItem('cwe_ai_provider', aiProvider);
    localStorage.setItem('cwe_ai_api_key', aiApiKey);
    localStorage.setItem('cwe_ai_model', aiModel);
    localStorage.setItem('cwe_ai_ollama_url', aiOllamaUrl);

    try {
      let resultData: any = null;

      if (aiProvider === 'ollama') {
        const systemPrompt = `Você é um arquiteto especialista em front-end e web design premium. Sua tarefa é ler a descrição de um componente web em formato livre ou markdown e gerar a estrutura JSON completa compatível com o Connect Web Editor.

O JSON retornado DEVE seguir estritamente o formato de objeto abaixo:
{
  "title": "Título comercial do componente",
  "description": "Descrição comercial curta contendo as principais características",
  "category": "sections" | "forms" | "ui" | "templates",
  "price": 19.90,
  "thumbnail_url": "uma URL de imagem do unsplash relacionada ao componente",
  "component_payload": {
    "id": "el_root",
    "type": "container" | "section" | "heading" | "paragraph" | "image" | "link" | "button" | "form" | "grid-2" | "grid-3" | "card",
    "tagName": "div" | "section" | "h1" | "h2" | "p" | "img" | "a" | "button" | "form",
    "label": "Nome amigável do nó",
    "content": "Conteúdo de texto se aplicável (ex: título, parágrafo, texto do botão)",
    "attributes": {},
    "styles": {
      "display": "flex",
      "flexDirection": "column",
      "padding": "24px",
      "backgroundColor": "#1e293b",
      "color": "#ffffff",
      "fontFamily": "sans-serif",
      "borderRadius": "8px"
    },
    "children": []
  }
}

Regras obrigatórias:
1. O nó raiz (component_payload) DEVE ter id "el_root".
2. Todos os nós filhos (children) recursivos devem ter IDs no formato "el_xxxxxxx" onde xxxxxxx é um código alfanumérico aleatório de 7 caracteres.
3. Use estilos CSS inline bonitos (cores modernas, sombras shadow, bordas suaves, layouts flex/grid limpos) em camelCase (ex: backgroundColor, borderRadius, justifyContent, alignItems, flexWrap, gap, minHeight, maxWidth, transition, boxShadow).
4. Crie estruturas complexas, organizadas e visualmente ricas com containers, headings, parágrafos, botões e imagens adequados.
5. Retorne APENAS o JSON puro, sem comentários ou blocos de código markdown.

Descrição do usuário: "${aiDescription}"`;

        const response = await fetch(`${aiOllamaUrl || 'http://localhost:11434'}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: aiModel || 'llama3',
            messages: [{ role: 'user', content: systemPrompt }],
            stream: false,
            format: 'json'
          })
        });

        if (!response.ok) {
          throw new Error(`Erro na conexão com o Ollama local: status ${response.status}. Certifique-se de que o Ollama está rodando e com CORS habilitado (OLLAMA_ORIGINS=*).`);
        }

        const data = await response.json();
        const contentText = data.message?.content;
        if (!contentText) {
          throw new Error('Nenhum conteúdo retornado pelo Ollama local.');
        }
        resultData = JSON.parse(contentText.trim());
      } else {
        const res = await axios.post(`${API_URL}/store/admin/generate-component`, {
          description: aiDescription,
          provider: aiProvider,
          apiKey: aiApiKey || undefined,
          model: aiModel || undefined
        });
        resultData = res.data;
      }

      if (resultData) {
        setNewCompTitle(resultData.title || '');
        setNewCompDesc(resultData.description || '');
        if (resultData.category) setNewCompCategory(resultData.category);
        if (resultData.price) setNewCompPrice(String(resultData.price));
        if (resultData.thumbnail_url) setNewCompThumb(resultData.thumbnail_url);
        if (resultData.component_payload) {
          setNewCompPayload(JSON.stringify(resultData.component_payload, null, 2));
        }
        alert('✨ Estrutura gerada com sucesso pela IA e preenchida no formulário!');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar componente com a IA.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflowY: 'auto',
      padding: '30px 20px',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-main, #1e293b)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1000px',
        height: '85vh',
        maxHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-darker, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} style={{ color: '#fb7185' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Loja de Componentes Nativos</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs (Admin e Loja) */}
        {isAdmin && (
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-darker, #0f172a)',
            padding: '4px 24px',
            borderBottom: '1px solid var(--border-color, #334155)',
            gap: '12px'
          }}>
            <button
              onClick={() => setActiveTab('store')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'store' ? '#fb7185' : '#94a3b8',
                fontWeight: 600,
                borderBottom: activeTab === 'store' ? '2px solid #fb7185' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              🛍️ Vitrine da Loja
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'admin' ? '#fb7185' : '#94a3b8',
                fontWeight: 600,
                borderBottom: activeTab === 'admin' ? '2px solid #fb7185' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              ⚙️ Painel de Controle (Admin)
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {activeTab === 'store' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Seção Checkout Pix Exposta se houver componente selecionado */}
              {selectedCompForCheckout && (
                <div style={{
                  background: 'rgba(251, 113, 133, 0.08)',
                  border: '2px solid #fb7185',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '24px',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }}>
                    {/* QR Code PIX Dinâmico */}
                    {loadingPix ? (
                      <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                        Carregando...
                      </div>
                    ) : pixQrCodeBase64 ? (
                      <img src={pixQrCodeBase64} alt="QR Code Pix" style={{ width: '130px', height: '130px', display: 'block' }} />
                    ) : (
                      <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '11px', textAlign: 'center' }}>
                        Falha ao gerar QR Code
                      </div>
                    )}
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>Escaneie o QR Code</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', color: '#fb7185' }}>Pagamento via Pix (R$ {selectedCompForCheckout.price.toFixed(2)})</h4>
                      <p style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#cbd5e1' }}>
                        Para adquirir o componente <strong>{selectedCompForCheckout.title}</strong>, faça o Pix na chave abaixo e envie o comprovante de pagamento:
                      </p>
                      
                      {/* Chave Pix Dinâmica (Copia e Cola) */}
                      <div style={{
                        backgroundColor: 'var(--bg-darker, #0f172a)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, #334155)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                        overflow: 'hidden'
                      }}>
                        <span style={{ wordBreak: 'break-all', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', marginRight: '10px', color: '#a5b4fc', flex: 1 }}>
                          {loadingPix ? 'Calculando...' : pixCopiaCola || 'Chave indisponível'}
                        </span>
                        {pixCopiaCola && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(pixCopiaCola);
                              alert('Código Pix Copia e Cola copiado para a área de transferência!');
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#fb7185',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Copiar
                          </button>
                        )}
                      </div>

                      {/* File Upload */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Comprovante Pix (.PNG / .JPG)</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleComprovanteChange}
                            style={{ fontSize: '12px', color: '#94a3b8' }}
                          />
                          {comprovanteBase64 && <span style={{ fontSize: '12px', color: '#10b981' }}>✔️ Carregado</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={handleCheckoutSubmit}
                        disabled={checkoutLoading || !comprovanteBase64 || loadingPix}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: checkoutLoading || !comprovanteBase64 || loadingPix ? 0.6 : 1
                        }}
                      >
                        {checkoutLoading ? 'Enviando...' : 'Confirmar Envio'}
                      </button>
                      <button
                        onClick={() => setSelectedCompForCheckout(null)}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#475569',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bento Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {storeComponents.map((comp: any) => (
                  <div 
                    key={comp.id}
                    style={{
                      background: 'var(--bg-darker, #0f172a)',
                      borderRadius: '12px',
                      border: comp.adquirido ? '2px solid #10b981' : '1px solid var(--border-color, #334155)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}
                  >
                    {/* Badge */}
                    {comp.adquirido && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 10
                      }}>
                        LIFETIME ATIVO
                      </span>
                    )}

                    {/* Image */}
                    <div style={{ height: '140px', overflow: 'hidden', backgroundColor: '#1e293b', position: 'relative' }}>
                      {comp.thumbnail_url ? (
                        <img 
                          src={comp.thumbnail_url} 
                          alt={comp.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                          <ImageIcon size={40} />
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#fff' }}>{comp.title}</h4>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5', height: '54px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {comp.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Preço do Componente</span>
                          <strong style={{ fontSize: '16px', color: '#fb7185' }}>R$ {comp.price.toFixed(2)}</strong>
                        </div>

                        {comp.adquirido ? (
                          <button
                            onClick={() => {
                              addStoreComponentNode(comp.id);
                              alert(`Componente "${comp.title}" injetado no canvas!`);
                              onClose();
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            ⚡ Usar
                          </button>
                        ) : comp.pendente ? (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#fbbf24',
                            fontWeight: 600
                          }}>
                            <Clock size={12} /> Pendente
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedCompForCheckout(comp)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#fb7185',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            🛒 Comprar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
              
              {/* Coluna 1: Aprovação de Pedidos */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>🔍 Aprovação de Pedidos Pix</h4>
                {loadingOrders ? (
                  <p style={{ color: '#cbd5e1' }}>Carregando pedidos pendentes...</p>
                ) : orders.filter(o => o.status === 'pending').length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: '#0f172a', borderRadius: '8px', border: '1px dashed #334155' }}>
                    <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Nenhum Pix pendente de aprovação no momento.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.filter(o => o.status === 'pending').map((ord: any) => (
                      <div 
                        key={ord.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '8px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>Cliente: <strong>{ord.usuario.nome}</strong> ({ord.usuario.email})</span>
                          <span style={{ color: '#94a3b8' }}>{new Date(ord.criado).toLocaleString()}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                          <span>Componente: <strong>{ord.componente.title}</strong></span>
                          <strong style={{ color: '#fb7185' }}>R$ {ord.componente.price.toFixed(2)}</strong>
                        </div>

                        {ord.comprovante && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>📸 Comprovante Pix Enviado:</span>
                            <img 
                              src={ord.comprovante} 
                              alt="Comprovante Pix"
                              style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #334155' }}
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={() => handleApproveOrder(ord.id)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            ✔️ Aprovar Pix
                          </button>
                          <button
                            onClick={() => handleRejectOrder(ord.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '12px'
                            }}
                          >
                            ❌ Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna 2: Formulário de Adicionar Componente (Admin) */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>➕ Cadastrar Componente para Venda</h4>
                
                <form onSubmit={handleCreateComponent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Botão de capturar do canvas */}
                  <button
                    type="button"
                    onClick={handlePopulateFromSelectedNode}
                    style={{
                      padding: '8px',
                      backgroundColor: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <Code size={14} /> Usar Selecionado no Canvas
                  </button>

                  {/* Fábrica por IA */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#fb7185', fontWeight: 600 }}>🤖 Fábrica de Componentes por IA</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="field-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Provedor IA</label>
                        <select 
                          className="field-input" 
                          value={aiProvider} 
                          onChange={e => setAiProvider(e.target.value as any)}
                          style={{ color: '#f8fafc', backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: '11px', height: '30px', padding: '0 8px', borderRadius: '4px' }}
                        >
                          <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="gemini">Google Gemini</option>
                          <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="openai">OpenAI</option>
                          <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="groq">Groq</option>
                          <option style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value="ollama">Ollama Local</option>
                        </select>
                      </div>
                      <div className="field-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8' }}>Modelo {aiProvider === 'ollama' && ollamaModels.length > 0 ? '' : '(Opcional)'}</label>
                        {aiProvider === 'ollama' && ollamaModels.length > 0 ? (
                          <select
                            className="field-input"
                            value={aiModel}
                            onChange={e => setAiModel(e.target.value)}
                            style={{ color: '#f8fafc', backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: '11px', height: '30px', padding: '0 8px', borderRadius: '4px' }}
                          >
                            {ollamaModels.map(m => (
                              <option key={m} style={{ color: '#f8fafc', backgroundColor: '#1e293b' }} value={m}>{m}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            className="field-input" 
                            placeholder={aiProvider === 'gemini' ? 'gemini-1.5-flash' : aiProvider === 'openai' ? 'gpt-4o-mini' : aiProvider === 'groq' ? 'llama-3.1-70b-versatile' : 'llama3'} 
                            value={aiModel} 
                            onChange={e => setAiModel(e.target.value)}
                            style={{ fontSize: '11px', height: '30px' }}
                          />
                        )}
                      </div>
                    </div>

                    <textarea
                      className="field-input"
                      rows={3}
                      placeholder="Descreva o que quer gerar. Ex: Seção de contato com mapa e formulário em fundo azul marinho"
                      value={aiDescription}
                      onChange={e => setAiDescription(e.target.value)}
                      style={{ fontSize: '11px', margin: 0 }}
                    />
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {aiProvider === 'ollama' ? (
                        <input
                          type="text"
                          className="field-input"
                          placeholder="http://localhost:11434"
                          value={aiOllamaUrl}
                          onChange={e => setAiOllamaUrl(e.target.value)}
                          style={{ fontSize: '11px', flex: 1, height: '30px', margin: 0 }}
                        />
                      ) : (
                        <input
                          type="password"
                          className="field-input"
                          placeholder="Chave API (opcional se no .env)"
                          value={aiApiKey}
                          onChange={e => setAiApiKey(e.target.value)}
                          style={{ fontSize: '11px', flex: 1, height: '30px', margin: 0 }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleGenerateWithIA}
                        disabled={aiLoading}
                        style={{
                          height: '30px',
                          padding: '0 12px',
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '11px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {aiLoading ? 'Gerando...' : 'Gerar IA'}
                      </button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Título do Componente</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      placeholder="Ex: Tabela de Preços Glassmorphism" 
                      value={newCompTitle}
                      onChange={e => setNewCompTitle(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Descrição / Detalhes</label>
                    <textarea 
                      className="field-input" 
                      rows={2} 
                      placeholder="Breve descrição dos recursos..." 
                      value={newCompDesc}
                      onChange={e => setNewCompDesc(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="field-group">
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Categoria</label>
                      <select 
                        className="field-input" 
                        value={newCompCategory}
                        onChange={e => setNewCompCategory(e.target.value)}
                        style={{ color: '#fff', backgroundColor: '#0f172a' }}
                      >
                        <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="sections">Seções (Sections)</option>
                        <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="forms">Formulários</option>
                        <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="ui">Componentes UI</option>
                        <option style={{ color: '#0f172a', backgroundColor: '#fff' }} value="templates">Templates</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Preço (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="field-input" 
                        placeholder="19.90" 
                        value={newCompPrice}
                        onChange={e => setNewCompPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>URL da Imagem Thumbnail (Previsualização)</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      placeholder="https://images.unsplash.com/..." 
                      value={newCompThumb}
                      onChange={e => setNewCompThumb(e.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Estrutura do Componente (Payload JSON)</label>
                    <textarea 
                      className="field-input" 
                      rows={6} 
                      placeholder='{ "type": "section", "tagName": "section", "children": [...] }'
                      value={newCompPayload}
                      onChange={e => setNewCompPayload(e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: '11px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminActionLoading}
                    style={{
                      padding: '10px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    {adminActionLoading ? 'Cadastrando...' : '🚀 Disponibilizar na Loja'}
                  </button>

                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
