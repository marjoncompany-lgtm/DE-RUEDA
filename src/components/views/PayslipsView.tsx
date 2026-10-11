import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { downloadPayslipBatchPDF, downloadSinglePayslipPDF, PayslipItemData } from '../../utils/exporters';
import { Printer, Filter, Download, FileText, CheckCircle2 } from 'lucide-react';

interface PayslipsViewProps {
  selectedSingleId?: string | null;
  onClearSingleId?: () => void;
}

export const PayslipsView: React.FC<PayslipsViewProps> = ({ selectedSingleId, onClearSingleId }) => {
  const { payroll, employees, dtrWeeks, sites, currentSite } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(dtrWeeks[0]?.week_key || '2026-W40');
  const [siteFilter, setSiteFilter] = useState(currentSite);

  const filtered = payroll.filter((p) => {
    if (selectedSingleId) return p.payroll_id === selectedSingleId;
    const matchW = selectedWeek === 'ALL' || p.week_key === selectedWeek;
    const matchS = siteFilter === 'ALL' || p.site_id === siteFilter;
    return matchW && matchS;
  });

  const getPayslipData = (p: typeof payroll[0]): PayslipItemData => {
    const emp = employees.find((e) => e.employee_id === p.employee_id);
    return {
      payroll_id: p.payroll_id,
      employee_id: p.employee_id,
      name: emp ? emp.name : p.employee_id,
      position: emp ? emp.position : 'Construction Worker',
      site_id: p.site_id,
      week_key: p.week_key,
      daily_rate: p.daily_rate,
      verified_days: p.verified_days,
      verified_hours: p.verified_hours,
      gross_pay: p.gross_pay,
      canteen: p.canteen,
      sss: p.sss,
      philhealth: p.philhealth,
      cash_advance: p.cash_advance,
      other_deduction: p.other_deduction,
      total_deductions: p.total_deductions,
      net_pay: p.net_pay,
      payment_method: p.payment_method,
      payment_status: p.payment_status,
      reference_no: p.reference_no,
    };
  };

  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleDownloadBatchPDF = () => {
    const items = filtered.map(getPayslipData);
    if (!items.length) {
      setErrorBanner('No payslip records available for the current selection.');
      setTimeout(() => setErrorBanner(null), 4000);
      return;
    }
    setErrorBanner(null);
    downloadPayslipBatchPDF(
      `DRC_Payslips_6PerPage_${selectedWeek}_${siteFilter}.pdf`,
      items,
      selectedWeek,
      siteFilter
    );
  };

  const handleDownloadSinglePDF = (p: typeof payroll[0]) => {
    const item = getPayslipData(p);
    downloadSinglePayslipPDF(item);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Weekly Payslips Hub
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Official Letter-Size Batch PDF & Print Generator</span>
            <span>·</span>
            <span>Standard layout: <strong className="text-[#a3e635]">6 Payslips Per Page</strong> (2 &times; 3 Grid)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedSingleId && onClearSingleId && (
            <button
              onClick={onClearSingleId}
              className="px-3 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
            >
              Show All Workers
            </button>
          )}

          <button
            onClick={handleDownloadBatchPDF}
            className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download PDF (6 Per Page)
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Print Current View
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold flex items-center justify-between no-print">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-white ml-2 text-xs">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">PAYROLL WEEK:</span>
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              if (onClearSingleId) onClearSingleId();
            }}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-[#a3e635] font-mono font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Historical Weeks</option>
            {dtrWeeks.map((w) => (
              <option key={w.week_key} value={w.week_key}>
                {w.week_key}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={siteFilter}
            onChange={(e) => {
              setSiteFilter(e.target.value);
              if (onClearSingleId) onClearSingleId();
            }}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Project Sites (Company Batch)</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Ready to export: {filtered.length} payslip cards
        </div>
      </div>

      {/* 6-per-Page Grid Container */}
      <div className="payslip-page-grid grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 bg-[#0e1a16] border border-[#234338] rounded-xl text-xs">
            No payroll entries found for this week. Run "Recalculate Week Payroll" from the Payroll screen.
          </div>
        ) : (
          filtered.map((p) => {
            const emp = employees.find((e) => e.employee_id === p.employee_id);

            return (
              <div
                key={p.payroll_id}
                className="payslip-card-print bg-white text-slate-900 border-2 border-[#1b4332] rounded-lg p-3 flex flex-col justify-between shadow-xs text-xs relative group"
              >
                <div>
                  {/* Card Header */}
                  <div className="bg-[#0f291e] text-white -m-3 mb-2 px-3 py-2 rounded-t-md flex items-center justify-between border-b-2 border-[#a3e635]">
                    <div>
                      <div className="text-[11px] font-black text-[#a3e635] tracking-wider">
                        DE RUEDA CONSTRUCTION
                      </div>
                      <div className="text-[7.5px] text-emerald-200 uppercase font-semibold">
                        OFFICIAL WEEKLY WORKER PAYSLIP
                      </div>
                    </div>
                    <div className="text-right text-[8px] font-mono">
                      <div>Week: <strong>{p.week_key}</strong></div>
                      <div>Ref: <strong>{p.reference_no || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* Worker Info */}
                  <div className="flex items-start justify-between mt-1 mb-2">
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 leading-tight">
                        {emp ? emp.name : p.employee_id}
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold">
                        {emp ? emp.position : 'Field Construction Worker'} &bull; Site: {p.site_id}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                      {p.employee_id}
                    </div>
                  </div>

                  {/* Earnings Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 mb-2 text-[10.5px]">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Daily Wage Rate: <strong>₱{p.daily_rate.toFixed(2)}</strong></span>
                      <span>Verified: <strong>{p.verified_days.toFixed(1)} days</strong> ({p.verified_hours.toFixed(1)} hrs)</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-emerald-900 mt-1 pt-1 border-t border-slate-200">
                      <span>GROSS WAGES EARNED:</span>
                      <span className="font-mono text-xs">₱{p.gross_pay.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Deductions Breakdown */}
                  <div className="border-t border-dashed border-slate-300 pt-1.5 text-[9.5px] space-y-0.5">
                    <div className="font-bold text-slate-600 uppercase text-[8px] tracking-wider">
                      Itemized Deductions & Advances:
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Canteen / Commissary:</span>
                      <span className="font-mono">₱{p.canteen.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SSS Statutory Contribution:</span>
                      <span className="font-mono">₱{p.sss.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>PhilHealth Medical Contribution:</span>
                      <span className="font-mono">₱{p.philhealth.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Recovered Cash Advance (CA):</span>
                      <span className="font-mono font-semibold text-amber-700">₱{p.cash_advance.toFixed(2)}</span>
                    </div>
                    {p.other_deduction > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Other Deductions (PPE):</span>
                        <span className="font-mono">₱{p.other_deduction.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-red-700 pt-0.5 border-t border-slate-200">
                      <span>TOTAL WITHHELD:</span>
                      <span className="font-mono">-₱{p.total_deductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Take-Home Highlight Box */}
                <div className="mt-2.5">
                  <div className="bg-emerald-50 border-2 border-emerald-600 rounded p-1.5 flex items-center justify-between text-emerald-950 font-black">
                    <span className="text-[10px]">NET TAKE-HOME PAY:</span>
                    <span className="font-mono text-sm tracking-tight">₱{p.net_pay.toFixed(2)}</span>
                  </div>

                  {/* Signature acknowledgement and individual PDF download action */}
                  <div className="flex items-center justify-between text-[7.5px] text-slate-500 mt-2 pt-1 border-t border-slate-200">
                    <span>
                      Method: <strong>{p.payment_method}</strong> ({p.payment_status})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadSinglePDF(p)}
                      className="text-emerald-700 hover:underline font-bold text-[8px] no-print"
                    >
                      Download Individual PDF &darr;
                    </button>
                    <span className="print-only">Employee Signature: ______________________</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
