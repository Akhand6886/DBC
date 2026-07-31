import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ToastProvider';

export const metadata: Metadata = {
  title: 'Agentic AI IDE | Confidence-Scored Hybrid Router',
  description: 'Next-Generation Agentic AI Integrated Development Environment with Dual-Path Router, Shadow Workspace Verification, and BYOK Model Support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-ide-bg text-slate-100 font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
