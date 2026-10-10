import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
// Master Project Work Breakdown Data for De Rueda Construction Sites
import {
  Calendar,
  Layers,
  Flag,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ChevronRight,
  Maximize2,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  CalendarCheck,
} from 'lucide-react';

export interface GanttTask {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  name: string;
  category: 'Civil Works' | 'Structural' | 'Architectural' | 'MEPF' | 'Handover';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Delayed';
  supervisor: string;
  isCriticalPath?: boolean;
}

export interface GanttMilestone {
  id: string;
  siteId: string;
  siteName: string;
  siteCode: string;
  name: string;
  targetDate: string; // YYYY-MM-DD
  status: 'Achieved' | 'Upcoming' | 'Critical';
  description: string;
}

const STORAGE_MILESTONES_KEY = 'DERUEDA_ERP_GANTT_MILESTONES_V1';

// Master Project Work Breakdown Data for De Rueda Construction Sites
const GANTT_TASKS: GanttTask[] = [
  // SITE-001: Mariveles Industrial Park Warehouse A
  {
    id: 'T-101',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Site Grading & Deep Piling Works',
    category: 'Civil Works',
    startDate: '2026-02-01',
    endDate: '2026-04-10',
    progress: 100,
    status: 'Completed',
    supervisor: 'Engr. Marco De Rueda',
    isCriticalPath: true,
  },
  {
    id: 'T-102',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'RC Foundation & Heavy Tie Beams',
    category: 'Civil Works',
    startDate: '2026-03-20',
    endDate: '2026-06-15',
    progress: 100,
    status: 'Completed',
    supervisor: 'Engr. Marco De Rueda',
    isCriticalPath: true,
  },
  {
    id: 'T-103',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Structural Steel Framing & Pre-cast Walls',
    category: 'Structural',
    startDate: '2026-06-01',
    endDate: '2026-10-25',
    progress: 84,
    status: 'In Progress',
    supervisor: 'Engr. Marco De Rueda',
    isCriticalPath: true,
  },
  {
    id: 'T-104',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Metal Sheet Roofing & Insulation Cladding',
    category: 'Architectural',
    startDate: '2026-09-10',
    endDate: '2026-11-20',
    progress: 52,
    status: 'In Progress',
    supervisor: 'Foreman Danilo Santos',
    isCriticalPath: false,
  },
  {
    id: 'T-105',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'High-Bay Industrial Lighting & Fire Sprinklers',
    category: 'MEPF',
    startDate: '2026-10-15',
    endDate: '2026-12-15',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Engr. Marco De Rueda',
    isCriticalPath: false,
  },
  {
    id: 'T-106',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Slab Burnishing & Final DOLE Compliance Turn-over',
    category: 'Handover',
    startDate: '2026-11-25',
    endDate: '2026-12-30',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Engr. Marco De Rueda',
    isCriticalPath: true,
  },

  // SITE-002: Subic Commercial Complex
  {
    id: 'T-201',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Excavation & Perimeter Soldier Pile Shoring',
    category: 'Civil Works',
    startDate: '2026-03-15',
    endDate: '2026-05-30',
    progress: 100,
    status: 'Completed',
    supervisor: 'Engr. Aris Valdez',
    isCriticalPath: true,
  },
  {
    id: 'T-202',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Concrete Podium & Core Shear Walls',
    category: 'Civil Works',
    startDate: '2026-05-15',
    endDate: '2026-08-31',
    progress: 100,
    status: 'Completed',
    supervisor: 'Engr. Aris Valdez',
    isCriticalPath: true,
  },
  {
    id: 'T-203',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: '3-Storey Retail Superstructure & Suspended Slabs',
    category: 'Structural',
    startDate: '2026-08-01',
    endDate: '2026-11-10',
    progress: 70,
    status: 'In Progress',
    supervisor: 'Engr. Aris Valdez',
    isCriticalPath: true,
  },
  {
    id: 'T-204',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Curtain Wall Facade & Double-Glazed Glass',
    category: 'Architectural',
    startDate: '2026-10-01',
    endDate: '2026-12-15',
    progress: 25,
    status: 'In Progress',
    supervisor: 'Foreman Ruel Cruz',
    isCriticalPath: false,
  },
  {
    id: 'T-205',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Central Chiller HVAC & Primary Substation',
    category: 'MEPF',
    startDate: '2026-10-20',
    endDate: '2027-01-10',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Engr. Aris Valdez',
    isCriticalPath: true,
  },
  {
    id: 'T-206',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Subic Bay Freeport LGU Occupancy Clearance',
    category: 'Handover',
    startDate: '2026-12-15',
    endDate: '2027-01-25',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Engr. Aris Valdez',
    isCriticalPath: true,
  },

  // SITE-003: Balanga Residential Heights - Phase 2
  {
    id: 'T-301',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Land Development & Storm Drainage Network',
    category: 'Civil Works',
    startDate: '2026-05-10',
    endDate: '2026-07-20',
    progress: 100,
    status: 'Completed',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: true,
  },
  {
    id: 'T-302',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: '24 Duplex Reinforced Footings & Ground Beams',
    category: 'Civil Works',
    startDate: '2026-07-01',
    endDate: '2026-09-15',
    progress: 100,
    status: 'Completed',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: true,
  },
  {
    id: 'T-303',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: '2nd Floor Slabs & Exterior CHB Masonry',
    category: 'Structural',
    startDate: '2026-08-25',
    endDate: '2026-11-05',
    progress: 58,
    status: 'In Progress',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: true,
  },
  {
    id: 'T-304',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Light-Gauge Steel Trusses & Color Roof Panels',
    category: 'Structural',
    startDate: '2026-10-10',
    endDate: '2026-12-10',
    progress: 12,
    status: 'In Progress',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: false,
  },
  {
    id: 'T-305',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Plumbing Rough-ins & Electrical Feeder Conduits',
    category: 'MEPF',
    startDate: '2026-11-01',
    endDate: '2027-01-15',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: false,
  },
  {
    id: 'T-306',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Interior Paint, Tiling & Client Handover',
    category: 'Handover',
    startDate: '2026-12-20',
    endDate: '2027-02-15',
    progress: 0,
    status: 'Scheduled',
    supervisor: 'Foreman Felipe Ramos',
    isCriticalPath: true,
  },
];

const GANTT_MILESTONES: GanttMilestone[] = [
  {
    id: 'M-101',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Substructure Acceptance',
    targetDate: '2026-06-15',
    status: 'Achieved',
    description: 'Foundation and underground utility signoff by structural PE',
  },
  {
    id: 'M-102',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Steel Framing Topping Off',
    targetDate: '2026-10-20',
    status: 'Critical',
    description: 'Final primary steel beam erection and crane dismantling',
  },
  {
    id: 'M-103',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Power Energization & Substation',
    targetDate: '2026-11-30',
    status: 'Upcoming',
    description: 'High-voltage transformer energization and testing',
  },
  {
    id: 'M-104',
    siteId: 'SITE-001',
    siteName: 'Mariveles Industrial Park Warehouse A',
    siteCode: 'Site 001',
    name: 'Final DOLE OSHC Safety Clearance',
    targetDate: '2026-12-20',
    status: 'Upcoming',
    description: 'Regional labor inspection for certificate of occupancy',
  },
  {
    id: 'M-201',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Basement Shoring Signoff',
    targetDate: '2026-05-30',
    status: 'Achieved',
    description: 'Geotechnical soil stability certification',
  },
  {
    id: 'M-202',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Roof Level Superstructure Pour',
    targetDate: '2026-11-10',
    status: 'Upcoming',
    description: '3rd-storey concrete deck completion',
  },
  {
    id: 'M-203',
    siteId: 'SITE-002',
    siteName: 'Subic Commercial Complex',
    siteCode: 'Site 002',
    name: 'Watertight Envelope Signoff',
    targetDate: '2026-12-15',
    status: 'Upcoming',
    description: 'Glass facade and roof seal water-test validation',
  },
  {
    id: 'M-301',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: '24-Unit Footings Complete',
    targetDate: '2026-09-15',
    status: 'Achieved',
    description: 'Subgrade inspection and quality test pass for 24 units',
  },
  {
    id: 'M-302',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Roofing Envelope Enclosure',
    targetDate: '2026-11-15',
    status: 'Upcoming',
    description: 'Truss install and waterproofing before interior trades',
  },
  {
    id: 'M-303',
    siteId: 'SITE-003',
    siteName: 'Balanga Residential Heights - Phase 2',
    siteCode: 'Site 003',
    name: 'Phase 2 Homeowner Handover',
    targetDate: '2027-02-10',
    status: 'Upcoming',
    description: 'Official occupancy certificate issuance and key turnover',
  },
];

interface TooltipData {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  dateRange: string;
  durationDays: number;
  progress?: number;
  status: string;
  supervisor?: string;
  category?: string;
  isMilestone?: boolean;
}

interface ProjectGanttChartProps {
  initialSiteFilter?: string;
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({
  initialSiteFilter = 'ALL',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [siteFilter, setSiteFilter] = useState<string>(initialSiteFilter);
  const [viewMode, setViewMode] = useState<'all' | 'critical' | 'milestones'>('all');
  const [timeZoom, setTimeZoom] = useState<'full' | 'quarter'>('full');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMilestones, setShowMilestones] = useState<boolean>(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Editable Milestones State with localStorage persistence
  const [milestones, setMilestones] = useState<GanttMilestone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MILESTONES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // storage unavailable
    }
    return GANTT_MILESTONES;
  });

  // Modal state for editing/adding milestones
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<GanttMilestone | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState<{
    name: string;
    siteId: string;
    targetDate: string;
    status: 'Achieved' | 'Upcoming' | 'Critical';
    description: string;
  }>({
    name: '',
    siteId: 'SITE-001',
    targetDate: '2026-10-20',
    status: 'Upcoming',
    description: '',
  });

  // Save milestones helper
  const saveMilestonesToStateAndStorage = (updated: GanttMilestone[]) => {
    setMilestones(updated);
    try {
      localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  };

  const handleOpenAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneFormData({
      name: '',
      siteId: siteFilter !== 'ALL' ? siteFilter : 'SITE-001',
      targetDate: '2026-10-20',
      status: 'Critical',
      description: '',
    });
    setIsMilestoneModalOpen(true);
  };

  const handleOpenEditMilestone = (m: GanttMilestone) => {
    setEditingMilestone(m);
    setMilestoneFormData({
      name: m.name,
      siteId: m.siteId,
      targetDate: m.targetDate,
      status: m.status,
      description: m.description,
    });
    setIsMilestoneModalOpen(true);
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    saveMilestonesToStateAndStorage(updated);
    setIsMilestoneModalOpen(false);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneFormData.name.trim() || !milestoneFormData.targetDate) return;

    const siteLookup: Record<string, { code: string; name: string }> = {
      'SITE-001': { code: 'Site 001', name: 'Mariveles Industrial Park Warehouse A' },
      'SITE-002': { code: 'Site 002', name: 'Subic Commercial Complex' },
      'SITE-003': { code: 'Site 003', name: 'Balanga Residential Heights - Phase 2' },
    };

    const siteInfo = siteLookup[milestoneFormData.siteId] || {
      code: milestoneFormData.siteId,
      name: milestoneFormData.siteId,
    };

    if (editingMilestone) {
      // Update existing
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              name: milestoneFormData.name.trim(),
              siteId: milestoneFormData.siteId,
              siteCode: siteInfo.code,
              siteName: siteInfo.name,
              targetDate: milestoneFormData.targetDate,
              status: milestoneFormData.status,
              description: milestoneFormData.description.trim(),
            }
          : m
      );
      saveMilestonesToStateAndStorage(updated);
    } else {
      // Add new
      const newMilestone: GanttMilestone = {
        id: `M-${Date.now().toString(36).toUpperCase()}`,
        siteId: milestoneFormData.siteId,
        siteCode: siteInfo.code,
        siteName: siteInfo.name,
        name: milestoneFormData.name.trim(),
        targetDate: milestoneFormData.targetDate,
        status: milestoneFormData.status,
        description: milestoneFormData.description.trim(),
      };
      saveMilestonesToStateAndStorage([...milestones, newMilestone]);
    }

    setIsMilestoneModalOpen(false);
  };

  // Today reference date in Asia/Manila context
  const TODAY_STR = '2026-10-06';
  const todayDate = useMemo(() => new Date(`${TODAY_STR}T00:00:00+08:00`), []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return GANTT_TASKS.filter((t) => {
      if (siteFilter !== 'ALL' && t.siteId !== siteFilter) return false;
      if (viewMode === 'critical' && !t.isCriticalPath) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.supervisor.toLowerCase().includes(q) ||
          t.siteCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [siteFilter, viewMode, searchQuery]);

  // Filter milestones from dynamic state
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (siteFilter !== 'ALL' && m.siteId !== siteFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.siteCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [milestones, siteFilter, searchQuery]);

  // Combined row items to render in Gantt rows
  const rowItems = useMemo(() => {
    if (viewMode === 'milestones') {
      return filteredMilestones.map((m) => ({
        type: 'milestone' as const,
        id: m.id,
        name: m.name,
        siteCode: m.siteCode,
        siteName: m.siteName,
        date: m.targetDate,
        raw: m,
      }));
    }

    return filteredTasks.map((t) => ({
      type: 'task' as const,
      id: t.id,
      name: t.name,
      siteCode: t.siteCode,
      siteName: t.siteName,
      startDate: t.startDate,
      endDate: t.endDate,
      progress: t.progress,
      status: t.status,
      category: t.category,
      isCriticalPath: t.isCriticalPath,
      raw: t,
    }));
  }, [filteredTasks, filteredMilestones, viewMode]);

  // D3 Chart Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 960;
    const margin = { top: 50, right: 35, bottom: 35, left: 240 };
    const width = Math.max(containerWidth, 800) - margin.left - margin.right;

    const rowHeight = 36;
    const height = Math.max(rowItems.length * rowHeight, 180);

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // Time domain definition
    let domainStart = new Date('2026-02-01T00:00:00+08:00');
    let domainEnd = new Date('2027-02-28T00:00:00+08:00');

    if (timeZoom === 'quarter') {
      domainStart = new Date('2026-08-01T00:00:00+08:00');
      domainEnd = new Date('2026-12-31T00:00:00+08:00');
    }

    const xScale = d3.scaleTime().domain([domainStart, domainEnd]).range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(rowItems.map((d) => d.id))
      .range([0, height])
      .padding(0.25);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Month Grid Columns & Alternate Background Striping
    const months = d3.timeMonth.range(domainStart, domainEnd);
    months.forEach((m, idx) => {
      const x1 = xScale(m);
      const nextMonth = d3.timeMonth.offset(m, 1);
      const x2 = xScale(nextMonth > domainEnd ? domainEnd : nextMonth);
      const w = Math.max(x2 - x1, 0);

      if (idx % 2 === 1) {
        g.append('rect')
          .attr('x', x1)
          .attr('y', 0)
          .attr('width', w)
          .attr('height', height)
          .attr('fill', '#ffffff')
          .attr('opacity', 0.02);
      }

      // Vertical month grid line
      g.append('line')
        .attr('x1', x1)
        .attr('y1', 0)
        .attr('x2', x1)
        .attr('y2', height)
        .attr('stroke', '#234338')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,3');
    });

    // Time Header (Month Labels)
    const headerGroup = g.append('g').attr('class', 'timeline-header');
    months.forEach((m) => {
      const x = xScale(m);
      const monthFormat = d3.timeFormat("%b '%y");
      headerGroup
        .append('text')
        .attr('x', x + 8)
        .attr('y', -16)
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .text(monthFormat(m));
    });

    // Timeline top divider line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', -6)
      .attr('x2', width)
      .attr('y2', -6)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1.5);

    // Timeline bottom divider line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', height)
      .attr('x2', width)
      .attr('y2', height)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1);

    // Left Y-Axis separator line
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('y1', margin.top - 20)
      .attr('x2', margin.left)
      .attr('y2', margin.top + height)
      .attr('stroke', '#234338')
      .attr('stroke-width', 1.5);

    // Left Row Headers (Task / Milestone Labels outside chart area)
    const labelGroup = svg.append('g').attr('transform', `translate(16, ${margin.top})`);

    rowItems.forEach((item) => {
      const y = yScale(item.id) || 0;
      const barH = yScale.bandwidth();

      // Row hover highlight background
      g.append('rect')
        .attr('x', 0)
        .attr('y', y - 2)
        .attr('width', width)
        .attr('height', barH + 4)
        .attr('fill', '#ffffff')
        .attr('opacity', 0)
        .attr('class', `row-bg-${item.id}`)
        .style('transition', 'opacity 0.15s ease');

      // Left site tag
      labelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', y + barH / 2 - 4)
        .attr('fill', '#a3e635')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '700')
        .text(item.siteCode);

      // Left task / milestone title (truncated cleanly if long)
      const fullTitle = item.name;
      const maxLen = 27;
      const displayTitle = fullTitle.length > maxLen ? fullTitle.substring(0, maxLen) + '…' : fullTitle;

      const titleEl = labelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', y + barH / 2 + 9)
        .attr('fill', '#f1f5f9')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('cursor', 'pointer')
        .text(displayTitle);

      titleEl.append('title').text(fullTitle);
    });

    // Render Bars or Milestones
    rowItems.forEach((item) => {
      const y = yScale(item.id) || 0;
      const barH = yScale.bandwidth();

      if (item.type === 'task') {
        const task = item.raw as GanttTask;
        const taskStart = new Date(`${task.startDate}T00:00:00+08:00`);
        const taskEnd = new Date(`${task.endDate}T23:59:59+08:00`);

        const x1 = Math.max(xScale(taskStart), 0);
        const x2 = Math.min(xScale(taskEnd), width);
        const barW = Math.max(x2 - x1, 4);

        const progressW = (barW * task.progress) / 100;

        // Background Planned Duration Bar
        const barBg = g
          .append('rect')
          .attr('x', x1)
          .attr('y', y)
          .attr('width', barW)
          .attr('height', barH)
          .attr('rx', 5)
          .attr('fill', task.isCriticalPath ? '#3b1c1c' : '#132822')
          .attr('stroke', task.isCriticalPath ? '#ef4444' : '#234338')
          .attr('stroke-width', 1)
          .attr('cursor', 'pointer');

        // Progress Completed Fill Bar
        let progressFill = '#10b981'; // emerald
        if (task.status === 'Completed') progressFill = '#a3e635'; // lime
        else if (task.isCriticalPath) progressFill = '#f59e0b'; // amber

        g.append('rect')
          .attr('x', x1)
          .attr('y', y)
          .attr('width', progressW)
          .attr('height', barH)
          .attr('rx', 5)
          .attr('fill', progressFill)
          .attr('opacity', 0.85)
          .attr('pointer-events', 'none');

        // Percentage label inside or next to the bar
        if (barW > 45) {
          g.append('text')
            .attr('x', x1 + 8)
            .attr('y', y + barH / 2 + 4)
            .attr('fill', task.progress > 40 ? '#080f0d' : '#e2e8f0')
            .attr('font-size', '10px')
            .attr('font-weight', '700')
            .attr('font-family', 'monospace')
            .attr('pointer-events', 'none')
            .text(`${task.progress}%`);
        } else {
          g.append('text')
            .attr('x', x1 + barW + 6)
            .attr('y', y + barH / 2 + 4)
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('font-family', 'monospace')
            .attr('pointer-events', 'none')
            .text(`${task.progress}%`);
        }

        // Critical Path Badge or Status Dot
        if (task.isCriticalPath && barW > 80) {
          g.append('circle')
            .attr('cx', x1 + barW - 10)
            .attr('cy', y + barH / 2)
            .attr('r', 3)
            .attr('fill', '#ef4444')
            .attr('pointer-events', 'none');
        }

        // Mouse hover interaction for Task Bar
        barBg
          .on('mouseenter', (event: MouseEvent) => {
            d3.select(`.row-bg-${item.id}`).attr('opacity', 0.05);
            const durationDays = Math.round((taskEnd.getTime() - taskStart.getTime()) / 86400000);
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              title: task.name,
              subtitle: `${task.siteCode} · ${task.siteName}`,
              dateRange: `${task.startDate} to ${task.endDate}`,
              durationDays,
              progress: task.progress,
              status: task.status,
              supervisor: task.supervisor,
              category: task.category,
              isMilestone: false,
            });
          })
          .on('mousemove', (event: MouseEvent) => {
            setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
          })
          .on('mouseleave', () => {
            d3.select(`.row-bg-${item.id}`).attr('opacity', 0);
            setTooltip(null);
          });
      } else {
        // Milestone item row
        const m = item.raw as GanttMilestone;
        const targetD = new Date(`${m.targetDate}T00:00:00+08:00`);
        const mx = xScale(targetD);

        // Milestone Diamond Marker
        const diamondSize = 10;
        let diamondColor = '#10b981';
        if (m.status === 'Critical') diamondColor = '#ef4444';
        if (m.status === 'Upcoming') diamondColor = '#a3e635';

        const milestoneG = g
          .append('g')
          .attr('transform', `translate(${mx}, ${y + barH / 2})`)
          .attr('cursor', 'pointer');

        // Connecting subtle line
        g.append('line')
          .attr('x1', mx)
          .attr('y1', 0)
          .attr('x2', mx)
          .attr('y2', height)
          .attr('stroke', diamondColor)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.3);

        milestoneG
          .append('polygon')
          .attr(
            'points',
            `0,-${diamondSize} ${diamondSize},0 0,${diamondSize} -${diamondSize},0`
          )
          .attr('fill', diamondColor)
          .attr('stroke', '#080f0d')
          .attr('stroke-width', 2);

        // Milestone text label
        g.append('text')
          .attr('x', mx + 14)
          .attr('y', y + barH / 2 + 4)
          .attr('fill', diamondColor)
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .text(m.name);

        milestoneG
          .on('mouseenter', (event: MouseEvent) => {
            setTooltip({
              x: event.clientX,
              y: event.clientY,
              title: m.name,
              subtitle: `${m.siteCode} · ${m.siteName}`,
              dateRange: `${m.targetDate} (Click to edit)`,
              durationDays: 1,
              status: m.status,
              isMilestone: true,
            });
          })
          .on('mousemove', (event: MouseEvent) => {
            setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
          })
          .on('mouseleave', () => {
            setTooltip(null);
          })
          .on('click', () => {
            setTooltip(null);
            handleOpenEditMilestone(m);
          });
      }
    });

    // Milestone Diamonds overlay across task rows when showMilestones is toggled
    if (showMilestones && viewMode !== 'milestones') {
      filteredMilestones.forEach((m) => {
        const mDate = new Date(`${m.targetDate}T00:00:00+08:00`);
        if (mDate >= domainStart && mDate <= domainEnd) {
          const mx = xScale(mDate);
          let mColor = '#10b981';
          if (m.status === 'Critical') mColor = '#ef4444';
          if (m.status === 'Upcoming') mColor = '#a3e635';

          // Floating flag pin along top header
          const flagG = g
            .append('g')
            .attr('transform', `translate(${mx}, -16)`)
            .attr('cursor', 'pointer');

          flagG
            .append('polygon')
            .attr('points', '0,-6 8,-2 0,2')
            .attr('fill', mColor);

          flagG
            .append('line')
            .attr('x1', 0)
            .attr('y1', -6)
            .attr('x2', 0)
            .attr('y2', height + 16)
            .attr('stroke', mColor)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,4')
            .attr('opacity', 0.4);

          flagG
            .on('mouseenter', (event: MouseEvent) => {
              setTooltip({
                x: event.clientX,
                y: event.clientY,
                title: m.name,
                subtitle: `${m.siteCode} · ${m.description}`,
                dateRange: `${m.targetDate} (Click to edit)`,
                durationDays: 1,
                status: m.status,
                isMilestone: true,
              });
            })
            .on('mousemove', (event: MouseEvent) => {
              setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
            })
            .on('mouseleave', () => setTooltip(null))
            .on('click', () => {
              setTooltip(null);
              handleOpenEditMilestone(m);
            });
        }
      });
    }

    // Vertical "TODAY" beacon line (2026-10-06 Asia/Manila)
    if (todayDate >= domainStart && todayDate <= domainEnd) {
      const todayX = xScale(todayDate);

      // Background glow line
      g.append('line')
        .attr('x1', todayX)
        .attr('y1', -25)
        .attr('x2', todayX)
        .attr('y2', height)
        .attr('stroke', '#a3e635')
        .attr('stroke-width', 3)
        .attr('opacity', 0.25);

      // Sharp today line
      g.append('line')
        .attr('x1', todayX)
        .attr('y1', -25)
        .attr('x2', todayX)
        .attr('y2', height)
        .attr('stroke', '#a3e635')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,2');

      // Top "TODAY" pill tag
      const todayTag = g
        .append('g')
        .attr('transform', `translate(${todayX}, -34)`)
        .attr('pointer-events', 'none');

      todayTag
        .append('rect')
        .attr('x', -36)
        .attr('y', 0)
        .attr('width', 72)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#a3e635');

      todayTag
        .append('text')
        .attr('x', 0)
        .attr('y', 11)
        .attr('text-anchor', 'middle')
        .attr('fill', '#080f0d')
        .attr('font-size', '9px')
        .attr('font-weight', '900')
        .attr('font-family', 'monospace')
        .text('TODAY · OCT 6');
    }
  }, [rowItems, timeZoom, filteredMilestones, showMilestones, viewMode, todayDate]);

  // Aggregate stats
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'In Progress').length;
  const avgProgress = totalTasks
    ? Math.round(filteredTasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
    : 0;

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-lg">
      {/* Component Header & Executive Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#234338]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Project Gantt & Milestone Timeline
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>D3-Powered Interactive Schedule</span>
                <span>·</span>
                <span>Baseline: <strong className="text-white">Asia/Manila</strong></span>
                <span>·</span>
                <span>Today: <strong className="text-[#a3e635]">{TODAY_STR}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Overall Velocity:</span>
            <span className="text-[#a3e635] font-bold text-sm">{avgProgress}%</span>
          </div>

          <div className="bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold">Active Packages:</span>
            <span className="text-white font-bold">{inProgressTasks}</span>
            <span className="text-slate-500 font-sans text-[10px]">({completedTasks} done)</span>
          </div>

          <div className="hidden sm:flex bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-[#10b981]" />
            <span className="text-slate-300 font-sans font-semibold text-[11px]">
              {filteredMilestones.length} Milestones Tracked
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Views, and Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#13241f]/70 border border-[#234338] rounded-lg p-2.5">
        {/* Site Segmented Selector */}
        <div className="flex items-center gap-1">
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'SITE-001', label: 'Site 001 (Mariveles)' },
            { id: 'SITE-002', label: 'Site 002 (Subic)' },
            { id: 'SITE-003', label: 'Site 003 (Balanga)' },
          ].map((site) => (
            <button
              key={site.id}
              onClick={() => setSiteFilter(site.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                siteFilter === site.id
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {site.label}
            </button>
          ))}
        </div>

        {/* View Mode & Zoom Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode */}
          <div className="flex items-center bg-[#0e1a16] border border-[#234338] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'all' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setViewMode('critical')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'critical' ? 'bg-[#ef4444]/30 text-red-200 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical Path
            </button>
            <button
              onClick={() => setViewMode('milestones')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'milestones' ? 'bg-[#a3e635]/20 text-[#a3e635] font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Milestones Only
            </button>
          </div>

          {/* Time Zoom */}
          <div className="flex items-center bg-[#0e1a16] border border-[#234338] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setTimeZoom('full')}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeZoom === 'full' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2026-2027
            </button>
            <button
              onClick={() => setTimeZoom('quarter')}
              className={`px-2 py-0.5 rounded transition-colors ${
                timeZoom === 'quarter' ? 'bg-[#234338] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Q3-Q4 '26
            </button>
          </div>

          {/* Toggle Milestone Indicators */}
          {viewMode !== 'milestones' && (
            <button
              onClick={() => setShowMilestones(!showMilestones)}
              className={`px-2 py-1 border rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                showMilestones
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-[#0e1a16] border-[#234338] text-slate-400 hover:text-white'
              }`}
              title="Toggle milestone flags on timeline"
            >
              <Flag className="w-3 h-3" />
              <span>Milestones</span>
            </button>
          )}

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-[#0e1a16] border border-[#234338] rounded-md text-xs text-white placeholder-slate-500 outline-none focus:border-[#a3e635] w-32 sm:w-40"
            />
          </div>

          {/* Manager Milestone Tracking Actions */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-[#234338]">
            <button
              onClick={handleOpenAddMilestone}
              className="px-2.5 py-1 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1"
              title="Add a critical project completion date or target milestone"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
            <button
              onClick={() => {
                setViewMode('milestones');
              }}
              className="px-2 py-1 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-md text-xs font-semibold flex items-center gap-1"
              title="View all editable milestones table"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Milestones ({filteredMilestones.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* D3 Gantt Chart Viewport */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto bg-[#0a1411] border border-[#234338] rounded-xl p-2 sm:p-3 relative select-none"
      >
        <svg ref={svgRef} className="block w-full min-w-[760px]"></svg>

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
            <div className="font-bold text-sm text-white mb-0.5">{tooltip.title}</div>
            <div className="text-[11px] text-[#a3e635] font-semibold mb-2">{tooltip.subtitle}</div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">{tooltip.isMilestone ? 'Target Date:' : 'Schedule:'}</span>
                <span className="font-mono text-white">{tooltip.dateRange}</span>
              </div>

              {!tooltip.isMilestone && (
                <>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-mono text-white">{tooltip.durationDays} calendar days</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Completion:</span>
                    <span className="font-mono text-emerald-400 font-bold">{tooltip.progress}%</span>
                  </div>
                  {tooltip.supervisor && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Lead:</span>
                      <span className="text-slate-200">{tooltip.supervisor}</span>
                    </div>
                  )}
                  {tooltip.category && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Work Package:</span>
                      <span className="text-slate-200">{tooltip.category}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between gap-4 pt-1 border-t border-[#234338] mt-1">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-semibold ${
                    tooltip.status === 'Completed' || tooltip.status === 'Achieved'
                      ? 'text-[#a3e635]'
                      : tooltip.status === 'Critical'
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}
                >
                  {tooltip.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Legend & Next Upcoming Milestone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        {/* Visual Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-[#a3e635]"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-[#10b981]"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-xs bg-[#f59e0b]"></span>
            <span>Critical Path Work</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#a3e635] inline-block"></span>
            <span>Milestone Marker (Click to edit)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[#a3e635]">
            <span className="w-1.5 h-2.5 border-r border-[#a3e635] border-dashed inline-block"></span>
            <span>Today (Oct 06)</span>
          </div>
        </div>

        {/* Immediate Next Milestone Alert with Click-to-Edit */}
        {filteredMilestones.length > 0 && (
          <div
            onClick={() => {
              const nextM =
                filteredMilestones.find((m) => m.status === 'Critical') ||
                filteredMilestones.find((m) => m.status === 'Upcoming') ||
                filteredMilestones[0];
              if (nextM) handleOpenEditMilestone(nextM);
            }}
            className="flex items-center gap-2 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] px-3 py-1 rounded-lg cursor-pointer transition-colors"
            title="Click to view or edit this critical milestone"
          >
            <Clock className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">
              {filteredMilestones.some((m) => m.status === 'Critical') ? 'Critical Milestone:' : 'Next Milestone:'}{' '}
              <strong className="text-white">
                {(
                  filteredMilestones.find((m) => m.status === 'Critical') ||
                  filteredMilestones.find((m) => m.status === 'Upcoming') ||
                  filteredMilestones[0]
                )?.name}{' '}
                (
                {(
                  filteredMilestones.find((m) => m.status === 'Critical') ||
                  filteredMilestones.find((m) => m.status === 'Upcoming') ||
                  filteredMilestones[0]
                )?.targetDate}
                )
              </strong>
            </span>
            <Edit2 className="w-3 h-3 text-[#a3e635]" />
          </div>
        )}
      </div>

      {/* Editable Milestone Modal for Managers */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-xl max-w-md w-full shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {editingMilestone ? 'Edit Critical Milestone' : 'Add Project Milestone'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Highlight critical completion dates directly in the Gantt timeline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Milestone Name / Critical Target <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel Framing Topping Off, Power Energization..."
                  value={milestoneFormData.name}
                  onChange={(e) =>
                    setMilestoneFormData({ ...milestoneFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Site <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={milestoneFormData.siteId}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, siteId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635]"
                  >
                    <option value="SITE-001">Site 001 - Mariveles</option>
                    <option value="SITE-002">Site 002 - Subic</option>
                    <option value="SITE-003">Site 003 - Balanga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Completion Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={milestoneFormData.targetDate}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, targetDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white font-mono outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Milestone Criticality & Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Critical', label: 'Critical Path', color: 'border-red-500/40 text-red-300 bg-red-950/20' },
                    { value: 'Upcoming', label: 'Upcoming', color: 'border-[#a3e635]/40 text-[#a3e635] bg-[#a3e635]/10' },
                    { value: 'Achieved', label: 'Achieved', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setMilestoneFormData({
                          ...milestoneFormData,
                          status: s.value as any,
                        })
                      }
                      className={`py-2 px-2 border rounded-lg text-center font-semibold transition-all ${
                        milestoneFormData.status === s.value
                          ? `${s.color} ring-1 ring-[#a3e635]`
                          : 'bg-[#13241f] border-[#234338] text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Description / Engineering Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Geotechnical structural signoff, LGU occupancy clearance, crane dismantling..."
                  value={milestoneFormData.description}
                  onChange={(e) =>
                    setMilestoneFormData({ ...milestoneFormData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#13241f] border border-[#234338] rounded-lg text-white outline-none focus:border-[#a3e635] resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#234338]">
                {editingMilestone ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(editingMilestone.id)}
                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMilestoneModalOpen(false)}
                    className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-extrabold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingMilestone ? 'Save Milestone' : 'Add Milestone'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
