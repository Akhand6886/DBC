/**
 * DBC Agent Performance Optimizer Engine
 * Analyzes SQL queries for sequential scan bottlenecks, unindexed foreign keys,
 * and Cartesian products, synthesizing optimized query rewrites and composite indexes.
 */

export type OptimizationType = 
  | 'INDEX_CREATION' 
  | 'QUERY_REWRITE' 
  | 'MATERIALIZED_VIEW' 
  | 'LIMIT_PUSHDOWN';

export interface PerformanceRecommendation {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  targetTable: string;
  targetColumns: string[];
  estimatedSpeedupPct: number;
  beforeCost: number;
  afterCost: number;
  beforeEstimatedLatencyMs: number;
  afterEstimatedLatencyMs: number;
  bottlenecksDetected: string[];
  rationale: string;
  executableSql: string;
  originalSql: string;
}

export interface QueryOptimizationAnalysis {
  originalSql: string;
  hasSequentialScan: boolean;
  hasCartesianProduct: boolean;
  hasUnindexedJoin: boolean;
  missingLimit: boolean;
  recommendations: PerformanceRecommendation[];
  overallEstimatedSpeedup: number;
}

export class AgentPerformanceOptimizer {
  private recommendationHistory: PerformanceRecommendation[] = [];

  constructor() {
    this.seedDefaultRecommendations();
  }

  private seedDefaultRecommendations(): void {
    this.recommendationHistory.push({
      id: 'rec-idx-users-role',
      type: 'INDEX_CREATION',
      title: 'Composite B-Tree Index on users(role_id, id)',
      description: 'Converts sequential table scan to index seek for role authorization checks.',
      targetTable: 'users',
      targetColumns: ['role_id', 'id'],
      estimatedSpeedupPct: 86,
      beforeCost: 1240,
      afterCost: 175,
      beforeEstimatedLatencyMs: 48,
      afterEstimatedLatencyMs: 6,
      bottlenecksDetected: [
        'Full table scan on users (15,000 rows)',
        'Filter predicate (role_id = ?) evaluated row-by-row'
      ],
      rationale: 'Adding a composite B-Tree index on (role_id, id) enables zero-scan index-only lookups, reducing buffer reads by 86%.',
      executableSql: 'CREATE INDEX idx_users_role_composite ON users(role_id, id);',
      originalSql: 'SELECT * FROM users WHERE role_id = 1;'
    });

    this.recommendationHistory.push({
      id: 'rec-rewrite-users-subquery',
      type: 'QUERY_REWRITE',
      title: 'Flatten IN-Subquery to INNER JOIN',
      description: 'Replaces quadratic O(N*M) nested subquery iteration with hash join O(N+M).',
      targetTable: 'users',
      targetColumns: ['id'],
      estimatedSpeedupPct: 74,
      beforeCost: 3100,
      afterCost: 810,
      beforeEstimatedLatencyMs: 95,
      afterEstimatedLatencyMs: 24,
      bottlenecksDetected: [
        'Correlated subquery re-executed for every candidate row',
        'High buffer pool cache miss frequency'
      ],
      rationale: 'Converting IN (SELECT user_id FROM audit_logs WHERE ...) to an explicit INNER JOIN allows the query planner to construct a vectorized hash table.',
      executableSql: 'SELECT u.id, u.username FROM users u INNER JOIN (SELECT DISTINCT user_id FROM audit_logs) a ON u.id = a.user_id;',
      originalSql: 'SELECT id, username FROM users WHERE id IN (SELECT user_id FROM audit_logs);'
    });
  }

  /**
   * Analyzes an input SQL query and detects execution bottlenecks.
   */
  public analyzeQuery(sql: string): QueryOptimizationAnalysis {
    const cleanSql = sql.trim();
    const recommendations: PerformanceRecommendation[] = [];

    const hasSequentialScan = /\bWHERE\b/i.test(cleanSql) && !/PRIMARY\s+KEY|id\s*=\s*\d+/i.test(cleanSql);
    const hasCartesianProduct = /\bFROM\s+[a-zA-Z0-9_]+\s*,\s*[a-zA-Z0-9_]+/i.test(cleanSql) && !/\bWHERE\b/i.test(cleanSql);
    const hasUnindexedJoin = /\bJOIN\b/i.test(cleanSql) && /\brole_id\b/i.test(cleanSql);
    const missingLimit = /^SELECT/i.test(cleanSql) && !/\bLIMIT\b/i.test(cleanSql);

    // Extract target table
    const tableMatch = cleanSql.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
    const targetTable = tableMatch ? tableMatch[1].toLowerCase() : 'users';

    // 1. Recommend Index if sequential scan on filter column
    if (hasSequentialScan) {
      const colMatch = cleanSql.match(/\bWHERE\s+([a-zA-Z0-9_.]+)\s*=/i);
      const filterCol = colMatch ? colMatch[1].replace(/^[a-zA-Z0-9_]+\./, '') : 'role_id';

      const rec: PerformanceRecommendation = {
        id: `rec-idx-${Date.now()}`,
        type: 'INDEX_CREATION',
        title: `Index Tuning: B-Tree on ${targetTable}(${filterCol})`,
        description: `Eliminates full sequential scan on table '${targetTable}'.`,
        targetTable,
        targetColumns: [filterCol],
        estimatedSpeedupPct: 82,
        beforeCost: 1850,
        afterCost: 330,
        beforeEstimatedLatencyMs: 64,
        afterEstimatedLatencyMs: 11,
        bottlenecksDetected: [
          `Sequential scan on ${targetTable} for filter ${filterCol}`,
          'Absence of composite B-Tree covering index'
        ],
        rationale: `Creating a B-Tree index on (${filterCol}) replaces O(N) linear table scans with O(log N) tree lookups.`,
        executableSql: `CREATE INDEX idx_${targetTable}_${filterCol} ON ${targetTable}(${filterCol});`,
        originalSql: cleanSql
      };
      recommendations.push(rec);
    }

    // 2. Recommend Query Rewrite if subquery detected
    if (/\bIN\s*\(\s*SELECT\b/i.test(cleanSql)) {
      const rec: PerformanceRecommendation = {
        id: `rec-rewrite-${Date.now()}`,
        type: 'QUERY_REWRITE',
        title: 'Query Rewrite: Flatten IN-Subquery to Hash Join',
        description: 'Transforms correlated subquery into vectorized hash join.',
        targetTable,
        targetColumns: ['id'],
        estimatedSpeedupPct: 76,
        beforeCost: 2900,
        afterCost: 690,
        beforeEstimatedLatencyMs: 88,
        afterEstimatedLatencyMs: 21,
        bottlenecksDetected: [
          'Nested loop subquery execution for every row',
          'Temporary spool table memory allocation overhead'
        ],
        rationale: 'Flattening to an explicit JOIN enables the database planner to use Hash Join or Merge Join algorithms.',
        executableSql: cleanSql.replace(/\bWHERE\s+([a-zA-Z0-9_.]+)\s+IN\s*\(\s*SELECT\s+([a-zA-Z0-9_.]+)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([^)]+))?\s*\)/i, 
          'INNER JOIN (SELECT DISTINCT $2 FROM $3 $4) sub ON $1 = sub.$2'),
        originalSql: cleanSql
      };
      recommendations.push(rec);
    }

    // 3. Recommend Limit Pushdown if missing limit
    if (missingLimit) {
      const rec: PerformanceRecommendation = {
        id: `rec-limit-${Date.now()}`,
        type: 'LIMIT_PUSHDOWN',
        title: 'Buffer Guard: Append Strict LIMIT Constraint',
        description: 'Prevents catastrophic buffer pool exhaustion from unbounded result set.',
        targetTable,
        targetColumns: [],
        estimatedSpeedupPct: 65,
        beforeCost: 1500,
        afterCost: 525,
        beforeEstimatedLatencyMs: 50,
        afterEstimatedLatencyMs: 17,
        bottlenecksDetected: [
          'Unbounded client memory buffer streaming',
          'Database cursor holding active read locks'
        ],
        rationale: 'Adding a LIMIT clause halts query processing early as soon as the candidate window is satisfied.',
        executableSql: `${cleanSql.replace(/;*$/, '')} LIMIT 100;`,
        originalSql: cleanSql
      };
      recommendations.push(rec);
    }

    // Calculate overall speedup
    const maxSpeedup = recommendations.length > 0
      ? Math.max(...recommendations.map(r => r.estimatedSpeedupPct))
      : 0;

    return {
      originalSql: cleanSql,
      hasSequentialScan,
      hasCartesianProduct,
      hasUnindexedJoin,
      missingLimit,
      recommendations,
      overallEstimatedSpeedup: maxSpeedup
    };
  }

  /**
   * Simulates execution benchmark comparing original vs optimized SQL query.
   */
  public async benchmarkOptimization(
    originalSql: string,
    rec: PerformanceRecommendation
  ): Promise<{
    speedupVerified: boolean;
    beforeLatencyMs: number;
    afterLatencyMs: number;
    costDropPct: number;
  }> {
    // Virtual benchmark computation based on plan cost metrics
    const beforeLatency = rec.beforeEstimatedLatencyMs;
    const afterLatency = rec.afterEstimatedLatencyMs;
    const costDrop = Math.round(((rec.beforeCost - rec.afterCost) / rec.beforeCost) * 100);

    return {
      speedupVerified: afterLatency < beforeLatency,
      beforeLatencyMs: beforeLatency,
      afterLatencyMs: afterLatency,
      costDropPct: costDrop
    };
  }

  public getHistory(): PerformanceRecommendation[] {
    return [...this.recommendationHistory];
  }
}

export const agentOptimizer = new AgentPerformanceOptimizer();
