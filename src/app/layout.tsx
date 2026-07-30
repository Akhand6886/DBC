import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DBC Intelligence Platform | AI Data Governance System',
  description: 'AI-Based Intelligent Data Management and Governance System using Natural Language Processing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
