import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { Series, Test } from '../../types';
import { Layers, Plus, ArrowUp, ArrowDown, Trash2, CheckCircle, Clock } from 'lucide-react';

export const TestSeriesSurface: React.FC = () => {
  const {
    seriesList,
    addSeries,
    updateSeries,
    tests,
    cohorts,
    institute,
    account,
    setActiveTab
  } = useTeachDeskStore();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);

  // Form state
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [newSeriesCourse, setNewSeriesCourse] = useState(institute.courses[0]?.name || 'JEE Advanced');
  const [newSeriesCohort, setNewSeriesCohort] = useState(cohorts[0]?.id || '');

  const activeSeries = seriesList.find(s => s.id === selectedSeriesId) || seriesList[0];

  // Live computed metrics for the active series
  const seriesTests = activeSeries
    ? tests.filter(t => activeSeries.testIds.includes(t.id))
    : [];
  const totalSeriesMarks = seriesTests.reduce((sum, t) => sum + t.totalMarks, 0);
  const totalSeriesMinutes = seriesTests.reduce((sum, t) => sum + t.durationMinutes, 0);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) return;

    const s: Series = {
      id: 'ser_' + Math.random().toString(36).substring(2, 9),
      name: newSeriesName.trim(),
      description: newSeriesDesc.trim(),
      course: newSeriesCourse,
      cohortId: newSeriesCohort,
      testIds: tests.length > 0 ? [tests[0].id] : [],
      isPublished: true,
      creatorId: account?.id || 'acc_teacher_prof',
      creatorName: account?.name || 'Faculty Member',
      createdAt: new Date().toISOString()
    };

    await addSeries(s);
    setSelectedSeriesId(s.id);
    setIsNewSeriesModalOpen(false);
    setNewSeriesName('');
    setNewSeriesDesc('');
  };

  const handleMoveTest = async (idx: number, direction: 'up' | 'down') => {
    if (!activeSeries) return;
    const ids = [...activeSeries.testIds];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;

    const temp = ids[idx];
    ids[idx] = ids[targetIdx];
    ids[targetIdx] = temp;

    await updateSeries({
      ...activeSeries,
      testIds: ids
    });
  };

  const handleRemoveTest = async (testId: string) => {
    if (!activeSeries) return;
    await updateSeries({
      ...activeSeries,
      testIds: activeSeries.testIds.filter(id => id !== testId)
    });
  };

  const handleAttachExistingTest = async (testId: string) => {
    if (!activeSeries || activeSeries.testIds.includes(testId)) return;
    await updateSeries({
      ...activeSeries,
      testIds: [...activeSeries.testIds, testId]
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Test Series Management
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Curated ordered collections of mock exams with live summed marks and durations.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewSeriesModalOpen(true)}
          icon={<Plus size={14} />}
        >
          Create Test Series
        </Button>
      </div>

      {seriesList.length === 0 ? (
        <Panel title="No Test Series Created">
          <div className="text-center py-10 space-y-3">
            <Layers className="w-10 h-10 text-content-secondary mx-auto stroke-[1.5]" />
            <p className="text-xs text-content-secondary">
              No test series have been created yet. Create a series to group test papers for a cohort.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsNewSeriesModalOpen(true)}>
              Create First Series
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Series List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-content-secondary block">
              Curriculum Series ({seriesList.length})
            </span>
            {seriesList.map((ser) => {
              const isSelected = ser.id === (activeSeries?.id || '');
              const sTests = tests.filter(t => ser.testIds.includes(t.id));
              const sMarks = sTests.reduce((sum, t) => sum + t.totalMarks, 0);

              return (
                <div
                  key={ser.id}
                  onClick={() => setSelectedSeriesId(ser.id)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#e11d48] dark:border-rose-500 bg-rose-50 dark:bg-[rgba(225,29,72,0.12)] border-l-4 border-l-[#e11d48] dark:border-l-rose-500'
                      : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-content-primary dark:text-content-primary-dark truncate">
                      {ser.name}
                    </span>
                    <Badge variant={ser.isPublished ? 'teal' : 'slate'}>
                      {ser.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-content-secondary line-clamp-1">{ser.description}</p>
                  <div className="mt-2 pt-2 border-t border-border/50 dark:border-border-dark/50 flex justify-between text-[10px] text-content-secondary font-mono">
                    <span>{ser.testIds.length} Tests</span>
                    <span>{sMarks} Marks</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Series Detail & Test Ordering (8 cols) */}
          {activeSeries && (
            <div className="lg:col-span-8 space-y-4">
              <Panel
                title={activeSeries.name}
                subtitle={`${activeSeries.course} · Created by ${activeSeries.creatorName}`}
                badge={<Badge variant={activeSeries.isPublished ? 'teal' : 'slate'}>{activeSeries.isPublished ? 'Live' : 'Draft'}</Badge>}
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('exam-builder')}
                      icon={<Plus size={13} />}
                    >
                      New Test via Builder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSeries({ ...activeSeries, isPublished: !activeSeries.isPublished })}
                    >
                      {activeSeries.isPublished ? 'Unpublish Series' : 'Publish Series'}
                    </Button>
                  </div>
                }
              >
                {/* Live Computed Totals */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-surface-raised dark:bg-surface-raised-dark border border-border dark:border-border-dark text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block">Tests in Series</span>
                    <span className="font-mono text-lg font-bold tabular-nums text-content-primary dark:text-content-primary-dark">
                      {seriesTests.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block">Total Marks</span>
                    <span className="font-mono text-lg font-bold tabular-nums text-[#e11d48] dark:text-[#fb7185]">
                      {totalSeriesMarks}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block">Total Duration</span>
                    <span className="font-mono text-lg font-bold tabular-nums text-content-primary dark:text-content-primary-dark">
                      {totalSeriesMinutes} min
                    </span>
                  </div>
                </div>

                {/* Ordered List of Tests */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                    Ordered Test Papers (Reorderable)
                  </span>

                  {seriesTests.length === 0 ? (
                    <div className="py-6 text-center text-xs text-content-secondary border border-dashed rounded">
                      No tests attached to this series yet. Add an existing test or launch Exam Builder.
                    </div>
                  ) : (
                    seriesTests.map((test, idx) => (
                      <div
                        key={test.id}
                        className="p-3 rounded border border-border dark:border-border-dark bg-white dark:bg-surface-dark flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-content-secondary w-5">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-content-primary dark:text-content-primary-dark block">
                              {test.title}
                            </span>
                            <span className="text-[10px] text-content-secondary font-mono">
                              {test.questions.length} Questions · {test.totalMarks} Marks · {test.durationMinutes} min
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveTest(idx, 'up')}
                            className="p-1 text-content-secondary hover:text-content-primary disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            disabled={idx === seriesTests.length - 1}
                            onClick={() => handleMoveTest(idx, 'down')}
                            className="p-1 text-content-secondary hover:text-content-primary disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveTest(test.id)}
                            className="p-1 text-content-secondary hover:text-rose-600 ml-1"
                            title="Remove from series"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Attach existing tests dropdown */}
                {tests.filter(t => !activeSeries.testIds.includes(t.id)).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border dark:border-border-dark">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1.5">
                      Add Already-Published Test to Series
                    </span>
                    <div className="flex gap-2">
                      <select
                        id="attachTestSelect"
                        className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark"
                      >
                        {tests
                          .filter(t => !activeSeries.testIds.includes(t.id))
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.totalMarks} marks)
                            </option>
                          ))}
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById('attachTestSelect') as HTMLSelectElement;
                          if (el && el.value) handleAttachExistingTest(el.value);
                        }}
                      >
                        Add to Series
                      </Button>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          )}
        </div>
      )}

      {/* New Series Modal */}
      <Modal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        title="Create New Test Series"
        subtitle="Group multiple tests into an ongoing curriculum series for a batch."
      >
        <form onSubmit={handleCreateSeries} className="space-y-4">
          <Field
            label="Series Title"
            required
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            placeholder="e.g. JEE Advanced Full Syllabus Mock Series"
          />
          <Field
            label="Description"
            value={newSeriesDesc}
            onChange={(e) => setNewSeriesDesc(e.target.value)}
            placeholder="e.g. 10 Comprehensive Papers covering mechanics, electrodynamics and modern physics."
          />
          <Select
            label="Course"
            value={newSeriesCourse}
            onChange={(e) => setNewSeriesCourse(e.target.value)}
            options={institute.courses.map(c => ({ value: c.name, label: c.name }))}
          />
          <Select
            label="Cohort"
            value={newSeriesCohort}
            onChange={(e) => setNewSeriesCohort(e.target.value)}
            options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsNewSeriesModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Series
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
