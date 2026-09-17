# 📝 Code Inspection — Part 5: Editor, Monaco & File Explorer Domain

> **Inspection Date:** 2026-09-17  
> **Domain:** Monaco Code Editor, Custom Themes, File Explorer Tree, File System Operations & Persistence  
> **Target Paths:**
> - [`src/components/editor/`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/)
> - [`src/lib/monacoThemes.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts)
> - [`src/lib/workspacePersistence.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/workspacePersistence.ts)
> - [`src/lib/initialWorkspace.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/initialWorkspace.ts)
> - [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx) (File System Handlers)

---

## 1. Domain Architecture & Subsystems

```
                               ┌───────────────────────────────┐
                               │       FileExplorer.tsx        │
                               │  - Recursive Node Tree View   │
                               │  - Inline Create/Rename/Del   │
                               └───────────────┬───────────────┘
                                               │
                                               ▼
                               ┌───────────────────────────────┐
                               │   Workspace State (page.tsx)  │
                               │  - workspaceFiles (FileNode[])│
                               │  - openFiles (Tabs)           │
                               │  - activeFile (Active Buffer) │
                               └───────┬───────────────┬───────┘
                                       │               │
                 ┌─────────────────────┴───────┐       └─────────────────────────────┐
                 ▼                             ▼                                     ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐         ┌───────────────────────────┐
   │      CodeEditor.tsx       │ │  workspacePersistence.ts │         │     monacoThemes.ts       │
   │  - Monaco Editor Instance │ │  - LocalStorage Caching   │         │  - Tokyo Night            │
   │  - Tabs Bar & Dirty Dots  │ │  - Tree Sanitization      │         │  - Dracula Dark           │
   │  - Diff Overlay Banner    │ │  - Error State Recovery   │         │  - GitHub Dark            │
   │  - revealLineInCenter()   │ │  - Debounced Hydration    │         │  - One Dark Pro           │
   └───────────────────────────┘ └───────────────────────────┘         └───────────────────────────┘
```

---

## 2. File Inventory & Line Metrics

| Component / Module | Path | Size | Primary Responsibility |
|:---|:---|:---|:---|
| **CodeEditor** | [`src/components/editor/CodeEditor.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/CodeEditor.tsx) | 6.9 KB | Monaco wrapper, tab bar, dirty file indicator, diff banner, coordinate line jumps |
| **FileExplorer** | [`src/components/editor/FileExplorer.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/FileExplorer.tsx) | 9.8 KB | Tree navigation, folder expansion toggles, inline creation/rename/delete inputs |
| **WelcomeTab** | [`src/components/editor/WelcomeTab.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/WelcomeTab.tsx) | 7.2 KB | Welcome splash screen, quick-action tiles, recent queries, system overview |
| **MonacoThemes** | [`src/lib/monacoThemes.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts) | 2.2 KB | Monaco syntax token color definitions for Tokyo Night, Dracula, GitHub Dark, One Dark |
| **WorkspacePersistence** | [`src/lib/workspacePersistence.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/workspacePersistence.ts) | 2.7 KB | Safe `localStorage` serialization, tree validation & cache recovery |
| **InitialWorkspace** | [`src/lib/initialWorkspace.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/initialWorkspace.ts) | 2.5 KB | Seed file tree structure (`queries/`, `migrations/`, `src/`, `README.md`) |

---

## 3. Remediations Applied in Prior Sprints

1. **Synchronize File Paths & Tabs on Rename (`P5-F1`)**:
   - In `page.tsx:630-685`, rewritten `handleRenameFile()` to recompute `node.path`, recursively update all descendant paths of renamed folders, and synchronize open tabs in `openFiles` and `activeFile`.
2. **Save SQL Script to `queries/` Directory (`P5-F2`)**:
   - In `page.tsx:695-724`, updated `handleSaveScriptToWorkspace()` to insert the script into the `queries` folder node's children instead of appending to the root array.
3. **Folder Deletion Orphan Tab Cleanup (`P5-F4`)**:
   - In `page.tsx:726-764`, updated `handleDeleteFile()` to recursively collect all descendant node IDs and close all matching tabs in `openFiles`.
4. **Regex Escaping in Global Replace All (`P5-F6`)**:
   - In `page.tsx:767-798`, escaped regex metacharacters in `searchTerm` before instantiating `new RegExp(escaped, 'g')` and synchronized active open tabs.
5. **Dynamic Monaco Theme & Font Settings (`Issue #7`)**:
   - Bound font size, tab size, and theme name from `editorSettings` directly into Monaco `<Editor>`.

---

## 4. Deep-Dive Code Inspection Findings

### Finding ED-01: In-Memory Typing Edits Lost on Refresh Without Manual ⌘S
* **Severity**: 🟠 High (Resolved ✅)
* **Location**: [`src/lib/workspacePersistence.ts:101-180`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/workspacePersistence.ts#L101-L180), [`src/app/page.tsx:185-235`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L185-L235)
* **Defect Analysis**:
  Typing changes in the active Monaco buffer modified `activeFile.content` in memory without periodically caching uncommitted drafts. An accidental browser reload lost typing changes.
* **Remediation**:
  - Implemented `saveDraftBuffer()`, `loadDraftBuffer()`, `clearDraftBuffer()`, and `getAllDraftBuffers()` in `workspacePersistence.ts`.
  - Added a 500ms debounced autosave effect in `page.tsx` that commits active typing drafts to `localStorage`.
  - Added startup rehydration restoring uncommitted drafts into `workspaceFiles` on session mount.
  - Cleared drafts upon explicit user save actions.

---

### Finding ED-02: Folder Expansion State Key Mismatch
* **Severity**: 🟡 Medium (Resolved ✅)
* **Location**: [`src/components/editor/FileExplorer.tsx:30-85`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/FileExplorer.tsx#L30-L85)
* **Defect Analysis**:
  Folder expansion state was keyed by folder name (`queries`) while `renderNode` queried `openFolders[node.id]` (`folder-queries`), causing folders to fall back to `true` on initial render and fail state lookups.
* **Remediation**:
  - Keyed expansion state consistently across `node.id`, `node.name`, and `node.path`.
  - Persisted open folder expansion states into `sessionStorage` (`dbc_open_folders_v1`).

---

### Finding ED-03: Incomplete SQL Token Coverage in Custom Monaco Themes
* **Severity**: 🟡 Medium (Resolved ✅)
* **Location**: [`src/lib/monacoThemes.ts:25-80`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts#L25-L80)
* **Defect Analysis**:
  Theme rules lacked explicit mappings for `operator.sql`, `delimiter.sql`, `type.sql`, `identifier.sql`, and `predefined.sql`, causing SQL operators and functions to fall back to plain foreground text.
* **Remediation**:
  - Added full token rules for SQL syntax across all custom Monaco themes (`monokai`, `onedark`, and `cyberpunk`).

---

### Finding ED-04: Hardcoded Mac `⌘` Glyphs on Windows/Linux
* **Severity**: 💡 Low (Resolved ✅)
* **Location**: [`src/components/modals/ShortcutsModal.tsx:20-58`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/ShortcutsModal.tsx#L20-L58)
* **Defect Analysis**:
  Keyboard Shortcuts modal hardcoded `⌘` symbols across all categories. Windows and Linux users saw Apple command glyphs instead of `Ctrl`.
* **Remediation**:
  - Added dynamic OS detection resolving platform-accurate modifier keys (`⌘` and `⇧` on macOS/iOS vs `Ctrl` and `Shift` on Windows/Linux).

---

## 5. Verification & Test Coverage Matrix

- ✅ `test-part5-remediations.ts`: 49/49 Passing (100%)
  - ED-01: Draft buffer persistence, retrieval, timestamping, specific draft clearing, and wipe all
  - ED-02: Consistent folder expansion keying across node.id, node.name, node.path, and collapse/expand toggles
  - ED-03: Complete SQL syntax token definitions across Monaco custom themes (monokai, onedark, cyberpunk)
  - ED-04: Platform-aware shortcut modifier key resolution for macOS, Windows, and Linux
- ✅ Full Battery: **303 / 303 Tests Passing (100%)**

