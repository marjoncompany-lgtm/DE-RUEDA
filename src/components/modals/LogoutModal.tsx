import React from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
}) => {
  const { currentUser } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Confirm Session Logout</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {currentUser && (
            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Active Access Point
                </div>
                <div className="text-white font-bold text-sm uppercase mt-0.5">
                  {currentUser.access_point}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {currentUser.email}
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}

          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to end your current active session?
          </p>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-[11px] text-emerald-300">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Data Preserved</span>
            </div>
            <p className="text-slate-300">
              All timekeeping DTR logs, employee records, payroll calculations, and Google Drive vault files remain permanently saved.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-300 hover:text-white hover:bg-[#13241f] rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmLogout();
                onClose();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-rose-900/30"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
