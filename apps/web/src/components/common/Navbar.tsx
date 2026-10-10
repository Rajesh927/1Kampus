import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Button } from '../ui/Button.js';
import {
  Calendar,
  Compass,
  LayoutDashboard,
  ShieldAlert,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Ticket,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { UserRole } from '../../types/index.js';

export const Navbar: React.FC = () => {
  const { user, loginWithRole, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignIn = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (location.pathname === '/login') {
      const input = document.getElementById('auth-email-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      navigate('/login');
    }
  };

  const handleSignUp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (location.pathname === '/signup') {
      const input = document.getElementById('auth-fullname-input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      navigate('/signup');
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    setRoleDropdownOpen(false);
    await loginWithRole(role, role === 'admin' ? 'admin@srmist.edu.in' : undefined);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-border dark:border-border-dark transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-white dark:bg-[#141A29] border border-border/80 dark:border-border-dark flex items-center justify-center p-0.5 shadow-xs group-hover:scale-105 transition-transform">
            <img
              src="/images/1kampus-logo.png"
              alt="1Kampus logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-xl text-ink dark:text-ink-dark tracking-tight flex items-center gap-1.5">
              1Kampus
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-lavender dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                SRMIST
              </span>
            </span>
            <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted -mt-1 font-medium hidden sm:inline">
              Your Campus. One Place.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/events"
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive('/events')
                ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold'
                : 'text-ink-light dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-brand-500" />
              Explore Events
            </span>
          </Link>

          <a
            href="/#categories"
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-ink-light dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted transition-colors"
          >
            Categories
          </a>

          <a
            href="/#how-it-works"
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-ink-light dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted transition-colors"
          >
            How It Works
          </a>

          {/* Quick Demo Role Switcher for Assessment Reviewers */}
          <div className="relative ml-2">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50 dark:bg-brand-900/40 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/70 transition-colors cursor-pointer"
              title="Switch demo persona for instant role preview"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Role: {user?.role ? user.role.toUpperCase() : 'DEMO'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface dark:bg-surface-dark rounded-2xl shadow-modal border border-border dark:border-border-dark py-2 z-50 animate-slide-up">
                <div className="px-3 py-1.5 text-[11px] font-bold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wider border-b border-border/60 dark:border-border-dark/60">
                  Switch Review Persona
                </div>
                <button
                  onClick={() => handleRoleChange('student')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-surface-dark-muted ${
                    user?.role === 'student' ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-ink dark:text-ink-dark'
                  }`}
                >
                  <span>Student (Alex Chen)</span>
                  {user?.role === 'student' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                </button>
                <button
                  onClick={() => handleRoleChange('organizer')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-surface-dark-muted ${
                    user?.role === 'organizer' ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-ink dark:text-ink-dark'
                  }`}
                >
                  <span>Organizer (ACM Chapter)</span>
                  {user?.role === 'organizer' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                </button>
                <button
                  onClick={() => handleRoleChange('admin')}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-surface-dark-muted ${
                    user?.role === 'admin' ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-ink dark:text-ink-dark'
                  }`}
                >
                  <span>SRMIST (Super Admin)</span>
                  {user?.role === 'admin' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions & Theme Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:border-border-darker dark:hover:border-brand-500/40 transition-all cursor-pointer shadow-xs"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle color theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
            ) : (
              <Moon className="w-4 h-4 text-brand-600 animate-fade-in" />
            )}
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              {user.role === 'student' && (
                <Button to="/dashboard" variant="secondary" size="sm" icon={<Ticket className="w-4 h-4 text-brand-600 dark:text-brand-400" />}>
                  My Tickets
                </Button>
              )}

              {user.role === 'organizer' && (
                <Button to="/organizer" variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  Host Event
                </Button>
              )}

              {user.role === 'admin' && (
                <Button to="/admin" variant="mint" size="sm" icon={<ShieldAlert className="w-4 h-4" />}>
                  Admin Panel
                </Button>
              )}

              {/* User Avatar with Profile Link */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-subtle dark:hover:bg-surface-dark-muted border border-transparent hover:border-border dark:hover:border-border-dark transition-all"
                title="View Profile & Dashboard"
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-700"
                />
              </Link>

              <button
                onClick={logout}
                className="p-2 text-ink-muted dark:text-ink-dark-muted hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignIn}
                id="navbar-sign-in-button"
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSignUp}
                id="navbar-get-started-button"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions: Theme Toggle & Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-ink-muted dark:text-ink-dark-muted"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted border border-border dark:border-border-dark"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 pt-3 pb-6 space-y-3 animate-fade-in">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted"
          >
            <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Explore All Events
          </Link>

          {user && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Student Dashboard & Tickets
              </Link>

              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link
                  to="/organizer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted"
                >
                  <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Organizer Studio
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted"
                >
                  <ShieldAlert className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Admin Console
                </Link>
              )}
            </>
          )}

          {!isAuthenticated && (
            <div className="pt-2 border-t border-border dark:border-border-dark flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-1/2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignIn();
                }}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-1/2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignUp();
                }}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Quick Demo Selector for Mobile */}
          <div className="pt-3 border-t border-border dark:border-border-dark">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase block mb-2 px-1">
              Switch Review Persona
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { handleRoleChange('student'); setMobileMenuOpen(false); }}
                className="px-2 py-1.5 text-xs rounded-lg border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-ink dark:text-ink-dark font-medium text-center"
              >
                Student
              </button>
              <button
                onClick={() => { handleRoleChange('organizer'); setMobileMenuOpen(false); }}
                className="px-2 py-1.5 text-xs rounded-lg border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-ink dark:text-ink-dark font-medium text-center"
              >
                Organizer
              </button>
              <button
                onClick={() => { handleRoleChange('admin'); setMobileMenuOpen(false); }}
                className="px-2 py-1.5 text-xs rounded-lg border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-ink dark:text-ink-dark font-medium text-center"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
