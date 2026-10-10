import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { EventItem, RegistrationItem, UserProfile } from '../types/index.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import {
  ShieldAlert,
  Users,
  Calendar,
  Layers,
  Sparkles,
  GraduationCap,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Eye,
  KeyRound,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trash2,
  XCircle,
  AlertTriangle,
  Building2,
  Ticket,
  ShieldCheck,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'students' | 'organizers' | 'overview'>('students');

  // Super Admin Status State
  const [superAdminInfo, setSuperAdminInfo] = useState<{
    designated_super_admin: UserProfile;
    account_type: string;
    conflicts: Array<{ id: string; email: string; full_name: string }>;
    has_conflicts: boolean;
    total_admin_accounts: number;
  } | null>(null);

  // Overview Data
  const [overview, setOverview] = useState<{
    total_users: number;
    total_events: number;
    total_registrations: number;
    active_events: number;
    category_distribution: Record<string, number>;
    users_by_role: Record<string, number>;
  } | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Organizer Management State
  const [organizers, setOrganizers] = useState<Array<UserProfile & { events_count: number; active_events_count: number; total_attendees: number }>>([]);
  const [editingOrganizer, setEditingOrganizer] = useState<UserProfile | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgSection, setEditOrgSection] = useState('');
  const [editOrgReg, setEditOrgReg] = useState('');
  const [savingOrganizer, setSavingOrganizer] = useState(false);

  // Event Attendees Roster Modal State
  const [rosterEvent, setRosterEvent] = useState<EventItem | null>(null);
  const [eventAttendees, setEventAttendees] = useState<Array<RegistrationItem & { student: UserProfile }>>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Student Management State
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const [studentSections, setStudentSections] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'registration_number' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Student Details View Modal
  const [detailsStudent, setDetailsStudent] = useState<UserProfile | null>(null);
  const [studentActivity, setStudentActivity] = useState<RegistrationItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Student Edit Modal
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editRegNumber, setEditRegNumber] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);

  // Password Recovery Prompt
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);

  // Admin Event Cancellation & Deletion Modal States
  const [adminCancelModalOpen, setAdminCancelModalOpen] = useState(false);
  const [adminCancellingEvent, setAdminCancellingEvent] = useState<EventItem | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState('');
  const [isSubmittingAdminCancel, setIsSubmittingAdminCancel] = useState(false);

  const [adminDeleteModalOpen, setAdminDeleteModalOpen] = useState(false);
  const [adminDeletingEvent, setAdminDeletingEvent] = useState<EventItem | null>(null);
  const [isSubmittingAdminDelete, setIsSubmittingAdminDelete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      info('Admin Privileges Required', 'Please select the Admin persona from the navigation bar.');
    }
    loadAdminData();
    loadStudentData();
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadStudentData();
  }, [searchQuery, selectedSection, sortBy, sortOrder, studentPage]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ovRes, evRes, orgRes, saRes] = await Promise.all([
        api.getAdminOverview(),
        api.getEvents({ limit: 50, status: undefined }),
        api.getAdminOrganizers(),
        api.getSuperAdminStatus(),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (evRes.success && evRes.data) setEvents(evRes.data);
      if (orgRes.success && orgRes.data) setOrganizers(orgRes.data);
      if (saRes.success && saRes.data) setSuperAdminInfo(saRes.data);
    } catch (err: any) {
      error('Admin Load Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async () => {
    setLoadingStudents(true);
    try {
      const res = await api.getAdminStudents({
        search: searchQuery,
        section: selectedSection,
        sortBy,
        sortOrder,
        page: studentPage,
        limit: 8,
      });

      if (res.success && res.data) {
        setStudents(res.data);
        if (res.total !== undefined) setTotalStudents(res.total);
        if (res.total_pages !== undefined) setStudentTotalPages(res.total_pages);
        if (res.sections) setStudentSections(res.sections);
      }
    } catch (err: any) {
      error('Failed to load students', err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenDetails = async (student: UserProfile) => {
    setDetailsStudent(student);
    setLoadingDetails(true);
    try {
      const res = await api.getAdminStudentDetails(student.id);
      if (res.success && res.data) {
        setStudentActivity(res.data.registrations || []);
      }
    } catch (err: any) {
      console.warn('Failed to load student activity:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenEdit = (student: UserProfile) => {
    setEditingStudent(student);
    setEditName(student.full_name);
    setEditSection(student.section || 'CSE-A');
    setEditRegNumber(student.registration_number || '');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editName.trim()) {
      error('Validation Error', 'Student full name cannot be blank.');
      return;
    }
    if (!editRegNumber.trim()) {
      error('Validation Error', 'College registration number cannot be blank.');
      return;
    }

    setSavingStudent(true);
    try {
      const res = await api.updateAdminStudent(editingStudent.id, {
        full_name: editName.trim(),
        section: editSection.trim(),
        registration_number: editRegNumber.trim().toUpperCase(),
      });

      if (res.success) {
        success('Student Profile Updated', `Changes for ${editName} saved successfully.`);
        setEditingStudent(null);
        loadStudentData();
      }
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not update student profile.');
    } finally {
      setSavingStudent(false);
    }
  };

  const handleTriggerPasswordReset = async (student: UserProfile) => {
    if (!window.confirm(`Initiate Supabase Auth password reset link for ${student.full_name} (${student.email})?`)) return;

    setResettingPasswordId(student.id);
    try {
      const res = await api.resetAdminStudentPassword(student.id);
      if (res.success) {
        success('Password Recovery Initiated', `Password reset instructions dispatched to ${student.email}.`);
      }
    } catch (err: any) {
      error('Recovery Failed', err.message);
    } finally {
      setResettingPasswordId(null);
    }
  };

  const handleOpenEditOrganizer = (org: UserProfile) => {
    setEditingOrganizer(org);
    setEditOrgName(org.full_name);
    setEditOrgSection(org.section || '');
    setEditOrgReg(org.registration_number || '');
  };

  const handleSaveOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganizer) return;
    setSavingOrganizer(true);
    try {
      const res = await api.updateAdminOrganizer(editingOrganizer.id, {
        full_name: editOrgName.trim(),
        section: editOrgSection.trim(),
        registration_number: editOrgReg.trim(),
      });
      if (res.success) {
        success('Organizer Club Updated', `Profile details for "${editOrgName}" saved.`);
        setEditingOrganizer(null);
        loadAdminData();
      }
    } catch (err: any) {
      error('Organizer Update Failed', err.message);
    } finally {
      setSavingOrganizer(false);
    }
  };

  const handleOpenRosterModal = async (ev: EventItem) => {
    setRosterEvent(ev);
    setLoadingAttendees(true);
    try {
      const res = await api.getAdminEventAttendees(ev.id);
      if (res.success && res.data) {
        setEventAttendees(res.data);
      }
    } catch (err: any) {
      error('Attendees Load Failed', err.message);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, status: string) => {
    if (status === 'cancelled') {
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        handleOpenAdminCancelModal(ev);
        return;
      }
    }

    try {
      const res = await api.updateAdminEventStatus(eventId, status);
      if (res.success) {
        success('Status Updated', `Event status set to ${status}.`);
        loadAdminData();
      }
    } catch (err: any) {
      error('Moderation Failed', err.message);
    }
  };

  const handleOpenAdminCancelModal = (event: EventItem) => {
    setAdminCancellingEvent(event);
    setAdminCancelReason('');
    setAdminCancelModalOpen(true);
  };

  const handleConfirmAdminCancel = async () => {
    if (!adminCancellingEvent) return;
    setIsSubmittingAdminCancel(true);
    try {
      const res = await api.adminCancelEvent(adminCancellingEvent.id, adminCancelReason);
      if (res.success) {
        success('Event Cancelled by Admin', `"${adminCancellingEvent.title}" cancelled. Organizer notified in-app.`);
        setAdminCancelModalOpen(false);
        setAdminCancellingEvent(null);
        loadAdminData();
      }
    } catch (err: any) {
      error('Admin Cancellation Failed', err.message);
    } finally {
      setIsSubmittingAdminCancel(false);
    }
  };

  const handleOpenAdminDeleteModal = (event: EventItem) => {
    setAdminDeletingEvent(event);
    setAdminDeleteModalOpen(true);
  };

  const handleConfirmAdminDelete = async () => {
    if (!adminDeletingEvent) return;
    setIsSubmittingAdminDelete(true);
    try {
      const res = await api.adminDeleteEvent(adminDeletingEvent.id);
      if (res.success) {
        success('Event Deleted', `"${adminDeletingEvent.title}" safely removed. Historical records preserved.`);
        setAdminDeleteModalOpen(false);
        setAdminDeletingEvent(null);
        loadAdminData();
      }
    } catch (err: any) {
      error('Admin Deletion Failed', err.message);
    } finally {
      setIsSubmittingAdminDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="w-48 h-8 bg-surface-muted dark:bg-surface-dark-muted rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-28 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark" />
            ))}
          </div>
          <div className="h-64 bg-surface dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 dark:border-border-dark/80 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-3.5 h-3.5 object-contain rounded-xs" />
                <span>1Kampus Super Admin: SRMIST</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-[11px] font-mono text-ink-muted dark:text-ink-dark-muted">
                <span>admin@srmist.edu.in</span>
              </div>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-ink-dark tracking-tight">
              Admin Platform Console
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
              Designated Super Admin workspace for 1Kampus student records, organizer permissions, platform metrics, and event moderation.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 p-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl shadow-xs">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Students</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink'
              }`}>
                {totalStudents}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('organizers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'organizers'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Organizers</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'organizers' ? 'bg-white/20 text-white' : 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink'
              }`}>
                {organizers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Moderation</span>
            </button>
          </div>
        </div>

        {/* Administrator Conflict Warning Banner (if unexpected extra admin accounts exist) */}
        {superAdminInfo?.has_conflicts && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Multiple Administrator Accounts Detected</h4>
              <p className="mt-0.5 leading-relaxed">
                The policy requires exactly one designated Super Admin (<strong>SRMIST • admin@srmist.edu.in</strong>).
                Other detected admin accounts: {superAdminInfo.conflicts.map(c => `${c.full_name} (${c.email})`).join(', ')}.
                These accounts have been preserved safely without silent role demotion.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: STUDENT MANAGEMENT PAGE */}
        {/* ========================================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Top Bar: Search, Section Filter, Sorting & Total Count */}
            <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setStudentPage(1);
                  }}
                  placeholder="Search by student name, registration number, or email..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Section Filter */}
                <div className="flex items-center gap-1.5 bg-surface-subtle dark:bg-surface-dark-subtle px-3 py-1.5 rounded-xl border border-border dark:border-border-dark text-xs">
                  <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span className="font-semibold text-ink-muted dark:text-ink-dark-muted">Section:</span>
                  <select
                    value={selectedSection}
                    onChange={e => {
                      setSelectedSection(e.target.value);
                      setStudentPage(1);
                    }}
                    className="bg-transparent font-bold text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Sections</option>
                    {studentSections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-1.5 bg-surface-subtle dark:bg-surface-dark-subtle px-3 py-1.5 rounded-xl border border-border dark:border-border-dark text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span className="font-semibold text-ink-muted dark:text-ink-dark-muted">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-transparent font-bold text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                  >
                    <option value="created_at">Date Joined</option>
                    <option value="name">Name</option>
                    <option value="registration_number">Registration Number</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-surface dark:hover:bg-surface-dark rounded text-[11px] font-bold text-brand-600 dark:text-brand-400 cursor-pointer"
                    title={`Current: ${sortOrder.toUpperCase()}`}
                  >
                    {sortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
                  </button>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-surface dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark shadow-card dark:shadow-card-dark overflow-hidden">
              <div className="p-5 border-b border-border/80 dark:border-border-dark/80 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <span>Registered Student Directory</span>
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-0.5">
                    Authorized records retrieved directly from PostgreSQL store. Total: <span className="font-bold text-ink dark:text-ink-dark">{totalStudents}</span>
                  </p>
                </div>

                {/* Password Privacy Notice */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-[11px] text-ink-muted dark:text-ink-dark-muted font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Passwords managed by Supabase Auth (Hidden from Admin)</span>
                </div>
              </div>

              {loadingStudents ? (
                <div className="p-8 space-y-4 animate-pulse">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="h-14 bg-surface-subtle dark:bg-surface-dark-subtle rounded-xl" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-ink dark:text-ink-dark">No Students Found</h4>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-sm mx-auto">
                    No student records match your current search query or section filter. Try resetting filters.
                  </p>
                  {(searchQuery || selectedSection !== 'All') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedSection('All');
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-border-dark text-ink-faint dark:text-ink-dark-muted font-bold uppercase tracking-wider bg-surface-subtle/40 dark:bg-surface-dark-subtle/40">
                        <th className="py-3.5 px-5">Student Full Name</th>
                        <th className="py-3.5 px-4">Registration No.</th>
                        <th className="py-3.5 px-4">University Email</th>
                        <th className="py-3.5 px-4">Section</th>
                        <th className="py-3.5 px-4">Enrolled Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                      {students.map(s => (
                        <tr
                          key={s.id}
                          className="hover:bg-surface-subtle/80 dark:hover:bg-surface-dark-subtle/50 transition-colors group"
                        >
                          {/* Student Full Name */}
                          <td className="py-3.5 px-5 font-semibold text-ink dark:text-ink-dark">
                            <div className="flex items-center gap-3">
                              <img
                                src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                                alt={s.full_name}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-ink dark:text-ink-dark block">{s.full_name}</span>
                                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted font-normal">Student ID: {s.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>

                          {/* Registration Number */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-2.5 py-1 rounded-md border border-brand-200/80 dark:border-brand-800/80">
                              {s.registration_number || 'NOT_ASSIGNED'}
                            </span>
                          </td>

                          {/* Email Address */}
                          <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted font-medium">
                            {s.email}
                          </td>

                          {/* Section */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {s.section || 'General'}
                            </span>
                          </td>

                          {/* Enrolled Date */}
                          <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted">
                            {new Date(s.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Account Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active Student</span>
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => handleOpenDetails(s)}
                                className="p-1.5 rounded-lg text-ink-muted dark:text-ink-dark-muted hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors cursor-pointer"
                                title="View student details & event registrations"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 rounded-lg text-ink-muted dark:text-ink-dark-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors cursor-pointer"
                                title="Edit student profile details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleTriggerPasswordReset(s)}
                                disabled={resettingPasswordId === s.id}
                                className="p-1.5 rounded-lg text-ink-muted dark:text-ink-dark-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors cursor-pointer"
                                title="Initiate password reset email for student"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              <div className="p-4 border-t border-border/80 dark:border-border-dark/80 bg-surface-subtle/30 dark:bg-surface-dark-subtle/30 flex items-center justify-between text-xs">
                <span className="text-ink-muted dark:text-ink-dark-muted">
                  Showing page <span className="font-bold text-ink dark:text-ink-dark">{studentPage}</span> of{' '}
                  <span className="font-bold text-ink dark:text-ink-dark">{studentTotalPages}</span> ({totalStudents} total students)
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={studentPage <= 1 || loadingStudents}
                    onClick={() => setStudentPage(prev => Math.max(1, prev - 1))}
                    icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={studentPage >= studentTotalPages || loadingStudents}
                    onClick={() => setStudentPage(prev => prev + 1)}
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ORGANIZER MANAGEMENT (Super Admin Authorized) */}
        {/* ========================================================================= */}
        {activeTab === 'organizers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-surface dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark shadow-card dark:shadow-card-dark overflow-hidden">
              <div className="p-5 border-b border-border/80 dark:border-border-dark/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <span>Campus Clubs & Organizer Accounts</span>
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-0.5">
                    Authorized organizers permitted to create, manage, and host university events. Total: <span className="font-bold text-ink dark:text-ink-dark">{organizers.length}</span>
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-[11px] text-ink-muted dark:text-ink-dark-muted font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Managed Exclusively by Super Admin</span>
                </div>
              </div>

              {organizers.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-ink dark:text-ink-dark">No Organizers Found</h4>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-sm mx-auto">
                    No active organizer accounts are currently registered.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-border-dark text-ink-faint dark:text-ink-dark-muted font-bold uppercase tracking-wider bg-surface-subtle/40 dark:bg-surface-dark-subtle/40">
                        <th className="py-3.5 px-5">Club / Organization</th>
                        <th className="py-3.5 px-4">Official Email</th>
                        <th className="py-3.5 px-4">Club Code</th>
                        <th className="py-3.5 px-4">Advisory / Faculty</th>
                        <th className="py-3.5 px-4 text-center">Hosted Events</th>
                        <th className="py-3.5 px-4 text-center">Total Attendees</th>
                        <th className="py-3.5 px-4">Role Status</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                      {organizers.map(org => (
                        <tr
                          key={org.id}
                          className="hover:bg-surface-subtle/80 dark:hover:bg-surface-dark-subtle/50 transition-colors group"
                        >
                          <td className="py-3.5 px-5 font-semibold text-ink dark:text-ink-dark">
                            <div className="flex items-center gap-3">
                              <img
                                src={org.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80'}
                                alt={org.full_name}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-ink dark:text-ink-dark block">{org.full_name}</span>
                                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted font-normal">Org ID: {org.id.slice(0, 8)}...</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted font-mono">{org.email}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                              {org.registration_number || 'ORG-UNSET'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted">{org.section || 'General'}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-ink dark:text-ink-dark">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs">
                              {org.events_count} events
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {org.total_attendees}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active Organizer
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenEditOrganizer(org)}
                              title="Edit club details and permissions"
                            >
                              Edit Club
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PLATFORM OVERVIEW & MODERATION (PRESERVED) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Telemetry Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-1">
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Total Users
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
                  {overview?.total_users ?? 0}
                </span>
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">Students, Organizers, Admins</span>
              </div>

              <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-1">
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Total Events
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
                  {overview?.total_events ?? 0}
                </span>
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">{overview?.active_events ?? 0} active published</span>
              </div>

              <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-1">
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Total Registrations
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
                  {overview?.total_registrations ?? 0}
                </span>
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">Confirmed student tickets</span>
              </div>

              <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-1">
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-dark dark:text-sky" /> Categories
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
                  {overview ? Object.keys(overview.category_distribution).length : 0}
                </span>
                <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">Active taxonomies</span>
              </div>
            </div>

            {/* Event Moderation List */}
            <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-4">
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Campus Event Moderation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border dark:border-border-dark text-ink-faint dark:text-ink-dark-muted font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Organizer</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                    {events.map(ev => (
                      <tr key={ev.id} className="hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-ink dark:text-ink-dark max-w-xs truncate">{ev.title}</td>
                        <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted">{ev.organizer_name}</td>
                        <td className="py-3.5 px-4">
                          <Badge category={ev.category} size="sm">{ev.category}</Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={ev.status} size="sm">{ev.status.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Ticket className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                              onClick={() => handleOpenRosterModal(ev)}
                              title="View confirmed student registrations & attendance"
                            >
                              Roster
                            </Button>
                            <select
                              value={ev.status}
                              onChange={e => handleUpdateStatus(ev.id, e.target.value)}
                              className="py-1 px-2 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="completed">Completed</option>
                            </select>
                            {ev.status !== 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                icon={<XCircle className="w-3.5 h-3.5" />}
                                onClick={() => handleOpenAdminCancelModal(ev)}
                                title="Cancel event and notify organizer"
                              >
                                Cancel
                              </Button>
                            )}
                            <button
                              onClick={() => handleOpenAdminDeleteModal(ev)}
                              className="p-1.5 text-ink-faint dark:text-ink-dark-muted hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete event safely"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT PROFILE DETAILS VIEW */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!detailsStudent}
        onClose={() => setDetailsStudent(null)}
        title="Student Profile Overview"
        description="Comprehensive verified profile metadata and event admission activity."
        maxWidth="lg"
      >
        {detailsStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark">
              <img
                src={detailsStudent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt={detailsStudent.full_name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-300 dark:ring-brand-800 shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-display font-bold text-lg text-ink dark:text-ink-dark">{detailsStudent.full_name}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                    {detailsStudent.registration_number || 'N/A'}
                  </span>
                  <span className="text-ink-muted dark:text-ink-dark-muted font-medium">Sec: {detailsStudent.section || 'General'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Active</span>
                </div>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">{detailsStudent.email}</p>
              </div>
            </div>

            {/* Profile Field Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark space-y-0.5">
                <span className="text-ink-faint dark:text-ink-dark-muted block uppercase text-[10px] font-bold">User UUID</span>
                <span className="font-mono text-ink dark:text-ink-dark text-[11px] truncate block">{detailsStudent.id}</span>
              </div>
              <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark space-y-0.5">
                <span className="text-ink-faint dark:text-ink-dark-muted block uppercase text-[10px] font-bold">Role</span>
                <span className="font-bold text-ink dark:text-ink-dark uppercase">{detailsStudent.role}</span>
              </div>
              <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark space-y-0.5">
                <span className="text-ink-faint dark:text-ink-dark-muted block uppercase text-[10px] font-bold">Account Created</span>
                <span className="font-semibold text-ink dark:text-ink-dark">
                  {new Date(detailsStudent.created_at).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark space-y-0.5">
                <span className="text-ink-faint dark:text-ink-dark-muted block uppercase text-[10px] font-bold">Password Privacy</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Supabase Managed
                </span>
              </div>
            </div>

            {/* Event Registration History */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="font-display font-bold text-xs uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">
                  Registered Events ({studentActivity.length})
                </h5>
                {loadingDetails && <span className="text-[11px] text-brand-600 animate-pulse">Loading passes...</span>}
              </div>

              {studentActivity.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle text-center text-xs text-ink-muted dark:text-ink-dark-muted">
                  No active event tickets found for this student.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {studentActivity.map(reg => (
                    <div
                      key={reg.id}
                      className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-ink dark:text-ink-dark block">
                          {reg.event?.title || 'Campus Event'}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted dark:text-ink-dark-muted">
                          Pass: {reg.ticket_code}
                        </span>
                      </div>
                      <Badge
                        variant="status"
                        status={reg.registration_status === 'confirmed' ? 'published' : 'cancelled'}
                        size="sm"
                      >
                        {reg.registration_status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border dark:border-border-dark">
              <Button variant="secondary" size="sm" onClick={() => setDetailsStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STUDENT PROFILE (Authorized Admin Edit) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Profile"
        description="Modify student profile credentials. Registration numbers are validated for uniqueness."
        maxWidth="md"
      >
        {editingStudent && (
          <form onSubmit={handleSaveStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                College Registration Number *
              </label>
              <input
                type="text"
                required
                value={editRegNumber}
                onChange={e => setEditRegNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
              <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">
                Must remain globally unique across all student profiles.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Academic Section *
              </label>
              <input
                type="text"
                required
                value={editSection}
                onChange={e => setEditSection(e.target.value)}
                placeholder="e.g. CSE-A"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Student Email
              </label>
              <input
                type="email"
                disabled
                value={editingStudent.email}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-muted text-sm text-ink-muted dark:text-ink-dark-muted cursor-not-allowed"
              />
              <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted mt-1 block">
                Student email addresses are managed via Supabase Auth identity verification.
              </span>
            </div>

            {/* Role elevation security disclaimer */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Role Integrity:</strong> Student accounts cannot be silently elevated to administrative status through ordinary profile editing.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
              <Button variant="secondary" size="md" type="button" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" loading={savingStudent} type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ADMIN CANCEL EVENT MODAL */}
      <Modal
        isOpen={adminCancelModalOpen}
        onClose={() => {
          if (!isSubmittingAdminCancel) {
            setAdminCancelModalOpen(false);
            setAdminCancellingEvent(null);
          }
        }}
        title="Admin Event Cancellation"
        description="Administrative override to cancel event and notify the organizer."
        maxWidth="md"
      >
        {adminCancellingEvent && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Cancelling <strong>"{adminCancellingEvent.title}"</strong> (Organizer: {adminCancellingEvent.organizer_name}) will immediately set status to Cancelled, close student registration, and dispatch an in-app notice to the organizer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Administrative Cancellation Reason
              </label>
              <textarea
                rows={3}
                value={adminCancelReason}
                onChange={e => setAdminCancelReason(e.target.value)}
                placeholder="e.g. Violation of campus event guidelines / double booking / security directive"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSubmittingAdminCancel}
                onClick={() => {
                  setAdminCancelModalOpen(false);
                  setAdminCancellingEvent(null);
                }}
              >
                Dismiss
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isSubmittingAdminCancel}
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleConfirmAdminCancel}
              >
                Confirm Admin Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADMIN DELETE EVENT MODAL */}
      <Modal
        isOpen={adminDeleteModalOpen}
        onClose={() => {
          if (!isSubmittingAdminDelete) {
            setAdminDeleteModalOpen(false);
            setAdminDeletingEvent(null);
          }
        }}
        title="Admin Event Deletion"
        description="Permanently hide event from active listings."
        maxWidth="md"
      >
        {adminDeletingEvent && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <span>Admin Safe Deletion</span>
              </div>
              <p className="leading-relaxed">
                Remove <strong>"{adminDeletingEvent.title}"</strong> from all active platform views.
              </p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                🛡️ <strong>Safety Guarantee:</strong> Referential integrity is enforced: registrations and student accounts are never cascade-deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSubmittingAdminDelete}
                onClick={() => {
                  setAdminDeleteModalOpen(false);
                  setAdminDeletingEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isSubmittingAdminDelete}
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmAdminDelete}
              >
                Delete Event
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {/* EDIT ORGANIZER MODAL */}
      <Modal
        isOpen={!!editingOrganizer}
        onClose={() => setEditingOrganizer(null)}
        title={`Manage Organizer Club — ${editingOrganizer?.full_name || ''}`}
        description="Super Admin management of organization title, academic advisory, and registration code."
        maxWidth="md"
      >
        {editingOrganizer && (
          <form onSubmit={handleSaveOrganizer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Club / Organization Name *
              </label>
              <input
                type="text"
                required
                value={editOrgName}
                onChange={e => setEditOrgName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Club Registration Code *
              </label>
              <input
                type="text"
                required
                value={editOrgReg}
                onChange={e => setEditOrgReg(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Advisory Department / Section *
              </label>
              <input
                type="text"
                required
                value={editOrgSection}
                onChange={e => setEditOrgSection(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-border-dark">
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditingOrganizer(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={savingOrganizer} type="submit">
                Save Organizer Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* EVENT ATTENDEES ROSTER MODAL */}
      <Modal
        isOpen={!!rosterEvent}
        onClose={() => setRosterEvent(null)}
        title={`Attendee Roster — ${rosterEvent?.title || ''}`}
        description="Confirmed student registrations, ticket QR codes, and admission attendance records."
        maxWidth="lg"
      >
        {rosterEvent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-xs">
              <div>
                <span className="font-bold text-ink dark:text-ink-dark block">{rosterEvent.title}</span>
                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">Hosted by {rosterEvent.organizer_name} • Venue: {rosterEvent.venue}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-sm block">{eventAttendees.length} / {rosterEvent.capacity}</span>
                <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted">Confirmed Seats</span>
              </div>
            </div>

            {loadingAttendees ? (
              <div className="py-12 text-center space-y-2 animate-pulse">
                <div className="h-6 w-32 bg-surface-subtle dark:bg-surface-dark-subtle rounded mx-auto" />
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Loading attendee records...</p>
              </div>
            ) : eventAttendees.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Ticket className="w-8 h-8 text-ink-muted dark:text-ink-dark-muted mx-auto" />
                <h4 className="font-bold text-sm text-ink dark:text-ink-dark">No Registrations Yet</h4>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">No students have confirmed registrations for this event.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {eventAttendees.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                        alt={item.student?.full_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <span className="font-bold text-ink dark:text-ink-dark block">{item.student?.full_name}</span>
                        <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
                          Reg: {item.student?.registration_number} • Sec: {item.student?.section}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 text-[11px] block">
                        {item.ticket_code}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.attendance_status === 'attended'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {item.attendance_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
