import React, { useState, useEffect } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { DiagramKind, QuestionDraft, Test } from '../../types';
import { runQuestionChecks, validateQuestionSet } from '../../utils/questionChecks';
import { renderTechnicalDiagram } from '../../utils/diagrams';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  Trash2,
  Plus,
  Send,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export const ReviewDeskSurface: React.FC = () => {
  const {
    questions,
    updateQuestion,
    deleteQuestion,
    approveQuestion,
    rejectQuestion,
    addTest,
    cohorts,
    institute,
    account,
    setActiveTab
  } = useTeachDeskStore();

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Currently selected question
  const currentQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

  // Local editor draft for the selected question
  const [editorStem, setEditorStem] = useState('');
  const [editorOptions, setEditorOptions] = useState<string[]>([]);
  const [editorKey, setEditorKey] = useState<number>(0);
  const [editorExplanation, setEditorExplanation] = useState('');
  const [editorHint, setEditorHint] = useState('');
  const [editorTopic, setEditorTopic] = useState('');
  const [editorDifficulty, setEditorDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [editorMarks, setEditorMarks] = useState(4);
  const [editorNegativeMarks, setEditorNegativeMarks] = useState(1);
  const [editorDiagramKind, setEditorDiagramKind] = useState<DiagramKind>('none');

  // Paper release policy
  const [releaseTitle, setReleaseTitle] = useState('Unit Test Assessment · Wave & Electrodynamics');
  const [releaseCourse, setReleaseCourse] = useState(institute.courses[0]?.name || 'JEE Advanced');
  const [releaseCohort, setReleaseCohort] = useState(cohorts[0]?.id || '');
  const [releaseDuration, setReleaseDuration] = useState(60);
  const [releaseProctoring, setReleaseProctoring] = useState(true);
  const [showOMRGrid, setShowOMRGrid] = useState(false);

  // Sync editor whenever selectedQuestionId changes
  useEffect(() => {
    if (currentQuestion) {
      setEditorStem(currentQuestion.questionText);
      setEditorOptions([...currentQuestion.options]);
      setEditorKey(currentQuestion.correctOptionIndex);
      setEditorExplanation(currentQuestion.solutionExplanation || '');
      setEditorHint(currentQuestion.hint || '');
      setEditorTopic(currentQuestion.topic || 'Mechanics');
      setEditorDifficulty(currentQuestion.difficulty || 'medium');
      setEditorMarks(currentQuestion.marks || 4);
      setEditorNegativeMarks(currentQuestion.negativeMarks || 1);
      setEditorDiagramKind(currentQuestion.diagram?.kind || 'none');
    }
  }, [currentQuestion?.id]);

  // Dynamic live checks on the current editor state
  const liveDraft: Partial<QuestionDraft> = {
    ...currentQuestion,
    questionText: editorStem,
    options: editorOptions,
    correctOptionIndex: editorKey,
    solutionExplanation: editorExplanation,
    hint: editorHint,
    topic: editorTopic,
    difficulty: editorDifficulty,
    marks: editorMarks,
    negativeMarks: editorNegativeMarks,
    diagram: editorDiagramKind !== 'none' ? { kind: editorDiagramKind } : undefined,
  };
  const liveChecks = runQuestionChecks(liveDraft);
  const hasFailingCheck = liveChecks.some(c => c.status === 'fail');
  const failingCheckReasons = liveChecks.filter(c => c.status === 'fail').map(c => `${c.label}: ${c.detail}`);

  // Set-level validation
  const setValidation = validateQuestionSet(questions);

  const handleSaveQuestionChanges = async () => {
    if (!currentQuestion) return;
    const updated: QuestionDraft = {
      ...currentQuestion,
      questionText: editorStem,
      options: editorOptions,
      correctOptionIndex: editorKey,
      solutionExplanation: editorExplanation,
      hint: editorHint,
      topic: editorTopic,
      difficulty: editorDifficulty,
      marks: editorMarks,
      negativeMarks: editorNegativeMarks,
      diagram: editorDiagramKind !== 'none' ? { kind: editorDiagramKind } : undefined,
      checks: liveChecks,
      reviewStatus: currentQuestion.reviewStatus === 'pending' ? 'corrected' : currentQuestion.reviewStatus
    };
    await updateQuestion(updated);
  };

  const handleApproveCurrent = async () => {
    if (!currentQuestion || hasFailingCheck) return;
    // Auto-save any editor edits first
    await handleSaveQuestionChanges();
    await approveQuestion(currentQuestion.id);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...editorOptions];
    updated[idx] = val;
    setEditorOptions(updated);
  };

  const addOption = () => {
    setEditorOptions(prev => [...prev, `Option ${String.fromCharCode(65 + prev.length)}`]);
  };

  const removeOption = (idx: number) => {
    if (editorOptions.length <= 2) return;
    const updated = editorOptions.filter((_, i) => i !== idx);
    setEditorOptions(updated);
    if (editorKey >= updated.length) {
      setEditorKey(updated.length - 1);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filterStatus === 'all') return true;
    return q.reviewStatus === filterStatus;
  });

  const handlePublishPaper = async () => {
    // Non-Negotiable Rule 2: A failing check anywhere blocks publishing the whole paper
    const approvedList = questions.filter(q => q.reviewStatus === 'approved');
    if (approvedList.length === 0) {
      alert('Cannot publish paper: At least one approved question is required.');
      return;
    }

    const brokenQuestion = approvedList.find(q => q.checks.some(c => c.status === 'fail'));
    if (brokenQuestion) {
      alert(`Publishing blocked by rule #2: Question "${brokenQuestion.questionText.slice(0, 30)}..." has a failing check.`);
      return;
    }

    const totalMarks = approvedList.reduce((sum, q) => sum + q.marks, 0);

    const newTest: Test = {
      id: 'test_' + Math.random().toString(36).substring(2, 9),
      title: releaseTitle.trim(),
      course: releaseCourse,
      cohortId: releaseCohort,
      durationMinutes: releaseDuration,
      totalMarks,
      passingMarks: Math.round(totalMarks * 0.4),
      negativeMarking: true,
      questions: approvedList,
      publishedAt: new Date().toISOString(),
      isLive: true,
      creatorId: account?.id || 'acc_teacher_prof',
      creatorName: account?.name || 'Faculty Member',
      subject: approvedList[0]?.subject || 'Physics'
    };

    await addTest(newTest);
    setActiveTab('sessions');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Paper Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
              Review Desk · Double-Check Queue
            </h2>
            <Badge variant="indigo">RULE #2 ENFORCED</Badge>
          </div>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Human verification gate: failing algorithmic checks permanently disable approval and block test release.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowOMRGrid(!showOMRGrid)}
          >
            {showOMRGrid ? 'Hide OMR Key' : 'OMR Bubble Sheet Key'}
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={handlePublishPaper}
            icon={<Send size={13} />}
          >
            Create & Release Test
          </Button>
        </div>
      </div>

      {/* OMR Bubble Sheet Grid Modal / Panel */}
      {showOMRGrid && (
        <Panel
          title="Physical Answer Sheet (OMR) Key Entry"
          subtitle="Match physical bubble sheets against the active review queue."
        >
          <div className="flex flex-wrap gap-4 py-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-2 border border-border dark:border-border-dark p-2 rounded bg-surface-raised dark:bg-surface-raised-dark">
                <span className="font-mono text-xs font-bold text-content-secondary w-6">
                  Q{idx + 1}
                </span>
                <div className="flex gap-1">
                  {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                    <button
                      key={letter}
                      onClick={async () => {
                        const updated = { ...q, correctOptionIndex: optIdx };
                        updated.checks = runQuestionChecks(updated);
                        await updateQuestion(updated);
                      }}
                      className={`w-6 h-6 rounded-full font-mono text-[11px] font-bold border transition-colors ${
                        q.correctOptionIndex === optIdx
                          ? 'bg-[#e11d48] text-white border-[#be123c]'
                          : 'bg-white dark:bg-surface-dark border-border dark:border-border-dark text-content-primary hover:border-[#e11d48]/40'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Paper Set-Level Health Bar */}
      <div className="p-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-content-secondary">Total in Paper:</span>
            <span className="font-mono font-bold text-content-primary dark:text-content-primary-dark">
              {questions.length} questions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-content-secondary">Approved:</span>
            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400">
              {questions.filter(q => q.reviewStatus === 'approved').length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-content-secondary">Failing Checks:</span>
            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
              {questions.filter(q => q.checks.some(c => c.status === 'fail')).length}
            </span>
          </div>
        </div>

        {/* Answer key spread */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-content-secondary tracking-wider">
            Key Distribution:
          </span>
          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            A:{setValidation.spread.A} · B:{setValidation.spread.B} · C:{setValidation.spread.C} · D:{setValidation.spread.D}
          </span>
          {setValidation.duplicateCount > 0 && (
            <Badge variant="rose">{setValidation.duplicateCount} Duplicate Stem(s)</Badge>
          )}
        </div>
      </div>

      {/* SPLIT PANE WORKSPACE: List Left (5 cols), Editor Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Pending ({questions.filter(q => q.reviewStatus === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterStatus === 'approved'
                    ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Approved ({questions.filter(q => q.reviewStatus === 'approved').length})
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredQuestions.map((q, idx) => {
              const isSelected = q.id === selectedQuestionId;
              const hasFail = q.checks.some(c => c.status === 'fail');
              const hasWarn = q.checks.some(c => c.status === 'warn');

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#e11d48] dark:border-[#fb7185] bg-rose-50/60 dark:bg-rose-950/20 border-l-4 border-l-[#e11d48] dark:border-l-[#fb7185] shadow-xs'
                      : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-content-primary dark:text-content-primary-dark">
                        #{idx + 1}
                      </span>
                      {q.reviewStatus === 'approved' ? (
                        <Badge variant="teal">Approved</Badge>
                      ) : q.reviewStatus === 'rejected' ? (
                        <Badge variant="rose">Rejected</Badge>
                      ) : hasFail ? (
                        <Badge variant="rose">Failing Check</Badge>
                      ) : hasWarn ? (
                        <Badge variant="amber">Review Warnings</Badge>
                      ) : (
                        <Badge variant="slate">Pending Review</Badge>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-content-secondary">
                      Key: {q.correctOptionIndex >= 0 ? String.fromCharCode(65 + q.correctOptionIndex) : 'None'}
                    </span>
                  </div>

                  <p className="font-medium text-content-primary dark:text-content-primary-dark line-clamp-2 leading-relaxed">
                    {q.questionText}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-border/50 dark:border-border-dark/50 flex items-center justify-between text-[10px] text-content-secondary">
                    <span>{q.subject} · {q.topic}</span>
                    <span className="font-mono">{q.confidence}% conf</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Question Editor & 12 Automated Verification Checks (7 cols) */}
        {currentQuestion && (
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title={
                <div className="flex items-center gap-2">
                  <span>Question Verification & Diagnostics</span>
                  {currentQuestion.reviewStatus === 'approved' && <Badge variant="teal">Approved</Badge>}
                </div>
              }
              subtitle="Inspect question text, verify keyed answer, examine automated quality checks, and attach diagrams."
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(currentQuestion.id)}
                    icon={<Trash2 size={13} className="text-rose-600" />}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveQuestionChanges}
                  >
                    Save Changes
                  </Button>
                  {/* NON-NEGOTIABLE RULE 2: A failing check disables Approve for that question */}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={hasFailingCheck}
                    onClick={handleApproveCurrent}
                    icon={<CheckCircle2 size={14} />}
                  >
                    Approve Question
                  </Button>
                </div>
              }
            >
              {/* Visible Failing Check Banner if Approve is disabled */}
              {hasFailingCheck && (
                <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5 stroke-[1.75]" />
                  <div>
                    <span className="font-bold block">
                      Rule #2 Block: Approve Action Disabled
                    </span>
                    <p className="mt-0.5">
                      This question cannot reach a student because it fails the following check(s):
                    </p>
                    <ul className="list-disc list-inside mt-1 font-mono text-[11px] space-y-0.5">
                      {failingCheckReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 12 Automated Checks Inspection Grid */}
              <div className="mb-5 p-3 rounded-lg bg-surface-raised dark:bg-surface-raised-dark border border-border dark:border-border-dark space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
                    Automated Inspection Engine (12 Quality Checks)
                  </span>
                  <span className="text-[11px] font-mono text-content-secondary">
                    {liveChecks.filter(c => c.status === 'pass').length} passed · {liveChecks.filter(c => c.status === 'warn').length} warnings · {liveChecks.filter(c => c.status === 'fail').length} failed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {liveChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-2 rounded border flex items-start gap-2 ${
                        check.status === 'pass'
                          ? 'border-border/60 dark:border-border-dark/60 bg-white/60 dark:bg-surface-dark/60 text-content-primary dark:text-content-primary-dark'
                          : check.status === 'warn'
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                          : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      {check.status === 'pass' && <CheckCircle2 size={14} className="text-cyan-600 shrink-0 mt-0.5 stroke-[1.75]" />}
                      {check.status === 'warn' && <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5 stroke-[1.75]" />}
                      {check.status === 'fail' && <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5 stroke-[1.75]" />}

                      <div className="min-w-0">
                        <span className="font-semibold text-[11px] block">{check.label}</span>
                        <p className="text-[10px] text-content-secondary dark:text-content-secondary-dark leading-tight">
                          {check.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Editor Fields */}
              <div className="space-y-4">
                {/* Stem */}
                <div>
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                    Question Stem
                  </span>
                  <textarea
                    rows={3}
                    value={editorStem}
                    onChange={(e) => setEditorStem(e.target.value)}
                    placeholder="Enter the full question stem..."
                    className="w-full p-2.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400 font-sans leading-relaxed"
                  />
                </div>

                {/* Technical Diagram Generation / Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
                      Technical Diagram
                    </span>
                    <div className="flex gap-1 text-[11px]">
                      {(['none', 'fbd', 'circuit', 'graph', 'wave', 'geometry', 'lens'] as DiagramKind[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setEditorDiagramKind(k)}
                          className={`px-2 py-0.5 rounded uppercase font-mono text-[10px] transition-colors ${
                            editorDiagramKind === k
                              ? 'bg-[#e11d48] text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-content-secondary hover:text-content-primary'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editorDiagramKind !== 'none' && (
                    <div className="p-3 border border-border dark:border-border-dark rounded-md bg-surface-raised dark:bg-surface-raised-dark flex items-center justify-center">
                      {renderTechnicalDiagram(editorDiagramKind)}
                    </div>
                  )}
                </div>

                {/* Options Choices */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
                      Options & Keyed Answer (Radio selects correct option)
                    </span>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-xs text-[#e11d48] dark:text-[#fb7185] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Choice
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editorOptions.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = editorKey === idx;

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <label
                            className={`flex items-center justify-center w-7 h-7 rounded border font-mono text-xs font-bold cursor-pointer transition-colors ${
                              isCorrect
                                ? 'bg-[#e11d48] text-white border-rose-700'
                                : 'bg-white dark:bg-surface-dark border-border dark:border-border-dark text-content-secondary hover:border-rose-300'
                            }`}
                            title="Set as correct keyed answer"
                          >
                            <input
                              type="radio"
                              name="keyedOption"
                              checked={isCorrect}
                              onChange={() => setEditorKey(idx)}
                              className="sr-only"
                            />
                            {letter}
                          </label>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />

                          {editorOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(idx)}
                              className="p-1 text-content-secondary hover:text-rose-600 transition-colors"
                              title="Delete option"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation & Hint */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                      Solution Explanation
                    </span>
                    <textarea
                      rows={3}
                      value={editorExplanation}
                      onChange={(e) => setEditorExplanation(e.target.value)}
                      placeholder="Step-by-step conceptual solution..."
                      className="w-full p-2.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400 font-sans"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                      Learner Hint (Optional)
                    </span>
                    <textarea
                      rows={3}
                      value={editorHint}
                      onChange={(e) => setEditorHint(e.target.value)}
                      placeholder="Formula reminder or clue..."
                      className="w-full p-2.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400 font-sans"
                    />
                  </div>
                </div>

                {/* Metadata & Marks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border dark:border-border-dark">
                  <Field
                    label="Topic"
                    value={editorTopic}
                    onChange={(e) => setEditorTopic(e.target.value)}
                  />
                  <Select
                    label="Difficulty"
                    value={editorDifficulty}
                    onChange={(e) => setEditorDifficulty(e.target.value as any)}
                    options={[
                      { value: 'easy', label: 'Easy' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'hard', label: 'Hard' }
                    ]}
                  />
                  <Field
                    label="Marks"
                    type="number"
                    value={editorMarks}
                    onChange={(e) => setEditorMarks(parseInt(e.target.value, 10) || 4)}
                  />
                  <Field
                    label="Neg. Marks"
                    type="number"
                    value={editorNegativeMarks}
                    onChange={(e) => setEditorNegativeMarks(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
};
