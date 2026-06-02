'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FAQGeneratorPage() {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'url' | 'text'>('text');

  const handleGenerate = async () => {
    const input = mode === 'url' ? url.trim() : text.trim();
    if (!input) { setError('Please provide some content'); return; }
    setLoading(true); setError(''); setFaqs([]);
    try {
      const response = await fetch(`${API_URL}/api/tools/faq-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, content: input }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Generation failed' }));
        throw new Error(err.detail);
      }
      const data = await response.json();
      setFaqs(data.faqs);
    } catch (err: any) {
      setError(err.message || 'Failed to generate FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const t = faqs.map((f, i) => `Q${i + 1}: ${f.q}\nA: ${f.a}`).join('\n\n');
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ Generator</h1>
          <p className="text-gray-500 mt-2">Paste your business info and get instant FAQ content</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-2 mb-5">
            {(['text', 'url'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${mode === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}>
                {m === 'text' ? 'Paste Text' : 'Enter Topic'}
              </button>
            ))}
          </div>
          {mode === 'text' ? (
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Paste your business information here — menu, services, policies, pricing, hours, location..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              rows={8} />
          ) : (
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="Describe your business..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button onClick={handleGenerate} disabled={loading}
            className="mt-4 w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Generating FAQs...' : 'Generate FAQs'}
          </button>
        </div>

        {faqs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{faqs.length} FAQs Generated</h2>
              <button onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-2">Q: {faq.q}</p>
                  <p className="text-gray-600 text-sm">A: {faq.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <p className="text-sm text-indigo-800 font-medium">
                💡 Upload these FAQs as a data source to make your chatbot answer these automatically!
              </p>
              <Link href="/signup" className="inline-block mt-2 text-sm text-indigo-600 font-semibold hover:underline">
                Create your chatbot free →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}