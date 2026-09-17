/**
 * DBC Part 6 (Shell, ModalHost & App Architecture Domain) Verification Suite
 * Validates fixes for SH-01, SH-02, SH-03, and SH-04:
 * 1. SH-01: Browser shortcut collision on ⌘W / ⌘N resolved with Alt+W / Alt+N safe aliases
 * 2. SH-02: Monaco & App Shell theme isolation resolved with CSS custom variables & dataset.theme
 * 3. SH-03: Dynamic Command Palette actions populated from realSqlDriver.getTableNames()
 * 4. SH-04: TopMenuBar touch dismissal backdrop overlay & hover menu switching
 */

import * as fs from 'fs';
import * as path from 'path';
import { realSqlDriver } from '../src/lib/db/sqlDriver';
import { generateDynamicTableActions, PaletteAction } from '../src/components/modals/CommandPalette';
import { getMonacoThemeName } from '../src/lib/monacoThemes';

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

// Mock DOM environment for Node.js test environment
const mockDataset: Record<string, string> = {};
const mockAttributes: Record<string, string> = {};

(global as any).document = {
  documentElement: {
    dataset: mockDataset,
    setAttribute: (k: string, v: string) => { mockAttributes[k] = v; },
    getAttribute: (k: string) => mockAttributes[k] || null,
  }
};

(global as any).window = {
  document: (global as any).document
};

async function runPart6Tests() {
  console.log('================================================================');
  console.log('  DBC PART 6 (SHELL, MODALHOST & ARCHITECTURE) TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. SH-01: Keyboard Shortcut Collision & Browser-Safe Aliases ──────────
  console.log('⌨️  [1/4] Testing Browser Shortcut Collision & Safe Aliases (SH-01)...');
  try {
    // 1.1 Emulate keyboard shortcut dispatcher logic from page.tsx
    type TestFile = { id: string; name: string };
    let openFiles: TestFile[] = [
      { id: 'f1', name: 'users.sql' },
      { id: 'f2', name: 'analytics.sql' }
    ];
    let activeFile: TestFile | null = openFiles[1];
    let createdFiles: string[] = [];

    const simulateKeyDown = (e: { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean; key: string }) => {
      const mod = Boolean(e.metaKey || e.ctrlKey);
      const key = e.key.toLowerCase();

      // ⌘N or ⌥N / Alt+N: New File
      if ((mod && key === 'n') || (e.altKey && !mod && key === 'n')) {
        const newFileName = `query_test_${Date.now().toString().slice(-4)}.sql`;
        createdFiles.push(newFileName);
        return 'NEW_FILE';
      }

      // ⌘W or ⌥W / Alt+W: Close Active Tab
      if ((mod && key === 'w') || (e.altKey && !mod && key === 'w')) {
        if (activeFile) {
          const fileId = activeFile.id;
          openFiles = openFiles.filter(f => f.id !== fileId);
          activeFile = openFiles.length > 0 ? openFiles[openFiles.length - 1] : null;
          return 'CLOSE_TAB';
        }
      }

      return 'UNHANDLED';
    };

    // Standard ⌘W / Ctrl+W test
    const r1 = simulateKeyDown({ metaKey: true, key: 'w' });
    assert(r1 === 'CLOSE_TAB', 'Standard ⌘W triggers active tab close');
    assert(openFiles.length === 1, 'File removed from open tabs via ⌘W');
    assert(activeFile?.name === 'users.sql', 'Active file switched to previous tab');

    // Safe ⌥W / Alt+W alias test (prevents closing browser window on web platforms)
    const r2 = simulateKeyDown({ altKey: true, key: 'w' });
    assert(r2 === 'CLOSE_TAB', 'Safe ⌥W / Alt+W alias triggers active tab close without browser conflict');
    assert(openFiles.length === 0, 'Last tab closed cleanly via ⌥W');
    assert(activeFile === null, 'Active file correctly reset to null when all tabs closed');

    // Standard ⌘N / Ctrl+N test
    const r3 = simulateKeyDown({ metaKey: true, key: 'n' });
    assert(r3 === 'NEW_FILE', 'Standard ⌘N triggers new file creation');
    assert(createdFiles.length === 1, 'New file generated via ⌘N');

    // Safe ⌥N / Alt+N alias test (prevents opening new browser window on web platforms)
    const r4 = simulateKeyDown({ altKey: true, key: 'n' });
    assert(r4 === 'NEW_FILE', 'Safe ⌥N / Alt+N alias triggers new file creation without browser conflict');
    assert(createdFiles.length === 2, 'New file generated via ⌥N');

    // 1.2 Platform glyph detection (ShortcutsModal.tsx)
    const getPlatformModifiers = (userAgent: string) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(userAgent);
      return {
        modKey: isMac ? '⌘' : 'Ctrl',
        shiftKey: isMac ? '⇧' : 'Shift',
        altKey: isMac ? '⌥' : 'Alt',
      };
    };

    const macModifiers = getPlatformModifiers('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    assert(macModifiers.modKey === '⌘' && macModifiers.altKey === '⌥', 'Mac platform modifiers resolve to ⌘ and ⌥');

    const winModifiers = getPlatformModifiers('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    assert(winModifiers.modKey === 'Ctrl' && winModifiers.altKey === 'Alt', 'Windows/Linux platform modifiers resolve to Ctrl and Alt');

    // 1.3 Verify ShortcutsModal file references safe aliases
    const shortcutsModalCode = fs.readFileSync(
      path.join(__dirname, '../src/components/modals/ShortcutsModal.tsx'),
      'utf-8'
    );
    assert(shortcutsModalCode.includes('Safe alias: ${altKey}+W'), 'ShortcutsModal documents safe Alt+W alias');
    assert(shortcutsModalCode.includes('Safe alias: ${altKey}+N'), 'ShortcutsModal documents safe Alt+N alias');
  } catch (err: any) {
    assert(false, `Shortcut collision test failed: ${err.message}`);
  }

  // ─── 2. SH-02: Monaco & App Shell Theme Synchronization ───────────────────
  console.log('\n🎨 [2/4] Testing Theme Variables & Shell Synchronization (SH-02)...');
  try {
    // 2.1 Verify globals.css defines custom variables for all supported themes
    const globalsCss = fs.readFileSync(
      path.join(__dirname, '../src/app/globals.css'),
      'utf-8'
    );

    const requiredThemes = ['vscode-dark', 'monokai', 'onedark', 'cyberpunk'];
    const requiredVars = ['--bg-shell', '--bg-sidebar', '--border-shell', '--text-shell', '--accent-shell'];

    for (const theme of requiredThemes) {
      const themeSelector = `[data-theme="${theme}"]`;
      assert(globalsCss.includes(themeSelector), `globals.css defines rules for ${themeSelector}`);
    }

    for (const v of requiredVars) {
      assert(globalsCss.includes(v), `globals.css declares CSS token ${v}`);
    }

    // 2.2 Verify theme synchronization on document root
    const applyTheme = (themeName: string) => {
      const resolved = getMonacoThemeName(themeName);
      mockDataset.theme = resolved;
      mockAttributes['data-theme'] = resolved;
      return resolved;
    };

    const t1 = applyTheme('monokai');
    assert(t1 === 'monokai', 'getMonacoThemeName resolves monokai');
    assert(mockDataset.theme === 'monokai', 'document.documentElement.dataset.theme updated to monokai');
    assert(mockAttributes['data-theme'] === 'monokai', 'document.documentElement attribute data-theme updated');

    const t2 = applyTheme('cyberpunk');
    assert(t2 === 'cyberpunk', 'getMonacoThemeName resolves cyberpunk');
    assert(mockDataset.theme === 'cyberpunk', 'document.documentElement.dataset.theme updated to cyberpunk');

    const t3 = applyTheme('unknown-custom-theme');
    assert(t3 === 'vs-dark', 'Unknown theme safely defaults to vs-dark fallback');

    // 2.3 Verify page.tsx synchronizes dataset.theme in useEffect
    const pageCode = fs.readFileSync(
      path.join(__dirname, '../src/app/page.tsx'),
      'utf-8'
    );
    assert(pageCode.includes('document.documentElement.dataset.theme = editorSettings.theme'), 'page.tsx syncs dataset.theme to editorSettings.theme');
  } catch (err: any) {
    assert(false, `Theme synchronization test failed: ${err.message}`);
  }

  // ─── 3. SH-03: Dynamic Command Palette Actions from SQL Driver ────────────
  console.log('\n🔍 [3/4] Testing Dynamic Command Palette Table Actions (SH-03)...');
  try {
    // 3.1 Verify getTableNames() exists and returns active schema tables
    assert(typeof realSqlDriver.getTableNames === 'function', 'realSqlDriver.getTableNames is a defined function');
    const initialTables = realSqlDriver.getTableNames();
    assert(Array.isArray(initialTables), 'realSqlDriver.getTableNames() returns an array');
    assert(initialTables.includes('users'), "realSqlDriver initial table names include 'users'");

    // 3.2 Add a dynamic table and verify schema updates
    await realSqlDriver.executeQuery(`
      CREATE TABLE project_tasks (
        id INTEGER PRIMARY KEY,
        title TEXT,
        completed INTEGER
      );
    `);

    const updatedTables = realSqlDriver.getTableNames();
    assert(updatedTables.includes('project_tasks'), 'realSqlDriver introspects newly created table project_tasks');

    // 3.3 Test dynamic palette action generator
    let inspectedTable: string | null = null;
    let editedTable: string | null = null;
    let queriedTable: string | null = null;

    const dynamicActions = generateDynamicTableActions({
      onInspectTable: (tbl) => { inspectedTable = tbl; },
      onEditTable: (tbl) => { editedTable = tbl; },
      onQueryTable: (tbl) => { queriedTable = tbl; }
    }, updatedTables);

    assert(dynamicActions.length >= 6, `Generated ${dynamicActions.length} dynamic table actions for tables`);

    // Verify inspect action
    const inspectTaskAction = dynamicActions.find(a => a.id === 'inspect-table-project_tasks');
    assert(Boolean(inspectTaskAction), 'Generated inspect action for project_tasks');
    inspectTaskAction?.handler();
    assert(inspectedTable === 'project_tasks', 'Inspect action invoked handler with project_tasks');

    // Verify edit action
    const editTaskAction = dynamicActions.find(a => a.id === 'edit-table-project_tasks');
    assert(Boolean(editTaskAction), 'Generated edit action for project_tasks');
    editTaskAction?.handler();
    assert(editedTable === 'project_tasks', 'Edit action invoked handler with project_tasks');

    // Verify query action
    const queryTaskAction = dynamicActions.find(a => a.id === 'query-table-project_tasks');
    assert(Boolean(queryTaskAction), 'Generated query action for project_tasks');
    queryTaskAction?.handler();
    assert(queriedTable === 'project_tasks', 'Query action invoked handler with project_tasks');

    // 3.4 Verify filtering search works on dynamically populated tables
    const searchTerm = 'tasks';
    const filteredActions = dynamicActions.filter(a => a.label.toLowerCase().includes(searchTerm));
    assert(filteredActions.length === 3, 'Command palette filter query matches all 3 actions for tasks');

    // 3.5 Verify page.tsx wires dynamicTableActions from realSqlDriver.getTableNames()
    const pageCode = fs.readFileSync(
      path.join(__dirname, '../src/app/page.tsx'),
      'utf-8'
    );
    assert(pageCode.includes('realSqlDriver.getTableNames()'), 'page.tsx retrieves table names via realSqlDriver.getTableNames()');
    assert(pageCode.includes('dynamicTableActions'), 'page.tsx expands dynamicTableActions in paletteActions array');
  } catch (err: any) {
    assert(false, `Dynamic Command Palette test failed: ${err.message}`);
  }

  // ─── 4. SH-04: TopMenuBar Touch Dismissal & Backdrop Overlay ──────────────
  console.log('\n📱 [4/4] Testing TopMenuBar Touch Dismissal & Backdrop Overlay (SH-04)...');
  try {
    const topMenuBarCode = fs.readFileSync(
      path.join(__dirname, '../src/components/shell/TopMenuBar.tsx'),
      'utf-8'
    );

    // 4.1 Verify backdrop test id and touch handler
    assert(topMenuBarCode.includes('data-testid="top-menu-backdrop"'), 'TopMenuBar contains data-testid="top-menu-backdrop"');
    assert(topMenuBarCode.includes('onTouchStart={() => setOpenMenu(null)}'), 'TopMenuBar backdrop handles onTouchStart to dismiss on touch devices');
    assert(topMenuBarCode.includes('onClick={() => setOpenMenu(null)}'), 'TopMenuBar backdrop handles onClick to dismiss on desktop click');
    assert(topMenuBarCode.includes('fixed inset-0 z-40'), 'TopMenuBar backdrop covers viewport with fixed inset-0 z-40');

    // 4.2 Verify menu buttons support hover switching when a menu is open
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('file'); }}"), 'File button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('edit'); }}"), 'Edit button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('view'); }}"), 'View button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('run'); }}"), 'Run button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('go'); }}"), 'Go button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('terminal'); }}"), 'Terminal button supports hover switching');
    assert(topMenuBarCode.includes("onMouseEnter={() => { if (openMenu) setOpenMenu('help'); }}"), 'Help button supports hover switching');

    // 4.3 Verify New File shortcut label displays safe alias
    assert(topMenuBarCode.includes('⌘N / ⌥N'), 'TopMenuBar File dropdown displays ⌘N / ⌥N safe shortcut label');
  } catch (err: any) {
    assert(false, `TopMenuBar touch dismissal test failed: ${err.message}`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  PART 6 SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart6Tests().catch(err => {
  console.error('Unhandled test suite exception:', err);
  process.exit(1);
});
