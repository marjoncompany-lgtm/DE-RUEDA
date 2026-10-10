import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../layout/Sidebar';
import { ProjectGanttChart } from '../dashboard/ProjectGanttChart';
import {
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  QrCode,
  UserPlus,
  Calculator,
  Printer,
  PackagePlus,
  Receipt,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (page: PageId) => void;
  onOpenQrScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQrScanner,
}) => {
  const { employees, sites, attendance, payroll, auditLogs, currentSite, settings } = useApp();

  const activeEmployees = employees.filter((e) => e.status !== 'archived');
  const filteredEmployees = currentSite === 'ALL'
    ? activeEmployees
    : activeEmployees.filter((e) => e.site_id === currentSite);

  // Present today (2026-10-06)
  const todayStr = '2026-10-06';
  const presentToday = attendance.filter(
    (a) => a.work_date === todayStr && (currentSite === 'ALL' || a.site_id === currentSite)
  );

  const filteredPayroll = currentSite === 'ALL'
    ? payroll
    : payroll.filter((p) => p.site_id === currentSite);

  const pendingPayrollCount = filteredPayroll.filter((p) => p.payment_status === 'Pending').length;
  const pendingProofCount = filteredPayroll.filter((p) => !p.proof_file_id || p.payment_status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Executive & Site Operations Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Corporate Real-Time Control</span>
            <span>·</span>
            <span>Asia/Manila: <strong className="text-white font-mono">{todayStr}</strong></span>
            <span>·</span>
            <span>Context: <strong className="text-[#a3e635]">{currentSite}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQrScanner}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            Scan Attendance QR
          </button>
          <button
            onClick={() => onNavigate('employees')}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-[#10b981]" />
            Manage Workforce
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Workforce</span>
            <Users className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {filteredEmployees.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Workers registered ({currentSite})
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Projects</span>
            <Building className="w-4 h-4 text-[#a3e635]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {sites.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Bataan, Subic & Zambales
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {presentToday.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Clocked in today ({todayStr})
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Payroll</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              {pendingPayrollCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Disbursements to finalize
            </div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Payment Proofs</span>
            <FileCheck2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {pendingProofCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              GCash / Cash vouchers
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operational Workflows */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Rapid Operations & Field Workflows
          </div>
          <span className="text-[11px] text-slate-500">Zero-friction shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Weekly DTR</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Review clock times</div>
          </button>

          <button
            onClick={() => onNavigate('deductions')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Deductions</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Canteen & advances</div>
          </button>

          <button
            onClick={() => onNavigate('payroll')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Weekly Payroll</span>
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Gross/net calculation</div>
          </button>

          <button
            onClick={() => onNavigate('payslips')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>6/Page Payslips</span>
              <Printer className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Print batch sheets</div>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Materials Log</span>
              <PackagePlus className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Delivery receipts</div>
          </button>

          <button
            onClick={() => onNavigate('expenses')}
            className="p-3 bg-[#13241f] border border-[#234338] hover:border-[#10b981] rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-semibold text-white group-hover:text-[#a3e635] flex items-center justify-between">
              <span>Project Costs</span>
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Crane & diesel fuel</div>
          </button>
        </div>
      </div>

      {/* D3 Project Gantt Chart & Milestone Timeline */}
      <ProjectGanttChart initialSiteFilter={currentSite} />

      {/* Two Column Layout: Active Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Construction Sites */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-3">
            <div className="text-sm font-bold text-white">Active Construction Projects</div>
            <button
              onClick={() => onNavigate('sites')}
              className="text-xs font-semibold text-[#a3e635] hover:underline"
            >
              View Sites &rarr;
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {sites.map((s) => (
              <div
                key={s.site_id}
                className="p-3 bg-[#13241f] border border-[#234338] rounded-lg flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-[#a3e635]">{s.code}:</span>
                    <span>{s.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {s.location} &bull; Supervisor: <strong className="text-slate-300">{s.supervisor}</strong>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    {s.project_status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.end_date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#234338] flex items-center justify-between text-xs text-slate-400">
            <span>Corporate Project Vault</span>
            <a
              href={settings.master_drive_link}
              target="_blank"
              rel="noreferrer"
              className="text-[#a3e635] hover:underline flex items-center gap-1 text-[11px]"
            >
              Master Google Drive <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Audit Activity Trail */}
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-3">
            <div className="text-sm font-bold text-white">Forensic Audit Activity Trail</div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-[#a3e635] hover:underline"
            >
              View Full Log &rarr;
            </button>
          </div>

          <div className="space-y-2.5 flex-1 divide-y divide-[#234338]/40">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.audit_id} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="font-semibold text-white">
                    {log.action} <span className="text-slate-400 font-normal">({log.entity})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Actor: <strong className="text-slate-300">{log.actor}</strong> &bull; Target:{' '}
                  <code className="text-[#a3e635] text-[10px]">{log.entity_id}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#234338] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Immutable recording: logins, QR scans, and disbursements</span>
            <span className="font-mono text-emerald-400">COMPLIANT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
