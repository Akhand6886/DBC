import { DatabaseMetadata, SemanticRelationship } from '../types';

export const INITIAL_DATABASES: Record<string, DatabaseMetadata> = {
  postgresql: {
    id: 'postgresql',
    name: 'Production E-Commerce (PostgreSQL)',
    version: 'PostgreSQL 16.2',
    engine: 'Relational ACID Engine',
    tables: [
      {
        tableName: 'customers',
        description: 'Store enterprise customers and their purchasing tiers.',
        rowCount: 1250,
        columns: [
          { name: 'id', type: 'VARCHAR(36)', isPrimaryKey: true, description: 'Unique customer identifier' },
          { name: 'name', type: 'VARCHAR(100)', description: 'Full customer name' },
          { name: 'email', type: 'VARCHAR(255)', description: 'Contact email address' },
          { name: 'tier', type: 'VARCHAR(20)', description: 'Loyalty tier (Standard, VIP, Platinum)' },
          { name: 'status', type: 'VARCHAR(20)', description: 'Account status (active, inactive, suspended)' },
          { name: 'total_spend', type: 'DECIMAL(10,2)', description: 'Cumulative historical spend in USD' },
          { name: 'created_at', type: 'TIMESTAMP', description: 'Account registration timestamp' }
        ]
      },
      {
        tableName: 'orders',
        description: 'Customer purchase orders and status updates.',
        rowCount: 4890,
        columns: [
          { name: 'id', type: 'VARCHAR(36)', isPrimaryKey: true, description: 'Order tracking ID' },
          { name: 'customer_id', type: 'VARCHAR(36)', isForeignKey: true, references: { table: 'customers', column: 'id' }, description: 'Linked customer ID' },
          { name: 'order_date', type: 'TIMESTAMP', description: 'Date and time order was placed' },
          { name: 'status', type: 'VARCHAR(30)', description: 'Order state (completed, pending, cancelled, refunded)' },
          { name: 'total_amount', type: 'DECIMAL(10,2)', description: 'Total price including tax and shipping' },
          { name: 'payment_method', type: 'VARCHAR(30)', description: 'Payment provider used' }
        ]
      },
      {
        tableName: 'products',
        description: 'Inventory items, pricing, and stock levels.',
        rowCount: 340,
        columns: [
          { name: 'id', type: 'VARCHAR(36)', isPrimaryKey: true, description: 'Product SKU / ID' },
          { name: 'name', type: 'VARCHAR(150)', description: 'Product title' },
          { name: 'category', type: 'VARCHAR(50)', description: 'Product classification' },
          { name: 'price', type: 'DECIMAL(10,2)', description: 'Retail unit price' },
          { name: 'stock_quantity', type: 'INTEGER', description: 'Units remaining in warehouse' },
          { name: 'status', type: 'VARCHAR(20)', description: 'Availability (in_stock, out_of_stock, discontinued)' }
        ]
      }
    ]
  },
  mysql: {
    id: 'mysql',
    name: 'Enterprise HR & Payroll (MySQL)',
    version: 'MySQL 8.0.35',
    engine: 'InnoDB Transactional',
    tables: [
      {
        tableName: 'employees',
        description: 'Employee profiles, compensation, and department allocations.',
        rowCount: 850,
        columns: [
          { name: 'id', type: 'INT', isPrimaryKey: true, description: 'Employee serial ID' },
          { name: 'first_name', type: 'VARCHAR(50)', description: 'First name' },
          { name: 'last_name', type: 'VARCHAR(50)', description: 'Last name' },
          { name: 'email', type: 'VARCHAR(100)', description: 'Corporate email address' },
          { name: 'department_id', type: 'INT', isForeignKey: true, references: { table: 'departments', column: 'id' }, description: 'Department reference' },
          { name: 'salary', type: 'DECIMAL(12,2)', description: 'Annual base salary in USD' },
          { name: 'status', type: 'VARCHAR(20)', description: 'Employment state (active, on_leave, terminated)' },
          { name: 'hire_date', type: 'DATE', description: 'Employment start date' }
        ]
      },
      {
        tableName: 'departments',
        description: 'Organizational units, budgets, and managers.',
        rowCount: 12,
        columns: [
          { name: 'id', type: 'INT', isPrimaryKey: true, description: 'Department code' },
          { name: 'name', type: 'VARCHAR(80)', description: 'Department name (Engineering, Sales, HR, Finance)' },
          { name: 'location', type: 'VARCHAR(100)', description: 'Office location city' },
          { name: 'budget', type: 'DECIMAL(14,2)', description: 'Annual fiscal budget' }
        ]
      }
    ]
  },
  mongodb: {
    id: 'mongodb',
    name: 'Content & Analytics Store (MongoDB)',
    version: 'MongoDB 7.0 Enterprise',
    engine: 'WiredTiger Document Store',
    tables: [
      {
        tableName: 'articles',
        description: 'Published content articles and views.',
        rowCount: 3120,
        columns: [
          { name: '_id', type: 'ObjectId', isPrimaryKey: true, description: 'Document BSON identifier' },
          { name: 'title', type: 'String', description: 'Article header title' },
          { name: 'author_id', type: 'String', description: 'Author user ID' },
          { name: 'status', type: 'String', description: 'Publication status (published, draft, archived)' },
          { name: 'views', type: 'Number', description: 'Total reading count' },
          { name: 'category', type: 'String', description: 'Content domain' },
          { name: 'publish_date', type: 'ISODate', description: 'Release date' }
        ]
      },
      {
        tableName: 'users',
        description: 'Content portal user accounts and access roles.',
        rowCount: 5400,
        columns: [
          { name: '_id', type: 'ObjectId', isPrimaryKey: true, description: 'User document ID' },
          { name: 'username', type: 'String', description: 'Account handle' },
          { name: 'email', type: 'String', description: 'User email' },
          { name: 'role', type: 'String', description: 'Access level (admin, editor, contributor, subscriber)' },
          { name: 'status', type: 'String', description: 'Account state (active, banned, pending)' }
        ]
      }
    ]
  },
  cms: {
    id: 'cms',
    name: 'Strapi Headless CMS API Engine',
    version: 'Strapi v4.18',
    engine: 'Headless Content Graph API',
    tables: [
      {
        tableName: 'pages',
        description: 'Marketing website pages and localized content.',
        rowCount: 140,
        columns: [
          { name: 'id', type: 'INTEGER', isPrimaryKey: true, description: 'Content item ID' },
          { name: 'slug', type: 'STRING', description: 'URL route slug' },
          { name: 'title', type: 'STRING', description: 'Page meta title' },
          { name: 'status', type: 'STRING', description: 'Draft or published state' },
          { name: 'locale', type: 'STRING', description: 'ISO language code (en, es, fr, de)' }
        ]
      }
    ]
  }
};

export const SEMANTIC_RELATIONSHIPS: SemanticRelationship[] = [
  { sourceTable: 'orders', sourceColumn: 'customer_id', targetTable: 'customers', targetColumn: 'id', cardinality: 'N:1' },
  { sourceTable: 'order_items', sourceColumn: 'order_id', targetTable: 'orders', targetColumn: 'id', cardinality: 'N:1' },
  { sourceTable: 'order_items', sourceColumn: 'product_id', targetTable: 'products', targetColumn: 'id', cardinality: 'N:1' },
  { sourceTable: 'employees', sourceColumn: 'department_id', targetTable: 'departments', targetColumn: 'id', cardinality: 'N:1' },
  { sourceTable: 'articles', sourceColumn: 'author_id', targetTable: 'users', targetColumn: '_id', cardinality: 'N:1' }
];

// Initial mock dataset records for interactive queries
export const INITIAL_TABLE_DATA: Record<string, any[]> = {
  customers: [
    { id: 'CUST-101', name: 'Acme Global Corp', email: 'billing@acmeglobal.com', tier: 'Platinum', status: 'active', total_spend: 148500.00, created_at: '2023-01-15' },
    { id: 'CUST-102', name: 'Starlight Tech Inc', email: 'ops@starlight.io', tier: 'VIP', status: 'active', total_spend: 89200.50, created_at: '2023-03-22' },
    { id: 'CUST-103', name: 'Nexus Logistics', email: 'admin@nexuslog.com', tier: 'Standard', status: 'inactive', total_spend: 12400.00, created_at: '2022-11-04' },
    { id: 'CUST-104', name: 'Vanguard Systems', email: 'info@vanguard.net', tier: 'Platinum', status: 'active', total_spend: 215000.00, created_at: '2021-08-19' },
    { id: 'CUST-105', name: 'Apex Media Agency', email: 'contact@apexmedia.org', tier: 'Standard', status: 'suspended', total_spend: 4200.00, created_at: '2022-04-10' }
  ],
  orders: [
    { id: 'ORD-9001', customer_id: 'CUST-101', order_date: '2026-07-28 10:15:00', status: 'completed', total_amount: 14500.00, payment_method: 'Stripe Corporate Wire' },
    { id: 'ORD-9002', customer_id: 'CUST-102', order_date: '2026-07-29 14:20:00', status: 'completed', total_amount: 8900.50, payment_method: 'Credit Card' },
    { id: 'ORD-9003', customer_id: 'CUST-101', order_date: '2026-07-29 16:45:00', status: 'pending', total_amount: 32000.00, payment_method: 'Invoice Net 30' },
    { id: 'ORD-9004', customer_id: 'CUST-104', order_date: '2026-07-30 09:30:00', status: 'completed', total_amount: 54000.00, payment_method: 'ACH Transfer' },
    { id: 'ORD-9005', customer_id: 'CUST-103', order_date: '2026-05-12 11:00:00', status: 'cancelled', total_amount: 1200.00, payment_method: 'Credit Card' }
  ],
  products: [
    { id: 'PROD-01', name: 'Enterprise Cloud Gateway', category: 'Software', price: 4999.00, stock_quantity: 150, status: 'in_stock' },
    { id: 'PROD-02', name: 'AI Data Sentinel Probe', category: 'Hardware', price: 12500.00, stock_quantity: 42, status: 'in_stock' },
    { id: 'PROD-03', name: 'Governance Compliance Engine', category: 'Software', price: 8500.00, stock_quantity: 88, status: 'in_stock' },
    { id: 'PROD-04', name: 'Legacy SQL Converter Tool', category: 'Tooling', price: 1200.00, stock_quantity: 0, status: 'out_of_stock' }
  ],
  employees: [
    { id: 1001, first_name: 'Elena', last_name: 'Rostova', email: 'elena.rostova@company.com', department_id: 1, salary: 165000.00, status: 'active', hire_date: '2020-03-01' },
    { id: 1002, first_name: 'Marcus', last_name: 'Vance', email: 'marcus.vance@company.com', department_id: 1, salary: 142000.00, status: 'active', hire_date: '2021-06-15' },
    { id: 1003, first_name: 'Sophia', last_name: 'Chen', email: 'sophia.chen@company.com', department_id: 2, salary: 128000.00, status: 'active', hire_date: '2022-01-10' },
    { id: 1004, first_name: 'David', last_name: 'Miller', email: 'david.miller@company.com', department_id: 3, salary: 95000.00, status: 'on_leave', hire_date: '2019-11-20' },
    { id: 1005, first_name: 'Amara', last_name: 'Okafor', email: 'amara.okafor@company.com', department_id: 4, salary: 180000.00, status: 'active', hire_date: '2018-09-01' }
  ],
  departments: [
    { id: 1, name: 'Core Engineering', location: 'San Francisco, CA', budget: 4500000.00 },
    { id: 2, name: 'Data Governance & Security', location: 'New York, NY', budget: 2800000.00 },
    { id: 3, name: 'Customer Success', location: 'Austin, TX', budget: 1200000.00 },
    { id: 4, name: 'Executive Operations', location: 'San Francisco, CA', budget: 3100000.00 }
  ],
  articles: [
    { _id: 'art_65a01', title: 'Zero-Trust AI Data Governance in Modern Enterprises', author_id: 'usr_88', status: 'published', views: 14200, category: 'Security', publish_date: '2026-06-15' },
    { _id: 'art_65a02', title: 'Why Deterministic Intent Routing Saves Millions in LLM Costs', author_id: 'usr_88', status: 'published', views: 28900, category: 'Architecture', publish_date: '2026-07-02' },
    { _id: 'art_65a03', title: 'Automated Pre-Execution Database Snapshots & Rollback', author_id: 'usr_92', status: 'published', views: 9800, category: 'DevOps', publish_date: '2026-07-20' }
  ],
  users: [
    { _id: 'usr_88', username: 'dr_sarah_conner', email: 'sarah.c@ai-research.org', role: 'admin', status: 'active' },
    { _id: 'usr_92', username: 'alex_devops', email: 'alex@cloudops.net', role: 'editor', status: 'active' }
  ],
  pages: [
    { id: 1, slug: 'home', title: 'Enterprise Conversational Data Platform', status: 'published', locale: 'en' },
    { id: 2, slug: 'pricing', title: 'Transparent Governance Tiering', status: 'published', locale: 'en' },
    { id: 3, slug: 'security-compliance', title: 'ISO 27001 & SOC2 Type II Certified', status: 'published', locale: 'en' }
  ]
};
