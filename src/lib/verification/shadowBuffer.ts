import { ShadowDiffCheck } from '../types';

/**
 * Strips comments and string literals so bracket balancing is not distorted
 * by parentheses or brackets inside comments or strings.
 */
export function stripStringsAndComments(code: string): string {
  // 1. Strip multi-line comments /* ... */
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // 2. Strip single line comments // ... and SQL comments -- ...
  cleaned = cleaned.replace(/(\/\/|--)[^\n]*/g, '');
  // 3. Strip double-quoted strings
  cleaned = cleaned.replace(/"(\\.|[^"\\])*"/g, '""');
  // 4. Strip single-quoted strings (handling SQL '' escape too)
  cleaned = cleaned.replace(/'(\\.|''|[^'\\])*'/g, "''");
  // 5. Strip template literals
  cleaned = cleaned.replace(/`(\\.|[^`\\])*`/g, '``');
  return cleaned;
}

/**
 * VF-02: Validates matching pairs of (), [], {} with exact 0 tolerance.
 */
export function validateSyntaxBrackets(code: string): {
  syntaxCheckPassed: boolean;
  unclosedCount: number;
  errors: string[];
} {
  const cleaned = stripStringsAndComments(code);
  const stack: { char: string; index: number }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push({ char: ch, index: i });
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (stack.length === 0) {
        errors.push(`Unexpected closing bracket '${ch}' at index ${i}`);
      } else {
        const top = stack.pop()!;
        const expected = top.char === '(' ? ')' : top.char === '[' ? ']' : '}';
        if (ch !== expected) {
          errors.push(
            `Mismatched bracket: expected '${expected}' to close '${top.char}', found '${ch}' at index ${i}`
          );
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    errors.push(`Unclosed bracket '${unclosed.char}'`);
  }

  return {
    syntaxCheckPassed: errors.length === 0,
    unclosedCount: errors.length,
    errors
  };
}

/**
 * VF-01: Longest Common Subsequence (LCS) unified line differ.
 * Accurately aligns unchanged blocks when lines are inserted or deleted.
 */
export function computeLcsDiff(originalLines: string[], proposedLines: string[]): string[] {
  const m = originalLines.length;
  const n = proposedLines.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) return proposedLines.map((line) => `+ ${line}`);
  if (n === 0) return originalLines.map((line) => `- ${line}`);

  // DP table for Longest Common Subsequence
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (originalLines[i] === proposedLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to recover unified diff lines
  const diffLines: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === proposedLines[j - 1]) {
      diffLines.unshift(`  ${originalLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.unshift(`+ ${proposedLines[j - 1]}`);
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffLines.unshift(`- ${originalLines[i - 1]}`);
      i--;
    }
  }

  return diffLines;
}

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

  // VF-01: Myers / LCS line differ
  const lcsDiff = computeLcsDiff(originalLines, proposedLines);
  diffLines.push(...lcsDiff);

  // VF-02: Strict syntax and bracket balance verification
  const syntaxCheck = validateSyntaxBrackets(proposedContent);

  return {
    id,
    timestamp: new Date().toISOString(),
    targetFile,
    originalContent,
    proposedContent,
    patchDiff: diffLines.join('\n'),
    syntaxCheckPassed: syntaxCheck.syntaxCheckPassed,
    lspDiagnosticsCount: syntaxCheck.syntaxCheckPassed ? 0 : syntaxCheck.unclosedCount,
    requiresUserApproval: true,
    status: 'PENDING'
  };
}
