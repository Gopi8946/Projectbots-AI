'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles, Copy, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const INDUSTRIES = ['Restaurant', 'E-Commerce', 'Healthcare', 'Real Estate', 'Education', 'Legal', 'Finance', 'Travel', 'Fitness', 'Tech SaaS'];
const TONES = ['Professional', 'Friendly', 'Playful', 'Formal', 'Energetic'];

export default function BotNameGeneratorPage() {
  const [industry, setIndustry] = useState('Restaurant');
  const [tone, setTone] = useState('Friendly');
  const [brandName, setBrandName] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedName, setCopiedName] = useState('');

  const handleGenerate = async () => {
    setLoading(true); setNames([]);
    try {
      const response = await fetch(`${API_URL}/api/tools/bot-name-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, tone, brand_name: brandName }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      setNames(data.names);
    } catch {
      alert('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bot Name Generator</h1>
          <p className="text-gray-500 mt-2">Generate creative AI chatbot names for your business</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${tone === t ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name <span className="text-gray-400">(optional)</span>
              </label>
              <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Mario's Pizzeria"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <button onClick={handleGenerate} disabled={loading}
              className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Generating...' : 'Generate Names'}
            </button>
          </div>
        </div>

        {names.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Generated Names</h2>
            <div className="grid grid-cols-2 gap-3">
              {names.map((name, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-800">{name}</span>
                  <button onClick={() => handleCopy(name)} className="ml-2 text-gray-400 hover:text-gray-600">
                    {copiedName === name ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/signup" className="text-sm text-indigo-600 font-semibold hover:underline">
                Create your chatbot on ProjectBots.AI →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}