import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../../types/index.js';
import { Badge } from './Badge.js';

interface EventCardProps {
  event: EventItem;
  featured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  const startDate = new Date(event.start_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const remaining = event.remaining_capacity ?? (event.capacity - (event.registered_count || 0));
  const isFull = event.is_full || remaining <= 0;
  const isRegistered = event.is_registered_by_user;

  return (
    <div
      className={`group relative flex flex-col bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden transition-all duration-300 hover:shadow-card-hover dark:hover:shadow-card-dark hover:-translate-y-1 ${
        featured ? 'md:col-span-2 md:flex-row' : ''
      }`}
    >
      {/* Event Banner Image Container */}
      <div className={`relative overflow-hidden ${featured ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10] w-full'}`}>
        <img
          src={event.banner_url}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

        {/* Category Pill & Event Type on top left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <Badge category={event.category} size="sm">{event.category}</Badge>
          {event.event_type && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold border border-white/20 capitalize">
              {event.event_type}
            </span>
          )}
        </div>

        {/* Registration status badge on top right */}
        <div className="absolute top-3 right-3 z-10">
          {event.status === 'cancelled' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold shadow-xs">
              Cancelled
            </span>
          ) : isRegistered ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow-xs">
              <CheckCircle2 className="w-3 h-3" /> Registered
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-semibold shadow-xs">
              Capacity Full
            </span>
          ) : remaining <= 10 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold shadow-xs">
              {remaining} seats left
            </span>
          ) : null}
        </div>
      </div>

      {/* Content Container */}
      <div className={`flex flex-col justify-between p-5 sm:p-6 flex-1 ${featured ? 'md:w-1/2' : ''}`}>
        <div>
          {/* Organizer / Organization */}
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider block mb-1">
            {event.organization || event.organizer_name}
          </span>

          {/* Title */}
          <Link to={`/events/${event.slug || event.id}`} className="block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            <h3 className={`font-display font-bold text-ink dark:text-ink-dark leading-snug line-clamp-2 ${featured ? 'text-xl sm:text-2xl' : 'text-lg'}`}>
              {event.title}
            </h3>
          </Link>

          {/* Description snippet for featured card */}
          {featured && (
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-2 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Metadata Grid */}
          <div className="flex flex-col gap-2 mt-4 text-xs text-ink-muted dark:text-ink-dark-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>{startDate} • {startTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Card Footer: Capacity & CTA */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/70 dark:border-border-dark/70">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-dark-muted font-medium">
            <Users className="w-3.5 h-3.5 text-ink-faint dark:text-ink-dark-faint" />
            <span>
              {isFull ? (
                <strong className="text-red-500 font-semibold">Full</strong>
              ) : (
                <><strong className="text-ink dark:text-ink-dark">{remaining}</strong> seats open</>
              )}
            </span>
          </div>

          <Link
            to={`/events/${event.slug || event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group/link"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
