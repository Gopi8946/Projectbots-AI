'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Globe,
  Phone,
  CheckCircle2,
  ExternalLink,
  Zap,
  Copy,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { getChatbots } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Chatbot {
  id: string;
  name: string;
  api_key: string;
  status: string;
}

export default function IntegrationsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState('');
  const [copied, setCopied] = useState('');
  const [ngrokUrl, setNgrokUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getChatbots(token).then((data) => {
      setChatbots(data);
      if (data.length > 0) setSelectedBot(data[0].api_key);
    }).catch(() => {});
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const whatsappWebhook = ngrokUrl && selectedBot
    ? `${ngrokUrl.replace(/\/$/, '')}/api/whatsapp/incoming/${selectedBot}`
    : '';

  const voiceWebhook = ngrokUrl && selectedBot
    ? `${ngrokUrl.replace(/\/$/, '')}/api/voice/incoming/${selectedBot}`
    : '';

  const selectedBotObj = chatbots.find((b) => b.api_key === selectedBot);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect your chatbot to every platform your customers use</p>
      </div>

      {/* Chatbot Selector */}
      {chatbots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Chatbot to Configure
          </label>
          <select
            value={selectedBot}
            onChange={(e) => setSelectedBot(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {chatbots.map((bot) => (
              <option key={bot.id} value={bot.api_key}>
                {bot.name} ({bot.status})
              </option>
            ))}
          </select>
          {selectedBotObj && selectedBotObj.status !== 'active' && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              This chatbot is in draft mode. Activate it in the Deploy tab first.
            </div>
          )}
        </div>
      )}

      {/* Server URL for webhooks */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Server / ngrok URL
        </label>
        <input
          type="text"
          value={ngrokUrl}
          onChange={(e) => setNgrokUrl(e.target.value)}
          placeholder="https://your-ngrok-url.ngrok-free.app or production URL"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Used to generate webhook URLs for all integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* ── WEBSITE WIDGET ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Website Widget</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Live</span>
              </div>
              <p className="text-sm text-gray-500">Embed chatbot on any website with one line of code</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              'Floating chat bubble',
              'Custom colors and greeting',
              'Domain whitelisting (security)',
              'Mobile responsive',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {f}
              </div>
            ))}
          </div>
          <Link
            href={`/dashboard/chatbots`}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Configure in Deploy Tab
          </Link>
        </div>

        {/* ── VOICE AI ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Voice AI (Phone Calls)</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Live</span>
              </div>
              <p className="text-sm text-gray-500">Bot answers phone calls with cloned human voice</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            {[
              'ElevenLabs voice cloning',
              'Deepgram fast responses',
              'Human handoff support',
              'Call transcripts logged',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {f}
              </div>
            ))}
          </div>
          {voiceWebhook && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Twilio Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
                  {voiceWebhook}
                </code>
                <button
                  onClick={() => handleCopy(voiceWebhook, 'voice')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0"
                >
                  {copied === 'voice' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Paste in Twilio → Phone Numbers → A call comes in → HTTP POST</p>
            </div>
          )}
          <Link
            href={`/dashboard/chatbots`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Configure in Voice AI Tab
          </Link>
        </div>

        {/* ── WHATSAPP ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Live (Sandbox)</span>
              </div>
              <p className="text-sm text-gray-500">Answer WhatsApp messages automatically with your AI bot</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {[
              'Same RAG pipeline as chat',
              'Persistent conversation memory per user',
              'Conversation logs in dashboard',
              'Works with Twilio WhatsApp Sandbox (instant)',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {f}
              </div>
            ))}
          </div>

          {/* WhatsApp Setup Steps */}
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Setup Instructions</h4>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>
                  Go to{' '}
                  <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" className="text-indigo-600 hover:underline">
                    Twilio WhatsApp Sandbox
                  </a>
                  {' '}and follow the activation steps
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Enter your server/ngrok URL above and select your chatbot</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Copy the webhook URL below and paste it in Twilio Sandbox → &quot;When a message comes in&quot;</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span>Send a WhatsApp message to the Twilio sandbox number — your bot replies!</span>
              </li>
            </ol>
          </div>

          {whatsappWebhook ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Webhook URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
                  {whatsappWebhook}
                </code>
                <button
                  onClick={() => handleCopy(whatsappWebhook, 'whatsapp')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0"
                >
                  {copied === 'whatsapp' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Paste in Twilio Sandbox → &quot;When a message comes in&quot; → HTTP POST</p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Enter your server URL and select a chatbot above to generate the webhook URL
            </div>
          )}
        </div>

        {/* ── COMING SOON ────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: 'Slack', desc: 'Add bot to Slack workspace for internal Q&A', icon: '💬', color: 'bg-yellow-50' },
            { name: 'Zapier', desc: 'Connect to 5,000+ apps via automation', icon: '⚡', color: 'bg-orange-50' },
          ].map((item) => (
            <div key={item.name} className={`rounded-xl border border-gray-100 p-6 opacity-60 ${item.color}`}>
              <p className="text-3xl mb-3">{item.icon}</p>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-700">{item.name}</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Coming Soon</span>
              </div>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Free Tools */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Free Tools</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'FAQ Generator', desc: 'Generate FAQs from business content', href: '/tools/faq-generator', emoji: '❓' },
              { name: 'ROI Calculator', desc: 'See how much a chatbot saves you', href: '/tools/roi-calculator', emoji: '💰' },
              { name: 'Bot Name Generator', desc: 'Creative names for your chatbot', href: '/tools/bot-name-generator', emoji: '🤖' },
            ].map((tool) => (
              <Link key={tool.name} href={tool.href} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-100 transition-all group">
                <p className="text-2xl mb-2">{tool.emoji}</p>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{tool.desc}</p>
                <p className="text-xs text-indigo-600 mt-3 font-medium">Open tool →</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}