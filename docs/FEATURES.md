# Agentic AI IDE — Complete Feature Matrix

## Executive Summary

The **Agentic AI IDE** is an ultra-fast, developer-first coding and database environment combining **Code-OSS (VS Code core)** with a **Confidence-Scored Dual-Path Router**, **Shadow Workspace Verification Engine**, **Rust Codebase Indexing Sidecar**, and a dedicated **Agentic DBMS Studio & Data Editor**.

---

## Feature Matrix Overview

```
                                      AGENTIC AI IDE
                                             │
 ┌───────────────────┬───────────────────────┼───────────────────┬───────────────────┬───────────────────┬───────────────────┐
 ▼                   ▼                       ▼                   ▼                   ▼                   ▼                   ▼
VS Code Dark UI   Confidence Router       Verification Engine   Rust Indexing      Browser-in-the-Loop  Agentic DBMS Studio Multi-Format Exporter
(Menu/Blue Status)(Fast-Path vs LLM)      (Shadow Diff Check)   (Tree-sitter/Lance) (Playwright CDP)   (Data Grid/Objects) (Excel/CSV/JSON/MD)
```

---

## Detailed Feature List

### 1. VS Code Dark Theme Shell & User Interface (`/editor`)
- **VS Code Dark Theme Palette:** Official VS Code color scheme (`#1e1e1e` Editor background, `#252526` Primary Sidebar, `#333333` Activity Bar, `#007acc` VS Code Blue accent).
- **VS Code Top Menu Bar (`TopMenuBar.tsx`):** Interactive menu bar (`File` | `Edit` | `Selection` | `View` | `Go` | `Run` | `Terminal` | `Help`) with dropdown command triggers (`New File`, `New Folder`, `Preferences`, `Toggle Terminal`).
- **Signature VS Code Blue Status Bar (`StatusBar.tsx`):** Bright blue status bar (`bg-[#007acc] text-white`) with Git branch, diagnostic status indicators, and LanceDB index monitor.
- **VS Code Flat Editor Tabs (`CodeEditor.tsx`):** Active tab in `#1e1e1e` with `#007acc` top border highlight indicator, and inactive tabs in `#2d2d2d`.
- **Expanded Workspace File Explorer (`FileExplorer.tsx`):** Tree view supporting folder creation (`+ Folder`), file creation (`+ File`), inline file/folder renaming, and quick actions.
- **VS Code Integrated Terminal Panel (`TerminalPanel.tsx`):** VS Code panel tabs (`PROBLEMS`, `OUTPUT`, `DEBUG CONSOLE`, `TERMINAL`) with log clear and CLI test runner.

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

### 5. Dedicated Agentic DBMS Studio & Data Editor (`/dbms`)
- **Real SQL Driver Engine (`sqlDriver.ts`):** Embedded SQL engine executing real `CREATE TABLE`, `INSERT INTO`, and `SELECT` queries with live syntax error handling.
- **Interactive Table Data Grid (`TableDataEditor.tsx`):** Full-screen table data grid editor supporting double-click inline cell edits, `+ Add Row`, `Delete Row`, search filtering, and column header sorting (`ASC`/`DESC`).
- **Database Object Explorer (`DbObjectExplorer.tsx`):** Tree navigation for Tables, Views, Triggers, and Functions with quick hover actions (Select Top 100, Edit Data Grid, Inspect DDL).
- **AI Database Migration Generator & Schema Diffing (`schemaDiffer.ts`):** Compares environments (e.g. `Dev` vs `Prod`), generates `UP` and `DOWN` SQL migration scripts, and flags data-loss safety warnings (`DROP TABLE`, `DROP COLUMN`).
- **Visual Query Execution Plan Analyzer (`explainAnalyzer.ts`):** Parses `EXPLAIN ANALYZE` outputs into visual node graph cards (`Seq Scan`, `Index Scan`, `Hash Join`), highlights cost bottlenecks in red, and provides an **AI Index Advisor** suggesting `CREATE INDEX` SQL statements with estimated speedups.
- **Table DDL & Schema Inspector (`TableInspectorModal.tsx`):** Inspects raw table DDL, indexes, column data types, and key constraints.
- **Visual Table Creator DDL Wizard (`TableCreatorModal.tsx`):** Graphical wizard to define fields, data types, and primary key constraints with real-time DDL preview.
- **Live Database Performance Monitor (`DbPerformanceMonitor.tsx`):** Dashboard for CPU usage, memory allocation, cache hit ratio, and active process tracking.

---

### 6. Multi-Format Data Exporter Engine (`dataExporter.ts`)
- **Excel Spreadsheet Export (`.xlsx` / `.xls`):** Generates native Excel spreadsheet XML files formatted with column data types and header styling.
- **CSV Export (`.csv`):** Produces comma/semicolon/tab-separated files with quote escaping.
- **JSON Export (`.json`):** Formatted array of row objects.
- **Markdown & HTML Exports (`.md` / `.html`):** GitHub-flavored markdown tables and standalone HTML table documents.
- **Native File Downloading:** Always-active export buttons using base64 data URIs and `Blob` object URLs for instant desktop downloads.

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
