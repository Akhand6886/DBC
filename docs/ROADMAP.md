# Agentic IDE — Engineering Roadmap

## Phased Execution Roadmap

```
Phase 0: Code-OSS Fork & Rebrand ──► Phase 1: Single-Agent MVP ──► Phase 2: Confidence Router
     (2–3 Weeks)                      (4–6 Weeks)                      (4–6 Weeks)
                                                                            │
Phase 5: Agentic DBMS Studio ◄── Phase 4: Browser-in-the-Loop ◄── Phase 3: Multi-Agent & Mission Control ◄───┘
     (4 Weeks)                        (4 Weeks)                        (6–8 Weeks)
```

---

## Phase Breakdown

### Phase 0 — Fork & Rebrand (Duration: 2–3 Weeks)
- **Goal:** Establish a pristine Code-OSS editor fork stripped of Microsoft telemetry and branded for distribution.
- **Key Deliverables:**
  - Build script setup using `vscodium/vscodium` build scripts.
  - OpenVSX extension marketplace integration.
  - Branded UI shell, splash screen, activity bar branding.
  - Automated CI/CD build matrix for macOS (ARM64/x64), Linux, and Windows.

### Phase 1 — Single-Agent MVP & Diff Verification (Duration: 4–6 Weeks)
- **Goal:** Deliver single-agent prompt capabilities with robust diff validation.
- **Key Deliverables:**
  - Integrated Chat & Composer UI panels in Electron main process.
  - Provider-agnostic BYOK model adapter (OpenAI, Anthropic, Gemini, Ollama).
  - Tool-use framework: file read/write, bash execution, LSP query.
  - Inline diff preview with accept/reject gutter controls and shadow workspace snapshots.

### Phase 2 — Confidence-Scored Hybrid Router (Duration: 4–6 Weeks)
- **Goal:** Implement the primary technical differentiator — fast-path deterministic resolution.
- **Key Deliverables:**
  - Intent classification engine with confidence scoring heuristics.
  - LSP & Tree-sitter fast-path integration for zero-cost instant renames, references, and AST refactors.
  - Instrument telemetry for fast-path vs. LLM escalation split tracking.

### Phase 3 — Multi-Agent System & Mission Control (Duration: 6–8 Weeks)
- **Goal:** Enable multi-agent parallel execution across workspace files with state management.
- **Key Deliverables:**
  - Task planner & subagent spawner for background feature creation.
  - Mission Control dashboard for agent task queue monitoring.
  - Immutable state checkpointing with 1-click snapshot rollback.

### Phase 4 — Browser-in-the-Loop (Duration: 4 Weeks)
- **Goal:** Integrate Playwright-driven visual UI testing agents.
- **Key Deliverables:**
  - Embedded browser window with Chrome DevTools Protocol (CDP) hooks.
  - Automated visual screenshot inspection & spec verification loop for web apps.

### Phase 5 — Dedicated Agentic DBMS Studio & AI Schema Engineering (Duration: 4 Weeks)
- **Goal:** Deliver a specialized, AI-powered Database Management System (DBMS) Studio & VS Code Environment.
- **Key Deliverables:**
  - Real SQL Driver Engine (`sqlDriver.ts`) supporting `CREATE TABLE`, `INSERT`, `SELECT`, and syntax error diagnostic catching.
  - Interactive Table Data Grid (`TableDataEditor.tsx`) with inline cell edits, `+ Add Row`, `Delete Row`, search filtering, and header sorting.
  - Multi-Format Data Exporter Engine (`dataExporter.ts`) supporting Excel (`.xlsx`), CSV, JSON, Markdown, and HTML file downloads.
  - AI Database Migration Generator & Schema Diffing (`schemaDiffer.ts`) producing `UP` and `DOWN` SQL scripts with data-loss safety checks.
  - Visual Query Execution Plan Analyzer (`explainAnalyzer.ts`) rendering `EXPLAIN ANALYZE` node graph cards, bottleneck highlights, and **AI Index Advisor** recommendations.
  - Official VS Code Dark Theme shell restoration (`#1e1e1e` / `#252526` / `#333333` / `#007acc`), top menu bar, and signature blue status bar.

---

### Phase 6 — Agentic Runtime, Governance & Collaborative Council (100% Complete & Verified)
- **Goal:** Deliver an enterprise-grade autonomous database agent runtime with query firewalls, business memory, AST lineage DAGs, sandbox branching, and multi-agent collaborative sessions.
- **Key Priority Subsystems & Test Verification:**
  - **🔴 P0: Agent Runtime & Safety Engine (25/25 Tests Passing)**
    - 7 Typed DB Tools (`introspect_schema`, `sample_table_data`, `execute_query`, `explain_query`, `suggest_indexes`, `generate_migration`, `validate_syntax`).
    - ReAct execution loop (`Thought -> Action -> Observation -> Final Answer`).
    - Query Firewall & Risk Engine (0-100 score, tautology detector, mutation blast estimator).
    - Virtual Transaction & Inverted Rollback Engine with `HumanApprovalModal` safety confirmation gate.
    - Agent Execution Trace Flamegraph & JSON export (`AgentTraceDrawer.tsx`).
  - **🟠 P1: Database Memory, Specialized Personas & MCP Server (27/27 Tests Passing)**
    - Database Memory (`dbMemory.ts`): Domain invariant policies (`rule-admin-protect`, `rule-soft-delete`), semantic dictionary & PII column tagging (`⌘⇧K`).
    - 4 Specialized Personas (`specializedAgents.ts`): ⚡ DBA Optimizer, 🏗️ Schema Architect, 📊 Data Analyst, 🛡️ Security Auditor.
    - Model Context Protocol (MCP) Server (`mcpServer.ts` & `/api/mcp`): JSON-RPC 2.0 tool provider for Claude Desktop & Cursor (`⌘⇧M`).
    - Extensible Driver Plugin API (`driverPluginApi.ts`): Universal driver contract supporting SQLite, DuckDB (columnar OLAP), Postgres, and MySQL.
  - **🟡 P2: Data Lineage, Sandboxing & Performance Optimizer (25/25 Tests Passing)**
    - Data Lineage DAG Engine (`dataLineageEngine.ts` & `DataLineageModal.tsx`): Table/column DAG, AST query lineage parser, downstream blast radius impact evaluation (`⌘⇧L`).
    - Database Sandboxing & Copy-on-Write Branching (`dbBranchManager.ts` & `BranchManagerModal.tsx`): Isolated branch environments (`main`, `sandbox/*`), zero-risk speculative mutations, branch diffing, and 1-click merge (`⌘⌥B`).
    - Agent Performance Optimizer (`agentPerformanceOptimizer.ts` & `PerformanceOptimizerModal.tsx`): Sequential scan detector, automated B-Tree composite index advisor, query rewrite planner, and virtual benchmark simulator (`⌘⇧O`).
  - **🟢 P3: Collaborative Agent Sessions & Council Protocol (31/31 Tests Passing)**
    - Multi-Agent Session Rooms (`collaborativeSession.ts` & `CollaborativeSessionModal.tsx`): Human operator + 4 AI agents, real-time presence indicators, turn-taking chat timeline with mentions (`@dba`, `@security`, `@architect`, `@analyst`) (`⌘⌥C`).
    - Agent-to-Agent Delegation Bus: Structured sub-task handoffs with typed payloads and autonomous `DelegationVerdict`.
    - Cooperative Distributed Lock Manager: `EXCLUSIVE_WRITE` and `SHARED_READ` table/schema locks with conflict prevention and auto-TTL expiration.
    - Peer Review Consensus Engine: Structured SQL proposal cards with multi-agent voting thresholds and 1-click execution.
    - Shared Blackboard Scratchpad & Event Sourcing Replay Engine: Joint markdown scratchpad and immutable chronological event store with JSON archive export.
- **Verification Summary**: **108 / 108 automated unit and integration tests passing** across 4 dedicated test scripts with clean Next.js production builds.
