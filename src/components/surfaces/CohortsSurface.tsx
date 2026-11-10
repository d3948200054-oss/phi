import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { Cohort, Student, SeatRecord } from '../../types';
import { Users, UserPlus, Upload, Monitor, Search, CheckCircle, Shield } from 'lucide-react';
import { SurfaceBeginnerGuide } from '../primitives/BeginnerGuide';

export const CohortsSurface: React.FC = () => {
  const {
    cohorts,
    addCohort,
    students,
    addStudent,
    importStudentsBatch,
    seats,
    checkInSeat,
    checkOutSeat,
    teachersList,
    institute,
    feePlans,
    approveStudentAdmission,
    rejectStudentAdmission
  } = useTeachDeskStore();

  const [activeTabSub, setActiveTabSub] = useState<'roster' | 'batches' | 'lab-seats' | 'import-csv'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<string>('all');

  // New cohort modal
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCode, setNewCohortCode] = useState('');
  const [newCohortCourse, setNewCohortCourse] = useState(institute.courses[0]?.name || 'JEE Advanced');
  const [newCohortSubject, setNewCohortSubject] = useState('Physics');

  // New student modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentCohort, setNewStudentCohort] = useState(cohorts[0]?.id || '');

  // CSV Import State
  const [pastedCsv, setPastedCsv] = useState(
    `Aniket Kulkarni, 26-JEE-010, +91 98900 11001, +91 98900 11002\nSneha Patel, 26-JEE-011, +91 98900 11003, +91 98900 11004\nKaran Mehra, 26-JEE-012, +91 98900 11005, +91 98900 11006`
  );
  const [parsedPreview, setParsedPreview] = useState<Student[]>([]);
  const [importCohortId, setImportCohortId] = useState(cohorts[0]?.id || '');

  // Seat checkin modal
  const [selectedSeatForCheckIn, setSelectedSeatForCheckIn] = useState<number | null>(null);
  const [checkInStudentId, setCheckInStudentId] = useState(students[0]?.id || '');

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);

    const matchesCohort = selectedCohortFilter === 'all' || s.cohortId === selectedCohortFilter;
    return matchesSearch && matchesCohort;
  });

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim() || !newCohortCode.trim()) return;

    const newC: Cohort = {
      id: 'coh_' + Math.random().toString(36).substring(2, 9),
      name: newCohortName.trim(),
      code: newCohortCode.trim().toUpperCase(),
      course: newCohortCourse,
      subject: newCohortSubject,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-05-30',
      teacherIds: teachersList.map(t => t.id),
      createdAt: new Date().toISOString()
    };

    await addCohort(newC);
    setIsCohortModalOpen(false);
    setNewCohortName('');
    setNewCohortCode('');
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim()) return;

    const chosenCohort = cohorts.find(c => c.id === newStudentCohort);

    const s: Student = {
      id: 'stu_' + Math.random().toString(36).substring(2, 9),
      name: newStudentName.trim(),
      rollNo: newStudentRoll.trim().toUpperCase(),
      phone: newStudentPhone.trim(),
      parentPhone: newStudentParentPhone.trim(),
      course: chosenCohort ? chosenCohort.course : 'JEE Advanced',
      cohortId: newStudentCohort,
      enrolledAt: new Date().toISOString().split('T')[0],
      feePlanId: chosenCohort?.feePlanId,
      paymentStatus: 'pending',
      flags: [],
      academicTags: ['New Enrollee']
    };

    await addStudent(s);
    setIsStudentModalOpen(false);
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentPhone('');
  };

  const handleParseCsv = () => {
    const lines = pastedCsv.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const chosenCohort = cohorts.find(c => c.id === importCohortId);
    const results: Student[] = [];

    lines.forEach((line) => {
      // Split by comma or tab
      const parts = line.split(/[,\t]+/).map(p => p.trim());
      if (parts.length >= 2) {
        results.push({
          id: 'stu_' + Math.random().toString(36).substring(2, 9),
          name: parts[0],
          rollNo: parts[1],
          phone: parts[2] || '+91 90000 00000',
          parentPhone: parts[3] || '+91 90000 00001',
          course: chosenCohort?.course || 'JEE Advanced',
          cohortId: importCohortId,
          enrolledAt: new Date().toISOString().split('T')[0],
          feePlanId: chosenCohort?.feePlanId,
          paymentStatus: 'pending',
          flags: [],
          academicTags: ['CSV Imported']
        });
      }
    });

    setParsedPreview(results);
  };

  const handleSaveImport = async () => {
    if (parsedPreview.length === 0) return;
    await importStudentsBatch(parsedPreview);
    setParsedPreview([]);
    setActiveTabSub('roster');
  };

  const studentColumns: Column<Student>[] = [
    {
      key: 'rollNo',
      header: 'Roll No',
      render: (s) => <span className="font-mono text-xs font-semibold">{s.rollNo}</span>
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (s) => (
        <div>
          <span className="font-semibold text-xs block">{s.name}</span>
          <span className="text-[10px] text-content-secondary font-mono">Ph: {s.phone}</span>
        </div>
      )
    },
    {
      key: 'cohortId',
      header: 'Cohort (Batch)',
      render: (s) => {
        const c = cohorts.find(ch => ch.id === s.cohortId);
        return <span className="text-xs">{c ? c.name : s.course}</span>;
      }
    },
    {
      key: 'parentPhone',
      header: 'Parent Contact',
      render: (s) => <span className="font-mono text-xs">{s.parentPhone || '—'}</span>
    },
    {
      key: 'paymentStatus',
      header: 'Fee Status',
      align: 'center',
      render: (s) => {
        if (s.paymentStatus === 'verified') return <Badge variant="teal">Verified</Badge>;
        if (s.paymentStatus === 'submitted') return <Badge variant="amber">Awaiting Check</Badge>;
        if (s.paymentStatus === 'overdue') return <Badge variant="rose">Overdue</Badge>;
        return <Badge variant="slate">Pending</Badge>;
      }
    },
    {
      key: 'admissionStatus',
      header: 'Review Status',
      align: 'center',
      render: (s) => {
        if (s.admissionStatus === 'pending_review') {
          return (
            <div className="flex items-center gap-1.5 justify-center">
              <Badge variant="amber">Pending Review</Badge>
              <button
                type="button"
                onClick={() => approveStudentAdmission(s.id)}
                className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] transition-colors shadow-xs"
                title="Approve student into this batch"
              >
                Approve ✓
              </button>
            </div>
          );
        }
        if (s.admissionStatus === 'rejected') {
          return <Badge variant="rose">Rejected</Badge>;
        }
        return <Badge variant="teal">Approved</Badge>;
      }
    },
    {
      key: 'flags',
      header: 'Flags',
      align: 'center',
      render: (s) => (
        s.flags.length > 0 ? (
          <Badge variant="rose">{s.flags.length} incident(s)</Badge>
        ) : (
          <span className="text-[11px] text-content-secondary">None</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub Tabs */}
      <div className="flex border-b border-border dark:border-border-dark gap-2">
        <button
          onClick={() => setActiveTabSub('roster')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTabSub === 'roster'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Students Roster ({students.length})
        </button>
        <button
          onClick={() => setActiveTabSub('batches')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTabSub === 'batches'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Cohorts & Batches ({cohorts.length})
        </button>
        <button
          onClick={() => setActiveTabSub('lab-seats')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTabSub === 'lab-seats'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Computer Lab Seat Map ({seats.filter(s => s.isOccupied).length} / {seats.length} Occupied)
        </button>
        <button
          onClick={() => setActiveTabSub('import-csv')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTabSub === 'import-csv'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Paste CSV / TSV Import
        </button>
      </div>

      {/* Roster View */}
      {activeTabSub === 'roster' && (
        <div className="space-y-4">
          {students.length === 0 ? (
            <SurfaceBeginnerGuide
              title="Welcome to Students Roster"
              subtitle="Keep track of all enrolled candidates, their roll numbers, contact information, and academic performance."
              steps={[
                'Students can self-register using the coaching portal with code PHI-2026.',
                'Or click "+ Add Student" above to enroll a candidate directly into your batch.',
                'You can also bulk upload multiple students at once via "Import CSV".'
              ]}
              tip="Always collect both the student's phone and their parent's phone so attendance and fee alerts reach guardians promptly."
              primaryActionLabel={cohorts.length === 0 ? "Create First Batch First" : "+ Enroll First Student"}
              onPrimaryAction={() => {
                if (cohorts.length === 0) {
                  setActiveTabSub('batches');
                  setIsCohortModalOpen(true);
                } else {
                  setIsStudentModalOpen(true);
                }
              }}
              icon={<UserPlus size={26} />}
            />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-2.5 text-content-secondary stroke-[1.75]" />
                    <input
                      type="text"
                      placeholder="Find student by roll number, name, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                  <select
                    value={selectedCohortFilter}
                    onChange={(e) => setSelectedCohortFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none"
                  >
                    <option value="all">All Batches</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTabSub('import-csv')}
                    icon={<Upload size={14} />}
                  >
                    Import CSV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsStudentModalOpen(true)}
                    icon={<UserPlus size={14} />}
                  >
                    Add Student
                  </Button>
                </div>
              </div>

              <Table
                columns={studentColumns}
                data={filteredStudents}
                keyExtractor={(s) => s.id}
                emptyMessage="No students match the active search or cohort filter."
              />
            </>
          )}
        </div>
      )}

      {/* Cohorts / Batches View */}
      {activeTabSub === 'batches' && (
        <div className="space-y-4">
          {cohorts.length === 0 ? (
            <SurfaceBeginnerGuide
              title="Welcome to Coaching Batches (Cohorts)"
              subtitle="Batches organize students into specific courses and subjects (e.g., Morning Physics JEE 2026, Target NEET Pioneer)."
              steps={[
                'Click "+ Create First Batch" to set up your primary class.',
                'Select the Course track (IIT-JEE, NEET, Foundation, or Boards).',
                'Specify the Subject and assign teaching faculty.',
                'Once your batch is live, students can select it during registration or you can add them directly.'
              ]}
              tip="Naming batches with the graduation year (e.g., 'Alpha JEE 2026') helps students and parents identify their target entrance year immediately."
              primaryActionLabel="+ Create First Batch"
              onPrimaryAction={() => setIsCohortModalOpen(true)}
              icon={<Users size={26} />}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-xs text-content-secondary dark:text-content-secondary-dark">
                  Active student batches enrolled under institute curricula and linked fee plans.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCohortModalOpen(true)}
                  icon={<Users size={14} />}
                >
                  Create New Cohort
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cohorts.map((cohort) => {
                  const cohortStudents = students.filter(s => s.cohortId === cohort.id);
                  const feePlan = feePlans.find(p => p.cohortId === cohort.id || p.id === cohort.feePlanId);
                  return (
                    <Panel
                      key={cohort.id}
                      title={cohort.name}
                      subtitle={`${cohort.course} · Code: ${cohort.code}`}
                      badge={<Badge variant="indigo">{cohort.code}</Badge>}
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/60 dark:border-border-dark/60">
                          <span className="text-content-secondary">Enrolled Students:</span>
                          <span className="font-mono font-semibold tabular-nums">{cohortStudents.length}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/60 dark:border-border-dark/60">
                          <span className="text-content-secondary">Subject Specialization:</span>
                          <span className="font-medium">{cohort.subject}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/60 dark:border-border-dark/60">
                          <span className="text-content-secondary">Linked Fee Plan:</span>
                          <span className="font-mono text-cyan-700 dark:text-cyan-400 font-medium">
                            {feePlan ? `₹${feePlan.amount.toLocaleString()} (${feePlan.durationMonths}m)` : 'Unassigned'}
                          </span>
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedCohortFilter(cohort.id);
                              setActiveTabSub('roster');
                            }}
                          >
                            View Roster
                          </Button>
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Lab Seat Map View */}
      {activeTabSub === 'lab-seats' && (
        <Panel
          title="Computer Lab Supervision Map"
          subtitle="Real-time terminal seat allocation, live check-ins, and workstation history."
          actions={
            <span className="font-mono text-xs text-content-secondary">
              Total 30 Stations
            </span>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {seats.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between min-h-[110px] transition-all ${
                  seat.isOccupied
                    ? 'border-[#e11d48] bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-border dark:border-border-dark bg-white dark:bg-surface-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[11px] text-content-primary dark:text-content-primary-dark">
                      S-{String(seat.seatNumber).padStart(2, '0')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${seat.isOccupied ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  </div>
                  {seat.isOccupied ? (
                    <div>
                      <p className="font-semibold text-content-primary dark:text-content-primary-dark truncate">
                        {seat.currentStudentName}
                      </p>
                      <p className="font-mono text-[10px] text-content-secondary">
                        Roll: {seat.currentStudentRoll}
                      </p>
                      <p className="text-[10px] text-[#e11d48] dark:text-[#fb7185] mt-1">
                        In: {seat.checkInTime}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-content-secondary">Empty Station</span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-border/60 dark:border-border-dark/60">
                  {seat.isOccupied ? (
                    <button
                      onClick={() => checkOutSeat(seat.seatNumber)}
                      className="w-full text-center text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Release Station
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedSeatForCheckIn(seat.seatNumber);
                      }}
                      className="w-full text-center text-[10px] font-semibold text-[#e11d48] dark:text-[#fb7185] hover:underline"
                    >
                      Assign Student
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* CSV Import Surface */}
      {activeTabSub === 'import-csv' && (
        <Panel
          title="Batch Roster CSV / TSV Importer"
          subtitle="Paste tabular student records (Name, Roll Number, Phone, Parent Phone). Parse, review, and commit."
        >
          <div className="space-y-4">
            <div className="max-w-md">
              <Select
                label="Target Cohort"
                value={importCohortId}
                onChange={(e) => setImportCohortId(e.target.value)}
                options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              />
            </div>

            <div>
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                Pasted Roster Text (Comma or Tab Separated)
              </span>
              <textarea
                rows={6}
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                placeholder="Student Name, Roll Number, Phone, Parent Phone"
                className="w-full p-3 font-mono text-xs rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleParseCsv}>
                Parse & Preview
              </Button>
              {parsedPreview.length > 0 && (
                <Button variant="accent" size="sm" onClick={handleSaveImport}>
                  Commit {parsedPreview.length} Students to Roster
                </Button>
              )}
            </div>

            {parsedPreview.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border dark:border-border-dark space-y-2">
                <span className="text-xs font-semibold text-content-primary dark:text-content-primary-dark">
                  Import Preview ({parsedPreview.length} records ready):
                </span>
                <Table
                  columns={studentColumns}
                  data={parsedPreview}
                  keyExtractor={(s) => s.id}
                />
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Modals */}
      <Modal
        isOpen={isCohortModalOpen}
        onClose={() => setIsCohortModalOpen(false)}
        title="Create New Institute Cohort"
        subtitle="Provision a designated batch for academic tracking and fee planning."
      >
        <form onSubmit={handleCreateCohort} className="space-y-4">
          <Field
            label="Cohort / Batch Name"
            required
            value={newCohortName}
            onChange={(e) => setNewCohortName(e.target.value)}
            placeholder="Batch Alpha 2026"
          />
          <Field
            label="Cohort Code"
            required
            value={newCohortCode}
            onChange={(e) => setNewCohortCode(e.target.value)}
            placeholder="ALPHA-26"
          />
          <Select
            label="Curriculum Course"
            value={newCohortCourse}
            onChange={(e) => setNewCohortCourse(e.target.value)}
            options={institute.courses.map(c => ({ value: c.name, label: c.name }))}
          />
          <Select
            label="Subject"
            value={newCohortSubject}
            onChange={(e) => setNewCohortSubject(e.target.value)}
            options={[
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' }
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCohortModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Cohort
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title="Enroll Student in Roster"
        subtitle="Add a student record directly into a cohort roster."
      >
        <form onSubmit={handleCreateStudent} className="space-y-3.5">
          <Field
            label="Student Full Name"
            required
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Aarav Sharma"
          />
          <Field
            label="Institute Roll Number"
            required
            value={newStudentRoll}
            onChange={(e) => setNewStudentRoll(e.target.value)}
            placeholder="26-JEE-015"
          />
          <Select
            label="Assign Cohort"
            value={newStudentCohort}
            onChange={(e) => setNewStudentCohort(e.target.value)}
            options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
          />
          <Field
            label="Student Phone"
            value={newStudentPhone}
            onChange={(e) => setNewStudentPhone(e.target.value)}
            placeholder="+91 98450 11223"
          />
          <Field
            label="Parent Phone"
            value={newStudentParentPhone}
            onChange={(e) => setNewStudentParentPhone(e.target.value)}
            placeholder="+91 98450 11220"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Student Record
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={selectedSeatForCheckIn !== null}
        onClose={() => setSelectedSeatForCheckIn(null)}
        title={`Check In Student to Station ${selectedSeatForCheckIn}`}
        subtitle="Select a registered student from the cohort roster."
      >
        <div className="space-y-4">
          <Select
            label="Select Student"
            value={checkInStudentId}
            onChange={(e) => setCheckInStudentId(e.target.value)}
            options={students.map(s => ({ value: s.id, label: `${s.name} [${s.rollNo}]` }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedSeatForCheckIn(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (selectedSeatForCheckIn !== null && checkInStudentId) {
                  checkInSeat(selectedSeatForCheckIn, checkInStudentId);
                  setSelectedSeatForCheckIn(null);
                }
              }}
            >
              Confirm Check-in
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
