import React from 'react';
import { useApp } from '../../context/AppContext';
import { Inbox, Briefcase, Mail, Phone, Calendar, MapPin, CheckCircle } from 'lucide-react';

export const IntakeView: React.FC = () => {
  const { inquiries, hiring, updateInquiryStatus, updateHiringStatus } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Public Website Intake Leads & Submissions
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Real-time feeds from public careers and business consultation forms</span>
        </div>
      </div>

      {/* Careers Submissions */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#a3e635]" />
            <span>Job Applications / Field Construction Trades ({hiring.length})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">HR Talent Pool</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                <th className="p-3">Applicant Name</th>
                <th className="p-3">Age / Birthdate</th>
                <th className="p-3">Contact & Email</th>
                <th className="p-3">Home Address</th>
                <th className="p-3">Construction Experience & Trades</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {hiring.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No job applications submitted yet.
                  </td>
                </tr>
              ) : (
                hiring.map((h) => (
                  <tr key={h.hiring_id} className="hover:bg-[#13241f]/70">
                    <td className="p-3">
                      <div className="font-bold text-white">{h.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{h.created_at}</div>
                    </td>
                    <td className="p-3 font-mono">
                      {h.age} yrs <span className="text-slate-500 text-[10px]">({h.birthdate})</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      <div>{h.contact_number}</div>
                      <div className="text-slate-400">{h.email}</div>
                    </td>
                    <td className="p-3 text-slate-300 max-w-[150px] truncate">{h.address}</td>
                    <td className="p-3 text-slate-400 max-w-[260px]">{h.experience}</td>
                    <td className="p-3">
                      <select
                        value={h.status}
                        onChange={(e) => updateHiringStatus(h.hiring_id, e.target.value as any)}
                        className="bg-[#13241f] border border-[#234338] text-[#a3e635] text-[11px] font-bold rounded px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Hired">Hired</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Inquiries */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Inbox className="w-4 h-4 text-emerald-400" />
            <span>Business Inquiries & Project Cooperation Tenders ({inquiries.length})</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Client Proposals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1a16] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px]">
                <th className="p-3">Client / Rep</th>
                <th className="p-3">Inquiry Category</th>
                <th className="p-3">Contact Email & Phone</th>
                <th className="p-3">Project Motive & Scope</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No business inquiries submitted yet.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => (
                  <tr key={inq.inquiry_id} className="hover:bg-[#13241f]/70">
                    <td className="p-3">
                      <div className="font-bold text-white">{inq.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{inq.created_at}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-[#13241f] border border-[#234338] px-2 py-0.5 rounded text-emerald-300 font-semibold">
                        {inq.inquiry_type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      <div>{inq.email}</div>
                      <div className="text-slate-400">{inq.contact_number}</div>
                    </td>
                    <td className="p-3 text-slate-300 max-w-[280px]">{inq.business_motive}</td>
                    <td className="p-3">
                      <select
                        value={inq.status}
                        onChange={(e) => updateInquiryStatus(inq.inquiry_id, e.target.value as any)}
                        className="bg-[#13241f] border border-[#234338] text-emerald-400 text-[11px] font-bold rounded px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                      </select>
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
