import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  AISettings,
  Attempt,
  Cohort,
  DailyWarmup,
  DoubtQuery,
  FeePlan,
  Institute,
  Lecture,
  LibraryItem,
  MentoringSlot,
  Notice,
  Payment,
  QuestionDraft,
  ScreenTimeRecord,
  SeatRecord,
  Series,
  Student,
  TabId,
  Test,
  UserRole,
  PreviewMode,
  TeacherRequest,
  StudentLead,
  AppFeatures,
  PersonalMessage
} from '../types';
import { runAIPaymentVerification } from '../utils/paymentVerification';
import {
  SEED_ACCOUNTS,
  SEED_COHORTS,
  SEED_FEE_PLANS,
  SEED_INSTITUTE,
  SEED_LECTURES,
  SEED_LIBRARY,
  SEED_NOTICES,
  SEED_STUDENTS,
  createInitialSeedQuestions
} from '../data/seed';
import { clearSession, retrieveSession, storeSession } from '../utils/sessionVault';
import { loadFromDeviceLedger, saveToDeviceLedger } from '../utils/storageLedger';
import { canAccess } from '../utils/accessControl';
import { MASTER_ADMIN_ACCOUNT, verifyMasterAdminCredentials, logSecurityAudit } from '../utils/adminAuth';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  undoAction?: () => void;
  undoLabel?: string;
}

interface TeachDeskContextType {
  // Session & Auth
  account: Account | null;
  role: UserRole | null;
  unlockedSigningKey: JsonWebKey | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  signIn: (account: Account, password?: string, signingKey?: JsonWebKey) => Promise<void>;
  signInAsStudent: (student: Student) => Promise<void>;
  signOut: () => void;
  registerTeacher: (newAccount: Account, password: string, signingKey?: JsonWebKey) => Promise<void>;
  updateAccountPayout: (payout: { upiId: string; accountName: string }, signingKey?: JsonWebKey) => Promise<void>;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Institute & Catalogue
  institute: Institute;
  updateInstitute: (inst: Institute) => Promise<void>;
  teachersList: Account[];
  addTeacherInvite: (teacher: Partial<Account>) => void;

  // Cohorts & Students
  cohorts: Cohort[];
  addCohort: (cohort: Cohort) => Promise<void>;
  updateCohort: (cohort: Cohort) => Promise<void>;
  students: Student[];
  addStudent: (student: Student) => Promise<void>;
  importStudentsBatch: (students: Student[]) => Promise<number>;
  flagStudent: (studentId: string, reason: string) => Promise<void>;
  updateStudentFeeStatus: (studentId: string, status: Student['paymentStatus']) => Promise<void>;
  approveStudentAdmission: (studentId: string, teacherId?: string, teacherName?: string) => Promise<void>;
  rejectStudentAdmission: (studentId: string, reason: string) => Promise<void>;

  // Lab Seats
  seats: SeatRecord[];
  checkInSeat: (seatNumber: number, studentId: string) => void;
  checkOutSeat: (seatNumber: number) => void;

  // Lectures
  lectures: Lecture[];
  addLecture: (lec: Lecture) => Promise<void>;
  updateLecture: (lec: Lecture) => Promise<void>;

  // Question & Review Desk
  questions: QuestionDraft[];
  addQuestions: (qs: QuestionDraft[]) => Promise<void>;
  updateQuestion: (q: QuestionDraft) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  approveQuestion: (id: string) => Promise<void>;
  rejectQuestion: (id: string) => Promise<void>;

  // Tests & Series
  tests: Test[];
  addTest: (test: Test) => Promise<void>;
  updateTest: (test: Test) => Promise<void>;
  seriesList: Series[];
  addSeries: (series: Series) => Promise<void>;
  updateSeries: (series: Series) => Promise<void>;

  // Sessions & Attempts (Supervision)
  attempts: Attempt[];
  recordAttempt: (attempt: Attempt) => Promise<void>;

  // Proctoring & Screen-Time
  screenTimeRecords: ScreenTimeRecord[];
  addScreenTimeRecord: (rec: ScreenTimeRecord) => Promise<void>;

  // Fees & Payments
  feePlans: FeePlan[];
  addFeePlan: (plan: FeePlan) => Promise<void>;
  updateFeePlan: (plan: FeePlan) => Promise<void>;
  payments: Payment[];
  recordPayment: (payment: Payment) => Promise<void>;
  verifyPaymentAndSign: (paymentId: string, signatureHex: string, note?: string) => Promise<void>;
  rejectPayment: (paymentId: string, reason: string) => Promise<void>;
  updateInstituteSettlement: (settlementUpi: string, settlementAccountName: string) => Promise<void>;

  // Doubts
  doubts: DoubtQuery[];
  addDoubt: (doubt: DoubtQuery) => Promise<void>;
  resolveDoubt: (doubtId: string, solution: DoubtQuery['solution']) => Promise<void>;

  // Mentoring
  mentoringSlots: MentoringSlot[];
  addMentoringSlot: (slot: MentoringSlot) => Promise<void>;
  updateMentoringSlotStatus: (slotId: string, status: MentoringSlot['status']) => Promise<void>;
  addMentoringMessage: (slotId: string, text: string) => Promise<void>;

  // Library
  libraryItems: LibraryItem[];
  addLibraryItem: (item: LibraryItem) => Promise<void>;
  removeLibraryItem: (id: string) => Promise<void>;

  // Daily Warmup
  dailyWarmup: DailyWarmup | null;
  completeWarmup: () => void;
  resetWarmup: () => void;

  // Notices
  notices: Notice[];
  addNotice: (notice: Notice) => Promise<void>;

  // AI Settings
  aiSettings: AISettings;
  updateAiSettings: (settings: AISettings) => void;

  // Master Admin & Secret Access (Om Shankar)
  isMasterAdminUnlocked: boolean;
  unlockMasterAdmin: (password: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  lockMasterAdmin: () => void;
  isMasterAdminModalOpen: boolean;
  setIsMasterAdminModalOpen: (open: boolean) => void;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;

  // Coaching Reset & Demo Data
  resetToFreshBlankState: () => Promise<void>;
  loadDemoPracticeData: () => Promise<void>;

  // Direct Student Enrollment
  enrollStudentDirect: (studentData: {
    name: string;
    rollNo: string;
    phone: string;
    parentPhone: string;
    course: string;
    cohortId: string;
    feePlanId?: string;
  }) => Promise<Student>;

  // Teacher Requests & Admin Approval Flow
  teacherRequests: TeacherRequest[];
  requestTeacherAccount: (request: Omit<TeacherRequest, 'id' | 'status' | 'requestedAt'>) => Promise<{ success: boolean; message: string }>;
  approveTeacherRequest: (requestId: string) => Promise<void>;
  rejectTeacherRequest: (requestId: string, reason?: string) => Promise<void>;

  // User Termination & Control
  terminateUser: (userId: string, role: 'teacher' | 'student') => Promise<void>;
  reactivateUser: (userId: string, role: 'teacher' | 'student') => Promise<void>;

  // Personal Direct Messaging
  personalMessages: PersonalMessage[];
  sendPersonalMessage: (msg: Omit<PersonalMessage, 'id' | 'senderName' | 'senderRole' | 'sentAt' | 'isRead'>) => Promise<void>;
  markPersonalMessageRead: (id: string) => void;

  // Feature Toggles (Turn on/off any feature)
  appFeatures: AppFeatures;
  toggleAppFeature: (feature: keyof AppFeatures) => void;

  // Student Leads (Registered but not paid drop-offs)
  studentLeads: StudentLead[];
  createStudentLead: (lead: Omit<StudentLead, 'id' | 'status' | 'createdAt' | 'lastStep'>) => Promise<StudentLead>;
  updateStudentLead: (leadId: string, updates: Partial<StudentLead>) => Promise<void>;

  // Duplicate Proof Shield & AI Payment Verification
  usedScreenshotHashes: string[];
  verifyAndProcessStudentPayment: (params: {
    leadId: string;
    screenshotBase64: string;
    utr: string;
    payerName: string;
    payerPhone: string;
    payerEmail?: string;
    schoolName?: string;
    studentClass?: string;
    amount: number;
    feePlanId: string;
    cohortId: string;
    course: string;
  }) => Promise<{ success: boolean; error?: string; student?: Student; isDuplicate?: boolean; remarks?: string }>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (msg: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Command palette
  isCommandOpen: boolean;
  setIsCommandOpen: (open: boolean) => void;
}

const TeachDeskContext = createContext<TeachDeskContextType | null>(null);

export const TeachDeskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('teachdesk_theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('teachdesk_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('teachdesk_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Active Tab & Navigation
  const [activeTab, setActiveTabState] = useState<TabId>('dashboard');

  // Session & Auth
  const [account, setAccount] = useState<Account | null>(null);
  const [unlockedSigningKey, setUnlockedSigningKey] = useState<JsonWebKey | null>(null);

  // Institute Data (Shared ledger - starts fresh & blank for new coaching)
  const [institute, setInstitute] = useState<Institute>(SEED_INSTITUTE);
  const [teachersList, setTeachersList] = useState<Account[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Content & Sessions (Fresh beginner slate)
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [screenTimeRecords, setScreenTimeRecords] = useState<ScreenTimeRecord[]>([]);
  const [doubts, setDoubts] = useState<DoubtQuery[]>([]);
  const [mentoringSlots, setMentoringSlots] = useState<MentoringSlot[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  // Teacher Requests & Admin Approval Flow
  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);

  // Student Leads (Registered but not paid drop-offs)
  const [studentLeads, setStudentLeads] = useState<StudentLead[]>([]);

  // Direct Personal Messages from Admin
  const [personalMessages, setPersonalMessages] = useState<PersonalMessage[]>([]);

  // App Features Control Toggles
  const [appFeatures, setAppFeatures] = useState<AppFeatures>({
    aiQuestionGenerator: true,
    lectureStudio: true,
    proctoringEngine: true,
    screenTime: true,
    doubtDesk: true,
    libraryNotes: true,
    dailyWarmup: true,
    mentoringSlots: true,
    testSeries: true,
    examBuilder: true,
    studentRegistrationPortal: true,
    onlineFeePayment: true,
  });

  // Used Screenshot Hashes (Strict Duplicate Shield)
  const [usedScreenshotHashes, setUsedScreenshotHashes] = useState<string[]>([]);

  // Master Admin & Secret Access (Om Shankar)
  const [isMasterAdminUnlocked, setIsMasterAdminUnlocked] = useState<boolean>(false);
  const [isMasterAdminModalOpen, setIsMasterAdminModalOpen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('admin');

  // Lab Seats
  const [seats, setSeats] = useState<SeatRecord[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      seatNumber: i + 1,
      label: `Lab Station ${String(i + 1).padStart(2, '0')}`,
      isOccupied: false,
      history: []
    }));
  });

  // Daily Warmup
  const [dailyWarmup, setDailyWarmup] = useState<DailyWarmup | null>(null);

  // AI settings
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('teachdesk_ai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      chatModel: 'gpt-4o',
      visionModel: 'gpt-4o',
      transcriptionModel: 'whisper-1'
    };
  });

  // Toasts & Command Palette
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Initialize: Load session and device ledger
  useEffect(() => {
    async function init() {
      // 1. Try restore session from sessionStorage
      const session = await retrieveSession();
      if (session && session.account) {
        setAccount(session.account);
        if (session.account.role === 'admin' && session.account.id === MASTER_ADMIN_ACCOUNT.id) {
          setIsMasterAdminUnlocked(true);
        }
        if (session.unlockedSigningPrivateJwk) {
          setUnlockedSigningKey(session.unlockedSigningPrivateJwk);
        }
      } else {
        // App starts fresh in unauthenticated state
        setAccount(null);
      }

      // 2. Load shared institute ledger from IndexedDB
      try {
        const ledgerInstitute = await loadFromDeviceLedger<Institute>('institute_profile');
        if (ledgerInstitute) setInstitute(ledgerInstitute);

        const ledgerCohorts = await loadFromDeviceLedger<Cohort[]>('cohorts_ledger');
        if (ledgerCohorts) setCohorts(ledgerCohorts);

        const ledgerStudents = await loadFromDeviceLedger<Student[]>('students_ledger');
        if (ledgerStudents) setStudents(ledgerStudents);

        const ledgerFeePlans = await loadFromDeviceLedger<FeePlan[]>('fee_plans_ledger');
        if (ledgerFeePlans) setFeePlans(ledgerFeePlans);

        const ledgerPayments = await loadFromDeviceLedger<Payment[]>('payments_ledger');
        if (ledgerPayments) setPayments(ledgerPayments);

        const ledgerTeachers = await loadFromDeviceLedger<Account[]>('teachers_ledger');
        if (ledgerTeachers) setTeachersList(ledgerTeachers);

        const ledgerRequests = await loadFromDeviceLedger<TeacherRequest[]>('teacher_requests_ledger');
        if (ledgerRequests) setTeacherRequests(ledgerRequests);

        const ledgerLeads = await loadFromDeviceLedger<StudentLead[]>('student_leads_ledger');
        if (ledgerLeads) setStudentLeads(ledgerLeads);

        const ledgerPersonalMsgs = await loadFromDeviceLedger<PersonalMessage[]>('personal_messages_ledger');
        if (ledgerPersonalMsgs) setPersonalMessages(ledgerPersonalMsgs);

        const ledgerFeatures = await loadFromDeviceLedger<AppFeatures>('app_features_ledger');
        if (ledgerFeatures) setAppFeatures(ledgerFeatures);

        const ledgerHashes = await loadFromDeviceLedger<string[]>('used_proof_hashes_ledger');
        if (ledgerHashes) setUsedScreenshotHashes(ledgerHashes);
      } catch (err) {
        console.warn('Ledger load fallback to defaults', err);
      }
    }
    init();
  }, []);

  // Sync Daily Warmup stability per day & teacher
  useEffect(() => {
    if (!account) return;
    const today = new Date().toISOString().split('T')[0];
    if (!dailyWarmup || dailyWarmup.date !== today || dailyWarmup.teacherId !== account.id) {
      // Pick 5 stable questions from questions bank or curriculum
      const qPool = questions.filter(q => q.reviewStatus === 'approved');
      const sample = qPool.length >= 5 ? qPool.slice(0, 5) : questions.slice(0, 5);
      setDailyWarmup({
        date: today,
        teacherId: account.id,
        questions: sample,
        completed: false,
        streak: 3
      });
    }
  }, [account, questions, dailyWarmup]);

  const addToast = (msg: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { ...msg, id };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Safe tab switcher that enforces access control
  const setActiveTab = (tab: TabId) => {
    const currentRole = account?.role || 'teacher';
    if (canAccess(tab, currentRole)) {
      setActiveTabState(tab);
    } else {
      addToast({
        type: 'danger',
        title: 'Access Restricted',
        message: `Your role (${currentRole}) does not have permission to view this surface.`
      });
    }
  };

  const signIn = async (userAccount: Account, _password?: string, signingKey?: JsonWebKey) => {
    // 1. Check if account is terminated
    if (userAccount.status === 'terminated') {
      addToast({
        type: 'danger',
        title: 'Account Terminated',
        message: 'Your account access has been suspended or terminated by Coaching Administrator (Om Shankar).'
      });
      throw new Error('This account has been terminated by the administrator.');
    }

    // 2. Check if account is pending approval
    if (userAccount.status === 'pending') {
      addToast({
        type: 'warning',
        title: 'Approval Pending',
        message: 'Your faculty registration request has been submitted and is currently awaiting approval by Admin (Om Shankar).'
      });
      throw new Error('Account pending admin approval. Please wait for Om Shankar to approve your request in the Admin Panel.');
    }

    setAccount(userAccount);
    if (signingKey) {
      setUnlockedSigningKey(signingKey);
    }
    await storeSession({
      account: userAccount,
      unlockedSigningPrivateJwk: signingKey,
      unlockedAt: Date.now()
    });
    addToast({
      type: 'success',
      title: 'Authenticated',
      message: `Signed in as ${userAccount.name} (${userAccount.role}).`
    });
    // Check if current tab is allowed
    if (!canAccess(activeTab, userAccount.role)) {
      setActiveTabState('dashboard');
    }
  };

  const signInAsStudent = async (student: Student) => {
    if (student.isTerminated) {
      addToast({
        type: 'danger',
        title: 'Admission Suspended',
        message: 'Your student account access has been suspended or terminated by Coaching Administrator (Om Shankar).'
      });
      throw new Error('Your student account has been suspended by the administrator.');
    }

    if (student.admissionStatus === 'rejected') {
      addToast({
        type: 'danger',
        title: 'Admission Not Approved',
        message: `Your registration was not approved by faculty: ${student.rejectionReason || 'Please contact coaching administration.'}`
      });
      throw new Error(`Your admission was not approved: ${student.rejectionReason || 'Please contact administration.'}`);
    }

    const studentAccount: Account = {
      id: student.id,
      role: 'student',
      name: student.name,
      email: student.email || `${student.rollNo.toLowerCase()}@phi.coaching`,
      phone: student.phone,
      subject: student.course,
      courses: [student.course],
      qualification: `${student.schoolName ? student.schoolName + ' · ' : ''}${student.studentClass || 'Class 11'}`,
      yearsExperience: 0,
      instituteId: institute.id || 'inst_phi_default',
      createdAt: student.enrolledAt,
      status: student.isTerminated ? 'terminated' : 'active'
    };

    setAccount(studentAccount);
    setPreviewMode('admin');
    await storeSession({
      account: studentAccount,
      unlockedAt: Date.now()
    });

    if (student.admissionStatus === 'pending_review') {
      addToast({
        type: 'warning',
        title: 'Application Under Teacher Review',
        message: `Welcome, ${student.name}! Your batch registration is queued for teacher review.`
      });
    } else {
      addToast({
        type: 'success',
        title: 'Student Portal Active',
        message: `Welcome ${student.name}! Roll No: ${student.rollNo}.`
      });
    }
    setActiveTabState('dashboard');
  };

  const signOut = () => {
    clearSession();
    setAccount(null);
    setUnlockedSigningKey(null);
    setIsMasterAdminUnlocked(false);
    setActiveTabState('dashboard');
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Session token and unsealed keys cleared from browser.'
    });
  };

  // Master Admin (Om Shankar) Unlock & Lock
  const unlockMasterAdmin = async (password: string, pin: string) => {
    const result = await verifyMasterAdminCredentials(password, pin);
    if (result.success) {
      setAccount(MASTER_ADMIN_ACCOUNT);
      setIsMasterAdminUnlocked(true);
      await storeSession({
        account: MASTER_ADMIN_ACCOUNT,
        unlockedAt: Date.now()
      });
      setActiveTabState('admin');
      addToast({
        type: 'success',
        title: 'Master Console Unlocked',
        message: 'Welcome Om Shankar. Master Admin Access Granted.'
      });
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const lockMasterAdmin = () => {
    setIsMasterAdminUnlocked(false);
    logSecurityAudit('SESSION_LOCKED', 'Master Console locked by owner.', 'info');
    signOut();
    addToast({
      type: 'info',
      title: 'Master Console Locked',
      message: 'Admin access panel locked and hidden from view.'
    });
  };

  // Reset all features to newly started clean/blank slate
  const resetToFreshBlankState = async () => {
    setCohorts([]);
    setStudents([]);
    setLectures([]);
    setQuestions([]);
    setTests([]);
    setSeriesList([]);
    setAttempts([]);
    setScreenTimeRecords([]);
    setDoubts([]);
    setMentoringSlots([]);
    setLibraryItems([]);
    setNotices([]);
    setFeePlans([]);
    setPayments([]);

    await saveToDeviceLedger('cohorts_ledger', []);
    await saveToDeviceLedger('students_ledger', []);
    await saveToDeviceLedger('fee_plans_ledger', []);
    await saveToDeviceLedger('payments_ledger', []);

    logSecurityAudit('SYSTEM_RESET', 'Owner reset all coaching data to newly started blank state.', 'warning');
    addToast({
      type: 'info',
      title: 'Blank State Activated',
      message: 'Coaching data reset to clean slate. Beginner directions ready.'
    });
  };

  // Optional sample demo data loader for testing
  const loadDemoPracticeData = async () => {
    setInstitute(SEED_INSTITUTE);
    setCohorts(SEED_COHORTS);
    setStudents(SEED_STUDENTS);
    setLectures(SEED_LECTURES);
    setQuestions(createInitialSeedQuestions());
    setLibraryItems(SEED_LIBRARY);
    setNotices(SEED_NOTICES);
    setFeePlans(SEED_FEE_PLANS);
    setTeachersList(SEED_ACCOUNTS);

    await saveToDeviceLedger('cohorts_ledger', SEED_COHORTS);
    await saveToDeviceLedger('students_ledger', SEED_STUDENTS);
    await saveToDeviceLedger('fee_plans_ledger', SEED_FEE_PLANS);
    await saveToDeviceLedger('teachers_ledger', SEED_ACCOUNTS);

    addToast({
      type: 'success',
      title: 'Sample Data Loaded',
      message: 'Practice cohorts, students, and curriculum loaded for demonstration.'
    });
  };

  // Direct student enrollment by teacher or student registration
  const enrollStudentDirect = async (studentData: {
    name: string;
    rollNo: string;
    phone: string;
    parentPhone: string;
    course: string;
    cohortId: string;
    feePlanId?: string;
  }) => {
    const newStudent: Student = {
      id: 'stu_' + Math.random().toString(36).substring(2, 9),
      name: studentData.name.trim(),
      rollNo: studentData.rollNo.trim().toUpperCase(),
      phone: studentData.phone.trim(),
      parentPhone: studentData.parentPhone.trim(),
      course: studentData.course,
      cohortId: studentData.cohortId,
      enrolledAt: new Date().toISOString().split('T')[0],
      feePlanId: studentData.feePlanId,
      paymentStatus: 'pending',
      flags: [],
      academicTags: ['New Admission']
    };
    const updated = [newStudent, ...students.filter(s => s.rollNo !== newStudent.rollNo)];
    setStudents(updated);
    await saveToDeviceLedger('students_ledger', updated);
    addToast({
      type: 'success',
      title: 'Student Admitted',
      message: `${newStudent.name} (Roll: ${newStudent.rollNo}) admitted into Phi Coaching.`
    });
    return newStudent;
  };

  const registerTeacher = async (newAcc: Account, _password: string, signingKey?: JsonWebKey) => {
    const updatedTeachers = [...teachersList.filter(t => t.id !== newAcc.id), newAcc];
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);

    // If cohorts are empty, create their starter batch so students can immediately join under this teacher
    if (cohorts.length === 0) {
      const initialCohort: Cohort = {
        id: 'coh_' + Math.random().toString(36).substring(2, 9),
        name: `${newAcc.subject} Batch Alpha (${newAcc.courses[0] || 'Main'})`,
        code: `${newAcc.subject.slice(0, 3).toUpperCase()}-26`,
        course: newAcc.courses[0] || 'IIT-JEE (Main & Advanced)',
        subject: newAcc.subject,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-05-30',
        teacherIds: [newAcc.id],
        createdAt: new Date().toISOString()
      };
      const updatedCohorts = [initialCohort];
      setCohorts(updatedCohorts);
      await saveToDeviceLedger('cohorts_ledger', updatedCohorts);
    }

    await signIn(newAcc, _password, signingKey);
  };

  const updateAccountPayout = async (payout: { upiId: string; accountName: string }, signingKey?: JsonWebKey) => {
    if (!account) return;
    const updated: Account = {
      ...account,
      payout,
      signingPublicKey: signingKey ? signingKey : account.signingPublicKey
    };
    setAccount(updated);
    if (signingKey) {
      setUnlockedSigningKey(signingKey);
    }
    const updatedTeachers = teachersList.map(t => t.id === account.id ? updated : t);
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);
    await storeSession({
      account: updated,
      unlockedSigningPrivateJwk: signingKey || unlockedSigningKey || undefined,
      unlockedAt: Date.now()
    });
    addToast({
      type: 'success',
      title: 'Payout Configured',
      message: `Settlement account updated for ${payout.accountName} (${payout.upiId}). Signing key preserved.`
    });
  };

  // Request Teacher Account (Awaits Admin Om Shankar approval)
  const requestTeacherAccount = async (requestData: Omit<TeacherRequest, 'id' | 'status' | 'requestedAt'>) => {
    const existing = teachersList.find(t => t.email.toLowerCase() === requestData.email.toLowerCase());
    if (existing) {
      if (existing.status === 'active') {
        throw new Error('An active teacher account with this email already exists. Please sign in directly.');
      } else if (existing.status === 'terminated') {
        throw new Error('This account was previously terminated by Coaching Admin.');
      }
    }

    const newReq: TeacherRequest = {
      ...requestData,
      id: 'req_' + Math.random().toString(36).substring(2, 9),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    // Create pending account in teachersList so login checks work consistently
    const pendingAccount: Account = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      role: 'teacher',
      name: requestData.name.trim(),
      email: requestData.email.trim(),
      subject: requestData.subject,
      courses: [requestData.course || 'IIT-JEE (Main & Advanced)'],
      phone: requestData.phone.trim(),
      qualification: requestData.qualification || 'B.Tech / M.Sc.',
      yearsExperience: requestData.yearsExperience || 3,
      instituteId: institute.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
      rawPasswordForDev: requestData.password,
      vaultSalt: requestData.vaultSalt,
      vaultIv: requestData.vaultIv,
      vaultCiphertext: requestData.vaultCiphertext,
      signingPublicKey: requestData.signingPublicKey,
      payout: {
        upiId: `${requestData.name.toLowerCase().replace(/\s+/g, '.')}@phi.upi`,
        accountName: `${requestData.name} Faculty Account`
      }
    };

    const updatedRequests = [newReq, ...teacherRequests.filter(r => r.email.toLowerCase() !== requestData.email.toLowerCase())];
    setTeacherRequests(updatedRequests);
    await saveToDeviceLedger('teacher_requests_ledger', updatedRequests);

    const updatedTeachers = [...teachersList.filter(t => t.email.toLowerCase() !== pendingAccount.email.toLowerCase()), pendingAccount];
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);

    addToast({
      type: 'info',
      title: 'Teacher Request Submitted',
      message: 'Your registration request has been submitted to Admin (Om Shankar). You can log in as soon as it is approved.'
    });

    return { success: true, message: 'Your request was submitted to Admin.' };
  };

  const approveTeacherRequest = async (requestId: string) => {
    const targetReq = teacherRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const updatedRequests = teacherRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const, decidedAt: new Date().toISOString() } : r
    );
    setTeacherRequests(updatedRequests);
    await saveToDeviceLedger('teacher_requests_ledger', updatedRequests);

    const updatedTeachers = teachersList.map(t => {
      if (t.email.toLowerCase() === targetReq.email.toLowerCase()) {
        return { ...t, status: 'active' as const };
      }
      return t;
    });
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);

    // Auto-create batch for teacher if not present
    const approvedTeacher = updatedTeachers.find(t => t.email.toLowerCase() === targetReq.email.toLowerCase());
    if (approvedTeacher) {
      const hasBatch = cohorts.some(c => c.teacherIds.includes(approvedTeacher.id));
      if (!hasBatch) {
        const newBatch: Cohort = {
          id: 'coh_' + Math.random().toString(36).substring(2, 9),
          name: `${approvedTeacher.subject} Batch Alpha (${approvedTeacher.courses[0] || 'IIT-JEE'})`,
          code: `${approvedTeacher.subject.slice(0, 3).toUpperCase()}-26`,
          course: approvedTeacher.courses[0] || 'IIT-JEE (Main & Advanced)',
          subject: approvedTeacher.subject,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '2026-05-30',
          teacherIds: [approvedTeacher.id],
          createdAt: new Date().toISOString()
        };
        const updatedCohorts = [newBatch, ...cohorts];
        setCohorts(updatedCohorts);
        await saveToDeviceLedger('cohorts_ledger', updatedCohorts);
      }
    }

    addToast({
      type: 'success',
      title: 'Faculty Approved',
      message: `${targetReq.name} is now approved. They can now log into Phi Coaching.`
    });
  };

  const rejectTeacherRequest = async (requestId: string, reason: string = 'Access denied by Coaching Administrator.') => {
    const targetReq = teacherRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const updatedRequests = teacherRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const, rejectionReason: reason, decidedAt: new Date().toISOString() } : r
    );
    setTeacherRequests(updatedRequests);
    await saveToDeviceLedger('teacher_requests_ledger', updatedRequests);

    const updatedTeachers = teachersList.filter(t => t.email.toLowerCase() !== targetReq.email.toLowerCase());
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);

    addToast({
      type: 'info',
      title: 'Teacher Request Rejected',
      message: `Request for ${targetReq.name} was rejected.`
    });
  };

  // User Termination & Control
  const terminateUser = async (userId: string, role: 'teacher' | 'student') => {
    if (role === 'teacher') {
      const updatedTeachers = teachersList.map(t =>
        t.id === userId ? { ...t, status: 'terminated' as const } : t
      );
      setTeachersList(updatedTeachers);
      await saveToDeviceLedger('teachers_ledger', updatedTeachers);
      addToast({
        type: 'danger',
        title: 'Faculty Terminated',
        message: 'Teacher account access revoked immediately.'
      });
    } else {
      const updatedStudents = students.map(s =>
        s.id === userId ? { ...s, isTerminated: true } : s
      );
      setStudents(updatedStudents);
      await saveToDeviceLedger('students_ledger', updatedStudents);
      addToast({
        type: 'danger',
        title: 'Student Terminated',
        message: 'Student admission and portal access suspended.'
      });
    }
  };

  const reactivateUser = async (userId: string, role: 'teacher' | 'student') => {
    if (role === 'teacher') {
      const updatedTeachers = teachersList.map(t =>
        t.id === userId ? { ...t, status: 'active' as const } : t
      );
      setTeachersList(updatedTeachers);
      await saveToDeviceLedger('teachers_ledger', updatedTeachers);
      addToast({
        type: 'success',
        title: 'Faculty Reactivated',
        message: 'Teacher account access restored.'
      });
    } else {
      const updatedStudents = students.map(s =>
        s.id === userId ? { ...s, isTerminated: false } : s
      );
      setStudents(updatedStudents);
      await saveToDeviceLedger('students_ledger', updatedStudents);
      addToast({
        type: 'success',
        title: 'Student Reactivated',
        message: 'Student portal access restored.'
      });
    }
  };

  // Direct Personal Messaging from Admin
  const sendPersonalMessage = async (msg: Omit<PersonalMessage, 'id' | 'senderName' | 'senderRole' | 'sentAt' | 'isRead'>) => {
    const newMsg: PersonalMessage = {
      ...msg,
      id: 'pmsg_' + Math.random().toString(36).substring(2, 9),
      senderName: 'Om Shankar (Coaching Director)',
      senderRole: 'admin',
      sentAt: new Date().toISOString(),
      isRead: false
    };
    const updated = [newMsg, ...personalMessages];
    setPersonalMessages(updated);
    await saveToDeviceLedger('personal_messages_ledger', updated);
    addToast({
      type: 'success',
      title: 'Message Delivered',
      message: `Personal notification sent to ${msg.recipientName}.`
    });
  };

  const markPersonalMessageRead = async (id: string) => {
    const updated = personalMessages.map(m => m.id === id ? { ...m, isRead: true } : m);
    setPersonalMessages(updated);
    await saveToDeviceLedger('personal_messages_ledger', updated);
  };

  // App Features Control Toggles
  const toggleAppFeature = async (featureKey: keyof AppFeatures) => {
    const updated = {
      ...appFeatures,
      [featureKey]: !appFeatures[featureKey]
    };
    setAppFeatures(updated);
    await saveToDeviceLedger('app_features_ledger', updated);
    addToast({
      type: 'info',
      title: 'Feature Control Updated',
      message: `${String(featureKey)} is now ${updated[featureKey] ? 'ENABLED' : 'DISABLED'}.`
    });
  };

  // Student Leads (Registered but not paid drop-offs)
  const createStudentLead = async (leadData: Omit<StudentLead, 'id' | 'status' | 'createdAt' | 'lastStep'>) => {
    const newLead: StudentLead = {
      ...leadData,
      id: 'lead_' + Math.random().toString(36).substring(2, 9),
      status: 'unpaid_lead',
      createdAt: new Date().toISOString(),
      lastStep: 'registration_filled'
    };
    const updated = [newLead, ...studentLeads.filter(l => l.phone !== leadData.phone || l.cohortId !== leadData.cohortId)];
    setStudentLeads(updated);
    await saveToDeviceLedger('student_leads_ledger', updated);
    return newLead;
  };

  const updateStudentLead = async (leadId: string, updates: Partial<StudentLead>) => {
    const updated = studentLeads.map(l => l.id === leadId ? { ...l, ...updates } : l);
    setStudentLeads(updated);
    await saveToDeviceLedger('student_leads_ledger', updated);
  };

  // Duplicate Proof Shield & AI Payment Verification
  const verifyAndProcessStudentPayment = async (params: {
    leadId: string;
    screenshotBase64: string;
    utr: string;
    payerName: string;
    payerPhone: string;
    payerEmail?: string;
    schoolName?: string;
    studentClass?: string;
    amount: number;
    feePlanId: string;
    cohortId: string;
    course: string;
  }) => {
    const cohort = cohorts.find(c => c.id === params.cohortId);
    const teacher = teachersList.find(t => cohort?.teacherIds.includes(t.id));
    const targetUpi = teacher?.payout?.upiId || institute.settlementUpi || 'phi.coaching@icici';
    const existingUtrs = payments.map(p => p.reference.toUpperCase());

    // Run AI & Duplicate Verification Engine
    const verification = await runAIPaymentVerification({
      screenshotBase64: params.screenshotBase64,
      expectedAmount: params.amount,
      expectedUpi: targetUpi,
      utr: params.utr,
      payerName: params.payerName,
      existingHashes: usedScreenshotHashes,
      existingUtrs
    });

    if (verification.isDuplicate) {
      addToast({
        type: 'danger',
        title: 'Duplicate Payment Rejected',
        message: verification.duplicateReason || 'This screenshot has already been used for enrollment!'
      });
      return {
        success: false,
        isDuplicate: true,
        error: verification.duplicateReason || 'Duplicate screenshot or UTR detected!'
      };
    }

    if (!verification.isValid) {
      addToast({
        type: 'warning',
        title: 'Payment Verification Issue',
        message: verification.verification.remarks
      });
      return {
        success: false,
        error: verification.verification.remarks
      };
    }

    // Record used hash to prevent reuse ever again
    const updatedHashes = [...usedScreenshotHashes, verification.hash];
    setUsedScreenshotHashes(updatedHashes);
    await saveToDeviceLedger('used_proof_hashes_ledger', updatedHashes);

    // Auto-Enroll Student (Pending Teacher Review)
    const newRollNo = `PHI-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newStudent: Student = {
      id: 'stu_' + Math.random().toString(36).substring(2, 9),
      name: params.payerName.trim(),
      rollNo: newRollNo,
      phone: params.payerPhone.trim(),
      email: params.payerEmail?.trim(),
      schoolName: params.schoolName?.trim(),
      studentClass: params.studentClass?.trim(),
      parentPhone: params.payerPhone.trim(),
      course: params.course,
      cohortId: params.cohortId,
      enrolledAt: new Date().toISOString().split('T')[0],
      feePlanId: params.feePlanId,
      paymentStatus: 'submitted',
      flags: [],
      academicTags: ['Online Registration', 'Pending Teacher Review', 'Batch ' + (cohort?.name || 'Main')],
      admissionStatus: 'pending_review',
      paymentProofUrl: params.screenshotBase64,
      utr: params.utr.trim().toUpperCase()
    };

    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);
    await saveToDeviceLedger('students_ledger', updatedStudents);

    // Record Payment (Submitted for teacher review)
    const newPayment: Payment = {
      id: 'pay_' + Math.random().toString(36).substring(2, 9),
      payerStudentId: newStudent.id,
      payerName: newStudent.name,
      payerPhone: newStudent.phone,
      payeeId: teacher?.id || institute.id,
      payeeName: teacher?.payout?.accountName || teacher?.name || institute.settlementAccountName,
      payeeUpi: targetUpi,
      feePlanId: params.feePlanId,
      course: params.course,
      cohortId: params.cohortId,
      cohortName: cohort?.name,
      amount: params.amount,
      currency: 'INR',
      reference: params.utr.trim().toUpperCase(),
      humanReference: `PHI-${cohort?.code || 'REG'}-${newRollNo.split('-').pop()}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      paymentProofUrl: params.screenshotBase64,
      verificationNote: `AI pre-check passed: ${verification.verification.remarks}. Pending teacher review.`
    };

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    await saveToDeviceLedger('payments_ledger', updatedPayments);

    // Update Lead to payment_submitted
    const updatedLeads = studentLeads.map(l =>
      l.id === params.leadId
        ? {
            ...l,
            status: 'payment_submitted' as const,
            lastStep: 'screenshot_uploaded' as const,
            paymentProofUrl: params.screenshotBase64,
            screenshotHash: verification.hash,
            utr: params.utr.trim().toUpperCase(),
            aiVerification: verification.verification
          }
        : l
    );
    setStudentLeads(updatedLeads);
    await saveToDeviceLedger('student_leads_ledger', updatedLeads);

    addToast({
      type: 'info',
      title: 'Registration Sent for Teacher Review',
      message: `${newStudent.name} registered for ${cohort?.name || 'Batch'}. Queued for teacher review.`
    });

    return {
      success: true,
      student: newStudent,
      remarks: verification.verification.remarks
    };
  };

  const updateInstitute = async (inst: Institute) => {
    setInstitute(inst);
    await saveToDeviceLedger('institute_profile', inst);
    addToast({
      type: 'success',
      title: 'Institute Saved',
      message: 'Updated institute parameters in device ledger.'
    });
  };

  const updateInstituteSettlement = async (settlementUpi: string, settlementAccountName: string) => {
    const updated = {
      ...institute,
      settlementUpi: settlementUpi.trim(),
      settlementAccountName: settlementAccountName.trim()
    };
    setInstitute(updated);
    await saveToDeviceLedger('institute_profile', updated);
    addToast({
      type: 'success',
      title: 'Institute Settlement Updated',
      message: `Institute payment credentials updated to ${settlementUpi.trim()}.`
    });
  };

  const addTeacherInvite = (teacher: Partial<Account>) => {
    const inviteAccount: Account = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      role: teacher.role || 'teacher',
      name: teacher.name || 'Invited Faculty',
      email: teacher.email || 'faculty@phi.edu',
      subject: teacher.subject || 'Physics',
      courses: teacher.courses || [institute.courses[0]?.name || 'JEE'],
      phone: teacher.phone || '+91 90000 00000',
      qualification: teacher.qualification || 'M.Sc.',
      yearsExperience: teacher.yearsExperience || 5,
      instituteId: institute.id,
      createdAt: new Date().toISOString()
    };
    const list = [...teachersList, inviteAccount];
    setTeachersList(list);
    saveToDeviceLedger('teachers_ledger', list);
    addToast({
      type: 'success',
      title: 'Teacher Invite Created',
      message: `Invite provisioned for ${inviteAccount.name} (${inviteAccount.email}).`
    });
  };

  const addCohort = async (cohort: Cohort) => {
    const updated = [...cohorts, cohort];
    setCohorts(updated);
    await saveToDeviceLedger('cohorts_ledger', updated);
    addToast({
      type: 'success',
      title: 'Cohort Created',
      message: `Batch "${cohort.name}" (${cohort.code}) added to institute catalogue.`
    });
  };

  const updateCohort = async (cohort: Cohort) => {
    const updated = cohorts.map(c => c.id === cohort.id ? cohort : c);
    setCohorts(updated);
    await saveToDeviceLedger('cohorts_ledger', updated);
    addToast({
      type: 'info',
      title: 'Cohort Updated',
      message: `Batch ${cohort.name} updated.`
    });
  };

  const addStudent = async (student: Student) => {
    const updated = [...students, student];
    setStudents(updated);
    await saveToDeviceLedger('students_ledger', updated);
    addToast({
      type: 'success',
      title: 'Student Enrolled',
      message: `${student.name} (${student.rollNo}) added to cohort roster.`
    });
  };

  const importStudentsBatch = async (batch: Student[]) => {
    const updated = [...students, ...batch];
    setStudents(updated);
    await saveToDeviceLedger('students_ledger', updated);
    addToast({
      type: 'success',
      title: 'CSV Import Completed',
      message: `Successfully imported ${batch.length} student records into the roster.`
    });
    return batch.length;
  };

  const flagStudent = async (studentId: string, reason: string) => {
    const updated = students.map(s => {
      if (s.id !== studentId) return s;
      const newFlag = {
        id: 'flg_' + Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString().split('T')[0],
        reason,
        teacherName: account?.name || 'Faculty Member'
      };
      return { ...s, flags: [...s.flags, newFlag] };
    });
    setStudents(updated);
    await saveToDeviceLedger('students_ledger', updated);
    addToast({
      type: 'warning',
      title: 'Incident Flagged',
      message: `Record added to student dossier. Visible to institute owner.`
    });
  };

  const updateStudentFeeStatus = async (studentId: string, status: Student['paymentStatus']) => {
    const updated = students.map(s => s.id === studentId ? { ...s, paymentStatus: status } : s);
    setStudents(updated);
    await saveToDeviceLedger('students_ledger', updated);
  };

  const approveStudentAdmission = async (studentId: string, teacherId?: string, teacherName?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const reviewerId = teacherId || account?.id;
    const reviewerName = teacherName || account?.name || 'Faculty';

    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          admissionStatus: 'approved' as const,
          paymentStatus: 'verified' as const,
          reviewedByTeacherId: reviewerId,
          reviewedByTeacherName: reviewerName,
          reviewedAt: new Date().toISOString(),
          academicTags: s.academicTags.filter(t => t !== 'Pending Teacher Review').concat(['Teacher Approved'])
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    await saveToDeviceLedger('students_ledger', updatedStudents);

    const updatedPayments = payments.map(p => {
      if (p.payerStudentId === studentId) {
        return {
          ...p,
          status: 'verified' as const,
          verifiedAt: new Date().toISOString(),
          verificationNote: `Approved by Teacher: ${reviewerName}`
        };
      }
      return p;
    });
    setPayments(updatedPayments);
    await saveToDeviceLedger('payments_ledger', updatedPayments);

    const updatedLeads = studentLeads.map(l => {
      if (l.phone === student.phone || (student.email && l.email === student.email)) {
        return { ...l, status: 'enrolled_verified' as const };
      }
      return l;
    });
    setStudentLeads(updatedLeads);
    await saveToDeviceLedger('student_leads_ledger', updatedLeads);

    addToast({
      type: 'success',
      title: 'Student Admission Approved!',
      message: `${student.name} (${student.rollNo}) approved by ${reviewerName} and enrolled in batch.`
    });
  };

  const rejectStudentAdmission = async (studentId: string, reason: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const reviewerId = account?.id;
    const reviewerName = account?.name || 'Faculty';

    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          admissionStatus: 'rejected' as const,
          paymentStatus: 'rejected' as const,
          rejectionReason: reason,
          reviewedByTeacherId: reviewerId,
          reviewedByTeacherName: reviewerName,
          reviewedAt: new Date().toISOString()
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    await saveToDeviceLedger('students_ledger', updatedStudents);

    addToast({
      type: 'warning',
      title: 'Admission Application Rejected',
      message: `Registration for ${student.name} rejected: ${reason}`
    });
  };

  const checkInSeat = (seatNumber: number, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setSeats(prev => prev.map(seat => {
      if (seat.seatNumber !== seatNumber) return seat;
      const checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        ...seat,
        isOccupied: true,
        currentStudentId: student.id,
        currentStudentName: student.name,
        currentStudentRoll: student.rollNo,
        checkInTime: checkIn,
        history: [
          ...seat.history,
          {
            studentName: student.name,
            studentRoll: student.rollNo,
            checkIn
          }
        ]
      };
    }));
    addToast({
      type: 'info',
      title: 'Lab Check-in',
      message: `${student.name} assigned to Station ${seatNumber}.`
    });
  };

  const checkOutSeat = (seatNumber: number) => {
    setSeats(prev => prev.map(seat => {
      if (seat.seatNumber !== seatNumber) return seat;
      const checkOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const lastHist = seat.history[seat.history.length - 1];
      const updatedHist = lastHist ? [...seat.history.slice(0, -1), { ...lastHist, checkOut }] : seat.history;
      return {
        ...seat,
        isOccupied: false,
        currentStudentId: undefined,
        currentStudentName: undefined,
        currentStudentRoll: undefined,
        checkInTime: undefined,
        history: updatedHist
      };
    }));
    addToast({
      type: 'info',
      title: 'Lab Check-out',
      message: `Station ${seatNumber} released.`
    });
  };

  const addLecture = async (lec: Lecture) => {
    setLectures(prev => [lec, ...prev]);
    addToast({
      type: 'success',
      title: 'Lecture Processed',
      message: `"${lec.title}" added to studio repository.`
    });
  };

  const updateLecture = async (lec: Lecture) => {
    setLectures(prev => prev.map(l => l.id === lec.id ? lec : l));
  };

  const addQuestions = async (qs: QuestionDraft[]) => {
    setQuestions(prev => [...qs, ...prev]);
    addToast({
      type: 'success',
      title: 'Questions Added',
      message: `${qs.length} question candidate(s) loaded into the review queue.`
    });
  };

  const updateQuestion = async (q: QuestionDraft) => {
    setQuestions(prev => prev.map(item => item.id === q.id ? q : item));
  };

  const deleteQuestion = async (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    addToast({
      type: 'info',
      title: 'Question Removed',
      message: 'Question deleted from bank.'
    });
  };

  const approveQuestion = async (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, reviewStatus: 'approved' };
      }
      return q;
    }));
    addToast({
      type: 'success',
      title: 'Question Approved',
      message: 'Question verified and marked ready for test series.'
    });
  };

  const rejectQuestion = async (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, reviewStatus: 'rejected' };
      }
      return q;
    }));
    addToast({
      type: 'warning',
      title: 'Question Rejected',
      message: 'Question excluded from publishing.'
    });
  };

  const addTest = async (test: Test) => {
    setTests(prev => [test, ...prev]);
    addToast({
      type: 'success',
      title: 'Exam Created',
      message: `"${test.title}" (${test.questions.length} questions, ${test.totalMarks} marks) created.`
    });
  };

  const updateTest = async (test: Test) => {
    setTests(prev => prev.map(t => t.id === test.id ? test : t));
  };

  const addSeries = async (series: Series) => {
    setSeriesList(prev => [series, ...prev]);
    addToast({
      type: 'success',
      title: 'Series Created',
      message: `Test Series "${series.name}" created.`
    });
  };

  const updateSeries = async (series: Series) => {
    setSeriesList(prev => prev.map(s => s.id === series.id ? series : s));
  };

  const recordAttempt = async (attempt: Attempt) => {
    setAttempts(prev => [attempt, ...prev]);
    addToast({
      type: 'info',
      title: 'Supervised Session Completed',
      message: `Scored ${attempt.score} marks (${attempt.percent}%). Attempt logged with ${attempt.proctorFlags.length} flag(s).`
    });
  };

  const addScreenTimeRecord = async (rec: ScreenTimeRecord) => {
    setScreenTimeRecords(prev => [rec, ...prev]);
    addToast({
      type: 'info',
      title: 'Screen Time Snapshot Attached',
      message: `Logged ${rec.durationMinutes} min device activity.`
    });
  };

  const addFeePlan = async (plan: FeePlan) => {
    const updated = [plan, ...feePlans];
    setFeePlans(updated);
    await saveToDeviceLedger('fee_plans_ledger', updated);
    addToast({
      type: 'success',
      title: 'Fee Plan Published',
      message: `Fee plan for ${plan.course} (₹${plan.amount.toLocaleString()}) active on ledger.`
    });
  };

  const updateFeePlan = async (plan: FeePlan) => {
    const updated = feePlans.map(p => p.id === plan.id ? plan : p);
    setFeePlans(updated);
    await saveToDeviceLedger('fee_plans_ledger', updated);
  };

  const recordPayment = async (payment: Payment) => {
    // Non-Negotiable Rule 8: UPI reference can be used once. Duplicate rejected across whole ledger!
    const exists = payments.some(p => p.reference.toLowerCase() === payment.reference.toLowerCase());
    if (exists) {
      addToast({
        type: 'danger',
        title: 'Duplicate Reference Rejected',
        message: `UPI Reference ${payment.reference} has already been logged on this ledger.`
      });
      throw new Error(`Duplicate UPI reference ${payment.reference}`);
    }

    // A student can have only one live submitted/verified payment per fee plan
    const activeStudentPayment = payments.find(p =>
      p.payerStudentId === payment.payerStudentId &&
      p.feePlanId === payment.feePlanId &&
      (p.status === 'submitted' || p.status === 'verified')
    );
    if (activeStudentPayment) {
      addToast({
        type: 'danger',
        title: 'Active Payment Exists',
        message: 'This student already has an active payment on this fee plan.'
      });
      throw new Error('Student has an active payment already');
    }

    const updated = [payment, ...payments];
    setPayments(updated);
    await saveToDeviceLedger('payments_ledger', updated);
    await updateStudentFeeStatus(payment.payerStudentId, 'submitted');
    addToast({
      type: 'success',
      title: 'Fee Payment Recorded',
      message: `Reference ${payment.humanReference} submitted for teacher verification.`
    });
  };

  const verifyPaymentAndSign = async (paymentId: string, signatureHex: string, note?: string) => {
    const now = new Date().toISOString();
    let verifiedPayment: Payment | null = null;
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        verifiedPayment = {
          ...p,
          status: 'verified' as const,
          verifiedAt: now,
          receiptSignature: signatureHex,
          receiptSignedAt: now,
          verificationNote: note || p.verificationNote
        };
        return verifiedPayment;
      }
      return p;
    });

    setPayments(updated);
    await saveToDeviceLedger('payments_ledger', updated);
    if (verifiedPayment) {
      await updateStudentFeeStatus((verifiedPayment as Payment).payerStudentId, 'verified');
    }
    addToast({
      type: 'success',
      title: 'Receipt Cryptographically Signed',
      message: 'ECDSA P-256 signature generated and attached to receipt.'
    });
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    let rejectedPayment: Payment | null = null;
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        rejectedPayment = {
          ...p,
          status: 'rejected' as const,
          rejectionReason: reason
        };
        return rejectedPayment;
      }
      return p;
    });

    setPayments(updated);
    await saveToDeviceLedger('payments_ledger', updated);
    if (rejectedPayment) {
      await updateStudentFeeStatus((rejectedPayment as Payment).payerStudentId, 'pending');
    }
    addToast({
      type: 'warning',
      title: 'Payment Rejected',
      message: `Payment rejected with reason: ${reason}`
    });
  };

  const addDoubt = async (doubt: DoubtQuery) => {
    setDoubts(prev => [doubt, ...prev]);
    addToast({
      type: 'info',
      title: 'Doubt Submitted',
      message: 'Doubt query submitted to AI derivation desk.'
    });
  };

  const resolveDoubt = async (doubtId: string, solution: DoubtQuery['solution']) => {
    setDoubts(prev => prev.map(d => d.id === doubtId ? { ...d, solution, status: 'solved' } : d));
    addToast({
      type: 'success',
      title: 'Doubt Solved',
      message: 'Step-by-step derivation generated.'
    });
  };

  const addMentoringSlot = async (slot: MentoringSlot) => {
    setMentoringSlots(prev => [slot, ...prev]);
    addToast({
      type: 'success',
      title: 'Mentoring Slot Added',
      message: `Guidance session for ${slot.cohortName} booked for ${slot.date} at ${slot.time}.`
    });
  };

  const updateMentoringSlotStatus = async (slotId: string, status: MentoringSlot['status']) => {
    setMentoringSlots(prev => prev.map(s => s.id === slotId ? { ...s, status } : s));
  };

  const addMentoringMessage = async (slotId: string, text: string) => {
    const msg = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      senderRole: (account?.role || 'teacher') as 'teacher' | 'student',
      senderName: account?.name || 'Faculty Mentor',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMentoringSlots(prev => prev.map(s => s.id === slotId ? { ...s, messages: [...s.messages, msg] } : s));
  };

  const addLibraryItem = async (item: LibraryItem) => {
    setLibraryItems(prev => [item, ...prev]);
    addToast({
      type: 'success',
      title: 'Module Uploaded',
      message: `Document "${item.title}" published to student reference library.`
    });
  };

  const removeLibraryItem = async (id: string) => {
    setLibraryItems(prev => prev.filter(i => i.id !== id));
    addToast({
      type: 'info',
      title: 'Module Removed',
      message: 'Reference item deleted from library.'
    });
  };

  const completeWarmup = () => {
    if (dailyWarmup) {
      setDailyWarmup({
        ...dailyWarmup,
        completed: true,
        streak: dailyWarmup.streak + 1
      });
      addToast({
        type: 'success',
        title: 'Daily Warm-up Complete!',
        message: `Streak increased to ${dailyWarmup.streak + 1} days.`
      });
    }
  };

  const resetWarmup = () => {
    if (dailyWarmup) {
      setDailyWarmup({
        ...dailyWarmup,
        completed: false
      });
    }
  };

  const addNotice = async (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
    addToast({
      type: 'info',
      title: 'Notice Board Updated',
      message: `Notice "${notice.title}" broadcast to ${notice.audience}.`
    });
  };

  const updateAiSettings = (settings: AISettings) => {
    setAiSettings(settings);
    localStorage.setItem('teachdesk_ai_settings', JSON.stringify(settings));
    addToast({
      type: 'success',
      title: 'AI Settings Updated',
      message: 'Provider configuration saved in browser storage.'
    });
  };

  const effectiveRole: UserRole | null = previewMode === 'student' ? 'student' : (previewMode === 'teacher' ? 'teacher' : (account?.role || null));

  return (
    <TeachDeskContext.Provider
      value={{
        account,
        role: effectiveRole,
        previewMode,
        setPreviewMode,
        unlockedSigningKey,
        activeTab,
        setActiveTab,
        signIn,
        signInAsStudent,
        signOut,
        registerTeacher,
        updateAccountPayout,
        isDark,
        toggleTheme,
        institute,
        updateInstitute,
        teachersList,
        addTeacherInvite,
        cohorts,
        addCohort,
        updateCohort,
        students,
        addStudent,
        importStudentsBatch,
        flagStudent,
        updateStudentFeeStatus,
        approveStudentAdmission,
        rejectStudentAdmission,
        seats,
        checkInSeat,
        checkOutSeat,
        lectures,
        addLecture,
        updateLecture,
        questions,
        addQuestions,
        updateQuestion,
        deleteQuestion,
        approveQuestion,
        rejectQuestion,
        tests,
        addTest,
        updateTest,
        seriesList,
        addSeries,
        updateSeries,
        attempts,
        recordAttempt,
        screenTimeRecords,
        addScreenTimeRecord,
        feePlans,
        addFeePlan,
        updateFeePlan,
        payments,
        recordPayment,
        verifyPaymentAndSign,
        rejectPayment,
        updateInstituteSettlement,
        doubts,
        addDoubt,
        resolveDoubt,
        mentoringSlots,
        addMentoringSlot,
        updateMentoringSlotStatus,
        addMentoringMessage,
        libraryItems,
        addLibraryItem,
        removeLibraryItem,
        dailyWarmup,
        completeWarmup,
        resetWarmup,
        notices,
        addNotice,
        aiSettings,
        updateAiSettings,
        isMasterAdminUnlocked,
        unlockMasterAdmin,
        lockMasterAdmin,
        isMasterAdminModalOpen,
        setIsMasterAdminModalOpen,
        resetToFreshBlankState,
        loadDemoPracticeData,
        enrollStudentDirect,
        teacherRequests,
        requestTeacherAccount,
        approveTeacherRequest,
        rejectTeacherRequest,
        terminateUser,
        reactivateUser,
        personalMessages,
        sendPersonalMessage,
        markPersonalMessageRead,
        appFeatures,
        toggleAppFeature,
        studentLeads,
        createStudentLead,
        updateStudentLead,
        usedScreenshotHashes,
        verifyAndProcessStudentPayment,
        toasts,
        addToast,
        dismissToast,
        isCommandOpen,
        setIsCommandOpen
      }}
    >
      {children}
    </TeachDeskContext.Provider>
  );
};

export const useTeachDeskStore = (): TeachDeskContextType => {
  const context = useContext(TeachDeskContext);
  if (!context) {
    throw new Error('useTeachDeskStore must be used within a TeachDeskProvider');
  }
  return context;
};
