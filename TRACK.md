# 🎯 DBC Engineering Track — Focus & Workflow Anchor

> **Single-Track Mandate**: Work on strictly **ONE** active task at a time (`WIP = 1`).
> Never jump to a new task until the active task is verified, type-checked, and committed.
> Any new ideas, bugs, or improvements discovered while working **must be placed into the Parking Lot** immediately without switching context.

---

## 🟢 NOW — Active Task (WIP = 1)

*Only ONE task may reside here at any time. When this task finishes its verification criteria, move it to Completed and pull exactly ONE task from NEXT.*

### [Task] P3-F1: Table Editor Row Index Desync on Sort/Filter
- **Goal:** Ensure cell edits in `TableDataEditor.tsx` apply to the underlying primary key record rather than the visual filtered/sorted row index.
- **Sub-Steps:**
  - [ ] Inspect row index lookup in `TableDataEditor.tsx` during edits.
  - [ ] Map edits directly by primary key (`row.id` or unique key) instead of array index.
  - [ ] Verify sorting by column and filtering rows does not edit the wrong underlying data.
  - [ ] Validate with `npx tsc --noEmit`.
- **Verification Criteria:**
  - Editing a cell in a sorted/filtered table correctly mutates the target record in the database driver.
  - `npx tsc --noEmit` exits with 0.

---

## 🟡 NEXT — Queued Tasks (Max 3)

*Ordered queue for upcoming sprints. Do not start until NOW is marked done.*

1. **P3-F2: Persist Inline Query Result Cell Edits**
   - *Scope:* Wire double-click inline cell edits in `SqlQueryPanel.tsx` to generate and execute an `UPDATE` statement in the SQL driver.
   - *Target Files:* [`src/components/dbms/SqlQueryPanel.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/SqlQueryPanel.tsx)
2. **P2-F1: Editor Buffer Revert on Diff Rejection**
   - *Scope:* When user clicks Reject on a shadow diff check, explicitly restore editor buffer to pre-diff snapshot.
   - *Target Files:* [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx)
3. **P5-F1: Sync File Paths on Rename**
   - *Scope:* Ensure renaming a file or folder in `FileExplorer.tsx` recursively updates open tabs and parent path strings.
   - *Target Files:* [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx), [`src/components/editor/FileExplorer.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/FileExplorer.tsx)

---

## 🔴 PARKING LOT — Ideas & Bugs (Capture & Defer)

*Notice something while coding? Do NOT context-switch. Append it here with a timestamp and keep your attention on NOW.*

- [x] **Hardcoded Secrets Cleanup:** Removed default hardcoded NVIDIA key from `src/app/page.tsx`.
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

- ✅ **2026-09-17:** Codebase Audit & Cleanup — Purged dead code (`fileTools.ts`, `terminalRunner.ts`), obsolete fork scripts, redundant inspection drafts, sanitized leaked API keys, and resolved P7-F2 (Sidecar AST workspace path alignment), P7-F4 (TopMenuBar Run Query wiring), P2-F6 (`viewMode` removal), and P4-F1 (Contextual LLM engine synthesis).
- ✅ **2026-09-16:** Architecture Reorganization & Modal Decoupling — 40 components organized into 6 domains, `ModalHost` deployed, 108/108 tests verified green.
- ✅ **Phase 6:** Agentic Runtime, Governance & Collaborative Council (108 tests passing).
- ✅ **Phase 5:** Dedicated DBMS Studio & AI Schema Engineering.
- ✅ **Phase 0-4:** Code-OSS Shell, Single-Agent MVP, Deterministic Hybrid Router, Browser-in-the-Loop.
