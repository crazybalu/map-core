import React, { useState, useRef, useEffect } from 'react';
import { PluginContextProps, ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { useStore } from '../store';

const ChatPlugin: React.FC<PluginContextProps> = ({ config }) => {
  const { visiblePois } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hello! I am your GeoInsight assistant. Ask me about the map data or any location-based questions.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const contextSummary = `
      Currently visible POIs: ${visiblePois.length}.
      Categories present: ${Array.from(new Set(visiblePois.map(p => p.category))).join(', ')}.
      Top 5 high value locations: ${visiblePois.sort((a,b) => b.value - a.value).slice(0,5).map(p => `${p.name} (${p.value})`).join(', ')}.
    `;

    const responseText = await sendMessageToGemini(input, contextSummary);
    
    const botMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'model', 
      text: responseText,
      isThinking: false 
    };
    
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <div className="bg-indigo-600 p-4 flex items-center gap-2 text-white shrink-0">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
           <h3 className="font-semibold text-sm leading-tight">AI Assistant</h3>
           <p className="text-[10px] text-indigo-200">Powered by Gemini 3 Pro</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'model' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
            }`}>
               {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
              <span className="text-xs text-slate-500 italic">Thinking deeply...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-slate-100 border-0 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            placeholder="Ask about the map data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPlugin;
