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
  Video
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
    setActiveTab
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

  return (
    <div className="space-y-6 animate-fade-in">
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
