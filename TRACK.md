# 🎯 DBC Engineering Track — Focus & Workflow Anchor

> **Single-Track Mandate**: Work on strictly **ONE** active task at a time (`WIP = 1`).
> Never jump to a new task until the active task is verified, type-checked, and committed.
> Any new ideas, bugs, or improvements discovered while working **must be placed into the Parking Lot** immediately without switching context.

---

## 🟢 NOW — Active Task (WIP = 1)

*Only ONE task may reside here at any time. When this task finishes its verification criteria, move it to Completed and pull exactly ONE task from NEXT.*

### [Task] P4-F2: Async Router Escalation to Streaming BYOK Client
- **Goal:** Upgrade `routeRequest()` in `routerEngine.ts` to support asynchronous execution and real streaming BYOK completions.
- **Sub-Steps:**
  - [ ] Support async signature in `routeRequest()`.
  - [ ] Connect LLM escalation to `byokClient.executeChatCompletion()`.
  - [ ] Verify non-blocking UI during reasoning.
  - [ ] Validate with `npx tsc --noEmit`.
- **Verification Criteria:**
  - Fast-path remains instantaneous (<5ms) while LLM path executes asynchronously without freezing the app shell.
  - `npx tsc --noEmit` exits with 0.

---

## 🟡 NEXT — Queued Tasks (Max 3)

*Ordered queue for upcoming sprints. Do not start until NOW is marked done.*

1. **P6-F4: Browser Shortcut Guard on ⌘W and ⌘N**
   - *Scope:* Prevent accidental browser tab closure on `⌘W` and window opening on `⌘N` when working in DBC.
   - *Target Files:* [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx)
2. **P5-F3: In-Memory Workspace Autosave Persistence**
   - *Scope:* Persist unsaved buffer edits periodically to localStorage cache with dirty indicators.
   - *Target Files:* [`src/lib/workspacePersistence.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/workspacePersistence.ts), [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx)
3. **P6-F3: Monaco & Shell Theme Unification**
   - *Scope:* Sync custom Monaco theme tokens dynamically to HTML root `data-theme` and CSS variables.
   - *Target Files:* [`src/lib/monacoThemes.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts), [`src/app/globals.css`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/globals.css)

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

- ✅ **2026-09-17:** Phase 1 Showstoppers & Core Hardening — Resolved P3-F1 (Table editor sort/filter row desync), P3-F2 (Inline query edit UPDATE persistence), P2-F1 (Editor buffer revert on diff rejection), P2-F2 (Target file snapshot rollback), P5-F1 (Full path & tab synchronization on rename), P5-F2 (Save SQL scripts to queries/), P3-F3 (SQL mutation semicolon sanitization), P3-F4 (Dropped column migration generation with safety warnings), P5-F4 (Folder deletion orphan tab cleanup), P7-F3 (Monaco line scroll on AST symbol jump), P5-F6 (Regex escape in replace-all), and P7-F7 (Terminal log bounding). 108/108 tests passing.
- ✅ **2026-09-17:** Codebase Audit & Cleanup — Purged dead code (`fileTools.ts`, `terminalRunner.ts`), obsolete fork scripts, redundant inspection drafts, sanitized leaked API keys, and resolved P7-F2, P7-F4, P2-F6, and P4-F1.
- ✅ **2026-09-16:** Architecture Reorganization & Modal Decoupling — 40 components organized into 6 domains, `ModalHost` deployed, 108/108 tests verified green.
- ✅ **Phase 6:** Agentic Runtime, Governance & Collaborative Council (108 tests passing).
- ✅ **Phase 5:** Dedicated DBMS Studio & AI Schema Engineering.
- ✅ **Phase 0-4:** Code-OSS Shell, Single-Agent MVP, Deterministic Hybrid Router, Browser-in-the-Loop.
