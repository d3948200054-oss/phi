import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { QuestionDraft } from '../../types';
import { runQuestionChecks } from '../../utils/questionChecks';
import { renderTechnicalDiagram } from '../../utils/diagrams';
import { Search, Trash2, Edit3, Save, CheckCircle, HelpCircle, Copy } from 'lucide-react';

export const QuestionBankSurface: React.FC = () => {
  const { questions, updateQuestion, deleteQuestion, addQuestions } = useTeachDeskStore();

  const [searchStem, setSearchStem] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);

  // Edit in-place state
  const currentQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];
  const [editStem, setEditStem] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editKey, setEditKey] = useState<number>(0);
  const [editMarks, setEditMarks] = useState<number>(4);
  const [editExplanation, setEditExplanation] = useState<string>('');

  React.useEffect(() => {
    if (currentQuestion) {
      setEditStem(currentQuestion.questionText);
      setEditOptions([...currentQuestion.options]);
      setEditKey(currentQuestion.correctOptionIndex);
      setEditMarks(currentQuestion.marks);
      setEditExplanation(currentQuestion.solutionExplanation || '');
      setIsEditing(false);
    }
  }, [currentQuestion?.id]);

  // Extract distinct topics
  const topics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchStem.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesTopic = topicFilter === 'all' || q.topic === topicFilter;
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesTopic && matchesDifficulty;
  });

  const handleSaveInPlace = async () => {
    if (!currentQuestion) return;
    const updated: QuestionDraft = {
      ...currentQuestion,
      questionText: editStem,
      options: editOptions,
      correctOptionIndex: editKey,
      marks: editMarks,
      solutionExplanation: editExplanation,
    };
    updated.checks = runQuestionChecks(updated);
    await updateQuestion(updated);
    setIsEditing(false);
  };

  const handleDuplicateToBank = async (q: QuestionDraft) => {
    const duplicated: QuestionDraft = {
      ...q,
      id: 'q_dup_' + Math.random().toString(36).substring(2, 9),
      questionText: `(Copy) ${q.questionText}`,
      createdAt: new Date().toISOString()
    };
    duplicated.checks = runQuestionChecks(duplicated);
    await addQuestions([duplicated]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
          Central Question Bank Repository
        </h2>
        <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
          Comprehensive curriculum question inventory with search within stems and in-place editing.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-2.5 text-content-secondary" />
          <input
            type="text"
            placeholder="Search inside question stem text..."
            value={searchStem}
            onChange={(e) => setSearchStem(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none"
          >
            <option value="all">All Topics</option>
            {topics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Split Pane: Questions List Left (5 cols), In-Place Inspector/Editor Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Filtered List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold uppercase text-content-secondary tracking-wider">
              Matches ({filteredQuestions.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredQuestions.map((q, idx) => {
              const isSelected = q.id === (currentQuestion?.id || '');
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#e11d48] dark:border-rose-500 bg-rose-50 dark:bg-[rgba(225,29,72,0.12)] border-l-4 border-l-[#e11d48] dark:border-l-rose-500'
                      : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-content-secondary">
                      Q{idx + 1} · {q.subject}
                    </span>
                    <Badge variant={q.difficulty === 'hard' ? 'rose' : q.difficulty === 'medium' ? 'amber' : 'teal'}>
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className="font-medium text-content-primary dark:text-content-primary-dark line-clamp-2 leading-relaxed">
                    {q.questionText}
                  </p>
                  <div className="mt-2 pt-2 border-t border-border/50 dark:border-border-dark/50 flex justify-between text-[10px] text-content-secondary font-mono">
                    <span>{q.topic}</span>
                    <span>Key: {String.fromCharCode(65 + q.correctOptionIndex)} ({q.marks}M)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: In-Place Editor and Diagnostic Details */}
        {currentQuestion && (
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title={isEditing ? 'Edit Question In-Place' : 'Question Inspection'}
              subtitle={`${currentQuestion.subject} · ${currentQuestion.topic} · Marks: ${currentQuestion.marks}`}
              badge={<Badge variant="indigo">Key: {String.fromCharCode(65 + currentQuestion.correctOptionIndex)}</Badge>}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateToBank(currentQuestion)}
                    icon={<Copy size={13} />}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this question permanently from bank?')) {
                        deleteQuestion(currentQuestion.id);
                      }
                    }}
                    icon={<Trash2 size={13} className="text-rose-600" />}
                  >
                    Delete
                  </Button>
                  {isEditing ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveInPlace}
                      icon={<Save size={13} />}
                    >
                      Save Updates
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      icon={<Edit3 size={13} />}
                    >
                      Edit In-Place
                    </Button>
                  )}
                </div>
              }
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                      Question Stem
                    </span>
                    <textarea
                      rows={3}
                      value={editStem}
                      onChange={(e) => setEditStem(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block">
                      Options & Keyed Answer
                    </span>
                    {editOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <label className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold border cursor-pointer ${
                          editKey === i ? 'bg-[#e11d48] text-white' : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
                        }`}>
                          <input
                            type="radio"
                            name="editKeyChoice"
                            checked={editKey === i}
                            onChange={() => setEditKey(i)}
                            className="sr-only"
                          />
                          {String.fromCharCode(65 + i)}
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...editOptions];
                            copy[i] = e.target.value;
                            setEditOptions(copy);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark"
                        />
                      </div>
                    ))}
                  </div>

                  <Field
                    label="Solution Explanation"
                    value={editExplanation}
                    onChange={(e) => setEditExplanation(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                      Stem Text
                    </span>
                    <p className="p-3 bg-surface-raised dark:bg-surface-raised-dark rounded border border-border dark:border-border-dark font-medium leading-relaxed text-content-primary dark:text-content-primary-dark">
                      {currentQuestion.questionText}
                    </p>
                  </div>

                  {currentQuestion.diagram && currentQuestion.diagram.kind !== 'none' && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                        Diagram ({currentQuestion.diagram.kind})
                      </span>
                      <div className="p-3 border rounded bg-surface-raised dark:bg-surface-raised-dark flex items-center justify-center">
                        {renderTechnicalDiagram(currentQuestion.diagram.kind)}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1.5">
                      Choices
                    </span>
                    <div className="space-y-1.5">
                      {currentQuestion.options.map((opt, i) => {
                        const isCorrect = currentQuestion.correctOptionIndex === i;
                        return (
                          <div
                            key={i}
                            className={`p-2 rounded border flex items-center gap-2.5 ${
                              isCorrect
                                ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 font-medium'
                                : 'border-border/60 dark:border-border-dark/60 bg-white dark:bg-surface-dark'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded font-mono text-[11px] font-bold flex items-center justify-center ${
                              isCorrect ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-content-secondary'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <Badge variant="teal">Keyed Correct</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {currentQuestion.solutionExplanation && (
                    <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border border-border dark:border-border-dark">
                      <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                        Explanation
                      </span>
                      <p className="leading-relaxed text-content-primary dark:text-content-primary-dark">
                        {currentQuestion.solutionExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
};
