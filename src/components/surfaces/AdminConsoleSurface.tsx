import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Table, Column } from '../primitives/Table';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { RestrictedPanel } from '../primitives/RestrictedPanel';
import { Account, Payment, Institute } from '../../types';
import {
  Shield,
  KeyRound,
  Users,
  BookOpen,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building
} from 'lucide-react';
import { buildCanonicalReceiptPayload, verifyReceiptSignature } from '../../utils/crypto';

export const AdminConsoleSurface: React.FC = () => {
  const {
    role,
    account,
    institute,
    updateInstitute,
    teachersList,
    addTeacherInvite,
    payments,
    tests,
    seats
  } = useTeachDeskStore();

  // Non-Negotiable Rule 1: Re-checked at render time with RestrictedPanel fallback!
  if (role !== 'admin') {
    return <RestrictedPanel requiredRole="admin" surfaceName="Owner Admin Console" />;
  }

  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'catalogue' | 'ledger' | 'institute'>('teachers');

  // Teacher invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubject, setInviteSubject] = useState('Physics');

  // Course addition modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  // Institute settings form
  const [instName, setInstName] = useState(institute.name);
  const [instUpi, setInstUpi] = useState(institute.settlementUpi);
  const [instAccountName, setInstAccountName] = useState(institute.settlementAccountName);
  const [instInviteCode, setInstInviteCode] = useState(institute.inviteCode);
  const [instAddress, setInstAddress] = useState(institute.address);

  // Signature verification preview in ledger
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, boolean>>({});

  // Ledger oversight calculations
  const totalVerifiedAmount = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalAwaitingAmount = payments
    .filter(p => p.status === 'submitted')
    .reduce((sum, p) => sum + p.amount, 0);

  const verifiedCount = payments.filter(p => p.status === 'verified').length;
  const awaitingCount = payments.filter(p => p.status === 'submitted').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    addTeacherInvite({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      subject: inviteSubject,
      role: 'teacher'
    });

    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return;

    const updatedCourses = [
      ...institute.courses,
      {
        id: 'c_' + Math.random().toString(36).substring(2, 9),
        name: newCourseName.trim(),
        code: newCourseCode.trim().toUpperCase(),
        subjects: ['Physics', 'Chemistry', 'Mathematics']
      }
    ];

    await updateInstitute({ ...institute, courses: updatedCourses });
    setIsCourseModalOpen(false);
    setNewCourseName('');
    setNewCourseCode('');
  };

  const handleSaveInstituteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateInstitute({
      ...institute,
      name: instName.trim(),
      settlementUpi: instUpi.trim(),
      settlementAccountName: instAccountName.trim(),
      inviteCode: instInviteCode.trim(),
      address: instAddress.trim()
    });
  };

  const handleVerifyTeacherSignature = async (payment: Payment) => {
    if (!payment.receiptSignature || !payment.receiptSignedAt) {
      setVerificationFeedback(prev => ({ ...prev, [payment.id]: false }));
      return;
    }

    const canonical = buildCanonicalReceiptPayload({
      amount: payment.amount,
      cohortId: payment.cohortId,
      course: payment.course,
      currency: payment.currency,
      feePlanId: payment.feePlanId,
      id: payment.id,
      payeeId: payment.payeeId,
      payerStudentId: payment.payerStudentId,
      reference: payment.reference,
      signingTimestamp: payment.receiptSignedAt,
      status: 'verified'
    });

    const teacher = teachersList.find(t => t.id === payment.payeeId);
    const pubKey = teacher?.signingPublicKey;

    if (!pubKey) {
      setVerificationFeedback(prev => ({ ...prev, [payment.id]: false }));
      return;
    }

    const isValid = await verifyReceiptSignature(canonical, payment.receiptSignature, pubKey);
    setVerificationFeedback(prev => ({ ...prev, [payment.id]: isValid }));
  };

  const teacherColumns: Column<Account>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      render: (t) => (
        <div>
          <span className="font-semibold text-xs block text-content-primary dark:text-content-primary-dark">
            {t.name}
          </span>
          <span className="font-mono text-[10px] text-content-secondary">{t.email}</span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject Area',
      render: (t) => <span className="text-xs">{t.subject}</span>
    },
    {
      key: 'role',
      header: 'Privilege Role',
      render: (t) => <Badge variant={t.role === 'admin' ? 'rose' : 'indigo'}>{t.role.toUpperCase()}</Badge>
    },
    {
      key: 'signingPublicKey',
      header: 'ECDSA Key Status',
      render: (t) => (
        <span className="font-mono text-[11px]">
          {t.signingPublicKey ? (
            <Badge variant="teal">P-256 Published</Badge>
          ) : (
            <Badge variant="slate">Pending Setup</Badge>
          )}
        </span>
      )
    }
  ];

  const oversightColumns: Column<Payment>[] = [
    {
      key: 'humanReference',
      header: 'Receipt Ref',
      render: (p) => <span className="font-mono text-xs font-semibold">{p.humanReference}</span>
    },
    {
      key: 'payeeName',
      header: 'Faculty Beneficiary',
      render: (p) => (
        <div>
          <span className="text-xs font-medium block">{p.payeeName}</span>
          <span className="font-mono text-[10px] text-content-secondary">{p.payeeUpi}</span>
        </div>
      )
    },
    {
      key: 'payerName',
      header: 'Payer Student',
      render: (p) => <span className="text-xs">{p.payerName}</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      isNumeric: true,
      render: (p) => `₹${p.amount.toLocaleString()}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => {
        if (p.status === 'verified') return <Badge variant="teal">Verified & Signed</Badge>;
        if (p.status === 'submitted') return <Badge variant="amber">Awaiting Check</Badge>;
        if (p.status === 'rejected') return <Badge variant="rose">Rejected</Badge>;
        return <Badge variant="slate">{p.status}</Badge>;
      }
    },
    {
      key: 'signatureCheck',
      header: 'Signature Audit',
      render: (p) => {
        const feedback = verificationFeedback[p.id];
        if (!p.receiptSignature) {
          return <span className="text-[11px] text-content-secondary">Unsigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerifyTeacherSignature(p)}
            >
              Verify Signature
            </Button>
            {feedback !== undefined && (
              <span className={`font-mono text-[11px] font-bold ${feedback ? 'text-cyan-600' : 'text-rose-600'}`}>
                {feedback ? '✓ Valid' : '✗ Invalid'}
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-semibold text-lg text-content-primary dark:text-content-primary-dark">
              Institute Owner Administration Console
            </h2>
            <Badge variant="rose">OWNER SOVEREIGNTY</Badge>
          </div>
          <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
            Faculty governance, course catalogue, and institute-wide cryptographic payment oversight.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-border dark:border-border-dark gap-2">
        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSubTab === 'teachers'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Faculty & Invite Codes ({teachersList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('catalogue')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSubTab === 'catalogue'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Course & Subject Catalogue ({institute.courses.length})
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSubTab === 'ledger'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Institute Ledger Oversight ({payments.length} Records)
        </button>
        <button
          onClick={() => setActiveSubTab('institute')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeSubTab === 'institute'
              ? 'border-[#e11d48] text-[#e11d48] dark:text-[#fb7185]'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          Institute Parameters & Settlement
        </button>
      </div>

      {/* Teachers / Faculty Subsurface */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-content-secondary">Active Institute Invite Code:</span>
              <span className="font-mono font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded text-rose-700 dark:text-rose-300 border border-rose-200">
                {institute.inviteCode}
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              icon={<Plus size={14} />}
            >
              Issue Teacher Invite
            </Button>
          </div>

          <Table
            columns={teacherColumns}
            data={teachersList}
            keyExtractor={(t) => t.id}
          />
        </div>
      )}

      {/* Catalogue Subsurface */}
      {activeSubTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-content-secondary">
              Academic tracks open for enrollment and lecture production.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCourseModalOpen(true)}
              icon={<Plus size={14} />}
            >
              Add Course Track
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institute.courses.map(course => (
              <Panel
                key={course.id}
                title={course.name}
                subtitle={`Track Code: ${course.code}`}
                badge={<Badge variant="indigo">{course.code}</Badge>}
              >
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-content-secondary block">
                    Supported Subjects:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {course.subjects.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {/* Ledger Oversight Subsurface (Part 5.19: Admin can review, verify signatures, but cannot sign for teacher) */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Totals Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Panel title="Verified Collections">
              <span className="font-mono text-xl font-bold text-cyan-700 dark:text-cyan-400">
                ₹{totalVerifiedAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">{verifiedCount} signed receipts</p>
            </Panel>

            <Panel title="Awaiting Check">
              <span className="font-mono text-xl font-bold text-amber-700 dark:text-amber-400">
                ₹{totalAwaitingAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">{awaitingCount} submissions</p>
            </Panel>

            <Panel title="Rejected Count">
              <span className="font-mono text-xl font-bold text-rose-700 dark:text-rose-400">
                {rejectedCount}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">Disputed UTR refs</p>
            </Panel>

            <Panel title="Total Ledger Entries">
              <span className="font-mono text-xl font-bold text-content-primary dark:text-content-primary-dark">
                {payments.length}
              </span>
              <p className="text-[11px] text-content-secondary mt-1">All batches combined</p>
            </Panel>
          </div>

          <div className="p-3 rounded bg-surface-raised dark:bg-surface-raised-dark border text-xs text-content-secondary flex items-start gap-2">
            <Shield size={16} className="text-[#e11d48] shrink-0 mt-0.5" />
            <span>
              <strong>Cryptographic Sovereign Rule:</strong> As institute owner, you have full audit visibility and signature verification across all faculty receipts. However, in accordance with the cryptographic security model, you cannot sign receipts on behalf of any teacher; receipts require each teacher's individual private key.
            </span>
          </div>

          <Table
            columns={oversightColumns}
            data={payments}
            keyExtractor={(p) => p.id}
            emptyMessage="No fee payments recorded on ledger."
          />
        </div>
      )}

      {/* Institute Settings Subsurface */}
      {activeSubTab === 'institute' && (
        <Panel
          title="Institute Institutional Profile"
          subtitle="Configure default settlement routing and enrollment invite codes"
        >
          <form onSubmit={handleSaveInstituteSettings} className="space-y-4 max-w-lg">
            <Field
              label="Institute Full Name"
              required
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
            />
            <Field
              label="Faculty Invite Code"
              required
              value={instInviteCode}
              onChange={(e) => setInstInviteCode(e.target.value)}
              helper="Code required by faculty members when registering."
            />
            <Field
              label="Default Settlement Beneficiary Name"
              required
              value={instAccountName}
              onChange={(e) => setInstAccountName(e.target.value)}
            />
            <Field
              label="Default Settlement UPI ID"
              required
              value={instUpi}
              onChange={(e) => setInstUpi(e.target.value)}
            />
            <Field
              label="Physical Campus Address"
              value={instAddress}
              onChange={(e) => setInstAddress(e.target.value)}
            />

            <Button variant="primary" size="sm" type="submit">
              Save Institute Parameters
            </Button>
          </form>
        </Panel>
      )}

      {/* Modals */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Issue Faculty Invite"
        subtitle="Provision an authorized instructor record in the institute registry."
      >
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <Field
            label="Faculty Name"
            required
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Dr. Rajesh Sen"
          />
          <Field
            label="Email Address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="rajesh@phi.edu"
          />
          <Select
            label="Subject Specialization"
            value={inviteSubject}
            onChange={(e) => setInviteSubject(e.target.value)}
            options={[
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Biology', label: 'Biology' }
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Issue Invite
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Add Academic Track Course"
        subtitle="Introduce a competitive exam course into the institute syllabus."
      >
        <form onSubmit={handleAddCourse} className="space-y-4">
          <Field
            label="Course Track Name"
            required
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder="e.g. Olympiad Elite Training"
          />
          <Field
            label="Course Track Code"
            required
            value={newCourseCode}
            onChange={(e) => setNewCourseCode(e.target.value)}
            placeholder="OLY-ELITE"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCourseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Course Track
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
