import { QueryIntent, IntentAction } from '../types';
import { INITIAL_DATABASES } from '../db/initialData';

export function classifyIntent(queryText: string, dbType: string): QueryIntent {
  const text = queryText.trim().toLowerCase();
  const dbMeta = INITIAL_DATABASES[dbType] || INITIAL_DATABASES.postgresql;
  const availableTables = dbMeta.tables.map(t => t.tableName.toLowerCase());

  // Detect target table
  let targetTable = availableTables[0] || 'customers';
  for (const table of availableTables) {
    if (text.includes(table) || text.includes(table.slice(0, -1))) {
      targetTable = table;
      break;
    }
  }

  // 1. Analytical & Ambiguous Queries -> Route to LLM (Low confidence for fast-path)
  if (text.includes('why') || text.includes('analyze') || text.includes('forecast') || text.includes('explain') || text.includes('growth') || text.includes('recommend') || text.includes('decline') || text.includes('trend')) {
    return {
      action: 'ANALYTICAL',
      targetTable,
      confidenceScore: 35, // Below fast-path threshold (< 75)
      explanation: 'Compound analytical reasoning requested. Escalated to LLM Reasoning Engine.'
    };
  }

  // 2. Destructive Operations -> High Risk (Escalate or Require Approval)
  if (text.startsWith('delete') || text.includes('delete from') || text.includes('drop table') || text.includes('remove all') || text.includes('truncate')) {
    return {
      action: 'DELETE',
      targetTable,
      confidenceScore: 92,
      explanation: 'Destructive deletion intent identified. High-risk guardrail triggered.'
    };
  }

  if (text.startsWith('update') || text.includes('set ') || text.includes('modify')) {
    return {
      action: 'UPDATE',
      targetTable,
      confidenceScore: 88,
      explanation: 'Data modification intent identified.'
    };
  }

  // 3. Count Operations -> Deterministic Fast-Path
  if (text.startsWith('count') || text.includes('how many') || text.includes('total number of')) {
    return {
      action: 'COUNT',
      targetTable,
      confidenceScore: 96,
      explanation: 'Matched rule-based template: Aggregate Count.'
    };
  }

  // 4. Schema Inspection -> Deterministic Fast-Path
  if (text.includes('schema') || text.includes('columns') || text.includes('table structure') || text.includes('describe')) {
    return {
      action: 'SCHEMA_INSPECT',
      targetTable,
      confidenceScore: 99,
      explanation: 'Matched rule-based template: Schema Metadata Inspection.'
    };
  }

  // 5. Select / Filter / Show -> Deterministic Fast-Path
  if (text.startsWith('show') || text.startsWith('list') || text.startsWith('find') || text.startsWith('get') || text.includes('select') || text.includes('top')) {
    // Extract filter heuristics
    const filters: Record<string, any> = {};
    if (text.includes('active')) filters['status'] = 'active';
    if (text.includes('inactive')) filters['status'] = 'inactive';
    if (text.includes('pending')) filters['status'] = 'pending';
    if (text.includes('completed')) filters['status'] = 'completed';
    if (text.includes('vip')) filters['tier'] = 'VIP';
    if (text.includes('platinum')) filters['tier'] = 'Platinum';

    return {
      action: 'SELECT',
      targetTable,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      confidenceScore: 94,
      explanation: 'Matched rule-based template: Deterministic SELECT & Semantic Join.'
    };
  }

  // Fallback for unclassified phrasing -> Moderate/Low confidence (Escalates to LLM)
  return {
    action: 'SELECT',
    targetTable,
    confidenceScore: 62,
    explanation: 'Unrecognized phrase pattern. Escalated to LLM Reasoning Engine for intent resolution.'
  };
}
