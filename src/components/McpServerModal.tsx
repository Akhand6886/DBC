'use client';

import React, { useState } from 'react';
import {
  Globe,
  X,
  Copy,
  Check,
  Server,
  Wrench,
  BookOpen,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Code2
} from 'lucide-react';
import { MCP_SERVER_INFO } from '../lib/mcp/mcpServer';

interface McpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpServerModal: React.FC<McpServerModalProps> = ({ isOpen, onClose }) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tools' | 'resources'>('config');

  if (!isOpen) return null;

  const endpointUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'http://localhost:3000/api/mcp';

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        dbc: {
          url: endpointUrl,
          transport: 'http'
        }
      }
    },
    null,
    2
  );

  const handleCopy = (text: string, isConfig: boolean) => {
    navigator.clipboard.writeText(text);
    if (isConfig) {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  const tools = [
    { name: 'dbc_execute_query', desc: 'Execute real SQL with Query Firewall validation and 1-click rollback snapshots.' },
    { name: 'dbc_introspect_schema', desc: 'Retrieve table definitions, column types, and foreign key relationships.' },
    { name: 'dbc_explain_query', desc: 'Run EXPLAIN execution plan analysis to detect sequential table scans.' },
    { name: 'dbc_suggest_indexes', desc: 'Generate B-Tree and Foreign Key index recommendations.' },
    { name: 'dbc_generate_migration', desc: 'Generate reversible UP and DOWN migration DDL scripts with data safety checks.' },
    { name: 'dbc_get_business_memory', desc: 'Fetch organizational domain invariants, soft-delete rules, and column semantics.' }
  ];

  const resources = [
    { uri: 'db://schema', desc: 'Live database table schema and column definitions.' },
    { uri: 'db://memory', desc: 'Active organizational domain invariants and column semantics.' },
    { uri: 'db://tables/users/sample', desc: 'Sampled live rows from the users table.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333333] bg-[#252526]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Model Context Protocol (MCP) Server
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/50 text-emerald-300 font-mono">
                  v{MCP_SERVER_INFO.version} ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Standards-compliant JSON-RPC 2.0 endpoint for external AI agents (Claude Desktop, Cursor, Antigravity).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#333333] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Endpoint Bar */}
        <div className="px-5 py-2.5 bg-[#141414] border-b border-[#333333] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-500 font-medium">Endpoint:</span>
            <span className="font-mono text-cyan-300 truncate text-[11px]">{endpointUrl}</span>
          </div>
          <button
            onClick={() => handleCopy(endpointUrl, false)}
            className="px-2.5 py-1 rounded bg-[#252526] hover:bg-[#333333] text-slate-300 hover:text-white flex items-center gap-1 border border-[#3c3c3c] text-[11px] shrink-0 transition"
          >
            {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedEndpoint ? 'Copied' : 'Copy URL'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 px-5 py-2 border-b border-[#333333] bg-[#1a1a1a] text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-[#252526]'
            }`}
          >
            Client Config (Claude Desktop / Cursor)
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'tools'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-[#252526]'
            }`}
          >
            Exposed Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'resources'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-[#252526]'
            }`}
          >
            Exposed Resources ({resources.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'config' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  Add this snippet to your <code className="text-cyan-300 font-mono">claude_desktop_config.json</code>:
                </span>
                <button
                  onClick={() => handleCopy(claudeDesktopConfig, true)}
                  className="px-2.5 py-1 rounded bg-[#252526] hover:bg-[#333333] text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-medium transition text-[11px]"
                >
                  {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedConfig ? 'Copied JSON' : 'Copy Config JSON'}</span>
                </button>
              </div>

              <pre className="bg-[#141414] border border-[#333333] rounded-lg p-3 font-mono text-cyan-300 text-xs overflow-x-auto">
                {claudeDesktopConfig}
              </pre>

              <div className="bg-[#252526] border border-[#333333] rounded p-3 text-slate-300 space-y-1 text-[11px]">
                <div className="font-semibold text-white">How it works:</div>
                <p className="text-slate-400">
                  External LLMs communicate with DBC over HTTP JSON-RPC 2.0. Queries invoked via external agents are evaluated by the <strong>Query Firewall</strong> and recorded in the <strong>Transaction Manager</strong> and <strong>Agent Trace Engine</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-2.5">
              {tools.map(t => (
                <div key={t.name} className="bg-[#252526] border border-[#333333] rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-mono font-bold text-white text-xs">{t.name}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] pl-5">{t.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-2.5">
              {resources.map(r => (
                <div key={r.uri} className="bg-[#252526] border border-[#333333] rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono font-bold text-cyan-300 text-xs">{r.uri}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] pl-5">{r.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#333333] bg-[#252526] text-xs">
          <span className="text-[11px] text-slate-400">
            JSON-RPC 2.0 specifications compliant • Protocol version: {MCP_SERVER_INFO.protocolVersion}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
