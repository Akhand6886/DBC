'use client';

import React, { useState, useMemo } from 'react';
import {
  dataLineage,
  LineageNode,
  LineageEdge,
  LineageNodeType,
  BlastImpactAssessment
} from '../../lib/lineage/dataLineageEngine';
import {
  GitFork,
  X,
  Search,
  Database,
  Eye,
  FileText,
  Workflow,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  CheckCircle2,
  Table,
  Tag,
  Share2
} from 'lucide-react';

interface DataLineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedTable?: string;
}

export const DataLineageModal: React.FC<DataLineageModalProps> = ({
  isOpen,
  onClose,
  initialSelectedTable = 'users'
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedTable.toLowerCase());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<LineageNodeType | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'graph' | 'blast'>('graph');

  const { nodes, edges } = useMemo(() => dataLineage.getGraph(), []);

  // Filter nodes by query and type
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.ownerTeam && n.ownerTeam.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [nodes, searchQuery, typeFilter]);

  // Selected node details
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id.toLowerCase() === selectedNodeId.toLowerCase()) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Blast radius evaluation
  const blastAssessment: BlastImpactAssessment = useMemo(() => {
    if (!selectedNode) {
      return {
        targetNodeId: '',
        riskLevel: 'LOW',
        affectedDownstreamNodes: [],
        affectedEdges: [],
        breakingChanges: [],
        recommendations: []
      };
    }
    return dataLineage.analyzeBlastImpact(selectedNode.id);
  }, [selectedNode]);

  // Downstream & Upstream edges for selected node
  const upstreamEdges = useMemo(() => {
    return edges.filter(e => e.targetNodeId.toLowerCase() === selectedNode?.id.toLowerCase());
  }, [edges, selectedNode]);

  const downstreamEdges = useMemo(() => {
    return edges.filter(e => e.sourceNodeId.toLowerCase() === selectedNode?.id.toLowerCase());
  }, [edges, selectedNode]);

  if (!isOpen) return null;

  const getNodeIcon = (type: LineageNodeType) => {
    switch (type) {
      case 'SOURCE_TABLE':
        return <Database className="w-3.5 h-3.5 text-blue-400" />;
      case 'VIEW':
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case 'DERIVED_TABLE':
        return <Table className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DOWNSTREAM_REPORT':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'PIPELINE_JOB':
        return <Workflow className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getNodeBadgeColor = (type: LineageNodeType) => {
    switch (type) {
      case 'SOURCE_TABLE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'VIEW':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'DERIVED_TABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DOWNSTREAM_REPORT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PIPELINE_JOB':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  const getRiskColor = (risk: BlastImpactAssessment['riskLevel']) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  // Group nodes into pipeline stages (Swimlanes)
  const sourceNodes = filteredNodes.filter(n => n.type === 'SOURCE_TABLE');
  const middleNodes = filteredNodes.filter(n => n.type === 'VIEW' || n.type === 'DERIVED_TABLE');
  const consumerNodes = filteredNodes.filter(n => n.type === 'DOWNSTREAM_REPORT' || n.type === 'PIPELINE_JOB');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-sans text-xs">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl w-[95vw] max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#007acc]/20 text-[#007acc] rounded">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Data Lineage & Blast Radius DAG</span>
                <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px]">
                  P2 Subsystem
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                End-to-end relational dependency flow, column-level mappings, and downstream impact analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="bg-[#1e1e1e] p-0.5 rounded border border-[#3c3c3c] flex items-center text-[11px]">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  activeTab === 'graph'
                    ? 'bg-[#007acc] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DAG Pipeline
              </button>
              <button
                onClick={() => setActiveTab('blast')}
                className={`px-2.5 py-1 rounded font-medium flex items-center space-x-1 transition ${
                  activeTab === 'blast'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Blast Impact</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Counters */}
        <div className="px-4 py-2 bg-[#202020] border-b border-[#3c3c3c] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tables, columns, views..."
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded pl-8 pr-2.5 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#007acc] text-[11px]"
              />
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1">
            {(['ALL', 'SOURCE_TABLE', 'VIEW', 'DERIVED_TABLE', 'DOWNSTREAM_REPORT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                  typeFilter === f
                    ? 'bg-[#007acc] text-white border-[#0098ff]'
                    : 'bg-[#2d2d2d] text-slate-400 border-[#3c3c3c] hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All Objects' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {nodes.length} Nodes • {edges.length} Edges
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main DAG Graph Stage */}
          {activeTab === 'graph' ? (
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 bg-[#1b1b1b] space-y-4">
              <div className="min-w-[700px] grid grid-cols-3 gap-6">
                
                {/* Swimlane 1: Ingestion & Core Relational Sources */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#333333]">
                    <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-400" />
                      <span>1. Core Sources ({sourceNodes.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">L0 Raw</span>
                  </div>

                  <div className="space-y-2.5">
                    {sourceNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#2d2d2d] border-[#007acc] shadow-lg ring-1 ring-[#007acc]'
                              : 'bg-[#252526] border-[#3c3c3c] hover:border-slate-500 hover:bg-[#282829]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-[12px] flex items-center gap-1.5">
                              {getNodeIcon(node.type)}
                              <span>{node.name}</span>
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getNodeBadgeColor(node.type)}`}>
                              {node.type.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                            {node.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#333333] pt-1.5 font-mono">
                            <span>{node.ownerTeam || 'Platform'}</span>
                            <span>~{node.rowCountEstimate?.toLocaleString() || 0} rows</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Swimlane 2: Derived Tables & Materialized Views */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#333333]">
                    <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Derived & Views ({middleNodes.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">L1 Inter</span>
                  </div>

                  <div className="space-y-2.5">
                    {middleNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#2d2d2d] border-[#007acc] shadow-lg ring-1 ring-[#007acc]'
                              : 'bg-[#252526] border-[#3c3c3c] hover:border-slate-500 hover:bg-[#282829]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-[12px] flex items-center gap-1.5">
                              {getNodeIcon(node.type)}
                              <span>{node.name}</span>
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getNodeBadgeColor(node.type)}`}>
                              {node.type.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                            {node.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#333333] pt-1.5 font-mono">
                            <span>{node.ownerTeam || 'Team'}</span>
                            <span>~{node.rowCountEstimate?.toLocaleString() || 0} rows</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Swimlane 3: Downstream Reports & Pipelines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#333333]">
                    <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>3. Reports & Consumers ({consumerNodes.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">L2 Output</span>
                  </div>

                  <div className="space-y-2.5">
                    {consumerNodes.map(node => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#2d2d2d] border-[#007acc] shadow-lg ring-1 ring-[#007acc]'
                              : 'bg-[#252526] border-[#3c3c3c] hover:border-slate-500 hover:bg-[#282829]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-[12px] flex items-center gap-1.5">
                              {getNodeIcon(node.type)}
                              <span>{node.name}</span>
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getNodeBadgeColor(node.type)}`}>
                              {node.type.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                            {node.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#333333] pt-1.5 font-mono">
                            <span>{node.ownerTeam || 'BI & Analytics'}</span>
                            <span>{node.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Blast Radius Dedicated Impact View */
            <div className="flex-1 overflow-y-auto p-5 bg-[#1e1e1e] space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white text-sm">Target: {selectedNode?.name}</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${getRiskColor(blastAssessment.riskLevel)}`}>
                      {blastAssessment.riskLevel} BLAST RISK
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Evaluates downstream breakage if columns or constraints in <code className="text-cyan-300">{selectedNode?.name}</code> are altered or dropped.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('graph')}
                  className="px-3 py-1.5 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-medium text-[11px] transition shadow"
                >
                  View in DAG
                </button>
              </div>

              {/* Breaking Changes */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                <span className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Potential Breaking Changes ({blastAssessment.breakingChanges.length})</span>
                </span>
                <ul className="space-y-1 text-slate-300">
                  {blastAssessment.breakingChanges.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remediation Recommendations */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Safe Remediation Playbook ({blastAssessment.recommendations.length})</span>
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {blastAssessment.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Affected Downstream Entities */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#007acc]" />
                  <span>Direct & Transitive Downstream Consumers ({blastAssessment.affectedDownstreamNodes.length})</span>
                </span>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {blastAssessment.affectedDownstreamNodes.map(node => (
                    <div key={node.id} className="p-2.5 bg-[#1e1e1e] border border-[#3c3c3c] rounded flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getNodeIcon(node.type)}
                        <div>
                          <div className="font-bold text-slate-200">{node.name}</div>
                          <div className="text-[10px] text-slate-500">{node.ownerTeam}</div>
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getNodeBadgeColor(node.type)}`}>
                        {node.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Inspector Sidebar for Selected Node */}
          {selectedNode && (
            <div className="w-80 bg-[#202020] border-l border-[#3c3c3c] p-4 flex flex-col justify-between overflow-y-auto shrink-0">
              <div className="space-y-4">
                {/* Node Title Card */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      {getNodeIcon(selectedNode.type)}
                      <span>{selectedNode.name}</span>
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getNodeBadgeColor(selectedNode.type)}`}>
                      {selectedNode.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Metadata badges */}
                <div className="bg-[#252526] p-2.5 rounded border border-[#333333] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Schema:</span>
                    <span className="text-slate-300 font-mono">{selectedNode.schema || 'public'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner Team:</span>
                    <span className="text-slate-300">{selectedNode.ownerTeam || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Row Count:</span>
                    <span className="text-slate-300 font-mono">~{selectedNode.rowCountEstimate?.toLocaleString() || 0}</span>
                  </div>
                </div>

                {/* Column Catalog */}
                <div>
                  <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block mb-1.5">
                    Columns ({selectedNode.columns.length})
                  </span>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {selectedNode.columns.map(col => (
                      <div
                        key={col.name}
                        className="px-2 py-1 bg-[#252526] border border-[#333333] rounded flex items-center justify-between text-[10px]"
                      >
                        <span className="font-mono text-slate-200">{col.name}</span>
                        <div className="flex items-center gap-1 font-mono">
                          {col.isPrimary && <span className="text-yellow-400 text-[9px]">PK</span>}
                          {col.isForeign && <span className="text-cyan-400 text-[9px]">FK</span>}
                          {col.isPii && <span className="text-red-400 text-[9px] bg-red-500/10 px-1 rounded">PII</span>}
                          <span className="text-slate-500">{col.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upstream & Downstream Counts */}
                <div className="space-y-2">
                  <div className="p-2 bg-[#252526] border border-[#333333] rounded flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Upstream Sources:</span>
                    <span className="font-mono text-cyan-400 font-bold">{upstreamEdges.length}</span>
                  </div>
                  <div className="p-2 bg-[#252526] border border-[#333333] rounded flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Downstream Consumers:</span>
                    <span className="font-mono text-amber-400 font-bold">{downstreamEdges.length}</span>
                  </div>
                </div>
              </div>

              {/* Blast Analysis Trigger */}
              <div className="pt-4 border-t border-[#333333]">
                <button
                  onClick={() => setActiveTab('blast')}
                  className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded font-bold text-[11px] flex items-center justify-center space-x-1.5 transition shadow"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Analyze Blast Radius</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#2d2d2d] border-t border-[#3c3c3c] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span>Selected Node:</span>
            <code className="text-cyan-300 font-bold">{selectedNode?.name}</code>
            <span>•</span>
            <span>Downstream blast risk:</span>
            <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] border ${getRiskColor(blastAssessment.riskLevel)}`}>
              {blastAssessment.riskLevel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-white rounded text-[11px] transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
