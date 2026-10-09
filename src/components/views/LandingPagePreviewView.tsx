import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PublicWebsiteView } from './PublicWebsiteView';
import { PageId } from '../layout/Sidebar';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Globe,
  Settings as SettingsIcon,
  Inbox,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LandingPagePreviewViewProps {
  onNavigate: (page: PageId) => void;
  onOpenFullscreen: () => void;
  onOpenAuth: () => void;
  onOpenLogout?: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const LandingPagePreviewView: React.FC<LandingPagePreviewViewProps> = ({
  onNavigate,
  onOpenFullscreen,
  onOpenAuth,
  onOpenLogout,
}) => {
  const { inquiries, hiring, settings } = useApp();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [key, setKey] = useState<number>(0);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#10b981] to-[#a3e635] flex items-center justify-center font-black text-[#080f0d]">
              <Globe className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">
              Live Corporate Landing Page Preview
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10b981]/15 text-[#a3e635] border border-[#10b981]/30">
              LIVE PREVIEW INSIDE
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Client & Applicant Facing Portal</span>
            <span>&bull;</span>
            <span className="text-slate-300">Target URL: <code className="text-[#a3e635] font-mono">https://deruedaconstruction.com</code></span>
          </div>
        </div>

        {/* Device Switcher & Quick Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device toggle pill */}
          <div className="bg-[#13241f] border border-[#234338] p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View (100% Widescreen)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>

            <button
              onClick={() => setDeviceMode('tablet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                deviceMode === 'tablet'
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View (iPad / 768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>

            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-[#a3e635] text-[#080f0d] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View (iPhone / 390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Reload Preview Canvas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenFullscreen}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] hover:border-[#10b981] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Open Public Site Fullscreen"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Standalone View</span>
          </button>

          <button
            onClick={() => onNavigate('intake')}
            className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="View Intake Leads Submitted on Landing Page"
          >
            <Inbox className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Leads ({inquiries.length + hiring.length})</span>
          </button>
        </div>
      </div>

      {/* Diagnostics / Conversion Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">DOLE & ISO 9001</div>
            <div className="text-white font-bold">Compliance Hero Active</div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#a3e635] shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Consultation Form</div>
            <div className="text-white font-bold">{inquiries.length} Inquiries Received</div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Careers Intake</div>
            <div className="text-white font-bold">{hiring.length} Trade Applications</div>
          </div>
        </div>

        <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Company Config</div>
            <div className="text-slate-200 font-semibold truncate max-w-[120px]">{settings.company_name}</div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-[#a3e635] hover:underline text-[11px] font-bold flex items-center gap-1"
          >
            <SettingsIcon className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      {/* Preview Simulation Frame Container */}
      <div className="bg-[#080f0d] border border-[#234338] rounded-2xl p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center min-h-[750px] shadow-2xl relative">
        {/* Mock Browser Header Bar */}
        <div className="w-full bg-[#13241f] border border-[#234338] rounded-t-xl px-4 py-2 flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            <span className="text-[11px] text-slate-400 font-mono ml-2 hidden sm:inline">
              De Rueda Construction &bull; Public Landing Portal
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0e1a16] border border-[#234338] px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 max-w-sm truncate">
            <span className="text-emerald-400 font-bold">https://</span>
            <span>deruedaconstruction.com/</span>
          </div>

          <div className="text-[10px] text-slate-500 uppercase font-mono font-bold hidden sm:inline">
            Mode: {deviceMode.toUpperCase()}
          </div>
        </div>

        {/* Viewport Frame based on selected device */}
        {deviceMode === 'desktop' && (
          <div
            key={`desktop-${key}`}
            className="w-full bg-[#080f0d] border border-[#234338] rounded-b-xl overflow-y-auto max-h-[750px] shadow-inner"
          >
            <PublicWebsiteView
              onOpenLogin={onOpenAuth}
              onGoToDashboard={() => onNavigate('dashboard')}
              onOpenLogout={onOpenLogout}
            />
          </div>
        )}

        {deviceMode === 'tablet' && (
          <div className="py-4 w-full flex justify-center">
            <div
              key={`tablet-${key}`}
              className="w-[768px] max-w-full bg-[#080f0d] border-8 border-[#1f2937] rounded-3xl overflow-y-auto max-h-[750px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="bg-[#1f2937] h-4 flex items-center justify-center">
                <div className="w-12 h-1 rounded-full bg-slate-600" />
              </div>
              <PublicWebsiteView
                onOpenLogin={onOpenAuth}
                onGoToDashboard={() => onNavigate('dashboard')}
                onOpenLogout={onOpenLogout}
              />
            </div>
          </div>
        )}

        {deviceMode === 'mobile' && (
          <div className="py-4 w-full flex justify-center">
            <div
              key={`mobile-${key}`}
              className="w-[390px] max-w-full bg-[#080f0d] border-8 border-[#1f2937] rounded-[40px] overflow-y-auto max-h-[750px] shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative"
            >
              {/* Dynamic Island / Notch */}
              <div className="sticky top-0 z-50 bg-[#0e1a16] py-2 flex items-center justify-center border-b border-[#234338]/40">
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111827] mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
                </div>
              </div>
              <PublicWebsiteView
                onOpenLogin={onOpenAuth}
                onGoToDashboard={() => onNavigate('dashboard')}
                onOpenLogout={onOpenLogout}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
