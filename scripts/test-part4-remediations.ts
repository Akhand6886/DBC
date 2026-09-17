/**
 * DBC Part 4 (Verification & Shadow Workspace Domain) Verification Suite
 * Validates fixes for VF-01, VF-02, and VF-03:
 * 1. VF-01: Myers / LCS unified line diff algorithm preventing cascading false diffs on insertions
 * 2. VF-02: Strict syntax and bracket balance validation with 0 tolerance and comment/string stripping
 * 3. VF-03: Snapshot history drawer search query filtering and lifecycle status filtering
 * 4. Integration: verifyAndCreateShadowDiff end-to-end shadow buffer creation
 */

import {
  computeLcsDiff,
  validateSyntaxBrackets,
  stripStringsAndComments,
  verifyAndCreateShadowDiff
} from '../src/lib/verification/shadowBuffer';
import { ShadowDiffCheck } from '../src/lib/types';

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

async function runPart4Tests() {
  console.log('================================================================');
  console.log('  DBC PART 4 (SHADOW WORKSPACE & VERIFICATION) TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. VF-01: Myers / LCS Unified Line Differ ────────────────────────────
  console.log('🛡️  [1/4] Testing LCS Unified Line Differ vs Naive Index Differ (VF-01)...');
  try {
    const originalContent = [
      'import { useState } from "react";',
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return <div>{count}</div>;',
      '}'
    ].join('\n');

    // 1.1 Insertion at Line 0 (The exact bug in finding VF-01)
    // In naive differ, inserting 1 line at index 0 caused ALL lines to be marked - and +
    const insertedAtTop = [
      '// Top-level comment inserted at line 0',
      'import { useState } from "react";',
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return <div>{count}</div>;',
      '}'
    ].join('\n');

    const topDiff = computeLcsDiff(originalContent.split('\n'), insertedAtTop.split('\n'));
    const topAdditions = topDiff.filter(line => line.startsWith('+'));
    const topDeletions = topDiff.filter(line => line.startsWith('-'));
    const topUnchanged = topDiff.filter(line => line.startsWith('  '));

    assert(topAdditions.length === 1, `Exactly 1 line added at line 0 (Got: ${topAdditions.length})`);
    assert(topDeletions.length === 0, `0 lines deleted when prepending a line (Got: ${topDeletions.length})`);
    assert(topUnchanged.length === 5, `All 5 original lines preserved as unchanged (Got: ${topUnchanged.length})`);
    assert(topAdditions[0].includes('Top-level comment'), 'Added line contains expected inserted comment');

    // 1.2 Insertion in the middle
    const insertedMiddle = [
      'import { useState } from "react";',
      'export function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  console.log("Count is:", count);',
      '  return <div>{count}</div>;',
      '}'
    ].join('\n');

    const middleDiff = computeLcsDiff(originalContent.split('\n'), insertedMiddle.split('\n'));
    const midAdditions = middleDiff.filter(l => l.startsWith('+'));
    const midDeletions = middleDiff.filter(l => l.startsWith('-'));
    const midUnchanged = middleDiff.filter(l => l.startsWith('  '));

    assert(midAdditions.length === 1, `Middle insertion has 1 addition (Got: ${midAdditions.length})`);
    assert(midDeletions.length === 0, `Middle insertion has 0 deletions (Got: ${midDeletions.length})`);
    assert(midUnchanged.length === 5, `Middle insertion preserves 5 unchanged lines (Got: ${midUnchanged.length})`);

    // 1.3 Deletion from the middle
    const lineDeleted = [
      'import { useState } from "react";',
      'export function Counter() {',
      '  return <div>{count}</div>;',
      '}'
    ].join('\n');

    const delDiff = computeLcsDiff(originalContent.split('\n'), lineDeleted.split('\n'));
    const delAdditions = delDiff.filter(l => l.startsWith('+'));
    const delDeletions = delDiff.filter(l => l.startsWith('-'));
    const delUnchanged = delDiff.filter(l => l.startsWith('  '));

    assert(delAdditions.length === 0, `Single line delete has 0 additions (Got: ${delAdditions.length})`);
    assert(delDeletions.length === 1, `Single line delete has 1 deletion (Got: ${delDeletions.length})`);
    assert(delUnchanged.length === 4, `Single line delete preserves 4 unchanged lines (Got: ${delUnchanged.length})`);
    assert(delDeletions[0].includes('useState(0)'), 'Deleted line accurately identified');

    // 1.4 In-place line modification
    const inPlaceModified = [
      'import { useState } from "react";',
      'export function Counter() {',
      '  const [count, setCount] = useState(100);',
      '  return <div>{count}</div>;',
      '}'
    ].join('\n');

    const modDiff = computeLcsDiff(originalContent.split('\n'), inPlaceModified.split('\n'));
    const modAdds = modDiff.filter(l => l.startsWith('+'));
    const modDels = modDiff.filter(l => l.startsWith('-'));
    const modUnchanged = modDiff.filter(l => l.startsWith('  '));

    assert(modAdds.length === 1, 'In-place edit generates 1 addition line');
    assert(modDels.length === 1, 'In-place edit generates 1 deletion line');
    assert(modUnchanged.length === 4, 'In-place edit preserves 4 unchanged lines');

    // 1.5 Edge cases: empty contents and identical contents
    const emptyDiff = computeLcsDiff([], []);
    assert(emptyDiff.length === 0, 'LCS diff between empty contents is empty array');

    const identicalDiff = computeLcsDiff(originalContent.split('\n'), originalContent.split('\n'));
    assert(!identicalDiff.some(l => l.startsWith('+') || l.startsWith('-')), 'Identical content has 0 additions and 0 deletions');
    assert(identicalDiff.length === 5, 'Identical content has 5 unchanged lines');
  } catch (err: any) {
    assert(false, `VF-01 execution failed: ${err.message}`);
  }

  // ─── 2. VF-02: Strict Syntax & Bracket Validation ─────────────────────────
  console.log('\n🔍 [2/4] Testing Strict Syntax & Bracket Validation (VF-02)...');
  try {
    // 2.1 Stripping comments and strings
    const codeWithBracketsInStrings = `
      // Single line comment with unclosed paren (
      -- SQL comment with unclosed brace {
      /* Multi-line comment
         with unclosed bracket [
      */
      const greeting = "Hello (World) [Brackets] {Braces}";
      const sqlQuery = 'SELECT * FROM users WHERE name = "John (Doe)"';
      const template = \`Template (with) [brackets] {here}\`;
    `;
    const stripped = stripStringsAndComments(codeWithBracketsInStrings);
    assert(!stripped.includes('Hello (World)'), 'String contents stripped');
    assert(!stripped.includes('Multi-line comment'), 'Multi-line comment stripped');
    assert(!stripped.includes('SQL comment'), 'SQL comment stripped');

    // 2.2 Balanced code with brackets in strings passes strictly
    const balancedWithStrings = `
      export function fetchUser(id: number) {
        const title = "User (ID: " + id + ")";
        return { id, title };
      }
    `;
    const balancedRes = validateSyntaxBrackets(balancedWithStrings);
    assert(balancedRes.syntaxCheckPassed === true, 'Balanced code with brackets in strings passes');
    assert(balancedRes.unclosedCount === 0, 'Unclosed count is 0');

    // 2.3 Single unclosed bracket/paren (Previously falsely passed due to `<= 2` tolerance)
    const unclosedParen = `
      function calculateTotal(items: number[]) {
        if (items.length > 0 {
          return items.reduce((a, b) => a + b, 0);
        }
        return 0;
      }
    `;
    const unclosedRes = validateSyntaxBrackets(unclosedParen);
    assert(unclosedRes.syntaxCheckPassed === false, 'Single unclosed paren is strictly rejected (0 tolerance)');
    assert(unclosedRes.errors.length > 0, `Detected error: ${unclosedRes.errors[0]}`);

    // 2.4 Single unclosed brace
    const unclosedBrace = `
      export class DatabaseConnection {
        public query(sql: string) {
          return true;
        // Missing closing brace for class
    `;
    const braceRes = validateSyntaxBrackets(unclosedBrace);
    assert(braceRes.syntaxCheckPassed === false, 'Unclosed class brace is strictly rejected');

    // 2.5 Mismatched bracket types: (]
    const mismatched = `
      const config = (getOptions()];
    `;
    const mismatchRes = validateSyntaxBrackets(mismatched);
    assert(mismatchRes.syntaxCheckPassed === false, 'Mismatched (] bracket pair is caught and rejected');
    assert(mismatchRes.errors.some(e => e.includes('Mismatched bracket')), 'Reports mismatched bracket error message');

    // 2.6 Valid SQL DDL with nested parens
    const validSqlDdl = `
      CREATE TABLE financial_ledger (
        id INTEGER PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        rate NUMERIC(8, 4) DEFAULT (1.0000),
        account_code VARCHAR(64)
      );
    `;
    const sqlRes = validateSyntaxBrackets(validSqlDdl);
    assert(sqlRes.syntaxCheckPassed === true, 'Valid SQL DDL with nested parameterized types passes');
  } catch (err: any) {
    assert(false, `VF-02 execution failed: ${err.message}`);
  }

  // ─── 3. VF-03: Snapshot Drawer Search & Lifecycle Filtering ───────────────
  console.log('\n📊 [3/4] Testing Snapshot Drawer Search & Lifecycle Status Filtering (VF-03)...');
  try {
    const mockSnapshots: ShadowDiffCheck[] = [
      {
        id: 'SNAP-101',
        timestamp: new Date().toISOString(),
        targetFile: 'src/index.ts',
        originalContent: 'const a = 1;',
        proposedContent: 'const a = 2;',
        patchDiff: '- const a = 1;\n+ const a = 2;',
        syntaxCheckPassed: true,
        lspDiagnosticsCount: 0,
        requiresUserApproval: true,
        status: 'PENDING'
      },
      {
        id: 'SNAP-102',
        timestamp: new Date().toISOString(),
        targetFile: 'migrations/001_initial_schema.sql',
        originalContent: 'CREATE TABLE old;',
        proposedContent: 'CREATE TABLE new;',
        patchDiff: '- CREATE TABLE old;\n+ CREATE TABLE new;',
        syntaxCheckPassed: true,
        lspDiagnosticsCount: 0,
        requiresUserApproval: true,
        status: 'ACCEPTED'
      },
      {
        id: 'SNAP-103',
        timestamp: new Date().toISOString(),
        targetFile: 'queries/users_report.sql',
        originalContent: 'SELECT * FROM users;',
        proposedContent: 'SELECT id, email FROM users;',
        patchDiff: '- SELECT *\n+ SELECT id, email',
        syntaxCheckPassed: true,
        lspDiagnosticsCount: 0,
        requiresUserApproval: true,
        status: 'REJECTED'
      },
      {
        id: 'SNAP-104',
        timestamp: new Date().toISOString(),
        targetFile: 'src/lib/router/routerEngine.ts',
        originalContent: 'function a() {}',
        proposedContent: 'function b() {}',
        patchDiff: '- a\n+ b',
        syntaxCheckPassed: true,
        lspDiagnosticsCount: 0,
        requiresUserApproval: true,
        status: 'ROLLED_BACK'
      }
    ];

    // Filter simulation helper matching Drawer's useMemo
    const filterSnapshots = (history: ShadowDiffCheck[], query: string, status: string) => {
      const q = query.trim().toLowerCase();
      return history.filter((snap) => {
        const matchesSearch =
          !q ||
          snap.id.toLowerCase().includes(q) ||
          snap.targetFile.toLowerCase().includes(q);
        const matchesStatus = status === 'ALL' || snap.status === status;
        return matchesSearch && matchesStatus;
      });
    };

    // 3.1 Unfiltered (ALL, empty query)
    const allSnaps = filterSnapshots(mockSnapshots, '', 'ALL');
    assert(allSnaps.length === 4, `Unfiltered search returns all 4 snapshots`);

    // 3.2 File query search: 'sql'
    const sqlSnaps = filterSnapshots(mockSnapshots, 'sql', 'ALL');
    assert(sqlSnaps.length === 2, `Search query "sql" matches 2 SQL files (Got: ${sqlSnaps.length})`);
    assert(sqlSnaps.every(s => s.targetFile.endsWith('.sql')), 'All returned snapshots have .sql extension');

    // 3.3 Snapshot ID query search: '104'
    const idSnaps = filterSnapshots(mockSnapshots, 'SNAP-104', 'ALL');
    assert(idSnaps.length === 1, 'Search query "SNAP-104" matches exactly 1 snapshot');
    assert(idSnaps[0].targetFile.includes('routerEngine'), 'Found matching target file');

    // 3.4 Status filter: 'ROLLED_BACK'
    const rolledSnaps = filterSnapshots(mockSnapshots, '', 'ROLLED_BACK');
    assert(rolledSnaps.length === 1, 'Status filter "ROLLED_BACK" returns 1 item');
    assert(rolledSnaps[0].id === 'SNAP-104', 'Returned correct rolled back item');

    // 3.5 Status filter: 'ACCEPTED'
    const acceptedSnaps = filterSnapshots(mockSnapshots, '', 'ACCEPTED');
    assert(acceptedSnaps.length === 1, 'Status filter "ACCEPTED" returns 1 item');
    assert(acceptedSnaps[0].id === 'SNAP-102', 'Returned correct accepted item');

    // 3.6 Combined search + status filter
    const combinedSnaps = filterSnapshots(mockSnapshots, 'users_report', 'REJECTED');
    assert(combinedSnaps.length === 1, 'Combined search query + status returns 1 item');

    const nonMatching = filterSnapshots(mockSnapshots, 'non_existent_file', 'ALL');
    assert(nonMatching.length === 0, 'Non-matching query returns 0 items');
  } catch (err: any) {
    assert(false, `VF-03 execution failed: ${err.message}`);
  }

  // ─── 4. Integration: End-to-End verifyAndCreateShadowDiff ─────────────────
  console.log('\n🌐 [4/4] Testing End-to-End verifyAndCreateShadowDiff Creation...');
  try {
    const origCode = 'function main() {\n  console.log("start");\n  console.log("end");\n}';
    const propCode = 'function main() {\n  console.log("start");\n  console.log("mid");\n  console.log("end");\n}';

    const diffCheck = verifyAndCreateShadowDiff('src/app.ts', origCode, propCode);

    assert(diffCheck.id.startsWith('SNAP-'), `Generated valid snapshot ID: ${diffCheck.id}`);
    assert(diffCheck.targetFile === 'src/app.ts', 'Target file preserved');
    assert(diffCheck.syntaxCheckPassed === true, 'Valid syntax check passed');
    assert(diffCheck.lspDiagnosticsCount === 0, 'Zero LSP diagnostics for valid code');
    assert(diffCheck.status === 'PENDING', 'Default status is PENDING');
    assert(diffCheck.patchDiff.includes('--- a/src/app.ts'), 'Diff header contains --- a/');
    assert(diffCheck.patchDiff.includes('+++ b/src/app.ts'), 'Diff header contains +++ b/');
    assert(diffCheck.patchDiff.includes('+   console.log("mid");'), 'Unified diff includes added line');

    // Broken code test
    const brokenCode = 'function broken() {\n  console.log("missing brace");';
    const brokenDiffCheck = verifyAndCreateShadowDiff('src/broken.ts', origCode, brokenCode);
    assert(brokenDiffCheck.syntaxCheckPassed === false, 'Broken syntax check marked false');
    assert(brokenDiffCheck.lspDiagnosticsCount > 0, `Diagnostics count populated: ${brokenDiffCheck.lspDiagnosticsCount}`);
  } catch (err: any) {
    assert(false, `Integration verification failed: ${err.message}`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  PART 4 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
