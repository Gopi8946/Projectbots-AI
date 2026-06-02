'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Crown,
  Rocket,
  MessageSquare,
  Bot,
  ExternalLink,
  RotateCcw,
  Loader2,
  AlertCircle,
  Shield,
  Star,
} from 'lucide-react';
import {
  getBillingInfo,
  createCheckoutSession,
  createCustomerPortal,
  cancelSubscription,
  resetUsage,
} from '@/lib/api';

interface BillingData {
  plan: string;
  limits: { max_chatbots: number; max_messages: number };
  usage: {
    chatbots_used: number;
    chatbots_limit: number;
    messages_used: number;
    messages_limit: number;
  };
  subscription: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
}

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    icon: Zap,
    color: 'bg-gray-100 text-gray-600',
    features: ['2 chatbots', '100 messages/month', '3 data sources', 'Website widget'],
  },
  {
    key: 'starter',
    name: 'Starter',
    price: 1.99,
    icon: Rocket,
    color: 'bg-blue-100 text-blue-600',
    features: ['3 chatbots', '3,000 messages/month', 'Multiple data sources', 'Analytics', 'Email support'],
  },
  {
    key: 'business',
    name: 'Business',
    price: 2.99,
    icon: Crown,
    color: 'bg-indigo-100 text-indigo-600',
    popular: true,
    features: [
      '6 chatbots', '6,000 messages/month', 'Unlimited data sources',
      'All integrations', 'Voice AI', 'Analytics', 'Priority support',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 4.99,
    icon: Shield,
    color: 'bg-purple-100 text-purple-600',
    features: [
      'Unlimited chatbots', 'Unlimited messages', 'Custom AI model',
      'SSO', 'SLA guarantee', 'Dedicated support',
    ],
  },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const fetchBilling = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await getBillingInfo(token);
      setBilling(data);
    } catch {
      console.error('Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const result = await createCheckoutSession(token, plan);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start checkout');
    } finally {
      setUpgrading('');
    }
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const result = await createCustomerPortal(token);
      if (result.portal_url) {
        window.location.href = result.portal_url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open portal');
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure? Your plan will revert to Free at the end of the billing period.')) return;
    setCanceling(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await cancelSubscription(token);
      alert('Subscription will cancel at end of billing period.');
      fetchBilling();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setCanceling(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all message counts to 0? (Development only)')) return;
    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await resetUsage(token);
      fetchBilling();
    } catch {
      alert('Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!billing) return null;

  const currentPlanObj = PLANS.find((p) => p.key === billing.plan) || PLANS[0];
  const messagesPercent = Math.min(
    100,
    Math.round((billing.usage.messages_used / Math.max(billing.usage.messages_limit, 1)) * 100)
  );
  const botsPercent = Math.min(
    100,
    Math.round((billing.usage.chatbots_used / Math.max(billing.usage.chatbots_limit, 1)) * 100)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plan</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Current Plan</p>
            <p className="text-3xl font-bold mt-1 capitalize">{billing.plan}</p>
            {billing.plan !== 'free' && billing.subscription && (
              <p className="text-indigo-200 text-sm mt-2">
                {billing.subscription.cancel_at_period_end
                  ? '⚠️ Cancels at end of period'
                  : `Next billing: ${new Date(billing.subscription.current_period_end * 1000).toLocaleDateString()}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {billing.plan !== 'free' && (
              <button
                onClick={handlePortal}
                disabled={openingPortal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                {openingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Messages Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Messages</p>
                <p className="text-xs text-gray-500">Monthly usage</p>
              </div>
            </div>
            <p className="text-sm font-mono text-gray-700">
              {billing.usage.messages_used} / {billing.usage.messages_limit === 999999 ? '∞' : billing.usage.messages_limit.toLocaleString()}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                messagesPercent > 80 ? 'bg-red-500' : messagesPercent > 60 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${messagesPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{messagesPercent}% used</p>
        </div>

        {/* Chatbots Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Chatbots</p>
                <p className="text-xs text-gray-500">Active bots</p>
              </div>
            </div>
            <p className="text-sm font-mono text-gray-700">
              {billing.usage.chatbots_used} / {billing.usage.chatbots_limit >= 999 ? '∞' : billing.usage.chatbots_limit}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${botsPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{botsPercent}% used</p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {billing.plan === 'free' ? 'Upgrade Your Plan' : 'Available Plans'}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = billing.plan === plan.key;
            const isDowngrade =
              PLANS.findIndex((p) => p.key === billing.plan) > PLANS.findIndex((p) => p.key === plan.key);

            return (
              <div
                key={plan.key}
                className={`rounded-xl border-2 p-5 transition-all ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : plan.popular
                    ? 'border-indigo-200 bg-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 mb-2">
                    <Star className="w-3 h-3 fill-indigo-600" />
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.color}`}>
                    <plan.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-500">/mo</span>}
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg">
                    Current Plan
                  </div>
                ) : plan.key === 'free' ? (
                  isDowngrade && billing.plan !== 'free' ? (
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className="w-full py-2.5 text-center text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {canceling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Downgrade to Free'}
                    </button>
                  ) : null
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!upgrading}
                    className={`w-full py-2.5 text-center text-sm font-semibold rounded-lg transition-all disabled:opacity-50 ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {upgrading === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : isDowngrade ? (
                      'Switch Plan'
                    ) : (
                      'Upgrade'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dev Tools */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-amber-900">Development Tools</h3>
            <p className="text-sm text-amber-700 mt-1">
              These tools are for development only. Remove before production.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Reset Message Counts
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Test card: <code className="bg-amber-100 px-1 py-0.5 rounded">4242 4242 4242 4242</code> | Any future date | Any CVC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}