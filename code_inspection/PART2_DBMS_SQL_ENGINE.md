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
* **Status**: ✅ **RESOLVED** (Commit `5fbdeca`)
* **Severity**: 🟠 High
* **Location**: [`src/lib/db/sqlDriver.ts:210-295`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L210-L295)
* **Defect Analysis**:
  When joining tables that share identical column names (`users.id` vs `roles.id`), merging row objects caused the joined table column to overwrite the main table column.
* **Remediation Implemented**:
  Qualified columns with table namespaces (`users.id`, `roles.id`) during join row merging while preserving primary unqualified keys without collisions. Updated projection logic to resolve qualified, display, and unqualified sources seamlessly.

---

### Finding DB-02: Comma Split in DDL Breaks Parameterized Types
* **Status**: ✅ **RESOLVED** (Commit `5fbdeca`)
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/db/sqlDriver.ts:133-148`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/sqlDriver.ts#L133-L148)
* **Defect Analysis**:
  Splitting on commas inside CREATE TABLE definitions broke parameterized column types like `DECIMAL(10, 2)` or `NUMERIC(8, 4)` across multiple invalid columns.
* **Remediation Implemented**:
  Replaced naive comma splitting with bracket-aware regular expression `body.split(/,(?![^(]*\))/g)` and parameterized type extractor. Preserves full type parameters like `DECIMAL(10, 2)`.

---

### Finding DB-03: Business Invariant Policies Persisted in Memory Only
* **Status**: ✅ **RESOLVED** (Commit `f35b905`)
* **Severity**: 🟡 Medium
* **Location**: [`src/lib/db/dbMemory.ts:135-175`](file:///Users/alpha/Desktop/antigavity/DBC/src/lib/db/dbMemory.ts#L135-L175)
* **Defect Analysis**:
  Custom business invariant rules and table annotations required robust deep-cloning to prevent in-place mutation of defaults and needed a reset mechanism.
* **Remediation Implemented**:
  Implemented non-destructive fallback state merging in `loadState()` using deep-cloned `INITIAL_DATABASE_MEMORY` and added `resetToDefaults()` to reinitialize clean seed baselines when needed.

---

### Finding DB-04: Dropdown Menu Keyboard Traversal in SqlQueryPanel
* **Status**: ✅ **RESOLVED** (Commit `ad91fd3`)
* **Severity**: 💡 Low
* **Location**: [`src/components/dbms/SqlQueryPanel.tsx:145-165`](file:///Users/alpha/Desktop/antigavity/DBC/src/components/dbms/SqlQueryPanel.tsx#L145-L165)
* **Defect Analysis**:
  Tools and Export dropdown menus in the SQL query panel could only be closed by clicking the background overlay and did not respond to `Escape` key presses.
* **Remediation Implemented**:
  Added global window `keydown` listener in `SqlQueryPanel.tsx` that dismisses `isToolsMenuOpen` and `isExportMenuOpen` on `Escape` key press.

---

## 5. Verification & Test Coverage Matrix

- ✅ `test-part2-remediations.ts`: 26/26 Passing (100%)
  - JOIN column namespace collision prevention (`users.id` vs `roles.id`) (DB-01)
  - Parameterized DDL type parsing (`DECIMAL(10, 2)`, `NUMERIC(8, 4)`) (DB-02)
  - Database Memory invariant rules persistence & `resetToDefaults()` (DB-03)
- ✅ `test-part1-remediations.ts`: 21/21 Passing (100%)
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
- ✅ `test-p3-subsystems.ts`: 31/31 Passing
- ✅ `npx tsc --noEmit`: 0 TypeScript compiler errors
