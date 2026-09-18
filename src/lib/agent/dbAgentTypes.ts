/**
 * Strongly Typed Database Agent Tool Definitions & Contracts
 * Complete 12 Controlled Agent Tools suite per Vision Specification.
 */

import { IntrospectedTable, RealQueryResult } from '../db/sqlDriver';
import { RiskAssessment } from '../db/queryFirewall';
import { RollbackSnapshot } from '../db/transactionManager';

export type DbToolName = 
  | 'inspect_schema'
  | 'search_schema'
  | 'explain_query'
  | 'execute_query'
  | 'create_backup'
  | 'restore_backup'
  | 'inspect_indexes'
  | 'create_index'
  | 'inspect_statistics'
  | 'search_documentation'
  | 'inspect_logs'
  | 'generate_report'
  // Auxiliary tools
  | 'introspect_schema'
  | 'sample_table_data'
  | 'suggest_indexes'
  | 'generate_migration'
  | 'validate_syntax';

export interface InspectSchemaArgs {
  tableName?: string;
}

export interface SearchSchemaArgs {
  query: string;
}

export interface ExplainQueryArgs {
  sql: string;
}

export interface ExecuteQueryArgs {
  sql: string;
  dryRun?: boolean;
}

export interface CreateBackupArgs {
  backupName?: string;
}

export interface RestoreBackupArgs {
  backupId: string;
}

export interface InspectIndexesArgs {
  tableName: string;
}

export interface CreateIndexArgs {
  tableName: string;
  columns: string[];
  indexName?: string;
}

export interface InspectStatisticsArgs {
  slowOnly?: boolean;
}

export interface SearchDocumentationArgs {
  keyword: string;
}

export interface InspectLogsArgs {
  limit?: number;
}

export interface GenerateReportArgs {
  topic: string;
  metrics?: string[];
}

export interface SampleTableDataArgs {
  tableName: string;
  limit?: number;
}

export interface SuggestIndexesArgs {
  tableName: string;
  queryPattern?: string;
}

export interface GenerateMigrationArgs {
  changeDescription: string;
  targetTable?: string;
}

export interface ValidateSyntaxArgs {
  sql: string;
}

export type DbToolArgsMap = {
  inspect_schema: InspectSchemaArgs;
  search_schema: SearchSchemaArgs;
  explain_query: ExplainQueryArgs;
  execute_query: ExecuteQueryArgs;
  create_backup: CreateBackupArgs;
  restore_backup: RestoreBackupArgs;
  inspect_indexes: InspectIndexesArgs;
  create_index: CreateIndexArgs;
  inspect_statistics: InspectStatisticsArgs;
  search_documentation: SearchDocumentationArgs;
  inspect_logs: InspectLogsArgs;
  generate_report: GenerateReportArgs;
  // Auxiliary
  introspect_schema: InspectSchemaArgs;
  sample_table_data: SampleTableDataArgs;
  suggest_indexes: SuggestIndexesArgs;
  generate_migration: GenerateMigrationArgs;
  validate_syntax: ValidateSyntaxArgs;
};

export interface DbToolDefinition<TName extends DbToolName = DbToolName> {
  name: TName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export interface DbToolExecutionResult<T = any> {
  toolName: DbToolName;
  success: boolean;
  data: T;
  executionTimeMs: number;
  error?: string;
  riskAssessment?: RiskAssessment;
  snapshot?: RollbackSnapshot;
}
