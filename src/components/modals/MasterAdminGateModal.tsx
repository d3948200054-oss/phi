import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Terminal,
  Mail,
  GraduationCap,
  PhoneCall,
  ExternalLink,
  MessageCircle,
  X
} from 'lucide-react';
import { Button } from '../primitives/Button';
import {
  getLockoutRemainingSeconds,
  getFailedAttemptsCount,
  DIRECTOR_PROFILE
} from '../../utils/adminAuth';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';

interface MasterAdminGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MasterAdminGateModal: React.FC<MasterAdminGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { unlockMasterAdmin } = useTeachDeskStore();
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isAuthExpanded, setIsAuthExpanded] = useState(false);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    if (!isOpen) return;

    setLockoutSec(getLockoutRemainingSeconds());
    setFailedCount(getFailedAttemptsCount());

    const timer = setInterval(() => {
      const remaining = getLockoutRemainingSeconds();
      setLockoutSec(remaining);
      if (remaining === 0) {
        setFailedCount(getFailedAttemptsCount());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSec > 0 || isVerifying) return;

    setError(null);
    setIsVerifying(true);

    try {
      const result = await unlockMasterAdmin(password, pin);
      if (result.success) {
        setPassword('');
        setPin('');
        onSuccess();
      } else {
        setError(result.error || 'Authentication denied. Incorrect password or PIN.');
        setLockoutSec(getLockoutRemainingSeconds());
        setFailedCount(getFailedAttemptsCount());
      }
    } catch (err: any) {
      setError(err.message || 'Security system error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isLockedOut = lockoutSec > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d1424] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans relative max-h-[92vh] flex flex-col">
        {/* Top Gold Security Glow Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-pulse shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0f182e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              φ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                  COACHING FOUNDER TERMINAL
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white tracking-tight mt-0.5">
                Phi Coaching Admin Access Panel
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Founder & Director Profile Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121c35] to-[#0a1020] border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-serif font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white tracking-tight">{DIRECTOR_PROFILE.name}</h4>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      MASTER DIRECTOR
                    </span>
                  </div>
                  <p className="text-xs text-amber-300/90 font-medium">
                    Phi Coaching Founder & Trustee
                  </p>
                </div>
              </div>
            </div>

            {/* Official Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
              {/* Email */}
              <div className="p-2 rounded-lg bg-[#0a1120] border border-slate-800/80 flex items-center gap-2">
                <Mail size={14} className="text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">Personal Email:</span>
                  <a
                    href={`mailto:${DIRECTOR_PROFILE.email}`}
                    className="text-slate-200 hover:text-amber-300 transition-colors font-medium truncate block"
                  >
                    {DIRECTOR_PROFILE.email}
                  </a>
                </div>
              </div>

              {/* College ID */}
              <div className="p-2 rounded-lg bg-[#0a1120] border border-slate-800/80 flex items-center gap-2">
                <GraduationCap size={14} className="text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">College ID (AMU):</span>
                  <a
                    href={`mailto:${DIRECTOR_PROFILE.collegeId}`}
                    className="text-slate-200 hover:text-amber-300 transition-colors font-medium truncate block"
                  >
                    {DIRECTOR_PROFILE.collegeId}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="p-2 rounded-lg bg-[#0a1120] border border-slate-800/80 flex items-center gap-2">
                <MessageCircle size={14} className="text-green-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">WhatsApp Number:</span>
                  <a
                    href={`https://wa.me/91${DIRECTOR_PROFILE.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                  >
                    {DIRECTOR_PROFILE.whatsapp}
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="p-2 rounded-lg bg-[#0a1120] border border-slate-800/80 flex items-center gap-2">
                <ExternalLink size={14} className="text-blue-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block">LinkedIn Profile:</span>
                  <a
                    href={DIRECTOR_PROFILE.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors truncate block"
                  >
                    Omshankar Bhardwaj
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          {!isAuthExpanded && (
            <Button
              type="button"
              variant="primary"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 text-sm shadow-lg shadow-amber-500/20"
              onClick={() => setIsAuthExpanded(true)}
              icon={<Shield size={16} />}
            >
              Open Admin Access Panel (Password + PIN Verification) →
            </Button>
          )}

          {/* Authentication Form (Password & PIN) */}
          {isAuthExpanded && (
            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 animate-in fade-in">
              {/* Security Alert if Lockout */}
              {isLockedOut ? (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-red-300 uppercase tracking-wide">
                      Lockout Active
                    </strong>
                    <span>
                      Unauthorized attempts detected. Please wait{' '}
                      <strong className="font-mono text-amber-400 font-bold">{lockoutSec}s</strong>.
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Master Password */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound size={13} className="text-amber-400" />
                    Master Admin Password
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">omshankar / Omshankar</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLockedOut || isVerifying}
                    autoFocus
                    placeholder="Enter password (omshankar or Omshankar)..."
                    className="w-full bg-[#141d33] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Master PIN */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-400" />
                    Master Security PIN
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">PIN: 27102008</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    maxLength={8}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    disabled={isLockedOut || isVerifying}
                    placeholder="Enter PIN (27102008)..."
                    className="w-full bg-[#141d33] border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Anti-Brute Force Footer Status */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Dual-Factor Cryptographic Shield</span>
                <span className="text-amber-300">{5 - failedCount}/5 Attempts Left</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsAuthExpanded(false)}
                  disabled={isVerifying}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLockedOut || isVerifying || !password || pin.length < 4}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {isVerifying ? 'Verifying Cipher...' : 'Authorize Master & Open Console →'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#080c18] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
          <span>Phi Coaching Master Cryptographic Node</span>
          <span>Director Omshankar</span>
        </div>
      </div>
    </div>
  );
};
