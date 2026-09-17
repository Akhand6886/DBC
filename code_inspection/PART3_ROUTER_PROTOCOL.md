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
* **Severity**: 🟠 High
* **Location**: [`src/lib/router/routerEngine.ts:62-93`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L62-L93)
* **Defect Analysis**:
  ```ts
  export function executeRoutedPrompt(...): ExecuteRouteResult {
    ...
    if (isFastPath) {
      const res = runDeterministicAction(...);
    } else {
      const res = runLLMReasoning(...);
    }
  }
  ```
  `executeRoutedPrompt` is synchronous. When the router escalates to an LLM, it cannot await real asynchronous network responses from `byokClient.generateCompletion()` or `streamNvidia()`.
* **Remediation**:
  Make `executeRoutedPrompt` `async` and await the LLM completion when escalating to external providers.

---

### Finding RT-02: Pseudo-Vector Search Returns Uniform Similarity
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/sidecar/astIndexer.ts:33-42`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sidecar/astIndexer.ts#L33-L42)
* **Defect Analysis**:
  `searchSymbols(query: string)` checks `name.toLowerCase().includes(query.toLowerCase())`. If no exact match is found, it returns the entire list with a static `0.72` similarity score rather than computing actual string distance or token similarity.
* **Remediation**:
  Calculate Jaccard token similarity or Levenshtein edit distance so results are ranked by actual match proximity.

---

### Finding RT-03: Rolling Latency Metric Frozen at Static Constant
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/router/routerEngine.ts:33-40`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L33-L40)
* **Defect Analysis**:
  `previewDeveloperIntent()` returns `estimatedLatencyMs: isFastPath ? 3 : 840`. These values are static constants and do not adapt as network or device latency varies during an active session.
* **Remediation**:
  Track rolling average latency from `systemMetrics` and feed real-time averages into the preview card.

---

### Finding RT-04: Intent Classifier Omission of Quoted Identifiers
* **Severity**: 💡 Low
* **Location**: [`src/lib/router/intentClassifier.ts:28-32`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/intentClassifier.ts#L28-L32)
* **Defect Analysis**:
  Table and symbol extraction regexes match `\b[a-zA-Z0-9_]+\b`, ignoring SQL queries using backticks `` `users` `` or square brackets `[users]`.
* **Remediation**:
  Allow optional surrounding quotes or backticks in identifier capturing groups.

---

## 5. Verification & Test Coverage Matrix

- ✅ `test-p0-subsystems.ts`: 25/25 Passing
  - ReAct dispatch & deterministic validation
- ✅ `test-p1-subsystems.ts`: 27/27 Passing
  - MCP Server initialization, ping, and tools/list verification
  - MCP `dbc_introspect_schema` execution & resource reading (`db://schema`)
  - DuckDB, SQLite, PostgreSQL, and MySQL driver plugin API
