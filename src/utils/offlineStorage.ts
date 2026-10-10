import {
  AttendanceRecord,
  Employee,
  Site,
  PayrollRecord,
  OfflineActionItem,
  OfflineCacheStats,
} from '../types';

const PREFIX = 'DRC_ERP_OFFLINE_';
const KEYS = {
  ATTENDANCE: `${PREFIX}ATTENDANCE_CACHE`,
  EMPLOYEES: `${PREFIX}EMPLOYEES_CACHE`,
  PROJECTS: `${PREFIX}PROJECTS_CACHE`,
  PAYROLL: `${PREFIX}PAYROLL_CACHE`,
  QUEUE: `${PREFIX}ACTION_QUEUE`,
  LAST_SYNC: `${PREFIX}LAST_SYNC_TS`,
  SIMULATE_OFFLINE: `${PREFIX}SIMULATE_OFFLINE`,
};

// Safe localStorage access
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to save ${key}:`, err);
  }
}

// 1. Core Data Cache Savers
export function saveAttendanceCache(data: AttendanceRecord[]): void {
  safeSet(KEYS.ATTENDANCE, data);
  touchLastSync();
}

export function getAttendanceCache(): AttendanceRecord[] {
  return safeGet<AttendanceRecord[]>(KEYS.ATTENDANCE, []);
}

export function saveEmployeesCache(data: Employee[]): void {
  safeSet(KEYS.EMPLOYEES, data);
  touchLastSync();
}

export function getEmployeesCache(): Employee[] {
  return safeGet<Employee[]>(KEYS.EMPLOYEES, []);
}

export function saveProjectsCache(data: Site[]): void {
  safeSet(KEYS.PROJECTS, data);
  touchLastSync();
}

export function getProjectsCache(): Site[] {
  return safeGet<Site[]>(KEYS.PROJECTS, []);
}

export function savePayrollCache(data: PayrollRecord[]): void {
  safeSet(KEYS.PAYROLL, data);
  touchLastSync();
}

export function getPayrollCache(): PayrollRecord[] {
  return safeGet<PayrollRecord[]>(KEYS.PAYROLL, []);
}

function touchLastSync(): void {
  try {
    localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function getLastSyncTimestamp(): string {
  try {
    return localStorage.getItem(KEYS.LAST_SYNC) || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// 2. Offline Action Mutation Queue
export function queueOfflineAction(
  action: Omit<OfflineActionItem, 'id' | 'timestamp' | 'synced' | 'retryCount'>
): OfflineActionItem {
  const queue = getOfflineQueue();
  const newItem: OfflineActionItem = {
    ...action,
    id: `QUEUE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    synced: false,
    retryCount: 0,
  };
  const updated = [newItem, ...queue];
  safeSet(KEYS.QUEUE, updated);
  return newItem;
}

export function getOfflineQueue(): OfflineActionItem[] {
  return safeGet<OfflineActionItem[]>(KEYS.QUEUE, []);
}

export function removeOfflineQueueItem(id: string): void {
  const queue = getOfflineQueue();
  safeSet(KEYS.QUEUE, queue.filter((item) => item.id !== id));
}

export function clearOfflineQueue(): void {
  safeSet(KEYS.QUEUE, []);
}

// 3. Network & Simulation Helpers
export function isSimulateOffline(): boolean {
  try {
    return localStorage.getItem(KEYS.SIMULATE_OFFLINE) === 'true';
  } catch {
    return false;
  }
}

export function setSimulateOffline(simulate: boolean): void {
  try {
    localStorage.setItem(KEYS.SIMULATE_OFFLINE, simulate ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('drc:network-change', { detail: { online: !simulate && navigator.onLine } }));
  } catch {
    // ignore
  }
}

export function isNetworkOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (isSimulateOffline()) return false;
  return navigator.onLine;
}

// 4. Calculate Storage Size & Cache Diagnostic Stats
export function getOfflineCacheStats(): OfflineCacheStats {
  const isOnline = isNetworkOnline();
  const sim = isSimulateOffline();
  const emp = getEmployeesCache();
  const att = getAttendanceCache();
  const sites = getProjectsCache();
  const pay = getPayrollCache();
  const queue = getOfflineQueue();
  const lastSync = getLastSyncTimestamp();

  let storageBytes = 0;
  try {
    for (const key in localStorage) {
      if (key.startsWith(PREFIX)) {
        storageBytes += (localStorage.getItem(key) || '').length * 2;
      }
    }
  } catch {
    // ignore
  }

  return {
    isOnline,
    isSimulatedOffline: sim,
    cachedEmployeesCount: emp.length,
    cachedAttendanceCount: att.length,
    cachedSitesCount: sites.length,
    cachedPayrollCount: pay.length,
    pendingQueueCount: queue.length,
    lastSyncTimestamp: lastSync,
    storageUsageBytes: storageBytes,
  };
}

// 5. Offline Fallback GCash Receipt Generator (if site network drops during payment)
export function generateClientOfflineGCashReceipt(params: {
  referenceNo: string;
  transactionId: string;
  recipientName: string;
  recipientMobile: string;
  amount: number;
  weekKey: string;
  siteId: string;
  timestamp: string;
}): string {
  const formattedAmount = params.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 820" width="540" height="820" style="background:#0b1612;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;">
    <rect x="20" y="20" width="500" height="780" rx="20" fill="#ffffff"/>
    <path d="M 20 40 Q 20 20 40 20 L 500 20 Q 520 20 520 40 L 520 140 L 20 140 Z" fill="#005ce6"/>
    <text x="50" y="65" font-size="28" font-weight="900" fill="#ffffff">GCash</text>
    <text x="50" y="92" font-size="12" font-weight="700" fill="#bae6fd">OFFLINE QUEUED DISBURSEMENT</text>
    <text x="50" y="112" font-size="11" font-weight="500" fill="#e0f2fe">De Rueda Construction Enterprise Portal</text>
    <circle cx="458" cy="73" r="22" fill="#10b981"/>
    <path d="M 450 73 L 456 79 L 468 66" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <text x="270" y="185" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">Payment Queued for Sync</text>
    <text x="270" y="208" font-size="12" font-weight="500" fill="#64748b" text-anchor="middle">Recorded in Site Offline Cache</text>
    <rect x="50" y="225" width="440" height="90" rx="14" fill="#f0f7ff" stroke="#bfdbfe" stroke-width="1.5"/>
    <text x="270" y="258" font-size="13" font-weight="700" fill="#005ce6" text-anchor="middle">SALARY DISBURSEMENT</text>
    <text x="270" y="295" font-size="32" font-weight="900" fill="#003b99" text-anchor="middle" font-family="monospace">PHP ${formattedAmount}</text>
    <text x="70" y="360" font-size="12" font-weight="700" fill="#64748b">RECIPIENT</text>
    <text x="70" y="385" font-size="16" font-weight="800" fill="#0f172a">${params.recipientName}</text>
    <text x="470" y="385" font-size="14" font-weight="700" fill="#005ce6" text-anchor="end" font-family="monospace">${params.recipientMobile}</text>
    <text x="70" y="440" font-size="12" fill="#64748b">Reference No.</text>
    <text x="470" y="440" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end" font-family="monospace">${params.referenceNo}</text>
    <text x="70" y="480" font-size="12" fill="#64748b">Sender</text>
    <text x="470" y="480" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">DE RUEDA CONSTRUCTION INC.</text>
    <text x="70" y="520" font-size="12" fill="#64748b">Payroll Period</text>
    <text x="470" y="520" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${params.weekKey} (${params.siteId})</text>
    <rect x="50" y="680" width="440" height="52" rx="10" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="70" y="705" font-size="11" font-weight="700" fill="#065f46">OFFICIAL VOUCHER (STORED OFFLINE)</text>
    <text x="70" y="721" font-size="10" fill="#047857">Automatically queued and registered in DRC Document Vault.</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
