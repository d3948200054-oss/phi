import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Video,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { Button } from './Button';
import { TabId } from '../../types';

interface BeginnerGuideLaunchpadProps {
  completedSteps: {
    batches: boolean;
    students: boolean;
    exams: boolean;
    lectures: boolean;
    fees: boolean;
  };
  onNavigate: (tab: TabId) => void;
  onOpenBatchModal?: () => void;
  onOpenStudentModal?: () => void;
}

export const BeginnerGuideLaunchpad: React.FC<BeginnerGuideLaunchpadProps> = ({
  completedSteps,
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      id: 'batches',
      title: '1. Create Your Coaching Batches',
      desc: 'Set up batches (e.g. JEE Elite 2026, Morning Physics) so students can enroll and attend organized classes.',
      actionLabel: 'Create Batch',
      tab: 'cohorts' as TabId,
      done: completedSteps.batches,
      icon: <Users size={18} className="text-blue-500" />
    },
    {
      id: 'students',
      title: '2. Enroll Students into Your Batches',
      desc: 'Students can self-register using your coaching invite code (PHI-2026), or you can enroll them directly with their parent contacts.',
      actionLabel: 'Enroll Students',
      tab: 'students-reports' as TabId,
      done: completedSteps.students,
      icon: <GraduationCap size={18} className="text-emerald-500" />
    },
    {
      id: 'exams',
      title: '3. Build Question Bank & Exams',
      desc: 'Add curriculum questions or generate full test series with instant marking, negative scoring, and answer keys.',
      actionLabel: 'Build Test',
      tab: 'exam-builder' as TabId,
      done: completedSteps.exams,
      icon: <FileSpreadsheet size={18} className="text-purple-500" />
    },
    {
      id: 'lectures',
      title: '4. Upload Lectures & Notes',
      desc: 'Provide recorded lectures, topic chapters, and upload PDF formula sheets to the coaching library.',
      actionLabel: 'Lecture Studio',
      tab: 'lectures' as TabId,
      done: completedSteps.lectures,
      icon: <Video size={18} className="text-rose-500" />
    },
    {
      id: 'fees',
      title: '5. Set Up Tuition Fees & Receipts',
      desc: 'Define monthly or course fees for batches. Issue tamper-evident, digitally signed fee receipts to parents.',
      actionLabel: 'Manage Fees',
      tab: 'fees-payouts' as TabId,
      done: completedSteps.fees,
      icon: <CreditCard size={18} className="text-amber-500" />
    }
  ];

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-surface-raised-dark/60 border border-border dark:border-border-dark rounded-xl p-5 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-border-dark/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-content-primary dark:text-content-primary-dark">
                Beginner's Coaching Launchpad
              </h3>
              <span className="text-[10px] font-mono uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded">
                Getting Started
              </span>
            </div>
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
              Welcome to Phi Coaching! Follow these guided steps to set up your coaching institute from scratch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-mono font-semibold text-content-primary dark:text-content-primary-dark">
              {completedCount} of {steps.length} Steps
            </span>
            <div className="w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse guide' : 'Expand guide'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Steps List */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                step.done
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-white dark:bg-surface-dark border-border/80 dark:border-border-dark hover:border-amber-400 dark:hover:border-amber-500/50 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <span className="font-semibold text-xs text-content-primary dark:text-content-primary-dark">
                      {step.title}
                    </span>
                  </div>
                  {step.done ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-content-secondary dark:text-content-secondary-dark">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-content-secondary dark:text-content-secondary-dark line-clamp-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/50 dark:border-border-dark/50 flex items-center justify-between">
                <span className="text-[10px] text-content-secondary font-mono">
                  {step.done ? 'Configured' : 'Step action'}
                </span>
                <Button
                  variant={step.done ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => onNavigate(step.tab)}
                  icon={<ArrowRight size={11} />}
                >
                  {step.actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface SurfaceBeginnerGuideProps {
  title: string;
  subtitle: string;
  steps: string[];
  tip?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  icon?: React.ReactNode;
}

export const SurfaceBeginnerGuide: React.FC<SurfaceBeginnerGuideProps> = ({
  title,
  subtitle,
  steps,
  tip,
  primaryActionLabel,
  onPrimaryAction,
  icon
}) => {
  return (
    <div className="border border-dashed border-amber-300 dark:border-amber-600/40 rounded-xl p-6 sm:p-8 bg-amber-50/20 dark:bg-amber-950/10 text-content-primary dark:text-content-primary-dark max-w-3xl mx-auto my-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-amber-200/50 dark:border-amber-800/30">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          {icon || <HelpCircle size={24} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-lg text-content-primary dark:text-content-primary-dark">
              {title}
            </h4>
            <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
              Beginner Guide
            </span>
          </div>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Step by step directions */}
      <div className="my-5">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-content-secondary dark:text-content-secondary-dark font-mono mb-2.5">
          How To Get Started (Step-by-Step):
        </h5>
        <div className="space-y-2">
          {steps.map((st, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-content-primary dark:text-content-primary-dark">
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{st}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip box */}
      {tip && (
        <div className="p-3 rounded-lg bg-white/80 dark:bg-surface-dark border border-amber-200/60 dark:border-amber-800/30 text-xs flex items-start gap-2.5 mb-5">
          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-content-secondary dark:text-content-secondary-dark text-[11px] leading-relaxed">
            <strong className="text-content-primary dark:text-content-primary-dark font-medium">Coaching Tip: </strong>
            {tip}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      {primaryActionLabel && onPrimaryAction && (
        <div className="flex items-center justify-end">
          <Button variant="primary" size="md" onClick={onPrimaryAction} icon={<ArrowRight size={14} />}>
            {primaryActionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
