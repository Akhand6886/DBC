/**
 * AI Schema Differ & Migration Generator Engine
 * Compares two database schemas and generates UP/DOWN SQL scripts with AI safety checks.
 */

import { IntrospectedTable } from './sqlDriver';

export interface SchemaSafetyWarning {
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  affectedTable: string;
}

export interface SchemaDiffResult {
  addedTables: string[];
  droppedTables: string[];
  addedColumns: { table: string; colName: string; type: string }[];
  upSql: string;
  downSql: string;
  safetyWarnings: SchemaSafetyWarning[];
}

export function computeSchemaDiff(
  sourceTables: IntrospectedTable[],
  targetTables: IntrospectedTable[]
): SchemaDiffResult {
  const sourceTableMap = new Map(sourceTables.map(t => [t.name, t]));
  const targetTableMap = new Map(targetTables.map(t => [t.name, t]));

  const addedTables: string[] = [];
  const droppedTables: string[] = [];
  const addedColumns: { table: string; colName: string; type: string }[] = [];
  const safetyWarnings: SchemaSafetyWarning[] = [];

  const upSqlLines: string[] = ['-- AI Generated UP Migration Script', '-- Executes schema changes forward', ''];
  const downSqlLines: string[] = ['-- AI Generated DOWN Migration Script', '-- Rollback changes safely', ''];

  // Detect Added Tables (present in target, missing in source)
  targetTables.forEach(tTable => {
    if (!sourceTableMap.has(tTable.name)) {
      addedTables.push(tTable.name);

      const colDefs = tTable.columns.map(c => `  ${c.name} ${c.type}${c.isPrimary ? ' PRIMARY KEY' : ''}`).join(',\n');
      upSqlLines.push(`CREATE TABLE ${tTable.name} (\n${colDefs}\n);`);
      downSqlLines.push(`DROP TABLE IF EXISTS ${tTable.name};`);
    } else {
      // Compare Columns for existing tables
      const sTable = sourceTableMap.get(tTable.name)!;
      const sColMap = new Map(sTable.columns.map(c => [c.name, c]));

      tTable.columns.forEach(tCol => {
        if (!sColMap.has(tCol.name)) {
          addedColumns.push({ table: tTable.name, colName: tCol.name, type: tCol.type });
          upSqlLines.push(`ALTER TABLE ${tTable.name} ADD COLUMN ${tCol.name} ${tCol.type};`);
          downSqlLines.push(`ALTER TABLE ${tTable.name} DROP COLUMN ${tCol.name};`);
        }
      });
    }
  });

  // Detect Dropped Tables (present in source, missing in target)
  sourceTables.forEach(sTable => {
    if (!targetTableMap.has(sTable.name)) {
      droppedTables.push(sTable.name);
      safetyWarnings.push({
        level: 'CRITICAL',
        message: `Dropping table '${sTable.name}' will permanently delete existing production data.`,
        affectedTable: sTable.name
      });

      upSqlLines.push(`DROP TABLE IF EXISTS ${sTable.name};`);
      const colDefs = sTable.columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
      downSqlLines.push(`CREATE TABLE ${sTable.name} (\n${colDefs}\n);`);
    }
  });

  // Default fallback if no changes
  if (addedTables.length === 0 && droppedTables.length === 0 && addedColumns.length === 0) {
    upSqlLines.push('-- Schemas are in sync. No migration needed.');
    downSqlLines.push('-- Schemas are in sync. No rollback needed.');
  }

  return {
    addedTables,
    droppedTables,
    addedColumns,
    upSql: upSqlLines.join('\n'),
    downSql: downSqlLines.join('\n'),
    safetyWarnings
  };
}
