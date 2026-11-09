import React, { useState, useRef } from 'react';
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Building2,
  Sliders,
  Bell,
  Shield,
  Lock
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
    notices,
    personalMessages,
    markPersonalMessageRead,
    isMasterAdminUnlocked,
    lockMasterAdmin,
    setIsMasterAdminModalOpen
  } = useTeachDeskStore();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPersonalMsgOpen, setIsPersonalMsgOpen] = useState(false);
  const currentTabConfig = TABS.find((t) => t.id === activeTab);

  const myPersonalMessages = personalMessages ? personalMessages.filter(m => m.recipientId === account?.id) : [];
  const unreadPersonal = myPersonalMessages.filter(m => !m.isRead);

  const handleLogoClick = () => {
    setIsMasterAdminModalOpen(true);
  };

  const urgentNotices = notices.filter(n => n.priority === 'urgent');

  return (
    <>
      <header className="h-14 bg-[#1a2744] dark:bg-[#0f1a35] border-b border-[#0f1a35] px-4 flex items-center justify-between gap-4 z-10 shrink-0">
        {/* Left: Logo + Screen Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo mark - shown on mobile when sidebar is hidden (with secret 5-click easter egg) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={handleLogoClick}
              type="button"
              className="w-7 h-7 rounded bg-[#f59e0b] flex items-center justify-center text-[#1a2744] font-serif font-bold text-base shrink-0 active:scale-95 transition-transform"
              title="Phi Coaching"
            >
              φ
            </button>
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
          {/* Personal Messages from Admin */}
          {myPersonalMessages.length > 0 && (
            <button
              onClick={() => setIsPersonalMsgOpen(!isPersonalMsgOpen)}
              title="Personal Messages from Om Shankar"
              className="relative p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-colors flex items-center gap-1 text-xs"
            >
              <Bell size={16} className={unreadPersonal.length > 0 ? 'text-amber-400 animate-bounce' : 'text-amber-300'} />
              {unreadPersonal.length > 0 && (
                <span className="font-mono font-bold text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded-full">
                  {unreadPersonal.length}
                </span>
              )}
            </button>
          )}

          {/* Master Admin Indicator if unlocked */}
          {isMasterAdminUnlocked && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold animate-pulse">
              <Shield size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Owner Admin Active</span>
              <button
                onClick={lockMasterAdmin}
                className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/30 hover:bg-amber-500/50 text-[10px] text-amber-200 transition-colors"
                title="Lock and hide Master Admin Console"
              >
                Lock
              </button>
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

      {/* Personal Direct Messages Dialog */}
      {isPersonalMsgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-[#11192e] border border-amber-500/40 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  👑
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white">Personal Messages from Admin</h4>
                  <p className="text-[10px] text-slate-400">Direct directives from Om Shankar</p>
                </div>
              </div>
              <button
                onClick={() => setIsPersonalMsgOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {myPersonalMessages.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No messages.</p>
              ) : (
                myPersonalMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border space-y-1.5 transition-colors ${
                      !msg.isRead ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-amber-300">{msg.subject}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                    {!msg.isRead && (
                      <div className="pt-1 text-right">
                        <button
                          type="button"
                          onClick={() => markPersonalMessageRead(msg.id)}
                          className="text-[10px] text-emerald-400 hover:underline font-mono"
                        >
                          Mark as read ✓
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsPersonalMsgOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
