import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, FileText, ArrowRight, Shield, Video, Layers, Users } from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { TabId } from '../../types';

export const CommandPalette: React.FC = () => {
  const {
    isCommandOpen,
    setIsCommandOpen,
    setActiveTab,
    cohorts,
    students,
    tests,
    lectures,
    role
  } = useTeachDeskStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(!isCommandOpen);
      }
      if (e.key === 'Escape' && isCommandOpen) {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen, setIsCommandOpen]);

  if (!isCommandOpen) return null;

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
    setIsCommandOpen(false);
    setQuery('');
  };

  const filteredCohorts = cohorts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) || s.rollNo.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredLectures = lectures.filter(l =>
    l.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border dark:border-border-dark gap-3 bg-surface-raised dark:bg-surface-raised-dark">
          <Search size={18} className="text-content-secondary dark:text-content-secondary-dark stroke-[1.75]" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, cohort, student roll no., or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-content-primary dark:text-content-primary-dark placeholder:text-content-secondary/60 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-content-secondary">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Direct Navigation Actions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80 font-mono">
              Quick Surfaces
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateTo('review-desk')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-rose-50/70 dark:hover:bg-rose-950/20 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#e11d48] dark:text-[#fb7185]" />
                  <span className="font-medium text-content-primary dark:text-content-primary-dark">Review Desk Queue</span>
                </div>
                <ArrowRight size={13} className="text-content-secondary" />
              </button>

              <button
                onClick={() => navigateTo('exam-builder')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-rose-50/70 dark:hover:bg-rose-950/20 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-[#e11d48] dark:text-[#fb7185]" />
                  <span className="font-medium text-content-primary dark:text-content-primary-dark">Exam Builder (5 Methods)</span>
                </div>
                <ArrowRight size={13} className="text-content-secondary" />
              </button>

              <button
                onClick={() => navigateTo('sessions')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-rose-50/70 dark:hover:bg-rose-950/20 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-[#e11d48] dark:text-[#fb7185]" />
                  <span className="font-medium text-content-primary dark:text-content-primary-dark">Supervised Exam Runner</span>
                </div>
                <ArrowRight size={13} className="text-content-secondary" />
              </button>

              {role === 'admin' && (
                <button
                  onClick={() => navigateTo('admin')}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-rose-50/70 dark:hover:bg-rose-950/20 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-titanium-700 dark:text-titanium-300" />
                    <span className="font-medium text-content-primary dark:text-content-primary-dark">Owner Admin Console</span>
                  </div>
                  <ArrowRight size={13} className="text-content-secondary" />
                </button>
              )}
            </div>
          </div>

          {/* Matched Students */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80">
                Students
              </div>
              <div className="space-y-0.5">
                {filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => navigateTo('students-reports')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} className="text-cyan-600 dark:text-cyan-400" />
                      <div>
                        <span className="font-medium text-content-primary dark:text-content-primary-dark mr-2">{s.name}</span>
                        <span className="font-mono text-[11px] text-content-secondary">[{s.rollNo}]</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-content-secondary">{s.course}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Cohorts */}
          {filteredCohorts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80">
                Cohorts & Batches
              </div>
              <div className="space-y-0.5">
                {filteredCohorts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigateTo('cohorts')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-[#e11d48] dark:text-[#fb7185]" />
                      <div>
                        <span className="font-medium text-content-primary dark:text-content-primary-dark mr-2">{c.name}</span>
                        <span className="font-mono text-[11px] text-content-secondary">({c.code})</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-content-secondary">{c.course}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Lectures */}
          {filteredLectures.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary/80">
                Lectures
              </div>
              <div className="space-y-0.5">
                {filteredLectures.map(l => (
                  <button
                    key={l.id}
                    onClick={() => navigateTo('lectures')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Video size={15} className="text-[#e11d48] dark:text-[#fb7185] shrink-0" />
                      <span className="font-medium text-content-primary dark:text-content-primary-dark truncate">{l.title}</span>
                    </div>
                    <span className="text-[11px] text-content-secondary shrink-0 font-mono">
                      {Math.round(l.durationSeconds / 60)} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
