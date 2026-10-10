import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import { Employee, Site } from '../../types';
import {
  Users,
  AlertTriangle,
  Building,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  HardHat,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export interface SiteLaborMetric {
  siteId: string;
  code: string;
  name: string;
  supervisor: string;
  plannedCapacity: number;
  allocatedWorkers: Employee[];
  allocatedCount: number;
  utilizationRate: number; // percentage e.g. 133
  isOverAllocated: boolean;
  overAllocatedDelta: number;
  tradesBreakdown: Record<string, number>;
}

export interface TradeMetric {
  trade: string;
  totalAllocated: number;
  recommendedQuota: number;
  isOverAllocated: boolean;
  sitesDistribution: Record<string, number>;
}

export interface LaborCapacityWidgetProps {
  onNavigateToEmployees?: () => void;
}

export const LaborCapacityWidget: React.FC<LaborCapacityWidgetProps> = ({
  onNavigateToEmployees,
}) => {
  const { sites, employees, attendance, updateEmployee, addAuditLog } = useApp();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<'sites' | 'trades' | 'overallocated'>('sites');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [rebalanceToast, setRebalanceToast] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    details: string[];
    isWarning?: boolean;
  }>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    details: [],
  });

  // Base labor capacity configuration per active construction site
  // Site 001 planned capacity: 2 workers, Site 002 planned: 2 workers, Site 003 planned: 2 workers
  // (In real projects, this comes from site safety and project staging quotas)
  const SITE_PLANNED_CAPACITIES: Record<string, number> = {
    'SITE-001': 2,
    'SITE-002': 2,
    'SITE-003': 2,
  };

  // Compute active sites labor metrics
  const siteMetrics: SiteLaborMetric[] = useMemo(() => {
    const activeSites = sites.filter(
      (s) => s.project_status === 'Active' || s.project_status === 'In Progress'
    );

    return activeSites.map((site) => {
      const assigned = employees.filter(
        (e) => e.site_id === site.site_id && e.status !== 'archived'
      );
      const planned = SITE_PLANNED_CAPACITIES[site.site_id] || 2;
      const count = assigned.length;
      const utilization = planned > 0 ? (count / planned) * 100 : 0;
      const isOver = count > planned;
      const delta = Math.max(0, count - planned);

      const trades: Record<string, number> = {};
      assigned.forEach((emp) => {
        const trade = emp.position.split('/')[0].trim();
        trades[trade] = (trades[trade] || 0) + 1;
      });

      return {
        siteId: site.site_id,
        code: site.code,
        name: site.name,
        supervisor: site.supervisor,
        plannedCapacity: planned,
        allocatedWorkers: assigned,
        allocatedCount: count,
        utilizationRate: utilization,
        isOverAllocated: isOver,
        overAllocatedDelta: delta,
        tradesBreakdown: trades,
      };
    });
  }, [sites, employees]);

  // Over-allocated sites subset
  const overAllocatedSites = useMemo(() => {
    return siteMetrics.filter((sm) => sm.isOverAllocated);
  }, [siteMetrics]);

  // Overall enterprise labor metrics
  const totalAllocated = useMemo(() => {
    return siteMetrics.reduce((sum, s) => sum + s.allocatedCount, 0);
  }, [siteMetrics]);

  const totalCapacity = useMemo(() => {
    return siteMetrics.reduce((sum, s) => sum + s.plannedCapacity, 0);
  }, [siteMetrics]);

  const overallUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  // Breakdown by Trade Category across all sites
  const tradeMetrics: TradeMetric[] = useMemo(() => {
    const map: Record<string, { total: number; sites: Record<string, number> }> = {};

    employees
      .filter((e) => e.status !== 'archived')
      .forEach((emp) => {
        const trade = emp.position.split('/')[0].trim();
        if (!map[trade]) {
          map[trade] = { total: 0, sites: {} };
        }
        map[trade].total += 1;
        const siteCode = sites.find((s) => s.site_id === emp.site_id)?.code || emp.site_id;
        map[trade].sites[siteCode] = (map[trade].sites[siteCode] || 0) + 1;
      });

    // Trades with recommended quota
    const tradeQuotas: Record<string, number> = {
      'Lead Mason': 1,
      'Master Carpenter': 1,
      'Heavy Equipment Operator': 1,
      'Certified Welder': 1,
      'Licensed Master Electrician': 1,
      'Plumber & Pipefitter': 1,
      'General Construction Laborer': 1,
    };

    return Object.entries(map).map(([trade, data]) => {
      const quota = tradeQuotas[trade] || 1;
      return {
        trade,
        totalAllocated: data.total,
        recommendedQuota: quota,
        isOverAllocated: data.total > quota,
        sitesDistribution: data.sites,
      };
    });
  }, [employees, sites]);

  // Quick worker rebalancing action (e.g. transfer over-allocated worker from Site 001 to under-allocated Site)
  const handleQuickRebalance = (employeeId: string, targetSiteId: string, workerName: string, sourceSiteCode: string, targetSiteCode: string) => {
    const emp = employees.find((e) => e.employee_id === employeeId);
    if (!emp) return;

    updateEmployee(employeeId, {
      site_id: targetSiteId,
      updated_at: new Date().toISOString(),
    });

    addAuditLog(
      'REBALANCE_LABOR_CAPACITY',
      'EMPLOYEE_RESOURCE',
      employeeId,
      `Rebalanced labor capacity: Transferred ${workerName} from ${sourceSiteCode} (over-allocated) to ${targetSiteCode}`
    );

    setRebalanceToast(
      `Successfully rebalanced workforce: Transferred ${workerName} to ${targetSiteCode}. Labor capacity realigned!`
    );

    setTimeout(() => {
      setRebalanceToast(null);
    }, 6000);
  };

  // ==========================================
  // D3 VISUALIZATION RENDER
  // ==========================================
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const height = 260;
    const margin = { top: 30, right: 30, bottom: 50, left: 55 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define gradients and patterns for over-allocation warning
    const defs = svg.append('defs');

    // Over-allocated striped pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'overallocated-hatch')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternTransform', 'rotate(45 0 0)')
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 8)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3);

    // Gradients
    const gradientNormal = defs
      .append('linearGradient')
      .attr('id', 'bar-normal-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradientNormal.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradientNormal.append('stop').attr('offset', '100%').attr('stop-color', '#065f46');

    const gradientOver = defs
      .append('linearGradient')
      .attr('id', 'bar-over-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradientOver.append('stop').attr('offset', '0%').attr('stop-color', '#f87171');
    gradientOver.append('stop').attr('offset', '100%').attr('stop-color', '#b91c1c');

    const gradientPlanned = defs
      .append('linearGradient')
      .attr('id', 'bar-planned-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradientPlanned.append('stop').attr('offset', '0%').attr('stop-color', '#334155');
    gradientPlanned.append('stop').attr('offset', '100%').attr('stop-color', '#1e293b');

    // Prepare chart data based on viewMode
    if (viewMode === 'sites' || viewMode === 'overallocated') {
      const data = viewMode === 'overallocated' ? overAllocatedSites : siteMetrics;

      if (data.length === 0) {
        g.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94a3b8')
          .attr('font-size', '13px')
          .text('No over-allocated sites currently detected. All active projects within capacity!');
        return;
      }

      // X Scale (Sites)
      const x0 = d3
        .scaleBand()
        .domain(data.map((d) => d.code))
        .range([0, innerWidth])
        .padding(0.28);

      // Sub-bars: [Planned, Allocated]
      const subKeys = ['Planned Capacity', 'Allocated Workers'];
      const x1 = d3
        .scaleBand()
        .domain(subKeys)
        .range([0, x0.bandwidth()])
        .padding(0.12);

      // Y Scale (Headcount)
      const maxVal = Math.max(4, d3.max(data, (d) => Math.max(d.plannedCapacity, d.allocatedCount)) || 4);
      const y = d3
        .scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0]);

      // Gridlines
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .call((grid) => grid.select('.domain').remove())
        .call((grid) =>
          grid
            .selectAll('.tick line')
            .attr('stroke', '#1e382f')
            .attr('stroke-dasharray', '2,3')
        );

      // Render Groups per Site
      const siteGroup = g
        .selectAll('.site-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'site-group')
        .attr('transform', (d) => `translate(${x0(d.code)},0)`);

      // 1. Planned Capacity Bar
      siteGroup
        .append('rect')
        .attr('x', () => x1('Planned Capacity') || 0)
        .attr('y', (d) => y(d.plannedCapacity))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => Math.max(0, innerHeight - y(d.plannedCapacity)))
        .attr('fill', 'url(#bar-planned-grad)')
        .attr('stroke', '#475569')
        .attr('stroke-dasharray', '3,2')
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          setTooltipData({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            title: `${d.code}: Planned Baseline Quota`,
            details: [
              `Target Capacity: ${d.plannedCapacity} workers`,
              `Supervisor: ${d.supervisor}`,
              `Engineering Limit: 100% SLA limit`,
            ],
            isWarning: false,
          });
        })
        .on('mouseleave', () => setTooltipData((prev) => ({ ...prev, visible: false })));

      // 2. Allocated Workers Bar
      siteGroup
        .append('rect')
        .attr('x', () => x1('Allocated Workers') || 0)
        .attr('y', (d) => y(d.allocatedCount))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => Math.max(0, innerHeight - y(d.allocatedCount)))
        .attr('fill', (d) => (d.isOverAllocated ? 'url(#bar-over-grad)' : 'url(#bar-normal-grad)'))
        .attr('stroke', (d) => (d.isOverAllocated ? '#ef4444' : '#10b981'))
        .attr('stroke-width', (d) => (d.isOverAllocated ? 1.5 : 1))
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const tradeList = Object.entries(d.tradesBreakdown).map(
            ([trade, c]) => `• ${trade}: ${c} worker(s)`
          );
          setTooltipData({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            title: `${d.code} Workforce Allocation`,
            details: [
              `Allocated: ${d.allocatedCount} workers (Planned: ${d.plannedCapacity})`,
              `Utilization: ${d.utilizationRate.toFixed(0)}%`,
              d.isOverAllocated
                ? `⚠️ OVER-ALLOCATED BY +${d.overAllocatedDelta} WORKER(S)`
                : `✓ Optimal Headcount`,
              ...tradeList,
            ],
            isWarning: d.isOverAllocated,
          });
        })
        .on('mouseleave', () => setTooltipData((prev) => ({ ...prev, visible: false })));

      // If over-allocated, overlay diagonal warning hatching on the delta portion
      siteGroup
        .filter((d) => d.isOverAllocated)
        .append('rect')
        .attr('x', () => x1('Allocated Workers') || 0)
        .attr('y', (d) => y(d.allocatedCount))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => Math.max(0, y(d.plannedCapacity) - y(d.allocatedCount)))
        .attr('fill', 'url(#overallocated-hatch)')
        .attr('opacity', 0.85)
        .attr('rx', 4)
        .style('pointer-events', 'none');

      // Value Labels above bars
      siteGroup
        .append('text')
        .attr('x', () => (x1('Allocated Workers') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => y(d.allocatedCount) - 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', (d) => (d.isOverAllocated ? '#f87171' : '#a3e635'))
        .text((d) => `${d.allocatedCount}`);

      // Over-allocated Badge Tag above peak bar
      siteGroup
        .filter((d) => d.isOverAllocated)
        .append('text')
        .attr('x', () => (x1('Allocated Workers') || 0) + x1.bandwidth() / 2)
        .attr('y', (d) => y(d.allocatedCount) - 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '900')
        .attr('fill', '#ef4444')
        .text((d) => `+${d.overAllocatedDelta} OVER`);

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0))
        .call((axis) => axis.select('.domain').attr('stroke', '#234338'))
        .call((axis) =>
          axis
            .selectAll('.tick text')
            .attr('fill', '#e2e8f0')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
        );

      // Y Axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(maxVal).tickFormat(d3.format('d')))
        .call((axis) => axis.select('.domain').attr('stroke', '#234338'))
        .call((axis) =>
          axis
            .selectAll('.tick text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-family', 'monospace')
        );

      // Y Axis Label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -42)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text('Labor Headcount (Workers)');
    } else {
      // TRADES VIEW
      const x = d3
        .scaleBand()
        .domain(tradeMetrics.map((t) => t.trade))
        .range([0, innerWidth])
        .padding(0.3);

      const maxVal = Math.max(3, d3.max(tradeMetrics, (t) => t.totalAllocated) || 3);
      const y = d3
        .scaleLinear()
        .domain([0, maxVal + 1])
        .range([innerHeight, 0]);

      // Gridlines
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(y)
            .ticks(4)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .call((grid) => grid.select('.domain').remove())
        .call((grid) =>
          grid
            .selectAll('.tick line')
            .attr('stroke', '#1e382f')
            .attr('stroke-dasharray', '2,3')
        );

      // Trade bars
      g.selectAll('.trade-bar')
        .data(tradeMetrics)
        .enter()
        .append('rect')
        .attr('class', 'trade-bar')
        .attr('x', (d) => x(d.trade) || 0)
        .attr('y', (d) => y(d.totalAllocated))
        .attr('width', x.bandwidth())
        .attr('height', (d) => Math.max(0, innerHeight - y(d.totalAllocated)))
        .attr('fill', (d) => (d.isOverAllocated ? 'url(#bar-over-grad)' : 'url(#bar-normal-grad)'))
        .attr('stroke', (d) => (d.isOverAllocated ? '#ef4444' : '#10b981'))
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const dist = Object.entries(d.sitesDistribution).map(
            ([sCode, cnt]) => `• ${sCode}: ${cnt} worker(s)`
          );
          setTooltipData({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            title: `${d.trade} Allocation`,
            details: [
              `Total Active: ${d.totalAllocated} worker(s)`,
              `Target Quota: ${d.recommendedQuota} worker(s)`,
              d.isOverAllocated
                ? `⚠️ OVER-ALLOCATED TRADE SPECIALTY`
                : `✓ Balanced Capacity`,
              ...dist,
            ],
            isWarning: d.isOverAllocated,
          });
        })
        .on('mouseleave', () => setTooltipData((prev) => ({ ...prev, visible: false })));

      // Labels
      g.selectAll('.trade-label')
        .data(tradeMetrics)
        .enter()
        .append('text')
        .attr('x', (d) => (x(d.trade) || 0) + x.bandwidth() / 2)
        .attr('y', (d) => y(d.totalAllocated) - 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', (d) => (d.isOverAllocated ? '#f87171' : '#a3e635'))
        .text((d) => `${d.totalAllocated}`);

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x))
        .call((axis) => axis.select('.domain').attr('stroke', '#234338'))
        .call((axis) =>
          axis
            .selectAll('.tick text')
            .attr('fill', '#e2e8f0')
            .attr('font-size', '10px')
            .attr('transform', 'rotate(-15)')
            .attr('text-anchor', 'end')
        );

      // Y Axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(maxVal).tickFormat(d3.format('d')))
        .call((axis) => axis.select('.domain').attr('stroke', '#234338'))
        .call((axis) =>
          axis
            .selectAll('.tick text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-family', 'monospace')
        );
    }
  }, [siteMetrics, tradeMetrics, overAllocatedSites, viewMode]);

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                Labor Capacity & Worker Allocation (D3)
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  overAllocatedSites.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {overAllocatedSites.length > 0
                  ? `⚠️ ${overAllocatedSites.length} OVER-ALLOCATED SITE${overAllocatedSites.length > 1 ? 'S' : ''}`
                  : 'ALL SITES WITHIN CAP'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive D3 workforce distribution visualization highlighting over-allocated sites and trade resource bottlenecks
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#13241f] p-1 rounded-lg border border-[#234338]">
          <button
            onClick={() => setViewMode('sites')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'sites'
                ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Sites
          </button>
          <button
            onClick={() => setViewMode('overallocated')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'overallocated'
                ? 'bg-red-500 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>Over-Allocated ({overAllocatedSites.length})</span>
          </button>
          <button
            onClick={() => setViewMode('trades')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'trades'
                ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trade Skills
          </button>
        </div>
      </div>

      {/* Summary KPI Readout Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Active Workforce</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {totalAllocated} Workers
          </div>
          <div className="text-[10px] text-slate-500">Across {siteMetrics.length} Active Sites</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Target Labor Cap</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {totalCapacity} Baseline Quota
          </div>
          <div className="text-[10px] text-slate-500">Site safety threshold</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Allocation Rate</div>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              overallUtilization > 100 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {overallUtilization.toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500">
            {overallUtilization > 100 ? 'Slightly over-allocated' : 'Optimal capacity'}
          </div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Bottlenecks Flagged</div>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              overAllocatedSites.length > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {overAllocatedSites.length} Site{overAllocatedSites.length === 1 ? '' : 's'}
          </div>
          <div className="text-[10px] text-slate-500">Requires resource rebalance</div>
        </div>
      </div>

      {/* D3 SVG Container */}
      <div ref={containerRef} className="w-full bg-[#13241f]/30 border border-[#234338] rounded-xl p-3 relative">
        <svg ref={svgRef} className="w-full h-auto overflow-visible select-none" />

        {/* Legend */}
        <div className="mt-2 pt-2 border-t border-[#234338]/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-[#10b981] inline-block border border-emerald-400/50" />
              <span>Allocated Headcount (Optimal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-rose-600 inline-block border border-red-400" />
              <span>Over-Allocated Resources (Exceeding Cap)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#334155] inline-block border border-slate-500 border-dashed" />
              <span>Planned Capacity Target Baseline</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500">
            Hover over bars to inspect trade roles & site supervisors
          </div>
        </div>
      </div>

      {/* Rebalance Toast */}
      {rebalanceToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{rebalanceToast}</span>
          </div>
          <button
            onClick={() => setRebalanceToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Over-Allocated Resources Highlight Cards */}
      {overAllocatedSites.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Over-Allocated Construction Sites & Recommended Rebalancing Actions
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ISO 9001 Labor Efficiency Guard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overAllocatedSites.map((site) => {
              // Find under-allocated candidate sites to transfer to
              const candidateSites = siteMetrics.filter(
                (sm) => sm.siteId !== site.siteId && !sm.isOverAllocated
              );

              return (
                <div
                  key={site.siteId}
                  className="bg-red-950/20 border border-red-500/40 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{site.name}</span>
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-[#13241f] text-[#a3e635] border border-[#234338]">
                          {site.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Supervisor: <strong className="text-white">{site.supervisor}</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                        +{site.overAllocatedDelta} OVER CAP ({site.utilizationRate.toFixed(0)}%)
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {site.allocatedCount} assigned / {site.plannedCapacity} planned
                      </div>
                    </div>
                  </div>

                  {/* Workers currently allocated to this site */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Crew ({site.allocatedWorkers.length}):
                    </div>
                    <div className="space-y-1">
                      {site.allocatedWorkers.map((emp) => (
                        <div
                          key={emp.employee_id}
                          className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-white">{emp.name}</span>
                            <span className="text-slate-400 ml-1.5 text-[10px]">
                              ({emp.position})
                            </span>
                          </div>

                          {candidateSites.length > 0 && (
                            <button
                              onClick={() =>
                                handleQuickRebalance(
                                  emp.employee_id,
                                  candidateSites[0].siteId,
                                  emp.name,
                                  site.code,
                                  candidateSites[0].code
                                )
                              }
                              className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
                              title={`Transfer worker to ${candidateSites[0].code} to balance site labor quotas`}
                            >
                              <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                              <span>Transfer to {candidateSites[0].code}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltipData.visible && (
        <div
          className={`fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 p-2.5 rounded-lg text-xs shadow-2xl backdrop-blur-md border ${
            tooltipData.isWarning
              ? 'bg-red-950/95 border-red-500/60 text-white'
              : 'bg-[#0e1a16]/95 border-[#234338] text-slate-200'
          }`}
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y - 10}px`,
          }}
        >
          <div className="font-bold text-white text-xs border-b border-white/10 pb-1 mb-1">
            {tooltipData.title}
          </div>
          <div className="space-y-0.5 text-[11px]">
            {tooltipData.details.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
