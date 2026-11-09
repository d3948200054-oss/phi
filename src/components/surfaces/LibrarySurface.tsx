import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { MobileFilePicker } from '../primitives/MobileFilePicker';
import { LibraryItem } from '../../types';
import { BookOpen, Download, FileText, Trash2, Plus, HardDrive } from 'lucide-react';
import { SurfaceBeginnerGuide } from '../primitives/BeginnerGuide';

export const LibrarySurface: React.FC = () => {
  const { libraryItems, addLibraryItem, removeLibraryItem } = useTeachDeskStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newType, setNewType] = useState<LibraryItem['type']>('pdf');
  const [newChapters, setNewChapters] = useState('Chapter 1: Foundations, Chapter 2: Dynamics');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [downloadHistory, setDownloadHistory] = useState<Array<{ id: string; title: string; time: string; size: string }>>([
    { id: 'dl1', title: 'Advanced Mechanics & Angular Momentum (Formula Sheet)', time: '10:30 AM Today', size: '4.2 MB' }
  ]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const chaptersList = newChapters.split(',').map(c => c.trim()).filter(c => c.length > 0);

    const newItem: LibraryItem = {
      id: 'lib_' + Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      subject: newSubject,
      type: newType,
      chapters: chaptersList.length > 0 ? chaptersList : ['General Overview'],
      sizeBytes: selectedFile ? selectedFile.size : 3500000,
      downloadCount: 0,
      uploadedAt: new Date().toISOString()
    };

    await addLibraryItem(newItem);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setSelectedFile(null);
  };

  const handleDownload = (item: LibraryItem) => {
    const entry = {
      id: 'dl_' + Math.random().toString(36).substring(2, 9),
      title: item.title,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      size: `${(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    };
    setDownloadHistory(prev => [entry, ...prev]);

    // Simulate instant download trigger
    const blob = new Blob([`phi Coaching Course Content: ${item.title}\nChapters:\n` + item.chapters.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Curriculum Reference Library & Notes
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Course modules, formulas sheets, and offline downloadable study documents.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
          icon={<Plus size={14} />}
        >
          Upload New Module
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Modules Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {libraryItems.length === 0 ? (
            <SurfaceBeginnerGuide
              title="Classroom Library & Study Material"
              subtitle="Upload course modules, PDF formula handbooks, NCERT solutions, and reference study notes for your batches."
              steps={[
                'Click "Upload New Module" to share study materials.',
                'Specify the Subject and list key chapter highlights.',
                'Select your PDF or document file (e.g. Mechanics Formulas, Organic Reaction Roadmaps).',
                'Your enrolled students can view and download them for offline exam preparation.'
              ]}
              tip="Upload high-yield formula sheets before major test assessments to help students with rapid revision."
              primaryActionLabel="+ Upload First Study Module"
              onPrimaryAction={() => setIsUploadModalOpen(true)}
              icon={<BookOpen size={28} />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {libraryItems.map(item => (
              <Panel
                key={item.id}
                title={item.title}
                subtitle={`${item.subject} · ${(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
                badge={<Badge variant="indigo">{item.type.toUpperCase()}</Badge>}
                actions={
                  <button
                    onClick={() => removeLibraryItem(item.id)}
                    className="p-1 text-content-secondary hover:text-rose-600"
                    title="Delete module"
                  >
                    <Trash2 size={13} />
                  </button>
                }
              >
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-content-secondary block mb-1">
                      Included Chapters / Highlights:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-content-primary dark:text-content-primary-dark">
                      {item.chapters.map((ch, i) => (
                        <li key={i} className="truncate">{ch}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="font-mono text-[10px] text-content-secondary">
                      {item.downloadCount} Total Downloads
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(item)}
                      icon={<Download size={13} />}
                    >
                      Download Document
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
            </div>
          )}
        </div>

        {/* Downloads History Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Panel
            title="Workstation Downloads"
            subtitle="Local offline copies ready on this device"
          >
            <div className="space-y-2 text-xs">
              {downloadHistory.length === 0 ? (
                <div className="py-6 text-center text-content-secondary border border-dashed rounded">
                  No downloads logged on this station.
                </div>
              ) : (
                downloadHistory.map(dl => (
                  <div
                    key={dl.id}
                    className="p-2.5 rounded border border-border/60 bg-white dark:bg-surface-dark flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium text-content-primary dark:text-content-primary-dark block truncate max-w-[170px]">
                        {dl.title}
                      </span>
                      <span className="font-mono text-[10px] text-content-secondary">
                        {dl.time} · {dl.size}
                      </span>
                    </div>
                    <button
                      onClick={() => setDownloadHistory(prev => prev.filter(d => d.id !== dl.id))}
                      className="p-1 text-content-secondary hover:text-rose-600"
                      title="Clear record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Curriculum Document"
        subtitle="Publish notes, reference formulas or assignments."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <Field
            label="Module Title"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Thermodynamics and Kinetic Theory Guide"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              options={[
                { value: 'Physics', label: 'Physics' },
                { value: 'Chemistry', label: 'Chemistry' },
                { value: 'Mathematics', label: 'Mathematics' }
              ]}
            />
            <Select
              label="Format Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              options={[
                { value: 'pdf', label: 'PDF Document' },
                { value: 'book', label: 'Reference Text' },
                { value: 'notes', label: 'Handwritten Notes' },
                { value: 'sheet', label: 'Formula Sheet' }
              ]}
            />
          </div>

          <Field
            label="Chapters (Comma separated)"
            value={newChapters}
            onChange={(e) => setNewChapters(e.target.value)}
            placeholder="Laws of Thermodynamics, Heat Engines, Carnot Cycle"
          />

          <MobileFilePicker
            label={selectedFile ? `File: ${selectedFile.name}` : 'Select Document File'}
            onFileSelect={(f) => setSelectedFile(f)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Upload to Library
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
