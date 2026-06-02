'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Trash2,
  ChevronDown,
  Download,
  User,
  Bot,
  Loader2,
  Search,
} from 'lucide-react';
import {
  getConversations,
  getConversationDetail,
  deleteConversation,
  exportConversationsCSV,
} from '@/lib/api';

interface ConversationItem {
  id: string;
  session_id: string;
  message_count: number;
  first_user_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface MessageItem {
  id: string;
  role: string;
  content: string;
  sources: any;
  created_at: string;
}

interface Props {
  chatbotId: string;
}

export default function ConversationsTab({ chatbotId }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getConversations(token, chatbotId);
      setConversations(data);
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [chatbotId]);

  const handleExpand = async (convId: string) => {
    if (expandedId === convId) {
      setExpandedId(null);
      setExpandedMessages([]);
      return;
    }

    setExpandedId(convId);
    setLoadingMessages(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const detail = await getConversationDetail(token, chatbotId, convId);
      setExpandedMessages(detail.messages);
    } catch {
      setExpandedMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDelete = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await deleteConversation(token, chatbotId, convId);
      if (expandedId === convId) {
        setExpandedId(null);
        setExpandedMessages([]);
      }
      fetchConversations();
    } catch {
      alert('Failed to delete conversation');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await exportConversationsCSV(token, chatbotId);
    } catch {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filtered = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.first_user_message?.toLowerCase().includes(q) || false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
        {conversations.length > 0 && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        )}
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      )}

      {/* Empty State */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No conversations yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Conversations will appear here when customers start chatting
            with your bot through the widget.
          </p>
        </div>
      ) : (
        /* Conversation List */
        <div className="space-y-2">
          {filtered.map((conv) => (
            <div key={conv.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Conversation Header — Clickable */}
              <button
                onClick={() => handleExpand(conv.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.first_user_message || 'No message preview'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>{conv.message_count} messages</span>
                      <span>•</span>
                      <span>{formatDate(conv.last_message_at || conv.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedId === conv.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Messages */}
              {expandedId === conv.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {expandedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                              <Bot className="w-3 h-3 text-indigo-600" />
                            </div>
                          )}
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center ml-2 mt-1 shrink-0">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && searchQuery && (
            <p className="text-center text-gray-400 text-sm py-8">
              No conversations match &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}