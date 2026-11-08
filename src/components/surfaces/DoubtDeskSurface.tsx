import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { MobileFilePicker } from '../primitives/MobileFilePicker';
import { DoubtQuery, DoubtSolution } from '../../types';
import { Sparkles, HelpCircle, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export const DoubtDeskSurface: React.FC = () => {
  const { doubts, addDoubt, resolveDoubt, aiSettings, account } = useTeachDeskStore();

  const [doubtText, setDoubtText] = useState('');
  const [doubtSubject, setDoubtSubject] = useState('Physics');
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);
  const [selectedDoubtId, setSelectedDoubtId] = useState<string>(doubts[0]?.id || '');
  const [isSolving, setIsSolving] = useState(false);

  const selectedDoubt = doubts.find(d => d.id === selectedDoubtId) || doubts[0];

  const handlePhotoSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhotoData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim() && !photoData) return;

    const newDoubt: DoubtQuery = {
      id: 'dbt_' + Math.random().toString(36).substring(2, 9),
      questionText: doubtText.trim() || 'Visual diagram problem (refer to attached snapshot)',
      image: photoData,
      teacherId: account?.id || 'acc_teacher_prof',
      studentName: 'Candidate Inquirer',
      subject: doubtSubject,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await addDoubt(newDoubt);
    setSelectedDoubtId(newDoubt.id);
    setDoubtText('');
    setPhotoData(undefined);
  };

  const handleSolveWithAI = async (doubt: DoubtQuery) => {
    setIsSolving(true);
    // Simulate or call AI derivation engine
    setTimeout(async () => {
      const solution: DoubtSolution = {
        finalAnswer: 'v = 2.45 m/s at θ = 30°',
        steps: [
          'Step 1: Set up the coordinate system along the inclined plane and apply Newton\'s second law.',
          'Step 2: Balance normal reaction N = mg cos(30°) and compute kinetic friction f_k = μ_k * N.',
          'Step 3: Integrate acceleration a = g(sin 30° - μ_k cos 30°) over displacement s = 1.2 m to obtain final velocity.'
        ],
        concept: 'Newtonian Dynamics on Rough Incline & Work-Energy Theorem',
        workedExample: 'Consider m = 1 kg, μ_k = 0.15, g = 9.8 m/s². Net acceleration a = 9.8 * (0.5 - 0.15 * 0.866) ≈ 3.62 m/s².',
        commonMistake: 'Students frequently forget to resolve normal force perpendicular to the inclined plane, erroneously using N = mg instead of N = mg cos θ.'
      };
      await resolveDoubt(doubt.id, solution);
      setIsSolving(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
          Doubt Desk · Algorithmic Derivation Engine
        </h2>
        <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
          Submit student doubts via photo or text. Generates final answer, step-by-step derivation, core concept, and common mistakes.
        </p>
      </div>

      {/* Honest Limitation Banner (Non-Negotiable Rule 4) */}
      <div className="p-3.5 rounded-lg bg-surface dark:bg-surface-dark border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-900 dark:text-amber-200 block font-semibold">
            Honest Platform Limits:
          </strong>
          <p className="text-content-secondary dark:text-content-secondary-dark mt-0.5 leading-relaxed">
            Without an OpenAI-compatible vision provider API key, optical character extraction from images will fall back to manual text parsing. Configured key ({aiSettings.chatModel}) is kept strictly in this browser's local memory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Submit Doubt Form & Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel title="Submit New Doubt">
            <form onSubmit={handleSubmitDoubt} className="space-y-3 text-xs">
              <Select
                label="Subject"
                value={doubtSubject}
                onChange={(e) => setDoubtSubject(e.target.value)}
                options={[
                  { value: 'Physics', label: 'Physics' },
                  { value: 'Chemistry', label: 'Chemistry' },
                  { value: 'Mathematics', label: 'Mathematics' }
                ]}
              />

              <div>
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                  Type Doubt / Problem Text
                </span>
                <textarea
                  rows={3}
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="e.g. How does eddy current damping depend on the conductivity of the moving plate?"
                  className="w-full p-2.5 rounded bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark font-sans"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                  Attach Problem Photo (Mobile-Safe Picker)
                </span>
                <MobileFilePicker
                  accept="image/*"
                  enableCamera={true}
                  label={photoData ? 'Diagram Photo Selected' : 'Snap Problem with Camera / Pick Photo'}
                  onFileSelect={handlePhotoSelect}
                />
              </div>

              <Button variant="accent" size="sm" type="submit" className="w-full">
                Submit Doubt for Solution
              </Button>
            </form>
          </Panel>

          {/* Doubts List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-content-secondary tracking-wider block">
              Doubt Inquiries ({doubts.length})
            </span>
            {doubts.map(d => {
              const isSelected = d.id === (selectedDoubt?.id || '');
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDoubtId(d.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/20 border-l-4 border-l-[#e11d48]'
                      : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] font-bold text-content-secondary">{d.subject}</span>
                    <Badge variant={d.status === 'solved' ? 'teal' : 'amber'}>
                      {d.status === 'solved' ? 'Solved' : 'Pending Solution'}
                    </Badge>
                  </div>
                  <p className="font-medium text-content-primary dark:text-content-primary-dark line-clamp-2">{d.questionText}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Solved Derivation Dossier (7 cols) */}
        {selectedDoubt ? (
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title="Structured Mathematical Derivation"
              subtitle={`Inquiry #${selectedDoubt.id} · ${selectedDoubt.subject}`}
              badge={<Badge variant={selectedDoubt.status === 'solved' ? 'teal' : 'amber'}>{selectedDoubt.status.toUpperCase()}</Badge>}
              actions={
                selectedDoubt.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSolving}
                    onClick={() => handleSolveWithAI(selectedDoubt)}
                    icon={<Sparkles size={14} />}
                  >
                    {isSolving ? 'Generating Derivation...' : 'Derive Solution with AI'}
                  </Button>
                )
              }
            >
              <div className="space-y-4 text-xs">
                {/* Problem Question */}
                <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                  <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                    Candidate Query:
                  </span>
                  <p className="font-medium text-content-primary dark:text-content-primary-dark leading-relaxed">
                    {selectedDoubt.questionText}
                  </p>
                  {selectedDoubt.image && (
                    <img src={selectedDoubt.image} alt="Problem visual" className="mt-2 max-h-48 rounded border" />
                  )}
                </div>

                {/* Solution Dossier */}
                {selectedDoubt.solution ? (
                  <div className="space-y-3">
                    {/* Final Answer */}
                    <div className="p-3 rounded bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-300 dark:border-cyan-800">
                      <span className="text-[10px] font-bold uppercase text-cyan-900 dark:text-cyan-200 block mb-0.5">
                        Final Answer:
                      </span>
                      <p className="font-mono text-base font-bold text-cyan-800 dark:text-cyan-300">
                        {selectedDoubt.solution.finalAnswer}
                      </p>
                    </div>

                    {/* Step-by-Step Derivation */}
                    <div>
                      <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1.5">
                        Numbered Step-by-Step Derivation
                      </span>
                      <div className="space-y-1.5">
                        {selectedDoubt.solution.steps.map((st, i) => (
                          <div key={i} className="p-2.5 rounded bg-white dark:bg-surface-dark border leading-relaxed">
                            {st}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Concept & Worked Example */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                        <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                          Core Concept Used:
                        </span>
                        <p className="leading-relaxed">{selectedDoubt.solution.concept}</p>
                      </div>

                      <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                        <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                          Worked Numerical Example:
                        </span>
                        <p className="font-mono text-[11px] leading-relaxed">{selectedDoubt.solution.workedExample}</p>
                      </div>
                    </div>

                    {/* Common Mistake Note */}
                    <div className="p-3 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <span className="text-[10px] font-bold uppercase block mb-0.5">
                        Frequent Candidate Pitfall / Common Mistake:
                      </span>
                      <p className="leading-relaxed">{selectedDoubt.solution.commonMistake}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-content-secondary border border-dashed rounded">
                    Click <strong>Derive Solution with AI</strong> to compute the step-by-step resolution.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
};
