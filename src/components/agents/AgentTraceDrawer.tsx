'use client';

import React, { useState, useEffect } from 'react';
import {
  agentTraceEngine,
  TraceSession,
  TraceStep,
  StepType
} from '../../lib/agent/agentTrace';
import {
  Activity,
  X,
  Clock,
  Cpu,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Flame,
  Brain,
  Wrench,
  RotateCcw
} from 'lucide-react';

interface AgentTraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSessionId?: string;
}

export const AgentTraceDrawer: React.FC<AgentTraceDrawerProps> = ({
  isOpen,
  onClose,
  selectedSessionId,
}) => {
  const [sessions, setSessions] = useState<TraceSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [expandedStepIdx, setExpandedStepIdx] = useState<number | null>(null);

  // Subscribe to real-time trace updates
  useEffect(() => {
    const update = () => {
      const all = agentTraceEngine.getAllSessions();
      setSessions(all);
      if (!activeSessionId && all.length > 0) {
        setActiveSessionId(selectedSessionId || all[0].id);
      }
    };

    update();
    const unsubscribe = agentTraceEngine.subscribe(() => {
      update();
    });
    return () => unsubscribe();
  }, [selectedSessionId, activeSessionId]);

  if (!isOpen) return null;

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleExportJson = () => {
    if (!currentSession) return;
    const jsonStr = agentTraceEngine.exportTraceJson(currentSession.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dbc_trace_${currentSession.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case 'REASONING':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'TOOL_CALL':
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'FIREWALL_EVALUATION':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'HUMAN_APPROVAL':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'DB_OBSERVATION':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#1e1e1e] border-l border-[#333333] shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333333] bg-[#252526]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Agent Execution Trace & Telemetry
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 font-mono">
                P0 Observability
              </span>
            </h2>
            <p className="text-xs text-slate-400">Thought-action-observation step audit and flamegraph.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            title="Download Trace JSON"
            className="p-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-slate-300 transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#333333] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session Switcher */}
      {sessions.length > 1 && (
        <div className="px-5 py-2 border-b border-[#333333] bg-[#1a1a1a] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 shrink-0">Runs:</span>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`px-2.5 py-1 rounded shrink-0 font-mono text-[11px] transition ${
                s.id === currentSession?.id
                  ? 'bg-[#007acc] text-white font-semibold'
                  : 'bg-[#252526] text-slate-400 hover:text-white'
              }`}
            >
              {s.timestamp} ({s.steps.length} steps)
            </button>
          ))}
        </div>
      )}

      {currentSession ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Top Session Summary Card */}
          <div className="bg-[#252526] border border-[#333333] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate max-w-sm">
                &quot;{currentSession.prompt}&quot;
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                {currentSession.status}
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#333333]">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-medium">Latency</span>
                <span className="font-mono text-white text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {currentSession.totalDurationMs}ms
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-medium">Tokens</span>
                <span className="font-mono text-white text-xs font-semibold flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  {currentSession.totalTokens}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-medium">Cost</span>
                <span className="font-mono text-white text-xs font-semibold flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  ${currentSession.totalCostUSD.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-medium">Model</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block">
                  {currentSession.modelName}
                </span>
              </div>
            </div>

            {/* Flamegraph Latency Breakdown Bar */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Latency Flamegraph Breakdown:</span>
              <div className="h-2.5 w-full bg-[#141414] rounded-full overflow-hidden flex">
                {currentSession.steps.map((st, idx) => {
                  const widthPct = Math.max(
                    (st.durationMs / (currentSession.totalDurationMs || 1)) * 100,
                    5
                  );
                  const color =
                    st.type === 'REASONING'
                      ? 'bg-purple-500'
                      : st.type === 'FIREWALL_EVALUATION'
                      ? 'bg-amber-500'
                      : st.type === 'DB_OBSERVATION'
                      ? 'bg-emerald-500'
                      : 'bg-blue-500';
                  return (
                    <div
                      key={idx}
                      style={{ width: `${widthPct}%` }}
                      title={`${st.title} (${st.durationMs}ms)`}
                      className={`${color} h-full border-r border-[#1e1e1e] hover:brightness-125 transition`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0ms</span>
                <span>{currentSession.totalDurationMs}ms</span>
              </div>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Step-by-Step Execution Timeline ({currentSession.steps.length} steps)
            </h3>

            {currentSession.steps.map((step, idx) => {
              const isExpanded = expandedStepIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#252526] border border-[#333333] rounded-lg overflow-hidden transition hover:border-[#444444]"
                >
                  {/* Step Header */}
                  <div
                    onClick={() => setExpandedStepIdx(isExpanded ? null : idx)}
                    className="flex items-center justify-between p-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded bg-[#1e1e1e]">
                        {getStepIcon(step.type)}
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">#{step.stepIndex}</span>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {step.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {step.riskAssessment && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          step.riskAssessment.level === 'CRITICAL' ? 'bg-red-900/70 text-red-300' :
                          step.riskAssessment.level === 'HIGH' ? 'bg-amber-900/70 text-amber-300' :
                          'bg-emerald-900/50 text-emerald-300'
                        }`}>
                          Risk: {step.riskAssessment.level} ({step.riskAssessment.score})
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400">
                        {step.durationMs}ms
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Step Details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-[#2e2e2e] bg-[#1a1a1a] space-y-2.5 text-[11px]">
                      {step.details && (
                        <p className="text-slate-300 italic">{step.details}</p>
                      )}

                      {step.toolInput && (
                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                            Tool Input Parameters:
                          </span>
                          <pre className="bg-[#141414] border border-[#2a2a2a] p-2 rounded text-blue-300 font-mono overflow-x-auto">
                            {JSON.stringify(step.toolInput, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.toolOutput && (
                        <div>
                          <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                            Observation Output:
                          </span>
                          <pre className="bg-[#141414] border border-[#2a2a2a] p-2 rounded text-emerald-300 font-mono overflow-x-auto max-h-40">
                            {JSON.stringify(step.toolOutput, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.riskAssessment && step.riskAssessment.violations.length > 0 && (
                        <div className="bg-red-950/40 border border-red-500/30 p-2 rounded text-red-300">
                          <span className="font-semibold block text-[10px] uppercase">Firewall Violations:</span>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {step.riskAssessment.violations.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final Output / Synthesis */}
          {currentSession.finalOutput && (
            <div className="bg-[#252526] border border-blue-500/30 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Final Synthesized Agent Output
              </span>
              <div className="text-slate-300 text-xs whitespace-pre-wrap font-sans">
                {currentSession.finalOutput}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
          No agent execution traces recorded yet. Run a prompt in Mission Control to generate traces.
        </div>
      )}
    </div>
  );
};
