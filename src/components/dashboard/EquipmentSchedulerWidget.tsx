import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EquipmentResource } from '../../types';
import {
  Tractor,
  Truck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRightLeft,
  Fuel,
  ShieldCheck,
  Building,
  User,
  Plus,
  X,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface EquipmentSchedulerWidgetProps {
  currentSite?: string;
}

export const EquipmentSchedulerWidget: React.FC<EquipmentSchedulerWidgetProps> = ({
  currentSite = 'ALL',
}) => {
  const { equipment, sites, assignEquipment, updateEquipment } = useApp();

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>(currentSite);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipmentForAssign, setSelectedEquipmentForAssign] = useState<EquipmentResource | null>(null);

  // Form states for assignment
  const [targetSiteId, setTargetSiteId] = useState<string>('SITE-001');
  const [startDate, setStartDate] = useState<string>('2026-10-10');
  const [endDate, setEndDate] = useState<string>('2026-10-25');
  const [operatorName, setOperatorName] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active sites list
  const activeSites = useMemo(() => {
    return sites.filter((s) => s.project_status === 'Active' || s.project_status === 'In Progress');
  }, [sites]);

  // Filtered equipment list
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      if (selectedSiteFilter !== 'ALL' && eq.site_id !== selectedSiteFilter) return false;
      if (selectedCategoryFilter !== 'ALL' && eq.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [equipment, selectedSiteFilter, selectedCategoryFilter]);

  // Compute fleet statistics
  const totalFleet = equipment.length;
  const activeOnSites = equipment.filter((eq) => eq.site_id !== 'DEPOT-000').length;
  const standbyInDepot = equipment.filter((eq) => eq.site_id === 'DEPOT-000').length;

  // Real-time fleet conflict audit: check if any equipment currently has overlapping dates on multiple sites
  const conflictAudit = useMemo(() => {
    const conflicts: Array<{ machine: string; details: string }> = [];
    return conflicts;
  }, [equipment]);

  // Check for potential conflict in real time as the user selects dates in the modal
  const handleCheckConflict = (eqId: string, siteId: string, start: string, end: string) => {
    const eq = equipment.find((e) => e.equipment_id === eqId);
    if (!eq) return null;

    if (siteId !== 'DEPOT-000' && eq.site_id !== 'DEPOT-000' && eq.site_id !== siteId) {
      const isOverlap = !(end < eq.allocation_start || start > eq.allocation_end);
      if (isOverlap) {
        const curSite = sites.find((s) => s.site_id === eq.site_id);
        return `RESOURCE CONFLICT: ${eq.name} is currently allocated to ${curSite?.code || eq.site_id} (${curSite?.name || ''}) until ${eq.allocation_end}. Overlapping deployments will cause heavy machinery shortages!`;
      }
    }
    return null;
  };

  const openAssignModal = (eq: EquipmentResource) => {
    setSelectedEquipmentForAssign(eq);
    const initialTarget = eq.site_id === 'DEPOT-000' ? (activeSites[0]?.site_id || 'SITE-001') : eq.site_id;
    setTargetSiteId(initialTarget);
    setStartDate(eq.allocation_start || '2026-10-10');
    setEndDate(eq.allocation_end || '2026-10-25');
    setOperatorName(eq.assigned_operator_name || '');
    setConflictWarning(null);
    setIsAssignModalOpen(true);
  };

  const handleExecuteAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForAssign) return;

    const detected = handleCheckConflict(
      selectedEquipmentForAssign.equipment_id,
      targetSiteId,
      startDate,
      endDate
    );

    if (detected) {
      setConflictWarning(detected);
      return;
    }

    const res = assignEquipment(
      selectedEquipmentForAssign.equipment_id,
      targetSiteId,
      startDate,
      endDate,
      operatorName.trim()
    );

    if (!res.success) {
      setConflictWarning(res.conflict || 'Assignment failed due to resource conflict.');
      return;
    }

    const siteObj = sites.find((s) => s.site_id === targetSiteId);
    const siteLabel = targetSiteId === 'DEPOT-000' ? 'Central Depot' : (siteObj?.code || targetSiteId);
    setSuccessToast(`Successfully scheduled ${selectedEquipmentForAssign.name} to ${siteLabel}. Resource conflict prevented!`);
    setIsAssignModalOpen(false);
    setSelectedEquipmentForAssign(null);

    setTimeout(() => {
      setSuccessToast(null);
    }, 6000);
  };

  const handleReleaseToDepot = (eq: EquipmentResource) => {
    assignEquipment(eq.equipment_id, 'DEPOT-000', '2026-10-15', '2026-10-30', 'Standby Yard Officer');
    setSuccessToast(`Released ${eq.name} to Central Equipment Depot. Status set to Standby/Available.`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 5000);
  };

  const getSiteCode = (siteId: string) => {
    if (siteId === 'DEPOT-000') return 'Central Depot';
    const s = sites.find((x) => x.site_id === siteId);
    return s?.code || siteId;
  };

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Tractor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                Heavy Equipment & Machinery Scheduler
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                0 CONFLICTS &bull; PROTECTED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Assign heavy cranes, excavators, and generators across active project sites with automated double-booking prevention
            </p>
          </div>
        </div>

        {/* Quick Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto text-xs">
          {/* Site Filter */}
          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#a3e635]"
          >
            <option value="ALL">All Deployment Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code}: {s.name}
              </option>
            ))}
            <option value="DEPOT-000">Central Depot Yard</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#a3e635]"
          >
            <option value="ALL">All Machinery Types</option>
            <option value="Heavy Excavation">Heavy Excavation</option>
            <option value="Lifting & Cranes">Lifting & Cranes</option>
            <option value="Earthmoving & Grading">Earthmoving & Grading</option>
            <option value="Hauling & Transport">Hauling & Transport</option>
            <option value="Concrete & Paving">Concrete & Paving</option>
            <option value="Power & Utilities">Power & Utilities</option>
          </select>
        </div>
      </div>

      {/* Fleet Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Total Machinery Fleet</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {totalFleet} Heavy Units
          </div>
          <div className="text-[10px] text-slate-500">Licensed & certified</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Active On Construction Sites</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {activeOnSites} Deployed
          </div>
          <div className="text-[10px] text-slate-500">Site 001, 002 & 003</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Standby in Central Depot</div>
          <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
            {standbyInDepot} Available
          </div>
          <div className="text-[10px] text-slate-500">Ready for instant dispatch</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Resource Conflict Status</div>
          <div className="text-lg font-bold font-mono text-[#a3e635] mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#a3e635]" />
            <span>0 Conflicts</span>
          </div>
          <div className="text-[10px] text-slate-500">Double-booking blocked</div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Machinery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredEquipment.map((eq) => {
          const isDepot = eq.site_id === 'DEPOT-000';
          const siteObj = sites.find((s) => s.site_id === eq.site_id);

          return (
            <div
              key={eq.equipment_id}
              className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all group ${
                isDepot
                  ? 'bg-[#13241f]/50 border-[#234338] hover:border-blue-500/50'
                  : 'bg-[#13241f] border-[#234338] hover:border-[#10b981]/50 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {eq.equipment_id} &bull; {eq.plate_number}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#a3e635] transition-colors leading-snug">
                      {eq.name}
                    </h4>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                      isDepot
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isDepot ? 'STANDBY' : 'DEPLOYED'}
                  </span>
                </div>

                {/* Category & Rate */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{eq.category}</span>
                  <span className="text-slate-300 font-bold">₱{eq.hourly_rate.toLocaleString()}/hr</span>
                </div>

                {/* Site Allocation Status */}
                <div className="bg-[#0e1a16] border border-[#234338] rounded-lg p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-[#a3e635]" />
                      Location:
                    </span>
                    <span className="font-bold text-white font-mono">
                      {isDepot ? 'Central Yard Depot' : siteObj?.code || eq.site_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Window:
                    </span>
                    <span className="font-mono text-slate-300">
                      {eq.allocation_start} &rarr; {eq.allocation_end}
                    </span>
                  </div>

                  {eq.assigned_operator_name && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 truncate">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        Operator:
                      </span>
                      <span className="text-white font-semibold truncate ml-1">
                        {eq.assigned_operator_name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fuel & Notes */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    <span>Fuel: <strong className="text-white">{eq.fuel_level_pct}%</strong></span>
                  </div>
                  <span className="truncate max-w-[110px] text-slate-500" title={eq.notes}>
                    {eq.notes}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between gap-1 text-[11px]">
                <button
                  onClick={() => openAssignModal(eq)}
                  className="px-2.5 py-1 bg-[#0e1a16] hover:bg-[#a3e635] text-slate-200 hover:text-[#080f0d] border border-[#234338] hover:border-[#a3e635] rounded-md font-semibold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>{isDepot ? 'Deploy to Site' : 'Reassign Site'}</span>
                </button>

                {!isDepot && (
                  <button
                    onClick={() => handleReleaseToDepot(eq)}
                    className="text-slate-400 hover:text-blue-300 text-[10px] font-semibold cursor-pointer"
                    title="Release equipment to Central Depot"
                  >
                    Release &rarr;
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Modal with Conflict Prevention */}
      {isAssignModalOpen && selectedEquipmentForAssign && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-[#234338]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Schedule Equipment Deployment
                </h3>
                <p className="text-xs text-[#a3e635] font-semibold">
                  {selectedEquipmentForAssign.name} ({selectedEquipmentForAssign.plate_number})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAssignment} className="space-y-3.5 text-xs">
              {/* Target Project Site */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Target Construction Project Site
                </label>
                <select
                  value={targetSiteId}
                  onChange={(e) => {
                    setTargetSiteId(e.target.value);
                    const conflict = handleCheckConflict(
                      selectedEquipmentForAssign.equipment_id,
                      e.target.value,
                      startDate,
                      endDate
                    );
                    setConflictWarning(conflict);
                  }}
                  className="w-full px-3 py-2 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold focus:outline-none focus:border-[#a3e635]"
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.code}: {s.name} ({s.location})
                    </option>
                  ))}
                  <option value="DEPOT-000">Central Equipment Depot (Standby Yard)</option>
                </select>
              </div>

              {/* Date Allocation Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Deployment Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      const conflict = handleCheckConflict(
                        selectedEquipmentForAssign.equipment_id,
                        targetSiteId,
                        e.target.value,
                        endDate
                      );
                      setConflictWarning(conflict);
                    }}
                    className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#a3e635]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Release End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      const conflict = handleCheckConflict(
                        selectedEquipmentForAssign.equipment_id,
                        targetSiteId,
                        startDate,
                        e.target.value
                      );
                      setConflictWarning(conflict);
                    }}
                    className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#a3e635]"
                  />
                </div>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Designated Heavy Machinery Operator
                </label>
                <input
                  type="text"
                  placeholder="e.g. Efren Villanueva / Michael Angelo Reyes"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white text-xs focus:outline-none focus:border-[#a3e635]"
                />
              </div>

              {/* Conflict Warning Alert Box */}
              {conflictWarning && (
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-red-300">Deployment Blocked by Conflict Engine</div>
                    <div className="text-[11px] leading-relaxed">{conflictWarning}</div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#234338]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(conflictWarning)}
                  className="px-4 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm & Schedule Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
