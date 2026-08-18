import { FileNode } from './types';

export const INITIAL_WORKSPACE: FileNode[] = [
  {
    id: 'folder-queries',
    name: 'queries',
    path: 'queries',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: 'file-users-report',
        name: 'users_report.sql',
        path: 'queries/users_report.sql',
        language: 'sql',
        content: `-- User Analytics & Role Reporting Query\nSELECT \n  u.id,\n  u.username,\n  u.email,\n  r.role_name\nFROM users u\nJOIN roles r ON u.role_id = r.id\nWHERE u.created_at >= '2026-01-01'\nORDER BY u.id DESC\nLIMIT 10;`
      },
      {
        id: 'file-slow-queries',
        name: 'slow_queries_check.sql',
        path: 'queries/slow_queries_check.sql',
        language: 'sql',
        content: `-- Query Execution Plan Optimization Check\nEXPLAIN ANALYZE\nSELECT * FROM users\nWHERE email LIKE '%@dbc.org';`
      }
    ]
  },
  {
    id: 'folder-migrations',
    name: 'migrations',
    path: 'migrations',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: 'file-mig-001',
        name: '001_initial_schema.sql',
        path: 'migrations/001_initial_schema.sql',
        language: 'sql',
        content: `-- Initial Database Schema Migration\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  username VARCHAR(255) NOT NULL UNIQUE,\n  email VARCHAR(255) NOT NULL,\n  role_id INTEGER REFERENCES roles(id),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE roles (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  role_name VARCHAR(100) NOT NULL\n);`
      }
    ]
  },
  {
    id: 'folder-src',
    name: 'src',
    path: 'src',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: 'file-index',
        name: 'index.ts',
        path: 'src/index.ts',
        language: 'typescript',
        content: `// Agentic DBMS Controller Core Engine\nexport function executeApp() {\n  console.log("DBMS Orchestrator initialized.");\n}`
      },
      {
        id: 'file-config',
        name: 'dbConfig.json',
        path: 'src/dbConfig.json',
        language: 'json',
        content: `{\n  "dbEngine": "sqlite",\n  "maxConnections": 10,\n  "queryTimeoutMs": 5000\n}`
      }
    ]
  },
  {
    id: 'file-readme',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: `# Agentic DBMS Studio IDE\nSpecialized Database Management System IDE with real SQL execution, schema diffing, and visual EXPLAIN ANALYZE node graphs.`
  }
];
