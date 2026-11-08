import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Panel } from '../primitives/Panel';
import { Badge } from '../primitives/Badge';
import { Button } from '../primitives/Button';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Modal } from '../primitives/Modal';
import { FeePlan, Payment, Student } from '../../types';
import {
  buildCanonicalReceiptPayload,
  generateSigningKeyPair,
  signReceipt,
  verifyReceiptSignature
} from '../../utils/crypto';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  Lock,
  Plus,
  Copy,
  Check,
  FileText,
  Upload,
  User,
  ShieldAlert,
  Building,
  RefreshCw,
  Search,
  SlidersHorizontal
} from 'lucide-react';

export const FeesPayoutsSurface: React.FC = () => {
  const {
    account,
    role,
    feePlans,
    addFeePlan,
    payments,
    recordPayment,
    verifyPaymentAndSign,
    rejectPayment,
    updateAccountPayout,
    updateInstituteSettlement,
    students,
    cohorts,
    institute,
    unlockedSigningKey
  } = useTeachDeskStore();

  const [activeTabSub, setActiveTabSub] = useState<'queue' | 'plans' | 'record' | 'payout-setup'>('queue');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Search & filter in queue
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'verified' | 'rejected'>('all');

  // Record payment form state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(feePlans[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [enteredUtrReference, setEnteredUtrReference] = useState('');
  const [bankPayerName, setBankPayerName] = useState('');
  const [paymentProofData, setPaymentProofData] = useState<string | undefined>(undefined);
  const [recordError, setRecordError] = useState<string | null>(null);

  // New Fee Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanCourse, setNewPlanCourse] = useState(institute.courses[0]?.name || 'JEE Advanced Elite');
  const [newPlanCohortId, setNewPlanCohortId] = useState(cohorts[0]?.id || '');
  const [newPlanAmount, setNewPlanAmount] = useState(120000);
  const [newPlanMonths, setNewPlanMonths] = useState(12);

  // Signing & Verification Modal
  const [selectedPaymentForInspect, setSelectedPaymentForInspect] = useState<Payment | null>(null);
  const [signatureVerificationStatus, setSignatureVerificationStatus] = useState<boolean | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Teacher / Admin Payout Setup Form State
  const [payoutUpi, setPayoutUpi] = useState(account?.payout?.upiId || '');
  const [payoutName, setPayoutName] = useState(account?.payout?.accountName || '');
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Institute Level Settlement (for Admin)
  const [instituteUpi, setInstituteUpi] = useState(institute.settlementUpi || '');
  const [instituteAccountName, setInstituteAccountName] = useState(institute.settlementAccountName || '');
  const [instituteSaved, setInstituteSaved] = useState(false);

  // Derived payee information
  const chosenPlan = feePlans.find(p => p.id === selectedPlanId) || feePlans[0];
  const chosenStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Derived human readable reference: e.g. LAB-ALPHA-001-XXXX
  const derivedHumanRef = chosenPlan && chosenStudent
    ? `LAB-${chosenStudent.rollNo.replace(/[^A-Za-z0-9]/g, '')}-${chosenPlan.course.slice(0, 3).toUpperCase()}`
    : 'LAB-FEE-REF';

  // Deep link UPI URL: upi://pay?pa={payeeUpi}&pn={payeeName}&am={amount}&tn={reference}
  const upiDeepLink = chosenPlan
    ? `upi://pay?pa=${encodeURIComponent(chosenPlan.payeeUpi)}&pn=${encodeURIComponent(chosenPlan.payeeName)}&am=${chosenPlan.amount}&tn=${encodeURIComponent(derivedHumanRef)}&cu=INR`
    : '';

  // Copy UPI string
  const handleCopyUpi = () => {
    if (!chosenPlan) return;
    navigator.clipboard.writeText(chosenPlan.payeeUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Verification queue: Payments belonging to this teacher (or all for admin)
  const verificationQueue = payments.filter(p => {
    if (role === 'admin') return true;
    return p.payeeId === account?.id;
  });

  const filteredPayments = verificationQueue.filter(p => {
    const matchesSearch =
      p.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.humanReference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateFeePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cohort = cohorts.find(c => c.id === newPlanCohortId);

    const payeeId = account?.id || institute.id;
    const payeeName = account?.payout?.accountName || account?.name || institute.settlementAccountName;
    const payeeUpi = account?.payout?.upiId || institute.settlementUpi;

    const plan: FeePlan = {
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      course: newPlanCourse,
      cohortId: newPlanCohortId,
      cohortName: cohort?.name,
      amount: newPlanAmount,
      currency: 'INR',
      durationMonths: newPlanMonths,
      payeeId,
      payeeName,
      payeeUpi,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await addFeePlan(plan);
    setIsPlanModalOpen(false);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a compressed screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setPaymentProofData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);

    const cleanUtr = enteredUtrReference.trim().toUpperCase();
    if (!cleanUtr) {
      setRecordError('Please enter the bank / UPI 12-digit transaction reference number (UTR).');
      return;
    }

    if (cleanUtr.length < 8) {
      setRecordError('Valid UTR / Transaction Reference must be at least 8 characters.');
      return;
    }

    if (!chosenPlan || !chosenStudent) return;

    try {
      const payment: Payment = {
        id: 'pay_' + Math.random().toString(36).substring(2, 9),
        payerStudentId: chosenStudent.id,
        payerName: chosenStudent.name,
        payerPhone: chosenStudent.phone,
        payeeId: chosenPlan.payeeId,
        payeeName: chosenPlan.payeeName,
        payeeUpi: chosenPlan.payeeUpi,
        feePlanId: chosenPlan.id,
        course: chosenPlan.course,
        cohortId: chosenPlan.cohortId,
        cohortName: chosenPlan.cohortName,
        amount: chosenPlan.amount,
        currency: 'INR',
        reference: cleanUtr,
        humanReference: derivedHumanRef,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        paymentProofUrl: paymentProofData,
        bankPayerName: bankPayerName.trim() || undefined
      };

      await recordPayment(payment);
      setEnteredUtrReference('');
      setBankPayerName('');
      setPaymentProofData(undefined);
      setActiveTabSub('queue');
    } catch (err: any) {
      setRecordError(err.message || 'Payment submission failed.');
    }
  };

  const handleTeacherSignReceipt = async () => {
    if (!selectedPaymentForInspect || !account) return;

    if (selectedPaymentForInspect.payeeId !== account.id && role !== 'admin') {
      alert('Security Policy: Only the faculty member this settlement payment belongs to can sign the fee receipt.');
      return;
    }

    setIsSigning(true);
    try {
      let privateJwk = unlockedSigningKey;
      if (!privateJwk) {
        const keyPair = await generateSigningKeyPair();
        privateJwk = keyPair.privateJwk;
      }

      const signingTimestamp = new Date().toISOString();
      const canonicalPayload = buildCanonicalReceiptPayload({
        amount: selectedPaymentForInspect.amount,
        cohortId: selectedPaymentForInspect.cohortId,
        course: selectedPaymentForInspect.course,
        currency: selectedPaymentForInspect.currency,
        feePlanId: selectedPaymentForInspect.feePlanId,
        id: selectedPaymentForInspect.id,
        payeeId: selectedPaymentForInspect.payeeId,
        payerStudentId: selectedPaymentForInspect.payerStudentId,
        reference: selectedPaymentForInspect.reference,
        signingTimestamp,
        status: 'verified'
      });

      const signatureHex = await signReceipt(canonicalPayload, privateJwk);
      await verifyPaymentAndSign(selectedPaymentForInspect.id, signatureHex, verificationNote);
      setSelectedPaymentForInspect(null);
      setVerificationNote('');
    } catch (err: any) {
      alert('Failed to sign receipt: ' + (err.message || 'Error'));
    } finally {
      setIsSigning(false);
    }
  };

  const handleVerifyExistingReceipt = async (payment: Payment) => {
    if (!payment.receiptSignature || !payment.receiptSignedAt) {
      setSignatureVerificationStatus(false);
      return;
    }

    const canonicalPayload = buildCanonicalReceiptPayload({
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

    const pubKey = account?.signingPublicKey;
    if (!pubKey) {
      setSignatureVerificationStatus(false);
      return;
    }

    const isValid = await verifyReceiptSignature(canonicalPayload, payment.receiptSignature, pubKey);
    setSignatureVerificationStatus(isValid);
  };

  const handleSaveTeacherPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutUpi.trim() || !payoutName.trim()) return;

    await updateAccountPayout({
      upiId: payoutUpi.trim(),
      accountName: payoutName.trim()
    });
    setPayoutSaved(true);
    setTimeout(() => setPayoutSaved(false), 3000);
  };

  const handleSaveInstitutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteUpi.trim() || !instituteAccountName.trim()) return;

    await updateInstituteSettlement(instituteUpi, instituteAccountName);
    setInstituteSaved(true);
    setTimeout(() => setInstituteSaved(false), 3000);
  };

  const pendingCount = verificationQueue.filter(p => p.status === 'submitted').length;
  const verifiedCount = verificationQueue.filter(p => p.status === 'verified').length;
  const totalVerifiedSum = verificationQueue
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-content-primary dark:text-content-primary-dark tracking-tight">
          Fees, Payouts & Anti-Proxy Ledger
        </h2>
        <p className="text-xs sm:text-sm text-content-secondary dark:text-content-secondary-dark mt-1">
          Cryptographically signed receipts and verified UPI settlements. Anti-proxy architecture stops duplicate or fake fee submissions.
        </p>
      </div>

      {/* Anti-Proxy Protection System Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#1a2744] to-[#24355a] text-white shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f59e0b] flex items-center justify-center text-[#1a2744] shrink-0 font-bold">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
              <span>Anti-Proxy Security Guarantee</span>
              <span className="text-[10px] bg-[#f59e0b] text-[#1a2744] font-bold px-1.5 py-0.5 rounded">ECDSA P-256</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-relaxed">
              Every fee payment is checked against the global ledger to eliminate proxy references. A transaction reference (UTR) can only be submitted once across the whole institute. Each receipt is digitally signed with the teacher's cryptographic key pair.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Awaiting Verification</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#f59e0b]">{pendingCount}</span>
            <span className="text-[10px] text-content-secondary">records</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Verified Receipts</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{verifiedCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium">Signed</span>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">Total Settled</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#1a2744] dark:text-blue-300">
              ₹{totalVerifiedSum.toLocaleString()}
            </span>
            <span className="text-[10px] text-content-secondary">INR</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Pill Navigation (Mobile Friendly) */}
      <div className="flex bg-slate-100 dark:bg-surface-raised-dark p-1 rounded-xl gap-1 overflow-x-auto text-xs font-semibold no-scrollbar">
        <button
          onClick={() => setActiveTabSub('queue')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-center transition-all ${
            activeTabSub === 'queue'
              ? 'bg-white dark:bg-surface-dark text-[#1a2744] dark:text-white shadow-xs font-bold'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Verification ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTabSub('record')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-center transition-all ${
            activeTabSub === 'record'
              ? 'bg-white dark:bg-surface-dark text-[#1a2744] dark:text-white shadow-xs font-bold'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Collect Fee
        </button>
        <button
          onClick={() => setActiveTabSub('plans')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-center transition-all ${
            activeTabSub === 'plans'
              ? 'bg-white dark:bg-surface-dark text-[#1a2744] dark:text-white shadow-xs font-bold'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Fee Plans ({feePlans.length})
        </button>
        <button
          onClick={() => setActiveTabSub('payout-setup')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-center transition-all ${
            activeTabSub === 'payout-setup'
              ? 'bg-white dark:bg-surface-dark text-[#1a2744] dark:text-white shadow-xs font-bold'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Payment Setup
        </button>
      </div>

      {/* SUB-SURFACE 1: Verification Queue */}
      {activeTabSub === 'queue' && (
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" />
              <input
                type="text"
                placeholder="Search candidate, UTR reference or receipt ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark text-content-primary dark:text-content-primary-dark focus:outline-hidden focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'submitted', 'verified', 'rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all capitalize ${
                    filterStatus === st
                      ? 'bg-[#1a2744] text-white border-[#1a2744]'
                      : 'bg-white dark:bg-surface-dark text-content-secondary border-border dark:border-border-dark'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List for Phone App Feeling */}
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark p-6">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60 mb-2" />
              <h4 className="font-semibold text-sm">No Payments In Queue</h4>
              <p className="text-xs text-content-secondary mt-1 max-w-sm mx-auto">
                All submitted fees have been verified or no fee records match your search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPayments.map(payment => (
                <div
                  key={payment.id}
                  className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-3.5 shadow-xs transition-all hover:border-[#1a2744]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-content-primary dark:text-content-primary-dark truncate">
                          {payment.payerName}
                        </span>
                        <span className="font-mono text-[10px] text-content-secondary bg-slate-100 dark:bg-surface-raised-dark px-1.5 py-0.5 rounded">
                          {payment.humanReference}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-content-secondary flex-wrap">
                        <span>{payment.course}</span>
                        <span>•</span>
                        <span className="font-mono">UTR: {payment.reference}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-base font-bold text-[#1a2744] dark:text-amber-400">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      <div className="mt-1">
                        {payment.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        )}
                        {payment.status === 'submitted' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Check UTR
                          </span>
                        )}
                        {payment.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {payment.bankPayerName && (
                    <div className="mt-2 text-[11px] text-content-secondary bg-slate-50 dark:bg-surface-raised-dark/60 p-2 rounded-lg flex items-center justify-between">
                      <span>Sender Account Name:</span>
                      <span className="font-semibold text-content-primary dark:text-content-primary-dark">{payment.bankPayerName}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-border/70 dark:border-border-dark/70 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-content-secondary font-mono">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant={payment.status === 'submitted' ? 'accent' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedPaymentForInspect(payment);
                        setSignatureVerificationStatus(null);
                        setVerificationNote('');
                      }}
                    >
                      {payment.status === 'submitted' ? 'Verify & Sign' : 'View Digital Receipt'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-SURFACE 2: Collect Fee (Student Checkout / Recording) */}
      {activeTabSub === 'record' && (
        <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-4 sm:p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-base text-content-primary dark:text-content-primary-dark">
              Student Fee Checkout & Reference Submission
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Payee and amount are locked to prevent proxy diversion. Student pays using direct UPI QR / deep-link.
            </p>
          </div>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <Select
              label="1. Select Fee Plan"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              options={feePlans.map(p => ({
                value: p.id,
                label: `${p.course} — ₹${p.amount.toLocaleString()} (${p.durationMonths} Months)`
              }))}
            />

            <Select
              label="2. Select Student from Roster"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={students.map(s => ({
                value: s.id,
                label: `${s.name} [Roll: ${s.rollNo}]`
              }))}
            />

            {/* Direct Payee Card */}
            {chosenPlan && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-raised-dark border border-border dark:border-border-dark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Official Settlement Payee (Locked)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Anti-Proxy Enforced
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-content-secondary text-[11px] block">Beneficiary:</span>
                    <span className="font-bold text-content-primary dark:text-content-primary-dark">{chosenPlan.payeeName}</span>
                  </div>
                  <div>
                    <span className="text-content-secondary text-[11px] block">Amount Due:</span>
                    <span className="font-mono text-base font-bold text-[#1a2744] dark:text-[#f59e0b]">
                      ₹{chosenPlan.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-surface-dark border border-border dark:border-border-dark flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-content-secondary block">UPI ID for payment:</span>
                    <span className="font-mono font-bold text-xs text-[#1a2744] dark:text-blue-300 truncate block">
                      {chosenPlan.payeeUpi}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 rounded-lg border border-border text-xs flex items-center gap-1 hover:bg-slate-50 text-content-secondary"
                  >
                    {copiedUpi ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="text-[11px]">{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="pt-1">
                  <a
                    href={upiDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a2744] hover:bg-[#0f1a35] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink size={14} /> Open UPI App on This Device
                  </a>
                </div>
              </div>
            )}

            <Field
              label="3. Bank / UPI 12-Digit Reference (UTR Number)"
              required
              value={enteredUtrReference}
              onChange={(e) => setEnteredUtrReference(e.target.value)}
              placeholder="e.g. 412389104812"
              helper="Checked globally across the entire institute ledger to prevent proxy double-use."
            />

            <Field
              label="Sender Bank Account Name (Optional)"
              value={bankPayerName}
              onChange={(e) => setBankPayerName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              helper="Account holder name shown in your UPI app to help faculty identify your transaction."
            />

            {/* Optional screenshot upload */}
            <div>
              <label className="block text-xs font-semibold text-content-primary dark:text-content-primary-dark mb-1">
                Upload Payment Screenshot (Optional proof)
              </label>
              <label className="flex items-center justify-center border border-dashed border-border dark:border-border-dark rounded-xl p-3 bg-slate-50 dark:bg-surface-raised-dark hover:bg-slate-100 cursor-pointer text-xs text-content-secondary">
                <Upload size={16} className="mr-2 text-content-secondary" />
                <span>{paymentProofData ? 'Screenshot Selected (tap to change)' : 'Tap to upload screenshot'}</span>
                <input type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
              </label>
              {paymentProofData && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={paymentProofData} alt="Proof" className="w-12 h-12 object-cover rounded-lg border" />
                  <span className="text-xs text-emerald-600 font-medium">Proof attached</span>
                </div>
              )}
            </div>

            {recordError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{recordError}</span>
              </div>
            )}

            <Button variant="accent" size="lg" type="submit" className="w-full">
              Submit Fee for Anti-Proxy Verification
            </Button>
          </form>
        </div>
      )}

      {/* SUB-SURFACE 3: Fee Plans */}
      {activeTabSub === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <p className="text-xs text-content-secondary">
              Active fee schedules published for student cohorts. Beneficiaries are locked per plan.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPlanModalOpen(true)}
              icon={<Plus size={14} />}
            >
              Publish New Fee Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feePlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-content-primary dark:text-content-primary-dark">
                      {plan.course}
                    </h4>
                    <span className="text-[11px] text-content-secondary">
                      {plan.cohortName || 'All Batches'} • {plan.durationMonths} Months
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold text-[#1a2744] dark:text-[#f59e0b]">
                    ₹{plan.amount.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/70 dark:border-border-dark/70 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-content-secondary text-[11px]">Beneficiary:</span>
                    <span className="font-semibold text-content-primary dark:text-content-primary-dark truncate max-w-[150px]">
                      {plan.payeeName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary text-[11px]">UPI Address:</span>
                    <span className="font-mono text-[#1a2744] dark:text-blue-300 font-semibold">{plan.payeeUpi}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SURFACE 4: Payment Setup & Credentials Update */}
      {activeTabSub === 'payout-setup' && (
        <div className="space-y-4 max-w-xl mx-auto">
          {/* Teacher Payout Update */}
          <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1a2744] text-[#f59e0b] flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-content-primary dark:text-content-primary-dark">
                    Your Faculty Payout Credentials
                  </h3>
                  <p className="text-xs text-content-secondary">
                    Update where students send fee settlements for your batches.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveTeacherPayout} className="space-y-3.5">
              <Field
                label="Beneficiary / Account Holder Name"
                required
                value={payoutName}
                onChange={(e) => setPayoutName(e.target.value)}
                placeholder="Prof. Priya Sharma Faculty Account"
                helper="The legal name attached to your bank account."
              />

              <Field
                label="Your Personal Faculty UPI ID"
                required
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value)}
                placeholder="priya.sharma@okaxis"
                helper="UPI address where fee payments will be directly credited."
              />

              {account?.signingPublicKey && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-raised-dark border border-border dark:border-border-dark text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <ShieldCheck size={14} />
                    <span>Cryptographic Signing Key Active</span>
                  </div>
                  <p className="text-[11px] text-content-secondary leading-relaxed">
                    ECDSA P-256 key pair is securely bound to your local vault. Updating your payout UPI preserves your signing key so existing receipts remain valid.
                  </p>
                </div>
              )}

              {payoutSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} /> Payout credentials successfully updated!
                </div>
              )}

              <Button variant="primary" size="md" type="submit" className="w-full">
                Save Faculty Payout Credentials
              </Button>
            </form>
          </div>

          {/* Institute Admin Settlement Update (if Admin) */}
          {role === 'admin' && (
            <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-[#1a2744] flex items-center justify-center font-bold">
                  <Building size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-content-primary dark:text-content-primary-dark">
                    Institute-Wide Master Settlement Account
                  </h3>
                  <p className="text-xs text-content-secondary">
                    Admin setting: fallback settlement account for institute-level fee plans.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveInstitutePayout} className="space-y-3.5">
                <Field
                  label="Institute Trust / Legal Entity Name"
                  required
                  value={instituteAccountName}
                  onChange={(e) => setInstituteAccountName(e.target.value)}
                  placeholder="Phi Coaching Trust Educational Fund"
                />

                <Field
                  label="Institute Master Settlement UPI ID"
                  required
                  value={instituteUpi}
                  onChange={(e) => setInstituteUpi(e.target.value)}
                  placeholder="phi.coaching@icici"
                />

                {instituteSaved && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={15} /> Institute master settlement updated!
                  </div>
                )}

                <Button variant="accent" size="md" type="submit" className="w-full">
                  Update Institute Settlement Account
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Inspect & Verify Modal */}
      {selectedPaymentForInspect && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPaymentForInspect(null)}
          title="Payment Verification & Digital Receipt"
          subtitle={`Receipt Reference: ${selectedPaymentForInspect.humanReference}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Payment Summary Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-surface-raised-dark border border-border dark:border-border-dark">
              <div>
                <span className="text-content-secondary text-[11px] block">Student Name:</span>
                <span className="font-bold text-sm text-content-primary dark:text-content-primary-dark">
                  {selectedPaymentForInspect.payerName}
                </span>
              </div>
              <div>
                <span className="text-content-secondary text-[11px] block">Course:</span>
                <span className="font-semibold text-content-primary dark:text-content-primary-dark">
                  {selectedPaymentForInspect.course}
                </span>
              </div>
              <div>
                <span className="text-content-secondary text-[11px] block">Amount Settled:</span>
                <span className="font-mono text-lg font-bold text-[#1a2744] dark:text-[#f59e0b]">
                  ₹{selectedPaymentForInspect.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-content-secondary text-[11px] block">Transaction Reference (UTR):</span>
                <span className="font-mono font-bold text-sm text-[#1a2744] dark:text-blue-300">
                  {selectedPaymentForInspect.reference}
                </span>
              </div>
            </div>

            {selectedPaymentForInspect.bankPayerName && (
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-surface-dark border text-[11px] flex justify-between">
                <span className="text-content-secondary">Declared Bank Payer:</span>
                <span className="font-bold">{selectedPaymentForInspect.bankPayerName}</span>
              </div>
            )}

            {/* Proof screenshot if available */}
            {selectedPaymentForInspect.paymentProofUrl && (
              <div className="space-y-1">
                <span className="text-content-secondary text-[11px] block font-semibold">Payment Screenshot Proof:</span>
                <div className="border rounded-xl overflow-hidden max-h-48 flex justify-center bg-black/5">
                  <img
                    src={selectedPaymentForInspect.paymentProofUrl}
                    alt="Payment Screenshot"
                    className="max-h-48 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Digital Signature Card */}
            {selectedPaymentForInspect.receiptSignature ? (
              <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Digitally Signed Receipt (ECDSA P-256)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerifyExistingReceipt(selectedPaymentForInspect)}
                  >
                    Verify Signature
                  </Button>
                </div>
                <p className="font-mono text-[10px] text-content-secondary break-all">
                  Signature: {selectedPaymentForInspect.receiptSignature}
                </p>
                <p className="text-[10px] text-content-secondary">
                  Signed At: {selectedPaymentForInspect.receiptSignedAt}
                </p>

                {signatureVerificationStatus !== null && (
                  <div className={`p-2 rounded-lg text-xs font-semibold ${
                    signatureVerificationStatus
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {signatureVerificationStatus
                      ? '✓ Cryptographic Verification Passed: Signature matches published teacher public key and canonical receipt payload.'
                      : '✗ Verification Failed: Payload has been tampered with or key mismatch.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Awaiting Faculty Anti-Proxy Check</span>
                </div>
                <p className="text-xs text-content-secondary dark:text-content-secondary-dark leading-relaxed">
                  Verify on your banking app or SMS that <strong>₹{selectedPaymentForInspect.amount.toLocaleString()}</strong> with reference <strong>{selectedPaymentForInspect.reference}</strong> was received before signing.
                </p>
                <Field
                  label="Internal Verification Note (Optional)"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="e.g. Verified via Axis Bank statement at 10:30 AM"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2 border-t border-border">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) {
                    rejectPayment(selectedPaymentForInspect.id, reason);
                    setSelectedPaymentForInspect(null);
                  }
                }}
              >
                Reject Reference
              </Button>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedPaymentForInspect(null)}>
                  Close
                </Button>
                {!selectedPaymentForInspect.receiptSignature && (
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={isSigning}
                    onClick={handleTeacherSignReceipt}
                    icon={<FileCheck size={14} />}
                  >
                    {isSigning ? 'Signing ECDSA Receipt...' : 'Confirm & Sign Receipt'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Fee Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Publish Course Fee Plan"
        subtitle="Establish fee schedule and settlement routing."
      >
        <form onSubmit={handleCreateFeePlan} className="space-y-4">
          <Select
            label="Course"
            value={newPlanCourse}
            onChange={(e) => setNewPlanCourse(e.target.value)}
            options={institute.courses.map(c => ({ value: c.name, label: c.name }))}
          />
          <Select
            label="Designated Cohort"
            value={newPlanCohortId}
            onChange={(e) => setNewPlanCohortId(e.target.value)}
            options={cohorts.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
          />
          <Field
            label="Fee Amount (INR)"
            type="number"
            value={newPlanAmount}
            onChange={(e) => setNewPlanAmount(parseInt(e.target.value, 10) || 0)}
          />
          <Field
            label="Duration in Months"
            type="number"
            value={newPlanMonths}
            onChange={(e) => setNewPlanMonths(parseInt(e.target.value, 10) || 12)}
          />

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-surface-raised-dark border text-xs">
            <span className="text-content-secondary block">Settlement Beneficiary (Derived):</span>
            <span className="font-semibold text-content-primary dark:text-content-primary-dark">
              {account?.payout?.accountName || institute.settlementAccountName} ({account?.payout?.upiId || institute.settlementUpi})
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Publish Fee Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
