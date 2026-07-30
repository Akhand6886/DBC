import { AuditLogEntry, ExecutionPlan } from '../types';

class AuditLogger {
  private logs: AuditLogEntry[] = [];

  constructor() {
    // Populate initial seed audit logs for immediate demonstration
    this.logs = [
      {
        id: 'AUD-901',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'sarah.conner@enterprise.com',
        userRole: 'Admin',
        dbType: 'postgresql',
        queryText: 'Show active customers with total spend > 50000',
        routePath: 'DETERMINISTIC_FAST_PATH',
        confidenceScore: 96,
        riskScore: 10,
        riskLevel: 'LOW',
        action: 'SELECT',
        status: 'SUCCESS',
        executionTimeMs: 4,
        generatedQuery: `SELECT * FROM customers WHERE status = 'active' AND total_spend > 50000;`,
        traceDetails: {
          cacheHit: false,
          joinsUsed: [],
          snapshotTaken: false
        }
      },
      {
        id: 'AUD-902',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        user: 'alex.devops@enterprise.com',
        userRole: 'Data Engineer',
        dbType: 'postgresql',
        queryText: 'Delete inactive customers created before 2023',
        routePath: 'LLM_REASONING_PATH',
        confidenceScore: 92,
        riskScore: 85,
        riskLevel: 'CRITICAL',
        action: 'DELETE',
        status: 'SUCCESS',
        executionTimeMs: 820,
        generatedQuery: `DELETE FROM customers WHERE status = 'inactive' AND created_at < '2023-01-01';`,
        traceDetails: {
          cacheHit: false,
          joinsUsed: [],
          snapshotTaken: true,
          snapshotId: 'SNAP-K9X2P1-482'
        }
      }
    ];
  }

  public logExecution(plan: ExecutionPlan): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: plan.timestamp,
      user: plan.user,
      userRole: plan.userRole,
      dbType: plan.dbType,
      queryText: plan.queryText,
      routePath: plan.routePath,
      confidenceScore: plan.confidenceScore,
      riskScore: plan.riskScore,
      riskLevel: plan.riskLevel,
      action: plan.parsedIntent?.action || 'SELECT',
      status: plan.status === 'BLOCKED' ? 'BLOCKED' : plan.status === 'SUCCESS' ? 'SUCCESS' : 'BLOCKED',
      executionTimeMs: plan.executionTimeMs,
      generatedQuery: plan.generatedQuery,
      traceDetails: {
        cacheHit: plan.cacheHit,
        joinsUsed: plan.semanticJoinsApplied,
        snapshotTaken: !!plan.snapshotId,
        snapshotId: plan.snapshotId
      }
    };

    this.logs.unshift(entry);
    return entry;
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public filterLogs(searchTerm: string, routeFilter?: string, riskFilter?: string): AuditLogEntry[] {
    return this.logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.queryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.generatedQuery.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRoute = !routeFilter || routeFilter === 'ALL' || log.routePath === routeFilter;
      const matchesRisk = !riskFilter || riskFilter === 'ALL' || log.riskLevel === riskFilter;

      return matchesSearch && matchesRoute && matchesRisk;
    });
  }
}

export const auditLogger = new AuditLogger();
