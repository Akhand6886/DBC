# 🖥️ Code Inspection — Part 6: Shell, ModalHost & App Architecture Domain

> **Inspection Date:** 2026-09-17  
> **Domain:** Application Shell, Activity Bar, Top Menu Bar, Status Bar, Terminal Panel, ModalHost & Root Layout  
> **Target Paths:**
> - [`src/components/shell/`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/)
> - [`src/components/modals/ModalHost.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/ModalHost.tsx)
> - [`src/components/ui/ToastProvider.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ui/ToastProvider.tsx)
> - [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx)
> - [`src/app/layout.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/layout.tsx)
> - [`src/app/globals.css`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/globals.css)

---

## 1. Domain Architecture & Subsystems

```
   ┌───────────────────────────────────────────────────────────┐
   │                    TopMenuBar.tsx                         │
   │  [File]  [Edit]  [View]  [Database]  [Agents]  [Help]     │
   └─────────────────────────────┬─────────────────────────────┘
                                 │
   ┌───────────────┬─────────────┴─────────────┬───────────────┐
   │ ActivityBar   │        Main Viewport      │ MissionControl│
   │ (Left Rail)   │                           │ (AI Drawer)   │
   │ - DBMS Studio │ ┌───────────────────────┐ │ - Model BYOK  │
   │ - Code Editor │ │   SqlQueryPanel.tsx   │ │ - Chat Feed   │
   │ - File Tree   │ │          OR           │ │ - Trace Link  │
   │ - Git Panel   │ │    CodeEditor.tsx     │ └───────────────┘
   │ - Settings    │ └───────────┬───────────┘
   └───────────────┘             │
                                 ▼
                   ┌───────────────────────────┐
                   │    TerminalPanel.tsx      │
                   │  - Bounded Logs (500 max) │
                   │  - Test Suite Runner      │
                   └─────────────┬─────────────┘
                                 │
   ┌─────────────────────────────┴─────────────────────────────┐
   │                    StatusBar.tsx                          │
   │  [SQLite: Ready]  [Git: main]  [UTF-8]  [Errors: 0]       │
   └───────────────────────────────────────────────────────────┘
                                 │
                                 ▼
   ┌───────────────────────────────────────────────────────────┐
   │                    ModalHost.tsx                          │
   │  Single activeModal Dispatcher (Replaces 18 useState)    │
   │  [Search] [Settings] [Diff] [Branch] [Lineage] [Shortcuts]│
   └───────────────────────────────────────────────────────────┘
```

---

## 2. File Inventory & Line Metrics

| Component / Module | Path | Size | Primary Responsibility |
|:---|:---|:---|:---|
| **TopMenuBar** | [`src/components/shell/TopMenuBar.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/TopMenuBar.tsx) | 17.4 KB | Desktop application menu bar with dropdown actions and shortcut labels |
| **ActivityBar** | [`src/components/shell/ActivityBar.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/ActivityBar.tsx) | 3.2 KB | Left primary navigation rail switching between DBMS, Editor, and Git views |
| **StatusBar** | [`src/components/shell/StatusBar.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/StatusBar.tsx) | 3.7 KB | Bottom telemetry bar showing active connection, latency, git branch, cursor |
| **TerminalPanel** | [`src/components/shell/TerminalPanel.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/TerminalPanel.tsx) | 3.9 KB | Bounded interactive terminal panel with test runner button and clear action |
| **ErrorBoundary** | [`src/components/shell/ErrorBoundary.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/ErrorBoundary.tsx) | 5.5 KB | React error boundary with crash diagnostic report and workspace recovery |
| **ModalHost** | [`src/components/modals/ModalHost.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/ModalHost.tsx) | 5.9 KB | Decoupled modal container hosting all 19 system dialogs via unified state |
| **ToastProvider** | [`src/components/ui/ToastProvider.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ui/ToastProvider.tsx) | 2.8 KB | Global floating notification toast stack (info, success, warning, error) |
| **AppRoot** | [`src/app/page.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx) | 47.8 KB | Root coordinator orchestrating layout, shortcuts, tabs, and subsystem state |

---

## 3. Remediations Applied in Prior Sprints

1. **TopMenuBar Run Query Wiring (`P7-F4`)**:
   - In `src/app/page.tsx:949-955`, wired `onRunQuery` prop of `TopMenuBar` to invoke `executeSqlRef.current()` and dispatch `dbc-execute-sql`.
2. **Terminal Log Bounding (`P7-F7`)**:
   - In `src/app/page.tsx:820-826`, bounded `handleLogTerminal()` to the last 500 entries using `updated.slice(updated.length - 500)` to eliminate long-session memory leaks.
3. **Monaco `⌘↵` Double Execution Eliminated (`P6-F1`)**:
   - Guarded global keydown listener in `page.tsx:302-306` when Monaco editor has focus so queries run exactly once.
4. **Monaco Native `⌘F` Restored (`P6-F2`)**:
   - Checked `e.target.closest('.monaco-editor')` in global keydown so in-editor find opens inside Monaco while `⌘⇧F` triggers global workspace search.
5. **Terminal Clear Button Lockout Bug (`P7-F1`)**:
   - Removed conflicting `localLogs` state from `TerminalPanel.tsx` and centralized terminal logs in `page.tsx`.
6. **ErrorBoundary Cache Reset (`Issue #6`)**:
   - Corrected storage key clearance in `ErrorBoundary.tsx` to clear `dbc_workspace_state_v1`.

---

## 4. Deep-Dive Code Inspection Findings

### Finding SH-01: Browser Shortcut Collision on `⌘W` and `⌘N`
* **Severity**: 🟠 High
* **Location**: [`src/app/page.tsx:425-450`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L425-L450)
* **Defect Analysis**:
  ```ts
  // ⌘W: Close Active Tab
  if (mod && key === 'w') {
    e.preventDefault();
    ...
  }
  ```
  In standard web browsers (Google Chrome, Apple Safari), `⌘W` (close browser tab) and `⌘N` (new browser window) are reserved by the OS window manager and cannot be prevented by web pages. When running in web mode, pressing `⌘W` closes the entire DBC application.
* **Remediation**:
  Check `typeof window !== 'undefined' && !!(window as any).electronAPI`. When running in standard web mode, alias tab close to `⌥W` (Option+W) and display a warning toast.

---

### Finding SH-02: Theme Isolation Between Monaco and Application Shell
* **Severity**: 🟡 Medium
* **Location**: [`src/app/globals.css`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/globals.css) & [`src/lib/monacoThemes.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/monacoThemes.ts)
* **Defect Analysis**:
  Selecting a custom theme (e.g. Tokyo Night or Dracula) updates the Monaco editor canvas. However, the application shell (Activity Bar, Top Menu Bar, Status Bar, Sidebars) uses hardcoded Tailwind hex codes (`#1e1e1e`, `#252526`, `#3c3c3c`).
* **Remediation**:
  Define CSS custom variables in `globals.css` (`--bg-shell`, `--bg-sidebar`, `--border-color`) and set `document.documentElement.dataset.theme` when the user selects a theme.

---

### Finding SH-03: Command Palette Table Actions Hardcoded to `'users'`
* **Severity**: 🟡 Medium
* **Location**: [`src/components/modals/CommandPalette.tsx:45-55`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/CommandPalette.tsx#L45-L55)
* **Defect Analysis**:
  Quick actions in the Command Palette (e.g. "Select Top 100 Rows", "Inspect Table Schema") default to the `'users'` table. If the database has tables like `roles`, `audit_logs`, or custom user tables, they are not accessible via Command Palette search.
* **Remediation**:
  Dynamically populate Command Palette actions from `realSqlDriver.getTableNames()`.

---

### Finding SH-04: Menu Item Hover Persistence on Touch Devices
* **Severity**: 💡 Low
* **Location**: [`src/components/shell/TopMenuBar.tsx:180-220`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/shell/TopMenuBar.tsx#L180-L220)
* **Defect Analysis**:
  TopMenuBar dropdowns open on mouse hover. On touch devices, tapping an item opens the menu but tapping outside does not dismiss it because touch events do not trigger mouseout.
* **Remediation**:
  Add an invisible backdrop overlay (`fixed inset-0 z-30`) while any menu is open.

---

## 5. Verification & Test Coverage Matrix

- ✅ Shell Architecture:
  - 40 components organized across 6 clean domains.
  - `ModalHost.tsx` decouples 19 dialogs with zero prop-drilling into `page.tsx`.
  - Zero TypeScript compilation errors (`npx tsc --noEmit`).
  - Terminal bounded to 500 lines verified under high-frequency query bursts.
