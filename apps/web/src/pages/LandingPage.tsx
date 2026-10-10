import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { EventItem } from '../types/index.js';
import { Button } from '../components/ui/Button.js';
import { EventCard } from '../components/ui/EventCard.js';
import {
  Compass,
  ArrowRight,
  Code2,
  Cpu,
  Palette,
  Sparkles,
  Trophy,
  Flame,
  Users,
  QrCode,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await api.getEvents({ limit: 6, sortBy: 'date_asc' });
        if (res.success && res.data) {
          setFeaturedEvents(res.data);
        }
      } catch (err) {
        console.error('Failed to load featured events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const categories = [
    { name: 'Hackathons', icon: <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-800/60', count: 'National Flags' },
    { name: 'Workshops', icon: <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />, bg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-100 dark:border-sky-800/60', count: 'Hands-on Labs' },
    { name: 'Technology', icon: <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />, bg: 'bg-brand-50 dark:bg-brand-950/50 border-brand-100 dark:border-brand-800/60', count: 'AI & Robotics' },
    { name: 'Cultural', icon: <Palette className="w-5 h-5 text-orange-600 dark:text-orange-400" />, bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-100 dark:border-orange-800/60', count: 'Music & Arts' },
    { name: 'Entrepreneurship', icon: <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />, bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-800/60', count: 'Founder Summits' },
    { name: 'Sports', icon: <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800/60', count: 'Tournaments' },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-ink dark:text-ink-dark selection:bg-brand-100">
      {/* -------------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* -------------------------------------------------------------------- */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden border-b border-border/70 dark:border-border-dark/70">
        {/* Soft Background Radial Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-100/50 dark:bg-brand-900/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-lavender/40 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6">
              {/* Campus pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-xs text-xs font-semibold text-ink dark:text-ink-dark">
                <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-4 h-4 object-contain rounded-sm" />
                <span className="font-bold text-brand-600 dark:text-brand-400">1Kampus</span>
                <span className="text-ink-faint dark:text-ink-dark-faint">•</span>
                <span className="text-ink-muted dark:text-ink-dark-muted">Your Campus. One Place.</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-ink dark:text-ink-dark tracking-tight leading-[1.12]">
                Your campus has <span className="text-brand-600 dark:text-brand-400 relative inline-block">more going on.<span className="absolute bottom-1 left-0 w-full h-2 bg-lavender/60 dark:bg-brand-900/60 -z-10 rounded-sm" /></span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-ink-muted dark:text-ink-dark-muted leading-relaxed max-w-xl">
                Discover hands-on workshops, 36-hour hackathons, cultural fests, and the student communities that make university life unforgettable.
              </p>

              {/* Hero CTA Actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link to="/events">
                  <Button variant="primary" size="lg" icon={<Compass className="w-5 h-5" />}>
                    Explore Events
                  </Button>
                </Link>
                <Link to="/organizer">
                  <Button variant="secondary" size="lg" icon={<CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />}>
                    Host an Event
                  </Button>
                </Link>
              </div>

              {/* Trust & Community Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/80 dark:border-border-dark/80 max-w-md">
                <div>
                  <span className="font-display font-bold text-2xl text-ink dark:text-ink-dark">10+</span>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted block mt-0.5">Active Events</span>
                </div>
                <div>
                  <span className="font-display font-bold text-2xl text-ink dark:text-ink-dark">1,200+</span>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted block mt-0.5">Campus Seats</span>
                </div>
                <div>
                  <span className="font-display font-bold text-2xl text-ink dark:text-ink-dark">100%</span>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted block mt-0.5">Instant QR Passes</span>
                </div>
              </div>
            </div>

            {/* Right Hero Layered 3D Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Hero Showcase Card */}
                <div className="relative rounded-3xl overflow-hidden border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-float dark:shadow-float-dark transition-transform duration-500 hover:rotate-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
                      alt="Hack SRM 2026 Flagship Hackathon"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md text-xs font-bold text-ink dark:text-ink-dark shadow-xs border border-border/60 dark:border-border-dark">
                        <Code2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        Flagship Hackathon
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider block">
                        ACM Student Chapter SRMIST
                      </span>
                      <h3 className="font-display font-bold text-xl sm:text-2xl mt-1 leading-snug">
                        Hack SRM 2026: 36-Hour National Flagship
                      </h3>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-5 flex items-center justify-between bg-surface dark:bg-surface-dark">
                    <div className="space-y-0.5">
                      <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">TP Ganesan Mini Hall 1</span>
                      <p className="text-sm font-bold text-ink dark:text-ink-dark">Starts in 12 Days • 120 Seats</p>
                    </div>
                    <Link to="/events/hack-srm-2026">
                      <Button variant="primary" size="sm">View Pass</Button>
                    </Link>
                  </div>
                </div>

                {/* Overlapping Floating Badge 1: Instant QR Ticket */}
                <div className="absolute -top-6 -right-4 sm:-right-6 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border border-border dark:border-border-dark shadow-float dark:shadow-float-dark flex items-center gap-3 animate-slide-up">
                  <div className="w-10 h-10 rounded-xl bg-mint-light dark:bg-emerald-950/60 flex items-center justify-center text-mint-dark dark:text-emerald-400 shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left pr-2">
                    <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">Smart Admission</span>
                    <span className="text-xs font-bold text-ink dark:text-ink-dark">Instant QR Ticket Issued</span>
                  </div>
                </div>

                {/* Overlapping Floating Badge 2: Concurrency Lock Protected */}
                <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border border-border dark:border-border-dark shadow-float dark:shadow-float-dark flex items-center gap-3 hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left pr-2">
                    <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">Zero Overselling</span>
                    <span className="text-xs font-bold text-ink dark:text-ink-dark">Atomic Capacity Locks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* CATEGORY DISCOVERY SECTION */}
      {/* -------------------------------------------------------------------- */}
      <section id="categories" className="py-16 bg-surface-subtle dark:bg-surface-dark-subtle border-b border-border/70 dark:border-border-dark/70 transition-colors duration-250">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Curated Experiences</span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink dark:text-ink-dark tracking-tight mt-1">
                Explore by Category
              </h2>
            </div>
            <Link to="/events" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 inline-flex items-center gap-1">
              <span>View all categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {categories.map(cat => (
              <Link
                key={cat.name}
                to={`/events?category=${cat.name}`}
                className="p-4 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:shadow-card-hover dark:hover:shadow-card-dark hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center mb-3`}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink dark:text-ink-dark">{cat.name}</h3>
                  <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted mt-0.5 block">{cat.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FEATURED UPCOMING EVENTS SECTION */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upcoming on Campus</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-ink-dark tracking-tight">
              Happening around campus
            </h2>
          </div>
          <Link to="/events">
            <Button variant="secondary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              View All {featuredEvents.length} Events
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 h-80 animate-pulse flex flex-col justify-between">
                <div className="w-full h-40 bg-surface-muted dark:bg-surface-dark-muted rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="w-1/3 h-4 bg-surface-muted dark:bg-surface-dark-muted rounded" />
                  <div className="w-3/4 h-6 bg-surface-muted dark:bg-surface-dark-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event, idx) => (
              <EventCard key={event.id} event={event} featured={idx === 0} />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* HOW IT WORKS SECTION */}
      {/* -------------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 bg-surface-subtle dark:bg-surface-dark-subtle border-y border-border/70 dark:border-border-dark/70 transition-colors duration-250">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Frictionless Experience</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-ink-dark tracking-tight mt-1">
              How 1Kampus Works
            </h2>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-2">
              From finding an event to entering the hall, your campus registration journey takes only seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-surface dark:bg-surface-dark rounded-2xl p-7 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark flex flex-col items-start relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-brand-600 dark:text-brand-400 font-display font-bold text-lg flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Discover something interesting</h3>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-2 leading-relaxed">
                Filter by technical workshops, 36-hour hackathons, cultural open mics, and robotics bootcamps tailored for SRMIST students.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-surface dark:bg-surface-dark rounded-2xl p-7 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark flex flex-col items-start relative">
              <div className="w-12 h-12 rounded-2xl bg-lavender/60 dark:bg-purple-950/60 border border-lavender dark:border-purple-800/60 text-brand-700 dark:text-purple-300 font-display font-bold text-lg flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Register in a few clicks</h3>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-2 leading-relaxed">
                Instant seat reservation with concurrency-safe atomic locking. Get your personalized digital QR admission ticket right away.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-surface dark:bg-surface-dark rounded-2xl p-7 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark flex flex-col items-start relative">
              <div className="w-12 h-12 rounded-2xl bg-mint-light dark:bg-emerald-950/60 border border-mint dark:border-emerald-800/60 text-mint-dark dark:text-emerald-300 font-display font-bold text-lg flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Show up and be part of it</h3>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-2 leading-relaxed">
                Present your digital barcode at the registration desk for instant check-in. Manage, download, or cancel tickets anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* ORGANIZER CTA BANNER */}
      {/* -------------------------------------------------------------------- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-950 p-8 sm:p-12 lg:p-16 text-white overflow-hidden shadow-float dark:shadow-float-dark">
          {/* Subtle decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-semibold backdrop-blur-xs">
              <Users className="w-3.5 h-3.5" />
              <span>For Clubs, Technical Chapters & Organizers</span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
              Have something worth bringing people together for?
            </h2>

            <p className="text-sm sm:text-base text-brand-100/80 leading-relaxed">
              Publish your club events, set seat quotas, track live registrations, and scan attendee QR codes on admission desks with 1Kampus Organizer Studio.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link to="/organizer">
                <Button variant="mint" size="lg" icon={<CalendarDays className="w-4 h-4" />}>
                  Open Organizer Studio
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="secondary" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Explore Current Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
