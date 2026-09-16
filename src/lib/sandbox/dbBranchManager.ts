/**
 * DBC Database Sandbox & Branch Execution Engine
 * Provides Git-like copy-on-write isolated database branching (main, sandbox/*, feature/*),
 * zero-risk agent experiment sandboxing, branch diffing, and 1-click merge & promotion.
 */

import { IntrospectedTable, RealQueryResult } from '../db/sqlDriver';

export interface DatabaseBranch {
  id: string;
  name: string;
  description: string;
  parentBranchId: string | null;
  createdAt: string;
  isMain: boolean;
  isSandbox: boolean;
  tables: Record<string, IntrospectedTable>;
  data: Record<string, Record<string, any>[]>;
}

export interface SchemaChangeDiff {
  type: 'TABLE_ADDED' | 'TABLE_DROPPED' | 'COLUMN_ADDED' | 'COLUMN_DROPPED';
  tableName: string;
  columnName?: string;
  details: string;
}

export interface DataChangeDiff {
  tableName: string;
  baseRowCount: number;
  compareRowCount: number;
  delta: number;
}

export interface BranchDiff {
  baseBranchId: string;
  compareBranchId: string;
  schemaChanges: SchemaChangeDiff[];
  dataChanges: DataChangeDiff[];
  hasModifications: boolean;
}

const STORAGE_KEY = 'dbc_database_branches_state';

export class DbBranchManager {
  private branches: Map<string, DatabaseBranch> = new Map();
  private activeBranchId: string = 'main';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeBranches();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  private initializeBranches(): void {
    const defaultTables: Record<string, IntrospectedTable> = {
      users: {
        name: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
          { name: 'username', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
          { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
          { name: 'role_id', type: 'INTEGER', isPrimary: false, isForeign: true }
        ]
      },
      roles: {
        name: 'roles',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
          { name: 'role_name', type: 'VARCHAR(100)', isPrimary: false, isForeign: false }
        ]
      }
    };

    const defaultData: Record<string, Record<string, any>[]> = {
      users: [
        { id: 1, username: 'admin', email: 'admin@dbc.org', role_id: 1 },
        { id: 2, username: 'alpha', email: 'alpha@dbc.org', role_id: 1 },
        { id: 3, username: 'agent_cli', email: 'agent@dbc.org', role_id: 2 }
      ],
      roles: [
        { id: 1, role_name: 'Administrator' },
        { id: 2, role_name: 'API Agent' }
      ]
    };

    const mainBranch: DatabaseBranch = {
      id: 'main',
      name: 'main',
      description: 'Production primary database branch.',
      parentBranchId: null,
      createdAt: new Date().toLocaleDateString(),
      isMain: true,
      isSandbox: false,
      tables: defaultTables,
      data: defaultData
    };

    this.branches.set('main', mainBranch);

    // Pre-seed a sandbox branch for demonstration
    const sandboxBranch: DatabaseBranch = {
      id: 'sandbox-migration-preview',
      name: 'sandbox/migration-preview',
      description: 'Ephemeral sandbox branch created by DBA Agent for index tuning & migration test.',
      parentBranchId: 'main',
      createdAt: new Date().toLocaleDateString(),
      isMain: false,
      isSandbox: true,
      tables: JSON.parse(JSON.stringify(defaultTables)),
      data: JSON.parse(JSON.stringify(defaultData))
    };

    // Add a simulated column change in the sandbox
    sandboxBranch.tables.users.columns.push({
      name: 'metadata',
      type: 'JSON',
      isPrimary: false,
      isForeign: false
    });
    sandboxBranch.data.users.forEach(u => {
      u.metadata = '{"tier": "pro"}';
    });

    this.branches.set(sandboxBranch.id, sandboxBranch);
  }

  public getBranches(): DatabaseBranch[] {
    return Array.from(this.branches.values());
  }

  public getActiveBranch(): DatabaseBranch {
    return this.branches.get(this.activeBranchId) || this.branches.get('main')!;
  }

  public getBranch(branchId: string): DatabaseBranch | undefined {
    return this.branches.get(branchId);
  }

  /**
   * Forks an existing branch into a copy-on-write isolated branch.
   */
  public createBranch(
    name: string,
    fromBranchId: string = 'main',
    description: string = '',
    isSandbox: boolean = false
  ): DatabaseBranch {
    const parent = this.branches.get(fromBranchId) || this.getActiveBranch();
    const id = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const newBranch: DatabaseBranch = {
      id,
      name,
      description: description || `Forked from ${parent.name} at ${new Date().toLocaleTimeString()}`,
      parentBranchId: parent.id,
      createdAt: new Date().toLocaleDateString(),
      isMain: false,
      isSandbox,
      tables: JSON.parse(JSON.stringify(parent.tables)),
      data: JSON.parse(JSON.stringify(parent.data))
    };

    this.branches.set(id, newBranch);
    this.notify();
    return newBranch;
  }

  /**
   * Switches the active workspace branch.
   */
  public switchBranch(branchId: string): DatabaseBranch {
    if (this.branches.has(branchId)) {
      this.activeBranchId = branchId;
      this.notify();
      return this.branches.get(branchId)!;
    }
    throw new Error(`Branch '${branchId}' not found.`);
  }

  /**
   * Executes a database task in an ephemeral isolated sandbox branch,
   * guaranteeing that 'main' is never mutated during speculative evaluation.
   */
  public async executeInSandbox<T>(
    sandboxName: string,
    task: (branch: DatabaseBranch) => Promise<T>
  ): Promise<{ result: T; branch: DatabaseBranch; diff: BranchDiff }> {
    const branch = this.createBranch(`sandbox/${sandboxName}-${Date.now()}`, this.activeBranchId, 'Ephemeral agent sandbox', true);
    
    try {
      const result = await task(branch);
      const diff = this.diffBranches(this.activeBranchId, branch.id);
      return { result, branch, diff };
    } catch (err) {
      this.deleteBranch(branch.id);
      throw err;
    }
  }

  /**
   * Execute SQL directly against an isolated branch's tables and rows.
   */
  public executeInBranch(branchId: string, sql: string): RealQueryResult {
    const branch = this.branches.get(branchId);
    if (!branch) throw new Error(`Branch '${branchId}' does not exist.`);

    const startTime = Date.now();
    const cleanSql = sql.trim();

    // 1. CREATE TABLE
    if (/^CREATE\s+TABLE/i.test(cleanSql)) {
      const match = cleanSql.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const body = match[2];
        const columnDefs = body.split(',').map(line => line.trim()).filter(line => line && !/^PRIMARY|^FOREIGN|^KEY|^CONSTRAINT/i.test(line));
        const columns = columnDefs.map(def => {
          const parts = def.split(/\s+/);
          return {
            name: parts[0],
            type: (parts[1] || 'TEXT').toUpperCase(),
            isPrimary: /PRIMARY\s+KEY/i.test(def),
            isForeign: /REFERENCES/i.test(def)
          };
        });

        branch.tables[tableName] = { name: tableName, columns };
        branch.data[tableName] = [];
        this.notify();

        return {
          columns: [],
          rows: [],
          affectedRows: 0,
          executionTimeMs: Date.now() - startTime
        };
      }
    }

    // 2. INSERT INTO
    if (/^INSERT\s+INTO/i.test(cleanSql)) {
      const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*(\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const colNames = match[3] ? match[3].split(',').map(c => c.trim()) : [];
        const rawValues = match[4].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));

        if (branch.tables[tableName]) {
          const newRow: Record<string, any> = {};
          if (colNames.length > 0) {
            colNames.forEach((c, idx) => { newRow[c] = rawValues[idx] || null; });
          } else {
            branch.tables[tableName].columns.forEach((col, idx) => { newRow[col.name] = rawValues[idx] || null; });
          }
          if (!branch.data[tableName]) branch.data[tableName] = [];
          branch.data[tableName].push(newRow);
          this.notify();

          return {
            columns: [],
            rows: [],
            affectedRows: 1,
            executionTimeMs: Date.now() - startTime
          };
        }
      }
    }

    // 3. SELECT
    if (/^SELECT/i.test(cleanSql)) {
      const selectMatch = cleanSql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)/i);
      if (selectMatch) {
        const tableName = selectMatch[2].toLowerCase();
        const rows = branch.data[tableName] ? branch.data[tableName].map(r => ({ ...r })) : [];
        const cols = branch.tables[tableName]?.columns.map(c => c.name) || (rows[0] ? Object.keys(rows[0]) : []);

        return {
          columns: cols,
          rows,
          executionTimeMs: Date.now() - startTime
        };
      }
    }

    // 4. DELETE FROM
    if (/^DELETE\s+FROM/i.test(cleanSql)) {
      const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const prevCount = branch.data[tableName]?.length || 0;
        branch.data[tableName] = [];
        this.notify();
        return {
          columns: [],
          rows: [],
          affectedRows: prevCount,
          executionTimeMs: Date.now() - startTime
        };
      }
    }

    return {
      columns: [],
      rows: [],
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Compares two branches and outputs schema and row count diffs.
   */
  public diffBranches(baseBranchId: string, compareBranchId: string): BranchDiff {
    const base = this.branches.get(baseBranchId) || this.getActiveBranch();
    const compare = this.branches.get(compareBranchId);

    if (!compare) {
      return {
        baseBranchId: base.id,
        compareBranchId,
        schemaChanges: [],
        dataChanges: [],
        hasModifications: false
      };
    }

    const schemaChanges: SchemaChangeDiff[] = [];
    const dataChanges: DataChangeDiff[] = [];

    // Compare Tables
    const baseTableNames = Object.keys(base.tables);
    const compareTableNames = Object.keys(compare.tables);

    // Added tables
    compareTableNames.forEach(tName => {
      if (!base.tables[tName]) {
        schemaChanges.push({
          type: 'TABLE_ADDED',
          tableName: tName,
          details: `Table '${tName}' with ${compare.tables[tName].columns.length} columns added in ${compare.name}`
        });
      } else {
        // Compare columns in existing tables
        const baseCols = new Set(base.tables[tName].columns.map(c => c.name));
        const compareCols = new Set(compare.tables[tName].columns.map(c => c.name));

        compare.tables[tName].columns.forEach(col => {
          if (!baseCols.has(col.name)) {
            schemaChanges.push({
              type: 'COLUMN_ADDED',
              tableName: tName,
              columnName: col.name,
              details: `Column '${col.name}' (${col.type}) added to table '${tName}'`
            });
          }
        });

        base.tables[tName].columns.forEach(col => {
          if (!compareCols.has(col.name)) {
            schemaChanges.push({
              type: 'COLUMN_DROPPED',
              tableName: tName,
              columnName: col.name,
              details: `Column '${col.name}' dropped from table '${tName}'`
            });
          }
        });
      }
    });

    // Dropped tables
    baseTableNames.forEach(tName => {
      if (!compare.tables[tName]) {
        schemaChanges.push({
          type: 'TABLE_DROPPED',
          tableName: tName,
          details: `Table '${tName}' dropped in ${compare.name}`
        });
      }
    });

    // Compare Row Counts
    const allTables = Array.from(new Set([...baseTableNames, ...compareTableNames]));
    allTables.forEach(tName => {
      const baseCount = base.data[tName]?.length || 0;
      const compareCount = compare.data[tName]?.length || 0;
      const delta = compareCount - baseCount;

      if (delta !== 0 || !base.tables[tName] || !compare.tables[tName]) {
        dataChanges.push({
          tableName: tName,
          baseRowCount: baseCount,
          compareRowCount: compareCount,
          delta
        });
      }
    });

    const hasModifications = schemaChanges.length > 0 || dataChanges.some(d => d.delta !== 0);

    return {
      baseBranchId: base.id,
      compareBranchId: compare.id,
      schemaChanges,
      dataChanges,
      hasModifications
    };
  }

  /**
   * Merges an approved branch into a target branch (e.g. merging sandbox into main).
   */
  public mergeBranch(sourceBranchId: string, targetBranchId: string = 'main'): {
    success: boolean;
    mergedChanges: number;
    message: string;
  } {
    const source = this.branches.get(sourceBranchId);
    const target = this.branches.get(targetBranchId);

    if (!source || !target) {
      return { success: false, mergedChanges: 0, message: 'Source or target branch not found.' };
    }

    const diff = this.diffBranches(target.id, source.id);
    if (!diff.hasModifications) {
      return { success: true, mergedChanges: 0, message: 'Branches are identical. No modifications to merge.' };
    }

    // Apply clone from source to target
    target.tables = JSON.parse(JSON.stringify(source.tables));
    target.data = JSON.parse(JSON.stringify(source.data));

    this.notify();

    return {
      success: true,
      mergedChanges: diff.schemaChanges.length + diff.dataChanges.length,
      message: `Successfully merged '${source.name}' into '${target.name}' (${diff.schemaChanges.length} schema change(s), ${diff.dataChanges.length} data change(s)).`
    };
  }

  public deleteBranch(branchId: string): boolean {
    if (branchId === 'main') return false;
    const deleted = this.branches.delete(branchId);
    if (this.activeBranchId === branchId) {
      this.activeBranchId = 'main';
    }
    this.notify();
    return deleted;
  }
}

export const dbBranchManager = new DbBranchManager();
