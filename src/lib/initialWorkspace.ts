import { FileNode } from './types';

export const INITIAL_WORKSPACE: FileNode[] = [
  {
    id: 'f-1',
    name: 'src',
    path: 'src',
    language: 'directory',
    content: '',
    isFolder: true,
    children: [
      {
        id: 'f-1-1',
        name: 'index.ts',
        path: 'src/index.ts',
        language: 'typescript',
        content: `import { confidenceRouter } from './router/confidenceRouter';
import { symbolGraph } from './sidecar/symbolGraph';

export function main() {
  console.log("Initializing Agentic AI IDE Core...");
  const intent = confidenceRouter.classify("rename function main to executeApp");
  console.log("Router Intent:", intent);
}

main();`
      },
      {
        id: 'f-1-2',
        name: 'router',
        path: 'src/router',
        language: 'directory',
        content: '',
        isFolder: true,
        children: [
          {
            id: 'f-1-2-1',
            name: 'confidenceRouter.ts',
            path: 'src/router/confidenceRouter.ts',
            language: 'typescript',
            content: `export class ConfidenceRouter {
  public classify(prompt: string) {
    const isStructural = prompt.includes("rename") || prompt.includes("format");
    return {
      confidenceScore: isStructural ? 98 : 35,
      routePath: isStructural ? "DETERMINISTIC_FAST_PATH" : "AGENTIC_LLM_PATH"
    };
  }
}

export const confidenceRouter = new ConfidenceRouter();`
          }
        ]
      },
      {
        id: 'f-1-3',
        name: 'sidecar',
        path: 'src/sidecar',
        language: 'directory',
        content: '',
        isFolder: true,
        children: [
          {
            id: 'f-1-3-1',
            name: 'symbolGraph.rs',
            path: 'src/sidecar/symbolGraph.rs',
            language: 'rust',
            content: `use tree_sitter::{Parser, Language};

pub struct SymbolGraph {
    pub file_count: usize,
}

impl SymbolGraph {
    pub fn new() -> Self {
        SymbolGraph { file_count: 42 }
    }
}`
          }
        ]
      }
    ]
  },
  {
    id: 'f-2',
    name: 'package.json',
    path: 'package.json',
    language: 'json',
    content: `{
  "name": "agentic-ide-core",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "build": "tsc"
  }
}`
  },
  {
    id: 'f-3',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: `# Agentic AI IDE Platform

Deterministic Fast-Path + Agentic LLM Hybrid Coding Environment.`
  }
];
