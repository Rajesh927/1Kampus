import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { EventItem, EventCategory } from '../types/index.js';
import { EventCard } from '../components/ui/EventCard.js';
import { Button } from '../components/ui/Button.js';
import {
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Hackathons',
  'Workshops',
  'Technology',
  'Cultural',
  'Entrepreneurship',
  'Sports',
  'Talks',
];

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const timeFilter = searchParams.get('timeFilter') || 'upcoming';
  const sortBy = searchParams.get('sortBy') || 'date_asc';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    total_pages: 1,
  });

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 when changing filters
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents({
        search: searchQuery,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        timeFilter,
        sortBy,
        page: currentPage,
        limit: 9,
      });

      if (res.success && res.data) {
        setEvents(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [searchParams]);

  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'All') || timeFilter !== 'upcoming';

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-10 transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 dark:border-border-dark/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Directory</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-ink-dark tracking-tight">
              Explore Campus Events
            </h1>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
              Browse workshops, hackathons, and gatherings happening at SRMIST.
            </p>
          </div>

          {/* Quick Active Count */}
          <div className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-border dark:border-border-dark shadow-xs">
            Showing <strong className="text-ink dark:text-ink-dark">{pagination.total}</strong> published events
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-4">
          {/* Top row: Search Bar & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-ink-faint dark:text-ink-dark-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by event title, venue, or keyword..."
                value={searchQuery}
                onChange={e => updateParam('search', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark placeholder:text-ink-faint dark:placeholder:text-ink-dark-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => updateParam('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Time Filter & Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={timeFilter}
                onChange={e => updateParam('timeFilter', e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
                <option value="all">All Dates</option>
              </select>

              <select
                value={sortBy}
                onChange={e => updateParam('sortBy', e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="date_asc">Date: Earliest First</option>
                <option value="date_desc">Date: Latest First</option>
                <option value="created_desc">Recently Published</option>
              </select>
            </div>
          </div>

          {/* Bottom row: Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-border/60 dark:border-border-dark/60">
            <span className="text-xs font-bold text-ink-muted dark:text-ink-dark-muted flex items-center gap-1 shrink-0 mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Category:
            </span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => updateParam('category', cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-xs font-semibold'
                    : 'bg-surface-subtle dark:bg-surface-dark-muted text-ink-light dark:text-ink-dark-muted hover:bg-surface-muted dark:hover:bg-surface-dark hover:text-ink dark:hover:text-ink-dark border border-border/70 dark:border-border-dark'
                }`}
              >
                {cat}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 underline shrink-0 px-2 py-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 h-96 animate-pulse flex flex-col justify-between">
                <div className="w-full h-44 bg-surface-muted dark:bg-surface-dark-muted rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="w-1/3 h-4 bg-surface-muted dark:bg-surface-dark-muted rounded" />
                  <div className="w-3/4 h-6 bg-surface-muted dark:bg-surface-dark-muted rounded" />
                  <div className="w-1/2 h-4 bg-surface-muted dark:bg-surface-dark-muted rounded" />
                </div>
                <div className="w-full h-8 bg-surface-muted dark:bg-surface-dark-muted rounded mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-8 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
            <h3 className="font-bold text-ink dark:text-ink-dark">Failed to load events</h3>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{error}</p>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadEvents}>
              Retry Loading
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-12 text-center max-w-lg mx-auto space-y-4 shadow-card dark:shadow-card-dark">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">No events match your criteria</h3>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              We couldn't find any events matching your current filters. Try changing your search query or reset filters.
            </p>
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => updateParam('page', (currentPage - 1).toString())}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p.toString())}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'bg-brand-600 text-white'
                          : 'text-ink-muted dark:text-ink-dark-muted hover:bg-surface-subtle dark:hover:bg-surface-dark-muted hover:text-ink dark:hover:text-ink-dark'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= pagination.total_pages}
                  onClick={() => updateParam('page', (currentPage + 1).toString())}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
