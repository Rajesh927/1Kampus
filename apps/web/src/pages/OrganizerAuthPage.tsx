import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import { api } from '../lib/api.js';
import { OrganizerApplication } from '../types/index.js';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  Hash,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';

interface OrganizerAuthPageProps {
  initialMode?: 'login' | 'register';
}

export const OrganizerAuthPage: React.FC<OrganizerAuthPageProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { user, isAuthenticated, loginWithSupabase, logout } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (All 7 required fields)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [clubName, setClubName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState<OrganizerApplication | null>(null);
  const [existingApplication, setExistingApplication] = useState<OrganizerApplication | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // If already logged in, check approval status
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'organizer' && user.approval_status === 'approved') {
        navigate('/organizer');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.approval_status === 'pending' || user.approval_status === 'rejected') {
        fetchApplicationStatus();
      }
    }
  }, [isAuthenticated, user]);

  const fetchApplicationStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await api.getOrganizerApplicationStatus();
      if (res.success && res.data?.application) {
        setExistingApplication(res.data.application);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await loginWithSupabase(loginEmail.trim(), loginPassword);
      if (!loggedInUser) {
        throw new Error('Sign in failed. Please verify your email and password.');
      }
      if (loggedInUser.role === 'admin') {
        success('Administrator Access', 'Signed in as SRMIST Super Admin.');
        navigate('/admin');
        return;
      }

      if (loggedInUser.role === 'organizer' && loggedInUser.approval_status === 'approved') {
        success('Welcome Organizer', `Signed in as ${loggedInUser.full_name}.`);
        navigate('/organizer');
        return;
      }

      // Check if application is pending or rejected
      const statusRes = await api.getOrganizerApplicationStatus();
      if (statusRes.success && statusRes.data?.application) {
        setExistingApplication(statusRes.data.application);
      }

      if (loggedInUser.approval_status === 'pending') {
        info('Application Pending', 'Your organizer application is pending admin approval.');
      } else if (loggedInUser.approval_status === 'rejected') {
        error('Application Rejected', 'Your organizer application was rejected by the administrator.');
      } else {
        info('Student Account', 'This account has not been approved for organizer privileges yet.');
      }
    } catch (err: any) {
      error('Sign in failed', err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      error('Password Mismatch', 'The passwords entered do not match.');
      return;
    }

    if (password.length < 6) {
      error('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    if (reason.trim().length < 10) {
      error('Reason Required', 'Please provide a detailed reason of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.applyOrganizer({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        employee_id: employeeId.trim(),
        club_name: clubName.trim(),
        position: position.trim(),
        password,
        confirm_password: confirmPassword,
        reason: reason.trim(),
      });

      if (res.success && res.data) {
        setApplicationSubmitted(res.data.application);
        success('Application Submitted', 'Your organizer application is pending admin approval.');
        // If token returned, store auth so status is immediately visible
        if (res.data.token) {
          localStorage.setItem('cc_auth_token', res.data.token);
          localStorage.setItem('cc_user', JSON.stringify(res.data.user));
        }
      }
    } catch (err: any) {
      error('Application Error', err.message || 'Could not submit organizer application.');
    } finally {
      setSubmitting(false);
    }
  };

  // If applicant is currently logged in with pending status OR just submitted application
  const activeApp = applicationSubmitted || existingApplication;
  const isPending = user?.approval_status === 'pending' || activeApp?.status === 'pending';
  const isRejected = user?.approval_status === 'rejected' || activeApp?.status === 'rejected';

  if (activeApp || (isAuthenticated && (isPending || isRejected))) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-canvas-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Building2 className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-3xl p-8 shadow-card dark:shadow-card-dark space-y-6">
            {/* Status Header */}
            {isPending ? (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide uppercase border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Pending Admin Review</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-ink dark:text-ink-dark">
                  Your organizer application is pending admin approval.
                </h2>
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto leading-relaxed">
                  Thank you for applying to organize events for 1Kampus. The designated SRMIST administrator has been notified and will review your club affiliation.
                </p>
              </div>
            ) : isRejected ? (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold tracking-wide uppercase border border-red-500/20">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Application Rejected</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-ink dark:text-ink-dark">
                  Organizer Application Was Not Approved
                </h2>
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto leading-relaxed">
                  {activeApp?.rejection_reason
                    ? `Reason provided: "${activeApp.rejection_reason}"`
                    : 'The administrator was unable to approve organizer privileges for this account.'}
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-ink dark:text-ink-dark">
                  Organizer Access Granted!
                </h2>
              </div>
            )}

            {/* Submitted Application Details Card */}
            <div className="bg-canvas dark:bg-canvas-dark rounded-2xl p-5 border border-border/80 dark:border-border-dark/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted border-b border-border dark:border-border-dark pb-2">
                Application Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Applicant Name</span>
                  <span className="font-semibold text-ink dark:text-ink-dark">{activeApp?.full_name || user?.full_name}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Official Email</span>
                  <span className="font-semibold text-ink dark:text-ink-dark font-mono">{activeApp?.email || user?.email}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Registration / Employee ID</span>
                  <span className="font-semibold text-ink dark:text-ink-dark font-mono">{activeApp?.employee_id || user?.registration_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Club / Department</span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400">{activeApp?.club_name || user?.club_name}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Designated Position</span>
                  <span className="font-semibold text-ink dark:text-ink-dark">{activeApp?.position || user?.position}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted block">Submitted At</span>
                  <span className="font-semibold text-ink dark:text-ink-dark">
                    {activeApp?.submitted_at ? new Date(activeApp.submitted_at).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              </div>

              {activeApp?.reason && (
                <div className="pt-2 border-t border-border/60 dark:border-border-dark/60">
                  <span className="text-ink-muted dark:text-ink-dark-muted block text-xs mb-1">Reason for Access</span>
                  <p className="text-xs text-ink dark:text-ink-dark italic bg-surface dark:bg-surface-dark p-2.5 rounded-xl border border-border/40 dark:border-border-dark/40">
                    "{activeApp.reason}"
                  </p>
                </div>
              )}
            </div>

            {/* Explanatory security callout */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/15 text-xs text-ink-muted dark:text-ink-dark-muted">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Pending applicants cannot create, publish, or modify events until approved by the SRMIST Super Admin. You will receive an in-app notification once your application is reviewed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchApplicationStatus}
                loading={loadingStatus}
                className="w-full sm:w-auto"
              >
                Refresh Review Status
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await logout();
                      navigate('/organizer/login');
                    }}
                    className="w-full sm:w-auto text-ink-muted hover:text-red-600"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Sign Out
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/events')}
                  className="w-full sm:w-auto"
                >
                  Browse Campus Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Building2 className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-display font-extrabold text-ink dark:text-ink-dark tracking-tight">
            {mode === 'login' ? 'Organizer Portal Sign In' : 'Create Organizer Account'}
          </h2>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted max-w-sm mx-auto">
            {mode === 'login'
              ? 'Access your club dashboard, event ticketing, and participant rosters.'
              : 'Submit your official organizer application for administrative approval.'}
          </p>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-3xl p-8 shadow-card dark:shadow-card-dark space-y-6">
          {mode === 'login' ? (
            /* ORGANIZER LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Official College / Club Email *</span>
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. acm@srmist.edu.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={submitting}
                className="w-full mt-2"
              >
                Sign In as Organizer
              </Button>

              <div className="text-center pt-3 border-t border-border dark:border-border-dark space-y-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer block w-full"
                >
                  Need organizer privileges? Create Organizer Account
                </button>
                <Link
                  to="/login"
                  className="text-xs text-ink-muted dark:text-ink-dark-muted hover:underline block"
                >
                  Are you a student? Back to Student Login
                </Link>
              </div>
            </form>
          ) : (
            /* ORGANIZER REGISTRATION / APPLICATION FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Full name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 2. Official college email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Official College Email *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. rahul.v@srmist.edu.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 3. College registration/employee ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>College Registration / Employee ID *</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-CSE-10492 or RA2211003010123"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 4. Club or department name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Club or Department Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  placeholder="e.g. ACM Student Chapter or Dept of CSE"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 5. Position in the club/department */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Position in Club or Department *</span>
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="e.g. President / Student Convenor / Faculty Lead"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 6. Password and confirm password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Confirm Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Reason for requesting organizer access */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Reason for Requesting Organizer Access *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why your club/department requires access to host events, manage tickets, and track student attendees on 1Kampus..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-xs text-ink-muted dark:text-ink-dark-muted flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Applications are verified by the designated SRMIST Super Admin. Account privileges will remain in a pending state until reviewed.
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={submitting}
                className="w-full mt-2"
              >
                Submit Organizer Application
              </Button>

              <div className="text-center pt-3 border-t border-border dark:border-border-dark space-y-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer block w-full"
                >
                  Already have an organizer account? Sign in
                </button>
                <Link
                  to="/login"
                  className="text-xs text-ink-muted dark:text-ink-dark-muted hover:underline block"
                >
                  Back to Student Portal
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
