# Agentic IDE — Architecture Blueprint

## Executive Overview

The **Agentic IDE** is a high-performance, developer-first integrated development environment designed around a **Code-OSS (VS Code core) shell**, an **Agent Orchestration Layer** featuring a **Confidence-Scored Hybrid Router**, a **Rust Codebase Indexing Sidecar**, and an **Automated Diff Verification & Checkpoint Engine**.

Unlike traditional AI IDEs that route every user action through an LLM, the Agentic IDE introduces a **dual-path execution engine**:
1. **Deterministic Fast Path:** Resolves high-confidence, structural, or pattern-matched operations (LSP renames, Tree-sitter refactors, test execution, symbol lookups) instantly with $0\text{ms}$ model latency and zero hallucination risk.
2. **Agentic LLM Path:** Escalates ambiguous, multi-file, or complex reasoning tasks to provider-agnostic Large Language Models (BYOK: OpenAI, Anthropic, Gemini, Ollama).

---

## High-Level System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CODE-OSS EDITOR SHELL                           │
│  (Electron + TypeScript, OpenVSX Extensions, LSP/DAP Protocols)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ IPC (JSON-RPC / gRPC Channel)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    AGENT ORCHESTRATION ENGINE                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │         Confidence-Scored Router (Fast-Path vs LLM)            │   │
│   └───────────────┬────────────────────────────────┬───────────────┘   │
│                   │                                │                   │
│         [High Confidence ≥ 80%]           [Low Confidence < 80%]       │
│                   │                                │                   │
│                   ▼                                ▼                   │
│       ┌───────────────────────┐        ┌───────────────────────┐       │
│       │ Deterministic Engine  │        │   LLM Task Planner    │       │
│       │ (LSP / Tree-sitter /  │        │ (Multi-Agent, Tools,  │       │
│       │     ripgrep)          │        │   Subagent Spawner)   │       │
│       └───────────┬───────────┘        └───────────┬───────────┘       │
│                   │                                │                   │
│                   └───────────────┬────────────────┘                   │
│                                   │                                    │
│                                   ▼                                    │
│       ┌────────────────────────────────────────────────────────┐       │
│       │       Verification Guardrail & Checkpoint Manager      │       │
│       │  (Shadow workspace diff, AST checks, rollback stack)   │       │
│       └────────────────────────────────────────────────────────┘       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
              ┌─────────────────────┐┌───────────────────┐
              │    Rust Sidecar     ││    Local Vector   │
              │ (Tree-sitter Index) ││ (LanceDB / ONNX) │
              └─────────────────────┘└───────────────────┘
```

---

## Key Architecture Components

### 1. Editor Shell (`/editor`)
- **Foundation:** Fork of Code-OSS (MIT Licensed).
- **Branding & Telemetry:** Stripped of Microsoft proprietary telemetry and branding using VSCodium automated build pipelines.
- **Marketplace:** Configured with **OpenVSX** for seamless community extension installation (linters, formatters, themes, language servers).
- **Protocol Support:** Native support for Language Server Protocol (LSP) and Debug Adapter Protocol (DAP).

### 2. Agent Orchestration Layer (`/orchestrator`)
- **Location:** Runs in the Electron main process / background worker thread.
- **Confidence Router:** Intercepts user prompts, calculates intent confidence scores ($0-100\%$), and dispatches tasks to either the Fast Path or LLM Path.
- **Tool-Use Dispatcher:** Manages execution tools (File Reader/Writer, Bash Shell Execution, LSP Invocation, Browser Automation).
- **Subagent Manager:** Spawns background worker agents for multi-file refactoring and test suites.

### 3. Rust Codebase Indexing Sidecar (`/sidecar`)
- **Technology:** Native Rust binary utilizing **Tree-sitter** for ultra-fast AST parsing.
- **Vector Search:** Embedded **LanceDB** / **sqlite-vec** with ONNX local embedding models.
- **Performance:** Computes file symbols, reference graphs, and semantic embeddings in milliseconds without network calls.

### 4. Verification & Shadow Checkpoint Engine
- **Shadow Buffers:** Writes agent proposed edits to isolated temporary worktrees or shadow buffers before mutating working tree files.
- **Diagnostics Check:** Runs LSP diagnostics and syntax checks on modified files.
- **1-Click Rollback:** Maintains an immutable snapshot stack of agent execution states for instant undo.

### 5. Provider-Agnostic Model Layer (BYOK)
- Supports OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Google Gemini (Gemini 1.5 Pro / Flash), and local LLMs via Ollama.

---

## Programming Language Choices & Rationale (Where & Why)

| Subsystem / Layer | Language Chosen | Where It Is Used | Technical Rationale (Why) |
|---|---|---|---|
| **Editor Shell & UI** | **TypeScript** (`.ts`, `.tsx`) | React/Next.js UI, Code-OSS Activity Bar, File Explorer, Tabbed Editor, Status Bar | Code-OSS (VS Code core) is 100% TypeScript natively. Using TypeScript eliminates IPC protocol translation friction and provides direct access to VS Code APIs, LSP/DAP clients, and OpenVSX extension host. |
| **Agent Orchestrator** | **TypeScript** (Node.js) | Electron main process, Confidence-Scored Router, Tool Dispatcher, Shadow Workspace Verification | Executes directly inside Node.js/Electron with full OS file system access, subagent child process management, and seamless JSON-RPC communication with the editor UI. |
| **Codebase Indexing Sidecar** | **Rust** (`.rs`) | Tree-sitter AST Parser, LanceDB / sqlite-vec vector store, ONNX local embeddings | Parsing 100k+ lines of code into symbol graphs and executing vector similarity searches is compute-heavy. Rust provides zero-cost abstractions, sub-10ms latency without Garbage Collection (GC) pauses, and compiles to a lightweight native binary (`agentic-indexer`). |
| **Browser Automation Agent** | **TypeScript** / Node.js | Playwright / Chrome DevTools Protocol (CDP) | Standard, battle-tested web frontend visual verification and screenshot feedback loops for web development tasks. |

