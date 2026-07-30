'use client';

import React from 'react';
import { DatabaseType, UserRole } from '../lib/types';
import { INITIAL_DATABASES } from '../lib/db/initialData';
import { ShieldCheck, Database, UserCheck, Zap, Activity } from 'lucide-react';

interface HeaderProps {
  currentDb: DatabaseType;
  onDbChange: (db: DatabaseType) => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDb,
  onDbChange,
  currentRole,
  onRoleChange,
}) => {
  const dbInfo = INITIAL_DATABASES[currentDb];

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">DBC Intelligence</h1>
              <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.4 Governed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-Based Intelligent Data Management & Governance System
            </p>
          </div>
        </div>

        {/* System Controls: DB Switcher & Role Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active DB Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 space-x-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <select
              value={currentDb}
              onChange={(e) => onDbChange(e.target.value as DatabaseType)}
              aria-label="Select Target Database"
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="postgresql">PostgreSQL (E-Commerce)</option>
              <option value="mysql">MySQL (HR & Payroll)</option>
              <option value="mongodb">MongoDB (Content Store)</option>
              <option value="cms">Strapi CMS (Content Graph)</option>
            </select>
          </div>

          {/* User Role Selector (RBAC simulation) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 space-x-2">
            <UserCheck className="h-4 w-4 text-indigo-400" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              aria-label="Select User Role"
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Admin">Role: Admin (Full Access)</option>
              <option value="Data Engineer">Role: Data Engineer</option>
              <option value="Data Analyst">Role: Data Analyst</option>
              <option value="Read-Only Viewer">Role: Read-Only Viewer</option>
            </select>
          </div>

          {/* Live System Status Badges */}
          <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Guardrails</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>Fast-Path Cache</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
