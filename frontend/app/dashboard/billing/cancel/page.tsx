'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Checkout Canceled</h1>
        <p className="text-gray-600 mt-3">
          No worries! No charges were made. You can upgrade anytime.
        </p>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
      </div>
    </div>
  );
}