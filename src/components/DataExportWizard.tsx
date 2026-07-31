'use client';

import React, { useState } from 'react';
import { Download, X, Check, FileSpreadsheet, FileJson, Database } from 'lucide-react';

interface DataExportWizardProps {
  onClose: () => void;
  onExport: (format: string, delimiter: string) => void;
}

export const DataExportWizard: React.FC<DataExportWizardProps> = ({
  onClose,
  onExport,
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'sql'>('csv');
  const [delimiter, setDelimiter] = useState(',');
  const [includeHeaders, setIncludeHeaders] = useState(true);

  const handleExportSubmit = () => {
    onExport(format, delimiter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Download className="h-4 w-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-xs">Data Export Wizard</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Details */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Export Format:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'csv', name: 'CSV', icon: <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> },
                { id: 'json', name: 'JSON', icon: <FileJson className="h-4 w-4 text-cyan-400" /> },
                { id: 'sql', name: 'SQL Dump', icon: <Database className="h-4 w-4 text-yellow-400" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id as any)}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    format === item.id ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-ide-border bg-ide-bg text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-semibold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {format === 'csv' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Delimiter Symbol:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                aria-label="CSV Delimiter"
                className="w-full bg-ide-bg border border-ide-border rounded p-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value=",">Comma ( , )</option>
                <option value=";">Semicolon ( ; )</option>
                <option value="\t">Tab</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="text-slate-300">Include Header Row:</label>
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="h-4 w-4 cursor-pointer text-cyan-500 accent-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-ide-border">
          <button onClick={onClose} className="px-3 py-1.5 bg-ide-card hover:bg-ide-border text-slate-300 rounded font-semibold">
            Cancel
          </button>
          <button
            onClick={handleExportSubmit}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold flex items-center space-x-1.5 shadow"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Generate Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};
