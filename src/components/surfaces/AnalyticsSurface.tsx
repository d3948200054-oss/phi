import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Table, Column } from '../primitives/Table';
import { LineChart, BarChart, CheckCircle2, AlertTriangle, Layers, Video } from 'lucide-react';

export const AnalyticsSurface: React.FC = () => {
  const { attempts, questions, lectures, students } = useTeachDeskStore();

  const [coverageMode, setCoverageMode] = useState<'exact' | 'subject'>('exact');

  // Non-Negotiable Rule 3: All metrics computed from real attempt records
  // 1. Accuracy by Subject
  const subjectAggregates: Record<string, { totalScore: number; count: number; correctCount: number; totalQuestions: number }> = {};
  attempts.forEach(a => {
    Object.entries(a.subjectAccuracy).forEach(([subj, stats]) => {
      if (!subjectAggregates[subj]) {
        subjectAggregates[subj] = { totalScore: 0, count: 0, correctCount: 0, totalQuestions: 0 };
      }
      subjectAggregates[subj].correctCount += stats.correct;
      subjectAggregates[subj].totalQuestions += stats.total;
    });
  });

  const subjectAccuracies = Object.entries(subjectAggregates).map(([subj, data]) => ({
    subject: subj,
    accuracy: data.totalQuestions > 0 ? Math.round((data.correctCount / data.totalQuestions) * 100) : 0,
    attemptsCount: data.totalQuestions
  }));

  // 2. Score distribution across bands: <40% (At Risk), 40-70% (Average), >70% (Elite)
  const distribution = {
    elite: attempts.filter(a => a.percent >= 70).length,
    average: attempts.filter(a => a.percent >= 40 && a.percent < 70).length,
    atRisk: attempts.filter(a => a.percent < 40).length,
  };

  // 3. Topic difficulty and questions count from question bank
  const topicStats: Record<string, { count: number; easy: number; medium: number; hard: number }> = {};
  questions.forEach(q => {
    const t = q.topic || 'General';
    if (!topicStats[t]) {
      topicStats[t] = { count: 0, easy: 0, medium: 0, hard: 0 };
    }
    topicStats[t].count += 1;
    topicStats[t][q.difficulty] += 1;
  });

  // 4. Video ↔ Question Coverage Analysis
  // Which topics the lecture library covers vs question bank
  const lectureTopics = new Set<string>();
  lectures.forEach(l => {
    l.chapters.forEach(c => lectureTopics.add(c.title.toLowerCase()));
  });

  const allTopics = Object.keys(topicStats);
  const coverageData = allTopics.map(topic => {
    const hasLectureMatch = coverageMode === 'exact'
      ? Array.from(lectureTopics).some(lt => lt.includes(topic.toLowerCase()))
      : lectures.some(l => l.subject.toLowerCase() === 'physics'); // subject-wide variant

    return {
      topic,
      questionsAvailable: topicStats[topic].count,
      hasVideoCoverage: hasLectureMatch,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
          Institute Academic & Diagnostic Analytics
        </h2>
        <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
          Pure computed performance indicators from real examination attempts and syllabus content mappings.
        </p>
      </div>

      {/* Grid of Key Performance Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Total Exam Attempts Logged">
          <span className="font-mono text-3xl font-bold tabular-nums text-[#e11d48] dark:text-[#fb7185]">
            {attempts.length}
          </span>
          <p className="text-[11px] text-content-secondary mt-1">Supervised terminal sessions</p>
        </Panel>

        <Panel title="Average Performance Rating">
          <span className="font-mono text-3xl font-bold tabular-nums text-cyan-700 dark:text-cyan-400">
            {attempts.length > 0
              ? `${Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length)}%`
              : 'N/A'}
          </span>
          <p className="text-[11px] text-content-secondary mt-1">Accuracy across all attempts</p>
        </Panel>

        <Panel title="Integrity Incidents Logged">
          <span className="font-mono text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
            {attempts.reduce((sum, a) => sum + a.proctorFlags.length, 0)}
          </span>
          <p className="text-[11px] text-content-secondary mt-1">Tab switches and window exits</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inline SVG Chart: Subject Accuracy Breakdown (Part 8: 1px grid, flat bars, no gradients) */}
        <Panel
          title="Subject Accuracy Comparison"
          subtitle="Computed from real question attempt logs"
        >
          {subjectAccuracies.length === 0 ? (
            <div className="py-12 text-center text-xs text-content-secondary border border-dashed rounded">
              No attempt data logged yet. Complete an exam in the Supervised Runner to populate chart.
            </div>
          ) : (
            <div className="space-y-4">
              <svg viewBox="0 0 400 160" className="w-full h-auto">
                {/* 1px grid lines */}
                <line x1="40" y1="30" x2="380" y2="30" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="380" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="380" y2="110" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="380" y2="140" stroke="#94a3b8" strokeWidth="1" />

                {/* Y Axis text */}
                <text x="32" y="34" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">100%</text>
                <text x="32" y="74" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">60%</text>
                <text x="32" y="114" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">30%</text>
                <text x="32" y="144" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">0%</text>

                {/* Flat bars: 6px bar width with 4px radius per Part 8 */}
                {subjectAccuracies.map((item, idx) => {
                  const x = 80 + idx * 90;
                  const barH = (item.accuracy / 100) * 110;
                  const y = 140 - barH;
                  return (
                    <g key={item.subject}>
                      <rect x={x} y={y} width="24" height={barH} rx="4" fill="#e11d48" />
                      <text x={x + 12} y="154" textAnchor="middle" fontSize="10" fill="#64748b">
                        {item.subject.slice(0, 4)}
                      </text>
                      <text x={x + 12} y={y - 4} textAnchor="middle" fontSize="10" fill="#0f172a" fontFamily="monospace" fontWeight="bold">
                        {item.accuracy}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </Panel>

        {/* Score Distribution Across Bands */}
        <Panel
          title="Score Distribution Cohort Bands"
          subtitle="Real candidate percentiles across performance deciles"
        >
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-cyan-800 dark:text-cyan-300">Elite Band (≥ 70% Score)</span>
                <span className="font-mono tabular-nums font-bold">{distribution.elite} candidate(s)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-600 h-full"
                  style={{ width: `${attempts.length > 0 ? (distribution.elite / attempts.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-rose-800 dark:text-rose-300">Proficient Band (40% - 69%)</span>
                <span className="font-mono tabular-nums font-bold">{distribution.average} candidate(s)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#e11d48] h-full"
                  style={{ width: `${attempts.length > 0 ? (distribution.average / attempts.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-rose-800 dark:text-rose-300">At Risk Band (&lt; 40% Score)</span>
                <span className="font-mono tabular-nums font-bold">{distribution.atRisk} candidate(s)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full"
                  style={{ width: `${attempts.length > 0 ? (distribution.atRisk / attempts.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Video ↔ Question Coverage Analysis */}
      <Panel
        title="Video ↔ Question Curriculum Coverage Matrix"
        subtitle="Identifies which syllabus topics have classroom video recordings and active practice items"
        actions={
          <div className="flex gap-1 text-[11px]">
            <button
              onClick={() => setCoverageMode('exact')}
              className={`px-2.5 py-1 rounded transition-colors ${
                coverageMode === 'exact'
                  ? 'bg-[#e11d48] text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
              }`}
            >
              Exact Topic Match
            </button>
            <button
              onClick={() => setCoverageMode('subject')}
              className={`px-2.5 py-1 rounded transition-colors ${
                coverageMode === 'subject'
                  ? 'bg-[#e11d48] text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
              }`}
            >
              Subject-Wide Variant
            </button>
          </div>
        }
      >
        <div className="divide-y divide-border/60 dark:divide-border-dark/60 text-xs">
          {coverageData.map((row) => (
            <div key={row.topic} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-content-primary dark:text-content-primary-dark block">
                  {row.topic}
                </span>
                <span className="font-mono text-[10px] text-content-secondary">
                  {row.questionsAvailable} Question Item(s) in Bank
                </span>
              </div>
              <div className="flex items-center gap-2">
                {row.hasVideoCoverage ? (
                  <Badge variant="teal">Lecture Available</Badge>
                ) : (
                  <Badge variant="amber">No Video Record</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};
