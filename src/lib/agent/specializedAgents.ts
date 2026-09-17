/**
 * DBC Specialized Database Agent Personas
 * Pre-configured expert personas tailored for database administration,
 * schema engineering, analytics, and security governance.
 */

import { LLMProvider } from '../types';
import { dbMemory } from '../db/dbMemory';
import { dbAgentRuntime, AgentRunResult } from './dbAgentRuntime';

export type AgentPersonaId = 
  | 'dba_optimizer' 
  | 'schema_architect' 
  | 'data_analyst' 
  | 'security_auditor';

export interface AgentPersona {
  id: AgentPersonaId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  systemDirective: string;
  recommendedTriggers: { label: string; prompt: string }[];
  primaryTools: string[];
}

export const SPECIALIZED_PERSONAS: Record<AgentPersonaId, AgentPersona> = {
  dba_optimizer: {
    id: 'dba_optimizer',
    name: 'DBA & Performance Optimizer',
    badge: 'DBA Optimizer',
    tagline: 'Index Tuning & Sequential Scan Bottlenecks',
    description: 'Specializes in execution plans, B-Tree indexing, memory buffers, and query execution cost optimization.',
    systemDirective: `You are a Principal Database Administrator (DBA) inside DBC. Your primary mission is to minimize query latency and computational cost.
Analyze query execution plans, identify sequential table scans, recommend optimal composite or partial indexes, and eliminate Cartesian joins.
Always benchmark proposed optimizations with estimated cost reductions.`,
    recommendedTriggers: [
      { label: 'Analyze Slow Query', prompt: 'analyze slow query on users and suggest optimal indexes' },
      { label: 'Explain Plan', prompt: 'explain query plan for SELECT * FROM users WHERE role_id = 1;' },
      { label: 'Index Coverage Audit', prompt: 'audit current table schema and recommend missing foreign key indexes' }
    ],
    primaryTools: ['explain_query', 'suggest_indexes', 'execute_query']
  },

  schema_architect: {
    id: 'schema_architect',
    name: 'Schema Migration Architect',
    badge: 'Schema Architect',
    tagline: 'Relational DDL & Zero-Downtime Migrations',
    description: 'Specializes in relational schema modeling, 3NF normalization, foreign key constraints, and safe reversible UP/DOWN migrations.',
    systemDirective: `You are a Principal Database Architect inside DBC. Your priority is schema integrity, normalization, and zero-downtime migrations.
Ensure every DDL change is reversible with a corresponding DOWN script.
Never propose direct irreversible destructive drops without two-phase column deprecation workflows.`,
    recommendedTriggers: [
      { label: 'Add Column Migration', prompt: 'generate migration to add metadata JSON column to users' },
      { label: 'Inspect Schema DDL', prompt: 'introspect active database schema and review relationships' },
      { label: 'Design Audit Table', prompt: 'generate migration to create an audit_logs table with user foreign key' }
    ],
    primaryTools: ['introspect_schema', 'generate_migration', 'validate_syntax']
  },

  data_analyst: {
    id: 'data_analyst',
    name: 'Data Analyst & BI Specialist',
    badge: 'Data Analyst',
    tagline: 'SQL Analytics, Aggregations & Cohort Reporting',
    description: 'Specializes in statistical queries, multi-table aggregations, window functions, and business metric extraction.',
    systemDirective: `You are a Lead Data Analyst inside DBC. Your goal is delivering accurate business metrics and statistical insights from live database tables.
Formulate clear, ANSI-standard SQL queries using window functions, CTEs, and grouping.
Always verify data sampling before executing heavy aggregations.`,
    recommendedTriggers: [
      { label: 'Sample Table Distribution', prompt: 'sample table data from users to inspect record distributions' },
      { label: 'Role Aggregation Report', prompt: 'SELECT r.role_name, COUNT(u.id) as user_count FROM roles r LEFT JOIN users u ON r.id = u.role_id GROUP BY r.role_name;' },
      { label: 'User Activity Summary', prompt: 'summarize active user counts across configured roles' }
    ],
    primaryTools: ['sample_table_data', 'execute_query', 'introspect_schema']
  },

  security_auditor: {
    id: 'security_auditor',
    name: 'Security & Governance Auditor',
    badge: 'Security Auditor',
    tagline: 'Firewall Policy, PII Protection & Risk Blast Radius',
    description: 'Specializes in SQL injection prevention, principle of least privilege, PII detection, and compliance auditing.',
    systemDirective: `You are a Chief Database Security Officer inside DBC. Your mission is preventing data exfiltration, accidental deletion, and policy violations.
Audit queries for unconstrained WHERE clauses, injection vectors, and unauthorized DDL operations.
Enforce compliance with organizational business invariant rules stored in Database Memory.`,
    recommendedTriggers: [
      { label: 'Audit Destructive Risks', prompt: 'DELETE FROM users;' },
      { label: 'Check Admin Protection', prompt: 'verify domain rules protecting root administrator accounts' },
      { label: 'Inspect Invariant Rules', prompt: 'review active domain business rules from database memory' }
    ],
    primaryTools: ['execute_query', 'validate_syntax', 'introspect_schema']
  }
};

export class SpecializedAgentCoordinator {
  private personaDomainKeywords: Record<AgentPersonaId, string[]> = {
    dba_optimizer: [
      'index', 'indices', 'scan', 'slow', 'latency', 'optimize', 'cost', 'plan',
      'explain', 'bottleneck', 'btree', 'cartesian', 'tuning', 'benchmark', 'perf'
    ],
    schema_architect: [
      'schema', 'migrate', 'migration', 'alter', 'ddl', 'foreign key', 'normalization',
      '3nf', 'constraint', 'relation', 'table design', 'up', 'down', 'add column', 'create table'
    ],
    data_analyst: [
      'aggregate', 'analytics', 'analysis', 'cohort', 'report', 'sum', 'count',
      'avg', 'average', 'group by', 'window', 'metrics', 'sample', 'distribution', 'bi', 'kpi', 'trend'
    ],
    security_auditor: [
      'security', 'audit', 'firewall', 'pii', 'privilege', 'admin', 'root',
      'injection', 'drop', 'delete', 'truncate', 'invariant', 'risk', 'compliance', 'blast radius', 'leak'
    ]
  };

  /**
   * Intelligently classify user intent and match with the optimal specialized persona
   * using multi-term token weighting and trigger heuristics.
   */
  public matchPersona(prompt: string): { persona: AgentPersona; confidence: number; matchedKeywords: string[] } {
    const promptClean = prompt.toLowerCase();
    const words = promptClean.split(/[\s,.;:!?()]+/).filter(Boolean);

    let bestPersonaId: AgentPersonaId = 'dba_optimizer';
    let highestScore = 0;
    let bestMatchedKeywords: string[] = [];

    (Object.keys(SPECIALIZED_PERSONAS) as AgentPersonaId[]).forEach((id) => {
      const keywords = this.personaDomainKeywords[id] || [];
      const matched = keywords.filter((kw) => {
        if (kw.includes(' ')) {
          return promptClean.includes(kw);
        }
        return words.includes(kw) || promptClean.includes(kw);
      });

      // Check trigger heuristics
      const triggerMatch = SPECIALIZED_PERSONAS[id].recommendedTriggers.some((t) =>
        promptClean.includes(t.prompt.toLowerCase()) || promptClean.includes(t.label.toLowerCase())
      );

      const score = matched.length * 20 + (triggerMatch ? 35 : 0);

      if (score > highestScore) {
        highestScore = score;
        bestPersonaId = id;
        bestMatchedKeywords = matched;
      }
    });

    const confidence = highestScore > 0 ? Math.min(65 + highestScore, 98) : 50;

    return {
      persona: SPECIALIZED_PERSONAS[bestPersonaId],
      confidence,
      matchedKeywords: bestMatchedKeywords
    };
  }

  /**
   * Selects best matching persona for an arbitrary natural language prompt.
   */
  public selectPersonaForPrompt(prompt: string): AgentPersona {
    return this.matchPersona(prompt).persona;
  }

  /**
   * Run an agent request tailored to a specific specialized persona.
   */
  public async runPersonaAgent(
    personaId: AgentPersonaId,
    prompt: string,
    provider: LLMProvider,
    activeTableName?: string,
    onTokenChunk?: (chunk: string) => void
  ): Promise<AgentRunResult & { persona: AgentPersona }> {
    const persona = SPECIALIZED_PERSONAS[personaId] || SPECIALIZED_PERSONAS.dba_optimizer;

    // Retrieve rich organizational context from dbMemory
    const memoryContext = dbMemory.getEnrichedSchemaContext(activeTableName);

    // Formulate enriched prompt
    const enrichedPrompt = `[SPECIALIZED PERSONA: ${persona.name}]\n` +
      `Directive: ${persona.systemDirective}\n\n` +
      `${memoryContext}\n\n` +
      `User Query: ${prompt}`;

    const result = await dbAgentRuntime.runAgent({
      prompt: enrichedPrompt,
      provider,
      activeTableName,
      onTokenChunk
    });

    return {
      ...result,
      persona
    };
  }

  public getPersona(id: AgentPersonaId): AgentPersona {
    return SPECIALIZED_PERSONAS[id] || SPECIALIZED_PERSONAS.dba_optimizer;
  }

  public getAllPersonas(): AgentPersona[] {
    return Object.values(SPECIALIZED_PERSONAS);
  }
}

export const specializedAgents = new SpecializedAgentCoordinator();
