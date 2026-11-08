import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Select } from '../primitives/Select';
import { ScreenTimeApp, ScreenTimeRecord } from '../../types';
import { Clock, ShieldCheck, AlertTriangle, Check, Plus, BarChart2 } from 'lucide-react';

export const ScreenTimeSurface: React.FC = () => {
  const { students, addScreenTimeRecord, screenTimeRecords } = useTeachDeskStore();

  const [hasConsent, setHasConsent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  // Snapshot app minutes state
  const [apps, setApps] = useState<ScreenTimeApp[]>([
    { appName: 'Wolfram Alpha & GeoGebra', minutes: 75, category: 'Education' },
    { appName: 'phi Supervised Terminal', minutes: 120, category: 'Productive' },
    { appName: 'PDF Formula Reader', minutes: 45, category: 'Education' },
    { appName: 'Calculator Utility', minutes: 20, category: 'Utility' },
    { appName: 'Instagram Reels', minutes: 15, category: 'Distraction/Reels' },
  ]);

  const [newAppName, setNewAppName] = useState('');
  const [newAppMins, setNewAppMins] = useState(30);
  const [newAppCat, setNewAppCat] = useState<ScreenTimeApp['category']>('Education');

  const totalMinutes = apps.reduce((sum, a) => sum + a.minutes, 0);

  // Group by category
  const categories: Record<ScreenTimeApp['category'], number> = {
    Productive: 0,
    'Distraction/Reels': 0,
    'Social Media': 0,
    Entertainment: 0,
    Education: 0,
    Utility: 0
  };

  apps.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + a.minutes;
  });

  const handleAddApp = () => {
    if (!newAppName.trim()) return;
    setApps(prev => [...prev, { appName: newAppName.trim(), minutes: newAppMins, category: newAppCat }]);
    setNewAppName('');
    setNewAppMins(30);
  };

  const handleSaveSnapshot = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    const rec: ScreenTimeRecord = {
      id: 'st_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      studentId: selectedStudentId,
      studentName: student?.name || 'Candidate',
      durationMinutes: totalMinutes,
      apps,
      consentGiven: hasConsent
    };
    await addScreenTimeRecord(rec);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
          Device Screen-Time & Study Snapshot
        </h2>
        <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
          Record device usage breakdown during institute lab sessions with mandatory explicit candidate consent.
        </p>
      </div>

      {/* Honest Limitation Banner (Non-Negotiable Rule 4) */}
      <div className="p-3.5 rounded-lg bg-surface dark:bg-surface-dark border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-900 dark:text-amber-200 block font-semibold">
            Honest Platform Limitation:
          </strong>
          <p className="text-content-secondary dark:text-content-secondary-dark mt-0.5 leading-relaxed">
            The web platform has no operating-system permission to read native desktop Screen Time or Android digital wellbeing automatically. This is a supervised snapshot logged on the institute terminal by the supervising teacher; it cannot spy on or observe any candidate's personal device.
          </p>
        </div>
      </div>

      {/* Consent Screen First (Mandatory) */}
      {!hasConsent ? (
        <Panel
          title="Candidate Privacy Consent & Disclosure"
          subtitle="Explicit consent agreement required before recording screen time observations"
        >
          <div className="space-y-4 max-w-xl text-xs">
            <div className="p-3.5 rounded border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
              <span className="font-bold text-rose-900 dark:text-rose-200 block">
                What phi Measures on this Workstation:
              </span>
              <ul className="list-disc list-inside space-y-1 text-content-primary dark:text-content-primary-dark">
                <li>Minutes spent on approved problem sets and curriculum simulators.</li>
                <li>Breakdown between productive study modules and distraction categories.</li>
                <li>Workstation active session timestamps.</li>
              </ul>
              <span className="font-bold text-rose-900 dark:text-rose-200 block pt-1">
                What phi CANNOT and DOES NOT Measure:
              </span>
              <ul className="list-disc list-inside space-y-1 text-content-secondary">
                <li>Personal mobile phones or secondary laptops.</li>
                <li>Keystrokes, chat messages, or private browsing history.</li>
                <li>Any activity outside of this institute terminal.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 rounded accent-rose-600"
              />
              <span className="font-medium text-content-primary dark:text-content-primary-dark">
                The candidate has reviewed the disclosure and explicitly consents to device activity logging for this supervised session.
              </span>
            </label>
          </div>
        </Panel>
      ) : (
        /* Screen Time Breakdown */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Category Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title="Session Activity Breakdown"
              subtitle={`Total Logged: ${totalMinutes} minutes`}
              badge={<Badge variant="teal">Consent Active</Badge>}
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSnapshot}
                  icon={<Check size={14} />}
                >
                  Save Snapshot Record
                </Button>
              }
            >
              {/* Category Bars */}
              <div className="space-y-3 mb-6">
                {Object.entries(categories).map(([cat, mins]) => {
                  const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
                  const barColors: Record<string, string> = {
                    Productive: 'bg-[#e11d48]',
                    Education: 'bg-cyan-600',
                    Utility: 'bg-slate-500',
                    'Distraction/Reels': 'bg-rose-600',
                    'Social Media': 'bg-amber-500',
                    Entertainment: 'bg-purple-600'
                  };

                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-content-primary dark:text-content-primary-dark">{cat}</span>
                        <span className="font-mono text-content-secondary tabular-nums">
                          {mins}m ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColors[cat] || 'bg-slate-500'} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Logged Application Minutes List */}
              <div className="pt-3 border-t border-border dark:border-border-dark space-y-2">
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block">
                  Applications Logged
                </span>
                <div className="space-y-1.5 text-xs">
                  {apps.map((app, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border border-border/60 dark:border-border-dark/60 bg-white dark:bg-surface-dark flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-content-primary dark:text-content-primary-dark block">{app.appName}</span>
                        <span className="text-[10px] text-content-secondary font-mono">{app.category}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums">{app.minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Add App & Historical Snapshots (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Panel title="Add Activity Entry">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                    Application / Window Name
                  </span>
                  <input
                    type="text"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g. Desmos Graphing Calculator"
                    className="w-full px-3 py-1.5 rounded bg-white dark:bg-surface-dark border text-content-primary dark:text-content-primary-dark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                      Minutes
                    </span>
                    <input
                      type="number"
                      value={newAppMins}
                      onChange={(e) => setNewAppMins(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-surface-dark border font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                      Category
                    </span>
                    <select
                      value={newAppCat}
                      onChange={(e) => setNewAppCat(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded bg-white dark:bg-surface-dark border"
                    >
                      <option value="Productive">Productive</option>
                      <option value="Education">Education</option>
                      <option value="Utility">Utility</option>
                      <option value="Distraction/Reels">Distraction/Reels</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>
                </div>

                <Button variant="secondary" size="sm" onClick={handleAddApp} icon={<Plus size={13} />}>
                  Append App Activity
                </Button>
              </div>
            </Panel>

            <Panel title="Study-Streak Counter">
              <div className="flex items-center gap-4 text-xs">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-bold text-[#e11d48] dark:text-[#fb7185]">4</span>
                  <span className="text-[9px] uppercase font-bold text-content-secondary">DAYS</span>
                </div>
                <div>
                  <span className="font-semibold block text-content-primary dark:text-content-primary-dark">Consistent Terminal Focus</span>
                  <p className="text-content-secondary text-[11px] mt-0.5">
                    Candidate logged &gt;120 minutes of daily productive time over consecutive coaching sessions.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
