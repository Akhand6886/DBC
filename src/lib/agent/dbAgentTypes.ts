/**
 * Strongly Typed Database Agent Tool Definitions & Contracts
 */

import { IntrospectedTable, RealQueryResult } from '../db/sqlDriver';
import { RiskAssessment } from '../db/queryFirewall';
import { RollbackSnapshot } from '../db/transactionManager';

export type DbToolName = 
  | 'introspect_schema'
  | 'sample_table_data'
  | 'execute_query'
  | 'explain_query'
  | 'suggest_indexes'
  | 'generate_migration'
  | 'validate_syntax';

export interface IntrospectSchemaArgs {
  tableName?: string;
}

export interface SampleTableDataArgs {
  tableName: string;
  limit?: number;
}

export interface ExecuteQueryArgs {
  sql: string;
  dryRun?: boolean;
}

export interface ExplainQueryArgs {
  sql: string;
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
  introspect_schema: IntrospectSchemaArgs;
  sample_table_data: SampleTableDataArgs;
  execute_query: ExecuteQueryArgs;
  explain_query: ExplainQueryArgs;
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
