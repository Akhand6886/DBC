# DBC — Agentic Database IDE

**DBC** is an open-source, telemetry-free **Agentic Database IDE** built on the **Code-OSS (VS Code core)** platform.

It combines a full developer environment with an intelligent database workspace where agents can understand schemas, generate and analyze SQL, inspect execution plans, propose migrations, modify data, and execute database operations through a controlled runtime.

> **AI should not have unrestricted access to your database. DBC puts a control layer between the agent and the database.**

---

## ⚡ What is DBC?

Traditional database IDEs provide tools for humans.

Traditional AI coding tools provide agents that can modify code.

**DBC brings both together.**

```text
┌─────────────────────────────────────────────────────┐
│                    Developer                        │
│                                                     │
│  "Find the slowest queries and optimize them."      │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Agent Orchestrator  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Confidence Router    │
                └───────┬───────┬──────┘
                        │       │
              deterministic      agentic
                   path            path
                        │       │
                        └───┬───┘
                            ▼
                 ┌────────────────────┐
                 │   DB Tool Runtime  │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │   Query Firewall   │
                 └─────────┬──────────┘
                           │
                           ▼
                     ┌───────────┐
                     │ Database  │
                     └───────────┘
```

---

# ✨ Key Features

## 🧠 Confidence-Scored Dual-Path Router

DBC does not send every request to an LLM.

Requests are first analyzed to determine whether they can be resolved through deterministic tooling or require agentic reasoning.

```text
User Prompt
     │
     ▼
Intent Classification
     │
     ├── Structural Pattern Detection
     ├── LSP / Symbol Availability
     └── Ambiguity Detection
     │
     ▼
Confidence Score
     │
     │ Score =
     │ 0.6 × PatternScore
     │ + 0.4 × LSPScore
     │ − AmbiguityPenalty
     │
     ├─────────────────────────────┐
     │                             │
     ▼                             ▼
Score ≥ Threshold             Score < Threshold
     │                             │
     ▼                             ▼
Deterministic Path             Agentic Path
     │                             │
     ├── LSP                       ├── Planning
     ├── Formatter                 ├── Reasoning
     ├── Tests                     ├── Tool usage
     └── Static analysis           └── Multi-file actions
     │                             │
     └─────────────┬───────────────┘
                   ▼
          AgentExecutionPlan
                   │
          ┌────────┼─────────┐
          ▼        ▼         ▼
      Verification Trace   Metrics
```

### Deterministic Fast Path

Target characteristics:

* ~3 ms latency
* $0.00 model-token cost
* Local execution
* LSP / formatter / test / static-analysis driven

### Agentic Path

Used for tasks requiring:

* Multi-step reasoning
* Multi-file operations
* Database analysis
* Complex query generation
* Schema design
* Migration planning
* Performance investigation

Supported model architectures can include cloud and local providers such as:

```text
OpenAI
Anthropic
Google Gemini
Ollama
OpenAI-compatible endpoints
```

---

# 🗄️ Agentic DBMS Studio

DBC includes a dedicated **DBMS Studio** inside the IDE.

It is not just a SQL editor.

### Database capabilities

* SQL editor
* SQL execution
* Database connection management
* Schema explorer
* Table browser
* Interactive table data grid
* Row-level editing
* Query history
* Migration diffing
* `EXPLAIN`
* `EXPLAIN ANALYZE`
* Execution-plan visualization
* Data export

### Export formats

```text
.xlsx
.csv
.json
.md
```

---

# 🤖 Database Agent Runtime

DBC treats the database as an environment that agents can operate through structured tools.

Instead of:

```text
LLM → SQL → Database
```

DBC uses:

```text
User Intent
     │
     ▼
Agent Planner
     │
     ▼
Tool Selection
     │
     ▼
SQL / Database Operation
     │
     ▼
Validation
     │
     ▼
Risk Analysis
     │
     ▼
Approval / Policy Check
     │
     ▼
Database Execution
     │
     ▼
Verification
     │
     ▼
Result
```

Agents interact with databases through explicit tools rather than unrestricted access.

Example tools:

```text
inspect_schema()
describe_table()
find_relationships()
search_data()
generate_query()
validate_query()
explain_query()
preview_migration()
execute_query()
rollback_transaction()
```

---

# 🛡️ Query Firewall

One of the core ideas behind DBC is that an AI agent should not be trusted with unrestricted database execution.

DBC introduces a policy boundary between generated operations and the database.

```text
Generated SQL
     │
     ▼
SQL Parser
     │
     ▼
AST Analysis
     │
     ▼
Policy Engine
     │
     ├── Operation Type
     ├── Tables Affected
     ├── WHERE Clause
     ├── Estimated Impact
     ├── Permissions
     └── Risk Level
     │
     ▼
┌─────────┬─────────┬─────────┐
│  ALLOW  │  REVIEW │  BLOCK  │
└─────────┴─────────┴─────────┘
     │
     ▼
 Database
```

### Example

A generated operation:

```sql
DELETE FROM customers
WHERE last_login < ...;
```

can be presented as:

```text
Operation       DELETE
Risk            HIGH
Estimated Rows  12,482
Transaction     Available

[ Preview Changes ]

[ Approve ]

[ Cancel ]
```

The objective is simple:

> **Agents propose. The runtime validates. The developer remains in control.**

---

# 🧩 Specialized Database Agents

DBC is designed around multiple specialized agents rather than one monolithic database assistant. Each persona possesses custom domain directives, recommended trigger prompts, and tailored analytical capabilities:

```text
                    ┌───────────────────┐
                    │ Agent Orchestrator│
                    └─────────┬─────────┘
                              │
       ┌────────────┬─────────┼──────────┬────────────┐
       ▼            ▼         ▼          ▼            ▼
  DBA Optimizer   Schema    Analyst   Security   Coordinator
     (⚡)       Architect(🏗️)  (📊)   Auditor(🛡️)   (ReAct)
```

1. ⚡ **DBA Optimizer (`dba_optimizer`)**:
   - Specializes in query plan cost reduction, B-Tree index synthesis, and eliminating quadratic table scans.
   - Triggers: `Explain query plan`, `Suggest indexes for slow query`, `Analyze buffer cache miss ratio`.
2. 🏗️ **Schema Architect (`schema_architect`)**:
   - Specializes in zero-downtime reversible schema migrations (`UP` and `DOWN`), 3NF normalization, and foreign key integrity.
   - Triggers: `Draft reversible migration`, `Normalize table to 3NF`, `Check schema constraints`.
3. 📊 **Data Analyst (`data_analyst`)**:
   - Specializes in multi-table aggregation, window functions (`ROW_NUMBER`, `RANK`), and statistical distribution sampling.
   - Triggers: `Calculate cohort retention`, `Sample data distribution`, `Generate summary aggregation`.
4. 🛡️ **Security Auditor (`security_auditor`)**:
   - Specializes in Query Firewall policy enforcement, PII masking tags, and SQL injection vector detection.
   - Triggers: `Audit PII exposure`, `Verify Query Firewall policies`, `Assess mutation blast radius`.

---

# 🧠 Database Memory & Business Invariants

AI agents should understand your team's institutional knowledge and business constraints. DBC introduces **Database Memory** (`src/lib/db/dbMemory.ts`):

- **Domain Invariant Rules**: Enforces mandatory policies (e.g. `rule-admin-protect`: mutations touching admin roles require confirmation; `rule-soft-delete`: use `is_deleted = true` instead of physical `DELETE`).
- **Semantic Dictionary**: Annotates tables and columns with domain meaning, business ownership teams, and compliance tags (`isPii: true`).
- **Learned Query Patterns**: Automatically tracks common join patterns, frequently filtered columns, and verified composite indexes.
- **Context Injection**: Dynamically injects relevant business invariants directly into agent system prompts during query planning.
- **Shortcut**: `⌘⇧K` opens the Database Memory Hub.

---

# 🔌 Model Context Protocol (MCP) Server

DBC acts as an official **MCP Server** implementing the JSON-RPC 2.0 protocol (`src/lib/mcp/mcpServer.ts`), allowing external agent environments (Claude Desktop, Cursor, Antigravity) to safely interact with your database:

- **Endpoint**: Hosted locally at `/api/mcp`.
- **Tools Exposed**:
  - `dbc_execute_query`: Runs queries under Query Firewall supervision.
  - `dbc_introspect_schema`: Inspects tables, columns, data types, and primary keys.
  - `dbc_explain_query`: Generates execution plan cost breakdowns.
  - `dbc_suggest_indexes`: Generates index advisor recommendations.
  - `dbc_generate_migration`: Generates reversible UP/DOWN migration scripts.
  - `dbc_get_business_memory`: Retrieves domain invariant rules and semantic annotations.
- **Resources**: Exposes `db://schema` and `db://memory`.
- **Shortcut**: `⌘⇧M` opens the MCP Server status and Claude configuration modal.

---

# 🧩 Extensible Driver / Plugin API

DBC provides a universal database driver abstraction (`src/lib/db/driverPluginApi.ts`) with a standardized capability matrix (`isColumnarOLAP`, `supportsTransactions`, `supportsExplainAnalyze`, `supportsIndexAdvisor`):

- **SQLite**: Fast embedded relational engine.
- **DuckDB**: Columnar OLAP engine for vector-speed analytics.
- **PostgreSQL**: Enterprise relational database with full transaction support.
- **MySQL**: Universal relational connector.
- **Third-Party Plugins**: Dynamic runtime plugin registration via `driverRegistry.registerPlugin()`.

---

# 🕸️ Data Lineage & Downstream Blast Radius DAG

DBC tracks how data flows through your system and protects against breaking changes (`src/lib/lineage/dataLineageEngine.ts`):

- **Topological DAG Engine**: Connects source tables, derived tables, views, downstream executive reports, and ETL pipeline jobs.
- **AST Lineage Parser**: Automatically extracts tables, foreign keys, and joins from SQL queries (`SELECT`, `INSERT INTO ... SELECT`, `CREATE VIEW`).
- **Downstream Blast Radius Impact**: Evaluates breaking changes when modifying or dropping tables/columns, providing risk tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and actionable recommendations.
- **Visual Lineage Graph**: Interactive modal with 3 swimlanes (Core Sources, Derived Views, Reports & Pipelines).
- **Shortcut**: `⌘⇧L` opens Data Lineage.

---

# 🌿 Database Sandboxing & Branch Execution

Agents should test risky mutations in isolation before applying them to production (`src/lib/sandbox/dbBranchManager.ts`):

- **Copy-on-Write Branching**: Instant database branching (`main`, `sandbox/*`, `feature/*`) preserving production isolation.
- **Zero-Risk Speculative Sandboxing**: Agents execute experimental migrations inside an ephemeral branch; production `main` remains untouched.
- **Branch Diffing**: Schema addition/deletion checks and table row count delta metrics.
- **1-Click Merge & Promotion**: Apply verified branch changes into `main` with safety confirmation.
- **Shortcut**: `⌘⌥B` opens the Branch Manager.

---

# ⚡ Agent Performance Optimizer & Index Advisor

DBC proactively detects query bottlenecks and recommends concrete optimizations (`src/lib/optimizer/agentPerformanceOptimizer.ts`):

- **Sequential Scan Detection**: Identifies full table scans on unindexed filter predicates.
- **Automated Index Advisor**: Synthesizes exact `CREATE INDEX` DDL with composite column ordering.
- **Query Rewrite Synthesizer**: Replaces quadratic subqueries (`IN (SELECT ...)`) with vectorized hash joins (`INNER JOIN`).
- **Virtual Benchmark Simulator**: Measures projected latency drop (ms) and buffer pool read reduction.
- **Shortcut**: `⌘⇧O` opens the Performance Optimizer.

---

# 🤝 Collaborative Agent Sessions & Council Protocol

DBC transforms single-agent workflows into an enterprise-grade multi-agent collaboration room (`src/lib/collaboration/collaborativeSession.ts`):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-AGENT COUNCIL WORKSPACE                          │
├──────────────────────────────┬───────────────────────────────┬──────────────┤
│    PARTICIPANTS & LOCKS      │      COUNCIL TIMELINE         │  BLACKBOARD  │
│  • Lead Engineer (Alpha)     │  @dba check index cost        │  Migration   │
│  • ⚡ DBA Optimizer (Online) │  @security review PII tags    │  Checklist   │
│  • 🏗️ Schema Architect       │  📜 SQL Proposal Card:        │  • Plan [x]  │
│  • 📊 Data Analyst           │     CREATE INDEX ...          │  • Tests [x] │
│  • 🛡️ Security Auditor       │  Consensus: 2/2 Sign-offs     │  • Exec [ ]  │
│  🔒 EXCLUSIVE_WRITE: users   │  [ 🚀 Execute Proposal ]      │  Event Log   │
└──────────────────────────────┴───────────────────────────────┴──────────────┘
```

- **Multi-Agent Session Workspace**: Human operator collaborates with all 4 AI agents in a shared room with live presence indicators (`ONLINE`, `THINKING`, `BUSY`).
- **Agent-to-Agent Delegation Bus**: Sub-tasks dispatched between agents with typed context payloads and structured return verdicts (`approved`, `confidence`, `findings`).
- **Cooperative Distributed Lock Manager**: Protects tables and schemas with `EXCLUSIVE_WRITE` and `SHARED_READ` locks, preventing concurrent write collision. Includes auto-TTL expiration.
- **Peer Review Consensus Engine**: Propose migrations and queries; requires peer sign-offs (e.g. DBA + Security) before 1-click execution.
- **Shared Blackboard Scratchpad**: Collaborative markdown scratchpad for shared hypotheses and execution checklists.
- **Event Sourcing Replay Engine**: Chronological immutable event log of all actions with JSON export and scrubber replay.
- **Shortcut**: `⌘⌥C` opens the Collaborative Studio.

---

# ⌨️ Global Keyboard Shortcuts Matrix

| Shortcut | Function | Description |
| :--- | :--- | :--- |
| **`⌘⌥C`** | **Collaborative Studio** | Multi-agent council, delegation, distributed locks & consensus |
| **`⌘⇧L`** | **Data Lineage DAG** | Dependency graph and downstream blast radius evaluation |
| **`⌘⌥B`** | **Database Branching** | Sandbox branch manager, branch diffing & 1-click merge |
| **`⌘⇧O`** | **Performance Optimizer** | Sequential scan bottleneck detector & index advisor |
| **`⌘⇧K`** | **Database Memory** | Domain invariant rules, semantic dictionary & PII policies |
| **`⌘⇧M`** | **MCP Server Hub** | Model Context Protocol JSON-RPC 2.0 configuration |
| **`⌘⇧T`** | **Agent Trace Drawer** | Execution flamegraph, latency breakdown & tool call log |
| **`⌘↵`** | **Execute SQL Query** | Runs active SQL query against active database / branch |
| **`⌘P` / `⌘K`** | **Command Palette** | Quick action search across all IDE and DBMS commands |
| **`⌘⇧F`** | **Workspace Search** | Global search and replace with regex support |
| **`⌘B`** | **Toggle Sidebar** | Collapses / expands primary explorer & database panels |
| **`⌘J`** | **Toggle Terminal** | Shows / hides bottom terminal and problem panel |
| **`⌘L`** | **Mission Control** | Opens AI Copilot drawer and specialized persona selector |

---

# 🧪 Automated Test Verification (108/108 Passing)

DBC features an exhaustive automated test suite validating every layer of the runtime:

```bash
# Run complete test suite across all 4 roadmap priority phases:
$ npx -y tsx scripts/test-p0-subsystems.ts && \
  npx -y tsx scripts/test-p1-subsystems.ts && \
  npx -y tsx scripts/test-p2-subsystems.ts && \
  npx -y tsx scripts/test-p3-subsystems.ts
```

| Phase | Test Suite Script | Tests | Coverage Areas |
| :--- | :--- | :--- | :--- |
| **🔴 P0** | `scripts/test-p0-subsystems.ts` | **25 / 25** | Typed DB Tools, ReAct Runtime, Query Firewall, Virtual Tx Rollback, Trace Logger |
| **🟠 P1** | `scripts/test-p1-subsystems.ts` | **27 / 27** | Database Memory, Invariant Rules, 4 Personas, MCP JSON-RPC Server, Driver Plugins |
| **🟡 P2** | `scripts/test-p2-subsystems.ts` | **25 / 25** | Lineage DAG, AST Parser, Blast Radius, Branch Sandbox, Diff & Merge, Index Optimizer |
| **🟢 P3** | `scripts/test-p3-subsystems.ts` | **31 / 31** | Multi-Agent Rooms, Delegation Bus, Lock Manager, Consensus Voting, Event Replay |
| **TOTAL** | **4 Comprehensive Suites** | **108 / 108** | **100% Passed Across All Subsystems** |

---

# 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/Akhand6886/DBC.git
cd DBC
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
```bash
npm run build
npm start
```

---

# 📁 Codebase Architecture & Directory Map

The presentation and runtime layers are structured into clean, modular domain boundaries:

```text
DBC/
├── TRACK.md                     # Single-Track Engineering Workflow Anchor (WIP=1)
├── ISSUES.md                    # Inspection findings & issue tracker
├── docs/                        # Architecture blueprints & roadmaps
├── scripts/                     # Automated subsystem validation suites (108 tests)
└── src/
    ├── app/
    │   ├── layout.tsx           # Global shell & ToastProvider
    │   ├── page.tsx             # Lean layout coordinator (< 300 lines)
    │   └── globals.css          # Theme tokens & typography
    ├── components/
    │   ├── shell/               # Core IDE chrome (TopMenuBar, StatusBar, TerminalPanel)
    │   ├── editor/              # Code workspace (CodeEditor, FileExplorer, WelcomeTab)
    │   ├── dbms/                # DBMS Studio (SqlQueryPanel, TableDataEditor, etc.)
    │   ├── agents/              # Multi-agent studio (MissionControl, AgentTraceDrawer, etc.)
    │   ├── modals/              # ModalHost.tsx centralized dispatcher & dialogs
    │   ├── ui/                  # Notification primitives (ToastProvider)
    │   └── index.ts             # Backwards-compatible barrel export
    └── lib/
        ├── agent/               # ReAct runtime, specialized personas, BYOK client
        ├── db/                  # SQL driver, query firewall, transaction rollback
        ├── router/              # Intent classifier & deterministic engine
        ├── sandbox/             # Branch manager & isolated databases
        ├── lineage/             # AST query parser & dependency DAG
        ├── collaboration/       # Multi-agent council, distributed locks, consensus
        ├── mcp/                 # Model Context Protocol JSON-RPC 2.0 server
        └── optimizer/           # B-Tree index advisor & benchmark simulator
```

---

# 🎯 Engineering Workflow & Single-Track Protocol

To prevent cognitive fragmentation and context-switching, this repository adheres to the **Single-Track Protocol** documented in [TRACK.md](file:///Users/alpha/Desktop/antigavity/DBC/TRACK.md):

1. **WIP = 1:** Developers and agents work on strictly **ONE** task at a time under `🟢 NOW`.
2. **Parking Lot Discipline:** Any auxiliary ideas or bugs discovered while working are added to the `🔴 PARKING LOT` and deferred.
3. **No Redundant Full Builds:** Intermediate checks use `npx tsc --noEmit` and targeted test scripts. Full builds are only run for release verification.

