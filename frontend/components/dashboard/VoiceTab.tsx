'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Play,
  Square,
  CheckCircle2,
  Copy,
  Mic,
  Volume2,
  Settings,
  Loader2,
  PhoneForwarded,
  Globe,
} from 'lucide-react';
import { updateVoiceSettings } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Chatbot {
  id: string;
  name: string;
  api_key: string;
  voice_settings: Record<string, any> | null;
}

interface PollyVoice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  tone: string;
}

interface Props {
  chatbot: Chatbot;
  onUpdate: () => void;
}

const POLLY_VOICES: PollyVoice[] = [
  { id: "Polly.Joanna", name: "Joanna", gender: "Female", accent: "American", tone: "Warm & Professional" },
  { id: "Polly.Salli", name: "Salli", gender: "Female", accent: "American", tone: "Friendly & Bright" },
  { id: "Polly.Kendra", name: "Kendra", gender: "Female", accent: "American", tone: "Clear & Confident" },
  { id: "Polly.Ruth", name: "Ruth", gender: "Female", accent: "American", tone: "Expressive & Natural" },
  { id: "Polly.Danielle", name: "Danielle", gender: "Female", accent: "American", tone: "Conversational" },
  { id: "Polly.Amy", name: "Amy", gender: "Female", accent: "British", tone: "Polished & Elegant" },
  { id: "Polly.Emma", name: "Emma", gender: "Female", accent: "British", tone: "Natural & Warm" },
  { id: "Polly.Matthew", name: "Matthew", gender: "Male", accent: "American", tone: "Clear & Professional" },
  { id: "Polly.Joey", name: "Joey", gender: "Male", accent: "American", tone: "Casual & Friendly" },
  { id: "Polly.Stephen", name: "Stephen", gender: "Male", accent: "American", tone: "Deep & Steady" },
  { id: "Polly.Gregory", name: "Gregory", gender: "Male", accent: "American", tone: "Calm & Reassuring" },
  { id: "Polly.Arthur", name: "Arthur", gender: "Male", accent: "British", tone: "Warm & Articulate" },
];

const SPEED_OPTIONS = [
  { label: 'Slow', value: 'slow', desc: 'Deliberate pace' },
  { label: 'Normal', value: 'normal', desc: 'Standard speed' },
  { label: 'Fast', value: 'fast', desc: 'Conversational — Recommended' },
  { label: 'Extra Fast', value: 'x-fast', desc: 'Quick & energetic' },
];

export default function VoiceTab({ chatbot, onUpdate }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentVoice = chatbot.voice_settings || {};

  const [form, setForm] = useState({
    enabled: currentVoice.enabled || false,
    voice: currentVoice.voice || 'Polly.Joanna',
    speed: currentVoice.speed || 'fast',
    greeting: currentVoice.greeting || `Hi there! Thanks for calling ${chatbot.name}! How can I help you?`,
    handoff_number: currentVoice.handoff_number || '',
    webhook_base_url: currentVoice.webhook_base_url || '',
  });

  useEffect(() => {
    const v = chatbot.voice_settings || {};
    setForm({
      enabled: v.enabled || false,
      voice: v.voice || 'Polly.Joanna',
      speed: v.speed || 'fast',
      greeting: v.greeting || `Hi there! Thanks for calling ${chatbot.name}! How can I help you?`,
      handoff_number: v.handoff_number || '',
      webhook_base_url: v.webhook_base_url || '',
    });
  }, [chatbot.voice_settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await updateVoiceSettings(token, chatbot.id, form);
      setSaved(true);
      onUpdate();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    setPreviewing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Map Polly voice to closest preview voice for preview
      // Polly voices only work on Twilio — for preview we use gTTS
      const isMale = POLLY_VOICES.find(v => v.id === form.voice)?.gender === 'Male';
      const previewVoice = isMale ? 'google-en-gb' : 'google-en-us';

      // Map speed to preview speed values
      const speedMap: Record<string, string> = {
        'slow': '+0%',
        'normal': '+15%',
        'fast': '+30%',
        'x-fast': '+45%',
      };
      const previewSpeed = speedMap[form.speed] || '+30%';

      const response = await fetch(`${API_URL}/api/voice/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: form.greeting,
          voice: previewVoice,
          speed: previewSpeed,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Preview failed' }));
        alert(err.detail || 'Preview failed');
        return;
      }

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); audioRef.current = null; };
      audio.play();
      setPlaying(true);
    } catch {
      alert('Preview failed. Check backend is running.');
    } finally {
      setPreviewing(false);
    }
  };

  const handlePreviewElevenLabs = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    setPreviewing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/voice/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: form.greeting,
          voice: 'google-en-us',
          speed: '+15%',
          use_elevenlabs: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Preview failed' }));
        alert(err.detail || 'ElevenLabs preview failed. Check API key and voice ID in .env');
        return;
      }

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); audioRef.current = null; };
      audio.play();
      setPlaying(true);
    } catch {
      alert('ElevenLabs preview failed.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const webhookUrl = form.webhook_base_url
    ? `${form.webhook_base_url.replace(/\/$/, '')}/api/voice/incoming/${chatbot.api_key}`
    : '';

  const selectedVoice = POLLY_VOICES.find((v) => v.id === form.voice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Phone className="w-6 h-6" />
          <h2 className="text-lg font-bold">Voice AI — Phone Calls</h2>
        </div>
        <p className="text-indigo-100 text-sm leading-relaxed">
          Customers call your number → AI answers instantly using Amazon Polly neural voices.
          ~2-3 second response time. Sounds like a real receptionist.
        </p>
      </div>

      {/* Setup Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Setup (4 Steps)
        </h3>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Get a Twilio phone number at <a href="https://twilio.com" target="_blank" className="text-indigo-600 hover:underline">twilio.com</a></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">ngrok http 8000</code> and copy the https URL</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Paste ngrok URL below and save settings</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span>Copy webhook URL → paste in Twilio phone number config → call your number</span>
          </li>
        </ol>
      </div>

      {/* Webhook Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          Webhook
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ngrok / Server URL</label>
            <input
              type="text"
              value={form.webhook_base_url}
              onChange={(e) => setForm({ ...form, webhook_base_url: e.target.value })}
              placeholder="https://a1b2c3d4.ngrok-free.app"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          {webhookUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (paste in Twilio)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2.5 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">{webhookUrl}</code>
                <button onClick={() => handleCopy(webhookUrl, 'webhook')} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0">
                  {copied === 'webhook' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Settings */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-gray-400" />
          Voice Settings
        </h3>

        <div className="space-y-5 max-w-xl">
          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Voice (Amazon Polly)</label>
            <select
              value={form.voice}
              onChange={(e) => setForm({ ...form, voice: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {POLLY_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.gender}, {v.accent} ({v.tone})
                </option>
              ))}
            </select>
            {selectedVoice && (
              <p className="text-xs text-gray-400 mt-1">
                {selectedVoice.tone} • Powered by Amazon Polly (instant, no delay)
              </p>
            )}
          </div>

          {/* Speed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Speaking Speed</label>
            <div className="grid grid-cols-2 gap-2">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, speed: opt.value })}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all text-left ${
                    form.speed === opt.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-xs mt-0.5 opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Greeting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Greeting</label>
            <textarea
              value={form.greeting}
              onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Preview */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {previewing ? 'Generating...' : playing ? 'Stop' : '▶ Preview (Google)'}
            </button>
            <button
              type="button"
              onClick={handlePreviewElevenLabs}
              disabled={previewing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              ▶ Preview (Cloned Voice)
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Phone calls use your cloned ElevenLabs voice. Google preview is for comparison only.
          </p>

          {/* Handoff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><PhoneForwarded className="w-4 h-4" /> Human Handoff Number</span>
            </label>
            <input
              type="tel"
              value={form.handoff_number}
              onChange={(e) => setForm({ ...form, handoff_number: e.target.value })}
              placeholder="+15551234567"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">When caller says &quot;speak to someone&quot;, call transfers here</p>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Voice Settings'}
            </button>
            {saved && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved!</span>}
          </div>
        </div>
      </form>

      {/* Speed Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5 text-gray-400" />
          Speed Comparison
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
          <p><strong>Before (gTTS file generation):</strong> ~5-10 seconds per response ❌</p>
          <p><strong>After (Polly, no files):</strong> ~2-3 seconds per response ✅</p>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="text-xs text-gray-400">
              Twilio transcribes speech (~1s) → Groq AI responds (~1s) → Polly speaks instantly (0s file generation)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}