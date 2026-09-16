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

DBC is designed around multiple specialized agents rather than one monolithic database assistant.

```text
                    ┌───────────────────┐
                    │ Agent Orchestrator│
                    └─────────┬─────────┘
                              │
       ┌────────────┬─────────┼──────────┬────────────┐
       ▼            ▼         ▼          ▼            ▼
   Schema Agent  Query Agent  Migration  Performance Security
```
