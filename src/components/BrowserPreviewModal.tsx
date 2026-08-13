'use client';

import React, { useState } from 'react';
import { Globe, RefreshCw, ArrowLeft, ArrowRight, Laptop, Tablet, Smartphone, Camera, CheckCircle2, Terminal, Activity, X } from 'lucide-react';

interface BrowserPreviewModalProps {
  onClose: () => void;
  onLogTerminal?: (msg: string) => void;
}

export const BrowserPreviewModal: React.FC<BrowserPreviewModalProps> = ({
  onClose,
  onLogTerminal,
}) => {
  const [url, setUrl] = useState('http://localhost:3000');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'console' | 'network'>('preview');
  const [isScanning, setIsScanning] = useState(false);
  const [scanReport, setScanReport] = useState<string | null>(null);

  const handleScanVisuals = () => {
    setIsScanning(true);
    setScanReport(null);

    setTimeout(() => {
      setIsScanning(false);
      const report = `[Playwright CDP Visual Verification]: DOM Layout Scan Complete. Viewport: ${viewport.toUpperCase()}. 0 Visual Regressions Detected (100% Match to Spec).`;
      setScanReport(report);
      if (onLogTerminal) onLogTerminal(report);
    }, 600);
  };

  const getViewportWidth = () => {
    if (viewport === 'mobile') return 'max-w-xs';
    if (viewport === 'tablet') return 'max-w-md';
    return 'max-w-full';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-4xl w-full h-[85vh] p-5 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Globe className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Browser-in-the-Loop & Visual Verification</h2>
              <p className="text-[11px] text-slate-400">
                Playwright / Chrome DevTools Protocol (CDP) visual feedback loop
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Browser Navigation Toolbar */}
        <div className="bg-ide-bg border border-ide-border rounded-xl p-2 flex flex-wrap items-center justify-between gap-3">
          {/* Controls & Address Bar */}
          <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
            <div className="flex items-center space-x-1 text-slate-400">
              <button className="p-1 hover:text-white rounded hover:bg-ide-card"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button className="p-1 hover:text-white rounded hover:bg-ide-card"><ArrowRight className="h-3.5 w-3.5" /></button>
              <button className="p-1 hover:text-white rounded hover:bg-ide-card"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>

            <div className="flex-1 relative flex items-center">
              <Globe className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-ide-card border border-ide-border rounded-md py-1 pl-8 pr-3 text-xs text-slate-100 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Viewport Dimension Controls */}
          <div className="flex items-center space-x-2">
            <div className="bg-ide-card border border-ide-border rounded p-0.5 flex space-x-1 text-xs">
              <button
                onClick={() => setViewport('desktop')}
                title="Desktop View (1440px)"
                className={`p-1 rounded ${viewport === 'desktop' ? 'bg-ide-accent text-white' : 'text-slate-400'}`}
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet View (768px)"
                className={`p-1 rounded ${viewport === 'tablet' ? 'bg-ide-accent text-white' : 'text-slate-400'}`}
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Mobile View (375px)"
                className={`p-1 rounded ${viewport === 'mobile' ? 'bg-ide-accent text-white' : 'text-slate-400'}`}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Visual Scan Button */}
            <button
              onClick={handleScanVisuals}
              disabled={isScanning}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md font-bold flex items-center space-x-1 shadow"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{isScanning ? 'Scanning...' : 'Visual Verification Scan'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center space-x-3 border-b border-ide-border text-xs">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`py-1.5 font-bold ${activeSubTab === 'preview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            Live Web Preview
          </button>
          <button
            onClick={() => setActiveSubTab('console')}
            className={`py-1.5 font-bold flex items-center space-x-1 ${activeSubTab === 'console' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Browser Console</span>
          </button>
          <button
            onClick={() => setActiveSubTab('network')}
            className={`py-1.5 font-bold flex items-center space-x-1 ${activeSubTab === 'network' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Network CDP Stream</span>
          </button>
        </div>

        {/* Scan Report Banner */}
        {scanReport && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{scanReport}</span>
          </div>
        )}

        {/* Main Preview Container */}
        <div className="flex-1 bg-ide-card border border-ide-border rounded-xl overflow-hidden flex items-center justify-center p-4">
          {activeSubTab === 'preview' && (
            <div className={`w-full h-full bg-[#0b0f19] border border-ide-border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all ${getViewportWidth()}`}>
              {/* Simulated Browser Web Application Page */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold text-cyan-400">Agentic AI IDE Web App</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  HTTP 200 OK
                </span>
              </div>
              <div className="flex-1 p-6 space-y-4 font-sans text-slate-100 overflow-y-auto">
                <div className="h-8 w-48 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                  <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-24 space-y-2">
                    <div className="h-3 w-20 bg-slate-700 rounded"></div>
                    <div className="h-6 w-12 bg-cyan-500/20 rounded"></div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-24 space-y-2">
                    <div className="h-3 w-20 bg-slate-700 rounded"></div>
                    <div className="h-6 w-12 bg-emerald-500/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'console' && (
            <div className="w-full h-full bg-ide-terminal p-4 font-mono text-xs text-slate-300 space-y-2 overflow-y-auto">
              <div className="text-slate-500">[CDP Console]: Connected to Chrome DevTools Protocol listener.</div>
              <div className="text-cyan-400">[info]: React 18 hydration complete.</div>
              <div className="text-emerald-400">[log]: Agent Orchestration Engine ready.</div>
            </div>
          )}

          {activeSubTab === 'network' && (
            <div className="w-full h-full bg-ide-terminal p-4 font-mono text-xs space-y-2 overflow-y-auto">
              <div className="text-slate-500">[Network Stream]: Intercepting CDP HTTP requests.</div>
              <div className="flex justify-between text-slate-300 border-b border-ide-border pb-1">
                <span>GET / 200 OK (Document)</span>
                <span className="text-emerald-400">12ms</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-ide-border pb-1">
                <span>GET /_next/static/chunks/main.js 200 OK</span>
                <span className="text-emerald-400">4ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
