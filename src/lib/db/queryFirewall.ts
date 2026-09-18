/**
 * DBC Query Firewall & Risk Evaluation Engine
 * Evaluates SQL queries and DDL/DML statements for structural risk,
 * blast radius, destructive patterns, and SQL injection vectors.
 */

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskCategory = 
  | 'READ_ONLY_SAFE' 
  | 'INDEXED_MUTATION' 
  | 'FULL_TABLE_SCAN' 
  | 'UNCONSTRAINED_DML' 
  | 'DESTRUCTIVE_DDL' 
  | 'SQL_INJECTION_RISK' 
  | 'SCHEMA_ALTERATION';

export interface BlastRadius {
  targetTables: string[];
  estimatedAffectedRows: number | 'ALL' | 'UNKNOWN';
  mutatesData: boolean;
  destroysSchema: boolean;
  reversible: boolean;
}

export interface RiskAssessment {
  query: string;
  score: number; // 0 to 100
  level: RiskLevel;
  category: RiskCategory;
  requiresApproval: boolean;
  isBlocked: boolean;
  violations: string[];
  warnings: string[];
  remediations: string[];
  blastRadius: BlastRadius;
  timestamp: string;
}

export interface FirewallConfig {
  strictProductionMode: boolean; // hard blocks CRITICAL queries
  approvalThreshold: RiskLevel; // queries >= this level trigger approval modal
  maxAllowedAffectedRowsWithoutWhere: number; // default 0
  enforceLimitOnSelect: boolean;
  maxDefaultLimit: number;
}

export const DEFAULT_FIREWALL_CONFIG: FirewallConfig = {
  strictProductionMode: false,
  approvalThreshold: 'HIGH',
  maxAllowedAffectedRowsWithoutWhere: 0,
  enforceLimitOnSelect: true,
  maxDefaultLimit: 100
};

export class QueryFirewallEngine {
  private config: FirewallConfig;

  constructor(config: Partial<FirewallConfig> = {}) {
    this.config = { ...DEFAULT_FIREWALL_CONFIG, ...config };
  }

  public setConfig(newConfig: Partial<FirewallConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): FirewallConfig {
    return { ...this.config };
  }

  /**
   * Evaluate a SQL query for risk, potential side-effects, and policy violations.
   */
  public evaluateQuery(
    sql: string,
    knownTables: string[] = [],
    tableRowCounts: Record<string, number> = {}
  ): RiskAssessment {
    const cleanSql = sql.trim();
    const violations: string[] = [];
    const warnings: string[] = [];
    const remediations: string[] = [];

    let score = 0;
    let category: RiskCategory = 'READ_ONLY_SAFE';
    let mutatesData = false;
    let destroysSchema = false;
    let reversible = true;
    let estimatedRows: number | 'ALL' | 'UNKNOWN' = 0;

    // Extract target tables
    const targetTables = this.extractTables(cleanSql, knownTables);

    // ─── 1. Critical Destructive DDL Checks ──────────────────────────────
    if (/^DROP\s+DATABASE\b/i.test(cleanSql)) {
      score = 100;
      category = 'DESTRUCTIVE_DDL';
      destroysSchema = true;
      reversible = false;
      violations.push('Direct DROP DATABASE detected. Catastrophic data destruction.');
      remediations.push('Verify environment. Databases cannot be dropped via agent or interactive query editor.');
    } else if (/^DROP\s+TABLE\b/i.test(cleanSql)) {
      score = 95;
      category = 'DESTRUCTIVE_DDL';
      destroysSchema = true;
      reversible = false;
      violations.push(`Irreversible DROP TABLE statement on target: [${targetTables.join(', ') || 'unspecified'}]`);
      remediations.push('Consider schema deprecation or renaming with _deprecated suffix instead of immediate drop.');
    } else if (/^TRUNCATE\s+(?:TABLE\s+)?/i.test(cleanSql)) {
      score = 90;
      category = 'DESTRUCTIVE_DDL';
      mutatesData = true;
      destroysSchema = false;
      reversible = false;
      estimatedRows = 'ALL';
      violations.push(`TRUNCATE removes all table data without triggering standard transactional row-level rollback.`);
      remediations.push('Use DELETE FROM with a specific WHERE condition and transaction savepoint.');
    } else if (/ALTER\s+TABLE\s+[a-zA-Z0-9_]+\s+DROP\s+COLUMN\b/i.test(cleanSql)) {
      score = 85;
      category = 'SCHEMA_ALTERATION';
      destroysSchema = true;
      reversible = false;
      violations.push('DROP COLUMN will permanently erase column data and invalidate dependent queries/views.');
      remediations.push('Perform two-phase migration: stop writing to column before dropping in database.');
    }

    // ─── 2. Unconstrained or Tautological DML ────────────────────────────
    if (/^DELETE\s+FROM\b/i.test(cleanSql)) {
      mutatesData = true;
      const hasWhere = /\bWHERE\b/i.test(cleanSql);
      if (!hasWhere) {
        score = Math.max(score, 95);
        category = 'UNCONSTRAINED_DML';
        estimatedRows = 'ALL';
        violations.push('⚠ BLOCKED: No WHERE clause detected. Potential impact: All rows in target table.');
        remediations.push('Add an explicit filtering condition (e.g. WHERE status = "inactive" or WHERE id = ?).');
      } else {
        // Check for tautological where like WHERE 1=1 or WHERE 'a'='a'
        const whereClauseMatch = cleanSql.match(/\bWHERE\s+([\s\S]+?)(?:;|\s*$)/i);
        const whereClause = whereClauseMatch ? whereClauseMatch[1].trim() : '';
        if (this.isTautology(whereClause)) {
          score = Math.max(score, 88);
          category = 'UNCONSTRAINED_DML';
          estimatedRows = 'ALL';
          violations.push(`Tautological condition detected in WHERE clause ("${whereClause}"). Affects all rows.`);
          remediations.push('Remove tautological true statement and specify targeted criteria.');
        } else {
          score = Math.max(score, 75); // DELETE with WHERE is HIGH risk per vision
          category = 'INDEXED_MUTATION';
          estimatedRows = this.estimateAffectedRows(targetTables, tableRowCounts);
        }
      }
    }

    if (/^UPDATE\s+[a-zA-Z0-9_]+\s+SET\b/i.test(cleanSql)) {
      mutatesData = true;
      const hasWhere = /\bWHERE\b/i.test(cleanSql);
      if (!hasWhere) {
        score = Math.max(score, 85);
        category = 'UNCONSTRAINED_DML';
        estimatedRows = 'ALL';
        violations.push('UPDATE statement without a WHERE clause will overwrite EVERY row in the target table.');
        remediations.push('Specify target primary key or filtering condition in WHERE clause.');
      } else {
        const whereClauseMatch = cleanSql.match(/\bWHERE\s+([\s\S]+?)(?:;|\s*$)/i);
        const whereClause = whereClauseMatch ? whereClauseMatch[1].trim() : '';
        if (this.isTautology(whereClause)) {
          score = Math.max(score, 78);
          category = 'UNCONSTRAINED_DML';
          estimatedRows = 'ALL';
          violations.push(`Tautological condition detected in UPDATE WHERE clause ("${whereClause}").`);
          remediations.push('Target specific records rather than applying blanket update.');
        } else {
          score = Math.max(score, 55); // UPDATE is MEDIUM/HIGH risk
          category = 'INDEXED_MUTATION';
          estimatedRows = this.estimateAffectedRows(targetTables, tableRowCounts);
        }
      }
    }

    // ─── 3. SQL Injection Vector Heuristics ──────────────────────────────
    if (/;\s*(DROP|DELETE|TRUNCATE|ALTER|UPDATE|INSERT)\b/i.test(cleanSql)) {
      score = Math.max(score, 85);
      category = 'SQL_INJECTION_RISK';
      violations.push('Stacked / multiple SQL statements detected in single query execution.');
      remediations.push('Execute one statement per execution payload to avoid stacked SQL injection.');
    }

    if (/--\s*$/m.test(cleanSql) || /\/\*[\s\S]*?\*\//.test(cleanSql)) {
      warnings.push('Inline comment delimiter detected. Ensure comment is not neutralizing critical clauses.');
    }

    // ─── 4. Query Performance & Blast Radius (SELECT) ───────────────────
    if (/^SELECT\b/i.test(cleanSql)) {
      category = 'READ_ONLY_SAFE';
      mutatesData = false;
      destroysSchema = false;

      const hasLimit = /\bLIMIT\s+\d+\b/i.test(cleanSql);
      const isCount = /SELECT\s+COUNT\s*\(/i.test(cleanSql);

      if (!hasLimit && !isCount) {
        score = Math.max(score, 25);
        category = 'FULL_TABLE_SCAN';
        warnings.push('Possible full-table scan detected. Query has no LIMIT or index partition filter.');
        remediations.push('1. Add LIMIT (e.g. LIMIT 100)');
        remediations.push('2. Add filtering condition (WHERE column = ?)');
        remediations.push('3. Run EXPLAIN to inspect query plan cost');
        remediations.push('4. Execute anyway');
      }

      // Check for Cartesian cross join
      if (/\bCROSS\s+JOIN\b/i.test(cleanSql) || /FROM\s+[a-zA-Z0-9_]+\s*,\s*[a-zA-Z0-9_]+/i.test(cleanSql)) {
        score = Math.max(score, 45);
        category = 'FULL_TABLE_SCAN';
        warnings.push('Potential Cartesian Cross Join detected. May produce exponential row combinations.');
        remediations.push('Use explicit INNER/LEFT JOIN with ON condition.');
      }
    }

    // ─── 5. Standard Safe Operations ────────────────────────────────────
    if (/^EXPLAIN\b/i.test(cleanSql) || /^DESCRIBE\b/i.test(cleanSql) || /^SHOW\b/i.test(cleanSql)) {
      score = 0;
      category = 'READ_ONLY_SAFE';
    }

    if (/^INSERT\s+INTO\b/i.test(cleanSql)) {
      mutatesData = true;
      score = Math.max(score, 15);
      category = 'INDEXED_MUTATION';
      estimatedRows = 1;
    }

    if (/^CREATE\s+(TABLE|INDEX|VIEW)\b/i.test(cleanSql)) {
      score = Math.max(score, 20);
      category = 'SCHEMA_ALTERATION';
      destroysSchema = false;
      reversible = true;
    }

    // Determine Risk Level
    const level = this.getRiskLevel(score);
    const requiresApproval = this.isApprovalRequired(level);
    const isUnconstrainedDelete = /^DELETE\s+FROM\b/i.test(cleanSql) && !/\bWHERE\b/i.test(cleanSql);
    const isBlocked = (this.config.strictProductionMode && level === 'CRITICAL') || isUnconstrainedDelete;

    return {
      query: cleanSql,
      score,
      level,
      category,
      requiresApproval,
      isBlocked,
      violations,
      warnings,
      remediations,
      blastRadius: {
        targetTables,
        estimatedAffectedRows: estimatedRows,
        mutatesData,
        destroysSchema,
        reversible
      },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 90) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 10) return 'LOW';
    return 'SAFE';
  }

  private isApprovalRequired(level: RiskLevel): boolean {
    const priority: Record<RiskLevel, number> = {
      SAFE: 0,
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };
    return priority[level] >= priority[this.config.approvalThreshold];
  }

  private isTautology(clause: string): boolean {
    if (!clause) return false;
    const normalized = clause.replace(/\s+/g, ' ').trim().toLowerCase();
    return (
      normalized === '1=1' ||
      normalized === '1 = 1' ||
      normalized === 'true' ||
      normalized === "'1'='1'" ||
      normalized === '"1"="1"' ||
      normalized === '0=0' ||
      /\b1\s*=\s*1\b/.test(normalized) ||
      /\btrue\s*=\s*true\b/.test(normalized)
    );
  }

  private extractTables(sql: string, knownTables: string[]): string[] {
    const tables = new Set<string>();

    // FROM / JOIN / UPDATE / INTO / TABLE extraction
    const fromMatches = Array.from(sql.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+([a-zA-Z0-9_]+)/gi));
    for (const match of fromMatches) {
      if (match[1]) {
        tables.add(match[1].toLowerCase());
      }
    }

    // Also match known tables
    for (const kt of knownTables) {
      const regex = new RegExp(`\\b${kt}\\b`, 'i');
      if (regex.test(sql)) {
        tables.add(kt.toLowerCase());
      }
    }

    return Array.from(tables);
  }

  private estimateAffectedRows(
    targetTables: string[],
    tableRowCounts: Record<string, number>
  ): number | 'UNKNOWN' {
    if (targetTables.length === 0) return 'UNKNOWN';
    const firstTable = targetTables[0];
    const total = tableRowCounts[firstTable];
    if (typeof total === 'number') {
      // Conservative estimate for filtered operations: ~10% or at least 1
      return Math.max(1, Math.floor(total * 0.1));
    }
    return 'UNKNOWN';
  }
}

export const queryFirewall = new QueryFirewallEngine();
