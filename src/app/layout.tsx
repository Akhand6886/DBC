import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ToastProvider';

export const metadata: Metadata = {
  title: 'Agentic AI IDE | Database Management & Dual-Path Router',
  description: 'Next-Generation Agentic AI Integrated Development Environment with Dual-Path Router, Database Management, and BYOK Model Support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen w-screen overflow-hidden bg-ide-bg text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
