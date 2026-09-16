'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LLMProvider,
  ShadowDiffCheck,
  RouterConfig,
  AgentExecutionPlan,
  ChatMessage
} from '../lib/types';
import { previewDeveloperIntent, executeRoutedPrompt } from '../lib/router/routerEngine';
import { DEFAULT_ROUTER_CONFIG } from '../lib/router/intentClassifier';
import { dbAgentRuntime } from '../lib/agent/dbAgentRuntime';
import {
  Bot,
  Send,
  Sparkles,
  Sliders,
  Zap,
  Cpu,
  Clock,
  DollarSign,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  X,
  Trash2,
  Copy,
  Check,
  User,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  ArrowRight,
  Flame,
  Database,
  Brain,
  Server
} from 'lucide-react';
import { specializedAgents, AgentPersonaId, SPECIALIZED_PERSONAS } from '../lib/agent/specializedAgents';
import { dbMemory } from '../lib/db/dbMemory';

interface MissionControlProps {
  activeFilePath?: string;
  activeFileContent?: string;
  routerConfig?: RouterConfig;
  lastExecutionPlan?: AgentExecutionPlan | null;
  onApplyPatch: (newContent: string, diffCheck: ShadowDiffCheck) => void;
  onExecutePlan?: (plan: AgentExecutionPlan) => void;
  onOpenRouterConfig?: () => void;
  onOpenRouterTrace?: () => void;
  onOpenAgentTrace?: (sessionId?: string) => void;
  onOpenDbMemory?: () => void;
  onOpenMcpServer?: () => void;
  onClose?: () => void;
  onLogTerminal?: (msg: string) => void;
}

const STORAGE_KEY = 'dbc_copilot_chat_history';

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  role: 'assistant',
  content: `### Welcome to DBC Copilot & Mission Control AI 👋\n\nI operate in **P1 Specialized Database Agent Mode** with **Domain Memory** & **MCP Server**:\n- **Specialized Personas**: DBA Optimizer, Schema Architect, Data Analyst, Security Auditor.\n- **Database Memory**: Domain context, table semantics, and business invariant policies.\n- **Query Firewall & Traces**: Risk scoring (0-100), blast radius estimator, and full flamegraph.\n- **MCP Protocol**: Standardized JSON-RPC 2.0 interface for Claude Desktop & Cursor.\n\nChoose an agent persona above or click a recommended trigger below to begin!`,
  status: 'success'
};

export const MissionControl: React.FC<MissionControlProps> = ({
  activeFilePath,
  activeFileContent = '',
  routerConfig = DEFAULT_ROUTER_CONFIG,
  lastExecutionPlan = null,
  onApplyPatch,
  onExecutePlan,
  onOpenRouterConfig,
  onOpenRouterTrace,
  onOpenAgentTrace,
  onOpenDbMemory,
  onOpenMcpServer,
  onClose,
  onLogTerminal,
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [selectedPersona, setSelectedPersona] = useState<AgentPersonaId>('dba_optimizer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTriggers, setShowTriggers] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDbMode, setIsDbMode] = useState(true);

  // Chat message history with localStorage persistence
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [INITIAL_GREETING];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore parsing errors
    }
    return [INITIAL_GREETING];
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save history changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage quota errors
    }
  }, [messages]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Real-time confidence preview as developer types
  const routePreview = useMemo(() => {
    if (!prompt.trim()) return null;
    return previewDeveloperIntent(prompt, activeFilePath, routerConfig);
  }, [prompt, activeFilePath, routerConfig]);

  const handleClearHistory = () => {
    setMessages([INITIAL_GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isProcessing) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `msg-${Date.now()}-user`;

    // 1. Add user message
    const userMessage: ChatMessage = {
      id: userMsgId,
      timestamp: timeStr,
      role: 'user',
      content: trimmedPrompt,
      status: 'success'
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsProcessing(true);

    const isDbRelated = isDbMode || /\b(select|from|table|index|schema|column|database|query|explain|migrate|migration|drop|delete|update|truncate|insert)\b/i.test(trimmedPrompt);

    if (isDbRelated) {
      try {
        const persona = specializedAgents.getPersona(selectedPersona);
        const agentRes = await specializedAgents.runPersonaAgent(
          selectedPersona,
          trimmedPrompt,
          provider,
          'users'
        );

        if (onLogTerminal) {
          onLogTerminal(`[DBC Specialized Agent - ${persona.badge}]: Completed ReAct loop in ${agentRes.totalDurationMs}ms with tools [${agentRes.toolsExecuted.join(', ')}]`);
        }

        const assistantMsgId = `msg-${Date.now()}-assistant`;
        const assistantMessage: ChatMessage = {
          id: assistantMsgId,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'assistant',
          content: agentRes.replyText,
          routePath: 'AGENTIC_LLM_PATH',
          provider,
          confidenceScore: 96,
          executionTimeMs: agentRes.totalDurationMs,
          tokenCostUSD: agentRes.totalCostUSD,
          logMessage: `[${persona.badge}]: Tools: ${agentRes.toolsExecuted.join(', ')} • Session: ${agentRes.sessionId}`,
          explanation: `${persona.name} executed ${agentRes.toolsExecuted.length} typed database tool(s) with context from Database Memory.`,
          status: 'success'
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        if (onLogTerminal) onLogTerminal(`[DBC DB Agent Error]: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const isFast = routePreview?.isFastPath ?? true;
    const simDelay = isFast ? 90 : 750;

    setTimeout(() => {
      setIsProcessing(false);

      const result = executeRoutedPrompt({
        prompt: trimmedPrompt,
        targetFilePath: activeFilePath,
        currentContent: activeFileContent,
        provider,
        config: routerConfig
      });

      if (onLogTerminal) {
        onLogTerminal(result.logMessage);
      }

      if (onExecutePlan) {
        onExecutePlan(result.plan);
      }

      onApplyPatch(result.proposedContent, result.diffCheck);

      const assistantMsgId = `msg-${Date.now()}-assistant`;
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        role: 'assistant',
        content: result.replyText,
        routePath: result.plan.routerPath,
        provider,
        confidenceScore: result.plan.confidenceScore,
        executionTimeMs: result.plan.executionTimeMs,
        tokenCostUSD: result.plan.tokenCostUSD,
        explanation: result.plan.intent.explanation,
        logMessage: result.logMessage,
        diffCheck: result.diffCheck,
        proposedContent: result.proposedContent,
        status: 'success'
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, simDelay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full sm:w-[420px] fixed sm:relative right-0 top-0 bottom-0 sm:top-auto sm:bottom-auto z-40 sm:z-auto bg-[#252526] border-l border-[#3c3c3c] flex flex-col h-full font-mono text-xs select-none shadow-2xl sm:shadow-none">
      {/* Panel Top Header */}
      <div className="px-3 py-2.5 border-b border-[#3c3c3c] flex items-center justify-between bg-[#2d2d2d] shrink-0">
        <div className="flex items-center space-x-2 text-white font-sans font-bold text-xs">
          <Bot className="h-4 w-4 text-[#007acc]" />
          <span>Mission Control AI</span>
          <span className="text-[10px] bg-[#007acc]/20 text-[#007acc] border border-[#007acc]/30 px-1.5 py-0.2 rounded-full font-mono font-normal">
            {messages.filter((m) => m.role === 'user').length} msgs
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {lastExecutionPlan && (
            <button
              onClick={onOpenRouterTrace}
              title="Inspect Last Router Execution Trace"
              className="p-1 hover:bg-[#3c3c3c] rounded text-[#007acc] hover:text-white transition-colors"
            >
              <FileCode className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={onOpenRouterConfig}
            title="Configure Confidence Thresholds & Rules"
            className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-white transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* P1 DB Memory Hub */}
          {onOpenDbMemory && (
            <button
              onClick={onOpenDbMemory}
              title="Database Memory & Domain Invariant Rules (P1)"
              className="p-1 hover:bg-[#3c3c3c] rounded text-emerald-400 hover:text-emerald-300 transition"
            >
              <Brain className="h-3.5 w-3.5" />
            </button>
          )}

          {/* P1 MCP Server Hub */}
          {onOpenMcpServer && (
            <button
              onClick={onOpenMcpServer}
              title="Model Context Protocol (MCP) Server Hub (P1)"
              className="p-1 hover:bg-[#3c3c3c] rounded text-purple-400 hover:text-purple-300 transition"
            >
              <Server className="h-3.5 w-3.5" />
            </button>
          )}

          {/* P0 DB Agent Mode Toggle */}
          <button
            onClick={() => setIsDbMode(!isDbMode)}
            title="Toggle Database Agent Runtime Mode"
            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition ${
              isDbMode
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-[#1e1e1e] text-slate-400 border-[#3c3c3c] hover:text-white'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>DB Agent</span>
          </button>

          {onOpenAgentTrace && (
            <button
              onClick={() => onOpenAgentTrace()}
              title="Open Agent Execution Trace (Flamegraph)"
              className="p-1 hover:bg-[#3c3c3c] rounded text-amber-400 hover:text-amber-300 transition"
            >
              <Flame className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Model Provider Selector */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as LLMProvider)}
            className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-[10px] text-[#cccccc] focus:outline-none focus:border-[#007acc]"
          >
            <option value="anthropic">Claude 3.5</option>
            <option value="openai">GPT-4o</option>
            <option value="gemini">Gemini 1.5</option>
            <option value="nvidia">NVIDIA NIM (Kimi K3)</option>
            <option value="ollama">Ollama (Offline)</option>
          </select>

          {onClose && (
            <button
              onClick={onClose}
              title="Close AI Panel"
              className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* P1 Specialized Agent Persona Selector */}
      {isDbMode && (
        <div className="px-3 py-1.5 bg-[#202020] border-b border-[#3c3c3c] flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            <Bot className="h-3 w-3 text-cyan-400" />
            <span>Persona:</span>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {(Object.keys(SPECIALIZED_PERSONAS) as AgentPersonaId[]).map((pId) => {
              const p = SPECIALIZED_PERSONAS[pId];
              const isSelected = selectedPersona === pId;
              const shortName = pId === 'dba_optimizer' ? 'DBA' : pId === 'schema_architect' ? 'Schema' : pId === 'data_analyst' ? 'Analyst' : 'Security';
              return (
                <button
                  key={pId}
                  onClick={() => setSelectedPersona(pId)}
                  title={`${p.name}: ${p.tagline}`}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#007acc] text-white border-[#0098ff] font-bold shadow-xs'
                      : 'bg-[#2d2d2d] text-slate-400 hover:text-white border-[#3c3c3c]'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Quick Prompt Recommendations */}
      <div className="border-b border-[#3c3c3c] bg-[#1e1e1e]/40 shrink-0">
        <button
          onClick={() => setShowTriggers((prev) => !prev)}
          className="w-full px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            <span>
              {isDbMode ? `${SPECIALIZED_PERSONAS[selectedPersona].badge} Triggers` : 'Router Fast-Path Triggers'}
            </span>
          </span>
          {showTriggers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showTriggers && (
          <div className="px-2.5 pb-2 flex flex-wrap gap-1">
            {(isDbMode
              ? SPECIALIZED_PERSONAS[selectedPersona].recommendedTriggers.map(t => ({ label: t.label, q: t.prompt }))
              : [
                  { label: 'Format SQL', q: 'format sql query' },
                  { label: 'Optimize Query', q: 'optimize sql query' },
                  { label: 'Fix Syntax', q: 'fix sql syntax errors' }
                ]
            ).map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item.q);
                  textareaRef.current?.focus();
                }}
                className="text-[10px] bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-slate-300 px-1.5 py-0.5 rounded transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Conversation & History Thread */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#1e1e1e]/60"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isFast = msg.routePath === 'DETERMINISTIC_FAST_PATH';

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Meta Info */}
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    <User className="h-3 w-3 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 text-[#007acc]" />
                    <span className="font-semibold text-slate-300">
                      {msg.provider ? msg.provider.toUpperCase() : 'DBC AI'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[95%] rounded-xl p-3 text-xs leading-relaxed border shadow-md ${
                  isUser
                    ? 'bg-[#007acc]/20 border-[#007acc]/40 text-slate-100 rounded-tr-none'
                    : 'bg-[#252526] border-[#3c3c3c] text-slate-200 rounded-tl-none space-y-2'
                }`}
              >
                {/* Route Header Badge for Assistant */}
                {!isUser && msg.routePath && (
                  <div className="flex items-center justify-between pb-2 border-b border-[#3c3c3c] text-[10px]">
                    <div className="flex items-center space-x-1.5">
                      {isFast ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>Fast-Path ({msg.confidenceScore}%)</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
                          <Cpu className="h-3 w-3" />
                          <span>LLM Escalation ({msg.confidenceScore}%)</span>
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400">
                      ~{msg.executionTimeMs}ms • ${msg.tokenCostUSD?.toFixed(4) || '0.00'}
                    </span>
                  </div>
                )}

                {/* Content Body */}
                <div className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed select-text space-y-1">
                  {msg.content.split('\n\n').map((para, pIdx) => {
                    // Header rendering
                    if (para.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="font-bold text-white text-xs pt-1">
                          {para.replace('### ', '')}
                        </h4>
                      );
                    }
                    return <p key={pIdx}>{para}</p>;
                  })}
                </div>

                {/* Action Footer for Assistant Diffs */}
                {!isUser && msg.diffCheck && (
                  <div className="pt-2 border-t border-[#3c3c3c] flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-400 truncate max-w-[200px]">
                      <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{msg.diffCheck.targetFile}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          if (msg.diffCheck && msg.proposedContent) {
                            onApplyPatch(msg.proposedContent, msg.diffCheck);
                          }
                        }}
                        className="px-2 py-1 rounded bg-[#007acc] hover:bg-[#0062a3] text-white font-bold flex items-center space-x-1 transition-colors shadow"
                        title="Inspect and apply shadow diff"
                      >
                        <span>Apply Diff</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Observability & Trace Action for Assistant */}
                {!isUser && (
                  <div className="pt-1.5 border-t border-[#333333] flex items-center justify-between text-[10px]">
                    {onOpenAgentTrace ? (
                      <button
                        onClick={() => onOpenAgentTrace()}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition hover:underline"
                      >
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>View Execution Trace & Flamegraph</span>
                      </button>
                    ) : <span />}

                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="px-2 py-0.5 rounded bg-[#1e1e1e] hover:bg-[#3c3c3c] text-slate-400 hover:text-white flex items-center gap-1 border border-[#333333] transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-2.5 w-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Processing Indicator Bubble */}
        {isProcessing && (
          <div className="flex flex-col space-y-1 items-start animate-in fade-in duration-150">
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
              <Bot className="h-3 w-3 text-[#007acc]" />
              <span className="font-semibold text-slate-300">DBC AI</span>
              <span>•</span>
              <span>Thinking...</span>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl rounded-tl-none p-3 text-xs text-slate-300 flex items-center space-x-2.5 shadow-md">
              <Sparkles className="h-4 w-4 animate-spin text-yellow-300 shrink-0" />
              <span>
                {routePreview?.isFastPath
                  ? '⚡ Compiling via Deterministic Fast-Path (~3ms)...'
                  : `🧠 Escalating reasoning to ${provider.toUpperCase()} (~800ms)...`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live Confidence Preview Banner above Input */}
      {routePreview && (
        <div className="px-3 py-2 border-t border-[#3c3c3c] bg-[#1e1e1e] space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-bold">Predicted Route:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                routePreview.isFastPath
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              {routePreview.intent.confidenceScore}% (Thresh: {routerConfig.confidenceThreshold}%)
            </span>
          </div>

          <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                routePreview.isFastPath ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${routePreview.intent.confidenceScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
            <div className="flex items-center space-x-1">
              {routePreview.isFastPath ? (
                <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                  <Zap className="h-3 w-3" />
                  <span>⚡ Deterministic Fast-Path (~3ms, $0.00)</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center space-x-1 font-bold">
                  <Cpu className="h-3 w-3" />
                  <span>🧠 Agentic LLM Escalation</span>
                </span>
              )}
            </div>
            <span className="text-slate-400">
              ~{routePreview.estimatedLatencyMs}ms | ${routePreview.estimatedCostUSD.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Prompt Composer Docked at Bottom */}
      <div className="p-3 border-t border-[#3c3c3c] bg-[#252526] space-y-2 shrink-0">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Ask AI Copilot (e.g. 'explain slow query', 'rename table', 'format sql')... Enter to send"
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-2.5 pr-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#007acc] resize-none font-mono"
          />
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !prompt.trim()}
            className="absolute right-2 bottom-3 p-1.5 bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-30 disabled:hover:bg-[#007acc] text-white rounded-md transition-all shadow"
            title="Send Message (Enter)"
          >
            {isProcessing ? (
              <Sparkles className="h-3.5 w-3.5 animate-spin text-yellow-300" />
            ) : (
              <CornerDownLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Shift+Enter for new line</span>
          <span>{activeFilePath ? `Context: ${activeFilePath}` : 'No active file'}</span>
        </div>
      </div>
    </div>
  );
};
