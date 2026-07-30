'use client';

import React, { useState } from 'react';
import { DatabaseType, UserRole, ExecutionPlan } from '../lib/types';
import { Header } from '../components/Header';
import { Navigation, TabType } from '../components/Navigation';
import { ChatConsole } from '../components/ChatConsole';
import { ErdVisualizer } from '../components/ErdVisualizer';
import { GovernanceView } from '../components/GovernanceView';
import { AuditLogView } from '../components/AuditLogView';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export default function Home() {
  const [currentDb, setCurrentDb] = useState<DatabaseType>('postgresql');
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const handlePlanExecuted = (plan: ExecutionPlan) => {
    if (plan.status === 'PENDING_APPROVAL') {
      setPendingApprovalsCount((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* App Header */}
      <Header
        currentDb={currentDb}
        onDbChange={setCurrentDb}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Tab Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'console' && (
          <ChatConsole
            currentDb={currentDb}
            currentRole={currentRole}
            onPlanExecuted={handlePlanExecuted}
          />
        )}

        {activeTab === 'erd' && (
          <ErdVisualizer currentDb={currentDb} />
        )}

        {activeTab === 'governance' && (
          <GovernanceView />
        )}

        {activeTab === 'audit' && (
          <AuditLogView />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}
      </main>

      {/* App Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-mono">
        DBC Intelligence Platform • Governed AI Enterprise Data Management & Governance Layer
      </footer>
    </div>
  );
}
