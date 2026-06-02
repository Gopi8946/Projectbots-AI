'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function BillingSuccessPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [plan, setPlan] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setError('No checkout session found in URL.');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('error');
        setError('You are not logged in. Please log in and try again.');
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/billing/verify-session?session_id=${sessionId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ detail: 'Verification failed' }));
          throw new Error(errData.detail || 'Verification failed');
        }

        const result = await response.json();
        setPlan(result.plan);
        setStatus('success');

        // Update stored user data so the app knows the new plan
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.plan = result.plan;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Something went wrong during verification.');
      }
    };

    verify();
  }, []);

  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md w-full">
        {/* Verifying */}
        {status === 'verifying' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Verifying Payment...</h1>
            <p className="text-gray-500 mt-2">Please wait while we activate your plan.</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h1>
            <p className="text-gray-600 mt-3 text-lg">
              Welcome to the{' '}
              <span className="font-bold text-indigo-600 capitalize">{plan}</span> plan!
            </p>
            <p className="text-gray-500 mt-2 text-sm">
              Your chatbot limits have been upgraded.
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex items-center justify-center w-full px-6 py-3 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                View Billing Details
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Something Went Wrong</h1>
            <p className="text-gray-600 mt-3">{error}</p>
            <p className="text-gray-400 mt-2 text-sm">
              If you were charged, your payment is safe. Contact support if needed.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center w-full mt-8 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Back to Billing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}