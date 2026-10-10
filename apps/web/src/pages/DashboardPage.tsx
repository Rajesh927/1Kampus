import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { RegistrationItem } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { TicketModal } from '../components/ui/TicketModal.js';
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  User,
  Compass,
  Clock,
  Sparkles,
  Save,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'profile'>('tickets');

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<RegistrationItem | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [regToCancel, setRegToCancel] = useState<RegistrationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [section, setSection] = useState(user?.section || 'CSE-A');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFullName(user.full_name);
      setSection(user.section || 'CSE-A');
      setAvatarUrl(user.avatar_url || '');
    }

    loadRegistrations();
  }, [user, isAuthenticated]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRegistrations();
      if (res.success && res.data) {
        setRegistrations(res.data);
      }
    } catch (err: any) {
      error('Failed to load tickets', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!regToCancel) return;
    setCancelling(true);
    try {
      const res = await api.cancelRegistration(regToCancel.id);
      if (res.success) {
        success('Registration Cancelled', 'Your seat has been released.');
        setCancelModalOpen(false);
        setRegToCancel(null);
        await loadRegistrations();
      }
    } catch (err: any) {
      error('Cancellation Failed', err.message || 'Could not cancel registration.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(fullName, avatarUrl, section);
      success('Profile Updated', 'Your profile details have been updated.');
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const activeRegistrations = registrations.filter(r => r.registration_status === 'confirmed');
  const pastRegistrations = registrations.filter(r => r.registration_status !== 'confirmed');

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Student Welcome Header Card */}
        <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 sm:p-8 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={user?.full_name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-200 dark:ring-brand-800 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white dark:bg-[#141A29] border border-border/80 dark:border-border-dark flex items-center justify-center p-0.5 shadow-xs shrink-0">
                  <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="font-display font-extrabold text-2xl text-ink dark:text-ink-dark">
                  Welcome back, {user?.full_name?.split(' ')[0]}
                </h1>
                <Badge variant="status" status="published" size="sm">
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                {user?.registration_number && (
                  <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                    Reg: {user.registration_number}
                  </span>
                )}
                {user?.section && (
                  <span className="font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    Section {user.section}
                  </span>
                )}
                <span className="text-ink-muted dark:text-ink-dark-muted font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            <Link to="/events">
              <Button variant="primary" size="sm" icon={<Compass className="w-4 h-4" />}>
                Browse More Events
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-2 border-b border-border dark:border-border-dark pb-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Registered Passes ({activeRegistrations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>
        </div>

        {/* Tab 1: My Registered Passes */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="h-36 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark animate-pulse" />
                ))}
              </div>
            ) : activeRegistrations.length === 0 ? (
              <div className="rounded-3xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-12 text-center max-w-md mx-auto space-y-4 shadow-card dark:shadow-card-dark">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">No Active Event Registrations</h3>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
                  You haven't reserved a seat for any upcoming campus events yet. Explore upcoming hackathons and workshops!
                </p>
                <Link to="/events">
                  <Button variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />}>
                    Explore Available Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeRegistrations.map(reg => {
                  const event = reg.event;
                  if (!event) return null;

                  const dateStr = new Date(event.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(event.start_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={reg.id}
                      className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-5 shadow-card dark:shadow-card-dark hover:shadow-card-hover transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge category={event.category} size="sm">{event.category}</Badge>
                          <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                            {reg.ticket_code}
                          </span>
                        </div>

                        {/* Title & Organizer */}
                        <Link to={`/events/${event.slug || event.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                          <h3 className="font-display font-bold text-base text-ink dark:text-ink-dark line-clamp-2">
                            {event.title}
                          </h3>
                        </Link>
                        <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium block mt-1">
                          {event.organizer_name}
                        </span>

                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-ink-muted dark:text-ink-dark-muted border-t border-border/60 dark:border-border-dark/60 pt-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                            <span>{timeStr}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between gap-2 border-t border-border/80 dark:border-border-dark/80 pt-4 mt-4">
                        <button
                          onClick={() => {
                            setRegToCancel(reg);
                            setCancelModalOpen(true);
                          }}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold p-1 hover:underline cursor-pointer"
                        >
                          Cancel Registration
                        </button>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          onClick={() => setSelectedTicket(reg)}
                        >
                          Show QR Pass
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Past / Cancelled History */}
            {pastRegistrations.length > 0 && (
              <div className="pt-8 border-t border-border/80 dark:border-border-dark/80">
                <h3 className="text-sm font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider mb-4">
                  Past / Cancelled Registrations ({pastRegistrations.length})
                </h3>
                <div className="space-y-3 opacity-75">
                  {pastRegistrations.map(reg => (
                    <div key={reg.id} className="p-4 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark line-clamp-1">{reg.event?.title || 'Campus Event'}</h4>
                        <span className="text-xs text-ink-muted dark:text-ink-dark-muted">Ticket: {reg.ticket_code}</span>
                      </div>
                      <Badge regStatus={reg.registration_status} size="sm">
                        {reg.registration_status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile Settings */}
        {activeTab === 'profile' && (
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 sm:p-8 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark max-w-2xl">
            <h2 className="font-display font-bold text-xl text-ink dark:text-ink-dark mb-1">Student Account Profile</h2>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted mb-6">Manage your student name, avatar, and credentials.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                  College Registration Number
                </label>
                <input
                  type="text"
                  value={user?.registration_number || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-sm text-ink-muted dark:text-ink-dark-muted font-mono cursor-not-allowed"
                />
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">Verified university registration number (contact Administrator to update).</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                  Academic Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  required
                  placeholder="e.g. CSE-A"
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-sm text-ink-muted dark:text-ink-dark-muted cursor-not-allowed"
                />
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">Account emails cannot be altered.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end">
                <Button variant="primary" size="md" loading={savingProfile} icon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        registration={selectedTicket}
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Registration"
        description="Are you sure you want to release your seat for this event?"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
            Cancelling your registration will immediately void your ticket code and make your reserved seat available to other students.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
            <Button variant="secondary" size="md" onClick={() => setCancelModalOpen(false)}>
              Keep My Seat
            </Button>
            <Button variant="danger" size="md" loading={cancelling} onClick={handleCancelRegistration}>
              Yes, Cancel Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
