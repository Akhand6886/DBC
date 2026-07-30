import { DatabaseType, UserRole, ExecutionPlan } from '../types';
import { INITIAL_TABLE_DATA } from './initialData';
import { queryCache } from '../router/queryCache';
import { classifyIntent } from '../router/intentClassifier';
import { resolveSemanticJoins } from '../router/semanticLayer';
import { runLLMReasoning } from '../router/llmEngine';
import { evaluateRisk } from '../governance/riskScorer';
import { backupManager } from '../governance/backupManager';
import { auditLogger } from '../governance/auditLogger';

export function executeQueryPlan(
  queryText: string,
  dbType: DatabaseType,
  user: string = 'sarah.conner@enterprise.com',
  userRole: UserRole = 'Admin',
  forceApprovalSubmit: boolean = false
): ExecutionPlan {
  const startTime = Date.now();

  // 1. Check Query Execution Cache
  const cachedPlan = queryCache.get(dbType, queryText);
  if (cachedPlan && !forceApprovalSubmit) {
    auditLogger.logExecution(cachedPlan);
    return cachedPlan;
  }

  // 2. Classify Intent & Calculate Confidence Score
  const intent = classifyIntent(queryText, dbType);
  const targetTable = intent.targetTable;

  // 3. Determine Routing Path
  const isFastPath = intent.confidenceScore >= 75 && intent.action !== 'ANALYTICAL' && intent.action !== 'DELETE' && intent.action !== 'UPDATE';
  const routePath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'LLM_REASONING_PATH';

  let generatedQuery = '';
  const semanticJoinsApplied: string[] = [];
  let executionLatencyMs = 0;
  let resultData: any[] = [];
  let affectedRows = 0;

  if (isFastPath) {
    // Fast Path (Deterministic Template + Semantic Layer)
    executionLatencyMs = Math.floor(Math.random() * 4) + 2; // ~2-6ms latency

    const joinInfo = resolveSemanticJoins(targetTable, queryText);
    if (joinInfo.joinedTable) {
      semanticJoinsApplied.push(joinInfo.joinDescription!);
      generatedQuery = dbType === 'mongodb'
        ? `db.${targetTable}.aggregate([{ $lookup: { from: "${joinInfo.joinedTable}", ... } }])`
        : `SELECT * FROM ${targetTable} JOIN ${joinInfo.joinedTable} ON ${joinInfo.joinCondition}`;
    } else if (intent.action === 'COUNT') {
      generatedQuery = dbType === 'mongodb'
        ? `db.${targetTable}.countDocuments({})`
        : `SELECT COUNT(*) FROM ${targetTable};`;
    } else if (intent.action === 'SCHEMA_INSPECT') {
      generatedQuery = dbType === 'mongodb'
        ? `db.${targetTable}.getIndexes()`
        : `DESCRIBE ${targetTable};`;
    } else {
      const whereClause = intent.filters
        ? Object.entries(intent.filters).map(([k, v]) => `${k} = '${v}'`).join(' AND ')
        : '';
      generatedQuery = dbType === 'mongodb'
        ? `db.${targetTable}.find(${JSON.stringify(intent.filters || {})})`
        : `SELECT * FROM ${targetTable}${whereClause ? ' WHERE ' + whereClause : ''};`;
    }
  } else {
    // Amber Path (LLM Reasoning Engine)
    executionLatencyMs = Math.floor(Math.random() * 150) + 780; // ~780-930ms latency

    const llmResult = runLLMReasoning(queryText, dbType, targetTable);
    generatedQuery = llmResult.generatedQuery;
  }

  // 4. Evaluate Guardrail & Risk Scorer
  const riskAnalysis = evaluateRisk(intent.action, targetTable, queryText, userRole);

  // 5. Pre-Execution Backup Generation for High Risk / Destructive Actions
  let snapshotId: string | undefined = undefined;
  const rawTableData = INITIAL_TABLE_DATA[targetTable] || [];

  if (riskAnalysis.requiresApproval && !riskAnalysis.isBlockedByRBAC) {
    const snapshot = backupManager.createSnapshot(dbType, targetTable, queryText, rawTableData);
    snapshotId = snapshot.id;
  }

  // 6. Execution vs Block / Pending Approval
  let planStatus: 'SUCCESS' | 'BLOCKED' | 'PENDING_APPROVAL' = 'SUCCESS';
  let errorMessage: string | undefined = undefined;

  if (riskAnalysis.isBlockedByRBAC) {
    planStatus = 'BLOCKED';
    errorMessage = riskAnalysis.blockReason;
  } else if (riskAnalysis.requiresApproval && !forceApprovalSubmit) {
    planStatus = 'PENDING_APPROVAL';
  } else {
    // Perform simulated query execution against dataset
    if (intent.action === 'DELETE') {
      const remaining = rawTableData.slice(0, Math.max(1, Math.floor(rawTableData.length / 2)));
      affectedRows = rawTableData.length - remaining.length;
      INITIAL_TABLE_DATA[targetTable] = remaining;
      resultData = [{ message: `Successfully deleted ${affectedRows} record(s) from table '${targetTable}'.`, status: 'OK' }];
    } else if (intent.action === 'UPDATE') {
      affectedRows = rawTableData.length;
      resultData = [{ message: `Successfully updated ${affectedRows} record(s) in table '${targetTable}'.`, status: 'OK' }];
    } else if (intent.action === 'COUNT') {
      resultData = [{ count: rawTableData.length, table: targetTable }];
      affectedRows = rawTableData.length;
    } else {
      // Filter dataset if applicable
      if (intent.filters && Object.keys(intent.filters).length > 0) {
        resultData = rawTableData.filter(row => {
          return Object.entries(intent.filters!).every(([k, v]) => String(row[k]).toLowerCase() === String(v).toLowerCase());
        });
      } else {
        resultData = rawTableData;
      }
      affectedRows = resultData.length;
    }
  }

  const executionPlan: ExecutionPlan = {
    id: `PLAN-${Date.now().toString(36).toUpperCase()}`,
    queryText,
    dbType,
    user,
    userRole,
    routePath,
    confidenceScore: intent.confidenceScore,
    cacheHit: false,
    parsedIntent: intent,
    semanticJoinsApplied,
    generatedQuery,
    riskScore: riskAnalysis.riskScore,
    riskLevel: riskAnalysis.riskLevel,
    riskReasons: riskAnalysis.reasons,
    requiresApproval: riskAnalysis.requiresApproval,
    approvalStatus: planStatus === 'PENDING_APPROVAL' ? 'PENDING' : forceApprovalSubmit ? 'APPROVED' : undefined,
    snapshotId,
    executionTimeMs: executionLatencyMs,
    status: planStatus,
    affectedRows,
    resultData,
    error: errorMessage,
    timestamp: new Date().toISOString()
  };

  // Cache successful fast-path queries
  if (planStatus === 'SUCCESS' && isFastPath) {
    queryCache.set(dbType, queryText, executionPlan);
  }

  // Record audit log
  auditLogger.logExecution(executionPlan);

  return executionPlan;
}
