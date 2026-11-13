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
      // Endpoint dự phòng để nối API Chatbot AI trong tương lai:
      // const res = await api.post('/chat', { prompt: userText });
      // const botReply = res.data.reply;
      
      // Phản hồi mô phỏng thông minh dựa trên từ khóa:
      setTimeout(() => {
        let reply = "Tôi có thể giúp bạn tra cứu sách theo tiêu đề, tác giả, kiểm tra tình trạng bản sao và thời hạn mượn.";
        const lower = userText.toLowerCase();
        if (lower.includes('mượn') || lower.includes('hạn')) {
          reply = "Thời hạn mượn sách tiêu chuẩn là 14 ngày. Bạn có thể gia hạn hoặc đặt trước trực tiếp trên hệ thống!";
        } else if (lower.includes('sách') || lower.includes('tìm')) {
          reply = "Bạn có thể dùng thanh tìm kiếm ở trang chủ để tra cứu sách theo tên, tác giả, thể loại hoặc mã ISBN nhé.";
        } else if (lower.includes('blockchain') || lower.includes('hqc')) {
          reply = "Hệ thống đang tích hợp chuẩn lưu trữ bất biến qua Blockchain và mã hóa an toàn hậu lượng tử HQC!";
        }
        setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
        setLoading(false);
      }, 600);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Có lỗi xảy ra khi kết nối máy chủ AI.' }]);
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
