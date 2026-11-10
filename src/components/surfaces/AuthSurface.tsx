import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Button } from '../primitives/Button';
import { Student, StudentLead } from '../../types';
import { generateSigningKeyPair, sealWithPassword } from '../../utils/crypto';
import { generateUpiVectorQrSvg, buildUpiIntentLinks } from '../../utils/qrGenerator';
import {
  Lock,
  UserCheck,
  Shield,
  Sparkles,
  Building,
  GraduationCap,
  Users,
  CheckCircle2,
  Printer,
  Search,
  BookOpen,
  ArrowRight,
  Upload,
  AlertTriangle,
  QrCode,
  FileCheck2,
  RefreshCw,
  PhoneCall,
  Mail,
  School,
  BadgeCheck,
  Copy,
  Check,
  Clock,
  Smartphone,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { MasterAdminGateModal } from '../modals/MasterAdminGateModal';

export const AuthSurface: React.FC = () => {
  const {
    signIn,
    signInAsStudent,
    requestTeacherAccount,
    teacherRequests,
    institute,
    teachersList,
    cohorts,
    feePlans,
    students,
    createStudentLead,
    verifyAndProcessStudentPayment,
    isMasterAdminModalOpen,
    setIsMasterAdminModalOpen
  } = useTeachDeskStore();

  const [mode, setMode] = useState<'signin' | 'student-signin' | 'teacher-request' | 'student-join' | 'student-lookup'>('student-signin');

  // Student Sign In form
  const [studentSignInQuery, setStudentSignInQuery] = useState('');
  const [studentSignInError, setStudentSignInError] = useState<string | null>(null);

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teacher Request Form
  const [tName, setTName] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tSubject, setTSubject] = useState('Physics');
  const [tCourse, setTCourse] = useState(institute.courses[0]?.name || 'IIT-JEE (Main & Advanced)');
  const [tPassword, setTPassword] = useState('');
  const [tQualification, setTQualification] = useState('B.Tech / M.Sc.');
  const [tExperience, setTExperience] = useState('5');
  const [teacherRequestSuccess, setTeacherRequestSuccess] = useState(false);
  const [teacherRequestError, setTeacherRequestError] = useState<string | null>(null);

  // Student Flow: Step 1 (Registration & Batch Selection)
  const [studentStep, setStudentStep] = useState<'form' | 'payment' | 'confirmed'>('form');
  const [selectedCohortId, setSelectedCohortId] = useState<string>(() => cohorts[0]?.id || 'coh_general');
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sSchool, setSSchool] = useState('');
  const [sClass, setSClass] = useState('Class 11');
  const [studentFormError, setStudentFormError] = useState<string | null>(null);

  // Student Flow: Step 2 (Payment Screenshot & Verification)
  const [activeLead, setActiveLead] = useState<StudentLead | null>(null);
  const [utrReference, setUtrReference] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [confirmedStudent, setConfirmedStudent] = useState<Student | null>(null);
  const [aiRemark, setAiRemark] = useState<string | null>(null);

  // Student Lookup form
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<Student | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLogoClick = () => {
    setIsMasterAdminModalOpen(true);
  };

  // Determine current chosen cohort & fee
  const selectedCohort = cohorts.find(c => c.id === selectedCohortId) || cohorts[0];
  const matchingFeePlan = feePlans.find(f => f.cohortId === selectedCohortId) || feePlans[0];
  const batchFeeAmount = matchingFeePlan ? matchingFeePlan.amount : 5000;
  const teacherForBatch = teachersList.find(t => selectedCohort?.teacherIds?.includes(t.id));
  const payeeUpi = teacherForBatch?.payout?.upiId || institute.settlementUpi || 'phi.coaching@icici';
  const payeeName = teacherForBatch?.name || institute.settlementAccountName || 'Phi Coaching Trust';

  // YouPI-PG sovereign payment state & dynamic UPI intents
  const [copiedField, setCopiedField] = useState<'upi' | 'amount' | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (studentStep !== 'payment') {
      setTimeLeft(300);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [studentStep]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, field: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Authentic UPI URI & App Launchers (YouPI-PG Core)
  const upiLinks = useMemo(() => {
    if (!activeLead) return null;
    return buildUpiIntentLinks({
      vpa: payeeUpi,
      name: payeeName,
      amount: activeLead.feeAmount,
      note: `Phi Coaching - ${activeLead.cohortName}`,
      transactionRef: `PHI${activeLead.id.replace(/\D/g, '').slice(0, 6) || Math.floor(100000 + Math.random() * 900000)}`
    });
  }, [activeLead, payeeUpi, payeeName]);

  // Authentic ISO Vector SVG QR (Pure standalone SVG from YouPI-PG)
  const vectorQrSvg = useMemo(() => {
    if (!upiLinks?.rawUri) return '';
    return generateUpiVectorQrSvg(upiLinks.rawUri, 220);
  }, [upiLinks]);

  // 0. Student Sign In
  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentSignInError(null);
    setIsSubmitting(true);

    const q = studentSignInQuery.trim().toUpperCase();
    const cleanDigits = studentSignInQuery.replace(/\D/g, '');

    if (!q) {
      setStudentSignInError('Please enter your Roll Number, registered Mobile Number, or Email.');
      setIsSubmitting(false);
      return;
    }

    try {
      const found = students.find(s =>
        s.rollNo.toUpperCase() === q ||
        (cleanDigits.length >= 7 && s.phone.replace(/\D/g, '').includes(cleanDigits)) ||
        (s.email && s.email.toUpperCase() === q)
      );

      if (!found) {
        setStudentSignInError(
          students.length === 0
            ? 'No registered students found. Please click "Student Admission" to complete admission and get your Roll Number.'
            : 'No student found matching this Roll Number, Phone, or Email. Please check your details or enroll through Student Admission.'
        );
        setIsSubmitting(false);
        return;
      }

      await signInAsStudent(found);
    } catch (err: any) {
      setStudentSignInError(err.message || 'Student authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Faculty Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsSubmitting(true);

    try {
      const target = teachersList.find(t => t.email.toLowerCase() === signInEmail.trim().toLowerCase());
      if (!target) {
        // Check if there is an enrolled student matching this query
        const cleanDigits = signInEmail.replace(/\D/g, '');
        const matchedStudent = students.find(s =>
          (s.email && s.email.toLowerCase() === signInEmail.trim().toLowerCase()) ||
          s.rollNo.toUpperCase() === signInEmail.trim().toUpperCase() ||
          (cleanDigits.length >= 8 && s.phone.replace(/\D/g, '').includes(cleanDigits))
        );
        if (matchedStudent) {
          // Directly sign in as student!
          await signInAsStudent(matchedStudent);
          setIsSubmitting(false);
          return;
        }

        // Check if there is a pending request for this email
        const pendingReq = teacherRequests.find(r => r.email.toLowerCase() === signInEmail.trim().toLowerCase());
        if (pendingReq) {
          if (pendingReq.status === 'pending') {
            setSignInError('Your teacher request is currently pending Admin (Om Shankar) approval. Please wait for admin review in the Admin Access Panel.');
            setIsSubmitting(false);
            return;
          } else if (pendingReq.status === 'rejected') {
            setSignInError(`Your application was not approved by Admin. Reason: ${pendingReq.rejectionReason || 'Access denied.'}`);
            setIsSubmitting(false);
            return;
          }
        }

        setSignInError(
          teachersList.length === 0
            ? 'No teacher accounts registered yet. If you are a student, click "Student Login". If you are faculty, click "Teacher Request".'
            : 'No faculty account found with this email. If you are an enrolled student, please use "Student Login".'
        );
        setIsSubmitting(false);
        return;
      }

      await signIn(target, signInPassword);
    } catch (err: any) {
      setSignInError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Teacher Application Submission (Asks Admin to allow account)
  const handleTeacherRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherRequestError(null);

    if (!tName.trim() || !tEmail.trim() || !tPhone.trim() || !tPassword.trim()) {
      setTeacherRequestError('Please fill in your Name, Phone Number, Email, and Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate ECDSA P-256 signing key pair
      const { publicJwk, privateJwk } = await generateSigningKeyPair();

      // Seal private key with PBKDF2 + AES-GCM
      const sealed = await sealWithPassword(
        { privateJwk, email: tEmail.trim(), createdAt: new Date().toISOString() },
        tPassword,
        tEmail.trim()
      );

      await requestTeacherAccount({
        name: tName.trim(),
        phone: tPhone.trim(),
        email: tEmail.trim(),
        subject: tSubject,
        course: tCourse,
        qualification: tQualification.trim() || 'M.Sc. / B.Tech',
        yearsExperience: parseInt(tExperience, 10) || 5,
        password: tPassword,
        vaultSalt: sealed.saltHex,
        vaultIv: sealed.ivHex,
        vaultCiphertext: sealed.ciphertextHex,
        signingPublicKey: publicJwk
      });

      setTeacherRequestSuccess(true);
    } catch (err: any) {
      setTeacherRequestError(err.message || 'Failed to submit teacher application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Student Registration Step 1: Record Lead & Proceed to Payment
  const handleStudentStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    if (!sName.trim() || !sPhone.trim() || !sEmail.trim() || !sSchool.trim()) {
      setStudentFormError('Please fill in your Name, Phone, Email, School Name, and Class.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cohortName = selectedCohort ? selectedCohort.name : 'Main Coaching Batch';
      const courseName = selectedCohort ? selectedCohort.course : (institute.courses[0]?.name || 'IIT-JEE');

      // Crucial: Create student lead immediately so drop-offs are captured!
      const lead = await createStudentLead({
        name: sName.trim(),
        email: sEmail.trim(),
        phone: sPhone.trim(),
        schoolName: sSchool.trim(),
        studentClass: sClass,
        cohortId: selectedCohortId,
        cohortName: cohortName,
        course: courseName,
        feeAmount: batchFeeAmount
      });

      setActiveLead(lead);
      setStudentStep('payment');
    } catch (err: any) {
      setStudentFormError(err.message || 'Registration step failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Screenshot Upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB. Please upload a compressed screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Student Registration Step 2: AI Verification & Duplicate Prevention
  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!activeLead) {
      setPaymentError('Lead session lost. Please fill registration details again.');
      setStudentStep('form');
      return;
    }

    if (!screenshotData) {
      setPaymentError('Please upload a clear screenshot of your completed UPI payment.');
      return;
    }

    const cleanUtr = utrReference.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 8) {
      setPaymentError('Please enter a valid 12-digit UPI / Bank UTR Transaction Reference number.');
      return;
    }

    try {
      setIsVerifyingPayment(true);
      const result = await verifyAndProcessStudentPayment({
        leadId: activeLead.id,
        screenshotBase64: screenshotData,
        utr: cleanUtr,
        payerName: activeLead.name,
        payerPhone: activeLead.phone,
        payerEmail: activeLead.email,
        schoolName: activeLead.schoolName,
        studentClass: activeLead.studentClass,
        amount: activeLead.feeAmount,
        feePlanId: matchingFeePlan?.id || 'plan_default',
        cohortId: activeLead.cohortId,
        course: activeLead.course
      });

      if (!result.success) {
        setPaymentError(result.error || 'Payment verification failed.');
        return;
      }

      setConfirmedStudent(result.student || null);
      setAiRemark(result.remarks || 'AI Optical Verification Passed.');
      setStudentStep('confirmed');
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification failed.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // 5. Admission Lookup
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    const q = lookupQuery.trim().toUpperCase();
    if (!q) return;

    const found = students.find(s => s.rollNo.toUpperCase() === q || s.phone.includes(q) || (s.email && s.email.toUpperCase() === q));
    if (found) {
      setLookupResult(found);
    } else {
      setLookupError('No enrolled student found matching this Roll Number, Phone, or Email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1424] text-slate-100 flex flex-col justify-between items-center p-3 sm:p-4 font-sans">
      <div className="h-2" />

      {/* Main Authentication Shell */}
      <div className="w-full max-w-xl bg-[#131b2e] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Brand Bar with 5-click easter egg & Direct Master Admin Button */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-[#0d152a] via-[#14203d] to-[#0d152a] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={handleLogoClick}
                className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-[#0d152a] font-serif font-black text-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                title="Phi Coaching Institute · 5 Clicks for Om Shankar Gate"
              >
                φ
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-2xl tracking-tight text-white">
                    phi coaching
                  </h2>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                    PORTAL
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {institute.name} · IIT-JEE & Medical Sciences
                </p>
              </div>
            </div>

            {/* Direct Master Director Button for Om Shankar */}
            <button
              type="button"
              onClick={() => setIsMasterAdminModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
              title="Director Om Shankar Access Panel"
            >
              <Shield size={14} className="text-amber-400" />
              <span className="hidden sm:inline font-mono">Director Login</span>
              <span className="sm:hidden font-mono">Admin</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold overflow-x-auto bg-[#0f1729]">
          <button
            onClick={() => setMode('student-signin')}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'student-signin'
                ? 'border-amber-400 text-amber-300 bg-[#16223b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap size={14} />
            Student Login
          </button>
          <button
            onClick={() => {
              setMode('student-join');
              setStudentStep('form');
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'student-join'
                ? 'border-amber-400 text-amber-300 bg-[#16223b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            New Admission
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'border-amber-400 text-amber-300 bg-[#16223b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock size={14} />
            Faculty Sign In
          </button>
          <button
            onClick={() => setMode('student-lookup')}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'student-lookup'
                ? 'border-amber-400 text-amber-300 bg-[#16223b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search size={14} />
            Verify ID
          </button>
          <button
            onClick={() => setMode('teacher-request')}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'teacher-request'
                ? 'border-amber-400 text-amber-300 bg-[#16223b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck size={14} />
            Teacher Request
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {/* TAB 0: STUDENT SIGN IN */}
          {mode === 'student-signin' && (
            <form onSubmit={handleStudentSignIn} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                <span className="font-semibold block mb-0.5 text-amber-300 flex items-center gap-1.5">
                  <GraduationCap size={15} />
                  Student Portal Access
                </span>
                Enter your Roll Number (e.g. PHI-2026-101), registered Mobile Number, or Email to sign in and enter your courses, lectures, and exams.
              </div>

              <Field
                label="Student Roll No / Phone / Email"
                required
                value={studentSignInQuery}
                onChange={(e) => setStudentSignInQuery(e.target.value)}
                placeholder="e.g. PHI-2026-101 or 98765 43210"
                helper="Enrolled students can log in directly using their Roll Number, Mobile, or Email."
              />

              {studentSignInError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-1">
                    <p>{studentSignInError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('student-join');
                        setStudentStep('form');
                      }}
                      className="text-amber-400 hover:underline font-semibold block"
                    >
                      Click here to Register for Admission →
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm py-2.5 shadow-md"
                disabled={isSubmitting}
                icon={<ArrowRight size={16} />}
              >
                {isSubmitting ? 'Verifying Student ID...' : 'Sign In & Enter Student Portal →'}
              </Button>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
                <span>Not registered yet?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('student-join');
                    setStudentStep('form');
                  }}
                  className="font-medium text-amber-400 hover:underline"
                >
                  Student Admission & Batch Selection →
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Faculty member?</span>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-medium text-slate-300 hover:text-white hover:underline"
                >
                  Faculty Sign In →
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: FACULTY SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200">
                <span className="font-semibold block mb-0.5 text-blue-300 flex items-center gap-1.5">
                  <BadgeCheck size={14} />
                  Approved Faculty Login
                </span>
                Sign in with your approved teacher email and password. Newly submitted teacher requests require Admin approval before first login.
              </div>

              <Field
                label="Registered Faculty Email"
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="teacher@phi.edu"
              />

              <Field
                label="Teacher Password"
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              {signInError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{signInError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                disabled={isSubmitting}
                icon={<Lock size={15} />}
              >
                {isSubmitting ? 'Verifying Account...' : 'Sign In as Teacher'}
              </Button>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setMode('student-signin')}
                  className="font-medium text-amber-400 hover:underline"
                >
                  Are you a student? Student Login →
                </button>
                <button
                  type="button"
                  onClick={() => setMode('teacher-request')}
                  className="font-medium text-slate-400 hover:text-slate-200 hover:underline"
                >
                  Ask Admin for Faculty Account →
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEACHER REQUEST APPLICATION */}
          {mode === 'teacher-request' && (
            <div>
              {teacherRequestSuccess ? (
                <div className="p-6 rounded-2xl bg-[#0e172a] border border-amber-500/40 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                      REQUEST QUEUED IN ADMIN PANEL
                    </span>
                    <h3 className="font-serif font-bold text-xl text-white mt-2">
                      Application Sent to Admin (Om Shankar)
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto">
                      Your faculty request for <strong className="text-amber-300">{tSubject}</strong> has been transmitted to Om Shankar's Admin Access Panel for verification.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141e35] border border-slate-800 text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teacher:</span>
                      <span className="text-slate-200 font-semibold">{tName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-200">{tEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-slate-200">{tPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subject:</span>
                      <span className="text-amber-400 font-bold">{tSubject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-amber-300">Pending Admin Approval</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <Button
                      variant="primary"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                      onClick={() => {
                        setSignInEmail(tEmail);
                        setMode('signin');
                      }}
                    >
                      Go to Sign In
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                      onClick={() => {
                        setTeacherRequestSuccess(false);
                        setTName('');
                        setTEmail('');
                        setTPhone('');
                        setTPassword('');
                      }}
                    >
                      Submit Another Request
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTeacherRequestSubmit} className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                    <span className="font-semibold block mb-0.5 text-amber-300 flex items-center gap-1.5">
                      <Shield size={14} />
                      Teacher Account Request
                    </span>
                    Fill out your faculty credentials. Your application will be sent directly to Admin (Om Shankar) in the Master Admin Access Panel.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Teacher Full Name"
                      required
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      placeholder="e.g. Prof. Alok Sharma"
                    />

                    <Field
                      label="Phone Number"
                      required
                      value={tPhone}
                      onChange={(e) => setTPhone(e.target.value)}
                      placeholder="+91 98000 12345"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Email ID"
                      type="email"
                      required
                      value={tEmail}
                      onChange={(e) => setTEmail(e.target.value)}
                      placeholder="alok@phi.edu"
                    />

                    <Select
                      label="Subject"
                      value={tSubject}
                      onChange={(e) => setTSubject(e.target.value)}
                      options={[
                        { value: 'Physics', label: 'Physics' },
                        { value: 'Mathematics', label: 'Mathematics' },
                        { value: 'Chemistry', label: 'Chemistry' },
                        { value: 'Biology', label: 'Biology' },
                        { value: 'STEM Foundation', label: 'STEM Foundation' }
                      ]}
                    />
                  </div>

                  <Field
                    label="Account Password"
                    type="password"
                    required
                    value={tPassword}
                    onChange={(e) => setTPassword(e.target.value)}
                    placeholder="••••••••••••"
                    helper="Your password to log in once Om Shankar approves your account."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Highest Qualification"
                      value={tQualification}
                      onChange={(e) => setTQualification(e.target.value)}
                      placeholder="M.Sc. / B.Tech / Ph.D."
                    />

                    <Field
                      label="Years Experience"
                      value={tExperience}
                      onChange={(e) => setTExperience(e.target.value)}
                      placeholder="5"
                    />
                  </div>

                  {teacherRequestError && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                      <span>{teacherRequestError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    disabled={isSubmitting}
                    icon={<UserCheck size={16} />}
                  >
                    {isSubmitting ? 'Submitting to Admin...' : 'Request Admin to Allow Teacher Account'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: STUDENT FLOW (CHOOSE BATCH -> REGISTER LEAD -> PAY FEE & SCREENSHOT VERIFICATION) */}
          {mode === 'student-join' && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-5 px-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${studentStep === 'form' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${studentStep === 'form' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'}`}>
                    1
                  </span>
                  Choose Batch & Details
                </div>
                <div className="h-0.5 w-8 bg-slate-700" />
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${studentStep === 'payment' ? 'text-amber-400' : studentStep === 'confirmed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${studentStep === 'payment' ? 'bg-amber-500 text-slate-950' : studentStep === 'confirmed' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                    2
                  </span>
                  Pay Fee & AI Verify
                </div>
                <div className="h-0.5 w-8 bg-slate-700" />
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${studentStep === 'confirmed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${studentStep === 'confirmed' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                    3
                  </span>
                  Admission Slip
                </div>
              </div>

              {/* STEP 1: CHOOSE BATCH & REGISTER LEAD */}
              {studentStep === 'form' && (
                <form onSubmit={handleStudentStep1Submit} className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                    <span className="font-semibold block mb-0.5 text-indigo-300">
                      Step 1: Choose Batch & Fill Student Profile
                    </span>
                    Select your target academic batch and provide student details. Your registration record will be queued for the batch.
                  </div>

                  {/* Batch Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Choose Batch / Course
                    </label>
                    <select
                      value={selectedCohortId}
                      onChange={(e) => setSelectedCohortId(e.target.value)}
                      className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {cohorts.length > 0 ? (
                        cohorts.map(c => {
                          const t = teachersList.find(tea => c.teacherIds.includes(tea.id));
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} — {c.subject} ({t ? t.name : 'Faculty Assigned'})
                            </option>
                          );
                        })
                      ) : (
                        <option value="coh_general">JEE Advanced & NEET Premier Batch Alpha</option>
                      )}
                    </select>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141f38] border border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Batch Fee:</span>
                      <strong className="text-emerald-400 text-base font-mono">
                        ₹{batchFeeAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Faculty Beneficiary:</span>
                      <span className="text-slate-200 font-medium">{payeeName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Student Full Name"
                      required
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      placeholder="e.g. Aryan Sharma"
                    />

                    <Field
                      label="Student Email ID"
                      type="email"
                      required
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
                      placeholder="aryan@gmail.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Phone Number"
                      required
                      value={sPhone}
                      onChange={(e) => setSPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />

                    <Field
                      label="School / College Name"
                      required
                      value={sSchool}
                      onChange={(e) => setSSchool(e.target.value)}
                      placeholder="e.g. Delhi Public School"
                    />
                  </div>

                  <Select
                    label="Current Class / Target"
                    value={sClass}
                    onChange={(e) => setSClass(e.target.value)}
                    options={[
                      { value: 'Class 11', label: 'Class 11th (2-Year Target JEE/NEET)' },
                      { value: 'Class 12', label: 'Class 12th (1-Year Board + Competitive)' },
                      { value: 'Dropper / Target', label: 'Dropper / Repeater Intensive Batch' },
                      { value: 'Class 9 Foundation', label: 'Class 9th STEM Foundation' },
                      { value: 'Class 10 Foundation', label: 'Class 10th NTSE / Olympiad' }
                    ]}
                  />

                  {studentFormError && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                      <span>{studentFormError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    disabled={isSubmitting}
                    icon={<ArrowRight size={16} />}
                  >
                    Proceed to Batch Fee Payment →
                  </Button>
                </form>
              )}

              {/* STEP 2: PAY BATCH FEE & SCREENSHOT VERIFICATION */}
              {studentStep === 'payment' && activeLead && (
                <form onSubmit={handleVerifyPayment} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200">
                    <span className="font-semibold block mb-0.5 text-amber-300">
                      Step 2: Pay Batch Fee & Upload Payment Screenshot
                    </span>
                    Pay via any UPI app (Google Pay, PhonePe, Paytm, BHIM) to the faculty UPI below, then upload the receipt screenshot.
                  </div>

                  {/* Sovereign Peer-to-Peer UPI Payment Card (YouPI-PG Engine) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-amber-500/30 space-y-4 shadow-xl">
                    {/* Top Bar with Batch Info & Countdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                          YouPI Direct Settlement · Zero Gateway Fee
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {activeLead.cohortName}
                        </h4>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold w-fit ${
                        timeLeft < 60 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        <Clock size={13} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                        <span>Session: {formatCountdown(timeLeft)}</span>
                      </div>
                    </div>

                    {/* QR Code & Direct VPA Section */}
                    <div className="flex flex-col md:flex-row items-center gap-5 py-1">
                      {/* Authentic ISO/IEC 18004 Vector SVG QR */}
                      <div className="flex flex-col items-center">
                        <div className="w-48 h-48 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center shrink-0 border-2 border-amber-500/40">
                          <div
                            className="w-full h-full flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: vectorQrSvg }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 font-mono">
                          Scan with any UPI App
                        </span>
                      </div>

                      {/* Payment Beneficiary & Quick Copy Controls */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="p-3 rounded-xl bg-[#141e35] border border-slate-700/80 space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-slate-400 font-medium">Payable Amount:</span>
                            <div className="text-2xl font-bold font-mono text-emerald-400">
                              ₹{activeLead.feeAmount.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                            <span className="text-slate-400">Beneficiary:</span>
                            <span className="font-semibold text-slate-200">{payeeName}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Payee UPI VPA:</span>
                            <code className="text-amber-300 font-mono font-bold">{payeeUpi}</code>
                          </div>
                        </div>

                        {/* Copy Buttons */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleCopy(payeeUpi, 'upi')}
                            className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {copiedField === 'upi' ? (
                              <>
                                <Check size={13} className="text-emerald-400" />
                                <span className="text-emerald-400">UPI Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy UPI ID</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(activeLead.feeAmount.toString(), 'amount')}
                            className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {copiedField === 'amount' ? (
                              <>
                                <Check size={13} className="text-emerald-400" />
                                <span className="text-emerald-400">₹{activeLead.feeAmount} Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} className="text-slate-400" />
                                <span>Copy Amount</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 1-Tap Mobile UPI Intent App Launchers */}
                    {upiLinks && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-medium text-slate-400 block mb-2 flex items-center gap-1.5">
                          <Smartphone size={13} className="text-amber-400" />
                          Tap to pay directly via installed UPI app:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <a
                            href={upiLinks.gpayUri}
                            className="px-2.5 py-2 rounded-lg bg-[#14213d] hover:bg-[#1a2c52] border border-blue-500/30 text-blue-200 text-xs font-semibold text-center transition-colors block"
                          >
                            Google Pay
                          </a>
                          <a
                            href={upiLinks.phonepeUri}
                            className="px-2.5 py-2 rounded-lg bg-[#24133b] hover:bg-[#301a4f] border border-purple-500/30 text-purple-200 text-xs font-semibold text-center transition-colors block"
                          >
                            PhonePe
                          </a>
                          <a
                            href={upiLinks.paytmUri}
                            className="px-2.5 py-2 rounded-lg bg-[#0e2538] hover:bg-[#133550] border border-sky-500/30 text-sky-200 text-xs font-semibold text-center transition-colors block"
                          >
                            Paytm
                          </a>
                          <a
                            href={upiLinks.credUri}
                            className="px-2.5 py-2 rounded-lg bg-[#271d18] hover:bg-[#382a22] border border-amber-500/30 text-amber-200 text-xs font-semibold text-center transition-colors block"
                          >
                            CRED
                          </a>
                          <a
                            href={upiLinks.rawUri}
                            className="col-span-2 sm:col-span-1 px-2.5 py-2 rounded-lg bg-[#1a2538] hover:bg-[#23324d] border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center transition-colors block"
                          >
                            Any UPI
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Screenshot upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Upload Payment Screenshot (Required)</span>
                      <span className="text-[10px] text-amber-400 font-mono">Duplicate-Shield Active</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#141e35] relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {screenshotData ? (
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={screenshotData}
                            alt="Screenshot preview"
                            className="w-14 h-14 object-cover rounded-lg border border-emerald-500/50"
                          />
                          <div className="text-left">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={14} /> Screenshot Uploaded
                            </span>
                            <span className="text-[11px] text-slate-400 block">Click to change image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload size={22} className="mx-auto text-amber-400" />
                          <span className="text-xs font-medium text-slate-200 block">
                            Tap or drag UPI Payment Screenshot
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            PNG, JPG or JPEG from PhonePe, GPay, Paytm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 12-Digit UTR */}
                  <Field
                    label="Bank / UPI 12-Digit Reference (UTR Number)"
                    required
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value.toUpperCase())}
                    placeholder="e.g. 324510984512"
                    helper="Located on your payment confirmation screen."
                  />

                  {paymentError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <strong className="block font-semibold text-rose-300">Verification Alert:</strong>
                        <span>{paymentError}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-700 text-slate-300"
                      onClick={() => setStudentStep('form')}
                      disabled={isVerifyingPayment}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                      disabled={isVerifyingPayment || !screenshotData || utrReference.length < 8}
                      icon={<Sparkles size={16} />}
                    >
                      {isVerifyingPayment ? 'AI Algorithm Verifying...' : '⚡ Verify Payment & Confirm Admission'}
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 3: ADMISSION CONFIRMATION SLIP */}
              {studentStep === 'confirmed' && confirmedStudent && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-5 border border-emerald-500/40 rounded-2xl bg-emerald-950/20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded font-bold border border-amber-500/30">
                        REGISTRATION SUBMITTED · PENDING TEACHER REVIEW
                      </span>
                      <h3 className="font-serif font-bold text-xl text-white mt-1.5">
                        Sent to Batch Teacher for Review!
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                        Your admission details and payment reference have been transmitted to batch faculty <strong className="text-amber-300">({payeeName})</strong> for review and enrollment approval.
                      </p>
                      {aiRemark && (
                        <p className="text-xs text-emerald-300 font-mono mt-1">
                          ✓ AI Optical Scan: {aiRemark}
                        </p>
                      )}
                    </div>

                    {/* Official Admission Card */}
                    <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-700 text-left space-y-2.5 text-xs text-slate-200">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="font-bold text-sm text-amber-400 font-serif">PHI COACHING REGISTRATION SLIP</span>
                        <span className="font-mono text-[11px] font-bold text-amber-400">STATUS: PENDING TEACHER REVIEW</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Student:</span>
                          <strong className="text-white block text-sm">{confirmedStudent.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Roll Number:</span>
                          <strong className="font-mono text-amber-300 block text-sm font-bold">
                            {confirmedStudent.rollNo}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Course Stream:</span>
                          <span className="font-medium text-slate-200">{confirmedStudent.course}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">School & Class:</span>
                          <span className="text-slate-200">{confirmedStudent.schoolName || 'Enrolled'} ({confirmedStudent.studentClass || '11'})</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Button to enter student portal */}
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 text-sm py-3 cursor-pointer"
                        onClick={() => signInAsStudent(confirmedStudent)}
                        icon={<ArrowRight size={18} className="stroke-[2.5]" />}
                      >
                        🚀 Enter App / Go to Student Dashboard
                      </Button>
                    </div>

                    <div className="flex gap-2.5 justify-center pt-1">
                      <Button
                        variant="outline"
                        size="md"
                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => window.print()}
                        icon={<Printer size={15} />}
                      >
                        Print Admission Slip
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => {
                          setStudentStep('form');
                          setSName('');
                          setSEmail('');
                          setSPhone('');
                          setSSchool('');
                          setScreenshotData(null);
                          setUtrReference('');
                          setActiveLead(null);
                        }}
                      >
                        Register Another
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFY ADMISSION / LOOKUP */}
          {mode === 'student-lookup' && (
            <div className="space-y-4">
              <form onSubmit={handleLookup} className="space-y-3">
                <Field
                  label="Search by Roll Number, Phone, or Email"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. PHI-2026-101 or 98765..."
                  helper="Enter the student roll number, contact phone, or email."
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  icon={<Search size={15} />}
                >
                  Verify Admission Status
                </Button>
              </form>

              {lookupError && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                  {lookupError}
                </div>
              )}

              {lookupResult && (
                <div className="p-4 rounded-xl bg-[#0f172a] border border-emerald-500/40 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-white text-sm">{lookupResult.name}</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">{lookupResult.rollNo}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Course:</span>
                      <p className="font-medium text-slate-200">{lookupResult.course}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Payment Status:</span>
                      <p className="font-semibold uppercase text-emerald-400">{lookupResult.paymentStatus}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Enrolled Date:</span>
                      <p className="font-mono text-slate-200">{lookupResult.enrolledAt}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <p className="font-mono text-slate-200">{lookupResult.phone}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 shadow-md"
                      onClick={() => signInAsStudent(lookupResult)}
                      icon={<ArrowRight size={15} />}
                    >
                      🚀 Enter App as {lookupResult.name} ({lookupResult.rollNo}) →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Discreet Director Gate */}
        <div className="px-6 py-3.5 bg-[#0b1120] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Phi Coaching System · Director Om Shankar</span>
          <div className="flex items-center gap-2">
            <span>© 2026 Phi Coaching</span>
            <button
              type="button"
              onClick={() => setIsMasterAdminModalOpen(true)}
              className="text-slate-500 hover:text-amber-400 transition-colors p-1"
              title="Open Master Security Terminal"
            >
              <Lock size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Master Admin Security Gate Modal (Om Shankar: omshankar/Omshankar + 27102008) */}
      <MasterAdminGateModal
        isOpen={isMasterAdminModalOpen}
        onClose={() => setIsMasterAdminModalOpen(false)}
        onSuccess={() => setIsMasterAdminModalOpen(false)}
      />

      <div className="h-2" />
    </div>
  );
};
