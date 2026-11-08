import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Sparkles, CheckCircle2, RotateCcw, Flame } from 'lucide-react';

export const DailyWarmupSurface: React.FC = () => {
  const { dailyWarmup, completeWarmup, resetWarmup } = useTeachDeskStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  if (!dailyWarmup || dailyWarmup.questions.length === 0) {
    return (
      <Panel title="Daily Warm-up Scaffold">
        <p className="text-xs text-content-secondary">
          No questions in warm-up pool. Add questions to the Question Bank to populate the daily five.
        </p>
      </Panel>
    );
  }

  const currentQ = dailyWarmup.questions[currentIdx];
  const userChoice = selectedAnswers[currentIdx];
  const isExpVisible = showExplanation[currentIdx];

  const handleSelect = (optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
    setShowExplanation(prev => ({ ...prev, [currentIdx]: true }));

    // If all 5 questions answered, trigger completion
    const nextAnswers = { ...selectedAnswers, [currentIdx]: optIdx };
    if (Object.keys(nextAnswers).length >= dailyWarmup.questions.length && !dailyWarmup.completed) {
      completeWarmup();
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanation({});
    setCurrentIdx(0);
    resetWarmup();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
              Daily Warm-up Practice Drill
            </h2>
            <Badge variant="indigo">STABLE FOR {dailyWarmup.date}</Badge>
          </div>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Five daily questions curated from verified lecture chapters and syllabus weak topics.
          </p>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-300 font-mono text-xs font-bold">
          <Flame size={16} className="text-orange-600 dark:text-orange-400 stroke-[2.2]" />
          <span>{dailyWarmup.streak} DAY STREAK</span>
        </div>
      </div>

      {/* Question Stepper Indicator */}
      <div className="flex items-center justify-between gap-2">
        {dailyWarmup.questions.map((_: any, i: number) => {
          const isAnswered = selectedAnswers[i] !== undefined;
          const isCurrent = currentIdx === i;
          return (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`flex-1 h-2 rounded-full transition-all ${
                isCurrent
                  ? 'bg-[#e11d48] ring-2 ring-rose-400 ring-offset-2'
                  : isAnswered
                  ? 'bg-cyan-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              title={`Question ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Main Question Panel */}
      {currentQ && (
        <Panel
          title={`Question ${currentIdx + 1} of ${dailyWarmup.questions.length}`}
          subtitle={`${currentQ.subject} · Topic: ${currentQ.topic}`}
          badge={<Badge variant="indigo">{currentQ.difficulty.toUpperCase()}</Badge>}
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw size={13} />}
            >
              Reset Session
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-sm font-medium text-content-primary dark:text-content-primary-dark leading-relaxed">
              {currentQ.questionText}
            </p>

            <div className="space-y-2 pt-2">
              {currentQ.options.map((opt: string, i: number) => {
                const isChosen = userChoice === i;
                const isCorrect = currentQ.correctOptionIndex === i;

                let stateClass = 'border-border dark:border-border-dark bg-white dark:bg-surface-dark hover:bg-slate-50';
                if (userChoice !== undefined) {
                  if (isCorrect) {
                    stateClass = 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 font-medium';
                  } else if (isChosen) {
                    stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200';
                  }
                }

                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`p-3 rounded-md border flex items-center gap-3 cursor-pointer transition-colors ${stateClass}`}
                  >
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isChosen ? 'bg-[#e11d48] text-white' : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {userChoice !== undefined && isCorrect && (
                      <Badge variant="teal">Correct Key</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inline Explanation after answer */}
            {isExpVisible && currentQ.solutionExplanation && (
              <div className="p-3.5 rounded-lg bg-surface-raised dark:bg-surface-raised-dark border border-border dark:border-border-dark space-y-1 animate-fade-in">
                <span className="text-[10px] font-bold uppercase text-content-secondary block">
                  Concept Derivation & Explanation:
                </span>
                <p className="leading-relaxed text-content-primary dark:text-content-primary-dark">
                  {currentQ.solutionExplanation}
                </p>
              </div>
            )}

            {/* Stepper Buttons */}
            <div className="flex justify-between pt-4 border-t border-border dark:border-border-dark">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
              >
                Previous
              </Button>

              {currentIdx < dailyWarmup.questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                >
                  Next Question
                </Button>
              ) : (
                <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold self-center">
                  {dailyWarmup.completed ? '✓ Warmup Completed Today' : 'Answer all to finish'}
                </span>
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
};
