# 🎯 DBC Engineering Track — Focus & Workflow Anchor

> **Single-Track Mandate**: Work on strictly **ONE** active task at a time (`WIP = 1`).
> Never jump to a new task until the active task is verified, type-checked, and committed.
> Any new ideas, bugs, or improvements discovered while working **must be placed into the Parking Lot** immediately without switching context.

---

## 🟢 NOW — Active Task (WIP = 1)

*Only ONE task may reside here at any time. When this task finishes its verification criteria, move it to Completed and pull exactly ONE task from NEXT.*

### [Task] Project Architecture Reorganization & Modal Decoupling
- **Goal:** Group 40 flat components into 6 domain directories (`shell/`, `editor/`, `dbms/`, `agents/`, `modals/`, `ui/`), decouple `page.tsx` using `<ModalHost />`, and establish a single-track workflow.
- **Sub-Steps:**
  - [x] Create domain subdirectories and move all 40 component files with git history.
  - [x] Build `<ModalHost />` centralized dialog dispatcher.
  - [x] Create backwards-compatible `src/components/index.ts` barrel.
  - [x] Refactor `src/app/page.tsx` to eliminate 18 individual modal booleans and replace 75+ lines of modal JSX with `<ModalHost />`.
  - [x] Validate TypeScript compilation (`npx tsc --noEmit`) — 0 errors.
  - [x] Run 108/108 automated test suites across P0-P3 — 100% passing.
  - [ ] Update documentation (`docs/ARCHITECTURE.md`, `README.md`, `code_inspection/MASTER_REMEDIATION_PLAN.md`).
  - [ ] Git commit the structural reorganization.
- **Verification Criteria:**
  - `npx tsc --noEmit` exits with 0.
  - All 4 test scripts in `scripts/` pass with 100% success rate.
  - All documentation accurately reflects the domain architecture.

---

## 🟡 NEXT — Queued Tasks (Max 3)

*Ordered queue for upcoming sprints. Do not start until NOW is marked done.*

1. **P7-F2: Align Sidecar AST Paths with Workspace**
   - *Scope:* Fix `src/lib/sidecar/astIndexer.ts` symbol locations to resolve against actual workspace file paths instead of fictional paths.
   - *Target Files:* [`src/lib/sidecar/astIndexer.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sidecar/astIndexer.ts), [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx)
2. **P3-F1: Table Editor Row Index Desync on Sort/Filter**
   - *Scope:* Ensure edits in `TableDataEditor.tsx` apply to the underlying primary key rather than the filtered visual row index.
   - *Target Files:* [`src/components/dbms/TableDataEditor.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/TableDataEditor.tsx)
3. **P3-F2: Persist Inline Query Result Cell Edits**
   - *Scope:* Wire double-click inline cell edits in `SqlQueryPanel.tsx` to generate and execute an `UPDATE` statement in the SQL driver.
   - *Target Files:* [`src/components/dbms/SqlQueryPanel.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/SqlQueryPanel.tsx)

---

## 🔴 PARKING LOT — Ideas & Bugs (Capture & Defer)

*Notice something while coding? Do NOT context-switch. Append it here with a timestamp and keep your attention on NOW.*

- [ ] **Hardcoded Secrets Cleanup:** Move default NVIDIA key from `src/app/page.tsx:81` to an environment variable (`.env.local`).
- [ ] **Terminal Log Bounding:** Cap terminal log array in `page.tsx` to 500 lines to prevent long-session memory leaks (P7-F7).
- [ ] **Monaco Dark Theme Polish:** Ensure custom Monaco token colors for SQL keywords match the official VS Code Dark+ theme token map.
- [ ] **Agent Flamegraph Scroll Sensitivity:** Dampen wheel zoom sensitivity in `AgentTraceDrawer.tsx`.
- [ ] **Search Regex Escape:** Escape special regex characters in `SearchModal.tsx` replace-all handler (P5-F6).

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

- ✅ **2026-09-16:** Architecture Reorganization & Modal Decoupling — 40 components organized into 6 domains, `ModalHost` deployed, 108/108 tests verified green.
- ✅ **Phase 6:** Agentic Runtime, Governance & Collaborative Council (108 tests passing).
- ✅ **Phase 5:** Dedicated DBMS Studio & AI Schema Engineering.
- ✅ **Phase 0-4:** Code-OSS Shell, Single-Agent MVP, Deterministic Hybrid Router, Browser-in-the-Loop.
