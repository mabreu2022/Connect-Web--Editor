import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import type { BotFAQItem } from '../../types/editor';
import { Bot, Clock, PhoneCall, Plus, Trash2, X, Save, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BotConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { botConfig, updateBotConfig } = useEditor();

  const [qapPhone, setQapPhone] = useState(botConfig.qapPhone || '');
  const [startTime, setStartTime] = useState(botConfig.startTime || '08:00');
  const [endTime, setEndTime] = useState(botConfig.endTime || '18:00');
  const [outOfHoursMessage, setOutOfHoursMessage] = useState(
    botConfig.outOfHoursMessage || '🔴 Nosso atendimento ao vivo funciona de 08:00 às 18:00. Deixe sua mensagem!'
  );
  const [faqList, setFaqList] = useState<BotFAQItem[]>(botConfig.faqList || []);

  const [newKeywords, setNewKeywords] = useState('');
  const [newReply, setNewReply] = useState('');

  if (!isOpen) return null;

  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywords.trim() || !newReply.trim()) return;

    const keywordsArray = newKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const newItem: BotFAQItem = {
      id: 'faq_' + Math.random().toString(36).substring(2, 9),
      keywords: keywordsArray,
      reply: newReply.trim()
    };

    setFaqList([...faqList, newItem]);
    setNewKeywords('');
    setNewReply('');
  };

  const handleRemoveFAQ = (id: string) => {
    setFaqList(faqList.filter(f => f.id !== id));
  };

  const handleSave = () => {
    updateBotConfig({
      qapPhone: qapPhone.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      outOfHoursMessage: outOfHoursMessage.trim(),
      faqList
    });
    alert('✅ Configurações do Bot & QAP salvas com sucesso!');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} style={{ color: '#fff' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Configurações do Bot & QAP WhatsApp</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#c7d2fe' }}>Horário de atendimento, chamada de vídeo QAP e perguntas/respostas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* WhatsApp / QAP Number */}
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <PhoneCall size={18} style={{ color: '#10b981' }} />
              <strong style={{ fontSize: '14px' }}>Número do WhatsApp / QAP do Atendente</strong>
            </div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Número com código do país e DDD (ex: 5511999998888):
            </label>
            <input
              type="text"
              className="field-input"
              value={qapPhone}
              onChange={e => setQapPhone(e.target.value)}
              placeholder="ex: 5511999998888"
              style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            />
            <span style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '6px', display: 'block' }}>
              💡 Quando o usuário clicar para iniciar chamada de vídeo/atendimento, será direcionado para este QAP no WhatsApp.
            </span>
          </div>

          {/* Business Hours */}
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={18} style={{ color: '#6366f1' }} />
              <strong style={{ fontSize: '14px' }}>Horário de Atendimento do Bot & Equipe</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Hora Inicial (Abertura)</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Hora Final (Fechamento)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mensagem para Atendimento Fechado (Fora de Horário)</label>
              <textarea
                rows={2}
                value={outOfHoursMessage}
                onChange={e => setOutOfHoursMessage(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* FAQ / Bot Knowledge Rules */}
          <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={18} style={{ color: '#38bdf8' }} />
              <strong style={{ fontSize: '14px' }}>Regras de Perguntas & Respostas do Bot (FAQ)</strong>
            </div>

            {/* Add Rule Form */}
            <form onSubmit={handleAddFAQ} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Palavras-chave (separadas por vírgula):</label>
              <input
                type="text"
                placeholder="ex: preço, quanto custa, valor, planos"
                value={newKeywords}
                onChange={e => setNewKeywords(e.target.value)}
                style={{ padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
              />
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Resposta do Bot:</label>
              <textarea
                rows={2}
                placeholder="ex: Nossos planos custam a partir de R$ 149,90/mês com 5 dias grátis."
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                style={{ padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
              />
              <button
                type="submit"
                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Adicionar Pergunta
              </button>
            </form>

            {/* FAQ List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {faqList.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '8px 0' }}>Nenhuma regra cadastrada ainda.</p>
              ) : (
                faqList.map(item => (
                  <div key={item.id} style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                        🔑 Palavras: {item.keywords.join(', ')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                        💬 {item.reply}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFAQ(item.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#0f172a',
          borderRadius: '0 0 16px 16px'
        }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '8px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={16} /> Salvar Configurações
          </button>
        </div>

      </div>
    </div>
  );
};
