import { SEMANTIC_RELATIONSHIPS } from '../db/initialData';

export interface AutoJoinResult {
  joinedTable?: string;
  joinCondition?: string;
  joinDescription?: string;
}

export function resolveSemanticJoins(targetTable: string, queryText: string): AutoJoinResult {
  const text = queryText.toLowerCase();

  // Search relationships involving the target table
  for (const rel of SEMANTIC_RELATIONSHIPS) {
    if (rel.sourceTable === targetTable) {
      if (text.includes(rel.targetTable) || text.includes(rel.targetTable.slice(0, -1))) {
        return {
          joinedTable: rel.targetTable,
          joinCondition: `${rel.sourceTable}.${rel.sourceColumn} = ${rel.targetTable}.${rel.targetColumn}`,
          joinDescription: `Deterministic FK Graph Join: ${rel.sourceTable}.${rel.sourceColumn} → ${rel.targetTable}.${rel.targetColumn}`
        };
      }
    } else if (rel.targetTable === targetTable) {
      if (text.includes(rel.sourceTable) || text.includes(rel.sourceTable.slice(0, -1))) {
        return {
          joinedTable: rel.sourceTable,
          joinCondition: `${rel.sourceTable}.${rel.sourceColumn} = ${rel.targetTable}.${rel.targetColumn}`,
          joinDescription: `Deterministic Inverse FK Join: ${rel.targetTable}.${rel.targetColumn} ← ${rel.sourceTable}.${rel.sourceColumn}`
        };
      }
    }
  }

  return {};
}
