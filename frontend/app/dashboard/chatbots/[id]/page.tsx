'use client';

import VoiceTab from '@/components/dashboard/VoiceTab';
import { Phone } from 'lucide-react';
import ConversationsTab from '@/components/dashboard/ConversationsTab';
import { History } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DeployTab from '@/components/dashboard/DeployTab';
import { Rocket } from 'lucide-react';
import {
  Bot,
  ArrowLeft,
  Database,
  MessageSquare,
  Settings,
  Upload,
  FileText,
  Trash2,
  Send,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Sparkles,
  FileUp,
  Type,
  Loader2,
} from 'lucide-react';
import {
  getChatbot,
  updateChatbot,
  getDataSources,
  uploadDataSourceFile,
  addTextDataSource,
  deleteDataSource,
  sendChatMessage,
} from '@/lib/api';


// ─── TYPES ──────────────────────────────────────────────

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  personality: string;
  status: string;
  api_key: string;
  widget_settings: Record<string, any> | null;
  voice_settings: Record<string, any> | null;
  allowed_domains: string[] | null;
  message_count: number;
  max_messages: number;
}

interface DataSourceItem {
  id: string;
  type: string;
  name: string;
  content_preview: string | null;
  chunk_count: number;
  character_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  sources?: { content: string; source_name: string; relevance_score: number }[];
}


// ═══════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ChatbotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatbotId = params.id as string;

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'chat' | 'conversations' | 'settings' | 'deploy' | 'voice'>('data');

  const fetchChatbot = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getChatbot(token, chatbotId);
      setChatbot(data);
    } catch {
      router.push('/dashboard/chatbots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbot();
  }, [chatbotId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!chatbot) return null;

 const tabs = [
  { key: 'data', label: 'Data Sources', icon: Database },
  { key: 'chat', label: 'Chat Playground', icon: MessageSquare },
  { key: 'conversations', label: 'Conversations', icon: History },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'deploy', label: 'Deploy', icon: Rocket },
  { key: 'voice', label: 'Voice AI', icon: Phone },
] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/chatbots"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Chatbots
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chatbot.name}</h1>
            <p className="text-sm text-gray-500">
              {chatbot.description || 'No description'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'data' && (
        <DataSourcesTab chatbotId={chatbotId} />
      )}
      {activeTab === 'chat' && (
        <ChatPlaygroundTab chatbot={chatbot} />
      )}
      {activeTab === 'settings' && (
        <SettingsTab chatbot={chatbot} onUpdate={fetchChatbot} />
      )}
      {activeTab === 'conversations' && (
        <ConversationsTab chatbotId={chatbotId} />
      )}
      {activeTab === 'deploy' && (
        <DeployTab chatbot={chatbot} onUpdate={fetchChatbot} />
      )}
      {activeTab === 'voice' && (
        <VoiceTab chatbot={chatbot} onUpdate={fetchChatbot} />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
//  DATA SOURCES TAB
// ═══════════════════════════════════════════════════════════

function DataSourcesTab({ chatbotId }: { chatbotId: string }) {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textForm, setTextForm] = useState({ name: '', content: '' });
  const [addingText, setAddingText] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getDataSources(token, chatbotId);
      setSources(data);
    } catch {
      console.error('Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [chatbotId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await uploadDataSourceFile(token, chatbotId, file);
      fetchSources();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingText(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await addTextDataSource(token, chatbotId, textForm);
      setShowTextModal(false);
      setTextForm({ name: '', content: '' });
      fetchSources();
    } catch (err: any) {
      setError(err.message || 'Failed to add text');
    } finally {
      setAddingText(false);
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Delete this data source? Its knowledge will be removed from the chatbot.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await deleteDataSource(token, chatbotId, sourceId);
      fetchSources();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Upload Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4" />
          )}
          {uploading ? 'Processing...' : 'Upload File'}
        </button>
        <button
          onClick={() => setShowTextModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Type className="w-4 h-4" />
          Paste Text
        </button>
        <span className="text-xs text-gray-400 ml-2">
          Supports PDF, DOCX, TXT, MD, CSV (max 10MB)
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Sources List */}
      {sources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No data sources yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Upload files or paste text to give your chatbot knowledge about your business.
            The bot can only answer questions from data you provide.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    source.status === 'ready'
                      ? 'bg-emerald-50'
                      : source.status === 'failed'
                      ? 'bg-red-50'
                      : 'bg-amber-50'
                  }`}
                >
                  {source.type === 'file' ? (
                    <FileText
                      className={`w-5 h-5 ${
                        source.status === 'ready'
                          ? 'text-emerald-600'
                          : source.status === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    />
                  ) : (
                    <Type
                      className={`w-5 h-5 ${
                        source.status === 'ready'
                          ? 'text-emerald-600'
                          : source.status === 'failed'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">{source.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        source.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700'
                          : source.status === 'failed'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {source.status === 'ready' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {source.status === 'failed' && <AlertCircle className="w-3 h-3 inline mr-1" />}
                      {source.status === 'processing' && <Clock className="w-3 h-3 inline mr-1" />}
                      {source.status}
                    </span>
                  </div>
                  {source.content_preview && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {source.content_preview}
                    </p>
                  )}
                  {source.error_message && (
                    <p className="text-sm text-red-500 mt-1">{source.error_message}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{source.chunk_count} chunks</span>
                    <span>{source.character_count.toLocaleString()} characters</span>
                    <span>{source.type === 'file' ? 'File upload' : 'Pasted text'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(source.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                title="Delete source"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Paste Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Text Data</h2>
              <button
                onClick={() => setShowTextModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddText} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={textForm.name}
                  onChange={(e) => setTextForm({ ...textForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="e.g., Restaurant Menu, FAQs, Business Hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  minLength={20}
                  value={textForm.content}
                  onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
                  rows={10}
                  placeholder="Paste your business information here — menu items, FAQs, policies, hours, delivery info, anything you want the chatbot to know..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  {textForm.content.length} characters (minimum 20)
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTextModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingText}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {addingText ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Add Data Source'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
//  CHAT PLAYGROUND TAB
// ═══════════════════════════════════════════════════════════

function ChatPlaygroundTab({ chatbot }: { chatbot: Chatbot }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a new session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // Add user message to UI immediately
    const userMsg: ChatMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await sendChatMessage(token, chatbot.id, {
        message: trimmed,
        session_id: sessionId,
      });

      // Add assistant message
      const assistantMsg: ChatMsg = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMsg = {
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Failed to get response'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
    setExpandedSources(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '600px' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{chatbot.name}</p>
            <p className="text-xs text-gray-400">Testing Playground</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="font-medium text-gray-700">Test your chatbot</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Ask any question about the data you&apos;ve uploaded. The bot will answer
              only from your knowledge base.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index}>
            <div
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>

            {/* Sources accordion */}
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div className="ml-2 mt-1">
                <button
                  onClick={() =>
                    setExpandedSources(expandedSources === index ? null : index)
                  }
                  className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  {msg.sources.length} source(s) used
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      expandedSources === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedSources === index && (
                  <div className="mt-2 space-y-2">
                    {msg.sources.map((source, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700">
                            {source.source_name}
                          </span>
                          <span className="text-gray-400">
                            {(source.relevance_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-gray-500 line-clamp-3">{source.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
//  SETTINGS TAB
// ═══════════════════════════════════════════════════════════

function SettingsTab({
  chatbot,
  onUpdate,
}: {
  chatbot: Chatbot;
  onUpdate: () => void;
}) {
  const [form, setForm] = useState({
    name: chatbot.name,
    description: chatbot.description || '',
    system_prompt: chatbot.system_prompt || '',
    personality: chatbot.personality,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await updateChatbot(token, chatbot.id, form);
      setSaved(true);
      onUpdate();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Chatbot Settings</h2>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chatbot Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            placeholder="What does this chatbot do?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personality
          </label>
          <select
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly & Casual</option>
            <option value="formal">Formal & Corporate</option>
            <option value="enthusiastic">Enthusiastic & Energetic</option>
            <option value="concise">Concise & Direct</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom System Prompt{' '}
            <span className="text-gray-400 font-normal">(optional — advanced)</span>
          </label>
          <textarea
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
            rows={5}
            placeholder="Add custom instructions for your bot. For example:&#10;- Always greet in Italian&#10;- Suggest today's special in every response&#10;- Never discuss competitor restaurants"
          />
          <p className="text-xs text-gray-400 mt-1">
            This is added to the built-in system prompt. Use it for business-specific rules.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Settings'
            )}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}