'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on dashboard, widget, and demo pages
if (
  pathname?.startsWith('/dashboard') ||
  pathname?.startsWith('/widget') ||
  pathname?.startsWith('/demo') ||
  pathname?.startsWith('/billing')
) {
  return null;
}

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                ProjectBots<span className="text-indigo-400">.AI</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Build AI-powered chatbots that actually know your business.
              Deploy everywhere in minutes.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="/#use-cases" className="hover:text-white transition-colors">Use Cases</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Free Tools</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/tools/faq-generator" className="hover:text-white transition-colors">FAQ Generator</Link></li>
              <li><Link href="/tools/roi-calculator" className="hover:text-white transition-colors">ROI Calculator</Link></li>
              <li><Link href="/tools/bot-name-generator" className="hover:text-white transition-colors">Bot Name Generator</Link></li>
              <li><Link href="/tools/prompt-tester" className="hover:text-white transition-colors">Prompt Tester</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm">© {new Date().getFullYear()} ProjectBots.AI — All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}