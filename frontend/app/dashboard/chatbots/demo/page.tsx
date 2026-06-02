'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DemoContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key') || '';

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-2xl mb-2">🔑</p>
          <p className="text-gray-700 font-medium">No API key provided</p>
          <p className="text-sm text-gray-500 mt-1">
            Open this page from the Deploy tab in your dashboard
          </p>
        </div>
      </div>
    );
  }

  const widgetUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Mock Restaurant Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍕</span>
            <span className="text-xl font-bold text-gray-900">Mario&apos;s Pizzeria</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-orange-600">Menu</a>
            <a href="#" className="hover:text-orange-600">About</a>
            <a href="#" className="hover:text-orange-600">Catering</a>
            <a href="#" className="hover:text-orange-600">Contact</a>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
              Order Online
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative bg-linear-to-br from-orange-600 to-red-700 text-white py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Authentic Italian Pizza
          </h1>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Handcrafted with love since 1985. Fresh ingredients,
            traditional recipes, unforgettable taste.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-3 bg-white text-orange-700 rounded-xl font-semibold hover:bg-orange-50">
              View Menu
            </button>
            <button className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10">
              Book a Table
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Favorites</h2>
          <p className="text-gray-600">
            Made fresh daily with ingredients sourced from local farms
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Margherita', price: '$14.99', desc: 'Fresh mozzarella, tomato sauce, basil', emoji: '🍕' },
            { name: 'Pepperoni', price: '$15.99', desc: 'Classic pepperoni with mozzarella', emoji: '🍕' },
            { name: 'Quattro Formaggi', price: '$16.99', desc: 'Four artisan cheese blend', emoji: '🧀' },
            { name: 'Spaghetti Bolognese', price: '$13.99', desc: 'Traditional meat sauce', emoji: '🍝' },
            { name: 'Tiramisu', price: '$7.99', desc: 'Classic Italian coffee dessert', emoji: '🍰' },
            { name: 'Cannoli', price: '$6.99', desc: 'Crispy shells with ricotta filling', emoji: '🥐' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl mb-3">{item.emoji}</p>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className="font-bold text-orange-600">{item.price}</span>
              </div>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl mb-2">📍</p>
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-sm text-gray-500 mt-1">
                123 Main Street<br />Downtown, New York
              </p>
            </div>
            <div>
              <p className="text-3xl mb-2">🕐</p>
              <h3 className="font-semibold text-gray-900">Hours</h3>
              <p className="text-sm text-gray-500 mt-1">
                Mon-Thu: 11am-10pm<br />Fri-Sat: 11am-11pm
              </p>
            </div>
            <div>
              <p className="text-3xl mb-2">📞</p>
              <h3 className="font-semibold text-gray-900">Contact</h3>
              <p className="text-sm text-gray-500 mt-1">
                (555) 123-4567<br />info@mariospizzeria.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        ProjectBots.AI Widget Demo — Try the chat in the bottom right →
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© 2024 Mario&apos;s Pizzeria — This is a demo website by ProjectBots.AI</p>
      </footer>

      {/* Chat Widget Iframe */}
      <iframe
        src={`${widgetUrl}/widget/${apiKey}`}
        title="Chat Widget"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '560px',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.18)',
          zIndex: 99999,
        }}
      />
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}