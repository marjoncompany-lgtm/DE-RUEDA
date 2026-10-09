import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  Site,
  AttendanceRecord,
  DtrWeek,
  DtrChange,
  DeductionRecord,
  PayrollRecord,
  MaterialRecord,
  ExpenseRecord,
  Conversation,
  MessageItem,
  DocumentItem,
  AuditLogItem,
  SystemSettings,
  PublicInquiry,
  PublicHiring,
  UserSession,
  AccessPointRole,
  LoginDirectoryRecord,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_SITES,
  INITIAL_ATTENDANCE,
  INITIAL_DTR_WEEKS,
  INITIAL_DTR_CHANGES,
  INITIAL_DEDUCTIONS,
  INITIAL_PAYROLL,
  INITIAL_MATERIALS,
  INITIAL_EXPENSES,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INQUIRIES,
  INITIAL_HIRING,
  INITIAL_SETTINGS,
  INITIAL_LOGIN_DIRECTORY,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserSession | null;
  currentSite: string;
  setCurrentSite: (site: string) => void;
  login: (accessPoint: AccessPointRole, email: string) => void;
  logout: () => void;
  loginDirectory: LoginDirectoryRecord[];

  employees: Employee[];
  sites: Site[];
  attendance: AttendanceRecord[];
  dtrWeeks: DtrWeek[];
  dtrChanges: DtrChange[];
  deductions: DeductionRecord[];
  payroll: PayrollRecord[];
  materials: MaterialRecord[];
  expenses: ExpenseRecord[];
  conversations: Conversation[];
  messages: MessageItem[];
  documents: DocumentItem[];
  auditLogs: AuditLogItem[];
  settings: SystemSettings;
  inquiries: PublicInquiry[];
  hiring: PublicHiring[];

  // Operational Actions
  addEmployee: (emp: Omit<Employee, 'employee_id' | 'created_at' | 'updated_at' | 'qr_version'>) => Employee;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  archiveEmployee: (id: string) => void;
  rehireEmployee: (id: string) => Employee;

  addSite: (site: Omit<Site, 'site_id' | 'created_at'>) => Site;
  updateSite: (id: string, data: Partial<Site>) => void;

  scanAttendanceQr: (employee_id: string, qr_version: number, site_id: string, work_date?: string) => { success: boolean; message: string; record?: AttendanceRecord };
  recordManualAttendance: (data: { employee_id: string; site_id: string; work_date: string; time_in: string; time_out?: string; break_minutes?: number }) => AttendanceRecord;
  correctAttendance: (attendance_id: string, time_in: string, time_out: string, reason: string) => void;
  rolloverWeek: (nextWeekKey: string, dateStart: string, dateEnd: string) => void;

  addDeduction: (ded: Omit<DeductionRecord, 'deduction_id' | 'created_at' | 'updated_at' | 'total_deductions' | 'is_void'>) => DeductionRecord;
  voidDeduction: (deduction_id: string) => void;

  recalculatePayroll: (weekKey: string, siteId?: string) => void;
  verifyPayrollProof: (payroll_id: string, payment_method: 'Cash' | 'GCash', reference_no: string, status: 'Verified' | 'Paid', proof_url: string, notes?: string) => void;

  addMaterial: (mat: Omit<MaterialRecord, 'material_id' | 'created_at' | 'total_cost'>) => MaterialRecord;
  archiveMaterial: (id: string) => void;

  addExpense: (exp: Omit<ExpenseRecord, 'expense_id' | 'created_at'>) => ExpenseRecord;

  sendMessage: (conversation_id: string, text: string, attachmentName?: string) => void;
  createConversation: (title: string, type: 'direct' | 'group') => Conversation;

  addDocument: (doc: Omit<DocumentItem, 'document_id' | 'created_at'>) => DocumentItem;

  submitPublicInquiry: (inq: Omit<PublicInquiry, 'inquiry_id' | 'created_at' | 'status'>) => void;
  submitPublicHiring: (hire: Omit<PublicHiring, 'hiring_id' | 'created_at' | 'status'>) => void;
  updateInquiryStatus: (id: string, status: PublicInquiry['status']) => void;
  updateHiringStatus: (id: string, status: PublicHiring['status']) => void;

  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addAuditLog: (action: string, entity: string, entity_id: string, after_value?: string, before_value?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'DERUEDA_ERP_V1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // When URL first opens, all accounts are strictly logged out for privacy and protection
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      localStorage.removeItem('DERUEDA_USER');
      sessionStorage.removeItem('DERUEDA_USER');
    } catch {
      // storage unavailable
    }
    return null;
  });

  const [currentSite, setCurrentSite] = useState<string>('ALL');

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_EMPLOYEES`);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [sites, setSites] = useState<Site[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SITES`);
      return saved ? JSON.parse(saved) : INITIAL_SITES;
    } catch {
      return INITIAL_SITES;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ATTENDANCE`);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [dtrWeeks, setDtrWeeks] = useState<DtrWeek[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_DTR_WEEKS`);
      return saved ? JSON.parse(saved) : INITIAL_DTR_WEEKS;
    } catch {
      return INITIAL_DTR_WEEKS;
    }
  });

  const [dtrChanges, setDtrChanges] = useState<DtrChange[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_DTR_CHANGES`);
      return saved ? JSON.parse(saved) : INITIAL_DTR_CHANGES;
    } catch {
      return INITIAL_DTR_CHANGES;
    }
  });

  const [deductions, setDeductions] = useState<DeductionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_DEDUCTIONS`);
      return saved ? JSON.parse(saved) : INITIAL_DEDUCTIONS;
    } catch {
      return INITIAL_DEDUCTIONS;
    }
  });

  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PAYROLL`);
      return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
    } catch {
      return INITIAL_PAYROLL;
    }
  });

  const [materials, setMaterials] = useState<MaterialRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_MATERIALS`);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_EXPENSES`);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CONVERSATIONS`);
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_MESSAGES`);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_DOCUMENTS`);
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_AUDIT_LOGS`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SETTINGS`);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [inquiries, setInquiries] = useState<PublicInquiry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_INQUIRIES`);
      return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
    } catch {
      return INITIAL_INQUIRIES;
    }
  });

  const [hiring, setHiring] = useState<PublicHiring[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_HIRING`);
      return saved ? JSON.parse(saved) : INITIAL_HIRING;
    } catch {
      return INITIAL_HIRING;
    }
  });

  const [loginDirectory, setLoginDirectory] = useState<LoginDirectoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_LOGIN_DIRECTORY`);
      return saved ? JSON.parse(saved) : INITIAL_LOGIN_DIRECTORY;
    } catch {
      return INITIAL_LOGIN_DIRECTORY;
    }
  });

  // User session privacy protection
  useEffect(() => {
    if (!currentUser) {
      try {
        localStorage.removeItem('DERUEDA_USER');
        sessionStorage.removeItem('DERUEDA_USER');
      } catch {
        // ignore
      }
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SITES`, JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ATTENDANCE`, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DTR_WEEKS`, JSON.stringify(dtrWeeks));
  }, [dtrWeeks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DTR_CHANGES`, JSON.stringify(dtrChanges));
  }, [dtrChanges]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DEDUCTIONS`, JSON.stringify(deductions));
  }, [deductions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PAYROLL`, JSON.stringify(payroll));
  }, [payroll]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MATERIALS`, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_CONVERSATIONS`, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_MESSAGES`, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_DOCUMENTS`, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_AUDIT_LOGS`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_SETTINGS`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_INQUIRIES`, JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_HIRING`, JSON.stringify(hiring));
  }, [hiring]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_LOGIN_DIRECTORY`, JSON.stringify(loginDirectory));
  }, [loginDirectory]);

  const addAuditLog = (action: string, entity: string, entity_id: string, after_value?: string, before_value?: string) => {
    const newLog: AuditLogItem = {
      audit_id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor: currentUser ? `${currentUser.access_point} (${currentUser.email})` : 'SYSTEM',
      action,
      entity,
      entity_id,
      before_value,
      after_value,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = (accessPoint: AccessPointRole, email: string) => {
    const rawEmail = email.trim();
    const normalizedEmail = rawEmail.toLowerCase();

    // Check if new email detected in login directory
    const existingIndex = loginDirectory.findIndex(
      (entry) => entry.email.toLowerCase() === normalizedEmail
    );

    if (existingIndex === -1) {
      // New email detected! Auto-save file in Google Drive vault, restricted to CEO account only
      const gdriveFolder = '08_System_Audit_Logs/CEO_Vault/Login_Directory';
      const docId = `DOC-GDRIVE-AUTH-${Date.now()}`;
      const driveBaseUrl =
        settings.drive_subscription?.drive_folder_url ||
        settings.master_drive_link ||
        'https://drive.google.com/drive/folders/1DeRuedaConstruction-MasterProjectVault';
      const fileUrl = `${driveBaseUrl}#identity-vault-${encodeURIComponent(normalizedEmail)}`;
      const fileName = `GDrive_Vault_Identity_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}_Audit.json`;

      const newDoc: DocumentItem = {
        document_id: docId,
        module: 'CEO Security & Login Directory',
        record_id: normalizedEmail,
        file_name: fileName,
        file_type: 'application/json',
        drive_url: fileUrl,
        storage_ref: `gdrive://${gdriveFolder}/${fileName}`,
        notes: `Automated GDrive Security Backup: New authentication email detected [${rawEmail}] assigned to role [${accessPoint.toUpperCase()}]. Saved in Google Drive CEO Vault. Accessible only by CEO's account.`,
        uploaded_by: 'De Rueda Security Sentinel (GDrive Vault Sync)',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        is_ceo_only: true, // Viewed only by CEOs account
      };

      setDocuments((prev) => [newDoc, ...prev]);

      const newDirRecord: LoginDirectoryRecord = {
        id: `LDIR-${Date.now()}`,
        email: rawEmail,
        access_point: accessPoint,
        first_login_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        last_login_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        login_count: 1,
        gdrive_file_id: docId,
        gdrive_file_url: fileUrl,
        gdrive_folder: gdriveFolder,
        device_info:
          typeof navigator !== 'undefined'
            ? `${navigator.platform || 'Client'} - Chrome/Web`
            : 'Enterprise Client Terminal',
        status: 'active',
        is_ceo_confidential: true,
      };

      setLoginDirectory((prev) => [newDirRecord, ...prev]);

      addAuditLog(
        'NEW_EMAIL_DETECTED',
        'LOGIN_DIRECTORY',
        rawEmail,
        `New identity [${rawEmail}] auto-saved to Google Drive CEO Vault (${fileName}) under role [${accessPoint}]`
      );
    } else {
      // Existing email - update last login timestamp and increment count
      setLoginDirectory((prev) => {
        const updated = [...prev];
        const item = updated[existingIndex];
        updated[existingIndex] = {
          ...item,
          access_point: accessPoint,
          last_login_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          login_count: item.login_count + 1,
        };
        return updated;
      });
    }

    const session: UserSession = {
      session_id: `SESS-${Date.now()}`,
      access_point: accessPoint,
      email: rawEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      is_active: 1,
    };
    setCurrentUser(session);
    addAuditLog('LOGIN', 'SESSION', session.session_id, `Signed in via ${accessPoint} (${rawEmail})`);
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', 'SESSION', currentUser.session_id, 'User signed out');
    }
    setCurrentUser(null);
  };

  // Employee Management
  const addEmployee = (empData: Omit<Employee, 'employee_id' | 'created_at' | 'updated_at' | 'qr_version'>): Employee => {
    const year = new Date().getFullYear();
    const nextSeq = employees.length + 1;
    const seqStr = String(nextSeq).padStart(6, '0');
    const newId = `DRC-EMP-${year}-${seqStr}`;

    const newEmp: Employee = {
      ...empData,
      employee_id: newId,
      qr_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEmployees((prev) => [newEmp, ...prev]);
    addAuditLog('CREATE', 'EMPLOYEE', newId, `Created ${newEmp.name} (${newEmp.position})`);
    return newEmp;
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employee_id === id) {
          // If site changed, automatically increment QR version
          const isSiteChanged = data.site_id && data.site_id !== emp.site_id;
          const updated: Employee = {
            ...emp,
            ...data,
            qr_version: isSiteChanged ? emp.qr_version + 1 : (data.qr_version ?? emp.qr_version),
            updated_at: new Date().toISOString(),
          };
          addAuditLog('UPDATE', 'EMPLOYEE', id, JSON.stringify(data), JSON.stringify(emp));
          return updated;
        }
        return emp;
      })
    );
  };

  const archiveEmployee = (id: string) => {
    updateEmployee(id, { status: 'archived' });
    addAuditLog('ARCHIVE', 'EMPLOYEE', id, 'Status changed to archived');
  };

  const rehireEmployee = (id: string): Employee => {
    const oldEmp = employees.find((e) => e.employee_id === id);
    const year = new Date().getFullYear();
    const nextSeq = employees.length + 1;
    const newId = `DRC-EMP-${year}-${String(nextSeq).padStart(6, '0')}`;

    const rehired: Employee = {
      ...(oldEmp || {
        name: 'Rehired Worker',
        position: 'General Construction Laborer',
        email: '',
        contact_number: '',
        sss_number: '',
        philhealth_number: '',
        gcash_number: '',
        daily_rate: 700,
        site_id: 'SITE-001',
      }),
      employee_id: newId,
      status: 'active',
      qr_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEmployees((prev) => [rehired, ...prev]);
    addAuditLog('REHIRE', 'EMPLOYEE', newId, `Rehired previous worker ${id} under new ID ${newId}`);
    return rehired;
  };

  // Sites
  const addSite = (siteData: Omit<Site, 'site_id' | 'created_at'>): Site => {
    const siteNum = sites.length + 1;
    const newSiteId = `SITE-${String(siteNum).padStart(3, '0')}`;
    const newSite: Site = {
      ...siteData,
      site_id: newSiteId,
      created_at: new Date().toISOString(),
    };
    setSites((prev) => [...prev, newSite]);
    addAuditLog('CREATE', 'SITE', newSiteId, `Added project site ${newSite.code}: ${newSite.name}`);
    return newSite;
  };

  const updateSite = (id: string, data: Partial<Site>) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.site_id === id) {
          const updated = { ...s, ...data };
          addAuditLog('UPDATE', 'SITE', id, JSON.stringify(data));
          return updated;
        }
        return s;
      })
    );
  };

  // Attendance & Timekeeping
  const scanAttendanceQr = (
    employee_id: string,
    qr_version: number,
    site_id: string,
    work_date?: string
  ): { success: boolean; message: string; record?: AttendanceRecord } => {
    const emp = employees.find((e) => e.employee_id === employee_id);
    if (!emp) {
      return { success: false, message: `Employee ID ${employee_id} not found in system masterlist.` };
    }

    if (emp.status === 'archived') {
      return { success: false, message: `Access Denied: Employee ${emp.name} is archived.` };
    }

    // Verify QR version
    if (emp.qr_version !== qr_version) {
      return {
        success: false,
        message: `REJECTED: Outdated QR Version (Scanned v${qr_version}, Active v${emp.qr_version}). Worker site was reassigned; please print new badge.`,
      };
    }

    const todayStr = work_date || new Date().toISOString().substring(0, 10);
    const existing = attendance.find((a) => a.employee_id === employee_id && a.work_date === todayStr);

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hh}:${mm}`;

    if (!existing) {
      // Create Time In
      const newAtt: AttendanceRecord = {
        attendance_id: `ATT-${employee_id}-${todayStr}`,
        employee_id,
        site_id,
        work_date: todayStr,
        time_in: currentTimeStr,
        time_out: null,
        elapsed_minutes: 0,
        break_minutes: settings.break_minutes || 90,
        work_minutes: 0,
        work_hours: 0,
        source: 'QR',
        qr_version,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAttendance((prev) => [newAtt, ...prev]);
      addAuditLog('QR_SCAN', 'ATTENDANCE', newAtt.attendance_id, `Time In: ${currentTimeStr} for ${emp.name}`);
      return { success: true, message: `TIME IN Recorded: ${emp.name} at ${currentTimeStr} (${site_id})`, record: newAtt };
    }

    // Already timed in: check anti-duplicate window
    const [inH, inM] = existing.time_in.split(':').map(Number);
    const inTotalM = inH * 60 + inM;
    const curTotalM = now.getHours() * 60 + now.getMinutes();

    if (curTotalM - inTotalM < settings.anti_duplicate_minutes && !existing.time_out) {
      return {
        success: false,
        message: `Anti-duplicate: Scanned within ${settings.anti_duplicate_minutes} minutes of Time In. Please wait before scanning again.`,
      };
    }

    // Mark Time Out and calculate work hours
    const [outH, outM] = currentTimeStr.split(':').map(Number);
    const elapsedMinutes = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
    const breakMinutes = existing.break_minutes || 90;
    const netWorkMinutes = Math.max(0, elapsedMinutes - breakMinutes);
    const netWorkHours = Math.min(settings.work_hours_standard, parseFloat((netWorkMinutes / 60).toFixed(2)));

    const updatedAtt: AttendanceRecord = {
      ...existing,
      time_out: currentTimeStr,
      elapsed_minutes: elapsedMinutes,
      work_minutes: netWorkMinutes,
      work_hours: netWorkHours,
      updated_at: new Date().toISOString(),
    };

    setAttendance((prev) => prev.map((a) => (a.attendance_id === existing.attendance_id ? updatedAtt : a)));
    addAuditLog('QR_SCAN', 'ATTENDANCE', existing.attendance_id, `Time Out: ${currentTimeStr}. Actual work: ${netWorkHours}h`);
    return {
      success: true,
      message: `TIME OUT Recorded: ${emp.name} at ${currentTimeStr}. Total: ${netWorkHours} work hours (less 1.5h breaks).`,
      record: updatedAtt,
    };
  };

  const recordManualAttendance = (data: {
    employee_id: string;
    site_id: string;
    work_date: string;
    time_in: string;
    time_out?: string;
    break_minutes?: number;
  }): AttendanceRecord => {
    const breakM = data.break_minutes ?? 90;
    let elapsed = 0;
    let workHours = 0;

    if (data.time_out) {
      const [inH, inM] = data.time_in.split(':').map(Number);
      const [outH, outM] = data.time_out.split(':').map(Number);
      elapsed = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
      workHours = Math.max(0, parseFloat(((Math.max(0, elapsed - breakM)) / 60).toFixed(2)));
    }

    const newAtt: AttendanceRecord = {
      attendance_id: `ATT-${data.employee_id}-${data.work_date}`,
      employee_id: data.employee_id,
      site_id: data.site_id,
      work_date: data.work_date,
      time_in: data.time_in,
      time_out: data.time_out || null,
      elapsed_minutes: elapsed,
      break_minutes: breakM,
      work_minutes: Math.max(0, elapsed - breakM),
      work_hours: workHours,
      source: 'MANUAL',
      qr_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.employee_id === data.employee_id && a.work_date === data.work_date));
      return [newAtt, ...filtered];
    });

    addAuditLog('MANUAL_ATTENDANCE', 'ATTENDANCE', newAtt.attendance_id, `Logged manual time ${data.time_in}-${data.time_out || 'N/A'}`);
    return newAtt;
  };

  const correctAttendance = (attendance_id: string, time_in: string, time_out: string, reason: string) => {
    const existing = attendance.find((a) => a.attendance_id === attendance_id);
    if (!existing) return;

    const [inH, inM] = time_in.split(':').map(Number);
    const [outH, outM] = time_out.split(':').map(Number);
    const breakM = existing.break_minutes || 90;
    const elapsed = Math.max(0, outH * 60 + outM - (inH * 60 + inM));
    const workHours = Math.max(0, parseFloat(((Math.max(0, elapsed - breakM)) / 60).toFixed(2)));

    const updated: AttendanceRecord = {
      ...existing,
      time_in,
      time_out,
      elapsed_minutes: elapsed,
      work_minutes: Math.max(0, elapsed - breakM),
      work_hours: workHours,
      updated_at: new Date().toISOString(),
    };

    setAttendance((prev) => prev.map((a) => (a.attendance_id === attendance_id ? updated : a)));

    // Log to DtrChange
    const changeLog: DtrChange = {
      change_id: `CHG-${Date.now()}`,
      attendance_id,
      week_key: '2026-W41',
      employee_id: existing.employee_id,
      field_name: 'time_in/time_out',
      before_value: `${existing.time_in} - ${existing.time_out || '-'}`,
      after_value: `${time_in} - ${time_out}`,
      reason,
      changed_by: currentUser ? currentUser.access_point : 'admin 1',
      changed_at: new Date().toISOString(),
    };
    setDtrChanges((prev) => [changeLog, ...prev]);

    addAuditLog('CORRECT_DTR', 'ATTENDANCE', attendance_id, `Correction: ${reason}`);
  };

  const rolloverWeek = (nextWeekKey: string, dateStart: string, dateEnd: string) => {
    // Finalize all active weeks and insert new week
    setDtrWeeks((prev) => [
      {
        week_key: nextWeekKey,
        site_id: 'SITE-001',
        date_start: dateStart,
        date_end: dateEnd,
        date_today: dateStart,
        last_updated: new Date().toISOString(),
        status: 'active',
      },
      ...prev.map((w) => ({ ...w, status: 'finalized' as const })),
    ]);
    addAuditLog('WEEKLY_ROLLOVER', 'DTR_WEEKS', nextWeekKey, `Archived previous weeks, started new working week ${nextWeekKey}`);
  };

  // Deductions
  const addDeduction = (
    ded: Omit<DeductionRecord, 'deduction_id' | 'created_at' | 'updated_at' | 'total_deductions' | 'is_void'>
  ): DeductionRecord => {
    const total = ded.canteen + ded.sss + ded.philhealth + ded.other_deduction + ded.cash_advance;
    const newDed: DeductionRecord = {
      ...ded,
      deduction_id: `DED-${ded.employee_id}-${ded.week_key}`,
      total_deductions: total,
      is_void: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDeductions((prev) => {
      const filtered = prev.filter((d) => !(d.employee_id === ded.employee_id && d.week_key === ded.week_key));
      return [newDed, ...filtered];
    });

    // Update or recalculate payroll record for this employee and week
    recalculatePayroll(ded.week_key);
    addAuditLog('CREATE', 'DEDUCTION', newDed.deduction_id, `Total Deductions: ₱${total}`);
    return newDed;
  };

  const voidDeduction = (deduction_id: string) => {
    setDeductions((prev) =>
      prev.map((d) => (d.deduction_id === deduction_id ? { ...d, is_void: 1, total_deductions: 0 } : d))
    );
    addAuditLog('VOID', 'DEDUCTION', deduction_id, 'Deduction voided');
    const d = deductions.find((item) => item.deduction_id === deduction_id);
    if (d) recalculatePayroll(d.week_key);
  };

  // Payroll Calculation
  const recalculatePayroll = (weekKey: string, siteId?: string) => {
    const targetWeek = dtrWeeks.find((w) => w.week_key === weekKey) || dtrWeeks[0];
    const activeEmps = employees.filter((e) => e.status !== 'archived');

    const newPayrollRecords: PayrollRecord[] = activeEmps.map((emp) => {
      // Find all attendance for this employee within week dates
      const empAtt = attendance.filter(
        (a) =>
          a.employee_id === emp.employee_id &&
          targetWeek &&
          a.work_date >= targetWeek.date_start &&
          a.work_date <= targetWeek.date_end
      );

      const verifiedHours = empAtt.reduce((sum, a) => sum + (a.work_hours || 0), 0);
      const verifiedDays = parseFloat((verifiedHours / 8).toFixed(1));
      const grossPay = parseFloat((verifiedDays * emp.daily_rate).toFixed(2));

      // Find deductions
      const empDed = deductions.find(
        (d) => d.employee_id === emp.employee_id && d.week_key === weekKey && d.is_void === 0
      );

      const canteen = empDed?.canteen || 0;
      const sss = empDed?.sss || 0;
      const philhealth = empDed?.philhealth || 0;
      const other_deduction = empDed?.other_deduction || 0;
      const cash_advance = empDed?.cash_advance || 0;
      const totalDeductions = canteen + sss + philhealth + other_deduction + cash_advance;
      const netPay = Math.max(0, parseFloat((grossPay - totalDeductions).toFixed(2)));

      // Check existing record to preserve payment status and proofs if any
      const existingPay = payroll.find((p) => p.employee_id === emp.employee_id && p.week_key === weekKey);

      return {
        payroll_id: `PAY-${emp.employee_id}-${weekKey}`,
        employee_id: emp.employee_id,
        week_key: weekKey,
        site_id: emp.site_id,
        daily_rate: emp.daily_rate,
        verified_days: verifiedDays,
        verified_hours: verifiedHours,
        gross_pay: grossPay,
        canteen,
        sss,
        philhealth,
        other_deduction,
        cash_advance,
        total_deductions: totalDeductions,
        net_pay: netPay,
        payment_method: existingPay?.payment_method || (emp.gcash_number ? 'GCash' : 'Cash'),
        payment_status: existingPay?.payment_status || 'Pending',
        reference_no: existingPay?.reference_no || '',
        notes: existingPay?.notes || '',
        proof_file_id: existingPay?.proof_file_id || '',
        proof_url: existingPay?.proof_url || '',
        paid_at: existingPay?.paid_at,
        verified_at: existingPay?.verified_at,
        recorded_by: currentUser?.email || 'admin 1',
        created_at: existingPay?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    setPayroll((prev) => {
      const filtered = prev.filter((p) => p.week_key !== weekKey);
      return [...newPayrollRecords, ...filtered];
    });

    addAuditLog('RECALCULATE', 'PAYROLL', weekKey, `Recalculated for ${newPayrollRecords.length} workers`);
  };

  const verifyPayrollProof = (
    payroll_id: string,
    payment_method: 'Cash' | 'GCash',
    reference_no: string,
    status: 'Verified' | 'Paid',
    proof_url: string,
    notes?: string
  ) => {
    setPayroll((prev) =>
      prev.map((p) => {
        if (p.payroll_id === payroll_id) {
          return {
            ...p,
            payment_method,
            reference_no,
            payment_status: status,
            proof_url: proof_url || p.proof_url,
            proof_file_id: proof_url ? `PROOF-${Date.now()}` : p.proof_file_id,
            verified_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
            notes: notes ?? p.notes,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    addAuditLog('VERIFY_PAYMENT', 'PAYROLL', payroll_id, `Verified via ${payment_method} Ref: ${reference_no}`);
  };

  // Materials
  const addMaterial = (mat: Omit<MaterialRecord, 'material_id' | 'created_at' | 'total_cost'>): MaterialRecord => {
    const total = mat.quantity * mat.unit_cost;
    const newId = `MAT-${String(materials.length + 1).padStart(3, '0')}`;
    const newMat: MaterialRecord = {
      ...mat,
      material_id: newId,
      total_cost: total,
      created_at: new Date().toISOString(),
    };
    setMaterials((prev) => [newMat, ...prev]);
    addAuditLog('CREATE', 'MATERIAL', newId, `Delivered: ${newMat.material_name} (${newMat.quantity} ${newMat.unit})`);
    return newMat;
  };

  const archiveMaterial = (id: string) => {
    setMaterials((prev) => prev.map((m) => (m.material_id === id ? { ...m, is_archived: 1 } : m)));
    addAuditLog('ARCHIVE', 'MATERIAL', id, 'Archived material delivery record');
  };

  // Expenses
  const addExpense = (exp: Omit<ExpenseRecord, 'expense_id' | 'created_at'>): ExpenseRecord => {
    const newId = `EXP-${String(expenses.length + 1).padStart(3, '0')}`;
    const newExp: ExpenseRecord = {
      ...exp,
      expense_id: newId,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    addAuditLog('CREATE', 'EXPENSE', newId, `Expense: ${newExp.category} ₱${newExp.amount}`);
    return newExp;
  };

  // Messages
  const sendMessage = (conversation_id: string, text: string, attachmentName?: string) => {
    const newMsg: MessageItem = {
      message_id: `MSG-${Date.now()}`,
      conversation_id,
      sender_email: currentUser?.email || 'operations@deruedaconstruction.com',
      sender_name: currentUser ? (currentUser.access_point === 'ceo' ? 'De Rueda Executive' : currentUser.access_point.toUpperCase()) : 'System',
      sender_access_point: currentUser?.access_point || 'ceo',
      text,
      attachments: attachmentName ? JSON.stringify([{ name: attachmentName }]) : '[]',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);

    setConversations((prev) =>
      prev.map((c) => (c.conversation_id === conversation_id ? { ...c, last_message_at: new Date().toISOString() } : c))
    );
  };

  const createConversation = (title: string, type: 'direct' | 'group'): Conversation => {
    const newId = `CONV-${String(conversations.length + 1).padStart(3, '0')}`;
    const newConv: Conversation = {
      conversation_id: newId,
      title,
      type,
      participants: JSON.stringify([currentUser?.email || 'operations@deruedaconstruction.com']),
      pinned: 0,
      muted: 0,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    addAuditLog('CREATE', 'CONVERSATION', newId, `Started conversation ${title}`);
    return newConv;
  };

  // Documents
  const addDocument = (doc: Omit<DocumentItem, 'document_id' | 'created_at'>): DocumentItem => {
    const newId = `DOC-${String(documents.length + 1).padStart(3, '0')}`;
    const newDoc: DocumentItem = {
      ...doc,
      document_id: newId,
      created_at: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addAuditLog('CREATE', 'DOCUMENT', newId, `Linked document ${newDoc.file_name}`);
    return newDoc;
  };

  // Public Intake
  const submitPublicInquiry = (inq: Omit<PublicInquiry, 'inquiry_id' | 'created_at' | 'status'>) => {
    const newInq: PublicInquiry = {
      ...inq,
      inquiry_id: `INQ-${Date.now()}`,
      status: 'New',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setInquiries((prev) => [newInq, ...prev]);
    addAuditLog('PUBLIC_INTAKE', 'INQUIRY', newInq.inquiry_id, `Received client inquiry from ${newInq.name}`);
  };

  const submitPublicHiring = (hire: Omit<PublicHiring, 'hiring_id' | 'created_at' | 'status'>) => {
    const newHire: PublicHiring = {
      ...hire,
      hiring_id: `HIR-${Date.now()}`,
      status: 'Under Review',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setHiring((prev) => [newHire, ...prev]);
    addAuditLog('PUBLIC_INTAKE', 'HIRING', newHire.hiring_id, `Received job application from ${newHire.name}`);
  };

  const updateInquiryStatus = (id: string, status: PublicInquiry['status']) => {
    setInquiries((prev) => prev.map((item) => (item.inquiry_id === id ? { ...item, status } : item)));
  };

  const updateHiringStatus = (id: string, status: PublicHiring['status']) => {
    setHiring((prev) => prev.map((item) => (item.hiring_id === id ? { ...item, status } : item)));
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('UPDATE', 'SETTINGS', 'SYSTEM', JSON.stringify(newSettings));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentSite,
        setCurrentSite,
        login,
        logout,
        loginDirectory,
        employees,
        sites,
        attendance,
        dtrWeeks,
        dtrChanges,
        deductions,
        payroll,
        materials,
        expenses,
        conversations,
        messages,
        documents,
        auditLogs,
        settings,
        inquiries,
        hiring,
        addEmployee,
        updateEmployee,
        archiveEmployee,
        rehireEmployee,
        addSite,
        updateSite,
        scanAttendanceQr,
        recordManualAttendance,
        correctAttendance,
        rolloverWeek,
        addDeduction,
        voidDeduction,
        recalculatePayroll,
        verifyPayrollProof,
        addMaterial,
        archiveMaterial,
        addExpense,
        sendMessage,
        createConversation,
        addDocument,
        submitPublicInquiry,
        submitPublicHiring,
        updateInquiryStatus,
        updateHiringStatus,
        updateSettings,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
