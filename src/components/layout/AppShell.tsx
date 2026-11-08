import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { LeftRail } from './LeftRail';
import { TopCommandBar } from './TopCommandBar';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { CommandPalette } from './CommandPalette';
import { ToastContainer } from '../primitives/ToastContainer';
import { RestrictedPanel } from '../primitives/RestrictedPanel';
import { canAccess } from '../../utils/accessControl';

// Surface imports
import { DashboardSurface } from '../surfaces/DashboardSurface';
import { CohortsSurface } from '../surfaces/CohortsSurface';
import { StudentsReportsSurface } from '../surfaces/StudentsReportsSurface';
import { AnalyticsSurface } from '../surfaces/AnalyticsSurface';
import { LecturesSurface } from '../surfaces/LecturesSurface';
import { ReviewDeskSurface } from '../surfaces/ReviewDeskSurface';
import { ExamBuilderSurface } from '../surfaces/ExamBuilderSurface';
import { TestSeriesSurface } from '../surfaces/TestSeriesSurface';
import { QuestionBankSurface } from '../surfaces/QuestionBankSurface';
import { DailyWarmupSurface } from '../surfaces/DailyWarmupSurface';
import { LibrarySurface } from '../surfaces/LibrarySurface';
import { SessionsSurface } from '../surfaces/SessionsSurface';
import { ProctoringSurface } from '../surfaces/ProctoringSurface';
import { ScreenTimeSurface } from '../surfaces/ScreenTimeSurface';
import { FeesPayoutsSurface } from '../surfaces/FeesPayoutsSurface';
import { DoubtDeskSurface } from '../surfaces/DoubtDeskSurface';
import { MentoringSurface } from '../surfaces/MentoringSurface';
import { NoticesSurface } from '../surfaces/NoticesSurface';
import { AdminConsoleSurface } from '../surfaces/AdminConsoleSurface';

export const AppShell: React.FC = () => {
  const { activeTab, role } = useTeachDeskStore();
  const [collapsed, setCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Non-Negotiable Rule 1: Re-checked at render time with RestrictedPanel fallback
  const isAllowed = canAccess(activeTab, role || 'teacher');

  const renderActiveSurface = () => {
    if (!isAllowed) {
      return <RestrictedPanel requiredRole="admin" surfaceName={activeTab} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardSurface />;
      case 'cohorts':
        return <CohortsSurface />;
      case 'students-reports':
        return <StudentsReportsSurface />;
      case 'analytics':
        return <AnalyticsSurface />;
      case 'lectures':
        return <LecturesSurface />;
      case 'review-desk':
        return <ReviewDeskSurface />;
      case 'exam-builder':
        return <ExamBuilderSurface />;
      case 'test-series':
        return <TestSeriesSurface />;
      case 'question-bank':
        return <QuestionBankSurface />;
      case 'daily-warmup':
        return <DailyWarmupSurface />;
      case 'library':
        return <LibrarySurface />;
      case 'sessions':
        return <SessionsSurface />;
      case 'proctoring':
        return <ProctoringSurface />;
      case 'screen-time':
        return <ScreenTimeSurface />;
      case 'fees-payouts':
        return <FeesPayoutsSurface />;
      case 'doubt-desk':
        return <DoubtDeskSurface />;
      case 'mentoring':
        return <MentoringSurface />;
      case 'notices':
        return <NoticesSurface />;
      case 'admin':
        return <AdminConsoleSurface />;
      default:
        return <DashboardSurface />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas dark:bg-canvas-dark text-content-primary dark:text-content-primary-dark">
      {/* Left Rail Sidebar — hidden on mobile, visible on md+ */}
      <LeftRail collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Command Bar */}
        <TopCommandBar />

        {/* Scrollable Surface Container */}
        {/* On mobile, add pb-16 to avoid content hiding behind bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {renderActiveSurface()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation — only on mobile */}
      <BottomNav onMenuOpen={() => setIsDrawerOpen(true)} />

      {/* Mobile Drawer (slide-up nav menu) */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette />

      {/* Persistent Toast System */}
      <ToastContainer />
    </div>
  );
};
