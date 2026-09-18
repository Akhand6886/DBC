/**
 * DBC Database Domain Memory & Business Context Engine
 * Stores business semantics, column value dictionaries, domain invariants,
 * and learned query patterns to ground AI agents in organizational context.
 */

export interface TableBusinessAnnotation {
  tableName: string;
  description: string;
  primaryPurpose: string;
  ownerTeam?: string;
  tags?: string[];
}

export interface ColumnBusinessAnnotation {
  columnName: string;
  description: string;
  valueMeanings?: Record<string, string>;
  isPii?: boolean;
  exampleValues?: string[];
}

export interface DomainBusinessRule {
  id: string;
  title: string;
  rule: string;
  severity: 'MANDATORY' | 'RECOMMENDED' | 'INFORMATIONAL';
  affectedTables: string[];
  createdAt: string;
}

export interface LearnedQueryPattern {
  id: string;
  title: string;
  description: string;
  sampleSql: string;
  recommendedIndex?: string;
}

export interface DatabaseMemoryState {
  tables: Record<string, TableBusinessAnnotation>;
  columns: Record<string, Record<string, ColumnBusinessAnnotation>>;
  rules: DomainBusinessRule[];
  patterns: LearnedQueryPattern[];
}

const STORAGE_KEY = 'dbc_database_domain_memory_v1';

export const INITIAL_DATABASE_MEMORY: DatabaseMemoryState = {
  tables: {
    users: {
      tableName: 'users',
      description: 'Core developer, customer, agent, and administrator identity repository.',
      primaryPurpose: 'Authentication, credential tracking, and workspace permissions.',
      ownerTeam: 'Platform Security',
      tags: ['auth', 'core', 'audit']
    },
    customers: {
      tableName: 'customers',
      description: 'Enterprise and retail customer accounts and subscription metadata.',
      primaryPurpose: 'Billing, CRM synchronization, and contract lifecycle management.',
      ownerTeam: 'Revenue Operations',
      tags: ['crm', 'billing', 'core']
    },
    orders: {
      tableName: 'orders',
      description: 'Transactional purchase orders placed by enterprise customers.',
      primaryPurpose: 'Order fulfillment, invoicing, and revenue reporting.',
      ownerTeam: 'Commerce Engineering',
      tags: ['ecommerce', 'orders', 'finance']
    },
    products: {
      tableName: 'products',
      description: 'Hardware, software licenses, and database appliances catalog.',
      primaryPurpose: 'Inventory, SKU management, and pricing calculations.',
      ownerTeam: 'Product Management',
      tags: ['catalog', 'pricing']
    },
    transactions: {
      tableName: 'transactions',
      description: 'Payment settlement and ledger entries tied to customer orders.',
      primaryPurpose: 'Financial audit, payment gateway reconciliations, and tax accounting.',
      ownerTeam: 'Finance & Compliance',
      tags: ['payments', 'ledger', 'audit']
    },
    roles: {
      tableName: 'roles',
      description: 'System roles and permission level catalog.',
      primaryPurpose: 'Role-based access control (RBAC) definitions.',
      ownerTeam: 'Platform Security',
      tags: ['rbac', 'security']
    }
  },
  columns: {
    users: {
      role_id: {
        columnName: 'role_id',
        description: 'Foreign key referencing roles table.',
        valueMeanings: {
          '1': 'Administrator (full root permissions)',
          '2': 'API Agent (autonomous tool invocation profile)'
        },
        isPii: false
      },
      email: {
        columnName: 'email',
        description: 'Primary verified contact address for operator notifications.',
        isPii: true
      },
      deleted_at: {
        columnName: 'deleted_at',
        description: 'Soft deletion timestamp. Non-null indicates account was deactivated without physical row removal.',
        isPii: false
      },
      status: {
        columnName: 'status',
        description: 'Account activity state: active, inactive, or suspended.',
        valueMeanings: {
          'active': 'Active standing, authorized for production API access',
          'inactive': 'Dormant user account flagged for archival review',
          'suspended': 'Security compliance lock'
        }
      }
    },
    customers: {
      customer_status: {
        columnName: 'customer_status',
        description: 'Numeric subscription lifecycle state code.',
        valueMeanings: {
          '1': 'Active Enterprise Subscription',
          '2': 'Trial / Evaluation Tier',
          '3': 'Subscription Cancelled'
        },
        isPii: false
      },
      last_order_date: {
        columnName: 'last_order_date',
        description: 'Timestamp of the most recent completed order. Used to detect churn (>6 months dormancy).'
      }
    },
    orders: {
      amount: {
        columnName: 'amount',
        description: 'Net order value in USD, strictly excluding sales tax and shipping surcharges.',
        exampleValues: ['249.50', '1450.00', '2100.00']
      },
      customer_id: {
        columnName: 'customer_id',
        description: 'Foreign key linking order to customers(id).'
      }
    }
  },
  rules: [
    {
      id: 'rule-admin-protect',
      title: 'Administrator Identity Protection',
      rule: 'Never modify or delete user with id = 1 (Administrator root credential).',
      severity: 'MANDATORY',
      affectedTables: ['users'],
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 'rule-soft-delete',
      title: 'Soft-Delete & Audit Requirement',
      rule: 'Prefer setting deleted_at = CURRENT_TIMESTAMP over hard DELETE operations.',
      severity: 'RECOMMENDED',
      affectedTables: ['users', 'customers'],
      createdAt: new Date().toLocaleDateString()
    },
    {
      id: 'rule-unbounded-select',
      title: 'Mandatory LIMIT on Interactive Queries',
      rule: 'All ad-hoc SELECT queries against transactions or users must specify a LIMIT clause.',
      severity: 'MANDATORY',
      affectedTables: ['transactions', 'users'],
      createdAt: new Date().toLocaleDateString()
    }
  ],
  patterns: [
    {
      id: 'pattern-user-roles',
      title: 'User Identity & Role Join',
      description: 'Standard relational join resolving user accounts to role titles.',
      sampleSql: 'SELECT u.id, u.username, u.email, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.id;',
      recommendedIndex: 'CREATE INDEX idx_users_role_id ON users(role_id);'
    }
  ]
};

export class DatabaseMemoryManager {
  private state: DatabaseMemoryState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  private loadState(): DatabaseMemoryState {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(INITIAL_DATABASE_MEMORY));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.tables && parsed.rules) {
          return {
            tables: { ...INITIAL_DATABASE_MEMORY.tables, ...parsed.tables },
            columns: { ...INITIAL_DATABASE_MEMORY.columns, ...(parsed.columns || {}) },
            rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 ? parsed.rules : INITIAL_DATABASE_MEMORY.rules,
            patterns: Array.isArray(parsed.patterns) && parsed.patterns.length > 0 ? parsed.patterns : INITIAL_DATABASE_MEMORY.patterns
          };
        }
      }
    } catch {
      // ignore parsing error
    }
    return JSON.parse(JSON.stringify(INITIAL_DATABASE_MEMORY));
  }

  public saveState(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.error('Failed to persist database memory:', err);
      }
    }
    this.notify();
  }

  /**
   * Reset database memory state to clean default seed values
   * and sync to localStorage cache.
   */
  public resetToDefaults(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATABASE_MEMORY));
    this.saveState();
  }

  public getState(): DatabaseMemoryState {
    return { ...this.state };
  }

  public getTableAnnotation(tableName: string): TableBusinessAnnotation | undefined {
    return this.state.tables[tableName.toLowerCase()];
  }

  public setTableAnnotation(annotation: TableBusinessAnnotation): void {
    this.state.tables[annotation.tableName.toLowerCase()] = annotation;
    this.saveState();
  }

  public getColumnAnnotation(tableName: string, colName: string): ColumnBusinessAnnotation | undefined {
    return this.state.columns[tableName.toLowerCase()]?.[colName.toLowerCase()];
  }

  public setColumnAnnotation(tableName: string, annotation: ColumnBusinessAnnotation): void {
    const tKey = tableName.toLowerCase();
    if (!this.state.columns[tKey]) this.state.columns[tKey] = {};
    this.state.columns[tKey][annotation.columnName.toLowerCase()] = annotation;
    this.saveState();
  }

  public getRules(): DomainBusinessRule[] {
    return [...this.state.rules];
  }

  public addRule(rule: Omit<DomainBusinessRule, 'id' | 'createdAt'>): DomainBusinessRule {
    const newRule: DomainBusinessRule = {
      ...rule,
      id: `rule-${Date.now().toString(36)}`,
      createdAt: new Date().toLocaleDateString()
    };
    this.state.rules.unshift(newRule);
    this.saveState();
    return newRule;
  }

  public removeRule(ruleId: string): void {
    this.state.rules = this.state.rules.filter(r => r.id !== ruleId);
    this.saveState();
  }

  public getPatterns(): LearnedQueryPattern[] {
    return [...this.state.patterns];
  }

  public addPattern(pattern: Omit<LearnedQueryPattern, 'id'>): LearnedQueryPattern {
    const newPat: LearnedQueryPattern = {
      ...pattern,
      id: `pat-${Date.now().toString(36)}`
    };
    this.state.patterns.unshift(newPat);
    this.saveState();
    return newPat;
  }

  /**
   * Generates a rich, Markdown-formatted semantic context block
   * for injecting into LLM system prompts and agent instructions.
   */
  public getEnrichedSchemaContext(targetTable?: string): string {
    const lines: string[] = ['### Organizational Database Memory & Business Context'];

    // 1. Business Invariant Rules
    lines.push('\n**Active Domain Business Rules**:');
    this.state.rules.forEach(r => {
      const icon = r.severity === 'MANDATORY' ? '⛔ [MANDATORY]' : '⚠️ [RECOMMENDED]';
      lines.push(`- ${icon} **${r.title}**: ${r.rule} (Targets: ${r.affectedTables.join(', ')})`);
    });

    // 2. Table Semantics
    lines.push('\n**Table Semantic Dictionary**:');
    const tableKeys = targetTable
      ? [targetTable.toLowerCase()].filter(t => this.state.tables[t])
      : Object.keys(this.state.tables);

    tableKeys.forEach(tKey => {
      const t = this.state.tables[tKey];
      if (t) {
        lines.push(`- \`${t.tableName}\`: ${t.description} (Purpose: ${t.primaryPurpose})`);
        const cols = this.state.columns[tKey];
        if (cols) {
          Object.values(cols).forEach(c => {
            let meaningStr = '';
            if (c.valueMeanings) {
              meaningStr = ` [Values: ${Object.entries(c.valueMeanings).map(([k, v]) => `${k}='${v}'`).join(', ')}]`;
            }
            lines.push(`  • \`${c.columnName}\`: ${c.description}${c.isPii ? ' (PII - MASK)' : ''}${meaningStr}`);
          });
        }
      }
    });

    // 3. Recommended Query Patterns
    if (this.state.patterns.length > 0) {
      lines.push('\n**Common Query Patterns**:');
      this.state.patterns.slice(0, 2).forEach(p => {
        lines.push(`- **${p.title}**: \`${p.sampleSql}\``);
      });
    }

    return lines.join('\n');
  }
}

export const dbMemory = new DatabaseMemoryManager();
