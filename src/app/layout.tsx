import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic AI IDE | Confidence-Scored Hybrid Router',
  description: 'Next-Generation Agentic AI Integrated Development Environment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden bg-ide-bg text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
