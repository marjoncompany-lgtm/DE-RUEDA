import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Site } from '../../types';
import { Building, Plus, MapPin, User, Calendar, Edit, CheckCircle2, ArrowRight, X } from 'lucide-react';

export const SitesView: React.FC = () => {
  const { sites, employees, currentSite, setCurrentSite, addSite, updateSite } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    supervisor: '',
    start_date: '2026-10-06',
    end_date: '2027-04-30',
    notes: '',
    project_status: 'Active' as const,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSite({
      code: formData.code.trim(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      supervisor: formData.supervisor.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: formData.notes.trim(),
      project_status: formData.project_status,
    });
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    updateSite(editingSite.site_id, editingSite);
    setEditingSite(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Construction Sites & Projects
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Central Luzon & Greater Manila Execution</span>
            <span>·</span>
            <span>Unlimited Scalable Project Expansion</span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Project Site
        </button>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => {
          const assignedWorkers = employees.filter((e) => e.site_id === site.site_id && e.status === 'active');
          const isSelected = currentSite === site.site_id;

          return (
            <div
              key={site.site_id}
              className={`bg-[#0e1a16] border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
                isSelected ? 'border-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.15)]' : 'border-[#234338]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="p-4 bg-[#13241f] border-b border-[#234338] flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#a3e635]">{site.code}</div>
                    <h3 className="text-sm font-bold text-white mt-0.5 leading-snug">{site.name}</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    {site.project_status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{site.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Supervisor: <strong className="text-white">{site.supervisor}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{site.start_date || 'N/A'} &rarr; {site.end_date || 'N/A'}</span>
                  </div>

                  {site.notes && (
                    <div className="p-2.5 bg-[#080f0d] border border-[#234338] rounded-lg text-slate-400 text-[11px] leading-relaxed">
                      {site.notes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#234338]/40 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Workforce:</span>
                    <span className="font-mono font-bold text-[#a3e635]">{assignedWorkers.length} assigned</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#13241f] border-t border-[#234338] flex items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentSite(site.site_id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#a3e635] text-[#080f0d]'
                      : 'bg-[#0e1a16] border border-[#234338] text-slate-200 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSelected ? 'Active Context' : 'Set Active Context'}
                </button>

                <button
                  onClick={() => setEditingSite(site)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-[#0e1a16] rounded-md"
                  title="Edit Site Details"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Site Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-[#a3e635]" />
                Register New Project Site
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Site 004"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Bataan Logistics Pier"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Geographic Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="Mariveles, Bataan"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor / Lead Engineer *</label>
                  <input
                    type="text"
                    required
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="Engr. Marco De Rueda"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Engineering Scope & Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-20"
                  placeholder="Structural specs, foundation details, delivery access..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Register Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white">Edit Site: {editingSite.code}</h2>
              <button onClick={() => setEditingSite(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Code</label>
                  <input
                    type="text"
                    required
                    value={editingSite.code}
                    onChange={(e) => setEditingSite({ ...editingSite, code: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editingSite.name}
                    onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={editingSite.location}
                    onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor</label>
                  <input
                    type="text"
                    required
                    value={editingSite.supervisor}
                    onChange={(e) => setEditingSite({ ...editingSite, supervisor: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Status</label>
                  <select
                    value={editingSite.project_status}
                    onChange={(e) => setEditingSite({ ...editingSite, project_status: e.target.value as any })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={editingSite.end_date}
                    onChange={(e) => setEditingSite({ ...editingSite, end_date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                <textarea
                  value={editingSite.notes}
                  onChange={(e) => setEditingSite({ ...editingSite, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-20"
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSite(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] text-white font-bold rounded-lg hover:bg-[#059669]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
