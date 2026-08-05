# Agentic AI IDE — Complete Feature Matrix

## Executive Summary

The **Agentic AI IDE** is an ultra-fast, developer-first coding and database environment combining **Code-OSS (VS Code core)** with a **Confidence-Scored Dual-Path Router**, **Shadow Workspace Verification Engine**, **Rust Codebase Indexing Sidecar**, and a dedicated **Agentic DBMS Studio**.

---

## Feature Matrix Overview

```
                                      AGENTIC AI IDE
                                             │
 ┌───────────────────┬───────────────────────┼───────────────────┬───────────────────┬───────────────────┐
 ▼                   ▼                       ▼                   ▼                   ▼                   ▼
Editor Shell      Confidence Router       Verification Engine   Rust Indexing      Browser-in-the-Loop  Agentic DBMS Studio
(VS Code Core)    (Fast-Path vs LLM)      (Shadow Diff Check)   (Tree-sitter/Lance) (Playwright CDP)   (SQL WASM/Explain/Diff)
```

---

## Detailed Feature List

### 1. Editor Shell & User Interface (`/editor`)
- **VS Code Extension Compatibility:** Native compatibility with the OpenVSX marketplace for themes, linters, formatters, and language servers.
- **Activity Bar Navigation:** One-click navigation between Workspace Explorer, Global Search, Git Source Control, Database Studio, Mission Control AI Composer, Router Analytics, and Settings.
- **Workspace File Explorer:** Tree navigation with file language icons, folder toggles, inline file creation, and deletion.
- **Tabbed Monaco Code Editor:** Multi-file tabbed Monaco editor with line numbers, syntax highlighting, bracket colorization, minimap, and smooth caret animations.
- **Integrated Terminal Panel:** Embedded terminal output stream supporting bash/zsh command execution, LSP diagnostics, and Rust Sidecar status.
- **IDE Status Bar:** Real-time indicators for Git branch (`main`), active LSP language servers, Rust Sidecar index status, and query latency stats.

---

### 2. Confidence-Scored Hybrid Router (`/router`)
- **Dual-Path Execution Architecture:**
  - **Deterministic Fast Path ($\ge 80\%$ confidence):** Resolves pattern-matched structural operations in $\sim 3\text{ms}$ with $\$0.00$ model token cost.
  - **Agentic LLM Path ($< 80\%$ confidence):** Escalates ambiguous, multi-file, or deep analytical prompts to Large Language Models.
- **Deterministic Fast-Path Action Rules:**
  - `LSP_RENAME`: Fast symbol rename across files via LSP `textDocument/rename`.
  - `LSP_REFERENCES`: Instant symbol caller lookups via LSP `textDocument/references`.
  - `FORMAT_CODE`: Instant code formatting using Prettier/Biome.
  - `RUN_TESTS`: Automated test suite execution via CLI test runner.
  - `TREE_SITTER_REFACTOR`: Structural AST function and class extraction.
- **Live Confidence Meter:** Visual confidence percentage ($0-100\%$) and step-by-step execution pipeline badge.

---

### 3. Mission Control AI Composer & BYOK Models (`/orchestrator`)
- **Multi-Turn AI Composer Sidebar:** Natural language prompt input for complex feature building and bug fixing.
- **BYOK (Bring Your Own Key) Provider Selector:**
  - **OpenAI:** GPT-4o / GPT-4o-mini
  - **Anthropic:** Claude 3.5 Sonnet / Claude 3 Opus
  - **Google Gemini:** Gemini 1.5 Pro / Flash
  - **Local Models:** Ollama integration (Llama 3.1 70B, Qwen 2.5) for $100\%$ offline AI coding.
- **DBMS AI Assistant Triggers:** One-click shortcuts for database prompts ("Generate JOIN query", "Optimize slow query", "Create audit trigger", "Generate DB migration").
- **Subagent Task Manager:** Background agent spawning for multi-file refactoring tasks.

---

### 4. Verification Guardrails & Shadow Workspace (`/verification`)
- **Shadow Buffer Generator:** Writes agent-proposed edits to a temporary shadow buffer prior to mutating workspace files.
- **Inline Unified Diff Preview:** Color-coded diff viewer highlighting additions (`+` green) and deletions (`-` red).
- **AST Bracket Balance Check:** Automatically verifies syntax integrity (matching `{[(]}`) before patches can be applied.
- **LSP Diagnostic Verification:** Ensures proposed changes do not introduce new compiler or lint errors.
- **1-Click Patch Approval & Rollback:** Human-in-the-loop controls to accept patches or restore previous snapshots instantly.

---

### 5. Rust Codebase Indexing Sidecar (`/sidecar`)
- **Tree-sitter AST Parsing:** High-speed AST parsing across thousands of source files in Rust without Garbage Collection (GC) pauses.
- **Local Vector Search Store:** Embedded **LanceDB** / **sqlite-vec** with ONNX local embeddings for instant zero-network semantic code search.
- **Symbol Reference Graph:** Computes function relationships, type hierarchies, and import maps.

---

### 6. Dedicated Agentic DBMS Studio & Database Engine (`/dbms`)
- **Real SQL Driver Engine (`sqlDriver.ts`):** Embedded SQL engine executing real `CREATE TABLE`, `INSERT INTO`, and `SELECT` queries with live syntax error handling.
- **Interactive Inline Cell Data Editing:** Double-click data cells in the query result grid to modify values directly, with pending edit tracking and auto-generated `UPDATE` queries.
- **AI Database Migration Generator & Schema Diffing (`schemaDiffer.ts`):** Compares environments (e.g. `Dev` vs `Prod`), generates `UP` and `DOWN` SQL migration scripts, and flags data-loss safety warnings (`DROP TABLE`, `DROP COLUMN`).
- **Visual Query Execution Plan Analyzer (`explainAnalyzer.ts`):** Parses `EXPLAIN ANALYZE` outputs into visual node graph cards (`Seq Scan`, `Index Scan`, `Hash Join`), highlights cost bottlenecks in red, and provides an **AI Index Advisor** suggesting `CREATE INDEX` SQL statements with estimated speedups.
- **Table DDL & Schema Inspector (`TableInspectorModal.tsx`):** Inspects raw table DDL, indexes, column data types, and key constraints.
- **Visual Table Creator DDL Wizard (`TableCreatorModal.tsx`):** Graphical wizard to define fields, data types, and primary key constraints with real-time DDL preview.
- **Live Database Performance Monitor (`DbPerformanceMonitor.tsx`):** Dashboard for CPU usage, memory allocation, cache hit ratio, and active process tracking.

---

### 7. Tool-Use & OS System Integration (`/agent`)
- **File System Operations:** Real OS file read/write tools backed by shadow workspace diff checks.
- **Terminal Execution Engine:** Runs bash/zsh shell commands, git commands, and test suites, capturing stdout/stderr logs.
- **Diagnostics Monitoring:** Continuously listens to language server diagnostic feeds.

---

### 8. Native Desktop Packaging (`/electron`)
- **Cross-Platform Installers:**
  - **macOS:** `.dmg` and `.zip` installers for Apple Silicon (ARM64) and Intel (x64).
  - **Windows:** `.exe` installer (NSIS) and portable executables.
  - **Linux:** `.AppImage` and `.deb` packages.
- **Native OS Window Controls:** Frameless / `hiddenInset` dark title bar styling (`#1e1e1e`).

---

### 9. Production Polish & System Analytics (`/analytics`)
- **Command Palette (`⌘+Shift+P`):** Fuzzy-search action launcher with keyboard navigation.
- **Toast Notification System:** Stackable slide-in success, error, info, and warning toasts with auto-dismiss.
- **Fast-Path Hit Ratio Tracker:** Displays the percentage of user queries resolved deterministically without model calls (e.g. $84\text{--}90\%$).
- **Token Cost Savings Calculator:** Real-time tracking of direct API dollar savings achieved by bypassing unnecessary model calls.
