import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RobotBackground from '@/components/RobotBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProjectBots.AI — AI-Powered Custom Chatbots for Any Business',
  description:
    'Build intelligent AI chatbots that answer from YOUR data. Deploy on website, WhatsApp, phone, Slack, and more. No coding required.',
  keywords: 'AI chatbot, custom chatbot, chatbot builder, AI agent, customer support bot, WhatsApp chatbot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-indigo-950`} suppressHydrationWarning>
        {/* Robot background renders on EVERY page */}
        <RobotBackground />
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}