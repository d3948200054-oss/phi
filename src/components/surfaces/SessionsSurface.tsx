import React, { useState, useEffect, useRef } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { Attempt, AttemptResponse, ProctorFlag, Test } from '../../types';
import { renderTechnicalDiagram } from '../../utils/diagrams';
import {
  ShieldAlert,
  Clock,
  Play,
  CheckCircle2,
  Bookmark,
  Flag,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export const SessionsSurface: React.FC = () => {
  const { tests, students, recordAttempt, attempts } = useTeachDeskStore();

  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  // Active Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Response tracking per question
  const [responses, setResponses] = useState<AttemptResponse[]>([]);
  const [flags, setFlags] = useState<ProctorFlag[]>([]);
  const [visited, setVisited] = useState<boolean[]>([]);

  // Submission & Results
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null);

  const activeTest = tests.find(t => t.id === selectedTestId) || tests[0];
  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const sessionContainerRef = useRef<HTMLDivElement>(null);

  // Launch test session scaffold
  const handleLaunchSession = () => {
    if (!activeTest || activeTest.questions.length === 0) {
      alert('Selected test has no questions. Build questions in Exam Builder or Review Desk first.');
      return;
    }

    const initialResponses: AttemptResponse[] = activeTest.questions.map((_, i) => ({
      questionIndex: i,
      selectedOptionIndex: null,
      timeSpentSeconds: 0,
      markedForReview: false
    }));

    setResponses(initialResponses);
    setVisited(activeTest.questions.map((_, i) => i === 0));
    setSecondsRemaining(activeTest.durationMinutes * 60);
    setCurrentQIndex(0);
    setFlags([]);
    setHasStartedTimer(false);
    setIsSessionActive(true);
    setCompletedAttempt(null);
  };

  // Fullscreen & visibility change listener
  useEffect(() => {
    if (!isSessionActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const flag: ProctorFlag = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'TAB_SWITCH',
          detail: 'Supervised candidate switched active browser tab or minimized window.'
        };
        setFlags(prev => [...prev, flag]);
      }
    };

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && isSessionActive && hasStartedTimer) {
        const flag: ProctorFlag = {
          timestamp: new Date().toLocaleTimeString(),
          type: 'FULLSCREEN_EXIT',
          detail: 'Supervised candidate exited fullscreen examination mode.'
        };
        setFlags(prev => [...prev, flag]);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isSessionActive, hasStartedTimer]);

  // Countdown timer
  useEffect(() => {
    if (!isSessionActive || !hasStartedTimer) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });

      // Increment question timer
      setResponses(prev => {
        const copy = [...prev];
        if (copy[currentQIndex]) {
          copy[currentQIndex] = {
            ...copy[currentQIndex],
            timeSpentSeconds: copy[currentQIndex].timeSpentSeconds + 1
          };
        }
        return copy;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive, hasStartedTimer, currentQIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      sessionContainerRef.current?.requestFullscreen().catch(err => {
        console.warn('Fullscreen request blocked', err);
      });
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  const handleSelectOption = (optIdx: number) => {
    setResponses(prev => {
      const copy = [...prev];
      copy[currentQIndex] = {
        ...copy[currentQIndex],
        selectedOptionIndex: copy[currentQIndex].selectedOptionIndex === optIdx ? null : optIdx
      };
      return copy;
    });
  };

  const toggleMarkForReview = () => {
    setResponses(prev => {
      const copy = [...prev];
      copy[currentQIndex] = {
        ...copy[currentQIndex],
        markedForReview: !copy[currentQIndex].markedForReview
      };
      return copy;
    });
  };

  const jumpToQuestion = (idx: number) => {
    setCurrentQIndex(idx);
    setVisited(prev => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
  };

  // Submit and compute exact scores from real answers (Non-negotiable Rule 3)
  const handleSubmitAttempt = async () => {
    if (!activeTest || !activeStudent) return;

    let score = 0;
    const subjectStats: Record<string, { correct: number; total: number; percent: number }> = {};

    activeTest.questions.forEach((q, idx) => {
      const userResp = responses[idx];
      const isCorrect = userResp && userResp.selectedOptionIndex === q.correctOptionIndex;
      const isAnswered = userResp && userResp.selectedOptionIndex !== null;

      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = { correct: 0, total: 0, percent: 0 };
      }
      subjectStats[q.subject].total += 1;

      if (isCorrect) {
        score += q.marks;
        subjectStats[q.subject].correct += 1;
      } else if (isAnswered && activeTest.negativeMarking) {
        score -= q.negativeMarks;
      }
    });

    Object.keys(subjectStats).forEach(subj => {
      const s = subjectStats[subj];
      s.percent = Math.round((s.correct / s.total) * 100);
    });

    const percent = Math.max(0, Math.round((score / activeTest.totalMarks) * 100));
    const totalTimeSpent = (activeTest.durationMinutes * 60) - secondsRemaining;

    const attemptRecord: Attempt = {
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      testId: activeTest.id,
      testTitle: activeTest.title,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentRoll: activeStudent.rollNo,
      responses,
      score,
      percent,
      subjectAccuracy: subjectStats,
      timeSpentSeconds: totalTimeSpent,
      proctorFlags: flags,
      completedAt: new Date().toISOString()
    };

    await recordAttempt(attemptRecord);
    setCompletedAttempt(attemptRecord);
    setIsSessionActive(false);
    setShowSubmitConfirm(false);
  };

  // Palette status helper
  const getPaletteState = (idx: number) => {
    const isV = visited[idx];
    const r = responses[idx];
    const isAns = r && r.selectedOptionIndex !== null;
    const isMarked = r && r.markedForReview;

    if (isAns && isMarked) return 'ans_marked';
    if (isMarked) return 'marked';
    if (isAns) return 'answered';
    if (isV) return 'not_answered';
    return 'not_visited';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!isSessionActive && !completedAttempt && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
              Supervised Exam Runner (Institute Device Station)
            </h2>
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
              Launch a supervised mock test on an institute terminal. Strict fullscreen enforcement, tab-switch traps, and computed score summaries.
            </p>
          </div>

          <Panel
            title="Session Station Dispatch"
            subtitle="Select the examination paper and designated candidate"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <Select
                label="Select Examination Paper"
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                options={tests.map(t => ({
                  value: t.id,
                  label: `${t.title} (${t.questions.length} Qs, ${t.totalMarks} Marks, ${t.durationMinutes}m)`
                }))}
              />

              <Select
                label="Designated Candidate"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={students.map(s => ({
                  value: s.id,
                  label: `${s.name} [Roll: ${s.rollNo}]`
                }))}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-border dark:border-border-dark flex justify-between items-center">
              <div className="text-xs text-content-secondary">
                Fullscreen enforcement & integrity sampler will activate upon starting.
              </div>
              <Button
                variant="accent"
                size="md"
                onClick={handleLaunchSession}
                icon={<Play size={16} />}
              >
                Launch Supervised Station
              </Button>
            </div>
          </Panel>

          {/* Recent Attempts Log */}
          {attempts.length > 0 && (
            <Panel
              title="Recent Supervised Exam Logs"
              subtitle="All real attempt scores and integrity records"
            >
              <div className="space-y-2">
                {attempts.map(att => (
                  <div
                    key={att.id}
                    className="p-3 rounded border border-border dark:border-border-dark bg-white dark:bg-surface-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-content-primary dark:text-content-primary-dark">{att.studentName}</span>
                        <span className="font-mono text-content-secondary">[{att.studentRoll}]</span>
                        <Badge variant={att.proctorFlags.length === 0 ? 'teal' : 'rose'}>
                          {att.proctorFlags.length} flag(s)
                        </Badge>
                      </div>
                      <span className="text-[11px] text-content-secondary">{att.testTitle}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#e11d48] dark:text-[#fb7185] block">
                          {att.score} pts ({att.percent}%)
                        </span>
                        <span className="font-mono text-[10px] text-content-secondary">
                          Time: {Math.round(att.timeSpentSeconds / 60)} min
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCompletedAttempt(att)}
                      >
                        Inspect Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ACTIVE RUNNING EXAM SUPERVISOR SCREEN */}
      {isSessionActive && activeTest && (
        <div
          ref={sessionContainerRef}
          className="bg-canvas dark:bg-canvas-dark min-h-screen p-4 flex flex-col gap-4 font-sans"
        >
          {/* Header Bar */}
          <div className="p-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-content-primary dark:text-content-primary-dark">
                  {activeTest.title}
                </h3>
                <Badge variant={isFullscreen ? 'teal' : 'amber'}>
                  {isFullscreen ? 'FULLSCREEN ACTIVE' : 'WINDOWED (FLAGGED)'}
                </Badge>
              </div>
              <p className="text-xs text-content-secondary">
                Candidate: <strong>{activeStudent.name}</strong> [Roll: {activeStudent.rollNo}]
              </p>
            </div>

            {/* Countdown timer & Teacher start trigger */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-raised dark:bg-surface-raised-dark border border-border dark:border-border-dark font-mono text-base font-bold tabular-nums">
                <Clock size={16} className="text-[#e11d48] dark:text-[#fb7185] stroke-[2]" />
                <span>
                  {Math.floor(secondsRemaining / 60)}:{secondsRemaining % 60 < 10 ? '0' : ''}{secondsRemaining % 60}
                </span>
              </div>

              {!hasStartedTimer ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    setHasStartedTimer(true);
                    toggleFullscreen();
                  }}
                  icon={<Play size={14} />}
                >
                  Start Candidate Timer
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleFullscreen}
                  icon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Paper
              </Button>
            </div>
          </div>

          {/* Real-time Flag Alerts */}
          {flags.length > 0 && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-600 shrink-0 stroke-[2]" />
                <span>
                  <strong>Supervisor Flag Raised:</strong> {flags[flags.length - 1].type} at {flags[flags.length - 1].timestamp} ({flags.length} incidents logged).
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold">Logged to attempt</span>
            </div>
          )}

          {/* Question Workspace + Palette */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Question Stem & Choices (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {activeTest.questions[currentQIndex] ? (
                <Panel
                  title={
                    <div className="flex items-center gap-2">
                      <span>Question #{currentQIndex + 1} of {activeTest.questions.length}</span>
                      <Badge variant="indigo">{activeTest.questions[currentQIndex].marks} Marks</Badge>
                    </div>
                  }
                  subtitle={`${activeTest.questions[currentQIndex].subject} · ${activeTest.questions[currentQIndex].topic}`}
                  actions={
                    <Button
                      variant={responses[currentQIndex]?.markedForReview ? 'accent' : 'secondary'}
                      size="sm"
                      onClick={toggleMarkForReview}
                      icon={<Bookmark size={13} />}
                    >
                      {responses[currentQIndex]?.markedForReview ? 'Marked for Review' : 'Mark for Review'}
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-content-primary dark:text-content-primary-dark leading-relaxed">
                      {activeTest.questions[currentQIndex].questionText}
                    </p>

                    {activeTest.questions[currentQIndex].diagram && (
                      <div className="p-3 border rounded bg-surface-raised dark:bg-surface-raised-dark flex items-center justify-center">
                        {renderTechnicalDiagram(activeTest.questions[currentQIndex].diagram?.kind || 'none')}
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      {activeTest.questions[currentQIndex].options.map((opt, optIdx) => {
                        const isChosen = responses[currentQIndex]?.selectedOptionIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`p-3 rounded-md border flex items-center gap-3 cursor-pointer text-xs transition-colors ${
                              isChosen
                                ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/40 text-slate-900 dark:text-rose-100 font-medium'
                                : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                              isChosen ? 'bg-[#e11d48] text-white' : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation bottom */}
                    <div className="flex justify-between pt-4 border-t border-border dark:border-border-dark mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentQIndex === 0}
                        onClick={() => jumpToQuestion(currentQIndex - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentQIndex === activeTest.questions.length - 1}
                        onClick={() => jumpToQuestion(currentQIndex + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Panel>
              ) : null}
            </div>

            {/* Question Palette & Legend (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <Panel
                title="Question Palette"
                subtitle="Station state grid"
              >
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {activeTest.questions.map((_, idx) => {
                    const state = getPaletteState(idx);
                    const isCurrent = currentQIndex === idx;

                    const bgClasses = {
                      answered: 'bg-cyan-600 text-white border-cyan-700',
                      not_answered: 'bg-rose-500 text-white border-rose-600',
                      marked: 'bg-amber-500 text-white border-amber-600',
                      ans_marked: 'bg-purple-600 text-white border-purple-700',
                      not_visited: 'bg-white dark:bg-surface-dark text-content-secondary border-border dark:border-border-dark'
                    };

                    return (
                      <button
                        key={idx}
                        onClick={() => jumpToQuestion(idx)}
                        className={`h-9 rounded font-mono text-xs font-bold border transition-all ${bgClasses[state]} ${
                          isCurrent ? 'ring-2 ring-[#e11d48] ring-offset-2' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Palette Legend */}
                <div className="space-y-1.5 text-[11px] pt-3 border-t border-border dark:border-border-dark">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-cyan-600 inline-block shrink-0" />
                    <span>Answered ({responses.filter(r => r.selectedOptionIndex !== null && !r.markedForReview).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block shrink-0" />
                    <span>Not Answered ({responses.filter((r, i) => visited[i] && r.selectedOptionIndex === null && !r.markedForReview).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block shrink-0" />
                    <span>Marked for Review ({responses.filter(r => r.markedForReview && r.selectedOptionIndex === null).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-purple-600 inline-block shrink-0" />
                    <span>Answered + Marked ({responses.filter(r => r.markedForReview && r.selectedOptionIndex !== null).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 inline-block shrink-0" />
                    <span>Not Visited ({visited.filter(v => !v).length})</span>
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          {/* Submission Warning Dialog */}
          <Modal
            isOpen={showSubmitConfirm}
            onClose={() => setShowSubmitConfirm(false)}
            title="Confirm Examination Submission"
            subtitle="Verify unanswered questions before closing attempt."
          >
            <div className="space-y-3 text-xs">
              <p className="leading-relaxed">
                You have answered <strong>{responses.filter(r => r.selectedOptionIndex !== null).length}</strong> out of <strong>{activeTest.questions.length}</strong> questions.
              </p>
              {responses.some(r => r.selectedOptionIndex === null) && (
                <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  Warning: <strong>{responses.filter(r => r.selectedOptionIndex === null).length}</strong> question(s) remain unanswered!
                </div>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" onClick={() => setShowSubmitConfirm(false)}>
                  Resume Exam
                </Button>
                <Button variant="accent" size="sm" onClick={handleSubmitAttempt}>
                  Submit & Calculate Result
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* COMPLETED ATTEMPT RESULTS VIEW */}
      {completedAttempt && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-lg text-content-primary dark:text-content-primary-dark">
                Supervised Attempt Evaluation Dossier
              </h3>
              <p className="text-xs text-content-secondary">
                Candidate: {completedAttempt.studentName} [Roll: {completedAttempt.studentRoll}] · {completedAttempt.testTitle}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCompletedAttempt(null)}
              icon={<RotateCcw size={14} />}
            >
              Back to Station Dispatch
            </Button>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Panel title="Score Achieved">
              <span className="font-mono text-2xl font-bold text-[#e11d48] dark:text-[#fb7185] tabular-nums">
                {completedAttempt.score} pts
              </span>
              <p className="text-[11px] text-content-secondary mt-1">Accuracy: {completedAttempt.percent}%</p>
            </Panel>
            <Panel title="Integrity Incidents">
              <span className={`font-mono text-2xl font-bold tabular-nums ${completedAttempt.proctorFlags.length === 0 ? 'text-cyan-600' : 'text-rose-600'}`}>
                {completedAttempt.proctorFlags.length}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">Fullscreen / tab changes</p>
            </Panel>
            <Panel title="Duration Taken">
              <span className="font-mono text-2xl font-bold tabular-nums">
                {Math.round(completedAttempt.timeSpentSeconds / 60)} min
              </span>
              <p className="text-[11px] text-content-secondary mt-1">Supervised terminal</p>
            </Panel>
            <Panel title="Subject Breakdown">
              {Object.entries(completedAttempt.subjectAccuracy).map(([subj, stats]) => (
                <div key={subj} className="flex justify-between text-xs py-0.5">
                  <span className="text-content-secondary">{subj}:</span>
                  <span className="font-mono font-bold">{stats.percent}%</span>
                </div>
              ))}
            </Panel>
          </div>

          {/* Integrity Flags List */}
          {completedAttempt.proctorFlags.length > 0 && (
            <Panel title="Logged Proctoring Incident Flags">
              <div className="space-y-1.5 text-xs">
                {completedAttempt.proctorFlags.map((flag, idx) => (
                  <div key={idx} className="p-2 rounded bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 flex justify-between">
                    <div>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-300 mr-2">[{flag.type}]</span>
                      <span>{flag.detail}</span>
                    </div>
                    <span className="font-mono text-[10px] text-content-secondary">{flag.timestamp}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Question-by-Question Review with Teacher's Explanation */}
          <Panel
            title="Question-by-Question Dissection"
            subtitle="Comparing candidate response against teacher's keyed answer with solution derivation"
          >
            <div className="space-y-4">
              {tests.find(t => t.id === completedAttempt.testId)?.questions.map((q, idx) => {
                const userChoice = completedAttempt.responses[idx]?.selectedOptionIndex;
                const isCorrect = userChoice === q.correctOptionIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                      isCorrect
                        ? 'border-cyan-300 dark:border-cyan-900 bg-cyan-50/20 dark:bg-cyan-950/10'
                        : userChoice !== null
                        ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                        : 'border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">
                        Q{idx + 1}. {q.subject} · {q.topic}
                      </span>
                      <Badge variant={isCorrect ? 'teal' : userChoice !== null ? 'rose' : 'slate'}>
                        {isCorrect ? 'Correct' : userChoice !== null ? 'Incorrect' : 'Unattempted'}
                      </Badge>
                    </div>

                    <p className="font-medium text-content-primary dark:text-content-primary-dark">{q.questionText}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-white dark:bg-surface-dark border">
                        <span className="text-content-secondary block">Candidate Answer:</span>
                        <span className="font-bold">
                          {userChoice !== null ? `${String.fromCharCode(65 + userChoice)}) ${q.options[userChoice]}` : 'None'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-surface-dark border">
                        <span className="text-content-secondary block">Faculty Keyed Answer:</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-400">
                          {String.fromCharCode(65 + q.correctOptionIndex)}) {q.options[q.correctOptionIndex]}
                        </span>
                      </div>
                    </div>

                    {q.solutionExplanation && (
                      <div className="p-2 rounded bg-white dark:bg-surface-dark border text-[11px] leading-relaxed">
                        <span className="font-bold text-content-secondary block mb-0.5">Faculty Explanation:</span>
                        {q.solutionExplanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};
