import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { Notice } from '../../types';
import { Bell, Plus, AlertCircle, Calendar } from 'lucide-react';

export const NoticesSurface: React.FC = () => {
  const { notices, addNotice, cohorts, account } = useTeachDeskStore();

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<Notice['audience']>('all_teachers');
  const [noticeCohortId, setNoticeCohortId] = useState('');
  const [noticePriority, setNoticePriority] = useState<Notice['priority']>('normal');

  const handleComposeNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;

    const newN: Notice = {
      id: 'not_' + Math.random().toString(36).substring(2, 9),
      title: noticeTitle.trim(),
      body: noticeBody.trim(),
      audience: noticeAudience,
      targetCohortId: noticeAudience === 'cohort' ? noticeCohortId : undefined,
      priority: noticePriority,
      createdBy: account?.id || 'acc_admin_owner',
      createdByName: account?.name || 'Faculty Member',
      createdAt: new Date().toISOString()
    };

    await addNotice(newN);
    setIsComposeModalOpen(false);
    setNoticeTitle('');
    setNoticeBody('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Institute Notice Board & Broadcasts
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Operational circulars, mock exam schedules, and laboratory instructions.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsComposeModalOpen(true)}
          icon={<Plus size={14} />}
        >
          Compose Notice
        </Button>
      </div>

      <div className="space-y-4">
        {notices.map(notice => (
          <Panel
            key={notice.id}
            title={
              <div className="flex items-center gap-2">
                <span>{notice.title}</span>
                {notice.priority === 'urgent' && <Badge variant="rose">URGENT</Badge>}
              </div>
            }
            subtitle={`Posted by ${notice.createdByName} · Audience: ${notice.audience.replace(/_/g, ' ')}`}
            badge={<Badge variant="indigo">{new Date(notice.createdAt).toLocaleDateString()}</Badge>}
          >
            <p className="text-xs text-content-primary dark:text-content-primary-dark leading-relaxed whitespace-pre-wrap">
              {notice.body}
            </p>
          </Panel>
        ))}
      </div>

      {/* Compose Notice Modal */}
      <Modal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        title="Compose Institute Circular / Notice"
        subtitle="Broadcast instructions to faculty, cohorts, or students."
      >
        <form onSubmit={handleComposeNotice} className="space-y-4">
          <Field
            label="Notice Headline / Title"
            required
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            placeholder="e.g. Schedule Revision for Batch Phoenix Lab Exam"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Audience Group"
              value={noticeAudience}
              onChange={(e) => setNoticeAudience(e.target.value as any)}
              options={[
                { value: 'all_teachers', label: 'All Institute Faculty' },
                { value: 'cohort', label: 'Designated Cohort Batch' },
                { value: 'students', label: 'All Enrolled Students' }
              ]}
            />
            <Select
              label="Priority Level"
              value={noticePriority}
              onChange={(e) => setNoticePriority(e.target.value as any)}
              options={[
                { value: 'normal', label: 'Normal Circular' },
                { value: 'urgent', label: 'Urgent Action Required' }
              ]}
            />
          </div>

          {noticeAudience === 'cohort' && (
            <Select
              label="Select Target Cohort"
              value={noticeCohortId}
              onChange={(e) => setNoticeCohortId(e.target.value)}
              options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            />
          )}

          <div>
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
              Notice Body
            </span>
            <textarea
              rows={4}
              required
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
              placeholder="Enter message details..."
              className="w-full p-2.5 text-xs rounded bg-white dark:bg-surface-dark border text-content-primary dark:text-content-primary-dark"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsComposeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
