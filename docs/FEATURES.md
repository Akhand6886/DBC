# Agentic AI IDE — Complete Feature Matrix & Component Index

## Executive Summary

The **Agentic AI IDE** is an ultra-fast, developer-first coding and database environment combining **Code-OSS (VS Code core)** with a **Confidence-Scored Dual-Path Router**, **Shadow Workspace Verification Engine**, **Rust Codebase Indexing Sidecar**, and a dedicated **Agentic DBMS Studio & Data Editor**.

---

## System Architecture & Component Mapping

```
                                      AGENTIC AI IDE
                                             │
 ┌───────────────────┬───────────────────────┼───────────────────┬───────────────────┬───────────────────┬───────────────────┐
 ▼                   ▼                       ▼                   ▼                   ▼                   ▼                   ▼
VS Code Dark UI   Confidence Router       Verification Engine   Rust Indexing      Browser-in-the-Loop  Agentic DBMS Studio Multi-Format Exporter
(Menu/Blue Status)(Fast-Path vs LLM)      (Shadow Diff Check)   (Tree-sitter/Lance) (Playwright CDP)   (Data Grid/Objects) (Excel/CSV/JSON/MD)
```

---

## Detailed Feature Matrix & Component Index

### 1. VS Code Dark Theme Shell & User Interface (`/editor`)
- **VS Code Dark Theme Palette (`tailwind.config.js` & `globals.css`):** Official VS Code color scheme (`#1e1e1e` Editor background, `#252526` Primary Sidebar, `#333333` Activity Bar, `#007acc` VS Code Blue accent).
- **VS Code Top Menu Bar (`TopMenuBar.tsx`):** Interactive menu bar (`File` | `Edit` | `Selection` | `View` | `Go` | `Run` | `Terminal` | `Help`) with dropdown command triggers (`New File`, `New Folder`, `Preferences: Settings`, `Toggle Terminal`, `Execute SQL Query`).
- **Activity Bar Navigation (`ActivityBar.tsx`):** Official VS Code `#333333` styling, left active edge indicator bar (`border-l-2 border-white`), and one-click navigation between DBMS Studio, Workspace Explorer, Global Search, Git Source Control, Browser Preview, Shadow Verification, Router Analytics, and Settings.
- **Signature VS Code Blue Status Bar (`StatusBar.tsx`):** Bright blue status bar (`bg-[#007acc] text-white`) with remote engine badge (`DBC: Local Engine`), interactive Git branch selector (`main*`), diagnostic error/warning counters, fast-path latency monitor, UTF-8/LF indicators, and LanceDB index inspector trigger.
- **VS Code Flat Editor Tabs (`CodeEditor.tsx`):** Active tab in `#1e1e1e` with `#007acc` top border highlight indicator, and inactive tabs in `#2d2d2d`.
- **Expanded Workspace File Explorer (`FileExplorer.tsx`):** Tree view supporting sub-folder creation (`+ Folder`), file creation (`+ File`), inline file/folder renaming, quick file deletion, and pre-loaded sample SQL scripts (`queries/users_report.sql`, `queries/slow_queries_check.sql`, `migrations/001_initial_schema.sql`).
- **VS Code Integrated Terminal Panel (`TerminalPanel.tsx`):** VS Code panel tabs (`PROBLEMS`, `OUTPUT`, `DEBUG CONSOLE`, `TERMINAL`), CLI test runner (`Run Tests`), and Clear Output logs.
- **Command Palette (`CommandPalette.tsx`):** Fuzzy-search launcher (`⌘+Shift+P`) with keyboard navigation for launching any IDE action or navigation view.
- **Global Search & Replace (`SearchModal.tsx`):** Workspace-wide ripgrep text search (`⌘+Shift+F`) with instant regex search and batch replace.
- **Welcome Tab (`WelcomeTab.tsx`):** Quick-start dashboard with shortcuts to create files, open search, configure BYOK keys, and launch DBMS Studio.
- **Toast Notification System (`ToastProvider.tsx`):** Stackable slide-in toasts (success, error, info, warning) with auto-dismiss.

---

### 2. Dedicated Agentic DBMS Studio & Data Editor (`/dbms`)
- **Real SQL Driver Engine (`sqlDriver.ts` & `SqlQueryPanel.tsx`):** Embedded WASM/IPC driver executing real `CREATE TABLE`, `INSERT INTO`, and `SELECT` queries with live syntax error handling and execution latency tracking (`executionTimeMs`).
- **Interactive Table Data Grid (`TableDataEditor.tsx`):** Full-screen database table data grid editor supporting double-click inline cell edits, `+ Add Row`, `Delete Row`, real-time search filtering, column header sorting (`ASC`/`DESC`), and 1-click **Save Changes** commit trigger.
- **Database Object Explorer (`DbObjectExplorer.tsx`):** Tree navigation for Tables, Views, Triggers, and Functions with hover quick actions (Select Top 100 Rows, Open Table Data Grid, Inspect Table DDL).
- **Tools & Workspace Script Saver (`SqlQueryPanel.tsx`):** `Tools ▾` dropdown menu containing **Save Script to Workspace**, **Create Table DDL**, **Explain Plan**, and **Schema Migration**.
- **AI Query Execution Plan Visualizer (`ExplainPlanModal.tsx` & `explainAnalyzer.ts`):** Visual node graph cards (`Seq Scan`, `Index Scan`, `Hash Join`), cost bottleneck highlights, and **AI Index Advisor** suggesting `CREATE INDEX` SQL scripts with speedup estimates.
- **AI Schema Migration Generator & Diffing (`SchemaDiffModal.tsx` & `schemaDiffer.ts`):** Schema delta comparison (Development vs Production), generating `UP` and `DOWN` SQL migration scripts with data-loss safety checks (`DROP TABLE`, `DROP COLUMN`).
- **Visual Table Creator DDL Wizard (`TableCreatorModal.tsx`):** Graphical wizard to define fields, data types (`INTEGER`, `VARCHAR`, `TIMESTAMP`), and primary key constraints with live SQL DDL preview.
- **Table DDL & Schema Inspector (`TableInspectorModal.tsx`):** Detailed modal inspecting raw DDL, indexes, column data types, and foreign key constraints.
- **Live Database Performance Monitor (`DbPerformanceMonitor.tsx`):** Real-time dashboard monitoring CPU usage, memory allocation, cache hit ratio, and active process transactions.
- **Database Connection Manager (`DbConnectionPanel.tsx`):** Connection manager supporting SQLite local `.db` files, PostgreSQL, MySQL, and MongoDB connection URIs.

---

### 3. Multi-Format Data Exporter Engine (`/export`)
- **Multi-Format Exporter Engine (`dataExporter.ts` & `DataExportWizard.tsx`):**
  - **Excel Spreadsheet Export (`.xlsx` / `.xls`):** Generates native Excel spreadsheet XML files formatted with column data types and header styling.
  - **CSV Export (`.csv`):** Produces comma/semicolon/tab-separated files with quote escaping.
  - **JSON Export (`.json`):** Formatted array of row objects.
  - **Markdown & HTML Exports (`.md` / `.html`):** GitHub-flavored markdown tables and standalone HTML table documents.
  - **Native File Downloading:** Always-active export buttons using base64 data URIs and `Blob` object URLs for instant desktop downloads.

---

### 4. Confidence-Scored Hybrid Router (`/router`)

```
User Prompt (MissionControl / Quick Actions)
                  │
                  ▼
        previewIntent() / classifyDeveloperIntent()
        ├── S_pattern: structural regex & AST match
        ├── S_LSP: symbol index availability
        └── Ambiguity Penalty: open-ended / multi-file keywords
                  │
                  ▼
      Score Calculation: (0.6 * S_pattern + 0.4 * S_LSP - Penalty)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
Score >= Threshold      Score < Threshold
(e.g., >= 80%)         (e.g., < 80%)
        │                   │
        ▼                   ▼
[DETERMINISTIC FAST-PATH]  [AGENTIC LLM ESCALATION]
- ~3ms latency             - ~800ms latency
- $0.00 token cost         - Provider token cost (OpenAI/Claude/Gemini/Ollama)
- LSP / Formatter / Tests  - Deep reasoning / multi-file generation
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
      AgentExecutionPlan Created
      ├── ShadowDiffCheck buffer
      ├── Router Trace logged
      └── SystemMetrics updated (Fast-Path ratio, $ saved)
```

- **Dual-Path Execution Architecture (`routerEngine.ts` & `AnalyticsPanel.tsx`):**
  - **Deterministic Fast Path ($\ge 80\%$ confidence):** Resolves pattern-matched structural operations in $\sim 3\text{ms}$ with $\$0.00$ model token cost.
  - **Agentic LLM Path ($< 80\%$ confidence):** Escalates ambiguous, multi-file, or deep analytical prompts to Large Language Models.
  - **Real-Time Confidence Preview Bar (`MissionControl.tsx`):** Dynamic gauge displaying instant confidence scores ($0-100\%$), rule explanations, latency estimates, and cost estimates in real-time as the developer types.
- **Deterministic Fast-Path Action Rules:**
  - `LSP_RENAME`: Fast symbol, table, and column rename across files via LSP `textDocument/rename`.
  - `LSP_REFERENCES`: Instant symbol and table caller lookups via LSP `textDocument/references`.
  - `FORMAT_CODE`: Instant code and SQL query formatting using Prettier/Biome/SQL formatter.
  - `RUN_TESTS`: Automated test suite execution via CLI test runner.
  - `TREE_SITTER_REFACTOR`: Structural AST function, class, and view extraction.
- **Router Analytics Dashboard (`AnalyticsPanel.tsx`):** Live reactive KPI cards (Fast-Path hit ratio %, average latency split, and cumulative dollar token savings), plus an interactive recent router dispatches table with 1-click trace inspection.
- **Router Configuration Modal (`RouterConfigModal.tsx`):** Interactive threshold slider ($50\% - 95\%$) and toggles for deterministic rules with live state updates.
- **Router Trace Inspector (`RouterTraceModal.tsx`):** Step-by-step trace viewer breaking down pattern matching ($S_{pat}$), LSP index score ($S_{LSP}$), ambiguity penalties, execution plans, and formatted JSON traces.
- **Status Bar Integration (`StatusBar.tsx`):** One-click trigger from the signature blue status bar (`Fast-Path (3ms)`) directly opening the Router Trace Inspector.

---

### 5. Mission Control AI Composer & BYOK Models (`/orchestrator`)
- **Multi-Turn AI Composer Sidebar (`MissionControl.tsx`):** Dual-path natural language prompt input with live routing preview, quick intent triggers, direct access to Router Configuration and Trace modals, and seamless shadow workspace diff generation.
- **BYOK (Bring Your Own Key) Provider Selector (`SettingsModal.tsx`):**
  - **OpenAI:** GPT-4o / GPT-4o-mini
  - **Anthropic:** Claude 3.5 Sonnet / Claude 3 Opus
  - **Google Gemini:** Gemini 1.5 Pro / Flash
  - **Local Models:** Ollama integration (Llama 3.1 70B, Qwen 2.5) for $100\%$ offline AI coding.
- **DBMS AI Assistant Triggers:** One-click shortcuts for database prompts ("Generate JOIN query", "Optimize slow query", "Create audit trigger", "Generate DB migration").

---

### 6. Verification Guardrails & Shadow Workspace (`/verification`)
- **Shadow Buffer Generator (`ShadowVerificationDrawer.tsx`):** Writes agent-proposed edits to a temporary shadow buffer prior to mutating workspace files.
- **Inline Unified Diff Preview:** Color-coded diff viewer highlighting additions (`+` green) and deletions (`-` red).
- **AST Bracket Balance Check:** Automatically verifies syntax integrity (matching `{[(]}`) before patches can be applied.
- **LSP Diagnostic Verification:** Ensures proposed changes do not introduce new compiler or lint errors.
- **1-Click Patch Approval & Rollback:** Human-in-the-loop controls to accept patches or restore previous snapshots instantly.

---

### 7. Rust Codebase Indexing Sidecar (`/sidecar`)
- **Rust Sidecar Inspector (`SidecarInspectorModal.tsx`):**
  - **Tree-sitter AST Parsing:** High-speed AST parsing across source files in Rust without Garbage Collection (GC) pauses.
  - **Local Vector Search Store:** Embedded **LanceDB** / **sqlite-vec** with ONNX local embeddings for instant zero-network semantic code search.
  - **Symbol Reference Graph:** Computes function relationships, type hierarchies, and 1-click jump to definition.

---

### 8. Browser-in-the-Loop CDP Preview (`/browser`)
- **Embedded Browser Window (`BrowserPreviewModal.tsx`):** Integrated browser preview window with Playwright & Chrome DevTools Protocol (CDP) hooks for automated visual application testing and DOM inspection.

---

### 9. Git Source Control (`/git`)
- **Git Source Control Panel (`GitPanel.tsx`):** Workspace Git status viewer, modified file diffs, stage/unstage controls, commit message input, and branch management.

---

### 10. Native Desktop Packaging (`/electron`)
- **Cross-Platform Installers (`electron/main.js` & `electron-builder.json`):**
  - **macOS:** `.dmg` and `.zip` installers for Apple Silicon (ARM64) and Intel (x64).
  - **Windows:** `.exe` installer (NSIS) and portable executables.
  - **Linux:** `.AppImage` and `.deb` packages.
- **Native OS Window Controls:** Frameless / `hiddenInset` dark title bar styling (`#1e1e1e`).
