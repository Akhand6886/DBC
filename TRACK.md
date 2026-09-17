# 🎯 DBC Engineering Track — Focus & Workflow Anchor

> **Single-Track Mandate**: Work on strictly **ONE** active task at a time (`WIP = 1`).
> Never jump to a new task until the active task is verified, type-checked, and committed.
> Any new ideas, bugs, or improvements discovered while working **must be placed into the Parking Lot** immediately without switching context.

---

## 🟢 NOW — Active Task (WIP = 1)

*Only ONE task may reside here at any time. When this task finishes its verification criteria, move it to Completed and pull exactly ONE task from NEXT.*

### [Task] Part 7: Risk Matrix & Production Hardening
- **Goal:** Execute final production hardening and risk matrix verification from [`code_inspection/PART7_TESTS_HEALTH_MATRIX.md`](file:///Users/alpha/Desktop/antigavity/DBC/code_inspection/PART7_TESTS_HEALTH_MATRIX.md).
- **Sub-Steps:**
  - [ ] Consolidate full test regression suite across all 7 inspection parts.
  - [ ] Verify static type checking and zero compilation errors (`npx tsc --noEmit`).
  - [ ] Audit error boundaries and recovery lifecycle.
  - [ ] Document final production readiness signoff.
- **Verification Criteria:**
  - All test suites pass 100% cleanly in headless environment.
  - Zero TypeScript compiler diagnostics.

---

## 🟡 NEXT — Queued Tasks (Max 3)

*Ordered queue for upcoming sprints. Do not start until NOW is marked done.*

1. **Final Release Signoff & Production Verification Documentation**

---

## 🔴 PARKING LOT — Ideas & Bugs (Capture & Defer)

*Notice something while coding? Do NOT context-switch. Append it here with a timestamp and keep your attention on NOW.*

- [x] **Hardcoded Secrets Cleanup:** Removed default hardcoded NVIDIA key from `src/app/page.tsx`.
- [x] **Terminal Log Bounding:** Cap terminal log array in `page.tsx` to 500 lines to prevent long-session memory leaks (P7-F7).
- [ ] **Monaco Dark Theme Polish:** Ensure custom Monaco token colors for SQL keywords match the official VS Code Dark+ theme token map.
- [ ] **Agent Flamegraph Scroll Sensitivity:** Dampen wheel zoom sensitivity in `AgentTraceDrawer.tsx`.
- [x] **Search Regex Escape:** Escape special regex characters in `SearchModal.tsx` replace-all handler (P5-F6).

---

## 📐 The 4 Golden Rules of Single-Track Development

```
                ┌───────────────────────────────┐
                │        NEW TASK / IDEA        │
                └───────────────┬───────────────┘
                                │
                                ▼
                   Is there a task in NOW?
                                │
               ┌────────────────┴────────────────┐
               │ YES                             │ NO
               ▼                                 ▼
   Add to 🔴 PARKING LOT            Move to 🟢 NOW
   (Do NOT switch context)          (Execute & Verify)
```

1. **WIP = 1 (Strict Work-In-Progress Limit)**
   Never have more than one task in the active state. If an urgent bug appears, formally pause the active task by writing down the exact stopping point before switching.
2. **The "Vertical Slice" Law**
   Finish each task through all layers (Backend -> UI -> Type check -> Integration test -> Docs) before moving to the next. Avoid half-finishing 5 different files.
3. **Verify with Lightweight Checks**
   Per workspace guidelines, do NOT run full production builds on every edit. Use `npx tsc --noEmit` and targeted test scripts (`ts-node scripts/...`).
4. **Clean Domain Boundaries**
   Keep changes confined to their respective domain (`shell/`, `editor/`, `dbms/`, `agents/`, `modals/`). When editing a modal, work through `ModalHost` rather than bloating `page.tsx`.

---

## 📜 Completed Milestones

- ✅ **2026-09-17:** Part 6 (Shell, ModalHost & App Architecture) Domain Remediation — Resolved SH-01 (Browser shortcut collision prevention on `⌘W` and `⌘N` with `⌥W` / `Alt+W` and `⌥N` / `Alt+N` safe aliases and platform modifier detection in `ShortcutsModal.tsx`), SH-02 (Monaco & App Shell theme isolation resolved with scoped CSS custom properties in `globals.css` and reactive `dataset.theme` document root synchronization in `page.tsx`), SH-03 (Dynamic Command Palette table action generation from `realSqlDriver.getTableNames()` for DDL inspection, data grid editor, and top-100 queries across all schema tables), and SH-04 (TopMenuBar touch dismissal with transparent backdrop overlay `onTouchStart` and fluid desktop hover-menu switching across all menu items). All 56 Part 6 remediation tests passing; all 359 platform tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Part 5 (Monaco Editor & Workspace Tree) Domain Remediation — Resolved ED-01 (Debounced active typing buffer draft persistence to `localStorage` and startup rehydration), ED-02 (Consistent folder expansion keying across `node.id`, `node.name`, and `node.path` with `sessionStorage` caching in `FileExplorer.tsx`), ED-03 (Complete SQL syntax token coverage across Monaco custom themes `monokai`, `onedark`, `cyberpunk`), and ED-04 (Platform-aware keyboard shortcut modifier key rendering `⌘`/`⇧` on Mac vs `Ctrl`/`Shift` on Windows/Linux). All 49 Part 5 remediation tests passing; all 303 platform tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Part 4 (Verification & Shadow Workspace) Domain Remediation — Resolved VF-01 (Myers / LCS unified line differ replacing naive positional indexing and preventing cascading deletions/additions on line-0 prepending), VF-02 (Strict syntax and bracket balance verification with comment and string stripping and 0-tolerance matching pairs), and VF-03 (Instant search query and lifecycle status filtering tabs in `ShadowVerificationDrawer`). All 49 Part 4 remediation tests passing; all 254 platform tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Part 3 (Deterministic Router & Protocol Layer) Domain Remediation — Resolved RT-01 (Async `executeRoutedPrompt` Promise resolution with live BYOK escalation and graceful contextual fallback), RT-02 (Token-based Jaccard similarity and substring proximity weighting in AST Sidecar semantic search), RT-03 (Rolling execution latency tracking feeding real-time dynamic preview metrics), and RT-04 (Quoted, backticked, and bracketed identifier extraction in `intentClassifier` for SQL, TypeScript, and JSON). All 50 Part 3 remediation tests passing; all 205 platform tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Part 2 (DBMS Studio & SQL Engine) Domain Remediation — Resolved DB-01 (JOIN column namespace collision prevention with table qualification), DB-02 (Parameterized DDL type parsing preserving DECIMAL(10, 2) and VARCHAR(255)), DB-03 (Database Memory invariant rules persistence and resetToDefaults with deep-cloning), and DB-04 (Dropdown menu keyboard accessibility and Escape key listener in SqlQueryPanel). All 26 Part 2 remediation tests passing; all 155 platform tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Part 1 (Agents & AI Personas) Domain Remediation — Resolved AG-01 (Anthropic CORS API proxy route), AG-02 (Progressive SSE token streaming in MissionControl & dbAgentRuntime), AG-03 (Asynchronous distributed lock retry with backoff in collaborativeSessionManager), and AG-04 (Intent-weighted specialized persona classification with confidence scoring & Auto selector). All 21 Part 1 remediation tests passing; all 108 baseline tests passing; 0 TypeScript errors.
- ✅ **2026-09-17:** Comprehensive Modular Code Inspection — Completed partition-by-partition code inspection across 7 domains (`PART1_AGENTS_AI.md` through `PART7_TESTS_HEALTH_MATRIX.md`), master index (`README.md`), and risk matrix, saved under `code_inspection/`. 108/108 tests passing, 0 TypeScript errors.
- ✅ **2026-09-17:** Phase 1 Showstoppers & Core Hardening — Resolved P3-F1 (Table editor sort/filter row desync), P3-F2 (Inline query edit UPDATE persistence), P2-F1 (Editor buffer revert on diff rejection), P2-F2 (Target file snapshot rollback), P5-F1 (Full path & tab synchronization on rename), P5-F2 (Save SQL scripts to queries/), P3-F3 (SQL mutation semicolon sanitization), P3-F4 (Dropped column migration generation with safety warnings), P5-F4 (Folder deletion orphan tab cleanup), P7-F3 (Monaco line scroll on AST symbol jump), P5-F6 (Regex escape in replace-all), and P7-F7 (Terminal log bounding). 108/108 tests passing.
- ✅ **2026-09-17:** Codebase Audit & Cleanup — Purged dead code (`fileTools.ts`, `terminalRunner.ts`), obsolete fork scripts, redundant inspection drafts, sanitized leaked API keys, and resolved P7-F2, P7-F4, P2-F6, and P4-F1.
- ✅ **2026-09-16:** Architecture Reorganization & Modal Decoupling — 40 components organized into 6 domains, `ModalHost` deployed, 108/108 tests verified green.
- ✅ **Phase 6:** Agentic Runtime, Governance & Collaborative Council (108 tests passing).
- ✅ **Phase 5:** Dedicated DBMS Studio & AI Schema Engineering.
- ✅ **Phase 0-4:** Code-OSS Shell, Single-Agent MVP, Deterministic Hybrid Router, Browser-in-the-Loop.
