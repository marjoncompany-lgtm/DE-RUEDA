import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InternalPurchaseOrder, WeeklyPayrollApprovalDoc, DigitalSignatureData } from '../../types';
import { DigitalSignatureModal } from '../modals/DigitalSignatureModal';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Stamp,
  Building,
  DollarSign,
  Plus,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface ManagerApprovalsWidgetProps {
  currentSite?: string;
}

export const ManagerApprovalsWidget: React.FC<ManagerApprovalsWidgetProps> = ({
  currentSite = 'ALL',
}) => {
  const {
    purchaseOrders,
    payrollApprovalDocs,
    signPurchaseOrder,
    signPayrollDoc,
    sites,
    addPurchaseOrder,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'purchase_orders' | 'payroll_docs'>('purchase_orders');
  const [selectedPoForSign, setSelectedPoForSign] = useState<InternalPurchaseOrder | null>(null);
  const [selectedPayrollDocForSign, setSelectedPayrollDocForSign] = useState<WeeklyPayrollApprovalDoc | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [previewSignature, setPreviewSignature] = useState<DigitalSignatureData | null>(null);

  // New PO form states
  const [newPoSiteId, setNewPoSiteId] = useState('SITE-001');
  const [newPoVendor, setNewPoVendor] = useState('');
  const [newPoCategory, setNewPoCategory] = useState('Materials & Aggregates');
  const [newPoItem, setNewPoItem] = useState('');
  const [newPoQty, setNewPoQty] = useState(1);
  const [newPoUnit, setNewPoUnit] = useState('sets');
  const [newPoUnitPrice, setNewPoUnitPrice] = useState(0);
  const [newPoNotes, setNewPoNotes] = useState('');

  // Filter lists based on site
  const filteredPurchaseOrders = purchaseOrders.filter(
    (po) => currentSite === 'ALL' || po.site_id === currentSite
  );
  const filteredPayrollDocs = payrollApprovalDocs.filter(
    (doc) => currentSite === 'ALL' || doc.site_id === currentSite
  );

  const pendingPos = filteredPurchaseOrders.filter((po) => po.status === 'Pending Signature');
  const approvedPos = filteredPurchaseOrders.filter((po) => po.status === 'Approved');

  const pendingDocs = filteredPayrollDocs.filter((doc) => doc.status === 'Pending Signature');
  const approvedDocs = filteredPayrollDocs.filter((doc) => doc.status === 'Approved');

  const handleOpenSignPo = (po: InternalPurchaseOrder) => {
    setSelectedPoForSign(po);
    setSelectedPayrollDocForSign(null);
    setIsSignModalOpen(true);
  };

  const handleOpenSignPayroll = (doc: WeeklyPayrollApprovalDoc) => {
    setSelectedPayrollDocForSign(doc);
    setSelectedPoForSign(null);
    setIsSignModalOpen(true);
  };

  const handleConfirmSignature = (data: DigitalSignatureData) => {
    if (selectedPoForSign) {
      signPurchaseOrder(selectedPoForSign.po_id, data);
    } else if (selectedPayrollDocForSign) {
      signPayrollDoc(selectedPayrollDocForSign.doc_id, data);
    }
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const siteObj = sites.find((s) => s.site_id === newPoSiteId);
    const siteName = siteObj?.name || newPoSiteId;
    const totalAmount = newPoQty * newPoUnitPrice;

    addPurchaseOrder({
      site_id: newPoSiteId,
      site_name: siteName,
      vendor_name: newPoVendor.trim(),
      category: newPoCategory,
      items: [
        {
          item_name: newPoItem.trim(),
          quantity: newPoQty,
          unit: newPoUnit,
          unit_price: newPoUnitPrice,
          total_price: totalAmount,
        },
      ],
      total_amount: totalAmount,
      requested_by: 'Site Project Engineer',
      date_issued: '2026-10-06',
      required_delivery_date: '2026-10-10',
      notes: newPoNotes.trim(),
    });

    setIsCreatePoOpen(false);
    setNewPoVendor('');
    setNewPoItem('');
    setNewPoUnitPrice(0);
  };

  return (
    <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#234338]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                Site Manager Digital Signatures & Authorizations
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
                PO & PAYROLL APPROVALS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Site managers and project directors capture cryptographic digital signatures on mobile devices to approve internal purchase orders and weekly master payroll sheets
            </p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-[#13241f] p-1 rounded-lg border border-[#234338] text-xs">
            <button
              onClick={() => setActiveTab('purchase_orders')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                activeTab === 'purchase_orders'
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchase Orders ({filteredPurchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('payroll_docs')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                activeTab === 'payroll_docs'
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly Payroll Sheets ({filteredPayrollDocs.length})
            </button>
          </div>

          {activeTab === 'purchase_orders' && (
            <button
              onClick={() => setIsCreatePoOpen(true)}
              className="px-3 py-1.5 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] text-[#a3e635] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft PO</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Pending PO Signatures</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {pendingPos.length} Orders
          </div>
          <div className="text-[10px] text-slate-500">Awaiting site manager approval</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Approved Purchase Orders</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {approvedPos.length} Certified
          </div>
          <div className="text-[10px] text-slate-500">Digital signature applied</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Pending Payroll Approvals</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {pendingDocs.length} Master Sheets
          </div>
          <div className="text-[10px] text-slate-500">Ready for wage disbursement</div>
        </div>

        <div className="bg-[#13241f] border border-[#234338] rounded-lg p-2.5">
          <div className="text-[11px] text-slate-400">Approved Payroll Sheets</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {approvedDocs.length} Certified
          </div>
          <div className="text-[10px] text-slate-500">DOLE D.O. 13 verified</div>
        </div>
      </div>

      {/* Content for Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPurchaseOrders.map((po) => {
              const isApproved = po.status === 'Approved';

              return (
                <div
                  key={po.po_id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all group ${
                    isApproved
                      ? 'bg-[#13241f]/40 border-emerald-500/30'
                      : 'bg-[#13241f] border-[#234338] hover:border-amber-400/50 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-[#a3e635]">{po.po_id}</span>
                          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-[#0e1a16] text-slate-300 border border-[#234338]">
                            {po.site_name}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">{po.vendor_name}</h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sm text-white">
                          ₱{po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase inline-block mt-0.5 ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="bg-[#0e1a16] border border-[#234338] rounded-lg p-2.5 text-[11px] space-y-1">
                      <div className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        Requisitioned Materials:
                      </div>
                      {po.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-300">
                          <span className="truncate pr-2">• {it.item_name} ({it.quantity} {it.unit})</span>
                          <span className="font-mono font-bold text-white shrink-0">
                            ₱{it.total_price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Issued: {po.date_issued} &bull; Required: {po.required_delivery_date}</span>
                      <span className="text-slate-500">{po.category}</span>
                    </div>

                    {/* Digital Signature Stamp Preview */}
                    {isApproved && po.digital_signature && (
                      <div className="p-2 bg-emerald-950/20 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-2 text-[10px] text-emerald-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">
                              Signed by {po.digital_signature.signed_by}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {po.digital_signature.signed_at} &bull; {po.digital_signature.verification_hash.slice(0, 16)}...
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setPreviewSignature(po.digital_signature || null)}
                          className="px-2 py-0.5 bg-[#13241f] border border-[#234338] hover:border-emerald-400 rounded text-emerald-300 text-[9px] font-mono cursor-pointer shrink-0"
                        >
                          View Signature
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {po.notes}
                    </span>

                    {!isApproved ? (
                      <button
                        onClick={() => handleOpenSignPo(po)}
                        className="px-3 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Sign & Approve Now</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Authorized
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content for Weekly Payroll Approval Docs */}
      {activeTab === 'payroll_docs' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredPayrollDocs.map((doc) => {
              const isApproved = doc.status === 'Approved';

              return (
                <div
                  key={doc.doc_id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all group ${
                    isApproved
                      ? 'bg-[#13241f]/40 border-emerald-500/30'
                      : 'bg-[#13241f] border-[#234338] hover:border-amber-400/50 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#a3e635]">{doc.week_key}</span>
                        <h4 className="text-xs font-bold text-white mt-0.5">{doc.site_name}</h4>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="bg-[#0e1a16] border border-[#234338] rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Crew Headcount:</span>
                        <span className="text-white font-bold">{doc.total_workers} Active Workers</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Gross Wages:</span>
                        <span className="text-slate-300 font-mono">₱{doc.total_gross_pay.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Deductions:</span>
                        <span className="text-rose-400 font-mono">-₱{doc.total_deductions.toLocaleString()}</span>
                      </div>
                      <div className="pt-1 border-t border-[#234338] flex items-center justify-between font-bold text-white">
                        <span className="text-[#a3e635]">Net Wages:</span>
                        <span className="font-mono text-sm text-[#a3e635]">₱{doc.total_net_pay.toLocaleString()}</span>
                      </div>
                    </div>

                    {isApproved && doc.digital_signature && (
                      <div className="p-2 bg-emerald-950/20 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-2 text-[10px] text-emerald-200">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">{doc.digital_signature.signed_by}</div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {doc.digital_signature.signed_at}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setPreviewSignature(doc.digital_signature || null)}
                          className="px-2 py-0.5 bg-[#13241f] border border-[#234338] hover:border-emerald-400 rounded text-emerald-300 text-[9px] font-mono cursor-pointer shrink-0"
                        >
                          View Signature
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#234338]/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Prepared: {doc.date_prepared}</span>

                    {!isApproved ? (
                      <button
                        onClick={() => handleOpenSignPayroll(doc)}
                        className="px-3 py-1.5 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Sign Payroll</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signature Preview Modal */}
      {previewSignature && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-[#234338]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Cryptographic Signature Seal</h4>
              </div>
              <button
                onClick={() => setPreviewSignature(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner">
              <img
                src={previewSignature.signature_svg}
                alt="Captured Digital Signature"
                className="max-h-36 object-contain"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-300 font-mono">
              <div>Signer: <strong className="text-white">{previewSignature.signed_by}</strong></div>
              <div>Role: <span className="text-slate-400">{previewSignature.signer_role}</span></div>
              <div>Timestamp: <span className="text-[#a3e635]">{previewSignature.signed_at}</span></div>
              <div className="truncate">Hash: <span className="text-slate-400 text-[10px]">{previewSignature.verification_hash}</span></div>
            </div>

            <button
              onClick={() => setPreviewSignature(null)}
              className="w-full py-2 bg-[#13241f] border border-[#234338] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Draft New PO Modal */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
              <h3 className="text-sm font-bold text-white">Draft Internal Purchase Order</h3>
              <button
                onClick={() => setIsCreatePoOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Project Site
                </label>
                <select
                  value={newPoSiteId}
                  onChange={(e) => setNewPoSiteId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold"
                >
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SteelAsia / Holcim / Petron Bulk"
                  value={newPoVendor}
                  onChange={(e) => setNewPoVendor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 60 Rebar 20mm x 12m"
                  value={newPoItem}
                  onChange={(e) => setNewPoItem(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPoQty}
                    onChange={(e) => setNewPoQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newPoUnit}
                    onChange={(e) => setNewPoUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Unit Price (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPoUnitPrice}
                    onChange={(e) => setNewPoUnitPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-2 bg-[#13241f] rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Purchase Order:</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₱{(newPoQty * newPoUnitPrice).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#234338]">
                <button
                  type="button"
                  onClick={() => setIsCreatePoOpen(false)}
                  className="px-3 py-1.5 bg-[#13241f] text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg cursor-pointer"
                >
                  Create & Queue for Signature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Signature Canvas Modal */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => {
          setIsSignModalOpen(false);
          setSelectedPoForSign(null);
          setSelectedPayrollDocForSign(null);
        }}
        documentType={selectedPoForSign ? 'purchase_order' : 'payroll_doc'}
        purchaseOrder={selectedPoForSign}
        payrollDoc={selectedPayrollDocForSign}
        onConfirm={handleConfirmSignature}
      />
    </div>
  );
};
