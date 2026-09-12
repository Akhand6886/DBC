# DBC Project — Issues & Inspection Tracker

> This tracker records all issues identified across the 7 partitions of the DBC project and will be updated as each fix is applied.

---

## 🚨 Issues Summary & Status

| # | Issue / Bug | Severity | File | Status | Fix Details |
|---|-------------|----------|------|--------|-------------|
| 1 | Simulated `tokensUsed: 420` shows fake costs | 🐛 High | [`src/lib/agent/byokClient.ts:220`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L220) | ✅ **FIXED** | Set `tokensUsed: 0` in simulation mode |
| 2 | LSP_RENAME always renames to `'executeApp'` | 🐛 Medium | [`src/lib/router/deterministicEngine.ts:14`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/deterministicEngine.ts#L14) | ⏳ Pending | Pass user's target symbol name through from router intent |
| 3 | SELECT ignores WHERE / JOIN / LIMIT clauses | ⚠️ Medium | [`src/lib/db/sqlDriver.ts:129-143`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L129-L143) | ⏳ Pending | Implement basic WHERE/LIMIT filtering in simulated SQL driver |
| 4 | ⌘Enter doesn't execute SQL (global handler) | 🐛 Medium | [`src/app/page.tsx:260-268`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L260-L268) | ⏳ Pending | Wire global shortcut to invoke active `SqlQueryPanel` execution |
| 5 | Workspace restore cannot find nested files | 🐛 Medium | [`src/app/page.tsx:132-137`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L132-L137) | ⏳ Pending | Implement recursive file lookup on saved state restoration |
| 6 | ErrorBoundary resets wrong cache keys | ⚠️ Low | [`src/components/ErrorBoundary.tsx:40-41`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ErrorBoundary.tsx#L40-L41) | ⏳ Pending | Target key `dbc_workspace_state_v1` on reset |
| 7 | Editor settings (font/tab/theme) never applied to Monaco | ⚠️ Medium | [`src/components/CodeEditor.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/CodeEditor.tsx) & [`src/components/SettingsModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SettingsModal.tsx) | ⏳ Pending | Pass user settings into Monaco `<Editor>` props and theme loader |
| 8 | Bracket check regex unbalanced | ⚠️ Low | [`src/lib/verification/shadowBuffer.ts:31`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/verification/shadowBuffer.ts#L31) | ⏳ Pending | Add `)` to closing bracket pattern |
| 9 | Tools/Export dropdowns lack outside-click dismiss | ⚠️ Low | [`src/components/SqlQueryPanel.tsx:176-217`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SqlQueryPanel.tsx#L176-L217) | ⏳ Pending | Add backdrop overlay for clean outside-click closure |
| 10 | `handleAddFile` always targets `queries/` path | ⚠️ Low | [`src/app/page.tsx:452-462`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L452-L462) | ⏳ Pending | Place new files in currently active/selected directory |
| 11 | Empty API key string `''` persisted | ⚠️ Low | [`src/app/page.tsx:200-226`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L200-L226) | ⏳ Pending | Clean up empty key entries before persisting |
| 12 | `explainAnalyzer` PlanNode type error (`'Filter'`) | ⚠️ Low | [`src/lib/db/explainAnalyzer.ts:56`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/explainAnalyzer.ts#L56) | ⏳ Pending | Fix type casting to properly support all PlanNode types |

---

## Detailed Partition Breakdown

### Partition 1: Core Types & Config (Status: ✅ Clean)
- Files: `types.ts`, `initialWorkspace.ts`, `workspacePersistence.ts`
- Result: Clean typing and state schema.

### Partition 2: Engine Layer (Status: 1 Fixed, 4 Pending)
- Files: 13 files across `agent/`, `db/`, `router/`, `sidecar/`, `verification/`
- **Issue 1**: [byokClient.ts:220](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L220) — ✅ Fixed (tokensUsed set to 0 in simulation mode)
- **Issue 2**: [deterministicEngine.ts:14](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/deterministicEngine.ts#L14) — LSP_RENAME hardcoded to `'executeApp'`
- **Issue 3**: [sqlDriver.ts:129-143](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L129-L143) — SELECT ignores WHERE/JOIN/LIMIT
- **Issue 8**: [shadowBuffer.ts:31](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/verification/shadowBuffer.ts#L31) — Bracket check regex unbalanced
- **Issue 12**: [explainAnalyzer.ts:56](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/explainAnalyzer.ts#L56) — ExplainAnalyzer cast `as any` for `'Filter'`

### Partition 3: App Shell (Status: 4 Pending)
- Files: `layout.tsx`, `page.tsx`
- **Issue 4**: [page.tsx:260-268](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L260-L268) — ⌘Enter global handler only triggers toast
- **Issue 5**: [page.tsx:132-137](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L132-L137) — File restoration only searches root nodes
- **Issue 10**: [page.tsx:452-462](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L452-L462) — `handleAddFile` always targets `queries/`
- **Issue 11**: [page.tsx:200-226](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L200-L226) — Empty string persisted for cleared keys

### Partition 4: Shell Components (Status: 1 Pending)
- Files: `TopMenuBar`, `ActivityBar`, `StatusBar`, `ErrorBoundary`, `ToastProvider`, `CommandPalette`
- **Issue 6**: [ErrorBoundary.tsx:40-41](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ErrorBoundary.tsx#L40-L41) — Cache reset targets wrong localStorage keys

### Partition 5: Editor & File Components (Status: 1 Pending)
- Files: `CodeEditor`, `FileExplorer`, `SearchModal`, `TerminalPanel`, `WelcomeTab`, `ShortcutsModal`
- **Issue 7**: [CodeEditor.tsx](file:///Users/alpha/Desktop/antigavity/DBC/src/components/CodeEditor.tsx) — Monaco editor settings (font, tabSize, theme) hardcoded and not connected to user preferences

### Partition 6: Database Components (Status: 1 Pending)
- Files: `SqlQueryPanel`, `DbObjectExplorer`, `DbConnectionPanel`, etc.
- **Issue 9**: [SqlQueryPanel.tsx:176-217](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SqlQueryPanel.tsx#L176-L217) — Export and tools dropdowns do not close on outside click

### Partition 7: Modal & AI Components (Status: 1 Pending)
- Files: `MissionControl`, `SettingsModal`, `GitPanel`, etc.
- **Issue 7 (continued)**: [SettingsModal.tsx:208-233](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SettingsModal.tsx#L208-L233) — Theme options saved to state but never applied to editor or theme stylesheet
