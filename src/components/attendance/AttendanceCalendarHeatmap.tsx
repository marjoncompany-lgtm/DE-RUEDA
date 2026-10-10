import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Sparkles,
  Info,
  Building2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react';

interface DayDensity {
  dateStr: string;
  dateObj: Date;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfMonth: number;
  monthName: string;
  weekIndex: number;
  totalShifts: number;
  uniqueWorkers: number;
  totalHours: number;
  onTimeCount: number;
  overtimeCount: number;
  sites: string[];
  workerNames: string[];
}

interface AttendanceCalendarHeatmapProps {
  currentSiteFilter?: string;
  onDateClick?: (dateStr: string) => void;
}

export const AttendanceCalendarHeatmap: React.FC<AttendanceCalendarHeatmapProps> = ({
  currentSiteFilter = 'ALL',
  onDateClick,
}) => {
  const { attendance, employees, sites } = useApp();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeSite, setActiveSite] = useState<string>(currentSiteFilter);
  const [selectedDay, setSelectedDay] = useState<DayDensity | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: DayDensity;
  } | null>(null);

  // Sync prop changes if parent site filter shifts
  useEffect(() => {
    setActiveSite(currentSiteFilter);
  }, [currentSiteFilter]);

  // Anchor date: 2026-10-06 (Asia/Manila reference date)
  const ANCHOR_DATE_STR = '2026-10-06';

  // Compute the 30-day window ending on ANCHOR_DATE_STR
  const dayDensities = useMemo<DayDensity[]>(() => {
    const densities: DayDensity[] = [];
    const endDate = new Date(`${ANCHOR_DATE_STR}T23:59:59+08:00`);

    // 30 days prior
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    // Compute calendar grid week offsets based on Monday as start of week
    // Monday = 0, Tuesday = 1, ..., Sunday = 6
    const getWeekDayIndex = (d: Date) => {
      const day = d.getDay(); // 0 is Sun, 1 is Mon
      return day === 0 ? 6 : day - 1;
    };

    const firstMonday = new Date(startDate);
    const firstDayShift = getWeekDayIndex(firstMonday);
    firstMonday.setDate(firstMonday.getDate() - firstDayShift);

    for (let i = 0; i < 30; i++) {
      const current = new Date(startDate);
      current.setDate(current.getDate() + i);
      const dateStr = current.toISOString().substring(0, 10);

      // Filter matching attendance records for this date and site
      const records = attendance.filter((a) => {
        if (a.work_date !== dateStr) return false;
        if (activeSite !== 'ALL' && a.site_id !== activeSite) return false;
        return true;
      });

      const totalShifts = records.length;
      const workerIds = Array.from(new Set(records.map((r) => r.employee_id)));
      const workerNames = workerIds
        .map((id) => employees.find((e) => e.employee_id === id)?.name || id)
        .slice(0, 6);

      const totalHours = Math.round(records.reduce((acc, r) => acc + (r.work_hours || 0), 0) * 10) / 10;
      const onTimeCount = records.filter((r) => {
        if (!r.time_in) return false;
        const [h, m] = r.time_in.split(':').map(Number);
        return h < 7 || (h === 7 && m <= 5);
      }).length;
      const overtimeCount = records.filter((r) => (r.work_hours || 0) > 8).length;
      const presentSites = Array.from(new Set(records.map((r) => r.site_id)));

      // Calculate column index from firstMonday
      const diffDays = Math.floor((current.getTime() - firstMonday.getTime()) / 86400000);
      const weekIndex = Math.floor(diffDays / 7);

      densities.push({
        dateStr,
        dateObj: current,
        dayOfWeek: getWeekDayIndex(current),
        dayOfMonth: current.getDate(),
        monthName: current.toLocaleString('default', { month: 'short' }),
        weekIndex,
        totalShifts,
        uniqueWorkers: workerIds.length,
        totalHours,
        onTimeCount,
        overtimeCount,
        sites: presentSites,
        workerNames,
      });
    }

    return densities;
  }, [attendance, activeSite, employees]);

  // Aggregate 30-Day Metrics
  const total30DayShifts = useMemo(
    () => dayDensities.reduce((acc, d) => acc + d.totalShifts, 0),
    [dayDensities]
  );
  const total30DayHours = useMemo(
    () => Math.round(dayDensities.reduce((acc, d) => acc + d.totalHours, 0)),
    [dayDensities]
  );
  const workDaysCount = dayDensities.filter((d) => d.dayOfWeek !== 6).length; // Mon-Sat
  const avgDailyAttendance = workDaysCount ? (total30DayShifts / workDaysCount).toFixed(1) : '0';

  const peakDay = useMemo(() => {
    return [...dayDensities].sort((a, b) => b.totalShifts - a.totalShifts)[0];
  }, [dayDensities]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 720;
    const margin = { top: 32, right: 24, bottom: 20, left: 52 };

    const cellSize = Math.min(Math.floor((containerWidth - margin.left - margin.right) / 6.2), 48);
    const cellPadding = 5;

    const numWeeks = Math.max(...dayDensities.map((d) => d.weekIndex)) + 1;
    const width = numWeeks * (cellSize + cellPadding) + margin.left + margin.right;
    const height = 7 * (cellSize + cellPadding) + margin.top + margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Quantized Color Scale matching construction dark-emerald & lime theme
    const maxShifts = Math.max(...dayDensities.map((d) => d.totalShifts), 7);

    // Color steps:
    // 0: #13241f (dark empty surface)
    // 1-2: #194033 (low density)
    // 3-4: #136043 (moderate)
    // 5-6: #10b981 (high emerald)
    // 7+: #a3e635 (peak neon lime)
    const colorScale = (val: number): string => {
      if (val === 0) return '#13241f';
      if (val <= 2) return '#1b4336';
      if (val <= 4) return '#166534';
      if (val <= 6) return '#10b981';
      return '#a3e635';
    };

    // Day of week labels (Mon to Sun)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayLabels.forEach((label, i) => {
      g.append('text')
        .attr('x', -12)
        .attr('y', i * (cellSize + cellPadding) + cellSize / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('fill', i === 6 ? '#64748b' : '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '600')
        .text(label);
    });

    // Month headers (Sep, Oct)
    const monthOffsets: { [month: string]: number } = {};
    dayDensities.forEach((d) => {
      if (!(d.monthName in monthOffsets)) {
        monthOffsets[d.monthName] = d.weekIndex;
      }
    });

    Object.entries(monthOffsets).forEach(([month, weekIdx]) => {
      g.append('text')
        .attr('x', weekIdx * (cellSize + cellPadding))
        .attr('y', -12)
        .attr('fill', '#a3e635')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '700')
        .text(month.toUpperCase());
    });

    // Draw Heatmap Cells
    dayDensities.forEach((d) => {
      const x = d.weekIndex * (cellSize + cellPadding);
      const y = d.dayOfWeek * (cellSize + cellPadding);
      const isToday = d.dateStr === ANCHOR_DATE_STR;
      const isSelected = selectedDay?.dateStr === d.dateStr;

      const cellG = g.append('g').attr('transform', `translate(${x},${y})`);

      // Cell rectangle
      const rect = cellG
        .append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 6)
        .attr('fill', colorScale(d.totalShifts))
        .attr('stroke', isToday ? '#a3e635' : isSelected ? '#ffffff' : '#234338')
        .attr('stroke-width', isToday || isSelected ? 2 : 1)
        .attr('cursor', 'pointer')
        .style('transition', 'all 0.15s ease');

      // Day of month number
      cellG
        .append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2 - 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d.totalShifts > 6 ? '#080f0d' : d.totalShifts > 0 ? '#ffffff' : '#64748b')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .text(d.dayOfMonth);

      // Shift count indicator badge
      if (d.totalShifts > 0) {
        cellG
          .append('text')
          .attr('x', cellSize / 2)
          .attr('y', cellSize - 7)
          .attr('text-anchor', 'middle')
          .attr('fill', d.totalShifts > 6 ? '#080f0d' : '#a3e635')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '800')
          .attr('pointer-events', 'none')
          .text(`${d.totalShifts}p`);
      }

      // Today Indicator dot
      if (isToday) {
        cellG
          .append('circle')
          .attr('cx', cellSize - 6)
          .attr('cy', 6)
          .attr('r', 2.5)
          .attr('fill', '#a3e635')
          .attr('pointer-events', 'none');
      }

      // Hover and Click Handlers
      rect
        .on('mouseenter', (event: MouseEvent) => {
          rect.attr('stroke', '#a3e635').attr('stroke-width', 2);
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            data: d,
          });
        })
        .on('mousemove', (event: MouseEvent) => {
          setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
        })
        .on('mouseleave', () => {
          rect
            .attr('stroke', isToday ? '#a3e635' : isSelected ? '#ffffff' : '#234338')
            .attr('stroke-width', isToday || isSelected ? 2 : 1);
          setTooltip(null);
        })
        .on('click', () => {
          setSelectedDay(d);
          if (onDateClick) {
            onDateClick(d.dateStr);
          }
        });
    });
  }, [dayDensities, selectedDay, onDateClick]);

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-lg">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                30-Day Site Attendance Calendar Heatmap
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>D3 Density Grid</span>
                <span>·</span>
                <span>Horizon: <strong>Sep 07 – Oct 06, 2026</strong></span>
                <span>·</span>
                <span>Context: <strong className="text-[#a3e635]">{activeSite}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Site Segmented Selector & CSV Export */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 bg-[#13241f] border border-[#234338] rounded-lg p-1">
            {[
              { id: 'ALL', label: 'All Sites' },
              { id: 'SITE-001', label: 'Site 001' },
              { id: 'SITE-002', label: 'Site 002' },
              { id: 'SITE-003', label: 'Site 003' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSite(s.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeSite === s.id
                    ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const siteObj = sites.find((s) => s.site_id === activeSite);
              const siteLabel = activeSite === 'ALL' ? 'All_Sites' : siteObj?.code || activeSite;
              const nowIso = new Date().toISOString().substring(0, 10);
              const filename = `Attendance_Heatmap_${siteLabel}_${nowIso}.csv`;

              const lines: string[] = [];
              lines.push('DE RUEDA CONSTRUCTION BUILDERS - 30-DAY D3 ATTENDANCE HEATMAP REPORT');
              lines.push(`Generated At,${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (PHT)`);
              lines.push(`Site Filter,${activeSite === 'ALL' ? 'ALL SITES' : `${siteObj?.code} - ${siteObj?.name}`}`);
              lines.push(`Total 30-Day Shifts,${total30DayShifts}`);
              lines.push(`Total Hours Logged,${total30DayHours}`);
              lines.push('');
              lines.push('Date,Day of Week,Active Headcount/Shifts,Unique Workers,Total Hours Logged,On-Time Clock-Ins,Overtime Shifts,Sites Present,Sample Worker Names');

              dayDensities.forEach((d) => {
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const names = d.workerNames.join('; ') || 'None';
                lines.push(
                  [
                    d.dateStr,
                    dayNames[d.dayOfWeek],
                    d.totalShifts,
                    d.uniqueWorkers,
                    d.totalHours,
                    d.onTimeCount,
                    d.overtimeCount,
                    `"${d.sites.join('; ') || 'None'}"`,
                    `"${names}"`,
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
            }}
            className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            title="Download CSV of D3 Heatmap daily attendance metrics"
          >
            <Download className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Export Heatmap CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[10px] font-semibold uppercase text-slate-400">30-Day Shifts</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{total30DayShifts}</div>
          <div className="text-[10px] text-slate-400">Total worker check-ins</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Total Hours Logged</div>
          <div className="text-xl font-bold font-mono text-[#a3e635] mt-0.5">
            {total30DayHours} hrs
          </div>
          <div className="text-[10px] text-slate-400">8.0h standard shifts</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Daily Average Headcount</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            {avgDailyAttendance} workers
          </div>
          <div className="text-[10px] text-slate-400">Excludes Sunday breaks</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Peak Attendance Day</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
            {peakDay ? `${peakDay.monthName} ${peakDay.dayOfMonth}` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400">
            {peakDay ? `${peakDay.totalShifts} workers (${peakDay.totalHours} hrs)` : 'No data'}
          </div>
        </div>
      </div>

      {/* D3 Heatmap SVG Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-[#0a1411] border border-[#234338] rounded-xl p-3 flex justify-center select-none"
      >
        <svg ref={svgRef} className="block mx-auto"></svg>

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltip.x + 14}px`,
              top: `${tooltip.y + 14}px`,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
            className="bg-[#0e1a16]/95 border border-[#a3e635]/60 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs animate-in fade-in duration-100"
          >
            <div className="font-extrabold text-white text-xs mb-0.5">
              {tooltip.data.dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-[11px] text-[#a3e635] font-semibold mb-2">
              {tooltip.data.totalShifts === 0
                ? 'No Work Shifts Scheduled'
                : `${tooltip.data.totalShifts} Workers Active (${tooltip.data.totalHours} hrs)`}
            </div>

            {tooltip.data.totalShifts > 0 ? (
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Headcount:</span>
                  <span className="font-mono text-white">{tooltip.data.uniqueWorkers} employees</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Punctuality:</span>
                  <span className="font-mono text-emerald-400">
                    {Math.round((tooltip.data.onTimeCount / tooltip.data.totalShifts) * 100)}% on-time
                  </span>
                </div>
                {tooltip.data.overtimeCount > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Overtime Shifts:</span>
                    <span className="font-mono text-amber-300">{tooltip.data.overtimeCount} workers</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Operational Sites:</span>
                  <span className="font-mono text-slate-200">
                    {tooltip.data.sites.length > 0 ? tooltip.data.sites.join(', ') : 'None'}
                  </span>
                </div>
                {tooltip.data.workerNames.length > 0 && (
                  <div className="pt-1.5 border-t border-[#234338] text-[10px] text-slate-400">
                    Workers: {tooltip.data.workerNames.join(', ')}
                    {tooltip.data.uniqueWorkers > 6 && ' …'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Scheduled rest day or maintenance stand-down
              </div>
            )}

            <div className="text-[9px] text-slate-500 mt-2 text-right">Click to view day breakdown</div>
          </div>
        )}
      </div>

      {/* Heatmap Legend & Selected Day Inspection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        {/* Color Scale Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-semibold">Density Scale:</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#13241f] border border-[#234338]"></span>
              <span>0 (Rest)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#1b4336]"></span>
              <span>1-2</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#166534]"></span>
              <span>3-4</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#10b981]"></span>
              <span>5-6</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#a3e635]"></span>
              <span className="text-[#a3e635] font-bold">7+ (Peak)</span>
            </span>
          </div>
        </div>

        {/* Selected Day Status */}
        {selectedDay ? (
          <div className="bg-[#13241f] border border-[#a3e635]/40 text-slate-200 px-3 py-1 rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a3e635]"></span>
            <span>
              Selected: <strong className="text-white">{selectedDay.dateStr}</strong> &bull;{' '}
              <strong className="text-[#a3e635]">{selectedDay.totalShifts} shifts</strong> (
              {selectedDay.totalHours} hrs)
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-400 hover:text-white ml-1 text-xs"
            >
              &times;
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any day square to inspect worker shifts</span>
          </div>
        )}
      </div>
    </div>
  );
};
