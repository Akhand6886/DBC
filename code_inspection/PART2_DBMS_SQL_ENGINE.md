# 🗄️ Code Inspection — Part 2: DBMS Studio & SQL Engine Domain

> **Inspection Date:** 2026-09-17  
> **Domain:** SQL Engine Driver, Query Firewall, Virtual Transactions, Schema Differ, Lineage, Sandbox Branches & Optimizer  
> **Target Paths:**
> - [`src/components/dbms/`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/)
> - [`src/lib/db/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/)
> - [`src/lib/lineage/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/lineage/)
> - [`src/lib/optimizer/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/optimizer/)
> - [`src/lib/sandbox/`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sandbox/)

---

## 1. Domain Architecture & Subsystems

```
                               ┌───────────────────────────────┐
                               │     SqlQueryPanel.tsx (UI)    │
                               │     TableDataEditor.tsx       │
                               │     DbObjectExplorer.tsx      │
                               └───────────────┬───────────────┘
                                               │
                                               ▼
                               ┌───────────────────────────────┐
                               │      queryFirewall.ts         │
                               │   (Safety & Risk Engine)      │
                               └───────────────┬───────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
         ┌─────────────────────────────┐               ┌─────────────────────────────┐
         │   transactionManager.ts     │               │        sqlDriver.ts         │
         │ - Dry-Run Simulation        │               │ - In-Memory Relational Core │
         │ - Inverted Rollback SQL     │               │ - SQLite / Postgres Adapter │
         │ - Snapshot Stack            │               │ - DDL & DML Parsers         │
         └─────────────────────────────┘               └──────────────┬──────────────┘
                                                                      │
                 ┌─────────────────────────────┬──────────────────────┴──────────────────────┐
                 ▼                             ▼                                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐         ┌───────────────────────────┐
   │    dataLineageEngine.ts   │ │   dbBranchManager.ts      │         │ agentPerformanceOptimizer │
   │ - Dependency DAG          │ │ - Git-like Sandboxes      │         │ - Slow Query Analysis     │
   │ - Blast Radius Analysis   │ │ - Copy-on-Write Branches  │         │ - AI Index Advisor        │
   │ - Breaking Change Guard   │ │ - Isolated Merges         │         │ - Benchmark Estimations   │
   └───────────────────────────┘ └───────────────────────────┘         └───────────────────────────┘
```

---

## 2. File Inventory & Line Metrics

| Component / Module | Path | Size | Primary Responsibility |
|:---|:---|:---|:---|
| **SqlQueryPanel** | [`src/components/dbms/SqlQueryPanel.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/SqlQueryPanel.tsx) | 29.7 KB | Monaco SQL query runner, inline editable data grid, tools & export menus |
| **TableDataEditor** | [`src/components/dbms/TableDataEditor.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/TableDataEditor.tsx) | 10.6 KB | Visual table grid, cell mutation by primary key, column sorting & filtering |
| **DbObjectExplorer** | [`src/components/dbms/DbObjectExplorer.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/DbObjectExplorer.tsx) | 14.6 KB | Tree explorer for tables, columns, indexes, foreign keys, and context actions |
| **DbConnectionPanel** | [`src/components/dbms/DbConnectionPanel.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/DbConnectionPanel.tsx) | 7.4 KB | Active connection manager, credentials configuration & latency indicators |
| **DataExportWizard** | [`src/components/dbms/DataExportWizard.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/DataExportWizard.tsx) | 4.9 KB | Dataset export dialog supporting CSV, JSON, Markdown, and SQL INSERT scripts |
| **RealSqlDriver** | [`src/lib/db/sqlDriver.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts) | 16.9 KB | Core SQL engine executing real DDL/DML queries, WHERE evaluator, JOINs |
| **QueryFirewall** | [`src/lib/db/queryFirewall.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/queryFirewall.ts) | 12.2 KB | Pre-execution safety analyzer, blast radius estimation, risk scoring |
| **TransactionManager** | [`src/lib/db/transactionManager.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/transactionManager.ts) | 13.0 KB | Dry-run execution simulator, inverted rollback SQL synthesizer, snapshots |
| **SchemaDiffer** | [`src/lib/db/schemaDiffer.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/schemaDiffer.ts) | 4.3 KB | Bidirectional table/column diffing, UP/DOWN migrations & safety warnings |
| **DbMemory** | [`src/lib/db/dbMemory.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/dbMemory.ts) | 8.4 KB | Business invariants registry, column PII tags & schema policy metadata |
| **DataLineageEngine** | [`src/lib/lineage/dataLineageEngine.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/lineage/dataLineageEngine.ts) | 16.4 KB | Downstream & upstream dependency graph, foreign key blast radius evaluator |
| **DbBranchManager** | [`src/lib/sandbox/dbBranchManager.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/sandbox/dbBranchManager.ts) | 14.8 KB | Isolated sandbox branch creation, diff calculation & 1-click branch merge |
| **AgentOptimizer** | [`src/lib/optimizer/agentPerformanceOptimizer.ts`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/optimizer/agentPerformanceOptimizer.ts) | 9.7 KB | Sequential scan detector, synthetic index synthesizer & benchmark simulator |

---

## 3. Remediations Applied in Prior Sprints

1. **Table Editor Row Index Desync on Sort/Filter (`P3-F1`)**:
   - In `TableDataEditor.tsx`, decoupled row editing from sorted/filtered visual indices. Wrapped in `displayRows` mapping that preserves the underlying `originalIndex` into `rows`.
2. **Persist Inline Query Result Cell Edits (`P3-F2`)**:
   - In `SqlQueryPanel.tsx:160-205`, wired double-click inline cell edits to generate and execute parameterized `UPDATE [table] SET [col] = ? WHERE id = ?` queries against `realSqlDriver`.
3. **Sanitize Semicolons in SQL Mutation Queries (`P3-F3`)**:
   - In `sqlDriver.ts:128,320,360`, trimmed trailing semicolons and sanitized `whereClause` across `UPDATE`, `DELETE`, and `SELECT` to prevent `NaN` comparisons.
4. **Detect Dropped Columns in Schema Differ (`P3-F4`)**:
   - In `schemaDiffer.ts`, added two-way column diffing to generate `ALTER TABLE ... DROP COLUMN` scripts and emit `WARNING` data loss alerts.
5. **Wired Global `⌘Enter` to SQL Query Runner (`Issue #4`)**:
   - Centralized `executeSqlRef.current` and dispatched custom event `dbc-execute-sql` to trigger `handleExecuteQuery()` without double execution.

---

## 4. Deep-Dive Code Inspection Findings

### Finding DB-01: JOIN Column Namespace Collision on Identical Column Names
* **Severity**: 🟠 High
* **Location**: [`src/lib/db/sqlDriver.ts:200-230`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L200-L230)
* **Defect Analysis**:
  ```ts
  for (const mainRow of rows) {
    const matching = joinData.filter(...);
    for (const m of matching) {
      joinedRows.push({ ...mainRow, ...m });
    }
  }
  ```
  When executing `SELECT * FROM users JOIN roles ON users.role_id = roles.id`, both `users` and `roles` have an `id` column. Merging with `{ ...mainRow, ...m }` causes `roles.id` to overwrite `users.id` in the returned row set.
* **Remediation**:
  Namespace columns as `table.column` (e.g. `users.id`, `roles.id`) or respect explicit column aliases projected in the `SELECT` clause.

---

### Finding DB-02: Comma Split in DDL Breaks Parameterized Types
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/db/sqlDriver.ts:133-146`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L133-L146)
* **Defect Analysis**:
  ```ts
  const columnDefs = body.split(',').map(line => line.trim()).filter(...);
  ```
  In DDL queries with parameterized data types such as `DECIMAL(10, 2)` or `NUMERIC(8, 4)`, naive splitting on `,` breaks the type definition across two separate invalid columns (`DECIMAL(10` and `2)`).
* **Remediation**:
  Use a regex tokenizer or bracket-aware comma split: `body.split(/,(?![^(]*\))/g)`.

---

### Finding DB-03: Business Invariant Policies Persisted in Memory Only
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/db/dbMemory.ts:75-90`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/dbMemory.ts#L75-L90)
* **Defect Analysis**:
  Custom business invariant rules created via [`DbMemoryModal.tsx`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/modals/DbMemoryModal.tsx) reside in the static `DbMemoryEngine.invariants` array. On browser page reload, all user-defined invariant policies revert to seed defaults.
* **Remediation**:
  Serialize `invariants` and `tableAnnotations` to `localStorage.getItem('dbc_db_memory_v1')`.

---

### Finding DB-04: Dropdown Menu Keyboard Traversal in SqlQueryPanel
* **Severity**: 💡 Low
* **Location**: [`src/components/dbms/SqlQueryPanel.tsx:210-240`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/SqlQueryPanel.tsx#L210-L240)
* **Defect Analysis**:
  Tools and Export dropdown menus support mouse dismissal via background overlay, but do not listen for `Escape`, `ArrowDown`, or `ArrowUp` key navigation for keyboard accessibility.
* **Remediation**:
  Attach keydown listener to menu container with active item focus traversal.

---

## 5. Verification & Test Coverage Matrix

- ✅ `test-p0-subsystems.ts`: 25/25 Passing
  - Query Firewall evaluation (CRITICAL on DROP TABLE, HIGH on WHERE 1=1)
  - Virtual Transaction Manager dry-run row diffing & snapshot rollback
- ✅ `test-p1-subsystems.ts`: 27/27 Passing
  - Database Memory invariant rules & PII column tagging
  - DuckDB, SQLite, PostgreSQL, and MySQL driver plugin API
- ✅ `test-p2-subsystems.ts`: 25/25 Passing
  - Data Lineage dependency graph (upstream, downstream, and foreign key blast radius)
  - Database Sandbox & Branch Execution (isolated copy-on-write, merge, deletion)
  - Agent Performance Optimizer (unindexed filter detection, synthetic index generation)
