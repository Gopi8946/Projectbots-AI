'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, X, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

    const plans = [
    {
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Perfect for trying out ProjectBots.AI',
      features: {
        'Chatbots': '2',
        'Messages / month': '100',
        'Data sources': '3',
        'Website widget': true,
        'WhatsApp integration': false,
        'Voice / Phone AI': false,
        'Actions & workflows': false,
        'Analytics': false,
        'Team members': '1',
        'Conversation history': '7 days',
        'Custom branding': false,
        'Priority support': false,
      },
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Starter',
      monthlyPrice: 1.99,
      annualPrice: 1.59,
      description: 'For small businesses getting started',
      features: {
        'Chatbots': '3',
        'Messages / month': '3,000',
        'Data sources': 'Multiple',
        'Website widget': true,
        'WhatsApp integration': false,
        'Voice / Phone AI': false,
        'Actions & workflows': false,
        'Analytics': true,
        'Team members': '1',
        'Conversation history': '30 days',
        'Custom branding': true,
        'Priority support': false,
      },
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Business',
      monthlyPrice: 2.99,
      annualPrice: 2.39,
      description: 'For growing businesses that need more',
      features: {
        'Chatbots': '6',
        'Messages / month': '6,000',
        'Data sources': 'Unlimited',
        'Website widget': true,
        'WhatsApp integration': true,
        'Voice / Phone AI': true,
        'Actions & workflows': true,
        'Analytics': true,
        'Team members': '5',
        'Conversation history': '1 year',
        'Custom branding': true,
        'Priority support': true,
      },
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      monthlyPrice: 4.99,
      annualPrice: 3.99,
      description: 'For large organizations with advanced needs',
      features: {
        'Chatbots': 'Unlimited',
        'Messages / month': 'Unlimited',
        'Data sources': 'Unlimited',
        'Website widget': true,
        'WhatsApp integration': true,
        'Voice / Phone AI': true,
        'Actions & workflows': true,
        'Analytics': true,
        'Team members': 'Unlimited',
        'Conversation history': 'Unlimited',
        'Custom branding': true,
        'Priority support': true,
      },
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free. Scale as you grow. Cancel anytime.
          </p>

          {/* Annual Toggle */}
          <div className="mt-8 inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'
              }`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                annual ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'
              }`}
              onClick={() => setAnnual(true)}
            >
              Annual
              <span className="ml-1 text-xs text-emerald-500 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-600 relative'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase">
                    Most Popular
                  </div>
                )}

                <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-baseline">
                  <span className={`text-5xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    ${price}
                  </span>
                  {price > 0 && (
                    <span className={`ml-2 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>
                      /month
                    </span>
                  )}
                </div>

                <p className={`mt-2 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {plan.description}
                </p>

                <Link
                  href={plan.name === 'Enterprise' ? '#' : '/signup'}
                  className={`mt-6 block w-full py-3 text-center text-sm font-semibold rounded-xl transition-all ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-8 space-y-3">
                  {Object.entries(plan.features).map(([feature, value], fIndex) => (
                    <li key={fIndex} className="flex items-center text-sm">
                      {value === false ? (
                        <X className={`w-4 h-4 mr-3 shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-gray-300'}`} />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 mr-3 shrink-0 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      )}
                      <span className={value === false ? (plan.highlighted ? 'text-indigo-300' : 'text-gray-400') : (plan.highlighted ? 'text-indigo-50' : 'text-gray-600')}>
                        {feature}
                        {typeof value === 'string' && (
                          <span className={`font-medium ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                            {' '}— {value}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom FAQ note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">
              Have questions?{' '}
              <Link href="/#faq" className="text-indigo-600 font-medium hover:underline">
                Check our FAQ
              </Link>{' '}
              or{' '}
              <a href="mailto:hello@projectbots.ai" className="text-indigo-600 font-medium hover:underline">
                contact us
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}