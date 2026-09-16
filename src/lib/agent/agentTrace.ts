/**
 * DBC Agent Execution Trace & Observability Engine
 * Instruments full-fidelity traces of agent thought-action-observation cycles,
 * tool inputs/outputs, query firewall evaluations, and latency flamegraphs.
 */

import { LLMProvider } from '../types';
import { RiskAssessment } from '../db/queryFirewall';

export type StepType = 
  | 'REASONING' 
  | 'TOOL_CALL' 
  | 'FIREWALL_EVALUATION' 
  | 'HUMAN_APPROVAL' 
  | 'DB_OBSERVATION' 
  | 'ERROR';

export interface TraceStep {
  stepIndex: number;
  type: StepType;
  title: string;
  timestamp: string;
  durationMs: number;
  toolName?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any>;
  riskAssessment?: RiskAssessment;
  tokensUsed?: number;
  costUSD?: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'PENDING';
  details?: string;
}

export interface TraceSession {
  id: string;
  prompt: string;
  timestamp: string;
  modelProvider: LLMProvider;
  modelName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED_BY_FIREWALL' | 'AWAITING_APPROVAL';
  totalDurationMs: number;
  totalTokens: number;
  totalCostUSD: number;
  steps: TraceStep[];
  summary?: string;
  finalOutput?: string;
}

type TraceListener = (session: TraceSession) => void;

export class AgentTraceEngine {
  private sessions: Map<string, TraceSession> = new Map();
  private listeners: Set<TraceListener> = new Set();
  private maxSessions = 50;

  public subscribe(listener: TraceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(session: TraceSession): void {
    this.listeners.forEach(fn => {
      try {
        fn(session);
      } catch (err) {
        console.error('Error in trace listener:', err);
      }
    });
  }

  public startSession(prompt: string, modelProvider: LLMProvider, modelName: string): TraceSession {
    const session: TraceSession = {
      id: `trace-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      prompt,
      timestamp: new Date().toLocaleTimeString(),
      modelProvider,
      modelName,
      status: 'RUNNING',
      totalDurationMs: 0,
      totalTokens: 0,
      totalCostUSD: 0,
      steps: []
    };

    this.sessions.set(session.id, session);
    this.trimOldSessions();
    this.notify(session);
    return session;
  }

  public addStep(sessionId: string, step: Omit<TraceStep, 'stepIndex' | 'timestamp'>): TraceStep | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const fullStep: TraceStep = {
      ...step,
      stepIndex: session.steps.length + 1,
      timestamp: new Date().toLocaleTimeString()
    };

    session.steps.push(fullStep);
    session.totalDurationMs += step.durationMs || 0;
    session.totalTokens += step.tokensUsed || 0;
    session.totalCostUSD += step.costUSD || 0;

    this.notify(session);
    return fullStep;
  }

  public completeSession(sessionId: string, finalOutput: string, summary?: string): TraceSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'COMPLETED';
    session.finalOutput = finalOutput;
    session.summary = summary || `Successfully executed agent plan with ${session.steps.length} steps.`;
    this.notify(session);
    return session;
  }

  public setStatus(sessionId: string, status: TraceSession['status'], summary?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = status;
    if (summary) session.summary = summary;
    this.notify(session);
  }

  public getSession(sessionId: string): TraceSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): TraceSession[] {
    return Array.from(this.sessions.values()).reverse();
  }

  public exportTraceJson(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '{}';
    return JSON.stringify(session, null, 2);
  }

  private trimOldSessions(): void {
    if (this.sessions.size > this.maxSessions) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }
  }
}

export const agentTraceEngine = new AgentTraceEngine();
