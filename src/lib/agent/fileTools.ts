import { verifyAndCreateShadowDiff } from '../verification/shadowBuffer';
import { ShadowDiffCheck } from '../types';

export class FileToolsEngine {
  public readFile(filePath: string, currentWorkspace: Record<string, string>): string {
    return currentWorkspace[filePath] || `// File ${filePath} empty or not found`;
  }

  public writeFileWithBackup(
    filePath: string,
    originalContent: string,
    proposedContent: string
  ): { diffCheck: ShadowDiffCheck; success: boolean } {
    const diffCheck = verifyAndCreateShadowDiff(filePath, originalContent, proposedContent);
    return {
      diffCheck,
      success: diffCheck.syntaxCheckPassed
    };
  }
}

export const fileTools = new FileToolsEngine();
