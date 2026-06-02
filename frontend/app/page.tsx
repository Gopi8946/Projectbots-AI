'use client';
//import RobotBackground from '@/components/RobotBackground';
import { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Upload,
  Settings,
  Rocket,
  MessageSquare,
  Phone,
  Globe,
  Shield,
  BarChart3,
  Languages,
  Zap,
  Users,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Star,
  Utensils,
  ShoppingCart,
  GraduationCap,
  Stethoscope,
  Building2,
  Headphones,
  Sparkles,
} from 'lucide-react';


// ═══════════════════════════════════════════════════════════
//  HOMEPAGE
// ═══════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* <RobotBackground /> */}
      <HeroSection />
      <LogoCloudSection />
      <HowItWorksSection />
      <FeaturesSection />
      <UseCasesSection />
      <TestimonialsSection />
      <PricingPreviewSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}


// ─── HERO SECTION ───────────────────────────────────────

function HeroSection() {
  return (
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 z-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 -z-10" />
      <div className="absolute top-0 right-0 w-125 h-125 bg-indigo-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 mb-6 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-indigo-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Now with Voice AI — Your bot answers phone calls
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Build AI Chatbots That{' '}
            <span className="gradient-text">Actually Know</span>{' '}
            Your Business
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your data. Configure your bot. Deploy everywhere.
            ProjectBots.AI creates intelligent chatbots that answer from{' '}
            <strong className="text-gray-900">YOUR knowledge</strong> — not generic AI.
            Works on website, WhatsApp, phone, Slack, and more.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Start Building Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Trust Line */}
          <p className="mt-6 text-sm text-gray-500">
            Free plan available • No credit card required • Set up in 5 minutes
          </p>
        </div>

        {/* Hero Visual — Chat Preview Mockup */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Browser bar */}
            <div className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-xs text-gray-400 text-center border">
                marios-pizzeria.com
              </div>
            </div>
            {/* Chat mockup */}
            <div className="p-6 space-y-4 bg-gray-50/50">
              {/* Bot greeting */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 max-w-md">
                  <p className="text-sm text-gray-700">
                    Ciao! 🍕 Welcome to Mario&apos;s Pizzeria! I can help you with our menu,
                    hours, reservations, and delivery. What can I do for you?
                  </p>
                </div>
              </div>

              {/* Customer message */}
              <div className="flex items-start justify-end space-x-3">
                <div className="bg-indigo-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-md">
                  <p className="text-sm text-white">
                    Do you have gluten-free options? And can I order delivery to Oak Street?
                  </p>
                </div>
              </div>

              {/* Bot response */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 max-w-md">
                  <p className="text-sm text-gray-700">
                    Great news! We offer <strong>gluten-free crust</strong> for all our 12&quot; pizzas
                    for just $3 extra. And yes, Oak Street is within our{' '}
                    <strong>5-mile delivery radius</strong>! 🚗
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Minimum delivery order is $15. Want me to help you place an order?
                  </p>
                </div>
              </div>

              {/* Typing indicator */}
              <div className="flex items-center space-x-2 text-xs text-gray-400 pl-11">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>Powered by ProjectBots.AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ─── LOGO CLOUD ─────────────────────────────────────────

function LogoCloudSection() {
  return (
    <section className="py-12 bg-white border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
          Built for businesses of every size
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50 grayscale">
          {['Restaurants', 'E-Commerce', 'Healthcare', 'Education', 'Real Estate', 'SaaS'].map(
            (industry) => (
              <span key={industry} className="text-lg font-bold text-gray-400">
                {industry}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}


// ─── HOW IT WORKS ───────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Upload Your Data',
      description:
        'PDFs, documents, website URLs, FAQs — upload everything about your business. Our AI processes and understands it all.',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      step: '02',
      icon: Settings,
      title: 'Configure Your Bot',
      description:
        'Set your bot\'s personality, define rules and guardrails, choose what topics it handles, and customize the look and feel.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      step: '03',
      icon: Rocket,
      title: 'Deploy Everywhere',
      description:
        'One click to go live on your website. Connect to WhatsApp, Slack, Discord, phone — your bot works on every channel.',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Three Steps to Your AI Chatbot
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            No coding. No AI expertise. Go from zero to a fully functional
            AI chatbot in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-linear-to-r from-gray-200 to-gray-100" />
              )}

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br ${step.color} shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Step Number */}
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
                Step {step.step}
              </p>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── FEATURES ───────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Answers From YOUR Data',
      description:
        'Your bot answers from your uploaded knowledge — not generic AI. Menus, policies, pricing, FAQs — all specific to your business.',
    },
    {
      icon: Globe,
      title: 'Deploy Anywhere',
      description:
        'Website widget, WhatsApp, Slack, Discord, Microsoft Teams, or API. One bot, every channel your customers use.',
    },
    {
      icon: Phone,
      title: 'Voice & Phone AI',
      description:
        'Your bot answers phone calls in natural human voice. Handles inquiries, takes orders, and transfers to humans when needed.',
    },
    {
      icon: Shield,
      title: 'Hallucination Control',
      description:
        'Built-in guardrails prevent your bot from making things up. It only answers from verified data or says "I don\'t know."',
    },
    {
      icon: Zap,
      title: 'Actions & Workflows',
      description:
        'Not just Q&A — your bot can book appointments, create tickets, process orders, and trigger custom workflows.',
    },
    {
      icon: Users,
      title: 'Human Handoff',
      description:
        'When things get complex, the bot seamlessly transfers to a human agent — with full conversation context.',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description:
        'See what customers ask, where the bot succeeds or fails, peak hours, sentiment analysis, and conversation trends.',
    },
    {
      icon: Languages,
      title: 'Multi-Language',
      description:
        'Your bot automatically detects and responds in 50+ languages. Serve global customers without extra setup.',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Everything You Need. Nothing You Don&apos;t.
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features that make your chatbot smarter, safer, and more
            capable than anything you&apos;ve seen.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── USE CASES ──────────────────────────────────────────

function UseCasesSection() {
  const useCases = [
    {
      icon: Utensils,
      title: 'Restaurants & Food',
      description: 'Answer menu questions, take orders, handle reservations, provide delivery info, answer phone calls.',
      example: '"Do you have vegan options? What\'s today\'s special?"',
    },
    {
      icon: ShoppingCart,
      title: 'E-Commerce',
      description: 'Product recommendations, order tracking, return policies, size guides, inventory checks.',
      example: '"Is this jacket available in large? What\'s your return policy?"',
    },
    {
      icon: Stethoscope,
      title: 'Healthcare',
      description: 'Appointment scheduling, insurance FAQs, symptom checkers, patient onboarding, office hours.',
      example: '"Do you accept Blue Cross insurance? Can I book a checkup?"',
    },
    {
      icon: GraduationCap,
      title: 'Education',
      description: 'Course info, admission FAQs, campus navigation, enrollment help, financial aid queries.',
      example: '"What are the prerequisites for CS 101? When is the deadline?"',
    },
    {
      icon: Building2,
      title: 'Real Estate',
      description: 'Property details, viewing scheduling, mortgage FAQs, neighborhood info, agent connection.',
      example: '"Is the Oak Street property still available? Can I schedule a tour?"',
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      description: 'Ticket creation, troubleshooting, account inquiries, knowledge base search, escalation.',
      example: '"My order hasn\'t arrived yet. Can you check the status?"',
    },
  ];

  return (
    <section id="use-cases" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            Use Cases
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            One Platform. Every Industry.
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Whatever your business, ProjectBots.AI builds the perfect AI assistant for it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="w-12 h-12 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center mb-4">
                <useCase.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {useCase.description}
              </p>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                  Example Question
                </p>
                <p className="text-sm text-gray-700 italic">
                  {useCase.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── TESTIMONIALS ───────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Owner, Golden Dragon Restaurant',
      text: 'Our phone used to ring non-stop with the same questions — hours, menu, delivery. Now the AI handles 80% of calls. My staff can focus on cooking, not answering phones.',
      stars: 5,
    },
    {
      name: 'Michael Torres',
      role: 'CTO, ShopifyPlus Store',
      text: 'We integrated ProjectBots.AI into our store in 15 minutes. It answers product questions, handles returns, and has reduced our support tickets by 60%.',
      stars: 5,
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Director, HealthFirst Clinic',
      text: 'Patients can now check insurance, book appointments, and get pre-visit instructions through the chatbot. It\'s like having a 24/7 receptionist.',
      stars: 5,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-linear-to-br from-gray-900/95 to-indigo-950/95 z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Loved by Businesses Everywhere
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
            >
              {/* Stars */}
              <div className="flex space-x-1 mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 leading-relaxed mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div>
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── PRICING PREVIEW ────────────────────────────────────

function PricingPreviewSection() {
    const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try it out with basic features',
      features: [
        '2 chatbots',
        '100 messages / month',
        '3 data sources',
        'Website widget',
        'Community support',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: '$1.99',
      period: '/month',
      description: 'For small businesses getting started',
      features: [
        '3 chatbots',
        '3,000 messages / month',
        'Multiple data sources',
        'Basic customization',
        'Email support',
        'Conversation history',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Business',
      price: '$2.99',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '6 chatbots',
        '6,000 messages / month',
        'All integrations',
        'Actions & workflows',
        'Analytics dashboard',
        'Team access (5 seats)',
        'Priority support',
        'Phone / Voice AI',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '$4.99',
      period: '/month',
      description: 'For large organizations',
      features: [
        'Unlimited chatbots',
        'Unlimited messages',
        'Custom AI model',
        'SSO & advanced security',
        'SLA guarantee',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced analytics',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-200 scale-105 relative'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase">
                  Most Popular
                </div>
              )}

              <h3
                className={`text-lg font-semibold ${
                  plan.highlighted ? 'text-white' : 'text-gray-900'
                }`}
              >
                {plan.name}
              </h3>

              <div className="mt-4 flex items-baseline">
                <span
                  className={`text-4xl font-extrabold ${
                    plan.highlighted ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`ml-1 text-sm ${
                    plan.highlighted ? 'text-indigo-100' : 'text-gray-500'
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <p
                className={`mt-2 text-sm ${
                  plan.highlighted ? 'text-indigo-100' : 'text-gray-500'
                }`}
              >
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start">
                    <CheckCircle2
                      className={`w-5 h-5 mr-2 shrink-0 ${
                        plan.highlighted ? 'text-indigo-200' : 'text-indigo-500'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.highlighted ? 'text-indigo-50' : 'text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === 'Enterprise' ? '#' : '/signup'}
                className={`mt-8 block w-full py-2.5 text-center text-sm font-semibold rounded-xl transition-all ${
                  plan.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── FAQ ────────────────────────────────────────────────

function FAQSection() {
  const faqs = [
    {
      question: 'How is ProjectBots.AI different from ChatGPT?',
      answer:
        'ChatGPT answers from its general training data. ProjectBots.AI creates chatbots that answer ONLY from YOUR uploaded data — your menus, policies, product info, FAQs. It\'s your business knowledge, powered by AI. No hallucination, no off-topic answers.',
    },
    {
      question: 'Do I need coding skills to use this?',
      answer:
        'Not at all! Upload your data (PDFs, documents, website URLs), configure settings through our visual dashboard, and get an embed code. If you can copy-paste, you can deploy a chatbot.',
    },
    {
      question: 'How does the Voice AI / phone feature work?',
      answer:
        'We provide you a phone number (or port your existing one). When customers call, our AI answers in a natural human voice, using your uploaded data to answer questions. If it can\'t handle something, it transfers to a real person with full context.',
    },
    {
      question: 'What happens when the bot can\'t answer a question?',
      answer:
        'You have full control. Options include: displaying a fallback message ("Let me connect you with our team"), collecting the customer\'s contact info, transferring to a live agent, or creating a support ticket — all configurable.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Absolutely. Your data is encrypted at rest and in transit. We don\'t use your data to train models. Each chatbot\'s data is completely isolated. We\'re SOC 2 compliant and GDPR ready.',
    },
    {
      question: 'Can I try it before paying?',
      answer:
        'Yes! Our free plan gives you 1 chatbot with 50 messages per month — no credit card required. It\'s fully functional so you can test everything before upgrading.',
    },
    {
      question: 'How accurate are the responses?',
      answer:
        'Very accurate, because the bot only answers from your verified data. We use RAG (Retrieval Augmented Generation) technology with built-in guardrails. If the answer isn\'t in your data, the bot says so instead of making things up.',
    },
    {
      question: 'Can I use it on WhatsApp and other platforms?',
      answer:
        'Yes! Business and Enterprise plans support WhatsApp, Slack, Discord, Microsoft Teams, and custom API integration. One bot, deployed everywhere your customers are.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span className="font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ─── FINAL CTA ──────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-linear-to-br from-indigo-600/95 to-purple-700/95 relative overflow-hidden z-10">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
          Ready to Build Your
          <br />
          AI-Powered Chatbot?
        </h2>
        <p className="mt-6 text-lg text-indigo-100 max-w-2xl mx-auto">
          Join thousands of businesses using ProjectBots.AI to automate customer
          conversations, reduce support costs, and deliver instant answers 24/7.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-all shadow-xl"
          >
            Start Building Free
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all"
          >
            View Pricing
          </Link>
        </div>
        <p className="mt-6 text-sm text-indigo-200">
          Free plan • No credit card • 5-minute setup
        </p>
      </div>
    </section>
  );
}