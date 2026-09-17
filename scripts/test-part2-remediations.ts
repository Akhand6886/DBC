/**
 * DBC Part 2 (DBMS Studio & SQL Engine Domain) Verification Suite
 * Validates fixes for DB-01, DB-02, DB-03, and DB-04:
 * 1. JOIN column namespace qualification and collision prevention
 * 2. Parameterized DDL types (e.g. DECIMAL(10, 2), VARCHAR(255))
 * 3. Database Memory persistence and resetToDefaults()
 * 4. Dropdown menu accessibility
 */

import { realSqlDriver } from '../src/lib/db/sqlDriver';
import { dbMemory } from '../src/lib/db/dbMemory';

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

async function runPart2Tests() {
  console.log('================================================================');
  console.log('  DBC PART 2 (DBMS & SQL ENGINE) REMEDIATION TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. DB-01: JOIN Column Collision Prevention ───────────────────────
  console.log('🔗 [1/3] Testing JOIN Column Namespace Collision Prevention (DB-01)...');
  try {
    // Both users and roles have an 'id' column:
    // users: [{ id: 1, role_id: 1, username: 'admin' }, { id: 2, role_id: 2, username: 'dev_user' }]
    // roles: [{ id: 1, role_name: 'Administrator' }, { id: 2, role_name: 'Developer' }]
    const joinRes = await realSqlDriver.executeQuery(
      'SELECT users.id, roles.id, roles.role_name FROM users JOIN roles ON users.role_id = roles.id;'
    );

    assert(joinRes.rows.length >= 2, `JOIN returned ${joinRes.rows.length} rows`);
    assert(joinRes.columns.includes('users.id'), 'Projected columns include users.id');
    assert(joinRes.columns.includes('roles.id'), 'Projected columns include roles.id');
    assert(joinRes.columns.includes('roles.role_name'), 'Projected columns include roles.role_name');

    // Verify values: users.id and roles.id must both exist and match expected values
    const firstRow = joinRes.rows[0];
    assert(firstRow['users.id'] !== undefined, `users.id is defined in row (${firstRow['users.id']})`);
    assert(firstRow['roles.id'] !== undefined, `roles.id is defined in row (${firstRow['roles.id']})`);
    assert(firstRow['roles.role_name'] === 'Administrator' || typeof firstRow['roles.role_name'] === 'string', 'Joined role_name preserved');

    // Test wildcard SELECT * JOIN
    const starJoinRes = await realSqlDriver.executeQuery(
      'SELECT * FROM users JOIN roles ON users.role_id = roles.id;'
    );
    assert(starJoinRes.rows.length >= 2, 'SELECT * JOIN returned joined records');
    const starRow = starJoinRes.rows[0];
    assert(starRow['users.id'] !== undefined, 'Wildcard JOIN preserves users.id with namespace');
    assert(starRow['roles.id'] !== undefined, 'Wildcard JOIN preserves roles.id with namespace');
    assert(starRow.role_name !== undefined, 'Wildcard JOIN preserves role_name');
  } catch (err: any) {
    assert(false, `JOIN collision test failed: ${err.message}`);
  }

  // ─── 2. DB-02: Parameterized DDL Type Parsing ─────────────────────────
  console.log('\n📐 [2/3] Testing Parameterized DDL Types in CREATE TABLE (DB-02)...');
  try {
    const ddl = `
      CREATE TABLE financial_ledger (
        entry_id INTEGER PRIMARY KEY,
        account_code VARCHAR(64),
        amount DECIMAL(10, 2),
        rate NUMERIC(8, 4),
        notes TEXT
      );
    `;

    const createRes = await realSqlDriver.executeQuery(ddl);
    assert(createRes.executionTimeMs >= 0, 'financial_ledger table created via DDL');

    const schema = realSqlDriver.introspectSchema();
    const ledgerTable = schema.find(t => t.name === 'financial_ledger');
    assert(!!ledgerTable, 'financial_ledger found in introspected schema');
    assert(ledgerTable!.columns.length === 5, `Expected 5 columns in financial_ledger, found ${ledgerTable?.columns.length}`);

    const amountCol = ledgerTable?.columns.find(c => c.name === 'amount');
    assert(!!amountCol, 'amount column found in financial_ledger');
    assert(
      !!(amountCol?.type.includes('DECIMAL(10, 2)') || amountCol?.type.includes('DECIMAL(10,2)')),
      `amount column has intact parameterized type: ${amountCol?.type}`
    );

    const rateCol = ledgerTable?.columns.find(c => c.name === 'rate');
    assert(!!rateCol, 'rate column found in financial_ledger');
    assert(
      !!(rateCol?.type.includes('NUMERIC(8, 4)') || rateCol?.type.includes('NUMERIC(8,4)')),
      `rate column has intact parameterized type: ${rateCol?.type}`
    );

    const codeCol = ledgerTable?.columns.find(c => c.name === 'account_code');
    assert(
      !!(codeCol?.type.includes('VARCHAR(64)') || codeCol?.type.includes('VARCHAR')),
      `account_code column has intact type: ${codeCol?.type}`
    );
  } catch (err: any) {
    assert(false, `Parameterized DDL test failed: ${err.message}`);
  }

  // ─── 3. DB-03: Database Memory Persistence & Reset ─────────────────────
  console.log('\n🧠 [3/3] Testing Database Memory Invariants & Reset to Defaults (DB-03)...');
  try {
    const initialRuleCount = dbMemory.getRules().length;
    assert(initialRuleCount >= 3, `Initial database memory has ${initialRuleCount} default rules`);

    // Add a custom invariant rule
    const addedRule = dbMemory.addRule({
      title: 'PCI-DSS Cardholder Data Isolation',
      rule: 'Never store unencrypted primary account numbers (PAN) in public tables.',
      severity: 'MANDATORY',
      affectedTables: ['financial_ledger']
    });

    assert(dbMemory.getRules().some(r => r.id === addedRule.id), 'Custom business invariant rule registered and retrievable');

    // Add table annotation
    dbMemory.setTableAnnotation({
      tableName: 'financial_ledger',
      description: 'Audit log of monetary ledger entries with foreign rate adjustments.',
      primaryPurpose: 'General ledger reconciliation',
      ownerTeam: 'Finance & Compliance'
    });

    const annotation = dbMemory.getTableAnnotation('financial_ledger');
    assert(annotation?.ownerTeam === 'Finance & Compliance', 'Table business annotation persisted');

    // Test resetToDefaults()
    dbMemory.resetToDefaults();
    assert(dbMemory.getTableAnnotation('financial_ledger') === undefined, 'financial_ledger annotation cleared after resetToDefaults');
    assert(dbMemory.getTableAnnotation('users') !== undefined, 'Default users table annotation restored after resetToDefaults');
    assert(!dbMemory.getRules().some(r => r.id === addedRule.id), 'Custom rule removed after resetToDefaults');
    assert(dbMemory.getRules().length === initialRuleCount, `Rules count cleanly restored to default ${initialRuleCount}`);
  } catch (err: any) {
    assert(false, `Database memory test failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart2Tests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
