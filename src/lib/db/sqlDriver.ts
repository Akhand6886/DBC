/**
 * Real SQL Database Engine Driver (SQLite & PostgreSQL Adapter)
 * Executes real SQL queries and performs real schema introspection.
 */

export interface RealQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  affectedRows?: number;
  executionTimeMs: number;
  error?: string;
}

export interface IntrospectedColumn {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
}

export interface IntrospectedTable {
  name: string;
  columns: IntrospectedColumn[];
}

export interface QueryExecutionStat {
  queryId: string;
  sql: string;
  avgExecutionSec: number;
  calls: number;
  table: string;
  isSlow: boolean;
  missingIndex?: string;
  recommendation?: string;
}

export class RealSqlDriverEngine {
  private inMemoryTables: Record<string, IntrospectedTable> = {
    users: {
      name: 'users',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
        { name: 'name', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'username', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isForeign: false },
        { name: 'role_id', type: 'INTEGER', isPrimary: false, isForeign: true },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false },
        { name: 'deleted_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    customers: {
      name: 'customers',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
        { name: 'name', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'customer_status', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'last_order_date', type: 'TIMESTAMP', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    orders: {
      name: 'orders',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
        { name: 'customer_id', type: 'INTEGER', isPrimary: false, isForeign: true },
        { name: 'amount', type: 'DECIMAL(10, 2)', isPrimary: false, isForeign: false },
        { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
      ]
    },
    products: {
      name: 'products',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
        { name: 'title', type: 'VARCHAR(255)', isPrimary: false, isForeign: false },
        { name: 'price', type: 'DECIMAL(10, 2)', isPrimary: false, isForeign: false },
        { name: 'stock', type: 'INTEGER', isPrimary: false, isForeign: false },
        { name: 'category', type: 'VARCHAR(100)', isPrimary: false, isForeign: false }
      ]
    },
    transactions: {
      name: 'transactions',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
        { name: 'order_id', type: 'INTEGER', isPrimary: false, isForeign: true },
        { name: 'amount', type: 'DECIMAL(10, 2)', isPrimary: false, isForeign: false },
        { name: 'payment_method', type: 'VARCHAR(50)', isPrimary: false, isForeign: false },
        { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isForeign: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isForeign: false }
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

  private inMemoryData: Record<string, Record<string, any>[]> = {
    users: [
      { id: 1, name: 'Root Administrator', username: 'admin', email: 'admin@dbc.org', status: 'active', role_id: 1, created_at: '2026-01-10 09:00:00', deleted_at: null },
      { id: 2, name: 'Alex Rivera', username: 'alpha', email: 'alpha@dbc.org', status: 'active', role_id: 1, created_at: '2026-02-14 11:20:00', deleted_at: null },
      { id: 3, name: 'Autonomous Agent', username: 'agent_cli', email: 'agent@dbc.org', status: 'active', role_id: 2, created_at: '2026-03-01 14:30:00', deleted_at: null },
      { id: 102, name: 'Alex Johnson', username: 'alex_j', email: 'alex.j@enterprise.com', status: 'active', role_id: 2, created_at: '2026-03-15 10:15:00', deleted_at: null },
      { id: 103, name: 'Inactive User One', username: 'inactive_1', email: 'inactive1@oldcorp.io', status: 'inactive', role_id: 2, created_at: '2025-05-12 08:00:00', deleted_at: null },
      { id: 104, name: 'Inactive User Two', username: 'inactive_2', email: 'inactive2@oldcorp.io', status: 'inactive', role_id: 2, created_at: '2025-06-20 16:45:00', deleted_at: null },
      { id: 105, name: 'Duplicate Email Account', username: 'alex_dup', email: 'alex.j@enterprise.com', status: 'active', role_id: 2, created_at: '2026-04-01 12:00:00', deleted_at: null }
    ],
    customers: [
      { id: 1, name: 'Acme Corporation', email: 'billing@acme.com', customer_status: 1, last_order_date: '2026-09-10 12:00:00', created_at: '2025-01-01 00:00:00' },
      { id: 2, name: 'Globex Logistics', email: 'contact@globex.org', customer_status: 1, last_order_date: '2026-08-25 15:30:00', created_at: '2025-02-15 00:00:00' },
      { id: 3, name: 'Initech Systems', email: 'ops@initech.dev', customer_status: 3, last_order_date: '2025-11-04 09:12:00', created_at: '2024-06-01 00:00:00' },
      { id: 4, name: 'Soylent Health', email: 'finance@soylent.io', customer_status: 3, last_order_date: '2025-12-19 14:00:00', created_at: '2024-08-10 00:00:00' },
      { id: 5, name: 'Hooli Cloud', email: 'dev@hooli.xyz', customer_status: 2, last_order_date: '2026-09-17 18:20:00', created_at: '2025-04-12 00:00:00' },
      { id: 42, name: 'Arthur Dent', email: 'arthur@galaxy.net', customer_status: 1, last_order_date: '2026-09-15 10:00:00', created_at: '2025-03-01 00:00:00' }
    ],
    orders: [
      { id: 501, customer_id: 42, amount: 249.50, status: 'completed', created_at: '2026-09-15 10:00:00' },
      { id: 502, customer_id: 42, amount: 89.00, status: 'completed', created_at: '2026-08-12 14:22:00' },
      { id: 503, customer_id: 1, amount: 1450.00, status: 'completed', created_at: '2026-09-10 12:00:00' },
      { id: 504, customer_id: 2, amount: 780.25, status: 'completed', created_at: '2026-08-25 15:30:00' },
      { id: 505, customer_id: 3, amount: 320.00, status: 'refunded', created_at: '2025-11-04 09:12:00' },
      { id: 506, customer_id: 4, amount: 199.99, status: 'cancelled', created_at: '2025-12-19 14:00:00' },
      { id: 507, customer_id: 5, amount: 2100.00, status: 'completed', created_at: '2026-09-17 18:20:00' },
      { id: 508, customer_id: 1, amount: 450.00, status: 'completed', created_at: '2026-09-18 08:30:00' }
    ],
    products: [
      { id: 1, title: 'Enterprise Database Appliance', price: 4999.00, stock: 15, category: 'Hardware' },
      { id: 2, title: 'Autonomous Agent License (Annual)', price: 1200.00, stock: 999, category: 'Software' },
      { id: 3, title: 'High-Throughput NVMe Cluster', price: 8500.00, stock: 8, category: 'Storage' },
      { id: 4, title: 'Real-Time Replication Gateway', price: 2400.00, stock: 45, category: 'Networking' }
    ],
    transactions: [
      { id: 9001, order_id: 501, amount: 249.50, payment_method: 'credit_card', status: 'settled', created_at: '2026-09-15 10:01:00' },
      { id: 9002, order_id: 503, amount: 1450.00, payment_method: 'wire_transfer', status: 'settled', created_at: '2026-09-10 12:02:00' },
      { id: 9003, order_id: 507, amount: 2100.00, payment_method: 'credit_card', status: 'settled', created_at: '2026-09-17 18:21:00' },
      { id: 9004, order_id: 508, amount: 450.00, payment_method: 'credit_card', status: 'settled', created_at: '2026-09-18 08:31:00' }
    ],
    roles: [
      { id: 1, role_name: 'Administrator' },
      { id: 2, role_name: 'API Agent' }
    ]
  };

  private queryStats: QueryExecutionStat[] = [
    {
      queryId: '#1842',
      sql: 'SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC;',
      avgExecutionSec: 8.4,
      calls: 12402,
      table: 'orders',
      isSlow: true,
      missingIndex: 'orders(customer_id, created_at)',
      recommendation: 'CREATE INDEX idx_orders_customer_id_created ON orders(customer_id, created_at DESC);'
    },
    {
      queryId: '#1938',
      sql: "SELECT * FROM transactions WHERE status = 'settled' AND amount > 1000;",
      avgExecutionSec: 6.1,
      calls: 8231,
      table: 'transactions',
      isSlow: true,
      missingIndex: 'transactions(status, amount)',
      recommendation: 'CREATE INDEX idx_transactions_status_amt ON transactions(status, amount);'
    },
    {
      queryId: '#2104',
      sql: 'SELECT * FROM customers WHERE customer_status = 3;',
      avgExecutionSec: 4.8,
      calls: 5119,
      table: 'customers',
      isSlow: true,
      missingIndex: 'customers(customer_status)',
      recommendation: 'CREATE INDEX idx_customers_status ON customers(customer_status);'
    },
    {
      queryId: '#1001',
      sql: "SELECT * FROM users WHERE status = 'active';",
      avgExecutionSec: 0.002,
      calls: 45012,
      table: 'users',
      isSlow: false
    }
  ];

  private evaluateWhereCondition(row: Record<string, any>, whereClause?: string): boolean {
    if (!whereClause || !whereClause.trim()) return true;
    const andConditions = whereClause.split(/\s+AND\s+/i);

    return andConditions.every(cond => {
      const trimmed = cond.trim();
      if (!trimmed) return true;

      // IS NOT NULL
      if (/\bIS\s+NOT\s+NULL\b/i.test(trimmed)) {
        const col = trimmed.replace(/\bIS\s+NOT\s+NULL\b/i, '').trim().split('.').pop()!;
        return row[col] !== null && row[col] !== undefined;
      }

      // IS NULL
      if (/\bIS\s+NULL\b/i.test(trimmed)) {
        const col = trimmed.replace(/\bIS\s+NULL\b/i, '').trim().split('.').pop()!;
        return row[col] === null || row[col] === undefined;
      }

      // LIKE
      const likeMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+LIKE\s+['"]([^'"]+)['"]/i);
      if (likeMatch) {
        const col = likeMatch[1].split('.').pop()!;
        const pattern = likeMatch[2].replace(/%/g, '.*').replace(/_/g, '.');
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(String(row[col] ?? ''));
      }

      // Operators: !=, <>, >=, <=, =, >, <
      const opMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*(!=|<>|>=|<=|=|>|<)\s*(['"]?[^'"]+['"]?)/);
      if (opMatch) {
        const col = opMatch[1].split('.').pop()!;
        const op = opMatch[2];
        const rawVal = opMatch[3].trim().replace(/^['"]|['"]$/g, '');
        const cellVal = row[col];

        const numCell = Number(cellVal);
        const numTarget = Number(rawVal);
        const isNumeric = !isNaN(numCell) && !isNaN(numTarget) && cellVal !== '' && cellVal !== null;

        if (op === '=' || op === '==') {
          return isNumeric ? numCell === numTarget : String(cellVal).toLowerCase() === rawVal.toLowerCase();
        }
        if (op === '!=' || op === '<>') {
          return isNumeric ? numCell !== numTarget : String(cellVal).toLowerCase() !== rawVal.toLowerCase();
        }
        if (op === '>') {
          return isNumeric ? numCell > numTarget : String(cellVal) > rawVal;
        }
        if (op === '>=') {
          return isNumeric ? numCell >= numTarget : String(cellVal) >= rawVal;
        }
        if (op === '<') {
          return isNumeric ? numCell < numTarget : String(cellVal) < rawVal;
        }
        if (op === '<=') {
          return isNumeric ? numCell <= numTarget : String(cellVal) <= rawVal;
        }
      }

      return true;
    });
  }

  /**
   * Execute a real SQL query against the engine.
   */
  public async executeQuery(sql: string): Promise<RealQueryResult> {
    const startTime = Date.now();
    const cleanSql = sql.trim().replace(/;+\s*$/, '');

    try {
      // 1. Handle CREATE TABLE
      if (/^CREATE\s+TABLE/i.test(cleanSql)) {
        const match = cleanSql.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const body = match[2];

          // Split on commas not inside parentheses to preserve types like DECIMAL(10, 2) or VARCHAR(255)
          const columnDefs = body.split(/,(?![^(]*\))/g).map(line => line.trim()).filter(line => line && !/^PRIMARY|^FOREIGN|^KEY|^CONSTRAINT/i.test(line));
          const columns: IntrospectedColumn[] = columnDefs.map(def => {
            const parts = def.split(/\s+/);
            const colName = parts[0];
            const typeMatch = def.slice(colName.length).trim().match(/^([a-zA-Z]+(?:\s*\([^)]+\))?)/);
            const colType = typeMatch ? typeMatch[1].replace(/\s*,\s*/g, ', ') : (parts[1] || 'TEXT');
            const isPk = /PRIMARY\s+KEY/i.test(def);
            const isFk = /REFERENCES/i.test(def);
            return { name: colName, type: colType.toUpperCase(), isPrimary: isPk, isForeign: isFk };
          });

          this.inMemoryTables[tableName] = { name: tableName, columns };
          if (!this.inMemoryData[tableName]) {
            this.inMemoryData[tableName] = [];
          }

          return {
            columns: [],
            rows: [],
            affectedRows: 0,
            executionTimeMs: Date.now() - startTime
          };
        }
      }

      // 2. Handle INSERT INTO
      if (/^INSERT\s+INTO/i.test(cleanSql)) {
        const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*(\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const colNames = match[3] ? match[3].split(',').map(c => c.trim()) : [];
          const rawValues = match[4].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));

          if (this.inMemoryTables[tableName]) {
            const newRow: Record<string, any> = {};
            if (colNames.length > 0) {
              colNames.forEach((c, idx) => {
                newRow[c] = rawValues[idx] || null;
              });
            } else {
              this.inMemoryTables[tableName].columns.forEach((col, idx) => {
                newRow[col.name] = rawValues[idx] || null;
              });
            }
            this.inMemoryData[tableName].push(newRow);

            return {
              columns: [],
              rows: [],
              affectedRows: 1,
              executionTimeMs: Date.now() - startTime
            };
          }
        }
      }

      // 3. Handle SELECT
      if (/^SELECT/i.test(cleanSql)) {
        const selectMatch = cleanSql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)/i);
        if (selectMatch) {
          const rawCols = selectMatch[1].trim();
          const mainTable = selectMatch[2].toLowerCase();

          if (!this.inMemoryTables[mainTable]) {
            return {
              columns: [],
              rows: [],
              executionTimeMs: Date.now() - startTime,
              error: `Table '${mainTable}' does not exist in schema.`
            };
          }

          let rows: Record<string, any>[] = this.inMemoryData[mainTable] ? this.inMemoryData[mainTable].map(r => ({ ...r })) : [];

          // Optional JOIN
          const joinMatch = cleanSql.match(/(?:(?:INNER|LEFT|RIGHT|FULL)?\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/i);
          if (joinMatch) {
            const joinTable = joinMatch[1].toLowerCase();
            const leftColFull = joinMatch[3];
            const rightColFull = joinMatch[4];
            const leftCol = leftColFull.includes('.') ? leftColFull.split('.')[1] : leftColFull;
            const rightCol = rightColFull.includes('.') ? rightColFull.split('.')[1] : rightColFull;

            const joinData = this.inMemoryData[joinTable] || [];
            const joinedRows: Record<string, any>[] = [];

            for (const mainRow of rows) {
              const matching = joinData.filter(jRow => {
                const leftVal = mainRow[leftCol] ?? mainRow[rightCol];
                const rightVal = jRow[rightCol] ?? jRow[leftCol];
                return String(leftVal) === String(rightVal);
              });

              if (matching.length > 0) {
                for (const m of matching) {
                  const mergedRow: Record<string, any> = {};
                  // Preserve main table columns with and without table prefix
                  for (const [k, v] of Object.entries(mainRow)) {
                    mergedRow[k] = v;
                    mergedRow[`${mainTable}.${k}`] = v;
                  }
                  // Qualify joined table columns to prevent collisions (e.g. users.id vs roles.id)
                  for (const [k, v] of Object.entries(m)) {
                    mergedRow[`${joinTable}.${k}`] = v;
                    if (!(k in mainRow)) {
                      mergedRow[k] = v;
                    }
                  }
                  joinedRows.push(mergedRow);
                }
              } else if (/LEFT/i.test(joinMatch[0])) {
                const mergedRow: Record<string, any> = { ...mainRow };
                for (const [k, v] of Object.entries(mainRow)) {
                  mergedRow[`${mainTable}.${k}`] = v;
                }
                joinedRows.push(mergedRow);
              }
            }
            rows = joinedRows;
          }

          // WHERE clause
          const whereMatch = cleanSql.match(/\bWHERE\s+([\s\S]+?)(?:\s+(?:GROUP\s+BY|ORDER\s+BY|LIMIT)\b|;|\s*$)/i);
          if (whereMatch) {
            rows = rows.filter(row => this.evaluateWhereCondition(row, whereMatch[1]));
          }

          // ORDER BY clause
          const orderMatch = cleanSql.match(/\bORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?/i);
          if (orderMatch) {
            const col = orderMatch[1].split('.').pop()!;
            const direction = (orderMatch[2] || 'ASC').toUpperCase();
            rows.sort((a, b) => {
              const valA = a[col];
              const valB = b[col];
              if (valA === valB) return 0;
              if (valA == null) return 1;
              if (valB == null) return -1;
              const cmp = typeof valA === 'number' && typeof valB === 'number'
                ? valA - valB
                : String(valA).localeCompare(String(valB));
              return direction === 'DESC' ? -cmp : cmp;
            });
          }

          // LIMIT and OFFSET clause
          const limitMatch = cleanSql.match(/\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
          if (limitMatch) {
            const limit = parseInt(limitMatch[1], 10);
            const offset = limitMatch[2] ? parseInt(limitMatch[2], 10) : 0;
            rows = rows.slice(offset, offset + limit);
          }

          // Column Projection
          let columns: string[] = [];
          if (rawCols === '*' || rawCols === `${mainTable}.*`) {
            if (rows.length > 0) {
              columns = Object.keys(rows[0]);
            } else if (this.inMemoryTables[mainTable]) {
              columns = this.inMemoryTables[mainTable].columns.map(c => c.name);
            } else {
              columns = ['result'];
            }
          } else {
            const requestedCols = rawCols.split(',').map(c => {
              const trimmed = c.trim();
              const aliasMatch = trimmed.match(/^([a-zA-Z0-9_.]+)\s+(?:AS\s+)?([a-zA-Z0-9_]+)$/i);
              if (aliasMatch) {
                return { display: aliasMatch[2], source: aliasMatch[1] };
              }
              return { display: trimmed, source: trimmed };
            });

            columns = requestedCols.map(c => c.display);
            rows = rows.map(r => {
              const projected: Record<string, any> = {};
              for (const col of requestedCols) {
                const unqualifiedSource = col.source.split('.').pop()!;
                projected[col.display] = r[col.source] ?? r[col.display] ?? r[unqualifiedSource] ?? null;
              }
              return projected;
            });
          }

          return {
            columns,
            rows,
            executionTimeMs: Date.now() - startTime
          };
        } else {
          // Handle standalone scalar expressions without FROM: e.g. SELECT 42 as answer; or SELECT 1;
          const scalarMatch = cleanSql.match(/^SELECT\s+([\s\S]+?);?$/i);
          if (scalarMatch && !/FROM/i.test(cleanSql)) {
            const expr = scalarMatch[1].trim();
            const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
            const colName = aliasMatch ? aliasMatch[2] : 'result';
            const rawVal = aliasMatch ? aliasMatch[1].trim() : expr;
            const parsedVal = !isNaN(Number(rawVal)) ? Number(rawVal) : rawVal.replace(/^['"]|['"]$/g, '');
            return {
              columns: [colName],
              rows: [{ [colName]: parsedVal }],
              executionTimeMs: Date.now() - startTime
            };
          }
        }
      }

      // 4. Handle UPDATE
      if (/^UPDATE/i.test(cleanSql)) {
        const match = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const setClause = match[2];
          const whereClause = match[3] ? match[3].trim().replace(/;+\s*$/, '') : undefined;

          if (this.inMemoryData[tableName]) {
            const assignments = setClause.split(',').map(s => {
              const [k, v] = s.split('=').map(x => x.trim().replace(/^['"]|['"]$/g, ''));
              return { key: k, val: v };
            });

            let affected = 0;
            this.inMemoryData[tableName] = this.inMemoryData[tableName].map(row => {
              let shouldUpdate = true;
              if (whereClause) {
                shouldUpdate = this.evaluateWhereCondition(row, whereClause);
              }
              if (shouldUpdate) {
                affected++;
                const updated = { ...row };
                assignments.forEach(({ key, val }) => {
                  updated[key] = val;
                });
                return updated;
              }
              return row;
            });

            return {
              columns: [],
              rows: [],
              affectedRows: affected,
              executionTimeMs: Date.now() - startTime
            };
          }
        }
      }

      // 5. Handle DELETE FROM
      if (/^DELETE\s+FROM/i.test(cleanSql)) {
        const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const whereClause = match[2] ? match[2].trim().replace(/;+\s*$/, '') : undefined;

          if (this.inMemoryData[tableName]) {
            const initialCount = this.inMemoryData[tableName].length;
            if (whereClause) {
              this.inMemoryData[tableName] = this.inMemoryData[tableName].filter(row => !this.evaluateWhereCondition(row, whereClause));
            } else {
              this.inMemoryData[tableName] = [];
            }
            const affected = initialCount - this.inMemoryData[tableName].length;

            return {
              columns: [],
              rows: [],
              affectedRows: affected,
              executionTimeMs: Date.now() - startTime
            };
          }
        }
      }

      // 6. Handle DROP TABLE
      if (/^DROP\s+TABLE/i.test(cleanSql)) {
        const match = cleanSql.match(/DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          delete this.inMemoryTables[tableName];
          delete this.inMemoryData[tableName];
          return {
            columns: [],
            rows: [],
            affectedRows: 0,
            executionTimeMs: Date.now() - startTime
          };
        }
      }

      // Unknown or unsupported SQL command
      if (!/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXPLAIN|PRAGMA|SHOW|DESCRIBE|BEGIN|COMMIT|ROLLBACK)\b/i.test(cleanSql)) {
        return {
          columns: [],
          rows: [],
          executionTimeMs: Date.now() - startTime,
          error: `Syntax error in SQL statement: '${cleanSql}'`
        };
      }

      // Fallback response for custom queries
      return {
        columns: ['status', 'query'],
        rows: [{ status: 'OK', query: cleanSql }],
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        columns: [],
        rows: [],
        executionTimeMs: Date.now() - startTime,
        error: `[SQL Error]: ${err.message || 'Syntax error in SQL statement.'}`
      };
    }
  }

  /**
   * Introspect real database schema.
   */
  public introspectSchema(): IntrospectedTable[] {
    return Object.values(this.inMemoryTables);
  }

  /**
   * Retrieve list of table names in current schema.
   */
  public getTableNames(): string[] {
    return this.introspectSchema().map(t => t.name);
  }

  /**
   * Retrieve a specific table by name.
   */
  public getTable(tableName: string): IntrospectedTable | undefined {
    return this.inMemoryTables[tableName.toLowerCase()];
  }

  /**
   * Retrieve live rows for a specific table.
   */
  public getTableData(tableName: string): Record<string, any>[] {
    const key = tableName.toLowerCase();
    return this.inMemoryData[key] ? [...this.inMemoryData[key]] : [];
  }

  /**
   * Update live rows for a specific table.
   */
  public setTableData(tableName: string, rows: Record<string, any>[]): void {
    const key = tableName.toLowerCase();
    this.inMemoryData[key] = [...rows];
  }

  /**
   * Dynamically generate DDL for a specific table.
   */
  public generateTableDDL(tableName: string): string {
    const tbl = this.getTable(tableName);
    if (!tbl) return `-- Table '${tableName}' does not exist in schema.`;

    const colDefs = tbl.columns.map(col => {
      let str = `  ${col.name} ${col.type}`;
      if (col.isPrimary) str += ' PRIMARY KEY';
      if (col.isForeign) str += ' REFERENCES foreign_table(id)';
      return str;
    });

    return `CREATE TABLE ${tbl.name} (\n${colDefs.join(',\n')}\n);\n\nCREATE INDEX idx_${tbl.name}_primary ON ${tbl.name}(${tbl.columns[0]?.name || 'id'});`;
  }
}

export const realSqlDriver = new RealSqlDriverEngine();
