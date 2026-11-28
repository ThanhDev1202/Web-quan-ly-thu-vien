import React, { useState } from 'react';
import api from '../api/api';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI Thư viện. Bạn cần tìm sách gì hay có thắc mắc gì về quy định mượn trả không?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/rag/chat', { prompt: userText });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply || 'Tôi chưa có câu trả lời phù hợp.' }]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Có lỗi xảy ra khi kết nối máy chủ AI.';
      setMessages(prev => [...prev, { sender: 'bot', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="ai-chat-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Trò chuyện cùng AI Thư viện"
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-sparkles"></i>
              <span>AI Library Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="chat-msg bot"><i>Đang suy nghĩ...</i></div>}
          </div>

          <form onSubmit={handleSend} className="chat-input-bar">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập câu hỏi cho AI..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
