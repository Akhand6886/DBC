/**
 * DBC Data Lineage Engine
 * Parses relational queries, builds directed acyclic dependency graphs (DAG),
 * tracks column-level transformations, and computes downstream blast radius impact.
 */

import { realSqlDriver } from '../db/sqlDriver';
import { dbMemory } from '../db/dbMemory';

export type LineageNodeType = 
  | 'SOURCE_TABLE' 
  | 'DERIVED_TABLE' 
  | 'VIEW' 
  | 'DOWNSTREAM_REPORT' 
  | 'PIPELINE_JOB';

export type LineageTransformationType = 
  | 'DIRECT_COPY' 
  | 'JOIN' 
  | 'AGGREGATE' 
  | 'FILTER' 
  | 'FOREIGN_KEY' 
  | 'UNION';

export interface LineageColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isPii?: boolean;
}

export interface LineageNode {
  id: string;
  name: string;
  type: LineageNodeType;
  description: string;
  schema?: string;
  columns: LineageColumn[];
  ownerTeam?: string;
  rowCountEstimate?: number;
  status: 'ACTIVE' | 'DEPRECATED' | 'EXPERIMENTAL';
}

export interface LineageEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  transformation: LineageTransformationType;
  description: string;
  sourceColumns?: string[];
  targetColumns?: string[];
}

export interface BlastImpactAssessment {
  targetNodeId: string;
  targetColumn?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedDownstreamNodes: LineageNode[];
  affectedEdges: LineageEdge[];
  breakingChanges: string[];
  recommendations: string[];
}

export interface ParsedSqlLineage {
  sources: string[];
  targets: string[];
  joins: string[];
  transformationType: LineageTransformationType;
}

export class DataLineageEngine {
  private nodes: Map<string, LineageNode> = new Map();
  private edges: Map<string, LineageEdge> = new Map();

  constructor() {
    this.seedDefaultLineage();
  }

  /**
   * Initializes default lineage graph with live database tables and downstream views/reports.
   */
  private seedDefaultLineage(): void {
    // 1. Source: roles
    this.addNode({
      id: 'roles',
      name: 'roles',
      type: 'SOURCE_TABLE',
      description: 'System roles, privilege tiers, and RBAC definitions.',
      schema: 'public',
      ownerTeam: 'Platform Security',
      rowCountEstimate: 10,
      status: 'ACTIVE',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'role_name', type: 'VARCHAR(100)' }
      ]
    });

    // 2. Source: users
    this.addNode({
      id: 'users',
      name: 'users',
      type: 'SOURCE_TABLE',
      description: 'Core registered user accounts, authentication identities, and role assignments.',
      schema: 'public',
      ownerTeam: 'Core Identity',
      rowCountEstimate: 15000,
      status: 'ACTIVE',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'username', type: 'VARCHAR(255)' },
        { name: 'email', type: 'VARCHAR(255)', isPii: true },
        { name: 'role_id', type: 'INTEGER', isForeign: true }
      ]
    });

    // 3. Derived: audit_logs
    this.addNode({
      id: 'audit_logs',
      name: 'audit_logs',
      type: 'DERIVED_TABLE',
      description: 'Immutable system audit trails logging API actions, logins, and schema modifications.',
      schema: 'audit',
      ownerTeam: 'Security & Compliance',
      rowCountEstimate: 120000,
      status: 'ACTIVE',
      columns: [
        { name: 'id', type: 'INTEGER', isPrimary: true },
        { name: 'user_id', type: 'INTEGER', isForeign: true },
        { name: 'action', type: 'VARCHAR(100)' },
        { name: 'actor_ip', type: 'VARCHAR(45)', isPii: true },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    });

    // 4. View: v_user_permissions
    this.addNode({
      id: 'v_user_permissions',
      name: 'v_user_permissions',
      type: 'VIEW',
      description: 'Denormalized view joining users and roles with permission masks for real-time auth checks.',
      schema: 'public',
      ownerTeam: 'Core Identity',
      rowCountEstimate: 15000,
      status: 'ACTIVE',
      columns: [
        { name: 'user_id', type: 'INTEGER' },
        { name: 'username', type: 'VARCHAR(255)' },
        { name: 'role_name', type: 'VARCHAR(100)' }
      ]
    });

    // 5. Downstream: daily_active_users_report
    this.addNode({
      id: 'daily_active_users_report',
      name: 'daily_active_users_report',
      type: 'DOWNSTREAM_REPORT',
      description: 'Daily cohort aggregation reporting active users per role for Executive & BI Dashboards.',
      schema: 'analytics',
      ownerTeam: 'Data & BI',
      rowCountEstimate: 365,
      status: 'ACTIVE',
      columns: [
        { name: 'report_date', type: 'DATE' },
        { name: 'role_name', type: 'VARCHAR(100)' },
        { name: 'active_count', type: 'INTEGER' }
      ]
    });

    // 6. Pipeline: gdpr_compliance_export
    this.addNode({
      id: 'gdpr_compliance_export',
      name: 'gdpr_compliance_export',
      type: 'PIPELINE_JOB',
      description: 'Automated data pipeline exporting PII masked audit events to long-term cold storage.',
      schema: 'compliance',
      ownerTeam: 'Legal & Compliance',
      rowCountEstimate: 50000,
      status: 'ACTIVE',
      columns: [
        { name: 'export_id', type: 'VARCHAR(64)' },
        { name: 'user_id', type: 'INTEGER' },
        { name: 'anonymized_ip', type: 'VARCHAR(45)' }
      ]
    });

    // Edges
    this.addEdge({
      id: 'edge-roles-to-users',
      sourceNodeId: 'roles',
      targetNodeId: 'users',
      transformation: 'FOREIGN_KEY',
      description: 'Foreign key constraint users.role_id references roles.id',
      sourceColumns: ['id'],
      targetColumns: ['role_id']
    });

    this.addEdge({
      id: 'edge-users-to-audit',
      sourceNodeId: 'users',
      targetNodeId: 'audit_logs',
      transformation: 'FOREIGN_KEY',
      description: 'Audit event actor foreign key audit_logs.user_id references users.id',
      sourceColumns: ['id'],
      targetColumns: ['user_id']
    });

    this.addEdge({
      id: 'edge-users-to-view',
      sourceNodeId: 'users',
      targetNodeId: 'v_user_permissions',
      transformation: 'JOIN',
      description: 'SELECT u.id, u.username, r.role_name FROM users u JOIN roles r',
      sourceColumns: ['id', 'username'],
      targetColumns: ['user_id', 'username']
    });

    this.addEdge({
      id: 'edge-roles-to-view',
      sourceNodeId: 'roles',
      targetNodeId: 'v_user_permissions',
      transformation: 'JOIN',
      description: 'JOIN roles r ON u.role_id = r.id',
      sourceColumns: ['role_name'],
      targetColumns: ['role_name']
    });

    this.addEdge({
      id: 'edge-audit-to-dau',
      sourceNodeId: 'audit_logs',
      targetNodeId: 'daily_active_users_report',
      transformation: 'AGGREGATE',
      description: 'COUNT(DISTINCT user_id) GROUP BY report_date, role_name',
      sourceColumns: ['user_id', 'created_at'],
      targetColumns: ['active_count', 'report_date']
    });

    this.addEdge({
      id: 'edge-audit-to-compliance',
      sourceNodeId: 'audit_logs',
      targetNodeId: 'gdpr_compliance_export',
      transformation: 'FILTER',
      description: 'SELECT user_id, MASK(actor_ip) WHERE created_at > NOW() - INTERVAL 30 DAYS',
      sourceColumns: ['user_id', 'actor_ip'],
      targetColumns: ['user_id', 'anonymized_ip']
    });
  }

  public addNode(node: LineageNode): void {
    this.nodes.set(node.id.toLowerCase(), node);
  }

  public getNode(id: string): LineageNode | undefined {
    return this.nodes.get(id.toLowerCase());
  }

  public addEdge(edge: LineageEdge): void {
    this.edges.set(edge.id, edge);
  }

  public getAllNodes(): LineageNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): LineageEdge[] {
    return Array.from(this.edges.values());
  }

  public getGraph(): { nodes: LineageNode[]; edges: LineageEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  /**
   * Find all immediate and transitive downstream dependencies for a given node.
   */
  public getDownstreamLineage(startNodeId: string): { nodes: LineageNode[]; edges: LineageEdge[] } {
    const visitedNodes = new Set<string>();
    const collectedEdges = new Set<LineageEdge>();
    const queue: string[] = [startNodeId.toLowerCase()];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of Array.from(this.edges.values())) {
        if (edge.sourceNodeId.toLowerCase() === current) {
          collectedEdges.add(edge);
          const target = edge.targetNodeId.toLowerCase();
          if (!visitedNodes.has(target)) {
            visitedNodes.add(target);
            queue.push(target);
          }
        }
      }
    }

    const downstreamNodes = Array.from(visitedNodes)
      .map(id => this.nodes.get(id))
      .filter((n): n is LineageNode => !!n);

    return {
      nodes: downstreamNodes,
      edges: Array.from(collectedEdges)
    };
  }

  public getDownstreamNodes(startNodeId: string): LineageNode[] {
    return this.getDownstreamLineage(startNodeId).nodes;
  }

  /**
   * Find all immediate and transitive upstream dependencies for a given node.
   */
  public getUpstreamLineage(startNodeId: string): { nodes: LineageNode[]; edges: LineageEdge[] } {
    const visitedNodes = new Set<string>();
    const collectedEdges = new Set<LineageEdge>();
    const queue: string[] = [startNodeId.toLowerCase()];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of Array.from(this.edges.values())) {
        if (edge.targetNodeId.toLowerCase() === current) {
          collectedEdges.add(edge);
          const source = edge.sourceNodeId.toLowerCase();
          if (!visitedNodes.has(source)) {
            visitedNodes.add(source);
            queue.push(source);
          }
        }
      }
    }

    const upstreamNodes = Array.from(visitedNodes)
      .map(id => this.nodes.get(id))
      .filter((n): n is LineageNode => !!n);

    return {
      nodes: upstreamNodes,
      edges: Array.from(collectedEdges)
    };
  }

  public getUpstreamNodes(startNodeId: string): LineageNode[] {
    return this.getUpstreamLineage(startNodeId).nodes;
  }

  /**
   * Evaluates the blast radius of dropping or modifying a table or column.
   */
  public analyzeBlastImpact(targetTable: string, targetColumn?: string): BlastImpactAssessment {
    const tableKey = targetTable.toLowerCase();
    const startNode = this.nodes.get(tableKey);

    if (!startNode) {
      return {
        targetNodeId: targetTable,
        targetColumn,
        riskLevel: 'LOW',
        affectedDownstreamNodes: [],
        affectedEdges: [],
        breakingChanges: [`Target table '${targetTable}' is not referenced in current lineage graph.`],
        recommendations: ['Safe to proceed with localized isolation.']
      };
    }

    const { nodes: downstreamNodes, edges: affectedEdges } = this.getDownstreamLineage(tableKey);

    const breakingChanges: string[] = [];
    const recommendations: string[] = [];

    // Check column specific dependencies
    if (targetColumn) {
      const colEdges = affectedEdges.filter(e => 
        e.sourceColumns?.map(c => c.toLowerCase()).includes(targetColumn.toLowerCase())
      );

      if (colEdges.length > 0) {
        breakingChanges.push(
          `Column '${targetTable}.${targetColumn}' is explicitly consumed by ${colEdges.length} downstream transformation(s).`
        );
        colEdges.forEach(e => {
          breakingChanges.push(`- Breaks downstream '${e.targetNodeId}' via ${e.transformation} operation (${e.description}).`);
        });
      } else {
        breakingChanges.push(
          `Column '${targetTable}.${targetColumn}' modification alters table definition and triggers schema invalidation across downstream dependencies.`
        );
      }
    } else {
      // Table level impact
      breakingChanges.push(
        `Table '${targetTable}' has ${downstreamNodes.length} downstream consumer(s) that will fail if mutated or dropped.`
      );
      downstreamNodes.forEach(n => {
        breakingChanges.push(`- Direct/indirect dependency: [${n.type}] ${n.name} (Owned by ${n.ownerTeam || 'Unknown'})`);
      });
    }

    // Determine Risk Level
    let riskLevel: BlastImpactAssessment['riskLevel'] = 'LOW';
    if (downstreamNodes.length >= 3 || downstreamNodes.some(n => n.type === 'DOWNSTREAM_REPORT')) {
      riskLevel = 'CRITICAL';
    } else if (downstreamNodes.length > 0) {
      riskLevel = 'HIGH';
    } else if (targetColumn) {
      riskLevel = 'MEDIUM';
    }

    // Generate remediation recommendations
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      recommendations.push('Run mutation inside an isolated Database Sandbox Branch first.');
      recommendations.push('Update downstream views and ETL pipelines before executing schema drop.');
      recommendations.push('Deploy a backward-compatible 2-phase migration (deprecate column before drop).');
    } else {
      recommendations.push('Verify local unit tests and execute with Virtual Transaction Rollback enabled.');
    }

    return {
      targetNodeId: tableKey,
      targetColumn,
      riskLevel,
      affectedDownstreamNodes: downstreamNodes,
      affectedEdges,
      breakingChanges,
      recommendations
    };
  }

  /**
   * Lightweight SQL AST lineage extractor.
   * Parses SELECT, INSERT INTO ... SELECT, CREATE VIEW, and JOIN dependencies.
   */
  public parseSqlLineage(sql: string): ParsedSqlLineage {
    const cleanSql = sql.trim();
    const sources = new Set<string>();
    const targets = new Set<string>();
    const joins: string[] = [];
    let transformationType: LineageTransformationType = 'DIRECT_COPY';

    // 1. Target detection: CREATE VIEW / CREATE TABLE
    const createMatch = cleanSql.match(/CREATE\s+(?:OR\s+REPLACE\s+)?(VIEW|TABLE)\s+([a-zA-Z0-9_.]+)/i);
    if (createMatch) {
      targets.add(createMatch[2].toLowerCase());
    }

    // Target detection: INSERT INTO ...
    const insertMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_.]+)/i);
    if (insertMatch) {
      targets.add(insertMatch[1].toLowerCase());
    }

    // 2. Sources: FROM clause
    const fromMatches = Array.from(cleanSql.matchAll(/\bFROM\s+([a-zA-Z0-9_.]+)/gi));
    for (const match of fromMatches) {
      sources.add(match[1].toLowerCase());
    }

    // 3. Joins: JOIN clause
    const joinMatches = Array.from(cleanSql.matchAll(/\b(?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\s+([a-zA-Z0-9_.]+)/gi));
    for (const match of joinMatches) {
      const joinTable = match[1].toLowerCase();
      sources.add(joinTable);
      joins.push(joinTable);
      transformationType = 'JOIN';
    }

    // 4. Aggregates detection
    if (/\b(GROUP\s+BY|COUNT\(|SUM\(|AVG\(|MAX\(|MIN\()\b/i.test(cleanSql)) {
      transformationType = 'AGGREGATE';
    } else if (/\bWHERE\b/i.test(cleanSql) && transformationType === 'DIRECT_COPY') {
      transformationType = 'FILTER';
    }

    return {
      sources: Array.from(sources),
      targets: Array.from(targets),
      joins,
      transformationType
    };
  }

  /**
   * Automatically records query execution into the lineage graph when a view or table is generated.
   */
  public recordQueryLineage(sql: string): void {
    const parsed = this.parseSqlLineage(sql);
    if (parsed.targets.length > 0 && parsed.sources.length > 0) {
      for (const target of parsed.targets) {
        if (!this.nodes.has(target)) {
          this.addNode({
            id: target,
            name: target,
            type: /VIEW/i.test(sql) ? 'VIEW' : 'DERIVED_TABLE',
            description: `Dynamic query generated object: ${sql.slice(0, 60)}...`,
            columns: [],
            status: 'ACTIVE'
          });
        }

        for (const source of parsed.sources) {
          const edgeId = `edge-${source}-to-${target}`;
          if (!this.edges.has(edgeId)) {
            this.addEdge({
              id: edgeId,
              sourceNodeId: source,
              targetNodeId: target,
              transformation: parsed.transformationType,
              description: `Generated from query: ${sql.slice(0, 50)}...`
            });
          }
        }
      }
    }
  }
}

export const dataLineage = new DataLineageEngine();
export const dataLineageEngine = dataLineage;
