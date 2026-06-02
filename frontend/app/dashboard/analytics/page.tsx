'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  MessageSquare,
  Users,
  TrendingUp,
  Bot,
  ChevronDown,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { getChatbots, getChatbotAnalytics } from '@/lib/api';

interface ChatbotItem {
  id: string;
  name: string;
  status: string;
  message_count: number;
  max_messages: number;
}

interface Analytics {
  total_conversations: number;
  total_messages: number;
  user_messages: number;
  bot_messages: number;
  avg_messages_per_conversation: number;
  messages_per_day: { date: string; count: number }[];
  hourly_distribution: { hour: number; label: string; count: number }[];
  top_questions: string[];
  recent_conversations: any[];
}

export default function AnalyticsPage() {
  const [chatbots, setChatbots] = useState<ChatbotItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch chatbots on mount
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const data = await getChatbots(token);
        setChatbots(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchBots();
  }, []);

  // Fetch analytics when chatbot changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const data = await getChatbotAnalytics(token, selectedId);
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [selectedId]);

  const selectedBot = chatbots.find((b) => b.id === selectedId);

  // Format date labels for chart
  const chartData = (analytics?.messages_per_day || []).map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-6">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No chatbots yet</h3>
          <p className="text-gray-500 mt-1">Create a chatbot first to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your chatbot performance and usage</p>
        </div>

        {/* Chatbot Selector */}
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
          >
            {chatbots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loadingAnalytics ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Conversations',
                value: analytics.total_conversations,
                icon: Users,
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                label: 'Total Messages',
                value: analytics.total_messages,
                icon: MessageSquare,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Avg Messages / Chat',
                value: analytics.avg_messages_per_conversation,
                icon: TrendingUp,
                color: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Usage',
                value: `${selectedBot?.message_count || 0} / ${selectedBot?.max_messages || 0}`,
                icon: BarChart3,
                color: 'bg-purple-50 text-purple-600',
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Messages Per Day Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Messages Per Day (Last 30 Days)</h3>
            {analytics.total_messages > 0 ? (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      interval={Math.floor(chartData.length / 7)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name="Messages"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart3 className="w-8 h-8 mb-2" />
                <p className="text-sm">No message data yet</p>
              </div>
            )}
          </div>

          {/* Bottom Row: Hourly + Top Questions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Peak Hours</h3>
              {analytics.total_messages > 0 ? (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.hourly_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        interval={2}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#818cf8"
                        radius={[4, 4, 0, 0]}
                        name="Messages"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <BarChart3 className="w-8 h-8 mb-2" />
                  <p className="text-sm">No data yet</p>
                </div>
              )}
            </div>

            {/* Top Questions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">Top Questions</h3>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              {analytics.top_questions.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analytics.top_questions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <p className="text-sm">No questions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Split */}
          {analytics.total_messages > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Message Breakdown</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Customer Messages</span>
                    <span className="font-medium text-gray-900">{analytics.user_messages}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-indigo-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.round((analytics.user_messages / Math.max(analytics.total_messages, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-600">Bot Responses</span>
                    <span className="font-medium text-gray-900">{analytics.bot_messages}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.round((analytics.bot_messages / Math.max(analytics.total_messages, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load analytics</p>
        </div>
      )}
    </div>
  );
}