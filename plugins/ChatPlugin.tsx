import React, { useState, useRef, useEffect } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { useMapCapabilities } from '../core/MapCore';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, PluginContextProps } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const ChatPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const { visiblePois } = usePoiStore();
  const { flyTo } = useMapCapabilities();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Map Assistant. Ask me about the data currently visible on the map, or tell me to find something specific.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Prepare Context (Visible POIs)
      const contextStr = visiblePois.map(p => 
        `- ${p.name} (${p.category}): Lat ${p.lat.toFixed(4)}, Lng ${p.lng.toFixed(4)}, Value $${p.value}`
      ).join('\n');

      const systemPrompt = `
You are an AI assistant embedded in a map application.
Your goal is to help the user understand the data currently visible on their screen.

CURRENT VISIBLE DATA (${visiblePois.length} items):
${contextStr}

INSTRUCTIONS:
1. Answer the user's question based ONLY on the data provided above.
2. If the user asks for something not in the data, politely inform them it's not currently visible.
3. You can format your response using Markdown (bold, lists, etc.).
4. Keep your answers concise and helpful.
5. If the user asks to "find" or "go to" a specific place, and it exists in the data, provide its exact coordinates in this format: [LAT, LNG] at the very end of your message.
      `;

      // 2. Call Gemini API
      const response = await sendMessageToGemini(input, contextStr);
      const responseText = response.text;

      // 3. Parse Response for Actions (e.g., FlyTo)
      let finalContent = responseText;
      const coordMatch = responseText.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]$/);
      
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        flyTo([lng, lat], 16);
        // Remove the coordinates from the displayed message
        finalContent = responseText.replace(coordMatch[0], '').trim();
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check your API key and try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      
      {/* Header */}
      <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Map Assistant</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
            }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="markdown-body prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the map data..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-sm outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
            Context: {visiblePois.length} POIs visible
          </span>
        </div>
      </div>
    </div>
  );
};
