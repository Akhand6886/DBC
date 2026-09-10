'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('dbc_workspace_cache');
      localStorage.removeItem('dbc_system_metrics');
      localStorage.removeItem('dbc_router_config');
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const details = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#1e1e1e] text-slate-200 flex flex-col items-center justify-center p-6 font-mono select-none">
          <div className="max-w-xl w-full bg-[#252526] border border-[#3c3c3c] rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-[#3c3c3c]">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                  Application Resilience Boundary
                </h1>
                <p className="text-[11px] text-slate-400">
                  An unexpected UI runtime exception occurred, but the shell was preserved.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl p-3.5 space-y-1.5 text-xs text-rose-300">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Exception Details:</span>
              <div className="font-semibold break-words">
                {this.state.error?.message || 'Unknown error occurred in component tree.'}
              </div>
            </div>

            {/* Stack trace preview */}
            {this.state.error?.stack && (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Stack Trace:</span>
                <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-2.5 text-[10px] text-slate-400 max-h-36 overflow-y-auto font-mono">
                  <pre>{this.state.error.stack}</pre>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#3c3c3c]">
              <div className="flex items-center space-x-2">
                <button
                  onClick={this.handleReload}
                  className="bg-[#007acc] hover:bg-[#005a9e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reload Session</span>
                </button>
                <button
                  onClick={this.handleResetCache}
                  className="bg-[#2d2d2d] hover:bg-[#3c3c3c] text-rose-300 border border-[#3c3c3c] px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset Corrupted Cache</span>
                </button>
              </div>

              <button
                onClick={this.handleCopyError}
                className="bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#3c3c3c] text-slate-300 px-2.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Diagnostics</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
