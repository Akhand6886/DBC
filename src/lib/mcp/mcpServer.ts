/**
 * DBC Model Context Protocol (MCP) Server
 * Exposes standardized JSON-RPC 2.0 tools and resources to external AI clients
 * (Claude Desktop, Cursor, Antigravity) via the Model Context Protocol.
 */

import { realSqlDriver } from '../db/sqlDriver';
import { queryFirewall } from '../db/queryFirewall';
import { transactionManager } from '../db/transactionManager';
import { analyzeQueryPlan } from '../db/explainAnalyzer';
import { dbMemory } from '../db/dbMemory';
import { dbAgentRuntime } from '../agent/dbAgentRuntime';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export const MCP_SERVER_INFO = {
  name: 'dbc-agentic-mcp-server',
  version: '1.0.0',
  protocolVersion: '2024-11-05'
};

export class McpServerEngine {
  /**
   * Process an incoming JSON-RPC 2.0 MCP request.
   */
  public async handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    const id = req.id ?? null;

    try {
      switch (req.method) {
        // ─── 1. Lifecycle: Initialize ──────────────────────────────────────
        case 'initialize': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: MCP_SERVER_INFO.protocolVersion,
              serverInfo: {
                name: MCP_SERVER_INFO.name,
                version: MCP_SERVER_INFO.version
              },
              capabilities: {
                tools: {
                  listChanged: false
                },
                resources: {
                  subscribe: false,
                  listChanged: false
                }
              }
            }
          };
        }

        case 'ping': {
          return { jsonrpc: '2.0', id, result: {} };
        }

        // ─── 2. Tools: List ────────────────────────────────────────────────
        case 'tools/list': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: 'dbc_execute_query',
                  description: 'Execute a SQL query against DBC with pre-flight Query Firewall validation and rollback snapshot creation.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      sql: { type: 'string', description: 'SQL query to execute' },
                      dryRun: { type: 'boolean', description: 'If true, simulates execution without mutation' }
                    },
                    required: ['sql']
                  }
                },
                {
                  name: 'dbc_introspect_schema',
                  description: 'Inspect live database schema, tables, column types, and foreign key relations.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      tableName: { type: 'string', description: 'Optional table name to filter' }
                    },
                    required: []
                  }
                },
                {
                  name: 'dbc_explain_query',
                  description: 'Analyze query execution plan (EXPLAIN ANALYZE) and detect sequential table scans.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      sql: { type: 'string', description: 'SQL query to analyze' }
                    },
                    required: ['sql']
                  }
                },
                {
                  name: 'dbc_suggest_indexes',
                  description: 'Generate B-Tree and Foreign Key index recommendations for a table.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      tableName: { type: 'string', description: 'Table name to optimize' }
                    },
                    required: ['tableName']
                  }
                },
                {
                  name: 'dbc_generate_migration',
                  description: 'Generate reversible UP and DOWN migration DDL scripts with data safety checks.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      changeDescription: { type: 'string', description: 'Description of the migration' },
                      targetTable: { type: 'string', description: 'Target table name' }
                    },
                    required: ['changeDescription']
                  }
                },
                {
                  name: 'dbc_get_business_memory',
                  description: 'Retrieve organizational domain invariants, soft-delete rules, and column semantics from Database Memory.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      tableName: { type: 'string', description: 'Optional table name' }
                    },
                    required: []
                  }
                }
              ]
            }
          };
        }

        // ─── 3. Tools: Call ────────────────────────────────────────────────
        case 'tools/call': {
          const params = req.params || {};
          const toolName = params.name;
          const args = params.arguments || {};

          switch (toolName) {
            case 'dbc_execute_query': {
              const sql = args.sql;
              const assessment = queryFirewall.evaluateQuery(sql);
              if (assessment.isBlocked) {
                return {
                  jsonrpc: '2.0',
                  id,
                  result: {
                    content: [{ type: 'text', text: `BLOCKED BY QUERY FIREWALL: ${assessment.violations.join('; ')}` }],
                    isError: true
                  }
                };
              }
              const { result, snapshot } = await transactionManager.executeWithSnapshot(sql);
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        rowsCount: result.rows.length,
                        rows: result.rows.slice(0, 50),
                        executionTimeMs: result.executionTimeMs,
                        snapshotId: snapshot?.id,
                        firewallRisk: assessment.level
                      }, null, 2)
                    }
                  ],
                  isError: !!result.error
                }
              };
            }

            case 'dbc_introspect_schema': {
              const tables = realSqlDriver.introspectSchema();
              const filtered = args.tableName
                ? tables.filter(t => t.name.toLowerCase() === args.tableName.toLowerCase())
                : tables;
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
                  isError: false
                }
              };
            }

            case 'dbc_explain_query': {
              const plan = analyzeQueryPlan(args.sql);
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }],
                  isError: false
                }
              };
            }

            case 'dbc_suggest_indexes': {
              const res = await dbAgentRuntime.executeTool('suggest_indexes', { tableName: args.tableName });
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }],
                  isError: !res.success
                }
              };
            }

            case 'dbc_generate_migration': {
              const res = await dbAgentRuntime.executeTool('generate_migration', {
                changeDescription: args.changeDescription,
                targetTable: args.targetTable
              });
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }],
                  isError: !res.success
                }
              };
            }

            case 'dbc_get_business_memory': {
              const context = dbMemory.getEnrichedSchemaContext(args.tableName);
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: context }],
                  isError: false
                }
              };
            }

            default:
              return {
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `Method not found or unknown tool: ${toolName}` }
              };
          }
        }

        // ─── 4. Resources: List ────────────────────────────────────────────
        case 'resources/list': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              resources: [
                {
                  uri: 'db://schema',
                  name: 'Live Database Schema',
                  description: 'Active database table catalog, column definitions, and primary/foreign keys.',
                  mimeType: 'application/json'
                },
                {
                  uri: 'db://memory',
                  name: 'Database Domain Memory',
                  description: 'Organizational business invariants, column value semantics, and soft-delete conventions.',
                  mimeType: 'text/markdown'
                },
                {
                  uri: 'db://tables/users/sample',
                  name: 'Users Table Sample Data',
                  description: 'Representative live rows from the users table.',
                  mimeType: 'application/json'
                }
              ]
            }
          };
        }

        // ─── 5. Resources: Read ────────────────────────────────────────────
        case 'resources/read': {
          const uri = req.params?.uri;
          if (uri === 'db://schema') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(realSqlDriver.introspectSchema(), null, 2)
                  }
                ]
              }
            };
          }
          if (uri === 'db://memory') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'text/markdown',
                    text: dbMemory.getEnrichedSchemaContext()
                  }
                ]
              }
            };
          }
          if (uri === 'db://tables/users/sample') {
            return {
              jsonrpc: '2.0',
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(realSqlDriver.getTableData('users').slice(0, 10), null, 2)
                  }
                ]
              }
            };
          }

          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` }
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not supported: ${req.method}` }
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: `Internal MCP error: ${err.message}` }
      };
    }
  }
}

export const mcpServer = new McpServerEngine();
