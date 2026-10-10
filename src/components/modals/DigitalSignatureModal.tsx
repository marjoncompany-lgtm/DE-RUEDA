import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  X,
  FileCheck2,
  ShieldCheck,
  Building,
  DollarSign,
  AlertCircle,
  Smartphone,
  Stamp,
} from 'lucide-react';
import { DigitalSignatureData, InternalPurchaseOrder, WeeklyPayrollApprovalDoc } from '../../types';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'purchase_order' | 'payroll_doc';
  purchaseOrder?: InternalPurchaseOrder | null;
  payrollDoc?: WeeklyPayrollApprovalDoc | null;
  defaultSignerName?: string;
  defaultSignerRole?: string;
  onConfirm: (data: DigitalSignatureData) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  documentType,
  purchaseOrder,
  payrollDoc,
  defaultSignerName = 'Engr. Marco De Rueda',
  defaultSignerRole = 'Site Project Director & Authorized Signatory',
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [inkColor, setInkColor] = useState<'#0369a1' | '#2563eb' | '#0f172a' | '#059669'>('#0369a1');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (defaultSignerName) setSignerName(defaultSignerName);
    if (defaultSignerRole) setSignerRole(defaultSignerRole);
  }, [defaultSignerName, defaultSignerRole]);

  // Canvas setup & touch event listeners to ensure smooth mobile drawing
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = penWidth;
        // White background for crisp export
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, inkColor, penWidth]);

  // Touch event handler directly on canvas element to prevent page scroll on mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Save history for undo
      const dpr = window.devicePixelRatio || 1;
      const imgData = ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr);
      setHistory((prev) => [...prev.slice(-10), imgData]);

      setIsDrawing(true);
      setHasDrawn(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(false);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDrawing]);

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const imgData = ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr);
    setHistory((prev) => [...prev.slice(-10), imgData]);

    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
    if (history.length === 1) setHasDrawn(false);
  };

  const handleConfirmSignature = () => {
    if (!hasDrawn || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const signatureDataUrl = canvas.toDataURL('image/png');

    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const hash = `SIG-SHA256-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const signatureData: DigitalSignatureData = {
      signed_by: signerName.trim() || 'Site Manager',
      signer_role: signerRole.trim() || 'Authorized Field Engineer',
      signed_at: timestampStr,
      signature_svg: signatureDataUrl,
      verification_hash: hash,
      ip_address: '192.168.1.104 (Site Gateway)',
    };

    onConfirm(signatureData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0e1a16] border border-[#234338] rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl relative my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#234338]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight uppercase flex items-center gap-2">
                <span>Site Manager Digital Signature</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#13241f] text-[#a3e635] border border-[#234338]">
                  MOBILE READY
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sign directly on your touch device to authorize construction expenditure & Dole compliant labor hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#13241f] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Details Card */}
        <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 text-xs space-y-2">
          {documentType === 'purchase_order' && purchaseOrder && (
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#a3e635]" />
                  Purchase Order: <span className="font-mono text-[#a3e635]">{purchaseOrder.po_id}</span>
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  ₱{purchaseOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Vendor: <strong className="text-white">{purchaseOrder.vendor_name}</strong> &bull; Site:{' '}
                <strong className="text-white">{purchaseOrder.site_name}</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                Items: {purchaseOrder.items.map((i) => `${i.quantity} ${i.unit} ${i.item_name}`).join(', ')}
              </div>
            </div>
          )}

          {documentType === 'payroll_doc' && payrollDoc && (
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#10b981]" />
                  Weekly Payroll: <span className="font-mono text-[#a3e635]">{payrollDoc.week_key}</span>
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  ₱{payrollDoc.total_net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })} Net
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Site: <strong className="text-white">{payrollDoc.site_name}</strong> &bull; Workforce:{' '}
                <strong className="text-white">{payrollDoc.total_workers} Active Workers</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Gross: ₱{payrollDoc.total_gross_pay.toLocaleString()} &bull; Deductions: ₱{payrollDoc.total_deductions.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Signer Identification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Signer Name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Signer Title / Role
            </label>
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#080f0d] border border-[#234338] rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-[#a3e635]"
            />
          </div>
        </div>

        {/* Signature Pad Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-[#a3e635]" />
              Touch / Draw Signature Below
            </span>

            {/* Ink & Width controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#13241f] p-0.5 rounded-md border border-[#234338]">
                {[
                  { color: '#0369a1', label: 'Navy' },
                  { color: '#2563eb', label: 'DOLE Blue' },
                  { color: '#0f172a', label: 'Black' },
                  { color: '#059669', label: 'Emerald' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setInkColor(c.color as any)}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      inkColor === c.color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#0e1a16]' : 'opacity-70'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-1 bg-[#13241f] border border-[#234338] rounded text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Undo last stroke"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={clearCanvas}
                className="px-2 py-0.5 bg-[#13241f] border border-[#234338] hover:border-red-400 text-slate-300 hover:text-red-300 rounded text-[11px] font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* HTML5 Canvas with touch-action: none for mobile support */}
          <div className="relative border-2 border-dashed border-[#234338] hover:border-[#10b981] rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-44 sm:h-48 cursor-crosshair touch-none select-none block"
            />

            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                <Smartphone className="w-5 h-5 mb-1 text-slate-400 opacity-60" />
                <span className="font-semibold">Sign here with finger, stylus, or mouse</span>
                <span className="text-[10px] text-slate-400 mt-0.5">X _________________________________________________</span>
              </div>
            )}
          </div>
        </div>

        {/* Certification Agreement */}
        <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer bg-[#13241f] p-2.5 rounded-lg border border-[#234338]">
          <input
            type="checkbox"
            checked={agreementChecked}
            onChange={(e) => setAgreementChecked(e.target.checked)}
            className="mt-0.5 rounded border-[#234338] text-[#a3e635] focus:ring-0 cursor-pointer"
          />
          <span>
            I certify that the above document has been verified against active project delivery logs and conforms to DOLE D.O. 13 engineering safety and cost allocation protocols.
          </span>
        </label>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#234338]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#13241f] border border-[#234338] hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSignature}
            disabled={!hasDrawn || !agreementChecked || !signerName.trim()}
            className="px-5 py-2 bg-[#a3e635] hover:bg-[#84cc16] text-[#080f0d] font-black rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply Digital Signature & Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
