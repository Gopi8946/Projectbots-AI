import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RobotBackground from '@/components/RobotBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProjectBots.AI — AI-Powered Custom Chatbots for Any Business',
  description: 'Build intelligent AI chatbots that answer from YOUR data. Deploy on website, WhatsApp, phone, Slack, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <RobotBackground />
        <Navbar />
        <main className="relative" style={{ zIndex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}