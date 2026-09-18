/**
 * DBC Transaction & Rollback Management Engine
 * Provides dry-run transaction isolation, before/after row diffing,
 * automatic inverted SQL rollback generation, and 1-click snapshot restoration.
 */

import { realSqlDriver, RealQueryResult, IntrospectedTable } from './sqlDriver';

export interface RowDiff {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  primaryKeyCol?: string;
  primaryKeyValue?: any;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}

export interface RollbackSnapshot {
  id: string;
  timestamp: string;
  description: string;
  query: string;
  targetTables: string[];
  affectedRowCount: number;
  rowDiffs: RowDiff[];
  rollbackSql: string;
  status: 'COMMITTED' | 'ROLLED_BACK' | 'PENDING_APPROVAL';
  beforeTablesState: Record<string, Record<string, any>[]>;
  afterTablesState: Record<string, Record<string, any>[]>;
  beforeSchemaState?: Record<string, IntrospectedTable | undefined>;
}

export interface DryRunResult {
  query: string;
  affectedRowCount: number;
  targetTables: string[];
  rowDiffs: RowDiff[];
  rollbackSql: string;
  previewRowsBefore: Record<string, any>[];
  previewRowsAfter: Record<string, any>[];
  executionTimeMs: number;
  error?: string;
}

export class TransactionManager {
  private history: RollbackSnapshot[] = [];
  private maxHistorySize = 50;

  /**
   * Perform an isolated dry-run simulation of a mutating SQL statement
   * without persisting changes to the active database.
   */
  public dryRun(sql: string): DryRunResult {
    const startTime = Date.now();
    const cleanSql = sql.trim().replace(/;+$/, '');

    // Determine target table
    const targetTables = this.extractTargetTables(cleanSql);
    const beforeState: Record<string, Record<string, any>[]> = {};
    
    for (const tbl of targetTables) {
      beforeState[tbl] = realSqlDriver.getTableData(tbl).map(r => ({ ...r }));
    }

    // In-memory simulation: clone data and apply mutation logic
    const afterState: Record<string, Record<string, any>[]> = {};
    for (const tbl of targetTables) {
      afterState[tbl] = beforeState[tbl].map(r => ({ ...r }));
    }

    const rowDiffs: RowDiff[] = [];
    let affectedRowCount = 0;

    // Simulate UPDATE
    if (/^UPDATE\s+([a-zA-Z0-9_]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        const setClause = match[2];
        const whereClause = match[3];

        const assignments = setClause.split(',').map(s => {
          const [k, v] = s.split('=').map(x => x.trim().replace(/^['"]|['"]$/g, ''));
          return { key: k, val: v };
        });

        const rows = afterState[tbl] || [];
        afterState[tbl] = rows.map(r => {
          const matches = this.matchesWhere(r, whereClause);
          if (matches) {
            affectedRowCount++;
            const updated = { ...r };
            assignments.forEach(a => { updated[a.key] = a.val; });
            rowDiffs.push({
              type: 'UPDATE',
              table: tbl,
              primaryKeyCol: 'id',
              primaryKeyValue: r.id,
              beforeData: { ...r },
              afterData: updated
            });
            return updated;
          }
          return r;
        });
      }
    }

    // Simulate DELETE
    if (/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        const whereClause = match[2];
        const rows = afterState[tbl] || [];
        const keptRows: Record<string, any>[] = [];

        rows.forEach(r => {
          const matches = this.matchesWhere(r, whereClause);
          if (matches) {
            affectedRowCount++;
            rowDiffs.push({
              type: 'DELETE',
              table: tbl,
              primaryKeyCol: 'id',
              primaryKeyValue: r.id,
              beforeData: { ...r }
            });
          } else {
            keptRows.push(r);
          }
        });
        afterState[tbl] = keptRows;
      }
    }

    // Simulate INSERT
    if (/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*(\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        const colNames = match[3] ? match[3].split(',').map(c => c.trim()) : [];
        const rawValues = match[4].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
        const newRow: Record<string, any> = {};

        if (colNames.length > 0) {
          colNames.forEach((c, idx) => { newRow[c] = rawValues[idx] || null; });
        } else {
          const tDef = realSqlDriver.getTable(tbl);
          if (tDef) {
            tDef.columns.forEach((col, idx) => { newRow[col.name] = rawValues[idx] || null; });
          }
        }
        if (!newRow.id) newRow.id = (afterState[tbl]?.length || 0) + 1;

        afterState[tbl] = [...(afterState[tbl] || []), newRow];
        affectedRowCount = 1;
        rowDiffs.push({
          type: 'INSERT',
          table: tbl,
          primaryKeyCol: 'id',
          primaryKeyValue: newRow.id,
          afterData: newRow
        });
      }
    }

    // Simulate DROP TABLE
    if (/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i.test(cleanSql)) {
      const match = cleanSql.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        affectedRowCount = beforeState[tbl]?.length || 0;
        rowDiffs.push({
          type: 'DELETE',
          table: tbl,
          beforeData: { dropTable: tbl, rowCount: affectedRowCount }
        });
        afterState[tbl] = [];
      }
    }

    const rollbackSql = this.generateInvertedRollbackSql(rowDiffs, beforeState);
    const mainTable = targetTables[0] || 'unknown';

    return {
      query: cleanSql,
      affectedRowCount,
      targetTables,
      rowDiffs,
      rollbackSql,
      previewRowsBefore: beforeState[mainTable] || [],
      previewRowsAfter: afterState[mainTable] || [],
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Execute a query against the driver, capturing real state diffs
   * and saving a rollback snapshot to the history stack.
   */
  public async executeWithSnapshot(sql: string): Promise<{ result: RealQueryResult; snapshot?: RollbackSnapshot }> {
    const cleanSql = sql.trim().replace(/;+$/, '');
    const isMutating = /^(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i.test(cleanSql);

    if (!isMutating) {
      const result = await realSqlDriver.executeQuery(cleanSql);
      return { result };
    }

    // Capture before state
    const targetTables = this.extractTargetTables(cleanSql);
    const beforeState: Record<string, Record<string, any>[]> = {};
    const beforeSchema: Record<string, IntrospectedTable | undefined> = {};

    for (const tbl of targetTables) {
      beforeState[tbl] = realSqlDriver.getTableData(tbl).map(r => ({ ...r }));
      beforeSchema[tbl] = realSqlDriver.getTable(tbl);
    }

    // Execute real query
    const result = await realSqlDriver.executeQuery(cleanSql);

    // Capture after state
    const afterState: Record<string, Record<string, any>[]> = {};
    for (const tbl of targetTables) {
      afterState[tbl] = realSqlDriver.getTableData(tbl).map(r => ({ ...r }));
    }

    // Compute diffs
    const rowDiffs: RowDiff[] = [];
    let affectedCount = result.affectedRows || 0;

    for (const tbl of targetTables) {
      const bRows = beforeState[tbl] || [];
      const aRows = afterState[tbl] || [];

      // Detect deletions
      bRows.forEach(br => {
        if (!aRows.some(ar => String(ar.id) === String(br.id))) {
          rowDiffs.push({
            type: 'DELETE',
            table: tbl,
            primaryKeyCol: 'id',
            primaryKeyValue: br.id,
            beforeData: br
          });
        }
      });

      // Detect additions
      aRows.forEach(ar => {
        if (!bRows.some(br => String(br.id) === String(ar.id))) {
          rowDiffs.push({
            type: 'INSERT',
            table: tbl,
            primaryKeyCol: 'id',
            primaryKeyValue: ar.id,
            afterData: ar
          });
        }
      });

      // Detect updates
      bRows.forEach(br => {
        const ar = aRows.find(x => String(x.id) === String(br.id));
        if (ar && JSON.stringify(ar) !== JSON.stringify(br)) {
          rowDiffs.push({
            type: 'UPDATE',
            table: tbl,
            primaryKeyCol: 'id',
            primaryKeyValue: br.id,
            beforeData: br,
            afterData: ar
          });
        }
      });
    }

    const rollbackSql = this.generateInvertedRollbackSql(rowDiffs, beforeState);

    const snapshot: RollbackSnapshot = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      description: `Executed: ${cleanSql.slice(0, 48)}${cleanSql.length > 48 ? '...' : ''}`,
      query: cleanSql,
      targetTables,
      affectedRowCount: affectedCount || rowDiffs.length,
      rowDiffs,
      rollbackSql,
      status: 'COMMITTED',
      beforeTablesState: beforeState,
      afterTablesState: afterState,
      beforeSchemaState: beforeSchema
    };

    this.history.unshift(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }

    return { result, snapshot };
  }

  /**
   * Roll back an execution snapshot by restoring the previous table state.
   */
  public rollbackSnapshot(snapshotId: string): boolean {
    const snap = this.history.find(s => s.id === snapshotId);
    if (!snap || snap.status === 'ROLLED_BACK') return false;

    // Restore table rows in driver
    for (const [tbl, rows] of Object.entries(snap.beforeTablesState)) {
      realSqlDriver.setTableData(tbl, rows.map(r => ({ ...r })));
    }

    snap.status = 'ROLLED_BACK';
    return true;
  }

  public createManualSnapshot(description: string = 'Agent Manual Snapshot'): RollbackSnapshot {
    const tableNames = realSqlDriver.getTableNames();
    const beforeTablesState: Record<string, Record<string, any>[]> = {};
    for (const tbl of tableNames) {
      beforeTablesState[tbl] = realSqlDriver.getTableData(tbl).map(r => ({ ...r }));
    }

    const snapshot: RollbackSnapshot = {
      id: `snap-${Date.now().toString(36)}-manual`,
      timestamp: new Date().toLocaleTimeString(),
      description,
      query: '-- Manual Agent Snapshot Backup',
      targetTables: tableNames,
      affectedRowCount: 0,
      rowDiffs: [],
      rollbackSql: '-- Manual snapshot point',
      status: 'COMMITTED',
      beforeTablesState,
      afterTablesState: beforeTablesState,
    };

    this.history.unshift(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
    return snapshot;
  }

  public getHistory(): RollbackSnapshot[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  private extractTargetTables(sql: string): string[] {
    const tables = new Set<string>();
    const matches = Array.from(sql.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+([a-zA-Z0-9_]+)/gi));
    for (const m of matches) {
      if (m[1]) tables.add(m[1].toLowerCase());
    }
    return Array.from(tables);
  }

  private matchesWhere(row: Record<string, any>, whereClause?: string): boolean {
    if (!whereClause || !whereClause.trim()) return true;
    const cond = whereClause.trim();
    if (cond === '1=1' || cond === 'true') return true;

    const opMatch = cond.match(/([a-zA-Z0-9_.]+)\s*(=|!=|<>|>|<|>=|<=)\s*(['"]?[^'"]+['"]?)/);
    if (opMatch) {
      const col = opMatch[1].split('.').pop()!;
      const op = opMatch[2];
      const target = opMatch[3].trim().replace(/^['"]|['"]$/g, '');
      const val = row[col];

      if (op === '=') return String(val) === target;
      if (op === '!=' || op === '<>') return String(val) !== target;
      if (op === '>') return Number(val) > Number(target);
      if (op === '<') return Number(val) < Number(target);
      if (op === '>=') return Number(val) >= Number(target);
      if (op === '<=') return Number(val) <= Number(target);
    }
    return true;
  }

  private generateInvertedRollbackSql(
    diffs: RowDiff[],
    beforeState: Record<string, Record<string, any>[]>
  ): string {
    if (diffs.length === 0) return '-- No row mutations detected; no rollback required.';

    const lines: string[] = ['-- AUTO-GENERATED INVERTED TRANSACTION ROLLBACK SCRIPT', 'BEGIN TRANSACTION;'];

    for (const diff of diffs) {
      if (diff.type === 'INSERT') {
        lines.push(`DELETE FROM ${diff.table} WHERE ${diff.primaryKeyCol || 'id'} = ${JSON.stringify(diff.primaryKeyValue)};`);
      } else if (diff.type === 'DELETE' && diff.beforeData) {
        const cols = Object.keys(diff.beforeData);
        const vals = cols.map(c => typeof diff.beforeData![c] === 'number' ? diff.beforeData![c] : `'${String(diff.beforeData![c] ?? '').replace(/'/g, "''")}'`);
        lines.push(`INSERT INTO ${diff.table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
      } else if (diff.type === 'UPDATE' && diff.beforeData) {
        const assignments = Object.entries(diff.beforeData)
          .filter(([k]) => k !== diff.primaryKeyCol)
          .map(([k, v]) => `${k} = ${typeof v === 'number' ? v : `'${String(v ?? '').replace(/'/g, "''")}'`}`);
        lines.push(`UPDATE ${diff.table} SET ${assignments.join(', ')} WHERE ${diff.primaryKeyCol || 'id'} = ${JSON.stringify(diff.primaryKeyValue)};`);
      }
    }

    lines.push('COMMIT;');
    return lines.join('\n');
  }
}

export const transactionManager = new TransactionManager();
