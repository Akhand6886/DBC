# Detailed Inspection: Part 4 — Agentic AI, Multi-Provider BYOK & Streaming Infrastructure

```text
    ┌─────────────────────────── Agentic AI & BYOK Architecture ───────────────────────────┐
    │                                                                                       │
    │   [ MissionControl.tsx ] ──────────────► [ routerEngine.ts ]                          │
    │            │                                   │                                      │
    │            ▼                                   ▼                                      │
    │   Provider Selector                   classifyDeveloperIntent                         │
    │   (anthropic / openai / gemini /               │                                      │
    │    nvidia / ollama)                   ┌────────┴────────┐                             │
    │            │                          ▼                 ▼                             │
    │            │                    Score ≥ 80%        Score < 80%                        │
    │            │                     (Fast-Path)     (LLM Escalation)                     │
    │            │                                            │                             │
    │            ▼                                            ▼                             │
    │   [ SettingsModal.tsx ]                        [ llmEngine.ts ]                       │
    │   (Stores keys in localStorage)                (Hardcoded Mock!)                      │
    │            │                                            │                             │
    │            ▼                                            ▼                             │
    │   [ byokClient.ts ] ◄───────── DISCONNECTED! ───────────┘                             │
    │   ├─► callOpenAI()                                                                    │
    │   ├─► callAnthropic() (Missing browser CORS header!)                                  │
    │   ├─► callGemini()                                                                    │
    │   ├─► callOllama()                                                                    │
    │   ├─► callNvidia() (Kimi-K3 / reasoning_effort: 'max')                                │
    │   └─► streamNvidia() (AsyncGenerator - Unwired / Dead Code)                          │
    │                                                                                       │
    └───────────────────────────────────────────────────────────────────────────────────────┘
```

```mermaid
sequenceDiagram
    participant User as Developer
    participant MC as Mission Control (UI)
    participant Router as routerEngine.ts
    participant MockLLM as llmEngine.ts (Mock)
    participant BYOK as byokClient.ts (Real Engine)
    participant Provider as Remote LLM API (NVIDIA/OpenAI/Anthropic)

    User->>MC: Types complex prompt ("implement audit trigger")
    MC->>Router: executeRoutedPrompt(prompt, provider, content)
    Note over Router: Routing decision: AGENTIC_LLM_PATH
    
    rect rgb(70, 20, 20)
    Note over Router,MockLLM: CRITICAL DISCONNECT
    Router->>MockLLM: runLLMReasoning(intent, content, provider)
    MockLLM-->>Router: Hardcoded 'try { main(); } catch...' string
    end

    Note over BYOK,Provider: Real BYOK Engine is Bypassed!
    opt Real Pipeline (Currently Unwired)
        Router->>BYOK: generateCompletion(provider, prompt, context)
        BYOK->>Provider: fetch(endpoint, headers, body)
        Provider-->>BYOK: SSE stream / JSON completion
        BYOK-->>Router: responseText, tokensUsed, latencyMs
    end

    Router-->>MC: Returns mock patch & execution plan
    MC->>User: Renders dummy diff in Code Editor
```

---

## 1. Subsystem Overview & Responsibilities

The Agentic AI Subsystem is designed to empower developers with multi-model Bring-Your-Own-Key (BYOK) capabilities, intelligent agent reasoning, streaming token delivery, and autonomous code synthesis.

### Core Modules & Assets:
1. **[`src/lib/agent/byokClient.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts)** (363 lines):
   - Client adapter managing configurations for 5 model providers:
     - **OpenAI**: `gpt-4o` via Chat Completions API.
     - **Anthropic**: `claude-3-5-sonnet-20241022` via Messages API.
     - **Google Gemini**: `gemini-1.5-pro` via `v1beta/models/...:generateContent`.
     - **Local Ollama**: `llama3.1:70b` via `http://localhost:11434/api/generate`.
     - **NVIDIA NIM**: `moonshotai/kimi-k3` via `https://integrate.api.nvidia.com/v1/chat/completions` with reasoning effort support.
   - Streaming generator: `streamNvidia` implementing Server-Sent Events (SSE) stream consumption.
   - Simulation fallback for unconfigured providers.
2. **[`src/components/SettingsModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SettingsModal.tsx)**:
   - Secret key manager providing password inputs for API keys.
   - Syncs keys to browser `localStorage` under `dbc_byok_keys`.
3. **[`src/components/MissionControl.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/MissionControl.tsx)**:
   - AI action dispatch deck with model provider switcher (`anthropic`, `openai`, `gemini`, `nvidia`, `ollama`), confidence gauge preview, quick intent buttons, and dispatch triggers.
4. **[`src/lib/router/llmEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/llmEngine.ts)**:
   - Legacy mock reasoning function that substitutes code with a static `try { main(); } catch` template.
5. **[`src/lib/agent/fileTools.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/fileTools.ts)** & **[`src/lib/agent/terminalRunner.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/terminalRunner.ts)**:
   - File workspace operations and terminal test runner simulators.

---

## 2. In-Depth Component Analysis & Findings

### Finding 1: Critical — BYOK Client Engine Completely Disconnected from Execution Pipeline
* **File**: [`src/lib/router/routerEngine.ts:82-88`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L82-L88), [`src/lib/agent/byokClient.ts:48`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L48)
* **Severity**: 🔴 Critical
* **Trace**:
  1. `byokClient.ts` provides `generateCompletion(provider, prompt, context)` which implements real HTTP API requests to OpenAI, Anthropic, Gemini, Ollama, and NVIDIA NIM.
  2. In `routerEngine.ts`:
     ```ts
     } else {
       const res = runLLMReasoning(intent, currentContent, provider);
       proposedContent = res.proposedContent;
       executionTimeMs = res.executionTimeMs;
       tokenCostUSD = res.tokenCostUSD;
       logMessage = `🧠 [LLM Escalation | ${intent.confidenceScore}%]: ${res.logMessage} ($${tokenCostUSD.toFixed(4)}, ${executionTimeMs}ms)`;
     }
     ```
  3. `runLLMReasoning` in `llmEngine.ts` is a 100% hardcoded mock:
     ```ts
     proposedContent = currentContent.replace(
       'main();',
       `// Agentic LLM Enhancement (${modelName})\n// Multi-turn reasoning applied: null checks & error handlers added\ntry {\n  main();\n} catch (err) {\n  console.error("Caught error:", err);\n}`
     );
     ```
  4. Global codebase search reveals `byokClient.generateCompletion()` is **never called by any component or engine**.
* **Impact**:
  - Even when the user enters real API keys (including NVIDIA Moonshot Kimi-K3, Claude 3.5, or GPT-4o), **no real LLM request is ever made**.
  - All prompt executions return the identical static mock string, rendering the entire BYOK integration non-functional.
* **Remediation**:
  - Update `routerEngine.ts` to call `byokClient.generateCompletion(provider, prompt, currentContent)`.

---

### Finding 2: Critical — Synchronous Architecture Incompatible with Asynchronous LLM Calls
* **File**: [`src/lib/router/routerEngine.ts:61-67`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/routerEngine.ts#L61-L67), [`src/components/MissionControl.tsx:69-90`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/MissionControl.tsx#L69-L90)
* **Severity**: 🔴 Critical
* **Trace**:
  1. `executeRoutedPrompt` is defined as a synchronous function:
     ```ts
     export function executeRoutedPrompt({ ... }: ExecuteRouteParams): ExecuteRouteResult
     ```
  2. In `MissionControl.tsx`:
     ```ts
     const simDelay = isFast ? 80 : 650;
     setTimeout(() => {
       setIsProcessing(false);
       const result = executeRoutedPrompt({ ... });
       onApplyPatch(result.proposedContent, result.diffCheck);
     }, simDelay);
     ```
  3. `setTimeout` is used to fake asynchronous latency with a 650ms delay, after which synchronous code runs.
* **Impact**:
  - Because `executeRoutedPrompt` cannot `await`, it cannot invoke real network `fetch` requests from `byokClient`.
  - Any attempt to integrate `byokClient.generateCompletion` directly will cause unresolved promise errors.
* **Remediation**:
  - Convert `executeRoutedPrompt` to an `async` function (`async function executeRoutedPrompt(...)`), replace `setTimeout` in `MissionControl.tsx` with `await executeRoutedPrompt(...)`, and handle loading/error states cleanly.

---

### Finding 3: Critical — Anthropic Messages API Blocked by Browser CORS Policy
* **File**: [`src/lib/agent/byokClient.ts:125-132`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L125-L132)
* **Severity**: 🔴 Critical
* **Trace**:
  1. `callAnthropic()` sends a `fetch` request directly to `https://api.anthropic.com/v1/messages`:
     ```ts
     const response = await fetch('https://api.anthropic.com/v1/messages', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'x-api-key': config.apiKey!,
         'anthropic-version': '2023-06-01'
       },
     ```
  2. Anthropic's API Gateway enforces CORS and blocks direct browser requests unless the explicit bypass header is provided:
     `'anthropic-dangerous-direct-browser-access': 'true'`
* **Impact**:
  - Any browser request to Anthropic fails instantly with a fatal CORS network error:
    `Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'http://localhost:3000' has been blocked by CORS policy`.
* **Remediation**:
  - Include `'anthropic-dangerous-direct-browser-access': 'true'` in the headers for client-side execution, or route requests through a Next.js server route handler.

---

### Finding 4: High — Streaming Engine (`streamNvidia`) is Dead, Unwired Code
* **File**: [`src/lib/agent/byokClient.ts:271-346`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L271-L346)
* **Severity**: 🟠 High
* **Trace**:
  1. `streamNvidia` implements an asynchronous generator (`async *streamNvidia`) to consume chunked SSE streams from NVIDIA NIM (`Accept: text/event-stream`).
  2. Searching the codebase shows `streamNvidia` is **never imported or called in any component**.
  3. No other provider (OpenAI, Anthropic, Gemini, Ollama) has streaming implemented.
  4. Neither `MissionControl.tsx` nor `CodeEditor.tsx` has UI mechanisms to stream tokens incrementally, display a typing cursor, or handle abort signals (`AbortController`).
* **Impact**:
  - Users cannot experience real-time token streaming; responses are all-or-nothing.
  - Long reasoning models like `moonshotai/kimi-k3` or `deepseek-r1` can take 15–30 seconds to generate responses, causing the UI to look frozen without token feedback.
* **Remediation**:
  - Create a unified `streamCompletion(provider, prompt, context, onChunk, signal)` method in `byokClient` and wire it into Mission Control.

---

### Finding 5: High — Missing Abstractions (`costTracker.ts` & `contextAssembler.ts`)
* **File**: [`src/lib/agent/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/), [`src/lib/router/llmEngine.ts:27`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/llmEngine.ts#L27), [`src/app/page.tsx:658`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L658)
* **Severity**: 🟠 High
* **Trace**:
  1. The project roadmap references `src/lib/agent/costTracker.ts` and `src/lib/agent/contextAssembler.ts`.
  2. Inspection of the file system confirms **neither file exists**.
  3. Cost tracking is completely simulated with a static `$0.0035` constant:
     ```ts
     totalCostSavedUSD: isFast ? prev.totalCostSavedUSD + 0.0035 : prev.totalCostSavedUSD
     ```
  4. Context assembling is absent; prompts only receive raw `activeFileContent` without AST pruning, schema metadata, related workspace symbols, or token length truncation.
* **Impact**:
  - Analytics cards report fictitious cost savings ($0.0035 per fast-path query) completely disconnected from actual token usage or model rates.
  - Large files (>4,000 lines) exceed model context windows and cause unhandled API payload failures without context assembly or truncation.
* **Remediation**:
  - Implement `costTracker.ts` with real token-based pricing tables for GPT-4o, Claude 3.5, Gemini 1.5, and NVIDIA NIM.
  - Implement `contextAssembler.ts` to intelligently bundle relevant workspace files, database schema DDL, and truncate within token budgets.

---

### Finding 6: Medium — Hardcoded API Key Committed in Source & Client-Side Key Exposure
* **File**: [`src/app/page.tsx:167`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L167)
* **Severity**: 🟡 Medium
* **Trace**:
  ```ts
  byokClient.setApiKey('nvidia', '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');
  ```
  1. A live NVIDIA API key is hardcoded directly in `page.tsx` as a fallback when `localStorage` has no key.
  2. Because all API requests are executed from the client browser, API keys and full code contexts appear in plaintext in the browser's Network tab.
* **Impact**:
  - Secret keys committed to Git repositories risk quota exhaustion and credential exposure.
* **Remediation**:
  - Remove hardcoded keys from source code. Require user configuration in `SettingsModal` or use environment variables (`process.env.NEXT_PUBLIC_...` or server route proxy).

---

### Finding 7: Low — Orphaned `fileTools.ts` & Mock `terminalRunner.ts`
* **File**: [`src/lib/agent/fileTools.ts:4-22`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/fileTools.ts#L4-L22), [`src/lib/agent/terminalRunner.ts:9-44`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/terminalRunner.ts#L9-L44)
* **Severity**: 💡 Low
* **Trace**:
  1. `fileTools.ts` exports `FileToolsEngine` and `fileTools`, but is never imported anywhere in `src/`.
  2. `terminalRunner.ts` implements simulated command execution (`npm test`, `git status`) with hardcoded strings rather than communicating with a real shell or sidecar process.
* **Impact**:
  - Dead code maintenance burden and simulated terminal results rather than real workspace execution.
* **Remediation**:
  - Wire `fileTools` into the Agent loop for multi-file workspace modifications, and integrate `terminalRunner` with the Rust sidecar client.

---

## 3. Subsystem Roadmap & Status

| Subsystem | Scope | Status |
| :--- | :--- | :--- |
| **Part 1: Routing Engine** | Router config, heuristic classifier, BYOK fallback, latency tracker | ✅ Completed |
| **Part 2: Verification Engine** | Shadow buffers, diff engine, inline banners, rollback drawer | ✅ Completed |
| **Part 3: SQL Relational Driver** | In-memory engine, EXPLAIN analyzer, schema differ, data exporter | ✅ Completed |
| **Part 4: Agentic AI & BYOK** | Multi-provider streaming, context windowing, agent plan loop | ✅ Completed |
| **Part 5: Workspace State & FS** | Virtual file tree, hydration, localStorage sync, active tab | ⏳ Next |
| **Part 6: Monaco Code Editor** | Custom syntax themes, keybindings, minimap, multi-tab | ⏳ Pending |
| **Part 7: Terminal & IPC Rust** | Terminal ANSI renderer, pseudo-shell, IPC sidecar bridge | ⏳ Pending |
