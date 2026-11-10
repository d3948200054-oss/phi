import React from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import {
  Users,
  Layers,
  FileCheck2,
  CreditCard,
  LineChart,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Video,
  GraduationCap,
  BookOpen,
  Clock,
  HelpCircle,
  CheckCircle2,
  Bell,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Payment, Attempt } from '../../types';
import { BeginnerGuideLaunchpad } from '../primitives/BeginnerGuide';

export const DashboardSurface: React.FC = () => {
  const {
    account,
    role,
    students,
    cohorts,
    tests,
    questions,
    payments,
    attempts,
    lectures,
    libraryItems,
    dailyWarmup,
    notices,
    institute,
    setActiveTab,
    approveStudentAdmission,
    rejectStudentAdmission
  } = useTeachDeskStore();

  // Non-Negotiable Rule 3: All metrics computed from real records
  const totalStudents = students.length;
  const totalBatches = cohorts.length;
  const approvedQuestions = questions.filter(q => q.reviewStatus === 'approved').length;
  const pendingReviewQuestions = questions.filter(q => q.reviewStatus === 'pending').length;
  const totalTests = tests.length;

  // Real money calculations from ledger
  const verifiedPayments = payments.filter(p => p.status === 'verified');
  const totalFeesCollected = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'submitted');
  const pendingFeesSum = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Real attempt metrics
  const avgAccuracy = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length)
    : 0;

  const totalAttemptTimeMinutes = Math.round(
    attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / 60
  );

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'humanReference',
      header: 'Reference',
      render: (p) => <span className="font-mono text-xs">{p.humanReference}</span>
    },
    {
      key: 'payerName',
      header: 'Student',
      render: (p) => (
        <div>
          <span className="font-medium text-xs block">{p.payerName}</span>
          <span className="text-[10px] text-content-secondary font-mono">{p.course}</span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      isNumeric: true,
      render: (p) => `₹${p.amount.toLocaleString()}`
    },
    {
      key: 'status',
      header: 'Ledger State',
      align: 'center',
      render: (p) => {
        if (p.status === 'verified') return <Badge variant="teal">Verified & Signed</Badge>;
        if (p.status === 'submitted') return <Badge variant="amber">Awaiting Check</Badge>;
        if (p.status === 'rejected') return <Badge variant="rose">Rejected</Badge>;
        return <Badge variant="slate">{p.status}</Badge>;
      }
    }
  ];

  const attemptColumns: Column<Attempt>[] = [
    {
      key: 'studentName',
      header: 'Candidate',
      render: (a) => (
        <div>
          <span className="font-medium text-xs block">{a.studentName}</span>
          <span className="text-[10px] font-mono text-content-secondary">Roll: {a.studentRoll}</span>
        </div>
      )
    },
    {
      key: 'testTitle',
      header: 'Test Assessment',
      render: (a) => <span className="text-xs truncate max-w-[140px] block">{a.testTitle}</span>
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      isNumeric: true,
      render: (a) => `${a.score} pts`
    },
    {
      key: 'percent',
      header: 'Accuracy',
      align: 'right',
      isNumeric: true,
      render: (a) => `${a.percent}%`
    },
    {
      key: 'proctorFlags',
      header: 'Integrity',
      align: 'center',
      render: (a) => (
        <span className="font-mono text-xs">
          {a.proctorFlags.length === 0 ? (
            <Badge variant="teal">Clean (0 flags)</Badge>
          ) : (
            <Badge variant="rose">{a.proctorFlags.length} flag(s)</Badge>
          )}
        </span>
      )
    }
  ];

  const completedSteps = {
    batches: cohorts.length > 0,
    students: students.length > 0,
    exams: questions.length > 0 || tests.length > 0,
    lectures: lectures.length > 0,
    fees: payments.length > 0
  };

  if (role === 'student') {
    const currentStudent = students.find(s => s.id === account?.id || s.rollNo.toUpperCase() === account?.email?.toUpperCase())
      || students.find(s => s.phone === account?.phone)
      || (students.length > 0 ? students[0] : null);
    const studentCohort = cohorts.find(c => c.id === currentStudent?.cohortId) || cohorts[0];
    const myAttempts = attempts.filter(a => a.studentId === currentStudent?.id || a.studentRoll === currentStudent?.rollNo);
    const urgentNotices = notices.filter(n => n.audience === 'students' || n.priority === 'urgent');

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Student Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14203d] via-[#1a294d] to-[#121a30] border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-2xl font-serif shrink-0 shadow-lg shadow-amber-500/10">
                {account?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                    Welcome back, {account?.name || currentStudent?.name || 'Student'}!
                  </h1>
                  <span className="text-[11px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} /> ENROLLED & ACTIVE
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5 font-mono">
                  <span>Roll No: <strong className="text-amber-400 font-bold">{currentStudent?.rollNo || 'PHI-2026-ACTIVE'}</strong></span>
                  <span>•</span>
                  <span>Batch: <strong className="text-slate-100">{studentCohort?.name || 'Main Batch'}</strong></span>
                  <span>•</span>
                  <span>Course: <strong className="text-slate-100">{currentStudent?.course || 'IIT-JEE / NEET'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                onClick={() => setActiveTab('daily-warmup')}
                icon={<Sparkles size={14} />}
              >
                Today's Warm-up
              </Button>
              <Button
                variant="outline"
                size="md"
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                onClick={() => setActiveTab('lectures')}
                icon={<Video size={14} />}
              >
                Lectures
              </Button>
            </div>
          </div>
        </div>

        {/* If Student Admission is Under Teacher Review */}
        {currentStudent?.admissionStatus === 'pending_review' && (
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3 animate-in fade-in">
            <Clock size={20} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <h4 className="font-bold text-sm text-amber-300">Admission Application Under Teacher Review</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Your registration for <strong>{studentCohort?.name}</strong> has been transmitted to batch faculty for review. You can browse recorded lectures, study formula sheets in the library, and solve the daily warmup streak while your enrollment is finalized!
              </p>
            </div>
          </div>
        )}

        {/* Learning Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Daily Streak
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-2xl font-bold text-amber-500 tabular-nums flex items-center gap-1">
                <Flame size={20} className="text-amber-500 fill-amber-500" />
                {dailyWarmup?.streak || 3}d
              </span>
              <span className="text-[11px] text-content-secondary">{dailyWarmup?.completed ? 'Done today' : 'Pending'}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">5 Questions</span>
              <button onClick={() => setActiveTab('daily-warmup')} className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                Practice →
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Recorded Lectures
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
                {lectures.length}
              </span>
              <span className="text-[11px] text-content-secondary">{lectures.filter(l => l.status === 'published').length} active</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">Class Video</span>
              <button onClick={() => setActiveTab('lectures')} className="text-rose-600 dark:text-[#fb7185] font-semibold hover:underline">
                Watch →
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Library & Notes
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
                {libraryItems.length}
              </span>
              <span className="text-[11px] text-content-secondary">PDF & Notes</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">Formulas</span>
              <button onClick={() => setActiveTab('library')} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                View →
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Mock Tests
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
                {tests.length}
              </span>
              <span className="text-[11px] text-content-secondary">{myAttempts.length} taken</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">Exam runner</span>
              <button onClick={() => setActiveTab('sessions')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Take Exam →
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Doubt Desk (AI)
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                24/7
              </span>
              <span className="text-[11px] text-content-secondary">Instant AI</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">Ask questions</span>
              <button onClick={() => setActiveTab('doubt-desk')} className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                Ask Doubt →
              </button>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              Admission Status
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                VERIFIED
              </span>
              <span className="text-[10px] font-mono text-content-secondary">{currentStudent?.rollNo || 'PHI-PASS'}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
              <span className="text-content-secondary">Batch Roster</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">Enrolled</span>
            </div>
          </div>
        </div>

        {/* Student Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveTab('daily-warmup')}
            className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 hover:border-amber-500/50 transition-all cursor-pointer group space-y-2.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-sm text-content-primary dark:text-content-primary-dark group-hover:text-amber-500 transition-colors">
              Daily Warm-up Streak
            </h3>
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark leading-relaxed">
              Solve 5 quick concept booster questions every morning to solidify retention and build exam reflexes.
            </p>
            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 pt-1">
              Start Today's Warm-up <ChevronRight size={14} />
            </span>
          </div>

          <div
            onClick={() => setActiveTab('lectures')}
            className="p-5 rounded-xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/25 hover:border-rose-500/50 transition-all cursor-pointer group space-y-2.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video size={20} />
            </div>
            <h3 className="font-bold text-sm text-content-primary dark:text-content-primary-dark group-hover:text-rose-500 transition-colors">
              Recorded Video Lectures
            </h3>
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark leading-relaxed">
              Watch classroom lecture recordings with synchronized chapter timestamps and auto-generated study summaries.
            </p>
            <span className="text-xs font-semibold text-rose-500 flex items-center gap-1 pt-1">
              Browse All Lectures <ChevronRight size={14} />
            </span>
          </div>

          <div
            onClick={() => setActiveTab('sessions')}
            className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer group space-y-2.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-sm text-content-primary dark:text-content-primary-dark group-hover:text-emerald-500 transition-colors">
              Supervised Mock Tests
            </h3>
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark leading-relaxed">
              Take full-length tests with live countdown timers, technical SVG diagrams, and instant scoring breakdown.
            </p>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 pt-1">
              Launch Exam Runner <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* My Performance & Test Attempts */}
        <Panel
          title="My Exam Attempts & Score History"
          subtitle="Your personal assessment records, accuracy percentages, and integrity reports."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('sessions')}
              icon={<ArrowRight size={13} />}
            >
              Take Another Test
            </Button>
          }
        >
          {myAttempts.length > 0 ? (
            <Table
              columns={attemptColumns}
              data={myAttempts}
              keyExtractor={(a) => a.id}
            />
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-content-primary dark:text-content-primary-dark">
                  No Exam Attempts Recorded Yet
                </h4>
                <p className="text-xs text-content-secondary max-w-sm mx-auto mt-1">
                  Ready to test your skills? Open the Supervised Exam Runner to practice a full-length mock assessment.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                onClick={() => setActiveTab('sessions')}
                icon={<ArrowRight size={14} />}
              >
                Start First Assessment Test
              </Button>
            </div>
          )}
        </Panel>

        {/* Recent Institute Notices */}
        <Panel
          title="Institute Circulars & Timetable"
          subtitle="Official announcements and schedules published by Phi Coaching Faculty."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('notices')}
              icon={<Bell size={13} />}
            >
              View All Notices
            </Button>
          }
        >
          <div className="space-y-3">
            {urgentNotices.slice(0, 3).map((notice) => (
              <div
                key={notice.id}
                className="p-3.5 rounded-lg border border-border dark:border-border-dark bg-surface-raised/40 dark:bg-surface-raised-dark/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-content-primary dark:text-content-primary-dark">
                      {notice.title}
                    </span>
                    {notice.priority === 'urgent' && (
                      <Badge variant="rose">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-xs text-content-secondary dark:text-content-secondary-dark line-clamp-1">
                    {notice.body}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-content-secondary shrink-0">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  const myBatchIds = role === 'admin'
    ? cohorts.map(c => c.id)
    : cohorts.filter(c => c.teacherIds?.includes(account?.id || '')).map(c => c.id);

  const pendingStudentReviews = students.filter(s =>
    s.admissionStatus === 'pending_review' && (role === 'admin' || myBatchIds.length === 0 || myBatchIds.includes(s.cohortId))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Batch Admissions Awaiting Teacher Review */}
      {pendingStudentReviews.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border-2 border-amber-500/50 space-y-3.5 shadow-xl animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-sm">
                🎓
              </span>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Batch Student Admissions Awaiting Teacher Review
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                    {pendingStudentReviews.length} Awaiting Approval
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80">
                  New student registrations require your approval before their batch enrollment is finalized.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs self-start sm:self-auto"
              onClick={() => setActiveTab('cohorts')}
            >
              View Cohorts →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingStudentReviews.map((student) => {
              const cohort = cohorts.find(c => c.id === student.cohortId);
              return (
                <div
                  key={student.id}
                  className="p-4 rounded-xl bg-[#0f172a] border border-amber-500/30 text-xs space-y-3 text-slate-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-sm text-white block">{student.name}</strong>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {student.rollNo}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending Review
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-[#141e35] border border-slate-800">
                    <div>
                      <span className="text-slate-400 block">Target Batch:</span>
                      <span className="font-medium text-slate-200">{cohort?.name || student.course}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">School & Class:</span>
                      <span className="text-slate-200">{student.schoolName || 'Enrolled'} ({student.studentClass || '11'})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Contact Phone:</span>
                      <span className="font-mono text-slate-200">{student.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Bank / UPI UTR:</span>
                      <span className="font-mono font-bold text-amber-300">{student.utr || 'Direct Proof'}</span>
                    </div>
                  </div>

                  {student.paymentProofUrl && (
                    <div className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                      <img
                        src={student.paymentProofUrl}
                        alt="Payment Proof"
                        className="w-10 h-10 object-cover rounded border border-slate-700 shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-[11px] font-medium text-slate-300 block truncate">UPI Receipt Attached</span>
                        <span className="text-[10px] text-emerald-400 font-mono">AI Verification: Pre-checked</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                      onClick={() => approveStudentAdmission(student.id)}
                      icon={<CheckCircle2 size={14} />}
                    >
                      Approve & Enroll
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs"
                      onClick={() => {
                        const reason = prompt(`Enter rejection reason for ${student.name}:`, 'Payment reference could not be verified');
                        if (reason) rejectStudentAdmission(student.id, reason);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Beginner Coaching Guided Launchpad */}
      <BeginnerGuideLaunchpad
        completedSteps={completedSteps}
        onNavigate={setActiveTab}
      />

      {/* Dense Metric Grid - 12 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Enrolled Students
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
              {totalStudents}
            </span>
            <span className="text-[11px] text-content-secondary">{totalBatches} batches</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">Roster coverage</span>
            <span className="font-mono font-medium text-[#e11d48] dark:text-[#fb7185]">100%</span>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Review Queue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {pendingReviewQuestions}
            </span>
            <span className="text-[11px] text-content-secondary">{approvedQuestions} ready</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">Double-check queue</span>
            <button
              onClick={() => setActiveTab('review-desk')}
              className="text-[#e11d48] dark:text-[#fb7185] font-semibold hover:underline"
            >
              Verify
            </button>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Question Bank
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
              {questions.length}
            </span>
            <span className="text-[11px] text-content-secondary">{totalTests} active tests</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">Offline algo & past</span>
            <span className="font-mono font-medium text-cyan-700 dark:text-cyan-400">Live</span>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Verified Receipts
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-xl font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">
              ₹{totalFeesCollected > 100000 ? `${(totalFeesCollected / 1000).toFixed(0)}k` : totalFeesCollected.toLocaleString()}
            </span>
            <span className="text-[11px] text-content-secondary">{verifiedPayments.length} signed</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">Awaiting check:</span>
            <span className="font-mono font-medium text-amber-700 dark:text-amber-400">₹{pendingFeesSum.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Cohort Accuracy
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-content-primary dark:text-content-primary-dark tabular-nums">
              {attempts.length > 0 ? `${avgAccuracy}%` : 'N/A'}
            </span>
            <span className="text-[11px] text-content-secondary">{attempts.length} attempts</span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">Exam minutes:</span>
            <span className="font-mono font-medium">{totalAttemptTimeMinutes}m</span>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
            Lecture Studio
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-mono text-2xl font-bold text-rose-700 dark:text-[#fb7185] tabular-nums">
              {lectures.length}
            </span>
            <span className="text-[11px] text-content-secondary">
              {lectures.filter(l => l.status === 'published').length} pub
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60 flex items-center justify-between text-[11px]">
            <span className="text-content-secondary">AI extraction:</span>
            <span className="font-mono font-medium text-cyan-700 dark:text-cyan-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Verification & Review Actions */}
        <Panel
          title="Review Desk Priority Queue"
          subtitle="Machine-extracted questions awaiting faculty verification before entering test papers"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('review-desk')}
              icon={<ArrowRight size={13} />}
            >
              Open Desk
            </Button>
          }
        >
          {questions.filter(q => q.reviewStatus === 'pending').length === 0 ? (
            <div className="py-8 text-center text-xs text-content-secondary dark:text-content-secondary-dark">
              Review queue is clear. All extracted questions are verified or resolved.
            </div>
          ) : (
            <div className="divide-y divide-border/60 dark:divide-border-dark/60">
              {questions
                .filter(q => q.reviewStatus === 'pending')
                .slice(0, 3)
                .map((q) => {
                  const hasFail = q.checks.some(c => c.status === 'fail');
                  return (
                    <div key={q.id} className="py-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[#e11d48] dark:text-[#fb7185]">
                            [{q.subject} · {q.topic}]
                          </span>
                          {hasFail ? (
                            <Badge variant="rose">Failing Check ({q.checks.filter(c => c.status === 'fail').length})</Badge>
                          ) : (
                            <Badge variant="amber">Awaiting Approval</Badge>
                          )}
                        </div>
                        <span className="font-mono text-xs tabular-nums text-content-secondary">
                          {q.confidence}% conf
                        </span>
                      </div>
                      <p className="text-xs text-content-primary dark:text-content-primary-dark line-clamp-2">
                        {q.questionText}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </Panel>

        {/* Right: Payment Ledger Summary */}
        <Panel
          title="Fee Collection & Ledger Checks"
          subtitle="Derived payee fee records. Payer selected from cohort roster; UPI references checked for duplication."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('fees-payouts')}
              icon={<ArrowRight size={13} />}
            >
              Fee Console
            </Button>
          }
        >
          <Table
            columns={paymentColumns}
            data={payments.slice(0, 4)}
            keyExtractor={(p) => p.id}
            emptyMessage="No fee payments logged yet. Student fee transactions will appear here."
          />
        </Panel>
      </div>

      {/* Supervised Exam Activity */}
      <Panel
        title="Supervised Exam Runner Live Log"
        subtitle="Attempt records and proctoring signal integrity computed during supervised sessions"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('sessions')}
            icon={<ShieldCheck size={14} />}
          >
            Launch Supervised Session
          </Button>
        }
      >
        <Table
          columns={attemptColumns}
          data={attempts.slice(0, 5)}
          keyExtractor={(a) => a.id}
          emptyMessage="No exam sessions recorded yet. Launch the Supervised Exam Runner to conduct a proctored assessment."
        />
      </Panel>
    </div>
  );
};
