import React from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { TABS, canAccess } from '../../utils/accessControl';
import { TabId } from '../../types';

interface LeftRailProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftRail: React.FC<LeftRailProps> = ({ collapsed, onToggleCollapse }) => {
  const { activeTab, setActiveTab, role, institute } = useTeachDeskStore();

  const getTabIcon = (id: TabId) => {
    const props = { size: 17, className: 'shrink-0 stroke-[1.75]' };
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

  const sections = [
    { key: 'main', label: 'Overview & Rosters' },
    { key: 'academic', label: 'Academic & Content' },
    { key: 'supervision', label: 'Exam Supervision' },
    { key: 'operations', label: 'Operations & Fees' },
    { key: 'admin', label: 'Owner Administration' },
  ] as const;

  const currentRole = role || 'teacher';

  return (
    <aside
      className={`relative flex-col h-screen bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark transition-all duration-200 select-none z-20 shrink-0 hidden md:flex ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-border dark:border-border-dark flex items-center justify-between px-3.5 bg-surface dark:bg-surface-dark">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-[#1a2744] flex items-center justify-center text-white shrink-0 font-serif font-bold text-base tracking-tighter shadow-xs">
              φ
            </div>
            <div className="truncate">
              <span className="font-serif font-bold text-base tracking-tight text-content-primary dark:text-content-primary-dark">
                phi coaching
              </span>
              <span className="block text-[10px] text-content-secondary dark:text-content-secondary-dark truncate font-mono">
                {institute.name}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-7 h-7 rounded bg-[#1a2744] flex items-center justify-center text-white font-serif font-bold text-base">
            φ
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((sec) => {
          const sectionTabs = TABS.filter(
            (t) => t.section === sec.key && canAccess(t.id, currentRole)
          );
          if (sectionTabs.length === 0) return null;

          return (
            <div key={sec.key}>
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80 dark:text-content-secondary-dark/80 font-mono">
                  {sec.label}
                </div>
              )}
              <div className="space-y-0.5">
                {sectionTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={collapsed ? tab.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors relative min-h-[44px] md:min-h-0 ${
                        isActive
                          ? 'bg-navy-50/70 dark:bg-navy-900/20 text-[#1a2744] dark:text-[#3b5bdb] font-semibold border-l-[3px] border-l-[#1a2744] dark:border-l-[#3b5bdb]'
                          : 'text-content-secondary dark:text-content-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-content-primary dark:hover:text-content-primary-dark font-medium'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      {getTabIcon(tab.id)}
                      {!collapsed && <span className="truncate">{tab.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-border dark:border-border-dark flex items-center justify-between bg-surface-raised/40 dark:bg-surface-raised-dark/40">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded text-content-secondary hover:text-content-primary dark:hover:text-content-primary-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-[11px] font-medium font-mono">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
