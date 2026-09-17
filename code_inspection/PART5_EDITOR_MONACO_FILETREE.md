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
* **Severity**: 🟠 High
* **Location**: [`src/app/page.tsx:140-160`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L140-L160)
* **Defect Analysis**:
  `workspaceFiles` is serialized to `localStorage` when explicit save actions occur. However, typing changes in the active Monaco buffer modify `activeFile.content` and `isModified: true` without periodically persisting an uncommitted draft cache. An accidental browser reload loses typing changes.
* **Remediation**:
  Add an autosave debounce effect (e.g. 1000ms) that writes uncommitted buffer edits to `dbc_active_draft_v1` in `localStorage`.

---

### Finding ED-02: Folder Expansion State Key Mismatch
* **Severity**: 🟡 Medium
* **Location**: [`src/components/editor/FileExplorer.tsx:30-35`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/editor/FileExplorer.tsx#L30-L35)
* **Defect Analysis**:
  ```ts
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    queries: true,
    migrations: true,
    src: true
  });
  ```
  `FileExplorer` initializes folder expansion state using folder names (`queries`), but `renderNode` checks `openFolders[node.id]`. In `INITIAL_WORKSPACE`, folder IDs are `folder-queries`, `folder-migrations`, `folder-src`. Because of the key mismatch, `openFolders[node.id]` is initially `undefined` (falling back to `?? true`).
* **Remediation**:
  Key the dictionary by `node.id` or `node.path` consistently.

---

### Finding ED-03: Incomplete SQL Token Coverage in Custom Monaco Themes
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/monacoThemes.ts:25-70`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts#L25-L70)
* **Defect Analysis**:
  Theme rules define basic `keyword`, `comment`, and `string` tokens, but lack explicit mappings for `operator.sql`, `delimiter.sql`, and `predefined.sql`. As a result, SQL comparison operators (`=`, `<>`, `LIKE`) and built-in functions (`COUNT`, `MAX`) fall back to default plain text foreground colors.
* **Remediation**:
  Expand token rules across all 4 themes to include `operator.sql`, `delimiter.sql`, `type.sql`, and `identifier.sql`.

---

### Finding ED-04: Hardcoded Mac `⌘` Glyphs on Windows/Linux
* **Severity**: 💡 Low
* **Location**: [`src/components/modals/ShortcutsModal.tsx:25-56`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/ShortcutsModal.tsx#L25-L56)
* **Defect Analysis**:
  The Keyboard Shortcuts modal hardcodes `⌘` symbols on all lines (e.g. `⌘P`, `⌘↵`, `⌘B`). Non-macOS users see Apple command glyphs rather than `Ctrl`.
* **Remediation**:
  Use a helper `isMac ? '⌘' : 'Ctrl+'` to render platform-accurate shortcut keys.

---

## 5. Verification & Test Coverage Matrix

- ✅ Type Safety:
  - `npx tsc --noEmit` exits with 0 errors across all editor components.
- ✅ File Explorer Operations:
  - Adding files/folders places them into targeted parent directories.
  - Renaming updates child descendant paths and open editor tabs.
  - Deleting folders cleanly evicts all child tabs from `openFiles`.
  - Global Replace All safely escapes regex punctuation.
