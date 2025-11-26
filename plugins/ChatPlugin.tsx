import React, { useState, useRef, useEffect } from 'react';
import { PluginContextProps, ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, Loader2, MapPin, ExternalLink } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { useStore } from '../store';

const ChatPlugin: React.FC<PluginContextProps> = ({ config }) => {
  const { visiblePois } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hello! I am your GeoInsight assistant. I can analyze map data and look up real-world places using Google Maps.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get User Location on Mount
  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            (err) => {
                console.warn("Geolocation permission denied or failed", err);
            }
        );
    }
  }, []);

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
      Currently visible BI Data Points: ${visiblePois.length}.
      Categories present in BI Data: ${Array.from(new Set(visiblePois.map(p => p.category))).join(', ')}.
      Top 5 high value BI locations: ${visiblePois.sort((a,b) => b.value - a.value).slice(0,5).map(p => `${p.name} (${p.value})`).join(', ')}.
    `;

    const response = await sendMessageToGemini(input, contextSummary, userLocation);
    
    const botMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'model', 
      text: response.text,
      groundingChunks: response.groundingChunks,
      isThinking: false 
    };
    
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-transparent overflow-hidden">
      {/* Updated Header with Primary Blue */}
      <div className="bg-blue-600 dark:bg-blue-900/80 p-4 flex items-center gap-2 text-white shrink-0">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
           <h3 className="font-semibold text-sm leading-tight">AI Assistant</h3>
           <p className="text-[10px] text-blue-100 opacity-90">Maps Grounding Enabled</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {msg.role === 'model' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] flex flex-col items-start gap-1`}>
                <div className={`rounded-2xl p-3 text-sm shadow-sm ${
                msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}>
                    {msg.text}
                </div>

                {/* Grounding Sources (Google Maps) */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 w-full shadow-sm">
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Sources
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {msg.groundingChunks.map((chunk, i) => {
                                if (chunk.maps) {
                                    return (
                                        <a 
                                            key={i} 
                                            href={chunk.maps.uri} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded transition-colors group"
                                        >
                                            <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline truncate">{chunk.maps.title}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">Finding answer...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-slate-100 dark:bg-slate-900/50 border-0 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="Ask about places or data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPlugin;