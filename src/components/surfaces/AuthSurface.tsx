import React, { useState } from 'react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { Field } from '../primitives/Field';
import { Select } from '../primitives/Select';
import { Button } from '../primitives/Button';
import { MobileFilePicker } from '../primitives/MobileFilePicker';
import { Account } from '../../types';
import { generateSigningKeyPair, sealWithPassword } from '../../utils/crypto';
import { Lock, UserCheck, Shield, Sparkles, Building } from 'lucide-react';

export const AuthSurface: React.FC = () => {
  const { signIn, registerTeacher, institute, teachersList } = useTeachDeskStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('admin@phi.edu');
  const [signInPassword, setSignInPassword] = useState('ApexTeacher#2026');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign Up form
  const [inviteCode, setInviteCode] = useState('PHI-2026');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [course, setCourse] = useState('JEE Advanced Elite');
  const [qualification, setQualification] = useState('M.Sc. / B.Tech');
  const [yearsExperience, setYearsExperience] = useState('8');
  const [avatarData, setAvatarData] = useState<string | undefined>(undefined);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    setIsSubmitting(true);

    try {
      const target = teachersList.find(t => t.email.toLowerCase() === signInEmail.trim().toLowerCase());
      if (!target) {
        setSignInError('No account provisioned with this email. Check invite credentials or sign up.');
        setIsSubmitting(false);
        return;
      }

      await signIn(target, signInPassword);
    } catch (err: any) {
      setSignInError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    if (inviteCode.trim() !== institute.inviteCode) {
      setSignUpError(`Invalid institute invite code. Valid code for this institute is ${institute.inviteCode}.`);
      return;
    }
    if (!fullName.trim() || !email.trim() || !password) {
      setSignUpError('Please fill in all required credentials.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate ECDSA P-256 signing key pair
      const { publicJwk, privateJwk } = await generateSigningKeyPair();

      // Seal private key and sensitive blob into account vault with PBKDF2 + AES-GCM
      const sealed = await sealWithPassword(
        { privateJwk, email: email.trim(), createdAt: new Date().toISOString() },
        password,
        email.trim()
      );

      const newAccount: Account = {
        id: 'acc_' + Math.random().toString(36).substring(2, 9),
        role: 'teacher', // Teacher onboarded via invite code
        name: fullName.trim(),
        email: email.trim(),
        avatar: avatarData,
        subject,
        courses: [course],
        phone: phone.trim() || '+91 90000 00000',
        qualification,
        yearsExperience: parseInt(yearsExperience, 10) || 5,
        instituteId: institute.id,
        createdAt: new Date().toISOString(),
        vaultSalt: sealed.saltHex,
        vaultIv: sealed.ivHex,
        vaultCiphertext: sealed.ciphertextHex,
        signingPublicKey: publicJwk,
        payout: {
          upiId: `${fullName.toLowerCase().replace(/\s+/g, '.')}@bank`,
          accountName: `${fullName} Faculty Account`
        }
      };

      await registerTeacher(newAccount, password, privateJwk);
    } catch (err: any) {
      setSignUpError(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] dark:bg-canvas-dark flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl shadow-xl overflow-hidden">
        {/* Brand Bar */}
        <div className="p-6 border-b border-border dark:border-border-dark bg-[#1a2744]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f59e0b] flex items-center justify-center text-[#1a2744] font-serif font-bold text-2xl">
              φ
            </div>
            <div>
              <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
                phi coaching
              </h2>
              <p className="text-xs text-white/60">
                Institute Console · {institute.name}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/70 font-medium">Excellence & Precision in Advanced Coaching</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex border-b border-border dark:border-border-dark text-xs font-semibold">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'signin'
                ? 'border-[#1a2744] text-[#1a2744] dark:text-[#3b5bdb] bg-white dark:bg-surface-dark'
                : 'border-transparent text-content-secondary hover:text-content-primary bg-slate-50 dark:bg-surface-raised-dark'
            }`}
          >
            Teacher Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-[#1a2744] text-[#1a2744] dark:text-[#3b5bdb] bg-white dark:bg-surface-dark'
                : 'border-transparent text-content-secondary hover:text-content-primary bg-slate-50 dark:bg-surface-raised-dark'
            }`}
          >
            Register with Invite Code
          </button>
        </div>

        <div className="p-6">
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field
                label="Registered Faculty Email"
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="faculty@phi.edu"
              />

              <Field
                label="Account Vault Password"
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••••••"
                helper="Passphrase used to decrypt your session key and ECDSA signing key."
              />

              {signInError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {signInError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
                icon={<Lock size={15} />}
              >
                {isSubmitting ? 'Verifying PBKDF2 Vault...' : 'Unlock Console Session'}
              </Button>

              {/* Fast switch accounts for demo evaluation */}
              <div className="mt-4 pt-4 border-t border-border dark:border-border-dark space-y-2">
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary block">
                  Quick Evaluation Profiles
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail('admin@phi.edu');
                      setSignInPassword('ApexTeacher#2026');
                    }}
                    className="p-2 border border-border dark:border-border-dark rounded bg-slate-50 dark:bg-surface-raised-dark hover:bg-[#1a2744]/5 dark:hover:bg-navy-900/20 text-left transition-colors"
                  >
                    <span className="font-semibold block text-content-primary dark:text-content-primary-dark">Admin Owner</span>
                    <span className="text-[10px] text-content-secondary block">Full oversight & catalogue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail('ananya@phi.edu');
                      setSignInPassword('ApexTeacher#2026');
                    }}
                    className="p-2 border border-border dark:border-border-dark rounded bg-slate-50 dark:bg-surface-raised-dark hover:bg-[#1a2744]/5 dark:hover:bg-navy-900/20 text-left transition-colors"
                  >
                    <span className="font-semibold block text-content-primary dark:text-content-primary-dark">Faculty Teacher</span>
                    <span className="text-[10px] text-content-secondary block">Authoring & signing receipts</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <Field
                label="Institute Invite Code"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="PHI-2026"
                helper="Supplied by the institute director."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Prof. Rajesh Sharma"
                />
                <Field
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@phi.edu"
                />
              </div>

              <Field
                label="Master Passphrase"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                helper="PBKDF2-SHA256 (210k iters) generates your local vault seal."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Teaching Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  options={[
                    { value: 'Physics', label: 'Physics' },
                    { value: 'Chemistry', label: 'Chemistry' },
                    { value: 'Mathematics', label: 'Mathematics' },
                    { value: 'Biology', label: 'Biology' }
                  ]}
                />
                <Select
                  label="Assigned Course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  options={institute.courses.map(c => ({ value: c.name, label: c.name }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 11223"
                />
                <Field
                  label="Years Experience"
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="8"
                />
              </div>

              {/* Profile Photo Picker: Mobile-Safe + Selfie Route */}
              <div className="pt-1">
                <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark block mb-1">
                  Profile Photo (Selfie or Upload)
                </span>
                <MobileFilePicker
                  accept="image/*"
                  enableCamera={true}
                  label={avatarData ? 'Photo Chosen (tap to replace)' : 'Select Photo or Take Selfie'}
                  helperText="Used on signed fee receipts and mentoring threads"
                  onFileSelect={handleAvatarFile}
                />
                {avatarData && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-content-secondary">
                    <img src={avatarData} alt="Preview" className="w-8 h-8 rounded-full object-cover border" />
                    <span>Photo preview loaded</span>
                  </div>
                )}
              </div>

              {signUpError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {signUpError}
                </div>
              )}

              <Button
                type="submit"
                variant="accent"
                className="w-full mt-2"
                disabled={isSubmitting}
                icon={<UserCheck size={15} />}
              >
                {isSubmitting ? 'Generating ECDSA P-256 Vault...' : 'Register Teacher Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
