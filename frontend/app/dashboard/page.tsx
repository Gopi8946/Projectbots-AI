'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bot,
  BarChart3,
  Plus,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { getChatbots } from '@/lib/api';

interface UserData {
  full_name: string;
  plan: string;
  email: string;
}

export default function DashboardHome() {
  const [user, setUser] = useState<UserData | null>(null);
  const [chatbotCount, setChatbotCount] = useState(0);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch chatbot count
    const token = localStorage.getItem('token');
    if (token) {
      getChatbots(token)
        .then((bots) => setChatbotCount(bots.length))
        .catch(() => {});
    }
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const stats = [
    {
      label: 'Active Chatbots',
      value: chatbotCount,
      icon: Bot,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Messages This Month',
      value: 0,
      icon: MessageSquare,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Conversations',
      value: 0,
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s an overview of your chatbots and activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/chatbots"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Create a Chatbot</p>
              <p className="text-xs text-gray-500">Build your first AI assistant</p>
            </div>
          </Link>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-500 text-sm">View Analytics</p>
              <p className="text-xs text-gray-400">Coming in Phase 4</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-500 text-sm">Set Up Integrations</p>
              <p className="text-xs text-gray-400">Coming in Phase 7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}