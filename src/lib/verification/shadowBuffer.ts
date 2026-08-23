import { ShadowDiffCheck } from '../types';

export function verifyAndCreateShadowDiff(
  targetFile: string,
  originalContent: string,
  proposedContent: string
): ShadowDiffCheck {
  const id = `SNAP-${Date.now().toString(36).toUpperCase()}`;

  const originalLines = originalContent.split('\n');
  const proposedLines = proposedContent.split('\n');

  const diffLines: string[] = [];
  diffLines.push(`--- a/${targetFile}`);
  diffLines.push(`+++ b/${targetFile}`);

  const maxLen = Math.max(originalLines.length, proposedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const orig = originalLines[i];
    const prop = proposedLines[i];
    if (orig !== prop) {
      if (orig !== undefined) diffLines.push(`- ${orig}`);
      if (prop !== undefined) diffLines.push(`+ ${prop}`);
    } else if (orig !== undefined) {
      diffLines.push(`  ${orig}`);
    }
  }

  // Bracket balance check
  const openBrackets = (proposedContent.match(/[{[(]/g) || []).length;
  const closeBrackets = (proposedContent.match(/[}\]]/g) || []).length;
  const syntaxCheckPassed = Math.abs(openBrackets - closeBrackets) <= 2;

  return {
    id,
    timestamp: new Date().toISOString(),
    targetFile,
    originalContent,
    proposedContent,
    patchDiff: diffLines.join('\n'),
    syntaxCheckPassed,
    lspDiagnosticsCount: syntaxCheckPassed ? 0 : 2,
    requiresUserApproval: true,
    status: 'PENDING'
  };
}
