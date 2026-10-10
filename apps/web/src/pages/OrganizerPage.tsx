import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import {
  EventItem,
  RegistrationItem,
  EventCategory,
  EventStatus,
  NotificationItem,
  EventType,
  ApprovedOrganization,
  OrganizerOverview,
} from '../types/index.js';
import { APPROVED_ORGANIZATIONS, EVENT_TYPES } from '../config/organizations.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { EventCard } from '../components/ui/EventCard.js';
import {
  Calendar,
  Users,
  PlusCircle,
  TrendingUp,
  Trash2,
  Edit3,
  Download,
  Search,
  QrCode,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Clock,
  Building2,
  Copy,
  Megaphone,
  Eye,
  BarChart3,
  CalendarDays,
  RotateCw,
  Send,
} from 'lucide-react';

const BANNER_PRESETS = [
  { label: 'Tech & Code', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Hackathon', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Robotics / AI', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Founders / E-Cell', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cultural', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Sports', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80' },
];

export const OrganizerPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Overview state with real metrics & velocity
  const [overview, setOverview] = useState<OrganizerOverview | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Central approved organizations list
  const [organizationsList, setOrganizationsList] = useState<ApprovedOrganization[]>(APPROVED_ORGANIZATIONS);

  // Event list tab filter: 'all' | 'upcoming' | 'published' | 'draft' | 'completed' | 'cancelled'
  const [eventTab, setEventTab] = useState<'all' | 'upcoming' | 'published' | 'draft' | 'completed' | 'cancelled'>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<'all' | EventCategory>('all');

  // Cancel Event Confirmation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingEvent, setCancellingEvent] = useState<EventItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Delete Event Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Create / Edit Event Modal State - All 12 required fields
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [bannerPreviewFailed, setBannerPreviewFailed] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    event_type: 'workshop' as EventType,
    category: 'Workshops' as EventCategory,
    capacity: 60,
    organization_id: 'acm-student-chapter',
    organization: 'ACM Student Chapter',
    custom_organization: '',
    venue: '',
    start_time: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 86400000 * 3 + 14400000).toISOString().slice(0, 16),
    registration_deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    description: '',
    instructions: '',
    status: 'published' as EventStatus,
  });

  // Student Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<EventItem | null>(null);

  // Broadcast Announcement Modal State
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcingEvent, setAnnouncingEvent] = useState<EventItem | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

  // Duplication State
  const [duplicatingEventId, setDuplicatingEventId] = useState<string | null>(null);

  // Participant Roster Modal State
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [activeRosterEvent, setActiveRosterEvent] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<RegistrationItem[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterTab, setRosterTab] = useState<'all' | 'confirmed' | 'attended' | 'unmarked' | 'cancelled'>('all');
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Ticket Code Check-in state
  const [checkInCode, setCheckInCode] = useState('');
  const [verifyingTicket, setVerifyingTicket] = useState(false);
  const [verifiedTicketResult, setVerifiedTicketResult] = useState<RegistrationItem | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      info('Organizer Access Required', 'Please select the Organizer persona from the navigation bar.');
    }
    loadOrganizerData();
    loadOrganizationsMeta();
  }, [user, isAuthenticated]);

  const loadOrganizationsMeta = async () => {
    try {
      const res = await api.getEventOrganizations();
      if (res.success && res.data && res.data.length > 0) {
        setOrganizationsList(res.data);
      }
    } catch {
      // Fallback pre-populated from APPROVED_ORGANIZATIONS
    }
  };

  const loadOrganizerData = async () => {
    setLoading(true);
    try {
      const [ovRes, evRes, notifRes] = await Promise.all([
        api.getOrganizerOverview(),
        api.getOrganizerEvents({ status: 'all' }),
        api.getNotifications().catch(() => ({ success: true, data: [] })),
      ]);

      if (ovRes.success && ovRes.data) {
        setOverview(ovRes.data);
      }
      if (evRes.success && evRes.data) {
        setEvents(evRes.data);
      }
      if (notifRes.success && notifRes.data) {
        setNotifications(notifRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load organizer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setBannerPreviewFailed(false);

    // Default to organizer's organization if discernible
    const userNameLower = (user?.full_name || '').toLowerCase();
    const userEmailLower = (user?.email || '').toLowerCase();
    let defaultOrgId = 'acm-student-chapter';
    let defaultOrgName = 'ACM Student Chapter';

    if (userNameLower.includes('robotics') || userEmailLower.includes('robotics')) {
      defaultOrgId = 'club-robotics';
      defaultOrgName = 'Robotics/IoT Club';
    } else if (userNameLower.includes('dsa') || userNameLower.includes('coding')) {
      defaultOrgId = 'club-dsa';
      defaultOrgName = 'DSA/Coding Club';
    } else if (userNameLower.includes('ecell') || userEmailLower.includes('ecell')) {
      defaultOrgId = 'club-ecell';
      defaultOrgName = 'Entrepreneurship/E-Cell';
    } else if (userNameLower.includes('milan') || userNameLower.includes('cultural')) {
      defaultOrgId = 'club-cultural';
      defaultOrgName = 'Cultural Club';
    } else if (user?.role === 'admin' || userNameLower.includes('srmist')) {
      defaultOrgId = 'srmist';
      defaultOrgName = 'SRMIST';
    }

    setEventForm({
      title: '',
      event_type: 'workshop',
      category: 'Workshops',
      capacity: 60,
      organization_id: defaultOrgId,
      organization: defaultOrgName,
      custom_organization: '',
      venue: 'UB Seminar Hall 301, University Building',
      start_time: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 86400000 * 5 + 14400000).toISOString().slice(0, 16),
      registration_deadline: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 16),
      banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      description: 'Hands-on interactive technical session with practical labs, peer programming, and mentor guidance.',
      instructions: 'Please bring your college ID card and laptop with relevant tools installed. Arrive 15 minutes prior to gate pass verification.',
      status: 'published',
    });
    setEventModalOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEventId(event.id);
    setBannerPreviewFailed(false);

    const isCustomOrg = !!event.organization && !organizationsList.some(o => o.name.toLowerCase() === event.organization!.toLowerCase());

    setEventForm({
      title: event.title,
      event_type: event.event_type || 'workshop',
      category: event.category,
      capacity: event.capacity,
      organization_id: isCustomOrg ? 'other-approved' : (event.organization_id || 'srmist'),
      organization: event.organization || event.organizer_name,
      custom_organization: isCustomOrg ? (event.organization || '') : '',
      venue: event.venue,
      start_time: new Date(event.start_time).toISOString().slice(0, 16),
      end_time: new Date(event.end_time).toISOString().slice(0, 16),
      registration_deadline: new Date(event.registration_deadline).toISOString().slice(0, 16),
      banner_url: event.banner_url,
      description: event.description,
      instructions: event.instructions || '',
      status: event.status,
    });
    setEventModalOpen(true);
  };

  const handleOpenPreviewModal = (event: EventItem) => {
    setPreviewEvent(event);
    setPreviewModalOpen(true);
  };

  const handleDuplicateEvent = async (event: EventItem) => {
    setDuplicatingEventId(event.id);
    try {
      const res = await api.duplicateEvent(event.id);
      if (res.success && res.data) {
        success('Event Duplicated', `"${res.data.title}" created as draft. You can now edit and publish.`);
        await loadOrganizerData();
      }
    } catch (err: any) {
      error('Duplication Failed', err.message || 'Could not duplicate event.');
    } finally {
      setDuplicatingEventId(null);
    }
  };

  const handleDownloadICS = (event: EventItem) => {
    const formatICSDate = (dateIso: string) => {
      const d = new Date(dateIso);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//1Kampus//SRMIST Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:1k-${event.id}@1kampus.srmist.edu.in`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(event.start_time)}`,
      `DTEND:${formatICSDate(event.end_time)}`,
      `SUMMARY:${event.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${(event.venue || '').replace(/[,;]/g, ' ')}`,
      `ORGANIZER;CN=${(event.organization || event.organizer_name || 'SRMIST').replace(/[,;]/g, ' ')}:MAILTO:events@srmist.edu.in`,
      `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug || 'event'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Calendar Exported', `Downloaded calendar pass (.ics) for "${event.title}".`);
  };

  const handleOpenAnnouncementModal = (event: EventItem) => {
    setAnnouncingEvent(event);
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementModalOpen(true);
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcingEvent) return;
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      error('Validation Error', 'Announcement title and message are required.');
      return;
    }

    setSubmittingAnnouncement(true);
    try {
      const res = await api.broadcastAnnouncement(
        announcingEvent.id,
        announcementTitle.trim(),
        announcementMessage.trim()
      );
      if (res.success) {
        success('Announcement Broadcasted', `Sent to ${res.data?.sent_to ?? 0} registered attendees.`);
        setAnnouncementModalOpen(false);
        setAnnouncingEvent(null);
        setAnnouncementTitle('');
        setAnnouncementMessage('');
        await loadOrganizerData();
      }
    } catch (err: any) {
      error('Announcement Failed', err.message || 'Could not send announcement.');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent, targetStatus?: EventStatus) => {
    e.preventDefault();

    // 1. Title validation
    if (!eventForm.title.trim() || eventForm.title.trim().length < 3) {
      error('Validation Error', 'Event title must be at least 3 characters.');
      return;
    }

    // 2. Venue validation
    if (!eventForm.venue.trim()) {
      error('Validation Error', 'Venue location is required.');
      return;
    }

    // 3. Seat capacity validation
    if (!eventForm.capacity || Number(eventForm.capacity) <= 0) {
      error('Validation Error', 'Total seat capacity must be a positive integer greater than 0.');
      return;
    }

    // 4. Dates validation
    const startDate = new Date(eventForm.start_time);
    const endDate = new Date(eventForm.end_time);
    const deadlineDate = new Date(eventForm.registration_deadline);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(deadlineDate.getTime())) {
      error('Validation Error', 'Please select valid dates and times.');
      return;
    }

    if (endDate <= startDate) {
      error('Invalid Schedule', 'Event end date and time must follow the start date and time.');
      return;
    }

    if (deadlineDate > startDate) {
      error('Invalid Schedule', 'Registration deadline must precede or equal the event start date and time.');
      return;
    }

    // 5. Banner URL validation
    try {
      new URL(eventForm.banner_url);
    } catch {
      error('Invalid Banner URL', 'Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    // 6. Description validation
    if (!eventForm.description.trim() || eventForm.description.trim().length < 10) {
      error('Validation Error', 'Event description must be at least 10 characters.');
      return;
    }

    // 7. Attendee instructions validation
    if (!eventForm.instructions.trim() || eventForm.instructions.trim().length < 5) {
      error('Validation Error', 'Attendee instructions are required (minimum 5 characters).');
      return;
    }

    // Organization resolution
    const finalOrganizationName = eventForm.organization_id === 'other-approved'
      ? (eventForm.custom_organization.trim() || 'Other Approved Organization')
      : (organizationsList.find(o => o.id === eventForm.organization_id)?.name || eventForm.organization);

    const statusToSave = targetStatus || eventForm.status;

    setSubmittingEvent(true);
    try {
      const payload = {
        title: eventForm.title.trim(),
        event_type: eventForm.event_type,
        category: eventForm.category,
        capacity: Number(eventForm.capacity),
        organization: finalOrganizationName,
        organization_id: eventForm.organization_id,
        venue: eventForm.venue.trim(),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        registration_deadline: deadlineDate.toISOString(),
        banner_url: eventForm.banner_url.trim(),
        description: eventForm.description.trim(),
        instructions: eventForm.instructions.trim(),
        status: statusToSave,
      };

      if (editingEventId) {
        const res = await api.updateEvent(editingEventId, payload);
        if (res.success) {
          success('Event Updated', `"${payload.title}" has been updated successfully (${statusToSave}).`);
        }
      } else {
        const res = await api.createEvent(payload);
        if (res.success) {
          success(
            statusToSave === 'draft' ? 'Draft Saved' : 'Event Published',
            statusToSave === 'draft'
              ? `"${payload.title}" saved as draft. You can publish whenever ready.`
              : `"${payload.title}" is now published and immediately visible to students.`
          );
        }
      }

      setEventModalOpen(false);
      await loadOrganizerData();
    } catch (err: any) {
      error('Operation Failed', err.message || 'Could not save event.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // --------------------------------------------------------------------------
  // CANCEL EVENT ACTION & MODAL
  // --------------------------------------------------------------------------
  const handleOpenCancelModal = (event: EventItem) => {
    setCancellingEvent(event);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingEvent) return;
    setSubmittingCancel(true);
    try {
      const res = await api.cancelEvent(cancellingEvent.id, cancelReason);
      if (res.success) {
        success(
          'Event Cancelled',
          `"${cancellingEvent.title}" is now marked as cancelled. Registered attendees have been notified and new registrations are permanently closed.`
        );
        setCancelModalOpen(false);
        setCancellingEvent(null);
        await loadOrganizerData();
      }
    } catch (err: any) {
      error('Cancellation Failed', err.message || 'Could not cancel event.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // --------------------------------------------------------------------------
  // SAFE DELETE EVENT ACTION & MODAL
  // --------------------------------------------------------------------------
  const handleOpenDeleteModal = (event: EventItem) => {
    setDeletingEvent(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setSubmittingDelete(true);
    try {
      const res = await api.deleteEvent(deletingEvent.id);
      if (res.success) {
        success(
          'Event Deleted',
          `"${deletingEvent.title}" removed from active listings. Historical registration records and turnout stats remain preserved for audit compliance.`
        );
        setDeleteModalOpen(false);
        setDeletingEvent(null);
        await loadOrganizerData();
      }
    } catch (err: any) {
      error('Deletion Failed', err.message || 'Could not delete event.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // --------------------------------------------------------------------------
  // PARTICIPANT ROSTER & ATTENDANCE
  // --------------------------------------------------------------------------
  const handleOpenRoster = async (event: EventItem) => {
    setActiveRosterEvent(event);
    setRosterModalOpen(true);
    setLoadingRoster(true);
    setRosterSearch('');
    setRosterTab('all');
    try {
      const res = await api.getEventRegistrations(event.id);
      if (res.success && res.data) {
        setParticipants(res.data.registrations);
      }
    } catch (err: any) {
      error('Roster Error', err.message || 'Could not load event registrations.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleToggleAttendance = async (regId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'attended' ? 'absent' : 'attended';
    try {
      const res = await api.updateAttendance(regId, nextStatus);
      if (res.success) {
        setParticipants(prev =>
          prev.map(p => (p.id === regId ? { ...p, attendance_status: nextStatus } : p))
        );
        success('Turnout Recorded', nextStatus === 'attended' ? 'Student marked present.' : 'Attendance status unmarked.');
        loadOrganizerData();
      }
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not record attendance.');
    }
  };

  const handleExportCSV = () => {
    if (!activeRosterEvent || participants.length === 0) {
      info('No Data', 'There are no participants to export.');
      return;
    }

    const headers = ['Full Name', 'Registration Number', 'Section', 'Email', 'Ticket Code', 'Status', 'Attendance', 'Registered At'];
    const rows = participants.map(p => [
      `"${(p.user?.full_name || 'Student').replace(/"/g, '""')}"`,
      `"${(p.user?.registration_number || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.user?.section || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.user?.email || '').replace(/"/g, '""')}"`,
      `"${p.ticket_code || ''}"`,
      `"${p.registration_status}"`,
      `"${p.attendance_status}"`,
      `"${new Date(p.registered_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeRosterEvent.slug}-attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Roster Exported', `Exported ${participants.length} attendee records to CSV.`);
  };

  // --------------------------------------------------------------------------
  // LIVE PASS VERIFICATION SCANNER
  // --------------------------------------------------------------------------
  const handleVerifyCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) {
      error('Invalid Ticket Code', 'Please enter a ticket pass code.');
      return;
    }

    setVerifyingTicket(true);
    setVerifiedTicketResult(null);

    try {
      const res = await api.verifyTicket(checkInCode.trim());
      if (res.success && res.data) {
        setVerifiedTicketResult(res.data);
        success('Check-in Confirmed', `Turnout verified for ${res.data.user?.full_name || 'Attendee'}`);
        setCheckInCode('');
        loadOrganizerData();
      } else {
        error('Invalid Pass', res.message || 'Ticket code could not be verified.');
      }
    } catch (err: any) {
      error('Verification Error', err.message || 'Ticket verification failed.');
    } finally {
      setVerifyingTicket(false);
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // optimistic dismissal
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Filtered participants in Roster modal
  const filteredParticipants = participants.filter(p => {
    // 1. Tab filter
    if (rosterTab === 'confirmed' && p.registration_status !== 'confirmed') return false;
    if (rosterTab === 'cancelled' && p.registration_status !== 'cancelled') return false;
    if (rosterTab === 'attended' && p.attendance_status !== 'attended') return false;
    if (rosterTab === 'unmarked' && (p.attendance_status === 'attended' || p.registration_status !== 'confirmed')) return false;

    // 2. Search filter
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    const nameMatch = p.user?.full_name?.toLowerCase().includes(q);
    const emailMatch = p.user?.email?.toLowerCase().includes(q);
    const regMatch = p.user?.registration_number?.toLowerCase().includes(q);
    const secMatch = p.user?.section?.toLowerCase().includes(q);
    const codeMatch = p.ticket_code?.toLowerCase().includes(q);
    return !!(nameMatch || emailMatch || regMatch || secMatch || codeMatch);
  });

  // Filtered events in Hosted Events Workspace
  const nowIso = new Date().toISOString();
  const filteredEvents = events.filter(e => {
    if (e.deleted_at) return false;

    // 1. Tab filter
    if (eventTab === 'upcoming') {
      if (e.status !== 'published' || e.end_time < nowIso) return false;
    } else if (eventTab === 'published') {
      if (e.status !== 'published') return false;
    } else if (eventTab === 'draft') {
      if (e.status !== 'draft') return false;
    } else if (eventTab === 'completed') {
      if (e.status !== 'completed' && !(e.status === 'published' && e.end_time < nowIso)) return false;
    } else if (eventTab === 'cancelled') {
      if (e.status !== 'cancelled') return false;
    }

    // 2. Category filter
    if (eventCategoryFilter !== 'all' && e.category !== eventCategoryFilter) {
      return false;
    }

    // 3. Search filter
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchVenue = e.venue.toLowerCase().includes(q);
      const matchOrg = (e.organization || e.organizer_name || '').toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchType = (e.event_type || '').toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchOrg && !matchCat && !matchType) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-ink-dark py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 dark:border-border-dark/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-2">
              <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-3.5 h-3.5 object-contain rounded-xs" />
              <span>1Kampus Organizer Studio</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink dark:text-ink-dark tracking-tight">
              Event Management & Attendance
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
              Publish events, manage participant rosters, analyze registration trends, and verify admission passes for SRMIST.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              icon={<RotateCw className="w-4 h-4" />}
              onClick={loadOrganizerData}
              title="Refresh real-time data"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={handleOpenCreateModal}
            >
              Create New Event
            </Button>
          </div>
        </div>

        {/* Real-time Organizer Metrics Overview (Phase 2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Events */}
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-2">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Total Events
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
              {overview?.total_events ?? 0}
            </span>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200/60 dark:border-brand-800/60">
                {overview?.published_events ?? 0} published
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/60 dark:border-amber-800/60">
                {overview?.draft_events ?? 0} drafts
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/60 dark:border-rose-800/60">
                {overview?.cancelled_events ?? 0} cancelled
              </span>
            </div>
          </div>

          {/* Card 2: Registrations & Open Seats */}
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-2">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Registrations
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
              {overview?.total_registrations ?? 0}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-ink-faint dark:text-ink-dark-muted font-medium">
              <span>{overview?.total_remaining_seats ?? 0} seats open</span>
              <span>•</span>
              <span>{overview?.total_capacity ?? 0} total cap</span>
            </div>
          </div>

          {/* Card 3: Attendance Turnout */}
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-2">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Turnout Rate
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
              {overview?.overall_attendance_rate ?? 0}%
            </span>
            <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">
              {overview?.attended_count ?? 0} verified check-ins
            </span>
          </div>

          {/* Card 4: Active Capacity Fill */}
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-2">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-dark dark:text-sky" /> Capacity Fill
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink dark:text-ink-dark block">
              {overview && overview.total_capacity > 0
                ? `${Math.round((overview.total_registrations / overview.total_capacity) * 100)}%`
                : '0%'}
            </span>
            <span className="text-[11px] text-ink-faint dark:text-ink-dark-muted block">
              {overview?.upcoming_events ?? 0} upcoming active listings
            </span>
          </div>
        </div>

        {/* Real-time Registration Trends & Category Portfolio (Phase 2 & 6) */}
        {overview && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 7-Day Trend Velocity Chart */}
            <div className="lg:col-span-2 bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    7-Day Student Registration Velocity
                  </h4>
                  <p className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
                    Daily student sign-ups across all your hosted campus events (computed from active registrations).
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Supabase Records
                </span>
              </div>

              {/* Bar Chart Visual */}
              <div className="pt-2">
                {overview.registration_trends && overview.registration_trends.length > 0 ? (
                  <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 px-3 bg-surface-subtle dark:bg-surface-dark-subtle rounded-xl border border-border/60 dark:border-border-dark/60">
                    {(() => {
                      const maxCount = Math.max(1, ...overview.registration_trends.map(t => t.count));
                      return overview.registration_trends.map((t, idx) => {
                        const heightPct = Math.max(10, Math.round((t.count / maxCount) * 100));
                        return (
                          <div key={t.date || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                            <span className="text-[10px] font-bold text-ink dark:text-ink-dark opacity-0 group-hover:opacity-100 transition-opacity">
                              {t.count}
                            </span>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-brand-600 to-indigo-500 group-hover:from-brand-500 group-hover:to-indigo-400 transition-all shadow-xs"
                              title={`${t.label}: ${t.count} registrations`}
                            />
                            <span className="text-[10px] font-medium text-ink-muted dark:text-ink-dark-muted truncate">
                              {t.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-ink-muted dark:text-ink-dark-muted">
                    No registrations recorded in the last 7 days.
                  </div>
                )}
              </div>
            </div>

            {/* Category Portfolio Breakdown */}
            <div className="bg-surface dark:bg-surface-dark rounded-2xl p-5 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Portfolio by Category
                </h4>
                <p className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
                  Distribution of technical and cultural initiatives.
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(overview.category_distribution || {}).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-xs"
                    >
                      <Badge category={cat as EventCategory} size="sm">{cat}</Badge>
                      <span className="font-bold text-ink dark:text-ink-dark">{count}</span>
                    </div>
                  ))}
                  {Object.keys(overview.category_distribution || {}).length === 0 && (
                    <span className="text-xs text-ink-muted dark:text-ink-dark-muted">No category data available.</span>
                  )}
                </div>
              </div>

              {/* Status Summary Pill Bar */}
              <div className="pt-3 border-t border-border/80 dark:border-border-dark/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark">
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted block">Published</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">{overview.published_events}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark">
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted block">Drafts</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{overview.draft_events}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark">
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted block">Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{overview.completed_events}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rapid Admission Ticket Code Scanner Box */}
        <div className="bg-gradient-to-r from-brand-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-float dark:shadow-float-dark border border-brand-800/40 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-300">
                <QrCode className="w-4 h-4" /> Live Admission Check-in Desk
              </span>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                Verify Student Admission Ticket
              </h3>
              <p className="text-xs text-brand-100/80 leading-relaxed">
                Enter ticket code (e.g. <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-mono border border-white/10">CC-HACK-7F3A91</code>) to instantly verify authenticity and record attendee arrival.
              </p>
            </div>

            <form onSubmit={handleVerifyCheckIn} className="flex items-center gap-2 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Enter Ticket Code..."
                value={checkInCode}
                onChange={e => setCheckInCode(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-sm text-white placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono uppercase"
              />
              <Button variant="mint" size="md" loading={verifyingTicket} type="submit">
                Verify Pass
              </Button>
            </form>
          </div>

          {verifiedTicketResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-400/40 text-white flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm">
                    Verified: {verifiedTicketResult.user?.full_name || 'Student'} ({verifiedTicketResult.ticket_code})
                  </h4>
                  <p className="text-xs text-brand-200">
                    Event: {verifiedTicketResult.event?.title || 'Campus Event'} • Status: Confirmed & Checked-in
                  </p>
                </div>
              </div>
              <Badge variant="status" status="published" size="sm">Turnout Recorded</Badge>
            </div>
          )}
        </div>

        {/* In-app Notification Banners */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 shadow-xs animate-slide-down"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">{notif.title}</h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{notif.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismissNotification(notif.id)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 transition-colors cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hosted Events Management Workspace (Phase 3) */}
        <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 border border-border dark:border-border-dark shadow-card dark:shadow-card-dark space-y-5">
          {/* Workspace Title & Search/Category Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 dark:border-border-dark/80 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-ink dark:text-ink-dark">Hosted Events Workspace</h3>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                Search, filter by status or category, duplicate drafts, export rosters, or broadcast student announcements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, venue, or org..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark placeholder:text-ink-muted dark:placeholder:text-ink-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={eventCategoryFilter}
                onChange={e => setEventCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-border dark:border-border-dark bg-surface-subtle dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Hackathons">Hackathons</option>
                <option value="Workshops">Workshops</option>
                <option value="Cultural">Cultural</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
                <option value="Sports">Sports</option>
                <option value="Talks">Talks</option>
              </select>
            </div>
          </div>

          {/* Status Tabs Filter (Phase 3) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-subtle dark:bg-surface-dark-subtle rounded-2xl border border-border/80 dark:border-border-dark/80 text-xs">
            <button
              onClick={() => setEventTab('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              All Hosted ({events.filter(e => !e.deleted_at).length})
            </button>
            <button
              onClick={() => setEventTab('upcoming')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'upcoming'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Upcoming ({events.filter(e => !e.deleted_at && e.status === 'published' && e.end_time >= nowIso).length})
            </button>
            <button
              onClick={() => setEventTab('published')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'published'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Published ({events.filter(e => !e.deleted_at && e.status === 'published').length})
            </button>
            <button
              onClick={() => setEventTab('draft')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'draft'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Drafts ({events.filter(e => !e.deleted_at && e.status === 'draft').length})
            </button>
            <button
              onClick={() => setEventTab('completed')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'completed'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Completed ({events.filter(e => !e.deleted_at && (e.status === 'completed' || (e.status === 'published' && e.end_time < nowIso))).length})
            </button>
            <button
              onClick={() => setEventTab('cancelled')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                eventTab === 'cancelled'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Cancelled ({events.filter(e => !e.deleted_at && e.status === 'cancelled').length})
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-surface-muted dark:bg-surface-dark-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark flex items-center justify-center mx-auto text-ink-muted dark:text-ink-dark-muted">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-sm text-ink dark:text-ink-dark">
                No Events Match Your Filters
              </h4>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-sm mx-auto">
                No events found matching the active status, category, or search criteria.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusCircle className="w-4 h-4" />}
                onClick={handleOpenCreateModal}
                className="mt-2"
              >
                Create New Event
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border dark:border-border-dark text-ink-faint dark:text-ink-dark-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Event Title & Host</th>
                    <th className="py-3 px-4">Category & Type</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4">Confirmed / Capacity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                  {filteredEvents.map(ev => {
                    const startStr = new Date(ev.start_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const isCancelled = ev.status === 'cancelled';
                    const isDraft = ev.status === 'draft';
                    const isDuplicating = duplicatingEventId === ev.id;

                    return (
                      <tr key={ev.id} className="hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-ink dark:text-ink-dark max-w-xs">
                          <span className="line-clamp-1">{ev.title}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-ink-dark-muted font-normal mt-0.5">
                            <span className="text-brand-600 dark:text-brand-400 font-semibold">{ev.organization || ev.organizer_name}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{ev.venue}</span>
                          </div>
                          {isCancelled && ev.cancellation_reason && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block mt-0.5">
                              Reason: {ev.cancellation_reason}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge category={ev.category} size="sm">{ev.category}</Badge>
                            {ev.event_type && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-muted dark:bg-surface-dark-muted text-ink dark:text-ink-dark border border-border dark:border-border-dark capitalize">
                                {ev.event_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted dark:text-ink-dark-muted">
                          <div>{startStr}</div>
                          <div className="text-[10px] text-ink-faint">
                            {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-ink dark:text-ink-dark">
                            {ev.registered_count ?? 0} / {ev.capacity}
                          </div>
                          <div className="w-20 h-1.5 bg-surface-muted dark:bg-surface-dark-muted rounded-full mt-1 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.round(((ev.registered_count ?? 0) / ev.capacity) * 100))}%` }}
                              className="h-full bg-brand-600 dark:bg-brand-500 rounded-full"
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={ev.status} size="sm">{ev.status.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Roster Button */}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Users className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenRoster(ev)}
                              title="View participant roster & attendance"
                            >
                              Roster
                            </Button>

                            {/* Preview Button (Student View) */}
                            <button
                              onClick={() => handleOpenPreviewModal(ev)}
                              className="p-1.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors cursor-pointer"
                              title="Preview student perspective"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit3 className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenEditModal(ev)}
                              title="Edit event details"
                            >
                              Edit
                            </Button>

                            {/* Duplicate Button (Phase 6) */}
                            <button
                              onClick={() => handleDuplicateEvent(ev)}
                              disabled={isDuplicating}
                              className="p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                              title="Duplicate event as draft"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Broadcast Announcement Button (Phase 6) */}
                            {!isCancelled && !isDraft && (
                              <button
                                onClick={() => handleOpenAnnouncementModal(ev)}
                                className="p-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer"
                                title="Broadcast announcement to registered attendees"
                              >
                                <Megaphone className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Download Calendar Pass Button (Phase 6) */}
                            <button
                              onClick={() => handleDownloadICS(ev)}
                              className="p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                              title="Download calendar (.ics) pass"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                            </button>

                            {/* Cancel Button */}
                            {!isCancelled && (
                              <button
                                onClick={() => handleOpenCancelModal(ev)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs font-semibold cursor-pointer"
                                title="Cancel event (closes registrations)"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => handleOpenDeleteModal(ev)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors text-xs font-semibold cursor-pointer"
                              title="Delete event safely"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT EVENT MODAL - CONNECTED TO ALL 12 REQUIRED FIELDS (Phase 5) */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEventId ? 'Edit Campus Event' : 'Create New Campus Event'}
        description="All 12 required fields are validated and connected directly to the Supabase database."
        maxWidth="3xl"
      >
        <form onSubmit={e => handleSaveEvent(e, eventForm.status)} className="space-y-5">
          {/* Top Banner Notice */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 text-xs">
            <div className="flex items-center gap-2 text-brand-900 dark:text-brand-200 font-medium">
              <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Organizer: <strong>{user?.full_name || 'Campus Organizer'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>12 Required Fields • Live Supabase Connection</span>
            </div>
          </div>

          {/* 1. Event Title */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
              <span>1. Event Title <span className="text-rose-500">*</span></span>
              <span className="text-[10px] lowercase text-ink-faint">min 3 chars</span>
            </label>
            <input
              type="text"
              value={eventForm.title}
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
              required
              minLength={3}
              maxLength={120}
              placeholder="e.g. SRM Autonomous Robotics Hackathon 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Row 2: Event Type, Category & Organized By */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 2. Event Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                2. Event Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={eventForm.event_type}
                onChange={e => {
                  const newType = e.target.value as EventType;
                  const matching = EVENT_TYPES.find(t => t.id === newType);
                  setEventForm({
                    ...eventForm,
                    event_type: newType,
                    category: (matching?.defaultCategory as EventCategory) || eventForm.category,
                  });
                }}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                3. Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={eventForm.category}
                onChange={e => setEventForm({ ...eventForm, category: e.target.value as EventCategory })}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Technology">Technology</option>
                <option value="Hackathons">Hackathons</option>
                <option value="Workshops">Workshops</option>
                <option value="Cultural">Cultural</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
                <option value="Sports">Sports</option>
                <option value="Talks">Talks</option>
              </select>
            </div>

            {/* 4. Organized By (Approved Organizations) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                4. Organized By <span className="text-rose-500">*</span>
              </label>
              <select
                value={eventForm.organization_id}
                onChange={e => {
                  const selectedId = e.target.value;
                  const found = organizationsList.find(o => o.id === selectedId);
                  setEventForm({
                    ...eventForm,
                    organization_id: selectedId,
                    organization: found?.name || 'SRMIST',
                  });
                }}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {organizationsList.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Custom Organization Name Input */}
          {eventForm.organization_id === 'other-approved' && (
            <div className="p-3 rounded-xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark animate-fade-in">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Specify Approved Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={eventForm.custom_organization}
                onChange={e => setEventForm({ ...eventForm, custom_organization: e.target.value })}
                required
                placeholder="e.g. IEEE SRM Student Branch, Biotechnology Association"
                className="w-full px-4 py-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Row 3: Seat Capacity & Venue Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 5. Total Seat Capacity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">
                  5. Total Seat Capacity <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted">positive integer</span>
              </div>
              <input
                type="number"
                min="1"
                max="10000"
                value={eventForm.capacity}
                onChange={e => setEventForm({ ...eventForm, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
              <p className="text-[11px] text-ink-muted dark:text-ink-dark-muted mt-1 leading-tight">
                Remaining seats are calculated dynamically from active registrations, never edited manually.
              </p>
            </div>

            {/* 6. Venue Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                6. Venue Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                required
                placeholder="e.g. UB Seminar Hall 301, University Building"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-ink-muted dark:text-ink-dark-muted mt-1 leading-tight">
                Campus building, hall name, or laboratory block.
              </p>
            </div>
          </div>

          {/* Row 4: Event Dates & Registration Deadlines with Real-time Timeline Status */}
          <div className="p-4 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-ink-dark">
              <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Event Schedule & Registration Deadlines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 7. Start Date & Time */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                  7. Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.start_time}
                  onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 8. End Date & Time */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                  8. End Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.end_time}
                  onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* 9. Registration Deadline */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                  9. Reg. Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.registration_deadline}
                  onChange={e => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Inline validation badges */}
            {(() => {
              const start = new Date(eventForm.start_time).getTime();
              const end = new Date(eventForm.end_time).getTime();
              const deadline = new Date(eventForm.registration_deadline).getTime();
              const endValid = end > start;
              const deadlineValid = deadline <= start;

              if (!endValid || !deadlineValid) {
                return (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 space-y-0.5">
                    {!endValid && <div>• End time must be strictly after the start time.</div>}
                    {!deadlineValid && <div>• Registration deadline must precede or equal the start time.</div>}
                  </div>
                );
              }

              return (
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Timeline verified: Registration closes before event commencement, and duration is valid.</span>
                </div>
              );
            })()}
          </div>

          {/* Row 5: 10. Banner Image URL & Live Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">
                10. Banner Image URL <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted">High resolution 16:9 ratio recommended</span>
            </div>
            <input
              type="url"
              value={eventForm.banner_url}
              onChange={e => {
                setEventForm({ ...eventForm, banner_url: e.target.value });
                setBannerPreviewFailed(false);
              }}
              required
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            {/* Quick Banner Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted mr-1">Sample Presets:</span>
              {BANNER_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => {
                    setEventForm({ ...eventForm, banner_url: preset.url });
                    setBannerPreviewFailed(false);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-surface-muted dark:bg-surface-dark-muted hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 dark:hover:text-brand-400 transition-colors border border-border dark:border-border-dark cursor-pointer font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Live Banner Preview Card */}
            {eventForm.banner_url && (
              <div className="mt-2 relative rounded-2xl overflow-hidden border border-border dark:border-border-dark aspect-[16/7] w-full bg-surface-subtle dark:bg-surface-dark-subtle shadow-xs">
                {bannerPreviewFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-ink-muted dark:text-ink-dark-muted">
                    <ImageIcon className="w-8 h-8 text-ink-faint mb-1" />
                    <span className="text-xs">Unable to load image from URL. Please check image link.</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={eventForm.banner_url}
                      alt="Banner Preview"
                      onError={() => setBannerPreviewFailed(true)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold border border-white/20 capitalize">
                        {eventForm.event_type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-semibold">
                        {eventForm.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
                        {eventForm.organization_id === 'other-approved' ? (eventForm.custom_organization || 'Other Organization') : eventForm.organization}
                      </div>
                      <div className="text-sm font-bold truncate">
                        {eventForm.title || 'Event Title Preview'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Row 6: 11. Event Description */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
              <span>11. Event Description <span className="text-rose-500">*</span></span>
              <span className="text-[10px] lowercase text-ink-faint">min 10 chars</span>
            </label>
            <textarea
              rows={3}
              value={eventForm.description}
              onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              required
              minLength={10}
              placeholder="Comprehensive summary of what attendees will learn, keynote topics, judging criteria, or guest speakers..."
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Row 7: 12. Attendee Instructions */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
              <span>12. Attendee Instructions <span className="text-rose-500">*</span></span>
              <span className="text-[10px] lowercase text-ink-faint">min 5 chars</span>
            </label>
            <textarea
              rows={2}
              value={eventForm.instructions}
              onChange={e => setEventForm({ ...eventForm, instructions: e.target.value })}
              required
              minLength={5}
              placeholder="e.g. Bring laptops with Python installed; student ID card mandatory for entry; arrive 15 minutes before start..."
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Footer Actions with Draft and Publish (Phase 5) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border dark:border-border-dark">
            <Button variant="secondary" size="md" type="button" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                loading={submittingEvent}
                type="button"
                onClick={e => handleSaveEvent(e, 'draft')}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={submittingEvent}
                type="button"
                onClick={e => handleSaveEvent(e, 'published')}
              >
                {editingEventId ? 'Publish Updates' : 'Publish Campus Event'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* STUDENT-FACING EVENT PREVIEW MODAL (Phase 5) */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewEvent(null);
        }}
        title={`Student View Preview: ${previewEvent?.title || 'Campus Event'}`}
        description="Verify how students discover and view this event across 1Kampus before or after publishing."
        maxWidth="3xl"
      >
        {previewEvent && (
          <div className="space-y-6">
            <div className="p-3 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark text-xs flex items-center justify-between">
              <span className="font-semibold text-ink-muted dark:text-ink-dark-muted flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                Live Student Perspective Simulation
              </span>
              <div className="flex items-center gap-2">
                <Badge status={previewEvent.status} size="sm">{previewEvent.status.toUpperCase()}</Badge>
                <span className="text-[11px] text-ink-faint">
                  {previewEvent.remaining_capacity ?? (previewEvent.capacity - (previewEvent.registered_count || 0))} seats open
                </span>
              </div>
            </div>

            {/* Discovery Card Preview */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint dark:text-ink-dark-muted mb-2">
                Discovery Grid Card Appearance
              </h4>
              <div className="max-w-md">
                <EventCard event={previewEvent} />
              </div>
            </div>

            {/* Event Details Preview Summary */}
            <div className="p-5 rounded-2xl bg-surface-subtle dark:bg-surface-dark-subtle border border-border dark:border-border-dark space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint dark:text-ink-dark-muted">
                Student Event Page Overview
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block">Venue</span>
                  <span className="text-ink dark:text-ink-dark font-medium">{previewEvent.venue}</span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block">Schedule</span>
                  <span className="text-ink dark:text-ink-dark font-medium">
                    {new Date(previewEvent.start_time).toLocaleString()} – {new Date(previewEvent.end_time).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block">Registration Closes</span>
                  <span className="text-ink dark:text-ink-dark font-medium">
                    {new Date(previewEvent.registration_deadline).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block">Organized By</span>
                  <span className="text-ink dark:text-ink-dark font-medium">
                    {previewEvent.organization || previewEvent.organizer_name}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 dark:border-border-dark/60">
                <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block mb-1">Description</span>
                <p className="text-ink dark:text-ink-dark leading-relaxed whitespace-pre-wrap">{previewEvent.description}</p>
              </div>

              {previewEvent.instructions && (
                <div className="pt-2 border-t border-border/60 dark:border-border-dark/60">
                  <span className="text-ink-muted dark:text-ink-dark-muted font-semibold block mb-1">Attendee Instructions</span>
                  <p className="text-ink dark:text-ink-dark leading-relaxed bg-brand-50/50 dark:bg-brand-950/30 p-2.5 rounded-xl border border-brand-200/60 dark:border-brand-800/40">
                    {previewEvent.instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPreviewModalOpen(false);
                  setPreviewEvent(null);
                }}
              >
                Close Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleOpenEditModal(previewEvent);
                }}
              >
                Edit Event
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* BROADCAST ANNOUNCEMENT MODAL (Phase 6) */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => {
          if (!submittingAnnouncement) {
            setAnnouncementModalOpen(false);
            setAnnouncingEvent(null);
          }
        }}
        title={`Broadcast Announcement: ${announcingEvent?.title || 'Event'}`}
        description="Send an instant in-app notification to all confirmed registered students for this event."
        maxWidth="lg"
      >
        {announcingEvent && (
          <form onSubmit={handleSendAnnouncement} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/60 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
              <Megaphone className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <p>
                This broadcast will be delivered directly to the notification center of all active attendees ({announcingEvent.registered_count ?? 0} students) registered for <strong>"{announcingEvent.title}"</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                Announcement Subject / Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Venue Change to Main Auditorium / Bring Laptop Chargers"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1.5">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={announcementMessage}
                onChange={e => setAnnouncementMessage(e.target.value)}
                placeholder="Provide essential event day instructions, room numbers, reporting timings, or software requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-sm text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-border-dark">
              <Button
                variant="secondary"
                size="md"
                type="button"
                disabled={submittingAnnouncement}
                onClick={() => {
                  setAnnouncementModalOpen(false);
                  setAnnouncingEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={submittingAnnouncement}
                icon={<Send className="w-4 h-4" />}
                type="submit"
              >
                Send Broadcast
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* PARTICIPANT ROSTER MODAL (Phase 4) */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={`Participant Roster: ${activeRosterEvent?.title || 'Event'}`}
        description={`Track confirmed registrations, manage attendance check-ins, and export student rosters (${participants.length} registered).`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Status Tab Filters inside Roster Modal */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-subtle dark:bg-surface-dark-subtle rounded-xl border border-border dark:border-border-dark text-xs">
            <button
              onClick={() => setRosterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rosterTab === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink'
              }`}
            >
              All ({participants.length})
            </button>
            <button
              onClick={() => setRosterTab('confirmed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rosterTab === 'confirmed'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink'
              }`}
            >
              Confirmed ({participants.filter(p => p.registration_status === 'confirmed').length})
            </button>
            <button
              onClick={() => setRosterTab('attended')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rosterTab === 'attended'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink'
              }`}
            >
              Attended ({participants.filter(p => p.attendance_status === 'attended').length})
            </button>
            <button
              onClick={() => setRosterTab('unmarked')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rosterTab === 'unmarked'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink'
              }`}
            >
              Unmarked ({participants.filter(p => p.attendance_status !== 'attended' && p.registration_status === 'confirmed').length})
            </button>
            <button
              onClick={() => setRosterTab('cancelled')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rosterTab === 'cancelled'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink'
              }`}
            >
              Cancelled ({participants.filter(p => p.registration_status === 'cancelled').length})
            </button>
          </div>

          {/* Search and Export toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-ink-faint dark:text-ink-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, reg number, section, or ticket code..."
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark placeholder:text-ink-muted dark:placeholder:text-ink-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>

          {/* Attendees List */}
          {loadingRoster ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-14 bg-surface-muted dark:bg-surface-dark-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted dark:text-ink-dark-muted">
              No participants match your search criteria.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60 dark:divide-border-dark/60 border border-border dark:border-border-dark rounded-xl">
              {filteredParticipants.map(p => (
                <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                      alt={p.user?.full_name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-border dark:ring-border-dark"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-xs text-ink dark:text-ink-dark">{p.user?.full_name || 'Student Attendee'}</h5>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                          p.registration_status === 'confirmed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                          {p.registration_status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted dark:text-ink-dark-muted mt-0.5">
                        {p.user?.registration_number && (
                          <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/70 px-1.5 py-0.2 rounded text-[10px] border border-brand-200 dark:border-brand-800">
                            {p.user.registration_number}
                          </span>
                        )}
                        {p.user?.section && (
                          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                            Sec: {p.user.section}
                          </span>
                        )}
                        <span>{p.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-ink-faint mt-0.5 font-mono">
                        <span className="text-brand-600 dark:text-brand-400 font-bold">{p.ticket_code}</span>
                        <span>•</span>
                        <span>Reg: {new Date(p.registered_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAttendance(p.id, p.attendance_status)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        p.attendance_status === 'attended'
                          ? 'bg-mint dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-mint-dark/40 dark:border-emerald-700/50'
                          : 'bg-surface-muted dark:bg-surface-dark-muted text-ink-muted dark:text-ink-dark-muted border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark'
                      }`}
                    >
                      {p.attendance_status === 'attended' ? '✓ Attended' : 'Mark Present'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* CANCEL EVENT CONFIRMATION MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          if (!submittingCancel) {
            setCancelModalOpen(false);
            setCancellingEvent(null);
          }
        }}
        title="Cancel Campus Event"
        description="Confirm event cancellation and optional announcement to registered students."
        maxWidth="md"
      >
        {cancellingEvent && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                Cancelling <strong>"{cancellingEvent.title}"</strong> will immediately close registrations and mark the event as Cancelled on campus listings. Existing registered students' tickets will be preserved in their records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Inclement weather / schedule postponement / speaker conflict"
                className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark-subtle text-xs text-ink dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={submittingCancel}
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancellingEvent(null);
                }}
              >
                Keep Event Active
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={submittingCancel}
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE EVENT CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!submittingDelete) {
            setDeleteModalOpen(false);
            setDeletingEvent(null);
          }
        }}
        title="Delete this event?"
        description="Review event deletion policy before continuing."
        maxWidth="md"
      >
        {deletingEvent && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Permanent removal from public listings</h4>
                <p className="mt-1">
                  <strong>"{deletingEvent.title}"</strong> will be removed from upcoming events and searches.
                </p>
                <p className="mt-1 font-semibold text-rose-800 dark:text-rose-300">
                  Data Retention Policy: Historical attendance records, ticket passes, and registration logs are safely retained for institutional compliance.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={submittingDelete}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingEvent(null);
                }}
              >
                Keep Event
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={submittingDelete}
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OrganizerPage;
