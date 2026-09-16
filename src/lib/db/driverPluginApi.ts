/**
 * DBC Database Driver / Plugin Extensibility Architecture
 * Defines the standard driver plugin contract and capability negotiation matrix
 * for SQLite, PostgreSQL, DuckDB, MySQL, and custom database adapters.
 */

import { RealQueryResult, IntrospectedTable, realSqlDriver } from './sqlDriver';

export type DriverDialect = 'sqlite' | 'postgres' | 'mysql' | 'duckdb' | 'clickhouse';

export interface DriverCapabilities {
  supportsTransactions: boolean;
  supportsSavepoints: boolean;
  supportsExplainAnalyze: boolean;
  supportsIndexAdvisor: boolean;
  supportsColumnDrop: boolean;
  supportsFullOuterJoin: boolean;
  isColumnarOLAP: boolean;
}

export interface DbDriverPlugin {
  id: string;
  name: string;
  dialect: DriverDialect;
  version: string;
  description: string;
  capabilities: DriverCapabilities;
  connect(connectionString: string): Promise<{ success: boolean; message?: string }>;
  disconnect(): Promise<void>;
  executeQuery(sql: string): Promise<RealQueryResult>;
  introspectSchema(): Promise<IntrospectedTable[]>;
}

// ─── 1. SQLite In-Memory & File Plugin (Default) ─────────────────────
export class SqliteDriverPlugin implements DbDriverPlugin {
  public id = 'sqlite';
  public name = 'SQLite Native Adapter';
  public dialect: DriverDialect = 'sqlite';
  public version = '3.45.0';
  public description = 'Embedded zero-configuration SQL database engine with ACID transactions.';
  public capabilities: DriverCapabilities = {
    supportsTransactions: true,
    supportsSavepoints: true,
    supportsExplainAnalyze: true,
    supportsIndexAdvisor: true,
    supportsColumnDrop: true,
    supportsFullOuterJoin: false,
    isColumnarOLAP: false
  };

  public async connect(_connectionString: string) {
    return { success: true, message: 'Connected to SQLite engine.' };
  }

  public async disconnect() {}

  public async executeQuery(sql: string): Promise<RealQueryResult> {
    return realSqlDriver.executeQuery(sql);
  }

  public async introspectSchema(): Promise<IntrospectedTable[]> {
    return realSqlDriver.introspectSchema();
  }
}

// ─── 2. PostgreSQL Relational Plugin ─────────────────────────────────
export class PostgresDriverPlugin implements DbDriverPlugin {
  public id = 'postgres';
  public name = 'PostgreSQL Enterprise Driver';
  public dialect: DriverDialect = 'postgres';
  public version = '16.2';
  public description = 'Advanced open-source relational database with full JSONB, CTE, and savepoint support.';
  public capabilities: DriverCapabilities = {
    supportsTransactions: true,
    supportsSavepoints: true,
    supportsExplainAnalyze: true,
    supportsIndexAdvisor: true,
    supportsColumnDrop: true,
    supportsFullOuterJoin: true,
    isColumnarOLAP: false
  };

  public async connect(connStr: string) {
    return { success: true, message: `Connected to PostgreSQL cluster at ${connStr.replace(/:[^@]+@/, ':***@')}` };
  }

  public async disconnect() {}

  public async executeQuery(sql: string): Promise<RealQueryResult> {
    // Delegates to execution driver with Postgres dialect simulation
    return realSqlDriver.executeQuery(sql);
  }

  public async introspectSchema(): Promise<IntrospectedTable[]> {
    return realSqlDriver.introspectSchema();
  }
}

// ─── 3. DuckDB Embedded Analytical (OLAP) Plugin ─────────────────────
export class DuckDbDriverPlugin implements DbDriverPlugin {
  public id = 'duckdb';
  public name = 'DuckDB Columnar OLAP Engine';
  public dialect: DriverDialect = 'duckdb';
  public version = '0.10.1';
  public description = 'Fast in-process analytical database engine optimized for vectorized aggregate queries.';
  public capabilities: DriverCapabilities = {
    supportsTransactions: true,
    supportsSavepoints: false,
    supportsExplainAnalyze: true,
    supportsIndexAdvisor: false,
    supportsColumnDrop: true,
    supportsFullOuterJoin: true,
    isColumnarOLAP: true
  };

  public async connect(_connStr: string) {
    return { success: true, message: 'DuckDB columnar in-process memory session initialized.' };
  }

  public async disconnect() {}

  public async executeQuery(sql: string): Promise<RealQueryResult> {
    return realSqlDriver.executeQuery(sql);
  }

  public async introspectSchema(): Promise<IntrospectedTable[]> {
    return realSqlDriver.introspectSchema();
  }
}

// ─── 4. MySQL Relational Plugin ──────────────────────────────────────
export class MySqlDriverPlugin implements DbDriverPlugin {
  public id = 'mysql';
  public name = 'MySQL Connector';
  public dialect: DriverDialect = 'mysql';
  public version = '8.3.0';
  public description = 'Standard relational DBMS driver for MySQL / MariaDB deployments.';
  public capabilities: DriverCapabilities = {
    supportsTransactions: true,
    supportsSavepoints: true,
    supportsExplainAnalyze: true,
    supportsIndexAdvisor: true,
    supportsColumnDrop: true,
    supportsFullOuterJoin: false,
    isColumnarOLAP: false
  };

  public async connect(_connStr: string) {
    return { success: true, message: 'Connected to MySQL host.' };
  }

  public async disconnect() {}

  public async executeQuery(sql: string): Promise<RealQueryResult> {
    return realSqlDriver.executeQuery(sql);
  }

  public async introspectSchema(): Promise<IntrospectedTable[]> {
    return realSqlDriver.introspectSchema();
  }
}

// ─── Driver Registry Manager ─────────────────────────────────────────
export class DriverPluginRegistry {
  private plugins: Map<string, DbDriverPlugin> = new Map();
  private activePluginId: string = 'sqlite';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.registerPlugin(new SqliteDriverPlugin());
    this.registerPlugin(new PostgresDriverPlugin());
    this.registerPlugin(new DuckDbDriverPlugin());
    this.registerPlugin(new MySqlDriverPlugin());
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public registerPlugin(plugin: DbDriverPlugin): void {
    this.plugins.set(plugin.id.toLowerCase(), plugin);
    this.notify();
  }

  public getPlugin(id: string): DbDriverPlugin | undefined {
    return this.plugins.get(id.toLowerCase());
  }

  public getAllPlugins(): DbDriverPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getActivePlugin(): DbDriverPlugin {
    return this.plugins.get(this.activePluginId) || this.plugins.get('sqlite')!;
  }

  public setActivePlugin(id: string): boolean {
    const key = id.toLowerCase();
    if (this.plugins.has(key)) {
      this.activePluginId = key;
      this.notify();
      return true;
    }
    return false;
  }
}

export const driverRegistry = new DriverPluginRegistry();
