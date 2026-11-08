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
  UserRole
} from '../types';
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

  // Institute Data (Shared ledger)
  const [institute, setInstitute] = useState<Institute>(SEED_INSTITUTE);
  const [teachersList, setTeachersList] = useState<Account[]>(SEED_ACCOUNTS);
  const [cohorts, setCohorts] = useState<Cohort[]>(SEED_COHORTS);
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [feePlans, setFeePlans] = useState<FeePlan[]>(SEED_FEE_PLANS);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Content & Sessions (Working / Local ledger)
  const [lectures, setLectures] = useState<Lecture[]>(SEED_LECTURES);
  const [questions, setQuestions] = useState<QuestionDraft[]>(createInitialSeedQuestions());
  const [tests, setTests] = useState<Test[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [screenTimeRecords, setScreenTimeRecords] = useState<ScreenTimeRecord[]>([]);
  const [doubts, setDoubts] = useState<DoubtQuery[]>([]);
  const [mentoringSlots, setMentoringSlots] = useState<MentoringSlot[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(SEED_LIBRARY);
  const [notices, setNotices] = useState<Notice[]>(SEED_NOTICES);

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
        if (session.unlockedSigningPrivateJwk) {
          setUnlockedSigningKey(session.unlockedSigningPrivateJwk);
        }
      } else {
        // Default to admin owner if no session yet, for immediate exploration
        setAccount(SEED_ACCOUNTS[0]);
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

  const signOut = () => {
    clearSession();
    setAccount(null);
    setUnlockedSigningKey(null);
    setActiveTabState('dashboard');
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Session token and unsealed keys cleared from browser.'
    });
  };

  const registerTeacher = async (newAcc: Account, _password: string, signingKey?: JsonWebKey) => {
    const updatedTeachers = [...teachersList, newAcc];
    setTeachersList(updatedTeachers);
    await saveToDeviceLedger('teachers_ledger', updatedTeachers);
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

  const role = account?.role || null;

  return (
    <TeachDeskContext.Provider
      value={{
        account,
        role,
        unlockedSigningKey,
        activeTab,
        setActiveTab,
        signIn,
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
