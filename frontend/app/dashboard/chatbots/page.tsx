'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  MoreVertical,
  Trash2,
  Settings,
  ExternalLink,
  MessageSquare,
  Copy,
  X,
} from 'lucide-react';
import { getChatbots, createChatbot, deleteChatbot } from '@/lib/api';

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  personality: string;
  status: string;
  api_key: string;
  message_count: number;
  max_messages: number;
  created_at: string;
}

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    personality: 'professional',
  });

  const fetchChatbots = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getChatbots(token);
      setChatbots(data);
    } catch (err) {
      console.error('Failed to fetch chatbots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await createChatbot(token, newBot);
      setShowCreateModal(false);
      setNewBot({ name: '', description: '', personality: 'professional' });
      fetchChatbots();
    } catch (err: any) {
      setError(err.message || 'Failed to create chatbot');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (chatbotId: string) => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await deleteChatbot(token, chatbotId);
      fetchChatbots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete chatbot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Chatbots</h1>
          <p className="mt-1 text-gray-500">
            Create and manage your AI chatbots
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Chatbot
        </button>
      </div>

      {/* Chatbot List or Empty State */}
      {chatbots.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No chatbots yet
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Create your first AI chatbot to start automating customer
            conversations. It only takes a few minutes.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Your First Chatbot
          </button>
        </div>
      ) : (
        /* Chatbot Cards Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      bot.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : bot.status === 'draft'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {bot.status}
                  </span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg">{bot.name}</h3>
              {bot.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {bot.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {bot.message_count} / {bot.max_messages} messages
                </span>
              </div>

              {/* API Key */}
              <div className="mt-4 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                <code className="text-xs text-gray-500 truncate max-w-45">
                  {bot.api_key}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bot.api_key);
                    alert('API key copied!');
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copy API Key"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {/* Actions */}
                <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Link
                      href={`/dashboard/chatbots/${bot.id}`}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure
                  </Link>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
            </div>
          ))}

          {/* Add New Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all min-h-62.5"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Add Chatbot</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Chatbot
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chatbot Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="e.g., Mario's Pizzeria Bot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={newBot.description}
                  onChange={(e) =>
                    setNewBot({ ...newBot, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
                  rows={3}
                  placeholder="What will this chatbot do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personality
                </label>
                <select
                  value={newBot.personality}
                  onChange={(e) =>
                    setNewBot({ ...newBot, personality: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly & Casual</option>
                  <option value="formal">Formal & Corporate</option>
                  <option value="enthusiastic">Enthusiastic & Energetic</option>
                  <option value="concise">Concise & Direct</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Create Chatbot'
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