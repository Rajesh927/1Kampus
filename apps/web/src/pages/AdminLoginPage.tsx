import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/ui/Button.js';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  Building2,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { user, isAuthenticated, loginWithSupabase, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@srmist.edu.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated as Super Admin, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      error('Invalid Email', 'Please enter the official Super Admin email address.');
      return;
    }
    if (!password) {
      error('Password Required', 'Please enter your Super Admin password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await loginWithSupabase(email.trim(), password);
      if (!loggedUser) {
        throw new Error('Sign in failed. Please verify your credentials.');
      }

      if (loggedUser.role !== 'admin') {
        // Enforce role restriction: non-admins cannot log in through the admin portal
        await logout();
        error('Access Denied', 'This account does not have Super Admin governance privileges.');
        return;
      }

      success('Super Admin Authenticated', 'Welcome back to 1Kampus Administration, SRMIST!');
      navigate('/admin');
    } catch (err: any) {
      error('Authentication Error', err.message || 'Invalid Super Admin email or password.');
    } finally {
      setSubmitting(false);
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
          <div className="text-left">
            <span className="font-display font-black text-xl text-ink dark:text-ink-dark block tracking-tight">
              1Kampus
            </span>
            <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted font-bold tracking-widest uppercase">
              Super Admin Console
            </span>
          </div>
        </Link>

        <h2 className="font-display font-extrabold text-2xl text-ink dark:text-ink-dark">
          SRMIST Super Admin Login
        </h2>
        <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1 max-w-sm mx-auto">
          Institutional Administration & Governance Portal. Requires authenticated Super Admin credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        {/* Super Admin Security Callout */}
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Designated Super Admin: SRMIST</p>
            <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300/90 font-mono">
              admin@srmist.edu.in
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-700/80 dark:text-emerald-400/80">
              Only the authenticated SRMIST Super Admin can manage student records, authorize clubs, and approve or reject organizer applications.
            </p>
          </div>
        </div>

        {/* Admin Login Form Card */}
        <div className="bg-surface dark:bg-surface-dark py-8 px-6 sm:px-8 border border-border dark:border-border-dark rounded-3xl shadow-card dark:shadow-card-dark space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-border-dark/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark">
                Admin Authentication
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle dark:bg-surface-dark-subtle text-ink-muted dark:text-ink-dark-muted border border-border dark:border-border-dark">
              RBAC: Level 3
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Super Admin Email *</span>
              </label>
              <input
                id="admin-login-email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@srmist.edu.in"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Master Password *</span>
                </span>
              </label>
              <div className="relative">
                <input
                  id="admin-login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted hover:text-ink cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                id="admin-login-submit-button"
                type="submit"
                variant="primary"
                size="md"
                loading={submitting}
                className="w-full shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Sign In as Super Admin
              </Button>
            </div>
          </form>

          {/* Strict Security Notice: No Admin Registration */}
          <div className="pt-4 border-t border-border/80 dark:border-border-dark/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint dark:text-ink-dark-muted">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Public admin registration is strictly disabled by university policy.</span>
            </div>
          </div>
        </div>

        {/* Other Portals Navigation */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:underline font-bold"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </Link>
            <span className="text-ink-faint">•</span>
            <Link
              to="/organizer/login"
              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Organizer Portal</span>
            </Link>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[11px] text-ink-muted dark:text-ink-dark-muted hover:text-ink"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to 1Kampus Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
