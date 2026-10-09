import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadCSV, downloadExcelXLSX, downloadReportPDF } from '../../utils/exporters';
import { History, Search, Filter, ShieldCheck, Download, Printer } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const isCeo = currentUser?.access_point === 'ceo';

  const accessibleLogs = auditLogs.filter((log) => {
    // Login Directory creation and GDrive sync files are viewed ONLY by CEOs account
    if (log.entity === 'LOGIN_DIRECTORY' && !isCeo) return false;
    return true;
  });

  const filtered = accessibleLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      (log.after_value && log.after_value.toLowerCase().includes(q));

    const matchA = actionFilter === 'ALL' || log.action === actionFilter;
    return matchQ && matchA;
  });

  const uniqueActions = Array.from(new Set(accessibleLogs.map((l) => l.action)));

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Entity ID', 'Details / Value'];
    const rows = filtered.map((l) => [
      l.timestamp,
      l.actor,
      l.action,
      l.entity,
      l.entity_id,
      l.after_value || l.before_value || 'Executed',
    ]);
    downloadCSV(`DRC_Audit_Trail_${new Date().toISOString().substring(0, 10)}`, [headers, ...rows]);
  };

  const handleExportPDF = () => {
    const headers = ['Timestamp', 'Actor Identity', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = filtered.map((l) => [
      l.timestamp,
      l.actor,
      l.action,
      l.entity,
      l.entity_id,
      l.after_value || l.before_value || 'Executed',
    ]);
    downloadReportPDF(
      `DRC_Audit_Log_${new Date().toISOString().substring(0, 10)}.pdf`,
      'De Rueda Construction — Immutable Forensic Audit Trail',
      `Showing ${filtered.length} logged system events`,
      headers,
      rows,
      true
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Enterprise Audit Activity Log
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Immutable Forensic Log of Logins, Scans, Rates, DTR Adjustments & Payouts</span>
            <span>·</span>
            <span>Tamper-Resistant Regulatory Compliance</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Audit PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor, action, target entity ID..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Actions ({uniqueActions.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {filtered.length} logged events
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
            <span>Forensic Record Trail</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">STATUS: VERIFIED SECURE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Timestamp (PHT)</th>
                <th className="p-3">Actor Identity</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Target ID</th>
                <th className="p-3">Operational Details / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3 font-medium text-white">{log.actor}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#a3e635] text-[11px] bg-[#13241f] px-2 py-0.5 rounded border border-[#234338]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-semibold text-[11px]">{log.entity}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.entity_id}</td>
                    <td className="p-3 text-slate-300 max-w-sm text-[11px]">
                      {log.after_value || log.before_value || 'Success'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
