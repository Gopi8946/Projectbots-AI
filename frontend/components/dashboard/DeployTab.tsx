'use client';
import { updateAllowedDomains } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  Rocket,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Palette,
  MessageSquare,
  Power,
  Globe,
  Loader2,
  Shield,
  X,
} from 'lucide-react';
import { updateChatbot, updateWidgetSettings, getDataSources } from '@/lib/api';

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  status: string;
  api_key: string;
  widget_settings: Record<string, any> | null;
}

interface Chatbot {
  id: string;
  name: string;
  description: string | null;
  status: string;
  api_key: string;
  widget_settings: Record<string, any> | null;
  allowed_domains: string[] | null;
}

interface Props {
  chatbot: Chatbot;
  onUpdate: () => void;
}

export default function DeployTab({ chatbot, onUpdate }: Props) {
  const [hasData, setHasData] = useState(false);
  const [checkingData, setCheckingData] = useState(true);
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState('');
  const [savingWidget, setSavingWidget] = useState(false);
  const [widgetSaved, setWidgetSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const currentWidget = chatbot.widget_settings || {};

  const [widgetForm, setWidgetForm] = useState({
    greeting_message: currentWidget.greeting_message || 'Hi! 👋 How can I help you today?',
    primary_color: currentWidget.primary_color || '#6366f1',
    position: currentWidget.position || 'right',
    bubble_text: currentWidget.bubble_text || 'Chat with us',
    show_branding: currentWidget.show_branding !== false,
  });

  const [domains, setDomains] = useState<string[]>(
  chatbot.allowed_domains || []
);
  const [newDomain, setNewDomain] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsSaved, setDomainsSaved] = useState(false);

  // Sync form when chatbot prop changes (after parent re-fetches)
  useEffect(() => {
    const w = chatbot.widget_settings || {};
    setWidgetForm({
      greeting_message: w.greeting_message || 'Hi! 👋 How can I help you today?',
      primary_color: w.primary_color || '#6366f1',
      position: w.position || 'right',
      bubble_text: w.bubble_text || 'Chat with us',
      show_branding: w.show_branding !== false,
    });
  }, [chatbot.widget_settings]);

  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const sources = await getDataSources(token, chatbot.id);
        const readySources = sources.filter((s: any) => s.status === 'ready');
        setHasData(readySources.length > 0);
      } catch {
        // ignore
      } finally {
        setCheckingData(false);
      }
    };
    check();
  }, [chatbot.id]);

  const handleToggleActive = async () => {
    if (!hasData && chatbot.status !== 'active') {
      alert('Please add at least one data source before activating your chatbot.');
      return;
    }

    setActivating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const newStatus = chatbot.status === 'active' ? 'draft' : 'active';
      await updateChatbot(token, chatbot.id, { status: newStatus });
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActivating(false);
    }
  };

  const handleAddDomain = () => {
    const cleaned = newDomain
      .trim()
      .toLowerCase()
      .replace('https://', '')
      .replace('http://', '')
      .replace(/\/$/, '');

    if (!cleaned) return;
    if (domains.includes(cleaned)) return;
    setDomains([...domains, cleaned]);
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter((d) => d !== domain));
  };

  const handleSaveDomains = async () => {
    setSavingDomains(true);
    setDomainsSaved(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await updateAllowedDomains(token, chatbot.id, domains);
      setDomainsSaved(true);
      onUpdate();
      setTimeout(() => setDomainsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save domains');
    } finally {
      setSavingDomains(false);
    }
  };

  const handleSaveWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWidget(true);
    setWidgetSaved(false);
    setSaveError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Call the dedicated widget settings endpoint
      const result = await updateWidgetSettings(token, chatbot.id, widgetForm);

      // Verify the save worked by checking the response
      if (result.widget_settings) {
        const saved = result.widget_settings;
        if (saved.primary_color !== widgetForm.primary_color) {
          throw new Error('Color did not save correctly. Please try again.');
        }
      }

      setWidgetSaved(true);
      onUpdate();
      setTimeout(() => setWidgetSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save widget settings');
    } finally {
      setSavingWidget(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const widgetUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const embedCode = `<!-- ProjectBots.AI Chat Widget -->
<script>
  window.ProjectBotsConfig = {
    apiKey: "${chatbot.api_key}",
    position: "${widgetForm.position}",
    color: "${widgetForm.primary_color}"
  };
</script>
<script src="${widgetUrl}/embed.js" defer></script>`;

  const isActive = chatbot.status === 'active';

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div
        className={`rounded-xl border-2 p-6 ${
          isActive
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-amber-200 bg-amber-50/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              <Power className={`w-6 h-6 ${isActive ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {isActive ? 'Chatbot is Live' : 'Chatbot is in Draft Mode'}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {isActive
                  ? 'Your chatbot is active and responding to customers.'
                  : 'Activate your chatbot to make it available on your website.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={activating || checkingData}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
              isActive
                ? 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
            }`}
          >
            {activating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              'Deactivate'
            ) : (
              '🚀 Activate Chatbot'
            )}
          </button>
        </div>

        {!hasData && !checkingData && !isActive && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Add at least one data source before activating.
          </div>
        )}
      </div>

      {/* Embed Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Embed Code</h3>
            <p className="text-sm text-gray-500">
              Paste this before &lt;/body&gt; on your website
            </p>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
            <code>{embedCode}</code>
          </pre>
          <button
            onClick={() => handleCopy(embedCode, 'embed')}
            className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
          >
            {copied === 'embed' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-500">API Key:</span>
          <code className="text-sm text-gray-700 font-mono flex-1 truncate">
            {chatbot.api_key}
          </code>
          <button
            onClick={() => handleCopy(chatbot.api_key, 'apikey')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            {copied === 'apikey' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/widget/${chatbot.api_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open Widget Standalone
          </a>
          <a
            href={`/demo?key=${chatbot.api_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Globe className="w-4 h-4" />
            Preview on Demo Website
          </a>
        </div>
      </div>

            {/* Domain Whitelisting */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Allowed Domains</h3>
            <p className="text-sm text-gray-500">
              Your chatbot will ONLY work on these domains
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Important:</strong> Add every domain where you want the chatbot to work.
          Requests from unlisted domains will be blocked automatically.
          <code className="block mt-1 text-xs bg-amber-100 px-2 py-1 rounded">
            localhost is always allowed for development.
          </code>
        </div>

        {/* Domain Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
            placeholder="example.com or www.example.com"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAddDomain}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Add
          </button>
        </div>

        {/* Domain List */}
        {domains.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No domains added yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Without domains set, the widget works everywhere (not recommended for production)
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {domains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <code className="text-sm text-gray-700">{domain}</code>
                </div>
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDomains}
            disabled={savingDomains}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            {savingDomains ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Domains'
            )}
          </button>
          {domainsSaved && (
            <span className="text-sm text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
        </div>
      </div>

      {/* Widget Customization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Widget Customization</h3>
            <p className="text-sm text-gray-500">Customize how the chat widget looks</p>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        )}

        <form onSubmit={handleSaveWidget} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={widgetForm.primary_color}
                onChange={(e) => setWidgetForm({ ...widgetForm, primary_color: e.target.value })}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-1"
              />
              <input
                type="text"
                value={widgetForm.primary_color}
                onChange={(e) => setWidgetForm({ ...widgetForm, primary_color: e.target.value })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                placeholder="#6366f1"
              />
              {/* Quick color presets */}
              <div className="flex gap-1">
                {['#6366f1', '#ef4444', '#f97316', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setWidgetForm({ ...widgetForm, primary_color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      widgetForm.primary_color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Greeting Message
            </label>
            <textarea
              value={widgetForm.greeting_message}
              onChange={(e) => setWidgetForm({ ...widgetForm, greeting_message: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              rows={2}
              placeholder="Hi! 👋 How can I help you today?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widget Position
            </label>
            <div className="flex gap-3">
              {(['right', 'left'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setWidgetForm({ ...widgetForm, position: pos })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    widgetForm.position === pos
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {pos === 'right' ? '→ Bottom Right' : '← Bottom Left'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chat Bubble Text
            </label>
            <input
              type="text"
              value={widgetForm.bubble_text}
              onChange={(e) => setWidgetForm({ ...widgetForm, bubble_text: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Chat with us"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingWidget}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {savingWidget ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Widget Settings'}
            </button>
            {widgetSaved && (
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved successfully!
              </span>
            )}
          </div>
        </form>

        {/* Current saved values (debug helper) */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Currently saved in database:</p>
          <p className="text-xs text-gray-600 font-mono">
            Color: {chatbot.widget_settings?.primary_color || 'not set'} |
            Greeting: {(chatbot.widget_settings?.greeting_message || 'not set').substring(0, 40)}...
          </p>
        </div>
      </div>

      {/* Widget Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Widget Preview</h3>
            <p className="text-sm text-gray-500">Live preview — changes as you edit above</p>
          </div>
        </div>

        <div className="max-w-sm mx-auto">
          {/* Chat preview */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <div
              className="flex items-center gap-3 px-4 py-3 text-white"
              style={{ backgroundColor: widgetForm.primary_color }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{chatbot.name}</p>
                <p className="text-[11px]" style={{ opacity: 0.8 }}>● Online</p>
              </div>
            </div>
            <div className="bg-white p-4">
              <div className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${widgetForm.primary_color}15` }}
                >
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: widgetForm.primary_color }} />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <p className="text-[13px] text-gray-700">{widgetForm.greeting_message}</p>
                </div>
              </div>

              {/* Simulated user message */}
              <div className="flex justify-end mt-3">
                <div
                  className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-white"
                  style={{ backgroundColor: widgetForm.primary_color }}
                >
                  <p className="text-[13px]">What are your hours?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bubble preview */}
          <div className="mt-4 flex justify-end">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-default"
              style={{ background: `linear-gradient(135deg, ${widgetForm.primary_color}, ${widgetForm.primary_color}dd)` }}
            >
              <svg className="w-7 h-7 text-white" fill="white" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">↑ Chat bubble preview</p>
        </div>
      </div>
    </div>
  );
}