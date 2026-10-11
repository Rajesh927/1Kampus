import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import { api } from '../lib/api.js';
import {
  Sparkles,
  User,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  Hash,
  School,
} from 'lucide-react';

// Approved Campus Academic Sections
const APPROVED_SECTIONS = [
  'CSE-A',
  'CSE-B',
  'CSE-C',
  'CSE-D',
  'IT-A',
  'IT-B',
  'ECE-A',
  'ECE-B',
  'AIDS-A',
  'Mechanical-A',
  'Biotech-A',
  'Other',
];

export const AuthPage: React.FC<{ initialMode?: 'login' | 'signup' }> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setEmailError(null);
    setRegError(null);
  }, [initialMode]);
  
  // 5 Required Student Signup Fields
  const [fullName, setFullName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [section, setSection] = useState('CSE-A');
  const [customSection, setCustomSection] = useState('');

  // Uniqueness & Validation Feedback
  const [emailError, setEmailError] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingReg, setCheckingReg] = useState(false);

  // Password Reset / Recovery Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { loginWithSupabase, signupStudent, requestPasswordReset } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Check Email uniqueness on blur
  const handleEmailBlur = async () => {
    const clean = email.trim();
    if (!clean || !clean.includes('@') || mode !== 'signup') return;
    setCheckingEmail(true);
    try {
      const res = await api.checkUnique({ email: clean });
      if (res.data?.emailExists) {
        setEmailError('An account with this email address already exists.');
      } else {
        setEmailError(null);
      }
    } catch {
      // Ignore background check failure
    } finally {
      setCheckingEmail(false);
    }
  };

  // Check Registration Number uniqueness on blur
  const handleRegBlur = async () => {
    const clean = registrationNumber.trim();
    if (!clean || clean.length < 3 || mode !== 'signup') return;
    setCheckingReg(true);
    try {
      const res = await api.checkUnique({ registration_number: clean });
      if (res.data?.registrationNumberExists) {
        setRegError('This college registration number is already registered.');
      } else {
        setRegError(null);
      }
    } catch {
      // Ignore background check failure
    } finally {
      setCheckingReg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup') {
      const trimmedName = fullName.trim();
      const trimmedReg = registrationNumber.trim().toUpperCase();
      const trimmedEmail = email.trim().toLowerCase();
      const finalSection = section === 'Other' ? customSection.trim() : section;

      // 1. Full name validation
      if (!trimmedName) {
        error('Invalid Name', 'Full name is required.');
        return;
      }

      // 2. Registration number validation
      if (!trimmedReg || trimmedReg.length < 3) {
        error('Invalid Registration Number', 'Please enter a valid college registration number (e.g. RA2311003010123).');
        return;
      }

      // 3. Email validation
      if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        error('Invalid Email', 'Please enter a valid student email address.');
        return;
      }

      // 4. Section validation
      if (!finalSection) {
        error('Section Required', 'Please select or specify your academic section.');
        return;
      }

      // 5. Password validation
      if (!password || password.length < 6) {
        error('Password Too Short', 'Password must be at least 6 characters for account security.');
        return;
      }

      if (emailError || regError) {
        error('Duplicate Account Information', emailError || regError || 'Please fix the highlighted errors before submitting.');
        return;
      }

      setSubmitting(true);
      try {
        await signupStudent({
          full_name: trimmedName,
          registration_number: trimmedReg,
          email: trimmedEmail,
          section: finalSection,
          password,
        });

        success('Account Created Successfully', `Welcome to 1Kampus, ${trimmedName}!`);
        navigate('/events');
      } catch (err: any) {
        const msg = err.message || 'Could not complete registration.';
        if (msg.includes('email') || msg.includes('DUPLICATE_EMAIL')) {
          setEmailError('An account with this email address already exists.');
        }
        if (msg.includes('registration number') || msg.includes('DUPLICATE_REGISTRATION_NUMBER')) {
          setRegError('This college registration number is already registered.');
        }
        error('Registration Failed', msg);
      } finally {
        setSubmitting(false);
      }
    } else {
      // Login flow
      if (!email.trim()) {
        error('Email Required', 'Please enter your university email address.');
        return;
      }
      if (!password) {
        error('Password Required', 'Please enter your account password.');
        return;
      }
      setSubmitting(true);
      try {
        const loggedUser = await loginWithSupabase(email.trim(), password);
        success('Signed In Successfully', 'Welcome back to 1Kampus!');
        const targetRole = loggedUser?.role || 'student';
        if (targetRole === 'admin') {
          navigate('/admin');
        } else if (targetRole === 'organizer') {
          navigate('/organizer');
        } else {
          navigate('/events');
        }
      } catch (err: any) {
        error('Authentication Error', err.message || 'Please check your email and password.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      error('Invalid Email', 'Please enter your registered email address.');
      return;
    }

    setSendingReset(true);
    try {
      const msg = await requestPasswordReset(forgotEmail.trim());
      info('Password Recovery', msg);
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      error('Recovery Error', err.message || 'Failed to dispatch password reset link.');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-[#141A29] border border-border/80 dark:border-border-dark flex items-center justify-center p-1 shadow-xs">
            <img
              src="/images/1kampus-logo.png"
              alt="1Kampus logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-black text-2xl text-ink dark:text-ink-dark tracking-tight">
            1Kampus
          </span>
        </Link>
        <h2 className="font-display font-extrabold text-2xl text-ink dark:text-ink-dark">
          {mode === 'login' ? 'Sign in to your account' : 'Join 1Kampus as Student'}
        </h2>
        <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
          {mode === 'login'
            ? 'Access your event registrations, digital QR tickets, and community.'
            : 'Register your official student profile for campus events and hackathons.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        {/* Institutional Assessment Personas */}
        <div className="bg-surface dark:bg-[#131B2E] border-2 border-brand-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-700 dark:text-brand-300 font-extrabold text-xs uppercase tracking-wider shadow-xs">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>1-Click Assessment Personas</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Portals
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            Select a verified campus persona below to access its official role authentication portal:
          </p>

          <div className="space-y-3 pt-1">
            {/* 1. Student Persona: Opens Student Login Page */}
            <button
              type="button"
              id="persona-student-button"
              onClick={() => {
                setMode('login');
                setEmail('alex.chen@student.srmist.edu.in');
                setPassword('');
                setTimeout(() => {
                  document.getElementById('auth-password-input')?.focus();
                }, 50);
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#182238] border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-[#1E2B47] text-left transition-all shadow-sm hover:shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Alex Chen</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700/60">
                      Student
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-0.5 truncate">
                    Student Login • Reg: RA2311003010123 • Sec: CSE-A
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-300 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 2. Organizer Persona: Opens Dedicated Organizer Login Page */}
            <button
              type="button"
              id="persona-organizer-button"
              onClick={() => {
                navigate('/organizer/login');
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#182238] border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-[#1E2B47] text-left transition-all shadow-sm hover:shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">ACM SRMIST</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60">
                      Organizer
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-0.5 truncate">
                    Organizer Portal • Dedicated login for verified club leads
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 3. Super Admin Persona: Opens Dedicated Admin Login Page */}
            <button
              type="button"
              id="persona-admin-button"
              onClick={() => {
                navigate('/admin/login');
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#182238] border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-[#1E2B47] text-left transition-all shadow-sm hover:shadow-md group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">SRMIST</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
                      Super Admin
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block mt-0.5 truncate">
                    Super Admin Console • Governance & approvals
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* Student Signup & Auth Form */}
        <div className="bg-surface dark:bg-surface-dark py-8 px-6 sm:px-8 border border-border dark:border-border-dark rounded-3xl shadow-card dark:shadow-card-dark space-y-5">
          <div className="text-center">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">
              {mode === 'signup' ? 'Complete Required Student Credentials' : 'Or continue with email'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    id="auth-fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* 2. College Registration Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>College Registration Number *</span>
                    </label>
                    {checkingReg && (
                      <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted animate-pulse">Checking uniqueness...</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={e => {
                      setRegistrationNumber(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    onBlur={handleRegBlur}
                    placeholder="e.g. RA2311003010456"
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      regError ? 'border-red-500 focus:ring-red-500' : 'border-border dark:border-border-dark focus:ring-brand-500'
                    } bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2`}
                  />
                  {regError ? (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regError}</span>
                    </p>
                  ) : (
                    <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">
                      Official university registration number used on admission ID card.
                    </span>
                  )}
                </div>

                {/* 4. Section (Academic Section) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Academic Section *</span>
                  </label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {APPROVED_SECTIONS.map(s => (
                      <option key={s} value={s}>
                        {s === 'Other' ? 'Other Section (Custom Input)' : `Section ${s}`}
                      </option>
                    ))}
                  </select>

                  {section === 'Other' && (
                    <input
                      type="text"
                      required
                      value={customSection}
                      onChange={e => setCustomSection(e.target.value)}
                      placeholder="Enter your department/section code (e.g. MECH-B)"
                      className="w-full mt-2 px-4 py-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
              </>
            )}

            {/* 3. Student Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Student / University Email *</span>
                </label>
                {checkingEmail && (
                  <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted animate-pulse">Checking uniqueness...</span>
                )}
              </div>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={handleEmailBlur}
                placeholder="name@student.srmist.edu.in"
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  emailError ? 'border-red-500 focus:ring-red-500' : 'border-border dark:border-border-dark focus:ring-brand-500'
                } bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2`}
              />
              {emailError && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* 5. Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Password *</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">
                  Must be at least 6 characters. Passwords are never stored in application tables.
                </span>
              )}
            </div>

            <Button id="auth-submit-button" variant="primary" size="lg" className="w-full mt-2" loading={submitting} type="submit">
              {mode === 'login' ? 'Sign In' : 'Create Student Account'}
            </Button>
          </form>

          {/* Toggle Login / Signup */}
          <div className="text-center pt-2 border-t border-border dark:border-border-dark space-y-2.5">
            {mode === 'login' ? (
              <div className="space-y-1">
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  New student to 1Kampus?
                </p>
                <button
                  type="button"
                  id="auth-switch-to-signup"
                  onClick={() => {
                    setMode('signup');
                    setEmailError(null);
                    setRegError(null);
                  }}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline cursor-pointer block w-full text-center"
                >
                  Create Student Account (Sign Up)
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  Already registered?
                </p>
                <button
                  type="button"
                  id="auth-switch-to-login"
                  onClick={() => {
                    setMode('login');
                    setEmailError(null);
                    setRegError(null);
                  }}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline cursor-pointer block w-full text-center"
                >
                  Sign In to Student Account
                </button>
              </div>
            )}

            {/* Dedicated Organizer Link */}
            <div className="pt-1 border-t border-border/40 dark:border-border-dark/40">
              <Link
                to="/organizer/login"
                id="organizer-auth-link"
                className="text-xs text-ink-muted dark:text-ink-dark-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-block text-center"
              >
                Are you an organizer? <span className="underline font-semibold text-brand-600 dark:text-brand-400">Login or create an organizer account.</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface dark:bg-surface-dark rounded-3xl p-6 border border-border dark:border-border-dark shadow-modal space-y-4">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
              <Lock className="w-5 h-5" />
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Reset Account Password</h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              Enter your student email address below. A secure password recovery link will be dispatched through Supabase Auth.
            </p>
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@student.srmist.edu.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border-dark">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" loading={sendingReset} type="submit">
                  Send Recovery Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
