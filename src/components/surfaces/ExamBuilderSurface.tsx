import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { MobileFilePicker } from '../primitives/MobileFilePicker';
import {
  SAMPLE_TEST_FORMAT,
  generateAlgoQuestions,
  parsePastedExamText,
  parsePdfDocument
} from '../../utils/examParser';
import { runQuestionChecks } from '../../utils/questionChecks';
import { QuestionDraft, DiagramKind } from '../../types';
import {
  FileText,
  FileCode,
  Camera,
  Cpu,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const ExamBuilderSurface: React.FC = () => {
  const { addQuestions, setActiveTab, institute, aiSettings } = useTeachDeskStore();

  const [activeMethod, setActiveMethod] = useState<'paste' | 'pdf' | 'photo' | 'algo' | 'manual'>('paste');

  // Shared metadata
  const [metaSubject, setMetaSubject] = useState('Physics');
  const [metaTopic, setMetaTopic] = useState('Mechanics');
  const [metaMarks, setMetaMarks] = useState(4);
  const [metaNegativeMarks, setMetaNegativeMarks] = useState(1);

  // Method 1: Paste Text
  const [pastedText, setPastedText] = useState(SAMPLE_TEST_FORMAT);

  // Method 2: PDF Upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [pdfWarnings, setPdfWarnings] = useState<string[]>([]);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  // Method 4: Algo Builder
  const [algoCount, setAlgoCount] = useState(5);

  // Method 5: Manual Builder
  const [manualStem, setManualStem] = useState('');
  const [manualOpts, setManualOpts] = useState(['', '', '', '']);
  const [manualKey, setManualKey] = useState(0);
  const [manualExp, setManualExp] = useState('');
  const [manualHint, setManualHint] = useState('');
  const [manualDiagramKind, setManualDiagramKind] = useState<DiagramKind>('none');

  // Methods cards list with exact titles and blurbs from Part 5.5
  const methodCards = [
    {
      id: 'paste' as const,
      title: 'Paste / Format Text',
      blurb: 'Algorithmic parsing of questions & keys',
      icon: <FileText size={18} className="stroke-[1.75]" />
    },
    {
      id: 'pdf' as const,
      title: 'Upload PDF',
      blurb: 'Extract test paper (up to 25 MB)',
      icon: <FileCode size={18} className="stroke-[1.75]" />
    },
    {
      id: 'photo' as const,
      title: 'Upload Image / Photo',
      blurb: 'OCR scan (up to 10 MB)',
      icon: <Camera size={18} className="stroke-[1.75]" />
    },
    {
      id: 'algo' as const,
      title: 'Algo Question Builder',
      blurb: 'Auto-synthesize MCQs by topic',
      icon: <Cpu size={18} className="stroke-[1.75]" />
    },
    {
      id: 'manual' as const,
      title: 'Manual Question Builder',
      blurb: 'Type each question yourself with diagrams/images',
      icon: <PenTool size={18} className="stroke-[1.75]" />
    }
  ];

  // Action handlers
  const handleParsePasted = async () => {
    if (!pastedText.trim()) return;
    const parsed = parsePastedExamText(pastedText, metaSubject, metaTopic, metaMarks, metaNegativeMarks);
    if (parsed.length === 0) {
      alert('Could not detect question pattern. Ensure numbered format (e.g. 1. Question stem, A) Option A...).');
      return;
    }
    await addQuestions(parsed);
    setActiveTab('review-desk');
  };

  const handlePdfUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert('PDF exceeds 25 MB limit.');
      return;
    }
    setPdfFile(file);
    setIsParsingPdf(true);
    setPdfWarnings([]);

    try {
      const res = await parsePdfDocument(file, metaSubject, metaTopic);
      setPdfPageCount(res.pageCount);
      setPdfWarnings(res.warnings);
      if (res.questions.length > 0) {
        await addQuestions(res.questions);
        setActiveTab('review-desk');
      }
    } catch (err: any) {
      setPdfWarnings([err.message || 'Error parsing PDF text layer. Scanned images require OCR scanner.']);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleGenerateAlgo = async () => {
    const generated = generateAlgoQuestions(metaSubject, metaTopic, algoCount, metaMarks, metaNegativeMarks);
    await addQuestions(generated);
    setActiveTab('review-desk');
  };

  const handleManualAdd = async () => {
    if (!manualStem.trim()) {
      alert('Please enter a question stem.');
      return;
    }
    const q: QuestionDraft = {
      id: 'q_man_' + Math.random().toString(36).substring(2, 9),
      questionText: manualStem.trim(),
      subject: metaSubject,
      topic: metaTopic,
      difficulty: 'medium',
      options: manualOpts.map(o => o.trim() || 'Option choice'),
      correctOptionIndex: manualKey,
      marks: metaMarks,
      negativeMarks: metaNegativeMarks,
      solutionExplanation: manualExp.trim(),
      hint: manualHint.trim() || undefined,
      diagram: manualDiagramKind !== 'none' ? { kind: manualDiagramKind } : undefined,
      confidence: 100,
      checks: [],
      reviewStatus: 'pending',
      createdAt: new Date().toISOString()
    };
    q.checks = runQuestionChecks(q);
    await addQuestions([q]);
    setActiveTab('review-desk');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
          Exam Builder · Ingestion & Authoring
        </h2>
        <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
          Five intake pipelines — all landing directly in the same Review Desk verification queue.
        </p>
      </div>

      {/* Shared Metadata Header */}
      <div className="p-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg">
        <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-2">
          Shared Assessment Parameters
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Select
            label="Subject"
            value={metaSubject}
            onChange={(e) => setMetaSubject(e.target.value)}
            options={[
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' }
            ]}
          />
          <Field
            label="Topic / Chapter"
            value={metaTopic}
            onChange={(e) => setMetaTopic(e.target.value)}
            placeholder="Mechanics / Optics"
          />
          <Field
            label="Marks per Question"
            type="number"
            value={metaMarks}
            onChange={(e) => setMetaMarks(parseInt(e.target.value, 10) || 4)}
          />
          <Field
            label="Negative Marking"
            type="number"
            value={metaNegativeMarks}
            onChange={(e) => setMetaNegativeMarks(parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      {/* Five Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {methodCards.map((card) => {
          const isSelected = activeMethod === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setActiveMethod(card.id)}
              className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[#e11d48] dark:border-rose-400 bg-rose-50 dark:bg-[rgba(225,29,72,0.12)] border-l-[3px] border-l-[#e11d48] dark:border-l-rose-400'
                  : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-rose-200'
              }`}
            >
              <div>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2.5 ${
                  isSelected
                    ? 'bg-[#e11d48] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-content-secondary'
                }`}>
                  {card.icon}
                </div>
                <h4 className="font-semibold text-xs text-content-primary dark:text-content-primary-dark">
                  {card.title}
                </h4>
                <p className="text-[11px] text-content-secondary dark:text-content-secondary-dark mt-1 leading-relaxed">
                  {card.blurb}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Method Pane */}
      <Panel
        title={methodCards.find(c => c.id === activeMethod)?.title}
        subtitle={methodCards.find(c => c.id === activeMethod)?.blurb}
      >
        {/* Method 1: Paste Text */}
        {activeMethod === 'paste' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary">
                Paste Formatted Exam Text
              </span>
              <button
                type="button"
                onClick={() => setPastedText(SAMPLE_TEST_FORMAT)}
                className="text-xs text-[#e11d48] dark:text-[#fb7185] hover:underline"
              >
                Paste Sample Test Format
              </button>
            </div>

            <textarea
              rows={10}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400 leading-relaxed"
            />

            <div className="flex justify-end">
              <Button
                variant="accent"
                size="sm"
                onClick={handleParsePasted}
                icon={<ArrowRight size={14} />}
              >
                Parse & Land in Review Desk
              </Button>
            </div>
          </div>
        )}

        {/* Method 2: PDF Upload */}
        {activeMethod === 'pdf' && (
          <div className="space-y-4">
            <MobileFilePicker
              accept="application/pdf"
              maxSizeBytes={25 * 1024 * 1024}
              label={pdfFile ? `Selected: ${pdfFile.name}` : 'Upload Test Paper PDF (up to 25 MB)'}
              helperText="pdf.js extracts text layer, page count, and stems directly in-browser"
              onFileSelect={handlePdfUpload}
            />

            {isParsingPdf && (
              <p className="text-xs font-mono text-[#e11d48]">Extracting PDF text layer via pdf.js...</p>
            )}

            {pdfPageCount !== null && (
              <p className="text-xs text-content-secondary">Extracted {pdfPageCount} pages.</p>
            )}

            {pdfWarnings.length > 0 && (
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {pdfWarnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Method 3: Image / Photo OCR */}
        {activeMethod === 'photo' && (
          <div className="space-y-4">
            <MobileFilePicker
              accept="image/*"
              enableCamera={true}
              maxSizeBytes={10 * 1024 * 1024}
              label="Upload Question Paper Photo (up to 10 MB)"
              helperText="Take picture with mobile camera or pick photo file"
              onFileSelect={(file) => {
                alert(`Captured image: ${file.name}. Without vision API key configured, please use the Paste method below.`);
              }}
            />

            {/* Non-Negotiable Rule 4: Plain Language Limit */}
            <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Honest Platform Limitation:</strong>
                <p className="mt-1 leading-relaxed">
                  The web application runs entirely on-device and cannot perform accurate offline OCR without an external vision API key.
                  {aiSettings.apiKey ? (
                    <span> Your vision provider key ({aiSettings.visionModel}) is configured.</span>
                  ) : (
                    <span> To parse test sheets offline without an API key, copy the text into the <strong>Paste / Format Text</strong> tab.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Method 4: Algo Question Builder */}
        {activeMethod === 'algo' && (
          <div className="space-y-4">
            <p className="text-xs text-content-secondary dark:text-content-secondary-dark">
              Synthesizes curriculum-grounded problems from the standard syllabus vocabulary offline with zero network dependency.
            </p>

            <div className="max-w-xs">
              <Field
                label="Number of Questions to Synthesize"
                type="number"
                value={algoCount}
                onChange={(e) => setAlgoCount(parseInt(e.target.value, 10) || 5)}
              />
            </div>

            <div className="p-3 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-300 flex items-start gap-2">
              <Sparkles size={16} className="text-[#e11d48] shrink-0 mt-0.5" />
              <span>
                <strong>Scaffold Note:</strong> Algo-generated items carry lower initial confidence (65%) triggering the Review Desk inspection check. Every stem must be verified and approved by the teacher.
              </span>
            </div>

            <div className="flex justify-end">
              <Button
                variant="accent"
                size="sm"
                onClick={handleGenerateAlgo}
                icon={<Cpu size={14} />}
              >
                Synthesize & Load into Review Desk
              </Button>
            </div>
          </div>
        )}

        {/* Method 5: Manual Question Builder */}
        {activeMethod === 'manual' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
                Question Stem
              </span>
              <textarea
                rows={3}
                value={manualStem}
                onChange={(e) => setManualStem(e.target.value)}
                placeholder="Type question stem..."
                className="w-full p-2.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div>
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1.5">
                Four Option Choices (Radio sets keyed correct option)
              </span>
              <div className="space-y-2">
                {manualOpts.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <label
                      className={`flex items-center justify-center w-7 h-7 rounded border font-mono text-xs font-bold cursor-pointer transition-colors ${
                        manualKey === idx
                          ? 'bg-[#e11d48] text-white border-rose-700'
                          : 'bg-white dark:bg-surface-dark border-border dark:border-border-dark text-content-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="manualKey"
                        checked={manualKey === idx}
                        onChange={() => setManualKey(idx)}
                        className="sr-only"
                      />
                      {String.fromCharCode(65 + idx)}
                    </label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...manualOpts];
                        copy[idx] = e.target.value;
                        setManualOpts(copy);
                      }}
                      placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Solution Explanation"
                value={manualExp}
                onChange={(e) => setManualExp(e.target.value)}
                placeholder="Step-by-step reasoning..."
              />
              <Field
                label="Learner Hint"
                value={manualHint}
                onChange={(e) => setManualHint(e.target.value)}
                placeholder="Optional clue..."
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="accent"
                size="sm"
                onClick={handleManualAdd}
                icon={<CheckCircle2 size={14} />}
              >
                Add to Review Desk
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};
