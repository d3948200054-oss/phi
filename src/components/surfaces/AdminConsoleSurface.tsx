import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { RestrictedPanel } from '../primitives/RestrictedPanel';
import {
  Account,
  Payment,
  Student,
  TeacherRequest,
  StudentLead,
  AppFeatures,
  Lecture,
  Test,
  Series,
  Attempt
} from '../../types';
import {
  Shield,
  KeyRound,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building,
  RotateCcw,
  Sparkles,
  Lock,
  Terminal,
  Database,
  UserCheck,
  UserX,
  Mail,
  Send,
  Sliders,
  Bell,
  Eye,
  EyeOff,
  UserPlus,
  PhoneCall,
  MessageSquare,
  Clock,
  Layers,
  Check,
  XCircle,
  FileCheck2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Video,
  FileSpreadsheet,
  Trophy,
  ExternalLink,
  MessageCircle,
  Search,
  CheckSquare
} from 'lucide-react';
import {
  getSecurityAuditLogs,
  getFailedAttemptsCount,
  updateAdminCredentials,
  resetAdminCredentialsToDefault,
  getStoredAdminCredentials,
  DIRECTOR_PROFILE
} from '../../utils/adminAuth';

export const AdminConsoleSurface: React.FC = () => {
  const {
    role,
    account,
    institute,
    teachersList,
    students,
    cohorts,
    payments,
    lectures,
    tests,
    seriesList,
    attempts,
    dailyWarmup,
    teacherRequests,
    approveTeacherRequest,
    rejectTeacherRequest,
    terminateUser,
    reactivateUser,
    personalMessages,
    sendPersonalMessage,
    appFeatures,
    toggleAppFeature,
    studentLeads,
    notices,
    addNotice,
    isMasterAdminUnlocked,
    lockMasterAdmin,
    setPreviewMode,
    setActiveTab
  } = useTeachDeskStore();

  // Strict check: Must have admin role AND master admin unlocked!
  if (role !== 'admin' || !isMasterAdminUnlocked) {
    return <RestrictedPanel requiredRole="admin" surfaceName="Owner Admin Console" />;
  }

  const [activeSubTab, setActiveSubTab] = useState<
    'requests' | 'users' | 'audit' | 'ledger' | 'leads' | 'messages' | 'features' | 'notices' | 'security'
  >('requests');

  // Audit view sub-filter
  const [auditFilter, setAuditFilter] = useState<'videos' | 'tests' | 'tasks'>('videos');

  // Search in users
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'teachers' | 'students'>('all');

  // Inspection modal state for viewing full user details
  const [inspectedUser, setInspectedUser] = useState<{
    type: 'teacher' | 'student';
    data: Account | Student;
  } | null>(null);

  // Personal message modal state
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgRecipientId, setMsgRecipientId] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgPriority, setMsgPriority] = useState<'normal' | 'urgent'>('normal');

  // Change Password state
  const [currPassword, setCurrPassword] = useState('');
  const [currPin, setCurrPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);

  // Notice state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'all_teachers' | 'students' | 'cohort'>('all_teachers');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('normal');

  // Selected Proof for inspection
  const [selectedProofPayment, setSelectedProofPayment] = useState<Payment | null>(null);

  // Summary Metrics
  const totalUsers = teachersList.length + students.length;
  const activeTeachers = teachersList.filter(t => t.status !== 'terminated' && t.status !== 'pending').length;
  const pendingRequestsCount = teacherRequests.filter(r => r.status === 'pending').length;
  const unpaidLeadsCount = studentLeads.filter(l => l.status === 'unpaid_lead').length;
  const verifiedRevenue = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  // Handle Send Personal Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgRecipientId || !msgSubject.trim() || !msgBody.trim()) return;

    const teacher = teachersList.find(t => t.id === msgRecipientId);
    const student = students.find(s => s.id === msgRecipientId);

    const recipientName = teacher ? teacher.name : (student ? student.name : 'User');
    const recipientRole: 'teacher' | 'student' = teacher ? 'teacher' : 'student';

    await sendPersonalMessage({
      recipientId: msgRecipientId,
      recipientName,
      recipientRole,
      subject: msgSubject.trim(),
      message: msgBody.trim(),
      priority: msgPriority
    });

    setIsMsgModalOpen(false);
    setMsgRecipientId('');
    setMsgSubject('');
    setMsgBody('');
  };

  // Open Message for specific user
  const openMessageForUser = (userId: string) => {
    setMsgRecipientId(userId);
    const teacher = teachersList.find(t => t.id === userId);
    const student = students.find(s => s.id === userId);
    const name = teacher ? teacher.name : (student ? student.name : '');
    setMsgSubject(`Directive for ${name}`);
    setIsMsgModalOpen(true);
  };

  // Launch App Preview Mode
  const launchPreview = (mode: 'student' | 'teacher') => {
    setPreviewMode(mode);
    setActiveTab('dashboard');
  };

  // Handle Update Admin Credentials
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMessage(null);
    setIsUpdatingCreds(true);

    try {
      const res = await updateAdminCredentials(currPassword, currPin, newPassword, newPin);
      if (res.success) {
        setCredMessage({
          type: 'success',
          text: 'Master Admin password and PIN updated successfully!'
        });
        setCurrPassword('');
        setCurrPin('');
        setNewPassword('');
        setNewPin('');
      } else {
        setCredMessage({
          type: 'error',
          text: res.error || 'Failed to update credentials. Please check current password and PIN.'
        });
      }
    } catch (err: any) {
      setCredMessage({ type: 'error', text: err.message || 'Error updating credentials.' });
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  // Handle Broadcast Notice Submit
  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;

    await addNotice({
      id: 'not_' + Math.random().toString(36).substring(2, 9),
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      audience: noticeAudience,
      priority: noticePriority,
      createdBy: account?.id || 'admin_om',
      createdByName: 'Omshankar (Master Director)',
      createdAt: new Date().toISOString()
    });

    setNoticeTitle('');
    setNoticeBody('');
  };

  const auditLogs = getSecurityAuditLogs();
  const failedAttempts = getFailedAttemptsCount();
  const currentCreds = getStoredAdminCredentials();

  // Features list configuration
  const featureList: Array<{
    key: keyof AppFeatures;
    label: string;
    desc: string;
    category: string;
  }> = [
    { key: 'aiQuestionGenerator', label: 'AI Question Generator', desc: 'Auto-generation of IIT-JEE & NEET questions with diagrams', category: 'Academic' },
    { key: 'lectureStudio', label: 'Lecture Studio & Video', desc: 'Video recording, auto-transcription and chapter splitting', category: 'Academic' },
    { key: 'examBuilder', label: 'Exam Builder Desk', desc: 'Publishing timed tests and question assembly', category: 'Supervision' },
    { key: 'testSeries', label: 'Test Series Module', desc: 'Multi-part test packages and series bundles', category: 'Supervision' },
    { key: 'proctoringEngine', label: 'Live Proctoring Lab', desc: 'Webcam eye gaze and face-tracking supervision engine', category: 'Supervision' },
    { key: 'screenTime', label: 'Device Screen-Time Monitor', desc: 'Screen activity and reels/distraction tracking', category: 'Supervision' },
    { key: 'doubtDesk', label: 'AI Doubt Resolution Desk', desc: 'Instant step-by-step doubt solver for students', category: 'Operations' },
    { key: 'dailyWarmup', label: 'Daily Warm-up System', desc: '5-question daily streak for students and teachers', category: 'Academic' },
    { key: 'libraryNotes', label: 'Digital Library & Notes', desc: 'Curriculum modules, formula sheets, and PDF storage', category: 'Operations' },
    { key: 'mentoringSlots', label: '1-on-1 Mentoring Desk', desc: 'Appointment booking and personal guidance slots', category: 'Operations' },
    { key: 'studentRegistrationPortal', label: 'Student Self-Admission Portal', desc: 'Online batch selection and fee payment for prospective students', category: 'Portal' },
    { key: 'onlineFeePayment', label: 'AI Payment Proof Verification', desc: 'UPI screenshot verification with duplicate prevention shield', category: 'Portal' },
  ];

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-10">
      {/* Top High-Security Master Banner with Founder Profile & Live Previews */}
      <div className="bg-gradient-to-r from-[#0d152a] via-[#141e38] to-[#0d152a] border border-amber-500/40 rounded-2xl p-5 text-white shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-serif font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            👑
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                MASTER DIRECTOR GATEWAY
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                OWNER SESSION ACTIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight mt-1">
              Phi Coaching Administration & Control Center
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1 font-mono">
              <span className="text-amber-300 font-bold">{DIRECTOR_PROFILE.name}</span>
              <span>•</span>
              <a href={`mailto:${DIRECTOR_PROFILE.email}`} className="text-slate-300 hover:text-amber-300 transition-colors">
                {DIRECTOR_PROFILE.email}
              </a>
              <span>•</span>
              <span className="text-slate-400">AMU: {DIRECTOR_PROFILE.collegeId}</span>
              <span>•</span>
              <a
                href={`https://wa.me/91${DIRECTOR_PROFILE.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-400 hover:underline flex items-center gap-1 font-semibold"
              >
                WhatsApp: {DIRECTOR_PROFILE.whatsapp}
              </a>
              <span>•</span>
              <a
                href={DIRECTOR_PROFILE.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                LinkedIn <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Live Preview Mode Switchers & Lock Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => launchPreview('student')}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-mono text-xs font-bold"
            icon={<GraduationCap size={15} className="text-emerald-400" />}
          >
            Student Preview Mode
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => launchPreview('teacher')}
            className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 font-mono text-xs font-bold"
            icon={<UserCheck size={15} className="text-blue-400" />}
          >
            Teacher Preview Mode
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={lockMasterAdmin}
            className="border-red-500/40 text-red-300 hover:bg-red-500/10 font-mono text-xs"
            icon={<Lock size={14} />}
          >
            Lock Console
          </Button>
        </div>
      </div>

      {/* Real-time Executive Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#11192e] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total App Users</span>
          <strong className="text-xl font-bold font-mono text-white block mt-0.5">
            {totalUsers}
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">{activeTeachers} Teachers · {students.length} Students</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11192e] border border-amber-500/30">
          <span className="text-[11px] text-amber-300 block">Pending Teacher Requests</span>
          <strong className="text-xl font-bold font-mono text-amber-400 block mt-0.5">
            {pendingRequestsCount}
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">Awaiting Omshankar's Approval</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11192e] border border-rose-500/30">
          <span className="text-[11px] text-rose-300 block">Unpaid Student Leads</span>
          <strong className="text-xl font-bold font-mono text-rose-400 block mt-0.5">
            {unpaidLeadsCount}
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">Registered, not paid</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11192e] border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 block">Fee Revenue (Verified)</span>
          <strong className="text-xl font-bold font-mono text-emerald-400 block mt-0.5">
            ₹{verifiedRevenue.toLocaleString('en-IN')}
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">{payments.filter(p => p.status === 'verified').length} verified receipts</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11192e] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Content & Lectures</span>
          <strong className="text-xl font-bold font-mono text-blue-400 block mt-0.5">
            {lectures.length} Videos · {tests.length} Tests
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">{attempts.length} Exam attempts completed</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#11192e] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Security & Fraud Shield</span>
          <strong className="text-xl font-bold font-mono text-emerald-400 block mt-0.5">
            ACTIVE
          </strong>
          <span className="text-[10px] text-slate-400 font-mono">Anti-Duplicate Hash Active</span>
        </div>
      </div>

      {/* Admin Panel Subtabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-semibold gap-1 bg-[#0d1424] p-1 rounded-xl">
        {[
          { id: 'requests', label: `Teacher Requests (${pendingRequestsCount})`, icon: UserCheck },
          { id: 'users', label: `All Users Details (${totalUsers})`, icon: Users },
          { id: 'audit', label: 'Creator & Task Audit', icon: CheckSquare },
          { id: 'ledger', label: `Payment Details (${payments.length})`, icon: CreditCard },
          { id: 'leads', label: `Unpaid Student Leads (${unpaidLeadsCount})`, icon: PhoneCall },
          { id: 'messages', label: `Personal Directives (${personalMessages.length})`, icon: Mail },
          { id: 'features', label: 'Feature Controls (ON/OFF)', icon: Sliders },
          { id: 'notices', label: 'Broadcast Notices', icon: Bell },
          { id: 'security', label: 'Password & PIN Settings', icon: KeyRound }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2.5 px-3.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: TEACHER ACCESS REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Teacher Account Applications</h3>
              <p className="text-xs text-slate-400">
                Applicants requesting faculty access from Omshankar. Approving an account creates their batch and grants sign-in permission.
              </p>
            </div>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 font-bold">
              {pendingRequestsCount} Pending
            </span>
          </div>

          {teacherRequests.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0f172a] space-y-2">
              <UserCheck size={36} className="mx-auto text-slate-600" />
              <h4 className="text-sm font-semibold text-slate-300">No Teacher Requests Currently</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When prospective faculty submit their credentials from the "Teacher Request" tab, they will appear here for your review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-[#11192e] border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : req.status === 'approved'
                        ? 'bg-[#0f172a] border-emerald-500/30'
                        : 'bg-[#0f172a] border-rose-500/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{req.name}</h4>
                          <Badge variant={req.status === 'approved' ? 'teal' : req.status === 'pending' ? 'amber' : 'rose'}>
                            {req.status.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-amber-300 font-medium block mt-0.5">
                          {req.subject} Specialization
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono bg-[#0b1120] p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email:</span>
                        <span className="text-slate-200">{req.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Phone:</span>
                        <span className="text-slate-200">{req.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Qualification:</span>
                        <span className="text-slate-200">{req.qualification}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Experience:</span>
                        <span className="text-slate-200">{req.yearsExperience} Years</span>
                      </div>
                    </div>

                    {isPending ? (
                      <div className="flex gap-2.5 mt-4 pt-2 border-t border-slate-800">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                          onClick={() => approveTeacherRequest(req.id)}
                          icon={<CheckCircle2 size={15} />}
                        >
                          Approve Faculty Account
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                          onClick={() => rejectTeacherRequest(req.id, 'Declined by Administrator')}
                          icon={<XCircle size={15} />}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Decision: {req.status.toUpperCase()}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMessageForUser(req.id)}
                          className="text-xs font-mono text-amber-300"
                        >
                          Message
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ALL USERS DETAILS & TERMINATION CONTROL */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users size={16} className="text-amber-400" />
                User Profiles & Management Directory
              </h3>
              <p className="text-xs text-slate-400">
                Click "View Details" on any user to inspect their full profile, test attempts, uploaded videos, and fee status.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-[#162035] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-[#162035] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">All Roles</option>
                <option value="teachers">Teachers Only</option>
                <option value="students">Students Only</option>
              </select>
            </div>
          </div>

          {/* Unified Users List */}
          <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
            {/* Teachers */}
            {(userRoleFilter === 'all' || userRoleFilter === 'teachers') &&
              teachersList
                .filter(t => !userSearchQuery || t.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || t.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || t.subject.toLowerCase().includes(userSearchQuery.toLowerCase()))
                .map(t => {
                  const isTerminated = t.status === 'terminated';
                  const videoCount = lectures.filter(l => l.teacherId === t.id).length;
                  const testCount = tests.filter(test => test.creatorId === t.id).length;
                  return (
                    <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center shrink-0">
                          👨‍🏫
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm">{t.name}</strong>
                            <Badge variant="indigo">TEACHER</Badge>
                            <Badge variant={isTerminated ? 'rose' : 'teal'}>
                              {isTerminated ? 'TERMINATED' : 'ACTIVE'}
                            </Badge>
                            <span className="text-xs text-amber-300 font-semibold">{t.subject}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                            <span>{t.email}</span>
                            <span>•</span>
                            <span>{t.phone}</span>
                            <span>•</span>
                            <span className="text-emerald-400">{videoCount} Videos Uploaded</span>
                            <span>•</span>
                            <span className="text-blue-400">{testCount} Tests Published</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectedUser({ type: 'teacher', data: t })}
                          className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono"
                          icon={<Eye size={13} />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMessageForUser(t.id)}
                          className="border-slate-700 text-slate-300 text-xs"
                          icon={<Mail size={13} />}
                        >
                          Message
                        </Button>
                        {isTerminated ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => reactivateUser(t.id, 'teacher')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Terminate access for ${t.name}?`)) terminateUser(t.id, 'teacher');
                            }}
                            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs"
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

            {/* Students */}
            {(userRoleFilter === 'all' || userRoleFilter === 'students') &&
              students
                .filter(s => !userSearchQuery || s.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || s.rollNo.toLowerCase().includes(userSearchQuery.toLowerCase()) || s.phone.includes(userSearchQuery))
                .map(s => {
                  const isTerminated = !!s.isTerminated;
                  const attemptCount = attempts.filter(a => a.studentId === s.id).length;
                  return (
                    <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                          🎓
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm">{s.name}</strong>
                            <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {s.rollNo}
                            </span>
                            <Badge variant="teal">STUDENT</Badge>
                            <Badge variant={isTerminated ? 'rose' : 'teal'}>
                              {isTerminated ? 'SUSPENDED' : 'ENROLLED'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                            <span>{s.course}</span>
                            <span>•</span>
                            <span>Phone: {s.phone}</span>
                            {s.schoolName && <span>• {s.schoolName} ({s.studentClass || '11'})</span>}
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{attemptCount} Exams Completed</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectedUser({ type: 'student', data: s })}
                          className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono"
                          icon={<Eye size={13} />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMessageForUser(s.id)}
                          className="border-slate-700 text-slate-300 text-xs"
                          icon={<Mail size={13} />}
                        >
                          Message
                        </Button>
                        {isTerminated ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => reactivateUser(s.id, 'student')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Suspend admission for ${s.name}?`)) terminateUser(s.id, 'student');
                            }}
                            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs"
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: CREATOR & TASK AUDIT ("WHO UPLOADED WHICH VIDEO, CREATED TEST SERIES, COMPLETED TASKS") */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckSquare size={16} className="text-amber-400" />
                Creator & Task Governance Audit Hub
              </h3>
              <p className="text-xs text-slate-400">
                Track exactly which user uploaded which video lecture, who created test series, and which students completed their tasks.
              </p>
            </div>

            {/* Audit Sub-filter */}
            <div className="flex items-center gap-1 bg-[#0b1120] p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setAuditFilter('videos')}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  auditFilter === 'videos'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video size={13} />
                Video Uploads ({lectures.length})
              </button>
              <button
                type="button"
                onClick={() => setAuditFilter('tests')}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  auditFilter === 'tests'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet size={13} />
                Tests & Series ({tests.length})
              </button>
              <button
                type="button"
                onClick={() => setAuditFilter('tasks')}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  auditFilter === 'tasks'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy size={13} />
                Student Task Completions ({attempts.length})
              </button>
            </div>
          </div>

          {/* AUDIT 1: VIDEO LECTURES */}
          {auditFilter === 'videos' && (
            <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
              {lectures.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center">No video lectures uploaded yet.</p>
              ) : (
                lectures.map(lec => (
                  <div key={lec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-amber-400" />
                        <strong className="text-white text-sm">{lec.title}</strong>
                        <Badge variant="indigo">{lec.subject}</Badge>
                        <Badge variant={lec.status === 'published' ? 'teal' : 'slate'}>
                          {lec.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-amber-300 font-semibold">
                          Uploaded by: {lec.teacherName}
                        </span>
                        <span>•</span>
                        <span>Duration: {Math.floor(lec.durationSeconds / 60)}m {lec.durationSeconds % 60}s</span>
                        <span>•</span>
                        <span>Chapters: {lec.chapters?.length || 0}</span>
                        <span>•</span>
                        <span>Published: {lec.publishedAt ? new Date(lec.publishedAt).toLocaleDateString() : 'Draft'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMessageForUser(lec.teacherId)}
                        className="border-slate-700 text-slate-300 text-xs"
                      >
                        Contact Faculty
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AUDIT 2: TESTS & SERIES CREATION */}
          {auditFilter === 'tests' && (
            <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
              {tests.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center">No test series created yet.</p>
              ) : (
                tests.map(test => (
                  <div key={test.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={16} className="text-amber-400" />
                        <strong className="text-white text-sm">{test.title}</strong>
                        <Badge variant="teal">{test.subject}</Badge>
                        <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {test.questions.length} Questions
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-amber-300 font-semibold">
                          Created by: {test.creatorName}
                        </span>
                        <span>•</span>
                        <span>Stream: {test.course}</span>
                        <span>•</span>
                        <span>Duration: {test.durationMinutes} Mins</span>
                        <span>•</span>
                        <span>Max Marks: {test.totalMarks}</span>
                        <span>•</span>
                        <span>Status: {test.isLive ? 'Live Exam' : 'Draft'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMessageForUser(test.creatorId)}
                        className="border-slate-700 text-slate-300 text-xs"
                      >
                        Message Creator
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* AUDIT 3: STUDENT TASK & ATTEMPT COMPLETIONS */}
          {auditFilter === 'tasks' && (
            <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
              {attempts.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center">No test completions recorded yet.</p>
              ) : (
                attempts.map(att => (
                  <div key={att.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-amber-400" />
                        <strong className="text-white text-sm">{att.testTitle}</strong>
                        <Badge variant="teal">{att.percent}% Score</Badge>
                        <span className="font-mono text-xs text-emerald-400 font-bold">
                          {att.score} Marks
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-amber-300 font-bold">
                          Student: {att.studentName} ({att.studentRoll})
                        </span>
                        <span>•</span>
                        <span>Time Spent: {Math.floor(att.timeSpentSeconds / 60)} mins</span>
                        <span>•</span>
                        <span>Completed: {new Date(att.completedAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>Proctor Flags: {att.proctorFlags?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMessageForUser(att.studentId)}
                        className="border-slate-700 text-slate-300 text-xs"
                      >
                        Message Student
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: PAYMENT DETAILS & AUDIT LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard size={16} className="text-amber-400" />
                Payment Details & Duplicate Proof Shield
              </h3>
              <p className="text-xs text-slate-400">
                Inspect all submitted payment screenshots, verified UTRs, and cryptographic duplicate prevention records.
              </p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold">
              {payments.length} Payments Recorded
            </span>
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No payment transactions recorded in ledger yet.</p>
          ) : (
            <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
              {payments.map(payment => (
                <div key={payment.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {payment.paymentProofUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProofPayment(payment)}
                        className="w-12 h-12 rounded-lg overflow-hidden border border-amber-500/40 shrink-0 hover:scale-105 transition-transform"
                        title="Click to view full screenshot proof"
                      >
                        <img
                          src={payment.paymentProofUrl}
                          alt="Proof"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <CreditCard size={18} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{payment.payerName}</strong>
                        <Badge variant={payment.status === 'verified' ? 'teal' : 'amber'}>
                          {payment.status.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-emerald-400 font-bold text-xs">
                          ₹{payment.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>UTR: <strong>{payment.reference}</strong></span>
                        <span>•</span>
                        <span>Payee: {payment.payeeName} ({payment.payeeUpi})</span>
                        <span>•</span>
                        <span>Batch: {payment.cohortName || 'Main'}</span>
                        <span>•</span>
                        <span>Date: {new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                      {payment.verificationNote && (
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          ✓ {payment.verificationNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {payment.paymentProofUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProofPayment(payment)}
                        className="border-slate-700 text-slate-300 text-xs font-mono"
                        icon={<Eye size={13} />}
                      >
                        Inspect Screenshot
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: UNPAID STUDENT LEADS (DROP-OFF REGISTRATIONS) */}
      {activeSubTab === 'leads' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-rose-500/30 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-400" />
                Unpaid Registration Leads (Student Drop-offs)
              </h3>
              <p className="text-xs text-slate-400">
                These students filled the registration form (Name, Email, Phone, School, Class, Batch) but left without completing payment. Call or WhatsApp them to convert!
              </p>
            </div>
            <span className="text-xs font-mono bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 font-bold">
              {unpaidLeadsCount} Drop-offs
            </span>
          </div>

          {studentLeads.filter(l => l.status === 'unpaid_lead').length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0f172a] space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <h4 className="text-sm font-semibold text-slate-300">No Unpaid Drop-offs!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Every student who selected a batch has completed their fee verification.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
              {studentLeads
                .filter(l => l.status === 'unpaid_lead')
                .map(lead => (
                  <div key={lead.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <strong className="text-white text-base">{lead.name}</strong>
                        <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-500/30">
                          REGISTERED · UNPAID
                        </span>
                        <span className="text-xs text-amber-300 font-semibold">{lead.studentClass}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400 pt-1">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Target Batch:</span>
                          <span className="text-slate-200">{lead.cohortName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">School:</span>
                          <span className="text-slate-200">{lead.schoolName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Contact:</span>
                          <span className="text-slate-200 font-bold">{lead.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Batch Fee:</span>
                          <span className="text-emerald-400 font-bold">₹{lead.feeAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      <a
                        href={`tel:${lead.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <PhoneCall size={13} />
                        Call Student
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(lead.name)},%20we%20noticed%20you%20registered%20for%20Phi%20Coaching%20${encodeURIComponent(lead.cohortName)}.%20Please%20complete%20your%20batch%20fee%20to%20confirm%20admission.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: DIRECT PERSONAL DIRECTIVES */}
      {activeSubTab === 'messages' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Mail size={16} className="text-amber-400" />
                Personal Messages from Omshankar
              </h3>
              <p className="text-xs text-slate-400">
                Directives sent by Omshankar to teachers or students. Delivered with high-priority notifications.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsMsgModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              icon={<Send size={14} />}
            >
              Compose Directive
            </Button>
          </div>

          {personalMessages.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0f172a] space-y-2">
              <Mail size={36} className="mx-auto text-slate-600" />
              <h4 className="text-sm font-semibold text-slate-300">No Sent Directives Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use "Compose Directive" to send a private message to any teacher or student.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {personalMessages.map(msg => (
                <div key={msg.id} className="p-4 rounded-xl bg-[#11192e] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{msg.subject}</strong>
                      <Badge variant={msg.priority === 'urgent' ? 'rose' : 'indigo'}>
                        {msg.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">To: {msg.recipientName} ({msg.recipientRole})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(msg.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 7: FEATURE CONTROL CENTER (ON / OFF ANY FEATURE) */}
      {activeSubTab === 'features' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11192e] border border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders size={16} className="text-amber-400" />
              Feature Control Center (Turn ON or OFF Any Feature)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Toggle any module across the entire Phi Coaching platform. Changes take effect instantly for all teachers and students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {featureList.map(feat => {
              const isEnabled = appFeatures[feat.key];
              return (
                <div
                  key={feat.key}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isEnabled
                      ? 'bg-[#11192e] border-emerald-500/40 shadow-sm'
                      : 'bg-[#0f172a] border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        {feat.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{feat.label}</h4>
                    <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      State: {isEnabled ? 'Active' : 'Off'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleAppFeature(feat.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 8: BROADCAST NOTICES */}
      {activeSubTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-2xl bg-[#11192e] border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              Send Broadcast Notice
            </h3>
            <p className="text-xs text-slate-400">
              Publish an official coaching notice to teachers, students, or cohorts.
            </p>

            <form onSubmit={handleSendNotice} className="space-y-3">
              <Field
                label="Notice Title"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. JEE Mock Test Schedule"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={noticeAudience}
                  onChange={(e) => setNoticeAudience(e.target.value as any)}
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="all_teachers">All Teachers</option>
                  <option value="students">All Enrolled Students</option>
                  <option value="cohort">Specific Cohort</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as any)}
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notice Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Enter notice text from Omshankar..."
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                icon={<Send size={14} />}
              >
                Broadcast Notice
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-white text-sm">Active Published Notices ({notices.length})</h4>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No active notices broadcast yet.</p>
            ) : (
              notices.map(n => (
                <div key={n.id} className="p-4 rounded-xl bg-[#11192e] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{n.title}</strong>
                      <Badge variant={n.priority === 'urgent' ? 'rose' : 'indigo'}>
                        {n.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">Audience: {n.audience}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 9: SECURITY & CHANGE MASTER PASSWORD / PIN */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password Form */}
          <div className="p-5 rounded-2xl bg-[#11192e] border border-amber-500/30 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" />
                Change Master Admin Password & PIN
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Owner credentials control full access to this panel.
              </p>
              <div className="p-3 rounded-lg bg-[#0b1120] border border-slate-800 mt-2 text-xs font-mono text-slate-300 space-y-1">
                <div>Status: <span className="text-emerald-400">{currentCreds.isCustom ? 'Custom Password Configured' : 'Founder Master Credentials Active'}</span></div>
                <div className="text-[11px] text-slate-500">Dual-factor protected with maximum attempt lockout shield.</div>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Current Password"
                  type="password"
                  required
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="Enter current password"
                />

                <Field
                  label="Current PIN"
                  type="password"
                  required
                  value={currPin}
                  onChange={(e) => setCurrPin(e.target.value)}
                  placeholder="Enter current PIN"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New PIN (4 to 8 digits)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      required
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 4-8 digit numeric PIN"
                      className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {credMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    credMessage.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {credMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{credMessage.text}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  disabled={isUpdatingCreds || !currPassword || !newPassword || !newPin}
                >
                  {isUpdatingCreds ? 'Updating Security...' : 'Save New Master Password & PIN'}
                </Button>
                {currentCreds.isCustom && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:text-slate-200"
                    onClick={() => {
                      if (confirm('Reset credentials back to factory default?')) {
                        resetAdminCredentialsToDefault();
                        setCredMessage({ type: 'success', text: 'Reset back to default credentials' });
                      }
                    }}
                  >
                    Reset Defaults
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Security Audit Logs */}
          <div className="p-5 rounded-2xl bg-[#11192e] border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Terminal size={16} className="text-amber-400" />
              Cryptographic Security Audit Log
            </h3>
            <p className="text-xs text-slate-400">
              Audit trail of authentication attempts, lockouts, and credentials updates.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No security events logged.</p>
              ) : (
                auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-[#0b1120] border border-slate-800 text-xs font-mono flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            log.level === 'danger'
                              ? 'text-rose-400'
                              : log.level === 'warning'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {log.event}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS DOSSIER MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full bg-[#11192e] border border-amber-500/40 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{inspectedUser.type === 'teacher' ? '👨‍🏫' : '🎓'}</span>
                <div>
                  <h4 className="font-bold text-white text-base">{inspectedUser.data.name}</h4>
                  <span className="text-xs text-amber-300 font-mono uppercase">
                    {inspectedUser.type === 'teacher' ? 'Faculty Dossier' : 'Student Dossier'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#0b1120] p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Contact Phone:</span>
                <span className="text-slate-200 font-bold">{inspectedUser.data.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Email ID:</span>
                <span className="text-slate-200">{inspectedUser.data.email || 'N/A'}</span>
              </div>
              {inspectedUser.type === 'student' && (
                <>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Roll Number:</span>
                    <span className="text-amber-300 font-bold">{(inspectedUser.data as Student).rollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Enrolled Batch / Course:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Student).course}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">School / College:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Student).schoolName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Class / Target:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Student).studentClass || 'Class 11'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fee Status:</span>
                    <span className="text-emerald-400 font-bold uppercase">{(inspectedUser.data as Student).paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Admission Date:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Student).enrolledAt}</span>
                  </div>
                </>
              )}

              {inspectedUser.type === 'teacher' && (
                <>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Subject Area:</span>
                    <span className="text-amber-300 font-bold">{(inspectedUser.data as Account).subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Qualification:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Account).qualification}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Years Experience:</span>
                    <span className="text-slate-200">{(inspectedUser.data as Account).yearsExperience} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Payout UPI:</span>
                    <span className="text-emerald-400">{(inspectedUser.data as Account).payout?.upiId || 'Not set'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Related Activity in Coaching */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-white">Recent Activity & Submissions</h5>
              {inspectedUser.type === 'student' ? (
                <div className="p-3 rounded-lg bg-[#0b1120] border border-slate-800 text-xs font-mono space-y-1">
                  <div>Exams Attempted: <strong>{attempts.filter(a => a.studentId === inspectedUser.data.id).length}</strong></div>
                  <div>Fee Transactions: <strong>{payments.filter(p => p.payerStudentId === inspectedUser.data.id).length}</strong></div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#0b1120] border border-slate-800 text-xs font-mono space-y-1">
                  <div>Lectures Uploaded: <strong>{lectures.filter(l => l.teacherId === inspectedUser.data.id).length}</strong></div>
                  <div>Tests Published: <strong>{tests.filter(t => t.creatorId === inspectedUser.data.id).length}</strong></div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-700 text-slate-300"
                onClick={() => setInspectedUser(null)}
              >
                Close Dossier
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                onClick={() => {
                  const uid = inspectedUser.data.id;
                  setInspectedUser(null);
                  openMessageForUser(uid);
                }}
              >
                Send Directive Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {selectedProofPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-[#11192e] border border-amber-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-base">Payment Screenshot Proof</h4>
              <button
                type="button"
                onClick={() => setSelectedProofPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-800">
              <img
                src={selectedProofPayment.paymentProofUrl}
                alt="Proof"
                className="w-full object-contain"
              />
            </div>
            <div className="text-xs font-mono text-slate-300 space-y-1 bg-[#0b1120] p-3 rounded-xl border border-slate-800">
              <div>Student: <strong>{selectedProofPayment.payerName}</strong></div>
              <div>Amount: <strong className="text-emerald-400">₹{selectedProofPayment.amount}</strong></div>
              <div>UTR: <strong className="text-amber-300">{selectedProofPayment.reference}</strong></div>
              <div>Status: <span className="uppercase text-emerald-400">{selectedProofPayment.status}</span></div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-700 text-slate-300"
              onClick={() => setSelectedProofPayment(null)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}

      {/* Compose Personal Message Modal */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#11192e] border border-amber-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Mail size={16} className="text-amber-400" />
                Send Directive Message (from Omshankar)
              </h4>
              <button
                type="button"
                onClick={() => setIsMsgModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient User
                </label>
                <select
                  required
                  value={msgRecipientId}
                  onChange={(e) => setMsgRecipientId(e.target.value)}
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Teacher or Student...</option>
                  <optgroup label="Teachers">
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject} Faculty)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Students">
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll: {s.rollNo})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <Field
                label="Message Subject"
                required
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                placeholder="e.g. Schedule Directive or Alert"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Type your personal directive from Omshankar..."
                  className="w-full bg-[#162035] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                  onClick={() => setIsMsgModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  icon={<Send size={14} />}
                >
                  Send Directive
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
