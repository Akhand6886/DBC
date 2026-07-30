import { UserRole, RiskLevel, IntentAction } from '../types';

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  requiresApproval: boolean;
  isBlockedByRBAC: boolean;
  blockReason?: string;
}

export function evaluateRisk(
  action: IntentAction,
  targetTable: string,
  queryText: string,
  userRole: UserRole
): RiskAnalysis {
  const text = queryText.toLowerCase();
  const reasons: string[] = [];
  let riskScore = 10;
  let isBlockedByRBAC = false;
  let blockReason: string | undefined = undefined;

  // 1. RBAC Guardrail Enforcement
  if (userRole === 'Read-Only Viewer') {
    if (action === 'DELETE' || action === 'UPDATE' || action === 'INSERT') {
      isBlockedByRBAC = true;
      blockReason = `Role '${userRole}' is restricted from performing write/delete operations on database tables.`;
    }
  } else if (userRole === 'Data Analyst') {
    if (action === 'DELETE' || text.includes('drop table')) {
      isBlockedByRBAC = true;
      blockReason = `Role '${userRole}' is restricted from performing destructive schema or table deletion operations.`;
    }
  }

  // 2. Risk Calculation Heuristics
  if (action === 'DELETE') {
    riskScore += 65;
    reasons.push('Destructive DELETE operation target');
    if (!text.includes('where')) {
      riskScore += 25;
      reasons.push('CRITICAL WARNING: Unbounded DELETE without WHERE clause! Would purge entire table.');
    }
  } else if (action === 'UPDATE') {
    riskScore += 45;
    reasons.push('State mutation UPDATE operation');
    if (!text.includes('where')) {
      riskScore += 30;
      reasons.push('WARNING: Bulk UPDATE without WHERE clause! Modifies all rows in table.');
    }
  } else if (action === 'INSERT') {
    riskScore += 20;
    reasons.push('Data insertion operation');
  } else if (action === 'ANALYTICAL') {
    riskScore += 15;
    reasons.push('Complex multi-row analytics query');
  } else {
    reasons.push('Standard read-only query operation');
  }

  // Target table sensitivity check
  if (targetTable === 'customers' || targetTable === 'employees') {
    riskScore += 10;
    reasons.push('Target table contains sensitive enterprise PII data');
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel: RiskLevel = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  const requiresApproval = riskScore >= 60 || isBlockedByRBAC;

  return {
    riskScore,
    riskLevel,
    reasons,
    requiresApproval,
    isBlockedByRBAC,
    blockReason
  };
}
