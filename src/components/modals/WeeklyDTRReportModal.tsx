import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileText,
  FileSpreadsheet,
  Download,
  Users,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  BadgeAlert,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadWeeklyDTRPDF,
  downloadWeeklyDTRCSV,
  WeeklyDTREmployeeData,
  WeeklyDTREmployeeDay,
} from '../../utils/exporters';

interface WeeklyDTRReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string;
  preselectedWeekKey?: string;
}

export const WeeklyDTRReportModal: React.FC<WeeklyDTRReportModalProps> = ({
  isOpen,
  onClose,
  preselectedEmployeeId,
  preselectedWeekKey,
}) => {
  const { employees, sites, attendance, dtrWeeks, currentSite } = useApp();

  // Active Week
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(
    preselectedWeekKey || dtrWeeks[0]?.week_key || '2026-W41'
  );

  // Site filter for employee selection list
  const [siteFilter, setSiteFilter] = useState<string>(
    currentSite === 'ALL' ? 'ALL' : currentSite
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Employee IDs
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Preview Employee ID (which employee is active in preview tab)
  const [previewEmpId, setPreviewEmpId] = useState<string>('');

  // Success message toast
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Active view tab: 'preview' or 'selection'
  const [activeTab, setActiveTab] = useState<'preview' | 'selection'>('preview');

  // Sync preselected employee and week
  useEffect(() => {
    if (preselectedWeekKey) {
      setSelectedWeekKey(preselectedWeekKey);
    }
  }, [preselectedWeekKey]);

  useEffect(() => {
    if (isOpen) {
      if (preselectedEmployeeId) {
        setSelectedEmployeeIds([preselectedEmployeeId]);
        setPreviewEmpId(preselectedEmployeeId);
        setActiveTab('preview');
      } else {
        // Default to first active employee or previously selected
        const firstActive = employees.find((e) => e.status !== 'archived');
        if (firstActive && selectedEmployeeIds.length === 0) {
          setSelectedEmployeeIds([firstActive.employee_id]);
          setPreviewEmpId(firstActive.employee_id);
        }
      }
      setExportMessage(null);
    }
  }, [isOpen, preselectedEmployeeId, employees]);

  const activeWeek = useMemo(() => {
    return dtrWeeks.find((w) => w.week_key === selectedWeekKey) || dtrWeeks[0];
  }, [dtrWeeks, selectedWeekKey]);

  // Compute 7 dates (Monday to Sunday)
  const weekDates = useMemo(() => {
    const startDate = new Date(activeWeek ? activeWeek.date_start : '2026-10-05');
    const dates: { dateStr: string; dayName: string }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push({
        dateStr: d.toISOString().substring(0, 10),
        dayName: dayNames[i],
      });
    }
    return dates;
  }, [activeWeek]);

  // Filtered employees available for selection
  const eligibleEmployees = useMemo(() => {
    return employees
      .filter((e) => e.status !== 'archived')
      .filter((e) => siteFilter === 'ALL' || e.site_id === siteFilter)
      .filter((e) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
        );
      });
  }, [employees, siteFilter, searchQuery]);

  // Toggle single employee selection
  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((item) => item !== id);
      } else {
        updated = [...prev, id];
      }
      if (updated.length > 0 && !updated.includes(previewEmpId)) {
        setPreviewEmpId(updated[0]);
      }
      return updated;
    });
  };

  const handleSelectAll = () => {
    const allIds = eligibleEmployees.map((e) => e.employee_id);
    setSelectedEmployeeIds(allIds);
    if (allIds.length > 0 && !allIds.includes(previewEmpId)) {
      setPreviewEmpId(allIds[0]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedEmployeeIds([]);
  };

  const handleSelectOnly = (id: string) => {
    setSelectedEmployeeIds([id]);
    setPreviewEmpId(id);
    setActiveTab('preview');
  };

  // Compile full DTR data for the selected employees
  const compiledData = useMemo<WeeklyDTREmployeeData[]>(() => {
    const targetEmployees = employees.filter((e) => selectedEmployeeIds.includes(e.employee_id));

    return targetEmployees.map((emp) => {
      const site = sites.find((s) => s.site_id === emp.site_id);

      const days: WeeklyDTREmployeeDay[] = weekDates.map(({ dateStr, dayName }) => {
        const att = attendance.find(
          (a) => a.employee_id === emp.employee_id && a.work_date === dateStr
        );

        if (att && att.time_in) {
          const totalH = att.work_hours || 0;
          const regH = Math.min(totalH, 8.0);
          const otH = Math.max(totalH - 8.0, 0);

          return {
            date: dateStr,
            dayName,
            timeIn: att.time_in,
            timeOut: att.time_out || '--:--',
            breakMinutes: att.break_minutes || 90,
            regularHours: regH,
            overtimeHours: otH,
            totalHours: totalH,
            source: att.source === 'QR' ? 'Turnstile QR' : 'Manual Verified',
            status: totalH > 0 ? 'Present' : 'Incomplete',
            notes: att.source === 'QR' ? 'Biometric turnstile verified' : 'Supervisor manual log',
          };
        }

        // Sunday or rest day check
        const isSunday = dayName === 'Sun';
        return {
          date: dateStr,
          dayName,
          timeIn: '',
          timeOut: '',
          breakMinutes: 0,
          regularHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          source: '-',
          status: isSunday ? 'Rest Day' : 'Absent',
          notes: isSunday ? 'Scheduled Weekly Rest Day' : 'No attendance logged',
        };
      });

      const totalDays = days.filter((d) => d.status === 'Present' && d.totalHours > 0).length;
      const totalRegularHours = days.reduce((sum, d) => sum + d.regularHours, 0);
      const totalOvertimeHours = days.reduce((sum, d) => sum + d.overtimeHours, 0);
      const totalHours = days.reduce((sum, d) => sum + d.totalHours, 0);
      const estimatedGrossPay = totalDays * (emp.daily_rate || 0);

      return {
        employee: {
          employee_id: emp.employee_id,
          name: emp.name,
          position: emp.position,
          site_id: emp.site_id,
          daily_rate: emp.daily_rate || 0,
          email: emp.email,
          contact_number: emp.contact_number,
        },
        siteName: site ? site.name : emp.site_id,
        siteCode: site ? site.code : emp.site_id,
        supervisor: site?.supervisor || 'Site Engineer In-Charge',
        days,
        totalDays,
        totalRegularHours,
        totalOvertimeHours,
        totalHours,
        estimatedGrossPay,
      };
    });
  }, [employees, selectedEmployeeIds, sites, weekDates, attendance]);

  // Current preview data for the employee being inspected
  const currentPreviewData = useMemo(() => {
    return (
      compiledData.find((d) => d.employee.employee_id === previewEmpId) ||
      compiledData[0] ||
      null
    );
  }, [compiledData, previewEmpId]);

  // PDF Export Trigger
  const handleExportPDF = () => {
    if (compiledData.length === 0) return;

    let filename = '';
    if (compiledData.length === 1) {
      const cleanName = compiledData[0].employee.name.replace(/\s+/g, '_');
      filename = `DRC_DTR_${selectedWeekKey}_${compiledData[0].employee.employee_id}_${cleanName}.pdf`;
    } else {
      filename = `DRC_Weekly_DTR_${selectedWeekKey}_${compiledData.length}_Employees.pdf`;
    }

    downloadWeeklyDTRPDF(
      filename,
      selectedWeekKey,
      activeWeek?.date_start || '2026-10-05',
      activeWeek?.date_end || '2026-10-11',
      compiledData
    );

    setExportMessage(
      `Official DTR PDF exported successfully! (${compiledData.length} employee${compiledData.length > 1 ? 's' : ''})`
    );
    setTimeout(() => setExportMessage(null), 4000);
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    if (compiledData.length === 0) return;

    let filename = '';
    if (compiledData.length === 1) {
      const cleanName = compiledData[0].employee.name.replace(/\s+/g, '_');
      filename = `DRC_DTR_${selectedWeekKey}_${compiledData[0].employee.employee_id}_${cleanName}.csv`;
    } else {
      filename = `DRC_Weekly_DTR_${selectedWeekKey}_${compiledData.length}_Employees.csv`;
    }

    downloadWeeklyDTRCSV(
      filename,
      selectedWeekKey,
      activeWeek?.date_start || '2026-10-05',
      activeWeek?.date_end || '2026-10-11',
      compiledData
    );

    setExportMessage(
      `Weekly DTR CSV exported successfully! (${compiledData.length} employee${compiledData.length > 1 ? 's' : ''})`
    );
    setTimeout(() => setExportMessage(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-[#13241f] border-b border-[#234338] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#a3e635]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Weekly DTR Generator & Exporter
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10b981]/15 text-[#a3e635] border border-[#10b981]/30">
                  PDF & CSV ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Construction Daily Time Records with 90-min break deductions, shift totals, and signature blocks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a3129] transition-colors"
            title="Close generator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls Filter Bar */}
        <div className="px-5 py-3 bg-[#0a1411] border-b border-[#234338] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Week Selector */}
            <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] px-3 py-1.5 rounded-lg text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#a3e635]" />
              <span className="text-slate-500 font-semibold uppercase text-[10px]">PAYROLL WEEK:</span>
              <select
                value={selectedWeekKey}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
                className="bg-transparent text-[#a3e635] font-bold font-mono outline-none cursor-pointer"
              >
                {dtrWeeks.map((w) => (
                  <option key={w.week_key} value={w.week_key} className="bg-[#13241f] text-white">
                    {w.week_key} ({w.date_start} to {w.date_end}) {w.status === 'active' ? '[ACTIVE]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Filter for employee list */}
            <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] px-3 py-1.5 rounded-lg text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold uppercase text-[10px]">FILTER SITE:</span>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="bg-transparent text-white font-medium outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#13241f]">All Sites ({employees.length})</option>
                {sites.map((s) => (
                  <option key={s.site_id} value={s.site_id} className="bg-[#13241f]">
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Tabs & Selected Counter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-[#a3e635] font-mono">{selectedEmployeeIds.length}</strong> of {eligibleEmployees.length}
            </span>

            <div className="flex rounded-lg bg-[#13241f] p-0.5 border border-[#234338]">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-[#10b981] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Live DTR Preview
              </button>
              <button
                onClick={() => setActiveTab('selection')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'selection'
                    ? 'bg-[#10b981] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Select Employees ({selectedEmployeeIds.length})
              </button>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportMessage && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportMessage}</span>
            </div>
            <button
              onClick={() => setExportMessage(null)}
              className="text-emerald-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Main Body (2 Columns or Active Tab) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* LEFT PANEL: Employee Picker & Search (4 Columns) */}
          <div className={`md:col-span-4 border-r border-[#234338] bg-[#0c1713] flex flex-col min-h-0 ${
            activeTab === 'selection' ? 'block' : 'hidden md:flex'
          }`}>
            <div className="p-3 border-b border-[#234338] space-y-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, trade, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Action Buttons: Select All / Deselect All */}
              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#a3e635] hover:underline font-semibold flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  Select All ({eligibleEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#234338]/40 p-1">
              {eligibleEmployees.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-slate-500">
                  No employees found matching filter.
                </div>
              ) : (
                eligibleEmployees.map((emp) => {
                  const isChecked = selectedEmployeeIds.includes(emp.employee_id);
                  const isPreviewing = previewEmpId === emp.employee_id;

                  return (
                    <div
                      key={emp.employee_id}
                      onClick={() => handleToggleEmployee(emp.employee_id)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
                        isPreviewing && isChecked
                          ? 'bg-[#152e25] border border-[#10b981]/50'
                          : isChecked
                          ? 'bg-[#13241f]/80'
                          : 'hover:bg-[#13241f]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEmployee(emp.employee_id);
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#a3e635]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-xs truncate">
                              {emp.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#a3e635]">
                              {emp.employee_id}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <span>{emp.position}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-500">PHP {emp.daily_rate}/d</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOnly(emp.employee_id);
                          }}
                          title="Preview & Select Only this Employee"
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1b382d] hover:bg-[#10b981] hover:text-white text-emerald-300 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Live DTR Preview (8 Columns) */}
          <div className={`md:col-span-8 flex flex-col min-h-0 bg-[#0e1a16] ${
            activeTab === 'preview' ? 'block' : 'hidden md:flex'
          }`}>
            {compiledData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#13241f] border border-[#234338] flex items-center justify-center text-slate-600">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-sm">No Employee Selected</h3>
                <p className="text-xs max-w-sm text-slate-500">
                  Please select one or more specific employees from the list on the left to generate and export their Weekly DTR.
                </p>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-emerald-300 text-xs font-semibold rounded-lg"
                >
                  Select All Employees in Site
                </button>
              </div>
            ) : currentPreviewData ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Preview Employee Switcher Pills if multiple selected */}
                {compiledData.length > 1 && (
                  <div className="px-4 py-2.5 border-b border-[#234338] bg-[#0a1411] flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
                      PREVIEWING ({compiledData.length}):
                    </span>
                    {compiledData.map((d) => (
                      <button
                        key={d.employee.employee_id}
                        onClick={() => setPreviewEmpId(d.employee.employee_id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                          previewEmpId === d.employee.employee_id
                            ? 'bg-[#10b981] text-white shadow-xs'
                            : 'bg-[#13241f] text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{d.employee.name.split(' ')[0]}</span>
                        <span className="text-[9px] opacity-75 font-mono">({d.totalHours.toFixed(0)}h)</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Printable Form Preview Sheet */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Official DTR Paper Card Simulator */}
                  <div className="bg-white text-slate-900 rounded-xl p-5 shadow-xl border border-slate-200 font-sans space-y-4">
                    {/* Header */}
                    <div className="border-b-2 border-[#0f291e] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-black tracking-tight text-[#0f291e] flex items-center gap-1.5">
                          <span>DE RUEDA CONSTRUCTION</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          General Contractor & Infrastructure Builder
                        </div>
                        <div className="text-[9px] text-slate-500">
                          DOLE Department Order No. 13 Construction Safety & Labor Standards Compliant
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-block bg-[#0f291e] text-[#a3e635] text-[10px] font-black px-2 py-0.5 rounded font-mono">
                          WEEK: {selectedWeekKey}
                        </div>
                        <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                          Coverage: {activeWeek?.date_start} to {activeWeek?.date_end}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          PHT (+08:00 Standard Time)
                        </div>
                      </div>
                    </div>

                    {/* DTR Title Banner */}
                    <div className="bg-slate-100 rounded-lg p-2 text-center border border-slate-200">
                      <div className="text-xs font-black tracking-wide text-slate-800 uppercase">
                        Official Weekly Daily Time Record (DTR)
                      </div>
                      <div className="text-[9px] text-slate-500">
                        Employee Civil Service & DOLE Form DRC-DTR · Site Biometric Turnstile Log
                      </div>
                    </div>

                    {/* Employee Profile Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="space-y-1">
                        <div className="text-slate-500 text-[10px] uppercase font-bold">Worker Details</div>
                        <div className="text-sm font-black text-slate-900">
                          {currentPreviewData.employee.name}
                        </div>
                        <div className="text-xs font-bold text-emerald-700">
                          {currentPreviewData.employee.position}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          Employee ID: <strong className="text-slate-900">{currentPreviewData.employee.employee_id}</strong>
                        </div>
                      </div>

                      <div className="space-y-1 sm:text-right">
                        <div className="text-slate-500 text-[10px] uppercase font-bold">Assigned Project Site</div>
                        <div className="text-xs font-bold text-slate-800">
                          {currentPreviewData.siteCode} - {currentPreviewData.siteName}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Supervisor: <strong>{currentPreviewData.supervisor}</strong>
                        </div>
                        <div className="text-xs font-bold text-emerald-800 font-mono">
                          Daily Rate: PHP {currentPreviewData.employee.daily_rate.toFixed(2)}/day
                        </div>
                      </div>
                    </div>

                    {/* 7-Day Attendance Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0f291e] text-white text-[10px] uppercase font-bold">
                            <th className="p-2 text-center">Date</th>
                            <th className="p-2 text-center">Day</th>
                            <th className="p-2 text-center">Time In</th>
                            <th className="p-2 text-center">Time Out</th>
                            <th className="p-2 text-center">Break</th>
                            <th className="p-2 text-center">Reg. Hrs</th>
                            <th className="p-2 text-center">OT Hrs</th>
                            <th className="p-2 text-center">Total Hrs</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentPreviewData.days.map((d) => (
                            <tr
                              key={d.date}
                              className={`text-[11px] ${
                                d.status === 'Present'
                                  ? 'hover:bg-slate-50'
                                  : d.status === 'Rest Day'
                                  ? 'bg-slate-50/70 text-slate-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              <td className="p-2 text-center font-mono text-[10px] text-slate-600">
                                {d.date}
                              </td>
                              <td className="p-2 text-center font-bold text-slate-800">
                                {d.dayName}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-emerald-700">
                                {d.timeIn || '--:--'}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-slate-700">
                                {d.timeOut || '--:--'}
                              </td>
                              <td className="p-2 text-center font-mono text-slate-500 text-[10px]">
                                {d.breakMinutes > 0 ? `${d.breakMinutes}m` : '-'}
                              </td>
                              <td className="p-2 text-center font-mono font-semibold text-slate-800">
                                {d.regularHours > 0 ? `${d.regularHours.toFixed(1)}h` : '-'}
                              </td>
                              <td className="p-2 text-center font-mono font-semibold text-amber-600">
                                {d.overtimeHours > 0 ? `${d.overtimeHours.toFixed(1)}h` : '-'}
                              </td>
                              <td className="p-2 text-center font-mono font-black text-slate-900">
                                {d.totalHours > 0 ? `${d.totalHours.toFixed(1)}h` : '0.0h'}
                              </td>
                              <td className="p-2 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    d.status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.status === 'Rest Day'
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-600 text-xs">
                            <td colSpan={5} className="p-2 text-right uppercase text-[10px] font-bold">
                              Weekly Verified Totals:
                            </td>
                            <td className="p-2 text-center font-mono font-black">
                              {currentPreviewData.totalRegularHours.toFixed(1)}h
                            </td>
                            <td className="p-2 text-center font-mono font-black text-amber-700">
                              {currentPreviewData.totalOvertimeHours.toFixed(1)}h
                            </td>
                            <td className="p-2 text-center font-mono font-black text-emerald-900 text-sm">
                              {currentPreviewData.totalHours.toFixed(1)}h
                            </td>
                            <td className="p-2 text-center font-bold text-[10px] text-emerald-800">
                              {currentPreviewData.totalDays} Days Present
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Summary Wage Box */}
                    <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">
                          Verified Days Worked: <strong className="text-emerald-700">{currentPreviewData.totalDays} Days</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Standard Shift: 8.0h / day (Break rule: 90 mins deducted at 10:00, 12:00, 15:00)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Estimated Basic Gross</div>
                        <div className="text-base font-black text-emerald-700 font-mono">
                          PHP {currentPreviewData.estimatedGrossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          ({currentPreviewData.totalDays} days × PHP {currentPreviewData.employee.daily_rate.toFixed(2)})
                        </div>
                      </div>
                    </div>

                    {/* Certification & Signatures */}
                    <div className="pt-2 text-[10px] text-slate-500 text-center italic">
                      "I hereby certify on my honor that the above is a true and correct record of the hours of work performed, arrival, and departure rendered at the designated construction site."
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                      <div className="text-center">
                        <div className="border-b border-slate-400 pb-1 font-bold text-slate-800 text-xs">
                          {currentPreviewData.employee.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Employee / Worker Signature & Date</div>
                      </div>

                      <div className="text-center">
                        <div className="border-b border-slate-400 pb-1 font-bold text-slate-800 text-xs">
                          {currentPreviewData.supervisor}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Site Engineer / Timekeeper Sign-Off</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Bottom Footer: Action & Export Buttons */}
        <div className="px-5 py-3.5 bg-[#13241f] border-t border-[#234338] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
            <span>
              Exporting for <strong className="text-white">{compiledData.length}</strong> selected employee{compiledData.length !== 1 ? 's' : ''} in week <strong className="text-[#a3e635] font-mono">{selectedWeekKey}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0c1713] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={compiledData.length === 0}
              className="px-4 py-2 bg-[#1b382d] border border-[#10b981]/60 text-emerald-300 hover:text-white hover:bg-[#10b981]/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download structured CSV spreadsheet for selected employees"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#a3e635]" />
              Export CSV
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={compiledData.length === 0}
              className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download official printable PDF Daily Time Record for selected employees"
            >
              <Download className="w-4 h-4" />
              Export PDF ({compiledData.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
