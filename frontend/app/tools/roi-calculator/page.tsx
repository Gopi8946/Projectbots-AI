'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function ROICalculatorPage() {
  const [form, setForm] = useState({
    monthlyQueries: 500,
    agentSalary: 3500,
    timePerQuery: 5,
    workingDays: 22,
  });

  const hoursPerQuery = form.timePerQuery / 60;
  const totalHoursPerMonth = form.monthlyQueries * hoursPerQuery;
  const hourlyRate = form.agentSalary / (form.workingDays * 8);
  const monthlyAgentCost = totalHoursPerMonth * hourlyRate;
  const botCost = 49;
  const automationRate = 70;
  const realSavings = (monthlyAgentCost - botCost) * (automationRate / 100);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbot ROI Calculator</h1>
          <p className="text-gray-500 mt-2">See how much money a chatbot saves your business</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Your Business Numbers</h2>
            <div className="space-y-4">
              {[
                { label: 'Monthly Customer Queries', key: 'monthlyQueries', hint: 'How many questions per month?' },
                { label: 'Agent Monthly Salary ($)', key: 'agentSalary', hint: 'Support staff salary' },
                { label: 'Avg Time Per Query (mins)', key: 'timePerQuery', hint: 'Minutes spent per question' },
                { label: 'Working Days Per Month', key: 'workingDays', hint: 'Business days per month' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type="number"
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <p className="font-medium">Monthly Savings</p>
              </div>
              <p className="text-4xl font-bold">${Math.max(0, Math.round(realSavings)).toLocaleString()}</p>
              <p className="text-emerald-100 text-sm mt-1">with {automationRate}% automation</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <p className="font-medium text-gray-900">Annual Savings</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">${Math.max(0, Math.round(realSavings * 12)).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <p className="font-medium text-gray-900">Hours Saved / Month</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{Math.round(totalHoursPerMonth * (automationRate / 100))}h</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current agent cost</span>
                <span className="font-bold text-red-600">${Math.round(monthlyAgentCost).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ProjectBots.AI Business</span>
                <span className="font-bold text-emerald-600">$49/mo</span>
              </div>
            </div>
            <Link href="/signup"
              className="block w-full py-3 text-center bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700">
              Start Saving — Free Plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}