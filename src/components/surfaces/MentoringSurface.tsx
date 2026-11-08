import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { MentoringSlot } from '../../types';
import { UserCheck, Calendar, Clock, MessageSquare, Plus, Send } from 'lucide-react';

export const MentoringSurface: React.FC = () => {
  const {
    account,
    mentoringSlots,
    addMentoringSlot,
    updateMentoringSlotStatus,
    addMentoringMessage,
    cohorts
  } = useTeachDeskStore();

  const [selectedSlotId, setSelectedSlotId] = useState<string>(mentoringSlots[0]?.id || '');
  const [isNewSlotModalOpen, setIsNewSlotModalOpen] = useState(false);

  // New slot state
  const [slotCohortId, setSlotCohortId] = useState(cohorts[0]?.id || '');
  const [slotTopic, setSlotTopic] = useState('');
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('16:00');
  const [slotDuration, setSlotDuration] = useState(45);

  // Message input state
  const [messageText, setMessageText] = useState('');

  const activeSlot = mentoringSlots.find(s => s.id === selectedSlotId) || mentoringSlots[0];

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotTopic.trim()) return;

    const cohort = cohorts.find(c => c.id === slotCohortId);
    const newSlot: MentoringSlot = {
      id: 'slot_' + Math.random().toString(36).substring(2, 9),
      teacherId: account?.id || 'acc_teacher_prof',
      teacherName: account?.name || 'Faculty Mentor',
      cohortId: slotCohortId,
      cohortName: cohort?.name || 'Batch Alpha',
      topic: slotTopic.trim(),
      date: slotDate,
      time: slotTime,
      durationMinutes: slotDuration,
      status: 'scheduled',
      messages: [
        {
          id: 'm1',
          senderRole: 'teacher',
          senderName: account?.name || 'Faculty Mentor',
          text: `Guidance slot opened for ${slotTopic.trim()}. Candidates may submit preparation doubts prior to session.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    await addMentoringSlot(newSlot);
    setSelectedSlotId(newSlot.id);
    setIsNewSlotModalOpen(false);
    setSlotTopic('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeSlot) return;
    await addMentoringMessage(activeSlot.id, messageText.trim());
    setMessageText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Faculty Mentoring & Guidance Console
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            1-on-1 and cohort guidance sessions with synchronized doubt discussion threads.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewSlotModalOpen(true)}
          icon={<Plus size={14} />}
        >
          Schedule Guidance Slot
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Mentor Profile & Slots List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            title="Faculty Mentor Dossier"
            subtitle={account?.qualification || 'Senior Faculty'}
          >
            <div className="flex items-center gap-3 text-xs">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center text-sm border">
                {account?.avatar ? (
                  <img src={account.avatar} alt={account.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  account?.name.charAt(0) || 'F'
                )}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-content-primary dark:text-content-primary-dark block text-sm">
                  {account?.name}
                </span>
                <span className="text-content-secondary text-[11px] block">
                  {account?.subject} · {account?.yearsExperience} Years Experience
                </span>
                <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-[11px]">
                  ★ 4.95 / 5.0 Guidance Rating
                </span>
              </div>
            </div>
          </Panel>

          {/* Slots List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-content-secondary tracking-wider block">
              Scheduled Guidance Sessions ({mentoringSlots.length})
            </span>
            {mentoringSlots.length === 0 ? (
              <div className="py-6 text-center text-xs text-content-secondary border border-dashed rounded">
                No active guidance slots. Click Schedule to add a mentoring session.
              </div>
            ) : (
              mentoringSlots.map(slot => {
                const isSelected = slot.id === (activeSlot?.id || '');
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/20 border-l-4 border-l-[#e11d48]'
                        : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] text-content-secondary">{slot.cohortName}</span>
                      <Badge variant={slot.status === 'completed' ? 'teal' : slot.status === 'scheduled' ? 'sky' : 'rose'}>
                        {slot.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-content-primary dark:text-content-primary-dark">{slot.topic}</p>
                    <div className="mt-2 pt-2 border-t flex justify-between text-[10px] text-content-secondary font-mono">
                      <span>{slot.date} at {slot.time}</span>
                      <span>{slot.durationMinutes} min</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Session Thread & Controls (7 cols) */}
        {activeSlot ? (
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title={activeSlot.topic}
              subtitle={`${activeSlot.cohortName} · ${activeSlot.date} at ${activeSlot.time} (${activeSlot.durationMinutes}m)`}
              badge={<Badge variant="indigo">{activeSlot.status.toUpperCase()}</Badge>}
              actions={
                <div className="flex items-center gap-2">
                  {activeSlot.status === 'scheduled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateMentoringSlotStatus(activeSlot.id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {activeSlot.status === 'scheduled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateMentoringSlotStatus(activeSlot.id, 'cancelled')}
                    >
                      Cancel Slot
                    </Button>
                  )}
                </div>
              }
            >
              <div className="space-y-4">
                {/* Discussion Thread */}
                <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                  {activeSlot.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded text-xs leading-relaxed ${
                        msg.senderRole === 'teacher'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 ml-4'
                          : 'bg-surface-raised dark:bg-surface-raised-dark border mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[11px] text-content-primary dark:text-content-primary-dark">
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="font-mono text-[10px] text-content-secondary">{msg.time}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Send message form */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type mentoring note or guideline for candidate..."
                    className="flex-1 px-3 py-1.5 text-xs rounded bg-white dark:bg-surface-dark border text-content-primary dark:text-content-primary-dark"
                  />
                  <Button variant="primary" size="sm" type="submit" icon={<Send size={13} />}>
                    Send
                  </Button>
                </form>
              </div>
            </Panel>
          </div>
        ) : null}
      </div>

      {/* New Slot Modal */}
      <Modal
        isOpen={isNewSlotModalOpen}
        onClose={() => setIsNewSlotModalOpen(false)}
        title="Schedule Mentoring & Guidance Slot"
        subtitle="Reserve a dedicated guidance appointment for cohort students."
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <Select
            label="Cohort"
            value={slotCohortId}
            onChange={(e) => setSlotCohortId(e.target.value)}
            options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
          />
          <Field
            label="Guidance Topic / Objective"
            required
            value={slotTopic}
            onChange={(e) => setSlotTopic(e.target.value)}
            placeholder="e.g. Rotational Mechanics Problem Solving Clinic"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date"
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
            <Field
              label="Time"
              type="time"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
            />
          </div>
          <Field
            label="Duration (Minutes)"
            type="number"
            value={slotDuration}
            onChange={(e) => setSlotDuration(parseInt(e.target.value, 10) || 45)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsNewSlotModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
