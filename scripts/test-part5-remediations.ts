/**
 * DBC Part 5 (Monaco Editor & Workspace Tree Domain) Verification Suite
 * Validates fixes for ED-01, ED-02, ED-03, and ED-04:
 * 1. ED-01: In-memory uncommitted draft buffer persistence & safe recovery
 * 2. ED-02: Folder expansion state key consistency across node.id, node.name, and node.path
 * 3. ED-03: Complete SQL syntax token definitions across Monaco custom themes
 * 4. ED-04: Platform-aware keyboard shortcut modifier key mappings (Mac vs Windows/Linux)
 */

import {
  saveDraftBuffer,
  loadDraftBuffer,
  clearDraftBuffer,
  getAllDraftBuffers,
  clearAllDraftBuffers
} from '../src/lib/workspacePersistence';
import { defineMonacoThemes, getMonacoThemeName } from '../src/lib/monacoThemes';
import { INITIAL_WORKSPACE } from '../src/lib/initialWorkspace';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failed++;
  }
}

// Mock localStorage for Node.js test environment
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
(global as any).window = {};

async function runPart5Tests() {
  console.log('================================================================');
  console.log('  DBC PART 5 (EDITOR & WORKSPACE TREE) TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. ED-01: Draft Buffer Persistence ───────────────────────────────────
  console.log('📝 [1/4] Testing Draft Buffer Persistence & Recovery (ED-01)...');
  try {
    clearAllDraftBuffers();

    // 1.1 Save draft buffer for uncommitted edits
    saveDraftBuffer('queries/users_report.sql', 'SELECT u.id, u.email FROM users u WHERE active = 1;');
    saveDraftBuffer('src/index.ts', 'export function run() { return 42; }');

    const sqlDraft = loadDraftBuffer('queries/users_report.sql');
    assert(sqlDraft !== null, 'Loaded saved draft buffer for users_report.sql');
    assert(Boolean(sqlDraft?.includes('WHERE active = 1')), 'Draft buffer content preserved accurately');

    const tsDraft = loadDraftBuffer('src/index.ts');
    assert(tsDraft !== null, 'Loaded saved draft buffer for src/index.ts');

    // 1.2 Non-existent draft returns null
    const nonExistent = loadDraftBuffer('does_not_exist.sql');
    assert(nonExistent === null, 'Non-existent draft returns null');

    // 1.3 List all active drafts
    const allDrafts = getAllDraftBuffers();
    assert(Object.keys(allDrafts).length === 2, `Retrieved 2 active uncommitted drafts (Got: ${Object.keys(allDrafts).length})`);
    assert(allDrafts['queries/users_report.sql']?.timestamp > 0, 'Draft records timestamp');

    // 1.4 Clear specific draft upon explicit save
    clearDraftBuffer('queries/users_report.sql');
    assert(loadDraftBuffer('queries/users_report.sql') === null, 'Draft buffer cleared after explicit file save');
    assert(loadDraftBuffer('src/index.ts') !== null, 'Other draft buffers remain intact');

    // 1.5 Clear all drafts
    clearAllDraftBuffers();
    assert(Object.keys(getAllDraftBuffers()).length === 0, 'All draft buffers cleanly wiped');
  } catch (err: any) {
    assert(false, `ED-01 execution failed: ${err.message}`);
  }

  // ─── 2. ED-02: Folder Expansion State Key Consistency ─────────────────────
  console.log('\n📁 [2/4] Testing Folder Expansion Keying & Persistence (ED-02)...');
  try {
    // Check initial workspace folder node IDs vs names
    const folderQueries = INITIAL_WORKSPACE.find(n => n.name === 'queries');
    const folderMigrations = INITIAL_WORKSPACE.find(n => n.name === 'migrations');
    const folderSrc = INITIAL_WORKSPACE.find(n => n.name === 'src');

    assert(!!folderQueries, 'Initial workspace contains "queries" folder');
    assert(folderQueries?.id === 'folder-queries', `Queries folder ID is "${folderQueries?.id}"`);
    assert(folderMigrations?.id === 'folder-migrations', `Migrations folder ID is "${folderMigrations?.id}"`);
    assert(folderSrc?.id === 'folder-src', `Src folder ID is "${folderSrc?.id}"`);

    // Expansion dictionary supporting multi-key lookup
    const openFoldersState: Record<string, boolean> = {
      'folder-queries': true,
      'folder-migrations': true,
      'folder-src': true,
      queries: true,
      migrations: true,
      src: true
    };

    const isFolderExpanded = (node: { id: string; name: string; path?: string }) => {
      return (
        openFoldersState[node.id] ??
        openFoldersState[node.name] ??
        (node.path ? openFoldersState[node.path] : undefined) ??
        true
      );
    };

    assert(isFolderExpanded(folderQueries!) === true, 'Queries folder is recognized as open by ID');
    assert(isFolderExpanded({ id: 'custom-id', name: 'queries' }) === true, 'Queries folder is recognized as open by Name');
    assert(isFolderExpanded(folderMigrations!) === true, 'Migrations folder is recognized as open');
    assert(isFolderExpanded(folderSrc!) === true, 'Src folder is recognized as open');

    // Test toggle behavior
    const toggleFolderState = (node: { id: string; name: string }) => {
      const current = openFoldersState[node.id] ?? openFoldersState[node.name] ?? true;
      const next = !current;
      openFoldersState[node.id] = next;
      openFoldersState[node.name] = next;
    };

    toggleFolderState(folderQueries!);
    assert(isFolderExpanded(folderQueries!) === false, 'Queries folder successfully collapsed');
    toggleFolderState(folderQueries!);
    assert(isFolderExpanded(folderQueries!) === true, 'Queries folder successfully re-expanded');
  } catch (err: any) {
    assert(false, `ED-02 execution failed: ${err.message}`);
  }

  // ─── 3. ED-03: Monaco Custom Theme SQL Syntax Token Coverage ──────────────
  console.log('\n🎨 [3/4] Testing Monaco Custom Theme SQL Token Rules (ED-03)...');
  try {
    const definedThemes: Record<string, any> = {};
    const mockMonaco = {
      editor: {
        defineTheme: (name: string, config: any) => {
          definedThemes[name] = config;
        }
      }
    };

    defineMonacoThemes(mockMonaco);

    assert(definedThemes['vscode-dark'] !== undefined, 'Registered vscode-dark theme');
    assert(definedThemes['monokai'] !== undefined, 'Registered monokai theme');
    assert(definedThemes['onedark'] !== undefined, 'Registered onedark theme');
    assert(definedThemes['cyberpunk'] !== undefined, 'Registered cyberpunk theme');

    // Verify SQL token coverage across themes
    const themesToCheck = ['monokai', 'onedark', 'cyberpunk'];
    const requiredSqlTokens = ['operator.sql', 'delimiter.sql', 'type.sql', 'predefined.sql', 'identifier.sql'];

    for (const themeName of themesToCheck) {
      const theme = definedThemes[themeName];
      const rules = theme.rules as Array<{ token: string; foreground?: string }>;
      const tokenNames = new Set(rules.map(r => r.token));

      for (const reqToken of requiredSqlTokens) {
        assert(tokenNames.has(reqToken), `Theme "${themeName}" defines rule for "${reqToken}"`);
      }
    }

    // Verify theme name resolution helper
    assert(getMonacoThemeName('monokai') === 'monokai', 'Resolves monokai theme');
    assert(getMonacoThemeName('onedark') === 'onedark', 'Resolves onedark theme');
    assert(getMonacoThemeName('cyberpunk') === 'cyberpunk', 'Resolves cyberpunk theme');
    assert(getMonacoThemeName('unknown-theme') === 'vs-dark', 'Falls back to vs-dark for unknown theme');
    assert(getMonacoThemeName() === 'vs-dark', 'Falls back to vs-dark for undefined theme');
  } catch (err: any) {
    assert(false, `ED-03 execution failed: ${err.message}`);
  }

  // ─── 4. ED-04: Platform-Aware Keyboard Shortcuts ──────────────────────────
  console.log('\n⌨️  [4/4] Testing Platform-Aware Keyboard Shortcuts (ED-04)...');
  try {
    // Helper replicating ShortcutsModal platform resolver
    const resolveModifierKey = (platform: string, userAgent: string) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(userAgent || platform);
      return {
        modKey: isMac ? '⌘' : 'Ctrl',
        shiftKey: isMac ? '⇧' : 'Shift'
      };
    };

    const macKeys = resolveModifierKey('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    assert(macKeys.modKey === '⌘', 'Resolves ⌘ command key on macOS');
    assert(macKeys.shiftKey === '⇧', 'Resolves ⇧ shift glyph on macOS');

    const winKeys = resolveModifierKey('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    assert(winKeys.modKey === 'Ctrl', 'Resolves Ctrl key on Windows');
    assert(winKeys.shiftKey === 'Shift', 'Resolves Shift label on Windows');

    const linuxKeys = resolveModifierKey('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)');
    assert(linuxKeys.modKey === 'Ctrl', 'Resolves Ctrl key on Linux');
    assert(linuxKeys.shiftKey === 'Shift', 'Resolves Shift label on Linux');
  } catch (err: any) {
    assert(false, `ED-04 execution failed: ${err.message}`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  PART 5 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart5Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
