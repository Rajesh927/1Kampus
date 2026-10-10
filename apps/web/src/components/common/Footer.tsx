import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark mt-20 pt-16 pb-12 transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border/80 dark:border-border-dark/80">
          {/* Column 1: Brand & Identity */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-[#141A29] border border-border/80 dark:border-border-dark flex items-center justify-center p-0.5">
                <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-extrabold text-lg text-ink dark:text-ink-dark tracking-tight">
                1Kampus
              </span>
            </Link>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              SRMIST's premier campus event management platform. Discover workshops, register for flagship hackathons, and manage digital QR admission passes in one unified space.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-mint-light dark:bg-emerald-950/60 border border-mint dark:border-emerald-800/60 text-mint-dark dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACM SRMIST Project 2026</span>
            </div>
          </div>

          {/* Column 2: Event Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark">Explore Events</h4>
            <ul className="space-y-2 text-xs text-ink-muted dark:text-ink-dark-muted">
              <li><Link to="/events?category=Hackathons" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Flagship Hackathons</Link></li>
              <li><Link to="/events?category=Workshops" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Technical Workshops</Link></li>
              <li><Link to="/events?category=Technology" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">AI & Robotics Bootcamps</Link></li>
              <li><Link to="/events?category=Cultural" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Cultural & Music Nights</Link></li>
              <li><Link to="/events?category=Entrepreneurship" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Startup Founders Summits</Link></li>
            </ul>
          </div>

          {/* Column 3: Platform Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark">Platform & Roles</h4>
            <ul className="space-y-2 text-xs text-ink-muted dark:text-ink-dark-muted">
              <li><Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Student Registrations & Tickets</Link></li>
              <li><Link to="/organizer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Club Organizer Studio</Link></li>
              <li><Link to="/admin" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Admin Moderation Console</Link></li>
              <li><Link to="/events" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">All Upcoming Events</Link></li>
              <li><a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">How Admission Works</a></li>
            </ul>
          </div>

          {/* Column 4: Technology & Portfolio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark">Architecture & Stack</h4>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
              Engineered with React 19, TypeScript, Tailwind CSS, Express.js REST APIs, PostgreSQL concurrency locks, and Supabase Auth.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-subtle text-xs font-medium text-ink dark:text-ink-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted dark:text-ink-dark-muted">
          <p>© {new Date().getFullYear()} 1Kampus SRMIST. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mx-0.5" />
            <span>for ACM Student Chapter SRMIST</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
