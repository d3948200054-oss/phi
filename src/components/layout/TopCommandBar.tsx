import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Building2,
  Sliders,
  Bell,
} from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Badge } from '../primitives/Badge';
import { AISettingsModal } from '../primitives/AISettingsModal';
import { TABS } from '../../utils/accessControl';

export const TopCommandBar: React.FC = () => {
  const {
    account,
    activeTab,
    institute,
    signOut,
    isDark,
    toggleTheme,
    setIsCommandOpen,
    notices
  } = useTeachDeskStore();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const currentTabConfig = TABS.find((t) => t.id === activeTab);

  const urgentNotices = notices.filter(n => n.priority === 'urgent');

  return (
    <>
      <header className="h-14 bg-[#1a2744] dark:bg-[#0f1a35] border-b border-[#0f1a35] px-4 flex items-center justify-between gap-4 z-10 shrink-0">
        {/* Left: Logo + Screen Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo mark - shown on mobile when sidebar is hidden */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#f59e0b] flex items-center justify-center text-[#1a2744] font-serif font-bold text-base shrink-0">
              φ
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-white truncate">
              {currentTabConfig?.label || 'Dashboard'}
            </span>
            <span className="hidden sm:block text-[10px] text-white/50 truncate font-mono">
              {institute.name}
            </span>
          </div>
          {urgentNotices.length > 0 && (
            <span className="ml-2 hidden md:inline-flex">
              <Badge variant="rose">
                {urgentNotices.length} Urgent Notice{urgentNotices.length > 1 ? 's' : ''}
              </Badge>
            </span>
          )}
        </div>

        {/* Center: Command Palette Trigger - hidden on mobile */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-xs text-white/70 hover:border-[#f59e0b]/60 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="stroke-[1.75]" />
              <span>Search commands, candidates, exams...</span>
            </div>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-white/10 border border-white/20 px-1.5 py-0.5 rounded shadow-xs text-white/50">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell for mobile */}
          {urgentNotices.length > 0 && (
            <div className="relative md:hidden">
              <Bell size={20} className="text-white/70" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f59e0b] rounded-full text-[9px] text-[#1a2744] font-bold flex items-center justify-center">
                {urgentNotices.length}
              </span>
            </div>
          )}

          {/* AI Settings trigger */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            title="Configure AI model endpoints"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Sliders size={16} />
          </button>

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar and Role */}
          {account && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="relative">
                {account.avatar ? (
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b] text-[#1a2744] flex items-center justify-center font-bold text-xs">
                    {account.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {account.name}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f59e0b] font-bold">
                  ● {account.role}
                </span>
              </div>
              <button
                onClick={signOut}
                title="Sign out & lock session keys"
                className="p-1.5 ml-1 rounded text-white/60 hover:text-red-300 hover:bg-white/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <AISettingsModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
};
