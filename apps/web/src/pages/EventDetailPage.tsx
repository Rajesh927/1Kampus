import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { EventItem, RegistrationItem } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { TicketModal } from '../components/ui/TicketModal.js';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Sparkles,
  Ticket,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [latestRegistration, setLatestRegistration] = useState<RegistrationItem | null>(null);

  const loadEvent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getEventById(id);
      if (res.success && res.data) {
        setEvent(res.data);
      }
    } catch (err: any) {
      error('Event Not Found', err.message || 'Could not load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="w-28 h-6 bg-surface-muted dark:bg-surface-dark-muted rounded-lg" />
          <div className="w-full h-80 bg-surface-muted dark:bg-surface-dark-muted rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="w-3/4 h-8 bg-surface-muted dark:bg-surface-dark-muted rounded" />
              <div className="w-full h-32 bg-surface-muted dark:bg-surface-dark-muted rounded" />
            </div>
            <div className="h-64 bg-surface-muted dark:bg-surface-dark-muted rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-background dark:bg-background-dark">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="font-display font-bold text-2xl text-ink dark:text-ink-dark">Event Not Found</h2>
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-2 max-w-sm">
          The event you are looking for might have been removed or the link is invalid.
        </p>
        <Link to="/events" className="mt-6">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = new Date(event.end_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const deadlineDate = new Date(event.registration_deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = new Date();
  const isDeadlinePassed = now > new Date(event.registration_deadline);
  const isEventStarted = now > new Date(event.start_time);
  const remaining = event.remaining_capacity ?? (event.capacity - (event.registered_count || 0));
  const isFull = event.is_full || remaining <= 0;
  const isRegistered = event.is_registered_by_user;
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';

  const capacityPercentage = Math.min(100, Math.round(((event.registered_count || 0) / event.capacity) * 100));

  const handleRegister = async () => {
    if (!isAuthenticated || !user) {
      info('Sign In Required', 'Please sign in or select a demo persona to register for campus events.');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      const res = await api.registerForEvent(event.id);
      if (res.success && res.data) {
        // Confetti burst animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#A5B4FC', '#059669', '#FFE4D6'],
        });

        success('Registration Confirmed!', `You have secured a seat for ${event.title}.`);
        setLatestRegistration({
          ...res.data,
          event: { ...event },
          user: { ...user },
        });
        setTicketModalOpen(true);
        // Refresh event data to update capacity counters
        await loadEvent();
      }
    } catch (err: any) {
      error('Registration Failed', err.message || 'Could not complete registration.');
    } finally {
      setRegistering(false);
    }
  };

  const handleOpenExistingTicket = async () => {
    try {
      const myRegs = await api.getMyRegistrations();
      if (myRegs.success && myRegs.data) {
        const found = myRegs.data.find(r => r.event_id === event.id && r.registration_status === 'confirmed');
        if (found) {
          setLatestRegistration({
            ...found,
            event: { ...event },
            user: user || undefined,
          });
          setTicketModalOpen(true);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    navigate('/dashboard');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      info('Link Copied', 'Event URL copied to clipboard.');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link & Share */}
        <div className="flex items-center justify-between">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted dark:text-ink-dark-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-ink-muted dark:text-ink-dark-muted" />
            <span>Share Event</span>
          </button>
        </div>

        {/* Hero Event Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-border dark:border-border-dark shadow-float dark:shadow-float-dark aspect-[16/8] sm:aspect-[21/9] w-full">
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Top Banner Badges */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2">
            <Badge category={event.category} size="md">{event.category}</Badge>
            {event.event_type && (
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold border border-white/20 capitalize">
                {event.event_type}
              </span>
            )}
            <Badge status={event.status} size="md">{event.status.toUpperCase()}</Badge>
          </div>

          {/* Bottom Title on Banner */}
          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-brand-200 tracking-wide uppercase">
              {event.organization ? `Organized by ${event.organization}` : event.organizer_name}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Cancellation Alert Banner */}
        {isCancelled && (
          <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3.5 shadow-card dark:shadow-card-dark animate-slide-down">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base text-rose-800 dark:text-rose-300">
                This Event Has Been Cancelled
              </h4>
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300/90 leading-relaxed">
                {event.cancellation_reason
                  ? `Notice: ${event.cancellation_reason}`
                  : 'This event was cancelled by the organizers or campus administration. New registrations are disabled.'}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Content & Registration Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Column (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Quick Metadata Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted uppercase font-bold tracking-wider block">Date</span>
                  <span className="text-sm font-semibold text-ink dark:text-ink-dark">{startDate}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted uppercase font-bold tracking-wider block">Timing</span>
                  <span className="text-sm font-semibold text-ink dark:text-ink-dark">{startTime} – {endTime}</span>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 flex items-start gap-3 border-t border-border/70 dark:border-border-dark/70 pt-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted uppercase font-bold tracking-wider block">Location / Venue</span>
                  <span className="text-sm font-semibold text-ink dark:text-ink-dark">{event.venue}</span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 sm:p-8 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-4">
              <h2 className="font-display font-extrabold text-xl text-ink dark:text-ink-dark">About This Event</h2>
              <p className="text-sm sm:text-base text-ink dark:text-ink-dark leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Participation Instructions */}
            {event.instructions && (
              <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 sm:p-8 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-3">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-base">
                  <FileText className="w-5 h-5" />
                  <span>Important Attendee Instructions</span>
                </div>
                <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-dark-muted leading-relaxed bg-surface-subtle dark:bg-surface-dark-subtle p-4 rounded-2xl border border-border dark:border-border-dark">
                  {event.instructions}
                </p>
              </div>
            )}
          </div>

          {/* Sticky Sidebar Registration Card (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 sm:p-7 border border-border dark:border-border-dark shadow-float dark:shadow-float-dark space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">Registration Status</span>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-display font-bold text-2xl text-ink dark:text-ink-dark">
                    {isCancelled ? 'Event Cancelled' : isRegistered ? 'Seat Confirmed' : isFull ? 'Sold Out' : 'Open for Students'}
                  </h3>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    Free Entry
                  </span>
                </div>
              </div>

              {/* Live Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink-muted dark:text-ink-dark-muted flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Capacity
                  </span>
                  <span className={remaining <= 5 ? 'text-red-500 font-bold' : 'text-ink dark:text-ink-dark'}>
                    {remaining} of {event.capacity} seats remaining
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface-muted dark:bg-surface-dark-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      capacityPercentage >= 90 ? 'bg-red-500' : capacityPercentage >= 60 ? 'bg-amber-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
              </div>

              {/* Deadline Indicator */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border/80 dark:border-border-dark/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-muted dark:text-ink-dark-muted">Registration Closes:</span>
                  <span className="font-bold text-ink dark:text-ink-dark">{deadlineDate}</span>
                </div>
                {isDeadlinePassed && (
                  <span className="text-red-500 font-bold block pt-1">
                    ⚠️ The registration deadline for this event has ended.
                  </span>
                )}
              </div>

              {/* Primary Action Button */}
              <div>
                {isRegistered ? (
                  <div className="space-y-3">
                    <Button
                      variant="mint"
                      size="lg"
                      className="w-full"
                      icon={<Ticket className="w-5 h-5" />}
                      onClick={handleOpenExistingTicket}
                    >
                      View Digital Ticket QR
                    </Button>
                    <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> You are registered for this event
                    </p>
                  </div>
                ) : isCancelled ? (
                  <Button variant="danger" size="lg" className="w-full" disabled>
                    Event Cancelled
                  </Button>
                ) : isCompleted || isEventStarted ? (
                  <Button variant="secondary" size="lg" className="w-full" disabled>
                    Event Concluded
                  </Button>
                ) : isDeadlinePassed ? (
                  <Button variant="secondary" size="lg" className="w-full" disabled>
                    Registration Closed
                  </Button>
                ) : isFull ? (
                  <Button variant="secondary" size="lg" className="w-full" disabled>
                    Capacity Reached (Full)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={registering}
                    icon={<Sparkles className="w-5 h-5" />}
                    onClick={handleRegister}
                  >
                    {isAuthenticated ? 'Confirm Registration' : 'Sign in to Register'}
                  </Button>
                )}
              </div>

              {/* Security & Concurrency Guarantee */}
              <div className="flex items-center gap-2 text-[11px] text-ink-muted dark:text-ink-dark-muted justify-center border-t border-border/70 dark:border-border-dark/70 pt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Verified with pessimistic database seat concurrency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        registration={latestRegistration}
      />
    </div>
  );
};
