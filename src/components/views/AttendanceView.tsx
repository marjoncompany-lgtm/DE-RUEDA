import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord } from '../../types';
import {
  Clock,
  QrCode,
  Plus,
  RefreshCw,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react';
import { WeeklyDTRReportModal } from '../modals/WeeklyDTRReportModal';
import { TurnstileQrScannerModal } from '../modals/TurnstileQrScannerModal';
import { AttendanceCalendarHeatmap } from '../attendance/AttendanceCalendarHeatmap';

export const AttendanceView: React.FC = () => {
  const {
    employees,
    sites,
    attendance,
    dtrWeeks,
    dtrChanges,
    currentSite,
    scanAttendanceQr,
    recordManualAttendance,
    correctAttendance,
    rolloverWeek,
    settings,
  } = useApp();

  const [selectedWeekKey, setSelectedWeekKey] = useState(dtrWeeks[0]?.week_key || '2026-W41');
  const [siteFilter, setSiteFilter] = useState(currentSite);

  // Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDTRReportModalOpen, setIsDTRReportModalOpen] = useState(false);
  const [dtrTargetEmployeeId, setDtrTargetEmployeeId] = useState<string | undefined>(undefined);

  // Selected item for correction
  const [correctingRecord, setCorrectingRecord] = useState<{
    attendance_id: string;
    employee_id: string;
    work_date: string;
    time_in: string;
    time_out: string;
  } | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Manual form state
  const [manualForm, setManualForm] = useState({
    employee_id: employees[0]?.employee_id || '',
    site_id: 'SITE-001',
    work_date: '2026-10-06',
    time_in: '07:00',
    time_out: '16:30',
    break_minutes: 90,
  });

  // Rollover form state
  const [rolloverForm, setRolloverForm] = useState({
    next_week: '2026-W42',
    date_start: '2026-10-12',
    date_end: '2026-10-18',
  });

  const activeWeek = dtrWeeks.find((w) => w.week_key === selectedWeekKey) || dtrWeeks[0];

  // Calculate the 7 calendar days of the week starting from date_start
  const startDate = new Date(activeWeek ? activeWeek.date_start : '2026-10-05');
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().substring(0, 10));
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredEmployees = employees
    .filter((e) => e.status !== 'archived')
    .filter((e) => siteFilter === 'ALL' || e.site_id === siteFilter);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordManualAttendance(manualForm);
    setIsManualOpen(false);
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord || !correctionReason.trim()) return;
    correctAttendance(
      correctingRecord.attendance_id,
      correctingRecord.time_in,
      correctingRecord.time_out,
      correctionReason.trim()
    );
    setIsCorrectionOpen(false);
    setCorrectingRecord(null);
    setCorrectionReason('');
  };

  const handleRolloverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rolloverWeek(rolloverForm.next_week, rolloverForm.date_start, rolloverForm.date_end);
    setSelectedWeekKey(rolloverForm.next_week);
    setIsRolloverOpen(false);
  };

  // Export current site attendance data & D3 30-day heatmap metrics to CSV
  const handleDownloadAttendanceCSV = () => {
    const siteObj = sites.find((s) => s.site_id === siteFilter);
    const siteLabel = siteFilter === 'ALL' ? 'All_Sites' : siteObj?.code || siteFilter;
    const nowIso = new Date().toISOString().substring(0, 10);
    const filename = `Attendance_${siteLabel}_${nowIso}.csv`;

    const lines: string[] = [];

    // Header Meta Section
    lines.push('DE RUEDA CONSTRUCTION BUILDERS - SITE ATTENDANCE & HEATMAP EXPORT');
    lines.push(`Generated At,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`);
    lines.push(`Selected Site Filter,${siteFilter === 'ALL' ? 'ALL SITES' : `${siteObj?.code} - ${siteObj?.name}`}`);
    lines.push(`Active Week Key,${selectedWeekKey} (${activeWeek?.date_start} to ${activeWeek?.date_end})`);
    lines.push('');

    // SECTION 1: 30-Day D3 Calendar Heatmap Daily Aggregation
    lines.push('--- SECTION 1: D3 HEATMAP 30-DAY ATTENDANCE DENSITY ---');
    lines.push('Date,Day of Week,Active Shifts,Unique Workers,Total Hours Logged,On-Time Clock-Ins,Overtime Shifts,Sites Active');

    // Compute 30 days ending 2026-10-06
    const endDate = new Date('2026-10-06T23:59:59+08:00');
    const startDate30 = new Date(endDate);
    startDate30.setDate(startDate30.getDate() - 29);
    startDate30.setHours(0, 0, 0, 0);

    const dayNameMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 30; i++) {
      const curDate = new Date(startDate30);
      curDate.setDate(curDate.getDate() + i);
      const dStr = curDate.toISOString().substring(0, 10);

      const dayRecords = attendance.filter((a) => {
        if (a.work_date !== dStr) return false;
        if (siteFilter !== 'ALL' && a.site_id !== siteFilter) return false;
        return true;
      });

      const shifts = dayRecords.length;
      const workerSet = new Set(dayRecords.map((r) => r.employee_id));
      const totalHrs = Math.round(dayRecords.reduce((acc, r) => acc + (r.work_hours || 0), 0) * 10) / 10;
      const onTime = dayRecords.filter((r) => {
        if (!r.time_in) return false;
        const [h, m] = r.time_in.split(':').map(Number);
        return h < 7 || (h === 7 && m <= 5);
      }).length;
      const ot = dayRecords.filter((r) => (r.work_hours || 0) > 8).length;
      const daySites = Array.from(new Set(dayRecords.map((r) => r.site_id))).join('; ') || 'None';

      lines.push(
        [
          dStr,
          dayNameMap[curDate.getDay()],
          shifts,
          workerSet.size,
          totalHrs,
          onTime,
          ot,
          `"${daySites}"`,
        ].join(',')
      );
    }

    lines.push('');

    // SECTION 2: Filtered Attendance Records (Site / Range Details)
    lines.push('--- SECTION 2: SITE ATTENDANCE DETAILED SHIFT LOGS ---');
    lines.push('Attendance ID,Employee ID,Employee Name,Site Code,Work Date,Time In,Time Out,Break Mins,Hours Logged,Source,QR Version');

    const filteredRecords = attendance.filter((a) => {
      if (siteFilter !== 'ALL' && a.site_id !== siteFilter) return false;
      return true;
    });

    filteredRecords.forEach((r) => {
      const emp = employees.find((e) => e.employee_id === r.employee_id);
      const s = sites.find((st) => st.site_id === r.site_id);
      const empName = emp ? `"${emp.name.replace(/"/g, '""')}"` : r.employee_id;
      const siteCode = s?.code || r.site_id;

      lines.push(
        [
          r.attendance_id,
          r.employee_id,
          empName,
          siteCode,
          r.work_date,
          r.time_in || 'N/A',
          r.time_out || 'N/A',
          r.break_minutes || 0,
          r.work_hours || 0,
          r.source || 'QR',
          r.qr_version || 1,
        ].join(',')
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Attendance & Weekly DTR Engine
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Asia/Manila (PHT)</span>
            <span>·</span>
            <span>Break Rule: <strong className="text-white">90 mins deducted</strong> (10:00, 12:00, 15:00)</span>
            <span>·</span>
            <span>Standard: <strong className="text-[#a3e635]">8.0 work hours/shift</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadAttendanceCSV}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            title="Download CSV export containing site attendance logs and D3 30-day heatmap density metrics"
          >
            <Download className="w-4 h-4 text-[#080f0d]" />
            Download CSV
          </button>
          <button
            onClick={() => {
              setDtrTargetEmployeeId(undefined);
              setIsDTRReportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#10b981]/20 border border-[#10b981]/60 text-emerald-300 hover:text-white hover:bg-[#10b981]/30 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            title="Generate and export weekly DTR reports as PDF or CSV files for specific employees"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#a3e635]" />
            Export Weekly DTR
          </button>
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-white hover:border-[#a3e635] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-[#a3e635]" />
            Turnstile QR Scanner
          </button>
          <button
            onClick={() => setIsManualOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#10b981]" />
            Manual Attendance
          </button>
          <button
            onClick={() => setIsRolloverOpen(true)}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Sunday Rollover
          </button>
        </div>
      </div>

      {/* Week & Site Selector Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 font-semibold">WEEK:</span>
            <select
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="bg-transparent text-[#a3e635] font-bold font-mono outline-none cursor-pointer"
            >
              {dtrWeeks.map((w) => (
                <option key={w.week_key} value={w.week_key} className="bg-[#13241f] text-white">
                  {w.week_key} ({w.date_start} to {w.date_end}) {w.status === 'active' ? '[ACTIVE]' : '[FINALIZED]'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <span className="text-slate-500 font-semibold">SITE:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#13241f]">All Project Sites</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id} className="bg-[#13241f]">
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setDtrTargetEmployeeId(undefined);
              setIsDTRReportModalOpen(true);
            }}
            className="text-xs text-[#a3e635] hover:text-white flex items-center gap-1.5 font-semibold bg-[#13241f] px-2.5 py-1 rounded-md border border-[#234338] hover:border-[#10b981]"
          >
            <Download className="w-3.5 h-3.5" />
            Export DTR (PDF / CSV)
          </button>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 underline underline-offset-4"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            View Correction History ({dtrChanges.length})
          </button>
        </div>
      </div>

      {/* Visual D3 Calendar Heatmap: 30-Day Attendance Density */}
      <AttendanceCalendarHeatmap
        currentSiteFilter={siteFilter}
        onDateClick={(dateStr) => {
          // If clicked date belongs to an existing week in dtrWeeks, switch active week
          const matchingWeek = dtrWeeks.find(
            (w) => dateStr >= w.date_start && dateStr <= w.date_end
          );
          if (matchingWeek) {
            setSelectedWeekKey(matchingWeek.week_key);
          }
        }}
      />

      {/* DTR Grid Matrix */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">ID Key</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Site</th>
                {weekDates.map((date, idx) => (
                  <th key={date} className="p-2.5 text-center min-w-[85px]">
                    <div className="font-bold text-slate-300">{dayNames[idx]}</div>
                    <div className="text-[9px] font-mono text-slate-500">{date.substring(5)}</div>
                  </th>
                ))}
                <th className="p-3 text-right">Total Hours</th>
                <th className="p-3 text-center">DTR Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filteredEmployees.map((emp) => {
                let empTotalHours = 0;

                return (
                  <tr key={emp.employee_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#a3e635] whitespace-nowrap">
                      {emp.employee_id}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400">{emp.position}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {emp.site_id}
                    </td>

                    {/* Day Cells */}
                    {weekDates.map((date) => {
                      const att = attendance.find(
                        (a) => a.employee_id === emp.employee_id && a.work_date === date
                      );

                      if (att && att.time_in) {
                        empTotalHours += att.work_hours || 0;
                        return (
                          <td
                            key={date}
                            onClick={() => {
                              setCorrectingRecord({
                                attendance_id: att.attendance_id,
                                employee_id: emp.employee_id,
                                work_date: date,
                                time_in: att.time_in,
                                time_out: att.time_out || '16:30',
                              });
                              setCorrectionReason('');
                              setIsCorrectionOpen(true);
                            }}
                            className="p-1.5 text-center cursor-pointer hover:bg-emerald-500/10 transition-colors"
                            title="Click to edit or correct attendance entry"
                          >
                            <div className="text-[11px] font-mono font-bold text-emerald-400">{att.time_in}</div>
                            <div className="text-[10px] font-mono text-slate-400">{att.time_out || '-'}</div>
                            <div className="text-[9px] font-mono text-slate-500">
                              {att.work_hours ? `${att.work_hours.toFixed(1)}h` : ''}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={date}
                          onClick={() => {
                            setManualForm({
                              employee_id: emp.employee_id,
                              site_id: emp.site_id,
                              work_date: date,
                              time_in: '07:00',
                              time_out: '16:30',
                              break_minutes: 90,
                            });
                            setIsManualOpen(true);
                          }}
                          className="p-1.5 text-center cursor-pointer text-slate-600 hover:bg-[#13241f] text-[11px] font-mono"
                          title="Click to log attendance"
                        >
                          -
                        </td>
                      );
                    })}

                    <td className="p-3 text-right font-mono font-black text-sm text-[#a3e635] whitespace-nowrap">
                      {empTotalHours.toFixed(1)} hrs
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setDtrTargetEmployeeId(emp.employee_id);
                          setIsDTRReportModalOpen(true);
                        }}
                        title={`Generate & Export Weekly DTR for ${emp.name} (PDF/CSV)`}
                        className="px-2.5 py-1 bg-[#13241f] hover:bg-[#10b981] hover:text-white border border-[#234338] hover:border-[#10b981] text-emerald-300 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 mx-auto shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#a3e635]" />
                        <span>Export DTR</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Turnstile Camera QR Scanner Modal */}
      <TurnstileQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        targetSiteId={siteFilter === 'ALL' ? undefined : siteFilter}
      />

      {/* Manual Attendance Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white">Manual Attendance Entry</h2>
              <button onClick={() => setIsManualOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                <select
                  value={manualForm.employee_id}
                  onChange={(e) => {
                    const emp = employees.find((em) => em.employee_id === e.target.value);
                    setManualForm({
                      ...manualForm,
                      employee_id: e.target.value,
                      site_id: emp?.site_id || manualForm.site_id,
                    });
                  }}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                >
                  {employees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.name} ({e.employee_id}) - {e.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site *</label>
                  <select
                    value={manualForm.site_id}
                    onChange={(e) => setManualForm({ ...manualForm, site_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.work_date}
                    onChange={(e) => setManualForm({ ...manualForm, work_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time In *</label>
                  <input
                    type="time"
                    required
                    value={manualForm.time_in}
                    onChange={(e) => setManualForm({ ...manualForm, time_in: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Out</label>
                  <input
                    type="time"
                    value={manualForm.time_out}
                    onChange={(e) => setManualForm({ ...manualForm, time_out: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Break Duration (Minutes)</label>
                <input
                  type="number"
                  value={manualForm.break_minutes}
                  onChange={(e) => setManualForm({ ...manualForm, break_minutes: Number(e.target.value) })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
                <div className="text-[10px] text-slate-500 mt-1">Standard: 90 mins (1.5h) deducted automatically</div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {isCorrectionOpen && correctingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Correct DTR Record</h2>
                <div className="text-[11px] text-[#a3e635] font-mono">
                  {correctingRecord.employee_id} ({correctingRecord.work_date})
                </div>
              </div>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3.5 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-amber-300 text-[11px]">
                <strong>Forensic Audit Requirement:</strong> Every manual correction requires an explicit justification reason which is logged in the permanent audit trail.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time In</label>
                  <input
                    type="time"
                    required
                    value={correctingRecord.time_in}
                    onChange={(e) => setCorrectingRecord({ ...correctingRecord, time_in: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Out</label>
                  <input
                    type="time"
                    required
                    value={correctingRecord.time_out}
                    onChange={(e) => setCorrectingRecord({ ...correctingRecord, time_out: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for DTR Correction *</label>
                <textarea
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-20 placeholder-slate-500"
                  placeholder="e.g. Turnstile scanner jammed during site gate rush; time verified with site safety supervisor..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669]"
                >
                  Save & Log Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sunday Midnight Rollover Modal */}
      {isRolloverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Sunday Midnight Weekly Rollover
              </h2>
              <button onClick={() => setIsRolloverOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRolloverSubmit} className="space-y-3.5 text-xs">
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-lg text-emerald-300 text-[11px]">
                Archives current week (<strong>{selectedWeekKey}</strong>) as finalized and starts a new working week. Historical records remain permanently viewable.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Working Week Key *</label>
                <input
                  type="text"
                  required
                  value={rolloverForm.next_week}
                  onChange={(e) => setRolloverForm({ ...rolloverForm, next_week: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  placeholder="e.g. 2026-W42"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date (Monday) *</label>
                  <input
                    type="date"
                    required
                    value={rolloverForm.date_start}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, date_start: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date (Sunday) *</label>
                  <input
                    type="date"
                    required
                    value={rolloverForm.date_end}
                    onChange={(e) => setRolloverForm({ ...rolloverForm, date_end: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRolloverOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Execute Rollover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DTR Changes History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#a3e635]" />
                DTR Correction Audit Trail ({dtrChanges.length} entries)
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-2 flex-1">
              {dtrChanges.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No correction records logged yet.</div>
              ) : (
                dtrChanges.map((chg) => (
                  <div key={chg.change_id} className="p-3 bg-[#13241f] border border-[#234338] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#a3e635]">{chg.employee_id}</span>
                      <span className="font-mono text-[10px] text-slate-500">{chg.changed_at}</span>
                    </div>
                    <div className="text-slate-300">
                      Changed from <code className="text-red-400">{chg.before_value}</code> &rarr;{' '}
                      <code className="text-emerald-400 font-bold">{chg.after_value}</code> by{' '}
                      <strong className="text-white">{chg.changed_by}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 italic bg-[#080f0d] p-1.5 rounded-sm">
                      "{chg.reason}"
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#234338] text-right">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly DTR Generator & Exporter Modal */}
      <WeeklyDTRReportModal
        isOpen={isDTRReportModalOpen}
        onClose={() => setIsDTRReportModalOpen(false)}
        preselectedEmployeeId={dtrTargetEmployeeId}
        preselectedWeekKey={selectedWeekKey}
      />
    </div>
  );
};
