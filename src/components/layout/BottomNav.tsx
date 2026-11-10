import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  Video,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { TabId } from '../../types';

interface BottomNavProps {
  onMenuOpen: () => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuOpen }) => {
  const { activeTab, setActiveTab, role } = useTeachDeskStore();

  const navItems: NavItem[] = role === 'student'
    ? [
        {
          id: 'dashboard',
          label: 'Home',
          icon: <LayoutDashboard size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'lectures',
          label: 'Lectures',
          icon: <Video size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'library',
          label: 'Library',
          icon: <BookOpen size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'daily-warmup',
          label: 'Warm-up',
          icon: <Sparkles size={22} className="stroke-[1.75]" />,
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'Home',
          icon: <LayoutDashboard size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'students-reports',
          label: 'Students',
          icon: <GraduationCap size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'library',
          label: 'Library',
          icon: <BookOpen size={22} className="stroke-[1.75]" />,
        },
        {
          id: 'exam-builder',
          label: 'Exams',
          icon: <FileSpreadsheet size={22} className="stroke-[1.75]" />,
        },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark border-t border-border dark:border-border-dark flex md:hidden pb-safe shadow-lg">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
              isActive
                ? 'text-[#1a2744] dark:text-[#3b5bdb]'
                : 'text-content-secondary dark:text-content-secondary-dark'
            }`}
          >
            <span className={`${isActive ? 'text-[#f59e0b]' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-medium ${isActive ? 'font-bold text-[#1a2744] dark:text-[#3b5bdb]' : ''}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-[#f59e0b] rounded-t-full" />
            )}
          </button>
        );
      })}

      {/* Menu (More) button */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors text-content-secondary dark:text-content-secondary-dark"
      >
        <Menu size={22} className="stroke-[1.75]" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </nav>
  );
};
