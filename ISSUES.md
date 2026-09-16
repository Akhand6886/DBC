# DBC Project — Issues & Inspection Tracker

> This tracker records all issues identified across the 7 partitions of the DBC project and will be updated as each fix is applied.

---

## 🚨 Issues Summary & Status

| # | Issue / Bug | Severity | File | Status | Fix Details |
|---|-------------|----------|------|--------|-------------|
| 1 | Simulated `tokensUsed: 420` shows fake costs | 🐛 High | [`src/lib/agent/byokClient.ts:220`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L220) | ✅ **FIXED** | Set `tokensUsed: 0` in simulation mode |
| 2 | LSP_RENAME always renames to `'executeApp'` | 🐛 Medium | [`src/lib/router/deterministicEngine.ts:14`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/deterministicEngine.ts#L14) | ✅ **FIXED** | Passed user's target symbol name through `CodeIntent.newSymbolName` |
| 3 | SELECT ignores WHERE / JOIN / LIMIT clauses | ⚠️ Medium | [`src/lib/db/sqlDriver.ts:129-143`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L129-L143) | ✅ **FIXED** | Implemented WHERE condition evaluator, JOIN, ORDER BY, and LIMIT/OFFSET |
| 4 | ⌘Enter doesn't execute SQL (global handler) | 🐛 Medium | [`src/app/page.tsx:260-268`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L260-L268) | ✅ **FIXED** | Wired global ⌘Enter shortcut to SqlQueryPanel execution handler |
| 5 | Workspace restore cannot find nested files | 🐛 Medium | [`src/app/page.tsx:132-137`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L132-L137) | ✅ **FIXED** | Implemented recursive file tree search via `findFileNodeById` during hydration |
| 6 | ErrorBoundary resets wrong cache keys | ⚠️ Low | [`src/components/ErrorBoundary.tsx:40-41`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ErrorBoundary.tsx#L40-L41) | ✅ **FIXED** | Invoked `clearPersistedWorkspace()` and cleared `dbc_workspace_state_v1` |
| 7 | Editor settings (font/tab/theme) never applied to Monaco | ⚠️ Medium | [`src/components/CodeEditor.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/CodeEditor.tsx) & [`src/components/SettingsModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SettingsModal.tsx) | ✅ **FIXED** | Passed editorSettings to Monaco `<Editor>` instances & registered custom themes |
| 8 | Bracket check regex unbalanced | ⚠️ Low | [`src/lib/verification/shadowBuffer.ts:31`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/verification/shadowBuffer.ts#L31) | ✅ **FIXED** | Added `)` to closing bracket pattern `/[}\])]/g` |
| 9 | Tools/Export dropdowns lack outside-click dismiss | ⚠️ Low | [`src/components/SqlQueryPanel.tsx:176-217`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SqlQueryPanel.tsx#L176-L217) | ✅ **FIXED** | Added transparent backdrop overlay to dismiss on outside click |
| 10 | `handleAddFile` always targets `queries/` path | ⚠️ Low | [`src/app/page.tsx:483-524`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L483-L524) & [`src/components/FileExplorer.tsx:8-200`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/FileExplorer.tsx#L8-L200) | ✅ **FIXED** | Target currently active directory/selected folder recursively with visual target indicators and inline quick-add buttons |
| 11 | Empty API key string `''` persisted | ⚠️ Low | [`src/app/page.tsx:218-232`](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L218-L232) | ✅ **FIXED** | Sanitize and filter out empty string keys before saving |
| 12 | `explainAnalyzer` PlanNode type error (`'Filter'`) | ⚠️ Low | [`src/lib/db/explainAnalyzer.ts:7`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/explainAnalyzer.ts#L7) | ✅ **FIXED** | Added `'Filter'` to `PlanNode.nodeType` union; eliminated `as any` cast |

---

## 🚀 Enhancements & External Model Integrations

| Feature / Model | Provider | Details |
|---|---|---|
| **Moonshot Kimi-K3** | NVIDIA NIM | Configured `moonshotai/kimi-k3` with `reasoning_effort: "max"`, `temperature: 1`, `max_tokens: 16384`, `seed: 0`, and SSE token streaming (`streamNvidia`) |

---

## Detailed Partition Breakdown

### Partition 1: Core Types & Config (Status: ✅ Clean)
- Files: `types.ts`, `initialWorkspace.ts`, `workspacePersistence.ts`
- Result: Clean typing and state schema.

### Partition 2: Engine Layer (Status: ✅ 5 Fixed)
- Files: 13 files across `agent/`, `db/`, `router/`, `sidecar/`, `verification/`
- **Issue 1**: [byokClient.ts:220](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/agent/byokClient.ts#L220) — ✅ Fixed (tokensUsed set to 0 in simulation mode)
- **Issue 2**: [deterministicEngine.ts:14](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/router/deterministicEngine.ts#L14) — ✅ Fixed (Passes `newSymbolName` from `CodeIntent` instead of hardcoded `'executeApp'`)
- **Issue 3**: [sqlDriver.ts:129-143](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L129-L143) — ✅ Fixed (Rich WHERE filtering, JOIN, ORDER BY, LIMIT/OFFSET, and column projection)
- **Issue 8**: [shadowBuffer.ts:31](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/verification/shadowBuffer.ts#L31) — ✅ Fixed (Included `)` in `closeBrackets` regex)
- **Issue 12**: [explainAnalyzer.ts:7](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/explainAnalyzer.ts#L7) — ✅ Fixed (Added `'Filter'` to `PlanNode.nodeType` union, removed `as any`)

### Partition 3: App Shell (Status: ✅ 4 Fixed)
- Files: `layout.tsx`, `page.tsx`
- **Issue 4**: [page.tsx:260-268](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L260-L268) — ✅ Fixed (Wired global ⌘Enter shortcut to SqlQueryPanel execution handler)
- **Issue 5**: [page.tsx:132-137](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L132-L137) — ✅ Fixed (Recursive tree search via `findFileNodeById` restores nested active and open files)
- **Issue 10**: [page.tsx:476-515](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L476-L515) — ✅ Fixed (`handleAddFile` targets currently selected directory instead of hardcoded `queries/`)
- **Issue 11**: [page.tsx:218-232](file:///Users/alpha/Desktop/antigavity/DBC/src/app/page.tsx#L218-L232) — ✅ Fixed (Sanitized empty strings so unused keys are not stored)

### Partition 4: Shell Components (Status: ✅ Clean)
- Files: `TopMenuBar`, `ActivityBar`, `StatusBar`, `ErrorBoundary`, `ToastProvider`, `CommandPalette`
- **Issue 6**: [ErrorBoundary.tsx:40-41](file:///Users/alpha/Desktop/antigavity/DBC/src/components/ErrorBoundary.tsx#L40-L41) — ✅ Fixed (Invoked `clearPersistedWorkspace()` and removed `dbc_workspace_state_v1`)

### Partition 5: Editor & File Components (Status: ✅ Clean)
- Files: `CodeEditor`, `FileExplorer`, `SearchModal`, `TerminalPanel`, `WelcomeTab`, `ShortcutsModal`
- **Issue 7**: [CodeEditor.tsx](file:///Users/alpha/Desktop/antigavity/DBC/src/components/CodeEditor.tsx) — ✅ Fixed (Monaco editor now receives dynamic `editorSettings` for font, tabSize, and custom themes)

### Partition 6: Database Components (Status: ✅ Clean)
- Files: `SqlQueryPanel`, `DbObjectExplorer`, `DbConnectionPanel`, etc.
- **Issue 9**: [SqlQueryPanel.tsx:176-217](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SqlQueryPanel.tsx#L176-L217) — ✅ Fixed (Added backdrop overlay to dismiss Tools and Export dropdowns on outside click)

### Partition 7: Modal & AI Components (Status: ✅ Clean)
- Files: `MissionControl`, `SettingsModal`, `GitPanel`, etc.
- **Issue 7 (continued)**: [SettingsModal.tsx:208-233](file:///Users/alpha/Desktop/antigavity/DBC/src/components/SettingsModal.tsx#L208-L233) — ✅ Fixed (Themes defined in Monaco engine and synced to `data-theme` on document root)
- **NVIDIA NIM BYOK**: [SettingsModal.tsx](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/SettingsModal.tsx) & [MissionControl.tsx](file:///Users/alpha/Desktop/antigavity/DBC/src/components/agents/MissionControl.tsx) — Added direct support for NVIDIA NIM Moonshot Kimi-K3 reasoning model.

### Partition 8: Domain Restructuring & Modal Decoupling (Status: ✅ Complete)
- **Domain Reorganization**: Grouped 40 component files into 6 domains (`shell/`, `editor/`, `dbms/`, `agents/`, `modals/`, `ui/`) with a backwards-compatible `src/components/index.ts` barrel export.
- **Modal Decoupling (`ModalHost.tsx`)**: Consolidated 18 individual `useState(false)` flags in `src/app/page.tsx` into a single `activeModal` dispatcher and `<ModalHost />` component, eliminating 300+ lines of clutter.
- **Single-Track Focus Anchor (`TRACK.md`)**: Instituted the `WIP = 1` Single-Track development protocol and idea parking lot.
- **Verification**: Zero TypeScript errors (`npx tsc --noEmit`) and 108/108 automated subsystem tests passing.

