# ⚡ Code Inspection — Part 3: Deterministic Router & Protocol Layer Domain

> **Inspection Date:** 2026-09-17  
> **Domain:** Deterministic Hybrid Router, Intent Classifier, AST Sidecar Indexer & Model Context Protocol (MCP)  
> **Target Paths:**
> - [`src/lib/router/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/)
> - [`src/lib/sidecar/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sidecar/)
> - [`src/lib/mcp/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/mcp/)
> - [`src/components/modals/RouterConfigModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/RouterConfigModal.tsx)
> - [`src/components/modals/RouterTraceModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/RouterTraceModal.tsx)
> - [`src/components/modals/McpServerModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/McpServerModal.tsx)

---

## 1. Domain Architecture & Subsystems

```
                               ┌───────────────────────────────┐
                               │     Developer Prompt Input    │
                               └───────────────┬───────────────┘
                                               │
                                               ▼
                               ┌───────────────────────────────┐
                               │      intentClassifier.ts      │
                               │   (Confidence Score 0-100)    │
                               └───────────────┬───────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │ Score >= Threshold (Default 80%)            │ Score < Threshold
                        ▼                                             ▼
         ┌─────────────────────────────┐               ┌─────────────────────────────┐
         │   deterministicEngine.ts    │               │        llmEngine.ts         │
         │  (DETERMINISTIC_FAST_PATH)  │               │     (AGENTIC_LLM_PATH)      │
         │ - AST Rename / Refactor     │               │ - Contextual Synthesis      │
         │ - SQL Format / Normalizer   │               │ - Multi-file Reasoning      │
         │ - Tree-Sitter Parser        │               │ - BYOK Client Escalation    │
         │ - Cost: $0.00 | Latency <5ms│               │ - Cost: ~$0.0035 | ~800ms   │
         └─────────────────────────────┘               └─────────────────────────────┘
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               ▼
                               ┌───────────────────────────────┐
                               │       Shadow Workspace        │
                               │   (Pre-Execution Diff Stack)  │
                               └───────────────────────────────┘
```

---

## 2. File Inventory & Line Metrics

| Component / Module | Path | Size | Primary Responsibility |
|:---|:---|:---|:---|
| **RouterEngine** | [`src/lib/router/routerEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts) | 3.8 KB | Central dispatch coordinator evaluating fast-path vs LLM escalation |
| **IntentClassifier** | [`src/lib/router/intentClassifier.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/intentClassifier.ts) | 6.0 KB | Deterministic regex heuristics, scoring breakdown, target symbol extractor |
| **DeterministicEngine** | [`src/lib/router/deterministicEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/deterministicEngine.ts) | 2.1 KB | Zero-cost instant AST transforms (Rename, Format, Add Null Check, Test Stub) |
| **LlmEngine** | [`src/lib/router/llmEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/llmEngine.ts) | 4.5 KB | Contextual code generation across SQL, TypeScript, JSON with reasoning logs |
| **AstIndexer** | [`src/lib/sidecar/astIndexer.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sidecar/astIndexer.ts) | 2.4 KB | Rust Sidecar AST symbol indexer and symbol lookup for definitions |
| **McpServer** | [`src/lib/mcp/mcpServer.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/mcp/mcpServer.ts) | 12.9 KB | Anthropic Model Context Protocol server exposing typed DB tools & schema |
| **RouterConfigModal** | [`src/components/modals/RouterConfigModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/RouterConfigModal.tsx) | 5.8 KB | Live threshold slider (0-100%), feature toggles for rename/format/sidecar |
| **RouterTraceModal** | [`src/components/modals/RouterTraceModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/RouterTraceModal.tsx) | 6.6 KB | Visual score gauge, signal breakdown, latency and cost telemetry |
| **McpServerModal** | [`src/components/modals/McpServerModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/McpServerModal.tsx) | 9.7 KB | MCP server status, tool inventory, JSON-RPC test console & resource inspector |

---

## 3. Remediations Applied in Prior Sprints

1. **Rust Sidecar AST Symbols Aligned with Workspace Files (`P7-F2`)**:
   - In `astIndexer.ts:12-25`, replaced fictional file paths (`src/router/confidenceRouter.ts`, `src/sidecar/symbolGraph.rs`) with real files (`src/index.ts`, `migrations/001_initial_schema.sql`, `queries/users_report.sql`, `README.md`).
2. **Contextual LLM Reasoning Engine (`P4-F1`)**:
   - Upgraded `llmEngine.ts` to generate tailored code enhancements based on language context (SQL index hints, JSON metadata injection, TS error handling) rather than hardcoded dummy replacements.
3. **Monaco Line Coordinate Reveal on Jump (`P7-F3`)**:
   - In `CodeEditor.tsx` and `page.tsx`, wired `targetLine` so clicking an AST symbol in the Sidecar immediately scrolls and positions the cursor on that line.
4. **Target Symbol Passed to Deterministic Renamer (`Issue #2`)**:
   - In `deterministicEngine.ts`, dynamically uses `CodeIntent.newSymbolName` instead of hardcoded `'executeApp'`.

---

## 4. Deep-Dive Code Inspection Findings

### Finding RT-01: Synchronous Router Blocks Asynchronous BYOK Streaming
* **Severity**: 🟠 High (Resolved ✅)
* **Location**: [`src/lib/router/routerEngine.ts:62-93`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L62-L93), [`src/lib/router/llmEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/llmEngine.ts), [`src/components/agents/MissionControl.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/agents/MissionControl.tsx)
* **Defect Analysis**:
  `executeRoutedPrompt` was synchronous. When the router escalated to an LLM, it could not await asynchronous responses from external LLM providers or `byokClient.generateCompletion()`.
* **Remediation**:
  - Made `executeRoutedPrompt` return `Promise<ExecuteRouteResult>`.
  - Converted `runLLMReasoning` to `async Promise`, calling `byokClient.generateCompletion()` when an API key is present or falling back gracefully to contextual code reasoning.
  - Updated caller in `MissionControl.tsx` to `await executeRoutedPrompt(...)`.

---

### Finding RT-02: Pseudo-Vector Search Returns Uniform Similarity
* **Severity**: 🟡 Medium (Resolved ✅)
* **Location**: [`src/lib/sidecar/astIndexer.ts:33-73`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sidecar/astIndexer.ts#L33-L73)
* **Defect Analysis**:
  Non-exact matches were returned with a static uniform `0.72` similarity score rather than ranking by actual token overlap or edit distance.
* **Remediation**:
  - Implemented token-based Jaccard similarity combined with substring proximity weighting and symbol length inverse normalization.
  - Scores are dynamically differentiated across matching symbols and sorted descending by similarity score.

---

### Finding RT-03: Rolling Latency Metric Frozen at Static Constant
* **Severity**: 🟡 Medium (Resolved ✅)
* **Location**: [`src/lib/router/routerEngine.ts:20-50`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L20-L50)
* **Defect Analysis**:
  `previewDeveloperIntent()` returned static constants `3` and `840` for fast-path vs LLM latency without adapting to actual system performance.
* **Remediation**:
  - Added rolling latency window (`recordRouteLatency`, `getRollingAverageLatency`, `resetRollingLatencies`) in `routerEngine.ts`.
  - Wired `executeRoutedPrompt` to record actual execution times after every run.
  - Updated `previewDeveloperIntent` to feed real-time rolling average latencies into live UI preview cards.

---

### Finding RT-04: Intent Classifier Omission of Quoted Identifiers
* **Severity**: 💡 Low (Resolved ✅)
* **Location**: [`src/lib/router/intentClassifier.ts:48-95`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/intentClassifier.ts#L48-L95)
* **Defect Analysis**:
  Table and symbol extraction regexes only recognized raw alphanumeric strings, ignoring SQL backticks (`` `table` ``), square brackets (`[column]`), and quotes.
* **Remediation**:
  - Updated regexes for `LSP_RENAME` and `LSP_REFERENCES` to match optional surrounding backticks, brackets, single quotes, and double quotes.
  - Tested identifier extraction across SQL, TypeScript, and JSON contexts.

---

## 5. Verification & Test Coverage Matrix

- ✅ `test-part3-remediations.ts`: 50/50 Passing (100%)
  - RT-01: Async `executeRoutedPrompt` Promise resolution across fast-path and LLM routes (OpenAI, Anthropic, Gemini, Ollama, NVIDIA)
  - RT-02: Differentiated similarity scores in AST sidecar indexer (non-uniform, sorted descending, empty query safety)
  - RT-03: Dynamic rolling latency metrics adapting after execution runs
  - RT-04: Quoted, backticked, and bracketed identifier extraction in `intentClassifier`
  - Integration: MCP protocol ping and schema introspection verification
- ✅ `test-p0-subsystems.ts`: 25/25 Passing
  - ReAct dispatch & deterministic validation
- ✅ `test-p1-subsystems.ts`: 27/27 Passing
  - MCP Server initialization, ping, and tools/list verification
  - MCP `dbc_introspect_schema` execution & resource reading (`db://schema`)
  - DuckDB, SQLite, PostgreSQL, and MySQL driver plugin API
- ✅ Full Battery: **205 / 205 Tests Passing (100%)**

