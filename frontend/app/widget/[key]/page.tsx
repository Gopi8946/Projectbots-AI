'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface WidgetConfig {
  bot_name: string;
  description: string;
  greeting_message: string;
  primary_color: string;
  position: string;
  bubble_text: string;
  show_branding: boolean;
  status: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function WidgetPage() {
  const params = useParams();
  const apiKey = params.key as string;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    loadConfig();
  }, [apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConfig() {
    setLoading(true);
    setError('');

    try {
      // Add timestamp to prevent any caching
      const res = await fetch(
        `${API_URL}/api/public/config/${apiKey}?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Chatbot not found');

      const data: WidgetConfig = await res.json();
      setConfig(data);

      if (data.greeting_message) {
        setMessages([{ role: 'assistant', content: data.greeting_message }]);
      }
    } catch {
      setError('Unable to load chatbot. Please check the API key.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/public/chat/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, session_id: sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Something went wrong' }));
        throw new Error(err.detail);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      setSessionId(data.session_id);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.message || 'Sorry, something went wrong.' },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClose() {
    window.parent.postMessage('projectbots-close', '*');
  }

  // ─── LOADING ────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── ERROR ──────────────────────────────────────────
  if (error || !config) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-700 font-medium">Chatbot Unavailable</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // ─── INACTIVE ───────────────────────────────────────
  if (config.status !== 'active') {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔧</p>
          <p className="text-gray-700 font-medium">Chatbot is being set up</p>
          <p className="text-sm text-gray-500 mt-1">Please check back soon!</p>
        </div>
      </div>
    );
  }

  // Use the color from config
  const primaryColor = config.primary_color;

  // ─── MAIN CHAT ──────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{config.bot_name}</p>
            <p className="text-[11px]" style={{ opacity: 0.8 }}>● Online</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Close chat"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <svg className="w-3.5 h-3.5" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'text-gray-800 rounded-tl-sm'
              }`}
              style={
                msg.role === 'user'
                  ? { backgroundColor: primaryColor }
                  : { backgroundColor: '#f3f4f6' }
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <svg className="w-3.5 h-3.5" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ backgroundColor: '#f3f4f6' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none disabled:opacity-50"
            style={{ boxShadow: input ? `0 0 0 2px ${primaryColor}40` : 'none' }}
            onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`)}
            onBlur={(e) => (e.target.style.boxShadow = 'none')}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {config.show_branding && (
          <div className="text-center mt-2">
            <a
              href="https://projectbots.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-gray-500 transition-colors"
            >
              Powered by <span className="font-medium">ProjectBots.AI</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}