import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Modal } from '../primitives/Modal';
import { Student, Attempt } from '../../types';
import { Download, Flag, Search, ShieldCheck, GraduationCap, AlertTriangle, FileText } from 'lucide-react';

export const StudentsReportsSurface: React.FC = () => {
  const { students, attempts, flagStudent, cohorts, lectures } = useTeachDeskStore();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Real computed attempts and metrics for selected student
  const studentAttempts = attempts.filter(a => a.studentId === selectedStudent?.id);
  const totalScore = studentAttempts.reduce((sum, a) => sum + a.score, 0);
  const avgAccuracy = studentAttempts.length > 0
    ? Math.round(studentAttempts.reduce((sum, a) => sum + a.percent, 0) / studentAttempts.length)
    : 0;
  const totalFlagsCount = (selectedStudent?.flags?.length || 0) +
    studentAttempts.reduce((sum, a) => sum + a.proctorFlags.length, 0);

  // Integrity band computed from score and flags: Good / Watch / At risk
  const computeIntegrityBand = (student: Student) => {
    const sAtts = attempts.filter(a => a.studentId === student.id);
    const flagCount = student.flags.length + sAtts.reduce((sum, a) => sum + a.proctorFlags.length, 0);
    const acc = sAtts.length > 0 ? sAtts.reduce((sum, a) => sum + a.percent, 0) / sAtts.length : 70;

    if (flagCount >= 2 || acc < 35) return { band: 'At risk', variant: 'rose' as const };
    if (flagCount === 1 || acc < 55) return { band: 'Watch', variant: 'amber' as const };
    return { band: 'Good', variant: 'teal' as const };
  };

  const handleExportCsv = () => {
    const headers = ['Roll No', 'Student Name', 'Course', 'Tests Taken', 'Avg Accuracy', 'Integrity Band', 'Fee Status'];
    const rows = students.map(s => {
      const sAtts = attempts.filter(a => a.studentId === s.id);
      const acc = sAtts.length > 0 ? Math.round(sAtts.reduce((sum, a) => sum + a.percent, 0) / sAtts.length) : 'N/A';
      const band = computeIntegrityBand(s).band;
      return [s.rollNo, `"${s.name}"`, `"${s.course}"`, sAtts.length, acc, band, s.paymentStatus].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `teachdesk_student_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim() || !selectedStudent) return;
    await flagStudent(selectedStudent.id, flagReason.trim());
    setFlagReason('');
    setIsFlagModalOpen(false);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
            Students & Performance Reports Dossier
          </h2>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Real calculated accuracy percentiles, exam logs, syllabus video coverage, and integrity band tagging.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          icon={<Download size={14} />}
        >
          Export CSV Dossier
        </Button>
      </div>

      {/* Split Pane: Student List Left (5 cols), Report Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Searchable Student Roster */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-content-secondary" />
            <input
              type="text"
              placeholder="Filter student by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border text-content-primary dark:text-content-primary-dark"
            />
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredStudents.map(s => {
              const isSelected = s.id === (selectedStudent?.id || '');
              const band = computeIntegrityBand(s);
              const sAtts = attempts.filter(a => a.studentId === s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#e11d48] bg-rose-50 dark:bg-rose-950/20 border-l-4 border-l-[#e11d48]'
                      : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] text-content-secondary">{s.rollNo}</span>
                    <Badge variant={band.variant}>{band.band}</Badge>
                  </div>
                  <span className="font-semibold text-content-primary dark:text-content-primary-dark block text-xs">
                    {s.name}
                  </span>
                  <div className="mt-2 pt-2 border-t flex justify-between text-[10px] text-content-secondary font-mono">
                    <span>{sAtts.length} Tests Taken</span>
                    <span>Fee: {s.paymentStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Comprehensive Student Dossier Report */}
        {selectedStudent ? (
          <div className="lg:col-span-7 space-y-4">
            <Panel
              title={selectedStudent.name}
              subtitle={`Roll: ${selectedStudent.rollNo} · Cohort: ${cohorts.find(c => c.id === selectedStudent.cohortId)?.name || selectedStudent.course}`}
              badge={<Badge variant={computeIntegrityBand(selectedStudent).variant}>{computeIntegrityBand(selectedStudent).band.toUpperCase()}</Badge>}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFlagModalOpen(true)}
                  icon={<Flag size={13} className="text-amber-600" />}
                >
                  Flag Incident Note
                </Button>
              }
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
                <div className="p-2.5 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                  <span className="text-[10px] text-content-secondary block">Accuracy:</span>
                  <span className="text-base font-bold text-[#e11d48] dark:text-[#fb7185]">
                    {studentAttempts.length > 0 ? `${avgAccuracy}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                  <span className="text-[10px] text-content-secondary block">Tests Attempted:</span>
                  <span className="text-base font-bold">{studentAttempts.length}</span>
                </div>
                <div className="p-2.5 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                  <span className="text-[10px] text-content-secondary block">Integrity Flags:</span>
                  <span className={`text-base font-bold ${totalFlagsCount > 0 ? 'text-rose-600' : 'text-cyan-600'}`}>
                    {totalFlagsCount}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-surface-raised dark:bg-surface-raised-dark border">
                  <span className="text-[10px] text-content-secondary block">Fee Status:</span>
                  <span className="text-xs font-bold uppercase">{selectedStudent.paymentStatus}</span>
                </div>
              </div>

              {/* Topic-Level Weak Areas */}
              <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border mb-4 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-content-secondary block">
                  Diagnostic Diagnostic Tags & Weak Area Assessment:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.academicTags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px] font-medium">
                      {t}
                    </span>
                  ))}
                  {avgAccuracy > 0 && avgAccuracy < 60 && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-medium">
                      Needs Mechanics Reinforcement
                    </span>
                  )}
                </div>
              </div>

              {/* Flagged Incidents List */}
              {selectedStudent.flags.length > 0 && (
                <div className="mb-4 p-3 rounded border border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 block">
                    Flagged Academic Incidents (Visible to Institute Owner):
                  </span>
                  {selectedStudent.flags.map(f => (
                    <div key={f.id} className="flex justify-between items-center text-[11px]">
                      <span>• {f.reason} (Logged by {f.teacherName})</span>
                      <span className="font-mono text-content-secondary">{f.date}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Attempt History Table */}
              <div>
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-2">
                  Completed Examination Records
                </span>
                {studentAttempts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-content-secondary border border-dashed rounded">
                    No examination records completed yet for this candidate.
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {studentAttempts.map(att => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded border border-border/60 bg-white dark:bg-surface-dark flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium text-content-primary dark:text-content-primary-dark block">{att.testTitle}</span>
                          <span className="font-mono text-[10px] text-content-secondary">
                            Date: {new Date(att.completedAt).toLocaleDateString()} · Time: {Math.round(att.timeSpentSeconds / 60)}m
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-[#e11d48] block">{att.score} pts ({att.percent}%)</span>
                          <span className="text-[10px] text-content-secondary">{att.proctorFlags.length} flags</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        ) : null}
      </div>

      {/* Flag Incident Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        title={`Flag Academic Incident for ${selectedStudent?.name}`}
        subtitle="Report will be visible to the institute director and saved in student record."
      >
        <form onSubmit={handleSaveFlag} className="space-y-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block mb-1">
              Reason / Incident Description
            </span>
            <textarea
              rows={3}
              required
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g. Unexplained absence from laboratory mock exam or external notes found."
              className="w-full p-2.5 text-xs rounded bg-white dark:bg-surface-dark border text-content-primary dark:text-content-primary-dark"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsFlagModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm">
              Log Flag Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
