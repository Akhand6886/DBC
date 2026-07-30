export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'cms';

export type UserRole = 'Admin' | 'Data Engineer' | 'Data Analyst' | 'Read-Only Viewer';

export type RoutePath = 'DETERMINISTIC_FAST_PATH' | 'LLM_REASONING_PATH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IntentAction = 'SELECT' | 'COUNT' | 'UPDATE' | 'DELETE' | 'INSERT' | 'SCHEMA_INSPECT' | 'ANALYTICAL';

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { table: string; column: string };
  isNullable?: boolean;
  description?: string;
}

export interface TableSchema {
  tableName: string;
  description: string;
  columns: ColumnDefinition[];
  rowCount: number;
}

export interface DatabaseMetadata {
  id: DatabaseType;
  name: string;
  version: string;
  engine: string;
  tables: TableSchema[];
}

export interface SemanticRelationship {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

export interface QueryIntent {
  action: IntentAction;
  targetTable: string;
  columns?: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: string;
  limit?: number;
  confidenceScore: number; // 0 - 100
  explanation: string;
}

export interface PreExecutionSnapshot {
  id: string;
  timestamp: string;
  dbType: DatabaseType;
  table: string;
  affectedRowCount: number;
  snapshotData: any[];
  status: 'ACTIVE' | 'ROLLED_BACK' | 'EXPIRED';
  queryText: string;
}

export interface ExecutionPlan {
  id: string;
  queryText: string;
  dbType: DatabaseType;
  user: string;
  userRole: UserRole;
  routePath: RoutePath;
  confidenceScore: number;
  cacheHit: boolean;
  parsedIntent?: QueryIntent;
  semanticJoinsApplied: string[];
  generatedQuery: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskReasons: string[];
  requiresApproval: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  snapshotId?: string;
  executionTimeMs: number;
  status: 'SUCCESS' | 'BLOCKED' | 'FAILED' | 'PENDING_APPROVAL';
  affectedRows?: number;
  resultData?: any[];
  error?: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: UserRole;
  dbType: DatabaseType;
  queryText: string;
  routePath: RoutePath;
  confidenceScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  action: IntentAction;
  status: 'SUCCESS' | 'BLOCKED' | 'ROLLED_BACK';
  executionTimeMs: number;
  generatedQuery: string;
  traceDetails: {
    cacheHit: boolean;
    joinsUsed: string[];
    snapshotTaken: boolean;
    snapshotId?: string;
  };
}

export interface SystemMetrics {
  totalQueries: number;
  fastPathQueries: number;
  llmQueries: number;
  cacheHits: number;
  avgFastPathLatencyMs: number;
  avgLlmLatencyMs: number;
  estimatedCostSavingsUSD: number;
  highRiskBlockedCount: number;
  activeSnapshotsCount: number;
}
