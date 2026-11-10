import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  LineChart,
  Video,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Clock,
  BookOpen,
  ScreenShare,
  Eye,
  Shield,
  CreditCard,
  Sparkles,
  UserCheck,
  Bell,
  X,
  LogOut,
} from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { TABS, canAccess } from '../../utils/accessControl';
import { TabId } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    role,
    institute,
    account,
    signOut,
    isMasterAdminUnlocked,
    appFeatures
  } = useTeachDeskStore();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const getTabIcon = (id: TabId) => {
    const props = { size: 18, className: 'shrink-0 stroke-[1.75]' };
    switch (id) {
      case 'dashboard': return <LayoutDashboard {...props} />;
      case 'cohorts': return <Users {...props} />;
      case 'students-reports': return <GraduationCap {...props} />;
      case 'analytics': return <LineChart {...props} />;
      case 'lectures': return <Video {...props} />;
      case 'review-desk': return <FileCheck2 {...props} />;
      case 'exam-builder': return <FileSpreadsheet {...props} />;
      case 'test-series': return <Layers {...props} />;
      case 'question-bank': return <HelpCircle {...props} />;
      case 'daily-warmup': return <Sparkles {...props} />;
      case 'library': return <BookOpen {...props} />;
      case 'sessions': return <ScreenShare {...props} />;
      case 'proctoring': return <Eye {...props} />;
      case 'screen-time': return <Clock {...props} />;
      case 'fees-payouts': return <CreditCard {...props} />;
      case 'doubt-desk': return <Sparkles {...props} />;
      case 'mentoring': return <UserCheck {...props} />;
      case 'notices': return <Bell {...props} />;
      case 'admin': return <Shield {...props} />;
      default: return <LayoutDashboard {...props} />;
    }
  };

  const currentRole = role || 'teacher';

  const sections = currentRole === 'student'
    ? ([
        { key: 'main', label: 'Student Overview' },
        { key: 'academic', label: 'Lectures & Studies' },
        { key: 'supervision', label: 'Tests & Assessments' },
        { key: 'operations', label: 'Student Support' },
      ] as const)
    : ([
        { key: 'main', label: 'Overview & Rosters' },
        { key: 'academic', label: 'Academic & Content' },
        { key: 'supervision', label: 'Exam Supervision' },
        { key: 'operations', label: 'Operations & Fees' },
        { key: 'admin', label: 'Owner Administration' },
      ] as const);

  const isFeatureEnabled = (tabId: TabId) => {
    if (currentRole === 'admin') return true;
    switch (tabId) {
      case 'lectures': return appFeatures?.lectureStudio ?? true;
      case 'exam-builder': return appFeatures?.examBuilder ?? true;
      case 'test-series': return appFeatures?.testSeries ?? true;
      case 'question-bank': return appFeatures?.aiQuestionGenerator ?? true;
      case 'review-desk': return appFeatures?.aiQuestionGenerator ?? true;
      case 'daily-warmup': return appFeatures?.dailyWarmup ?? true;
      case 'library': return appFeatures?.libraryNotes ?? true;
      case 'proctoring': return appFeatures?.proctoringEngine ?? true;
      case 'screen-time': return appFeatures?.screenTime ?? true;
      case 'doubt-desk': return appFeatures?.doubtDesk ?? true;
      case 'mentoring': return appFeatures?.mentoringSlots ?? true;
      default: return true;
    }
  };

  const handleTabSelect = (id: TabId) => {
    setActiveTab(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-dark rounded-t-2xl shadow-2xl md:hidden max-h-[85vh] flex flex-col">
        {/* Handle + Header */}
        <div className="flex-shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </div>

          {/* Institute brand strip */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a2744] flex items-center justify-center text-[#f59e0b] font-serif font-bold text-lg">
                φ
              </div>
              <div>
                <p className="font-serif font-bold text-base text-content-primary dark:text-content-primary-dark">
                  phi coaching
                </p>
                <p className="text-[10px] text-content-secondary dark:text-content-secondary-dark font-mono truncate max-w-[200px]">
                  {institute.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-content-secondary"
            >
              <X size={16} />
            </button>
          </div>

          {/* Account info */}
          {account && (
            <div className="flex items-center justify-between px-5 py-3 bg-brand-light/40 dark:bg-navy-900/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f59e0b] text-[#1a2744] flex items-center justify-center font-bold text-sm">
                  {account.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-content-primary dark:text-content-primary-dark">{account.name}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#f59e0b] font-bold">● {account.role}</p>
                </div>
              </div>
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 pb-6">
          {sections.map((sec) => {
            if (sec.key === 'admin' && !isMasterAdminUnlocked) return null;

            const sectionTabs = TABS.filter(
              (t) => t.section === sec.key && canAccess(t.id, currentRole) && isFeatureEnabled(t.id)
            );
            if (sectionTabs.length === 0) return null;

            return (
              <div key={sec.key}>
                <div className="px-1 pb-1.5 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80 dark:text-content-secondary-dark/80 font-mono">
                  {sec.label}
                </div>
                <div className="space-y-1">
                  {sectionTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabSelect(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors min-h-[48px] ${
                          isActive
                            ? 'bg-[#1a2744] text-white font-semibold'
                            : 'text-content-secondary dark:text-content-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-content-primary dark:hover:text-content-primary-dark font-medium'
                        }`}
                      >
                        <span className={isActive ? 'text-[#f59e0b]' : ''}>
                          {getTabIcon(tab.id)}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
