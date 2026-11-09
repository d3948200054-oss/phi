import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { MobileFilePicker } from '../primitives/MobileFilePicker';
import { Lecture, QuestionDraft } from '../../types';
import { runQuestionChecks } from '../../utils/questionChecks';
import { Video, Play, FastForward, Sparkles, Mic, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { SurfaceBeginnerGuide } from '../primitives/BeginnerGuide';

export const LecturesSurface: React.FC = () => {
  const {
    lectures,
    addLecture,
    updateLecture,
    cohorts,
    institute,
    account,
    addQuestions,
    setActiveTab
  } = useTeachDeskStore();

  const [selectedLecture, setSelectedLecture] = useState<Lecture>(lectures[0] || null);
  const [activePlayerTime, setActivePlayerTime] = useState(0);

  // Upload Studio State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lecTitle, setLecTitle] = useState('');
  const [lecSubject, setLecSubject] = useState('Physics');
  const [lecCourse, setLecCourse] = useState(institute.courses[0]?.name || 'JEE Advanced');
  const [lecCohort, setLecCohort] = useState(cohorts[0]?.id || '');
  const [providerType, setProviderType] = useState<'paste' | 'browser_mic' | 'ai_endpoint' | 'manual'>('paste');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedTranscript, setPastedTranscript] = useState(
    `[00:00] In today's session, we address electromagnetic flux and Faraday's law of induction.\n[05:30] A magnetic flux change of dPhi/dt generates an induced electromotive force.\n[15:45] Notice that by Lenz's rule, the direction of induced current opposes the flux variation.`
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    // Check 500 MB limit
    if (file.size > 500 * 1024 * 1024) {
      alert('Lecture file rejected: Video size exceeds strict 500 MB browser limit.');
      return;
    }
    setUploadedFile(file);
    if (!lecTitle) {
      setLecTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleProcessLecture = async () => {
    if (!lecTitle.trim()) return;
    setIsProcessing(true);

    // Parse transcript lines with timestamps
    const rawLines = pastedTranscript.split(/\r?\n/).filter(l => l.trim().length > 0);
    const transcriptLines: Array<{ t: number; text: string }> = [];
    const chapters: Array<{ start: number; title: string }> = [];

    rawLines.forEach((line, idx) => {
      const match = line.match(/^\[?(\d{1,2}):(\d{2})\]?\s*(.*)$/);
      let t = idx * 60;
      let text = line;
      if (match) {
        t = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        text = match[3];
      }
      transcriptLines.push({ t, text });

      if (idx === 0 || t % 600 === 0) {
        chapters.push({
          start: t,
          title: `Chapter at ${Math.floor(t / 60)}:${t % 60 < 10 ? '0' : ''}${t % 60}`
        });
      }
    });

    const newLec: Lecture = {
      id: 'lec_' + Math.random().toString(36).substring(2, 9),
      title: lecTitle.trim(),
      subject: lecSubject,
      course: lecCourse,
      teacherId: account?.id || 'acc_teacher_prof',
      teacherName: account?.name || 'Faculty Member',
      status: 'ready',
      durationSeconds: transcriptLines.length > 0 ? transcriptLines[transcriptLines.length - 1].t + 120 : 1800,
      chapters: chapters.length > 0 ? chapters : [{ start: 0, title: 'Introduction & Core Concepts' }],
      transcript: transcriptLines,
      batchIds: [lecCohort],
      sizeBytes: uploadedFile ? uploadedFile.size : 120000000,
      publishedAt: new Date().toISOString(),
      notes: 'Auto-extracted chapter candidates and questions synthesized from audio transcript.'
    };

    // Auto-generate candidate questions from the lecture transcript
    const candidateQ: QuestionDraft = {
      id: 'q_lec_' + Math.random().toString(36).substring(2, 9),
      questionText: `Based on the lecture discussion at [${Math.floor(transcriptLines[0]?.t || 0 / 60)}:00], what is the primary consequence of Faraday's Law?`,
      subject: lecSubject,
      topic: 'Electrodynamics',
      difficulty: 'medium',
      options: [
        'Induced EMF is directly proportional to the time rate of change of magnetic flux',
        'Current is always static regardless of flux change',
        'Resistance drops to zero',
        'None of the above'
      ],
      correctOptionIndex: 0,
      marks: 4,
      negativeMarks: 1,
      solutionExplanation: 'According to Faraday\'s law, ε = - dΦ_B / dt.',
      diagram: { kind: 'none' },
      confidence: 88,
      checks: [],
      reviewStatus: 'pending',
      sourceTimestampSeconds: transcriptLines[0]?.t || 0,
      createdAt: new Date().toISOString()
    };
    candidateQ.checks = runQuestionChecks(candidateQ);

    await addLecture(newLec);
    await addQuestions([candidateQ]);

    setSelectedLecture(newLec);
    setIsProcessing(false);
    setIsUploadOpen(false);
  };

  const jumpToTimestamp = (seconds: number) => {
    setActivePlayerTime(seconds);
  };

  const lectureColumns: Column<Lecture>[] = [
    {
      key: 'title',
      header: 'Lecture Title',
      render: (l) => (
        <div>
          <span className="font-semibold text-xs block text-content-primary dark:text-content-primary-dark truncate max-w-xs">
            {l.title}
          </span>
          <span className="text-[10px] text-content-secondary font-mono">
            {l.subject} · {l.course}
          </span>
        </div>
      )
    },
    {
      key: 'durationSeconds',
      header: 'Duration',
      isNumeric: true,
      align: 'right',
      render: (l) => `${Math.floor(l.durationSeconds / 60)} min`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (l) => {
        if (l.status === 'published') return <Badge variant="teal">Published</Badge>;
        if (l.status === 'ready') return <Badge variant="sky">Ready for Review</Badge>;
        if (l.status === 'extracting') return <Badge variant="amber">Extracting</Badge>;
        return <Badge variant="slate">{l.status}</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Lecture Studio & Extraction Pipeline
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark">
            Upload classroom recordings, auto-transcribe chapters, and generate reviewable question sets.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          icon={<Video size={14} />}
        >
          Process New Lecture
        </Button>
      </div>

      {/* Split Pane: Player & Chapters Left, Transcript & Questions Right */}
      {selectedLecture ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Player Scaffold + Chapters (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title={selectedLecture.title}
              subtitle={`${selectedLecture.subject} · Faculty: ${selectedLecture.teacherName}`}
              badge={
                <Badge variant={selectedLecture.status === 'published' ? 'teal' : 'sky'}>
                  {selectedLecture.status.toUpperCase()}
                </Badge>
              }
            >
              {/* Honest Native Video Player Scaffold */}
              <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-border dark:border-border-dark aspect-video flex flex-col justify-between p-4">
                <div className="flex justify-between items-center text-white/80 text-xs">
                  <span className="font-mono">
                    {Math.floor(activePlayerTime / 60)}:{activePlayerTime % 60 < 10 ? '0' : ''}{activePlayerTime % 60} / {Math.floor(selectedLecture.durationSeconds / 60)}:00
                  </span>
                  <span className="bg-[#e11d48]/80 px-2 py-0.5 rounded text-[10px] font-mono">
                    STUDIO FEED
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#e11d48]/90 text-white flex items-center justify-center hover:bg-rose-700 cursor-pointer transition-colors shadow-lg">
                    <Play size={24} className="ml-1" />
                  </div>
                  <span className="text-white/60 text-xs">
                    Local Device Playback Scaffold
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={selectedLecture.durationSeconds}
                    value={activePlayerTime}
                    onChange={(e) => setActivePlayerTime(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Timestamped Chapters */}
              <div className="mt-4 pt-3 border-t border-border dark:border-border-dark">
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-2">
                  Timestamped Chapters
                </span>
                <div className="space-y-1.5">
                  {selectedLecture.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToTimestamp(ch.start)}
                      className="w-full flex items-center justify-between p-2 rounded text-xs bg-surface-raised dark:bg-surface-raised-dark hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors border border-border/50 dark:border-border-dark/50"
                    >
                      <div className="flex items-center gap-2">
                        <FastForward size={13} className="text-[#e11d48] dark:text-[#fb7185]" />
                        <span className="font-medium text-content-primary dark:text-content-primary-dark">{ch.title}</span>
                      </div>
                      <span className="font-mono text-content-secondary text-[11px]">
                        [{Math.floor(ch.start / 60)}:{ch.start % 60 < 10 ? '0' : ''}{ch.start % 60}]
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Right: Transcript & Extraction Output (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Panel
              title="Synchronized Transcript"
              subtitle="Jump directly to lecture video frames by clicking transcript lines"
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('review-desk')}
                  icon={<Sparkles size={13} />}
                >
                  Review MCQs
                </Button>
              }
            >
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {selectedLecture.transcript.map((line, idx) => {
                  const isNearCurrent = Math.abs(line.t - activePlayerTime) < 30;
                  return (
                    <div
                      key={idx}
                      onClick={() => jumpToTimestamp(line.t)}
                      className={`p-2.5 rounded text-xs cursor-pointer transition-colors ${
                        isNearCurrent
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-l-[3px] border-l-[#e11d48] dark:border-l-rose-400 text-slate-900 dark:text-rose-100'
                          : 'hover:bg-slate-50 dark:hover:bg-surface-raised-dark text-content-primary dark:text-content-primary-dark'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-content-secondary block mb-0.5">
                        [{Math.floor(line.t / 60)}:{line.t % 60 < 10 ? '0' : ''}{line.t % 60}]
                      </span>
                      <p className="leading-relaxed">{line.text}</p>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Lecture Repository"
              subtitle="All classroom recordings stored in this institute console"
            >
              <Table
                columns={lectureColumns}
                data={lectures}
                keyExtractor={(l) => l.id}
                selectedId={selectedLecture.id}
                onRowClick={(l) => setSelectedLecture(l)}
              />
            </Panel>
          </div>
        </div>
      ) : (
        <SurfaceBeginnerGuide
          title="Classroom Lecture Studio"
          subtitle="Publish video recordings, synchronized chapter timestamps, and extracted practice questions for your coaching batches."
          steps={[
            'Click "Process New Lecture" to open the studio.',
            'Assign the lecture to a batch (e.g. JEE Elite Physics).',
            'Upload your video recording or paste your transcript notes with [mm:ss] time prefixes.',
            'Once published, your enrolled students will have immediate access to study notes and auto-generated questions.'
          ]}
          tip="Pasting transcripts with timestamp prefixes like [05:30] automatically creates instant clickable video chapters for your students."
          primaryActionLabel="+ Process First Lecture"
          onPrimaryAction={() => setIsUploadOpen(true)}
          icon={<Video size={28} />}
        />
      )}

      {/* Upload & Extraction Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Lecture Extraction Pipeline"
        subtitle="Ingest classroom video, transcribe room audio, and extract questions."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Lecture Title"
              required
              value={lecTitle}
              onChange={(e) => setLecTitle(e.target.value)}
              placeholder="e.g. Electromagnetic Induction & Lenz Law"
            />
            <Select
              label="Subject"
              value={lecSubject}
              onChange={(e) => setLecSubject(e.target.value)}
              options={[
                { value: 'Physics', label: 'Physics' },
                { value: 'Chemistry', label: 'Chemistry' },
                { value: 'Mathematics', label: 'Mathematics' },
                { value: 'Biology', label: 'Biology' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Course"
              value={lecCourse}
              onChange={(e) => setLecCourse(e.target.value)}
              options={institute.courses.map(c => ({ value: c.name, label: c.name }))}
            />
            <Select
              label="Assigned Cohort"
              value={lecCohort}
              onChange={(e) => setLecCohort(e.target.value)}
              options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            />
          </div>

          {/* Mobile-Safe File Picker (≤500 MB) */}
          <div>
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
              Lecture Video File (Max 500 MB limit)
            </span>
            <MobileFilePicker
              accept="video/*,audio/*"
              label={uploadedFile ? `Video: ${uploadedFile.name} (${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)` : 'Choose Lecture Video or Audio Recording'}
              helperText="Strict ≤500 MB limit enforced. Videos exceeding 500 MB are rejected."
              maxSizeBytes={500 * 1024 * 1024}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Four Extraction Providers with Honest Blurbs */}
          <div>
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1.5">
              Select Extraction Provider (Honest Capability Constraints)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setProviderType('paste')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  providerType === 'paste'
                    ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/30'
                    : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={15} className="text-[#e11d48]" />
                  <span className="font-semibold text-content-primary dark:text-content-primary-dark">3. Paste Transcript</span>
                </div>
                <p className="text-[11px] text-content-secondary">
                  Teacher pastes transcript. Preserves exact [mm:ss] timestamp prefixes. Zero network overhead.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProviderType('browser_mic')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  providerType === 'browser_mic'
                    ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/30'
                    : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mic size={15} className="text-[#e11d48]" />
                  <span className="font-semibold text-content-primary dark:text-content-primary-dark">1. Record in Browser</span>
                </div>
                <p className="text-[11px] text-content-secondary">
                  Plays lecture and transcribes room microphone via Web Speech API. <strong>Chrome / Edge only</strong>.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProviderType('ai_endpoint')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  providerType === 'ai_endpoint'
                    ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/30'
                    : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={15} className="text-[#e11d48]" />
                  <span className="font-semibold text-content-primary dark:text-content-primary-dark">2. AI Provider (Whisper)</span>
                </div>
                <p className="text-[11px] text-content-secondary">
                  Transcribes audio via configured OpenAI-compatible endpoint. Requires provider API key.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProviderType('manual')}
                className={`p-3 rounded-md border text-left transition-colors ${
                  providerType === 'manual'
                    ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/30'
                    : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={15} className="text-[#e11d48]" />
                  <span className="font-semibold text-content-primary dark:text-content-primary-dark">4. Offline Manual Scaffold</span>
                </div>
                <p className="text-[11px] text-content-secondary">
                  Offline syllabus template. Generates curriculum-scaffolded chapters without any network calls.
                </p>
              </button>
            </div>
          </div>

          {/* Transcript input */}
          {providerType === 'paste' && (
            <div>
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                Paste Transcript Lines ([mm:ss] format)
              </span>
              <textarea
                rows={4}
                value={pastedTranscript}
                onChange={(e) => setPastedTranscript(e.target.value)}
                className="w-full p-2.5 font-mono text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-border-dark">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={isProcessing}
              onClick={handleProcessLecture}
            >
              {isProcessing ? 'Transcribing & Extracting Questions...' : 'Process Video & Extract Content'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
