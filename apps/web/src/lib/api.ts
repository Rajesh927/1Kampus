import { ApiResponse, EventItem, RegistrationItem, UserProfile, NotificationItem, ApprovedOrganization, OrganizerOverview, OrganizerApplication } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('cc_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const devUser = localStorage.getItem('cc_user');
    if (devUser) {
      try {
        const u = JSON.parse(devUser) as UserProfile;
        headers['x-user-id'] = u.id;
        headers['x-user-role'] = u.role;
        headers['x-user-email'] = u.email;
        headers['x-user-name'] = u.full_name;
      } catch (e) {
        // ignore JSON parse error
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({
        success: false,
        error: { code: 'INVALID_RESPONSE', message: 'Failed to parse server response.' },
      }));

      if (!response.ok) {
        let errorMsg = json.error?.message || `HTTP ${response.status}: Request failed`;
        if (json.error?.details && Array.isArray(json.error.details) && json.error.details.length > 0) {
          const details = json.error.details.map((d: any) => d.message || `${d.field}: invalid`).join(', ');
          errorMsg = `${errorMsg} (${details})`;
        }
        throw new Error(errorMsg);
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
        console.error(`API server connection failed on ${options.method || 'GET'} ${endpoint}:`, err);
        throw new Error('Could not connect to backend server (localhost:5000). Ensure the API server is running.');
      }
      console.error(`API error on ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // HEALTH & AUTH
  // --------------------------------------------------------------------------
  public async getHealth() {
    return this.request<{ status: string; service: string; database: string }>('/health');
  }

  public async getMe() {
    return this.request<UserProfile>('/me');
  }

  public async updateProfile(data: { full_name?: string; avatar_url?: string; section?: string }) {
    return this.request<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async studentSignup(payload: {
    full_name: string;
    registration_number: string;
    email: string;
    section: string;
    password: string;
  }) {
    return this.request<{ user: UserProfile; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async login(payload: { email: string; password: string }) {
    return this.request<{ user: UserProfile; token: string; mustChangePassword?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  public async checkUnique(payload: { email?: string; registration_number?: string; excludeUserId?: string }) {
    return this.request<{ emailExists: boolean; registrationNumberExists: boolean }>('/auth/check-unique', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async recoverPassword(email: string) {
    return this.request<{ message: string }>('/auth/recover-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public async devLogin(role: 'student' | 'organizer' | 'admin', email?: string) {
    return this.request<{ user: UserProfile; token: string }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role, email }),
    });
  }

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------
  public async getEvents(params: {
    search?: string;
    category?: string;
    status?: string;
    timeFilter?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
    organizerId?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.timeFilter) query.set('timeFilter', params.timeFilter);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.organizerId) query.set('organizerId', params.organizerId);

    const qs = query.toString();
    return this.request<EventItem[]>(`/events${qs ? `?${qs}` : ''}`);
  }

  public async getEventById(id: string) {
    return this.request<EventItem>(`/events/${id}`);
  }

  public async createEvent(data: Partial<EventItem>) {
    return this.request<EventItem>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateEvent(id: string, data: Partial<EventItem>) {
    return this.request<EventItem>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async cancelEvent(id: string, reason?: string) {
    return this.request<EventItem>(`/events/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  public async deleteEvent(id: string) {
    return this.request<{ message: string }>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  public async getEventOrganizations() {
    return this.request<ApprovedOrganization[]>('/events/meta/organizations');
  }

  public async getEventTypes() {
    return this.request<{ id: string; label: string }[]>('/events/meta/types');
  }

  // --------------------------------------------------------------------------
  // REGISTRATIONS
  // --------------------------------------------------------------------------
  public async registerForEvent(eventId: string) {
    return this.request<RegistrationItem>(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  public async cancelRegistration(registrationId: string) {
    return this.request<RegistrationItem>(`/registrations/${registrationId}`, {
      method: 'DELETE',
    });
  }

  public async getMyRegistrations() {
    return this.request<RegistrationItem[]>('/me/registrations');
  }

  public async getEventRegistrations(eventId: string) {
    return this.request<{
      event: EventItem;
      registrations: RegistrationItem[];
      total_registered: number;
      capacity: number;
    }>(`/events/${eventId}/registrations`);
  }

  public async updateAttendance(registrationId: string, attendance_status: 'attended' | 'absent') {
    return this.request<RegistrationItem>(`/registrations/${registrationId}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({ attendance_status }),
    });
  }

  public async verifyTicket(ticket_code: string) {
    return this.request<RegistrationItem>('/registrations/verify-ticket', {
      method: 'POST',
      body: JSON.stringify({ ticket_code }),
    });
  }

  // --------------------------------------------------------------------------
  // ORGANIZER & ADMIN
  // --------------------------------------------------------------------------
  public async getOrganizerOverview() {
    return this.request<OrganizerOverview>('/organizer/overview');
  }

  public async duplicateEvent(eventId: string) {
    return this.request<EventItem>(`/events/${eventId}/duplicate`, {
      method: 'POST',
    });
  }

  public async broadcastAnnouncement(eventId: string, title: string, message: string) {
    return this.request<{ sent_to: number; event_title: string }>(`/events/${eventId}/announcements`, {
      method: 'POST',
      body: JSON.stringify({ title, message }),
    });
  }

  public async getOrganizerEvents(params: { status?: string } = {}) {
    const qs = params.status ? `?status=${params.status}` : '';
    return this.request<EventItem[]>(`/organizer/events${qs}`);
  }

  public async getNotifications() {
    return this.request<NotificationItem[]>('/me/notifications');
  }

  public async markNotificationRead(id: string) {
    return this.request<{ id: string; read: boolean }>(`/me/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  public async getAdminOverview() {
    return this.request<{
      total_users: number;
      total_events: number;
      total_registrations: number;
      active_events: number;
      category_distribution: Record<string, number>;
      users_by_role: Record<string, number>;
    }>('/admin/overview');
  }

  public async getAdminUsers() {
    return this.request<UserProfile[]>('/admin/users');
  }

  public async updateAdminEventStatus(eventId: string, status: string, reason?: string) {
    return this.request<EventItem>(`/admin/events/${eventId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  public async adminCancelEvent(eventId: string, reason?: string) {
    return this.request<EventItem>(`/admin/events/${eventId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  public async adminDeleteEvent(eventId: string) {
    return this.request<{ message: string }>(`/admin/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // --------------------------------------------------------------------------
  // ADMIN STUDENT MANAGEMENT
  // --------------------------------------------------------------------------
  public async getAdminStudents(params: {
    search?: string;
    section?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.section && params.section !== 'All') query.set('section', params.section);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return this.request<UserProfile[]>(`/admin/students${qs ? `?${qs}` : ''}`);
  }

  public async getAdminStudentDetails(id: string) {
    return this.request<{
      student: UserProfile;
      registrations: RegistrationItem[];
      registration_count: number;
    }>(`/admin/students/${id}`);
  }

  public async updateAdminStudent(
    id: string,
    updates: { full_name?: string; section?: string; registration_number?: string }
  ) {
    return this.request<UserProfile>(`/admin/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async resetAdminStudentPassword(id: string) {
    return this.request<{ message: string }>(`/admin/students/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // --------------------------------------------------------------------------
  // ADMIN ORGANIZER MANAGEMENT & SUPER ADMIN STATUS
  // --------------------------------------------------------------------------
  public async getSuperAdminStatus() {
    return this.request<{
      designated_super_admin: UserProfile;
      account_type: string;
      conflicts: Array<{ id: string; email: string; full_name: string }>;
      has_conflicts: boolean;
      total_admin_accounts: number;
    }>('/admin/super-admin');
  }

  public async getAdminOrganizers() {
    return this.request<Array<UserProfile & { events_count: number; active_events_count: number; total_attendees: number }>>('/admin/organizers');
  }

  public async getAdminOrganizerDetails(id: string) {
    return this.request<{
      organizer: UserProfile;
      events: EventItem[];
      stats: { total_events: number; active_events: number; total_attendees: number };
    }>(`/admin/organizers/${id}`);
  }

  public async updateAdminOrganizer(
    id: string,
    updates: { full_name?: string; section?: string; registration_number?: string; role?: string }
  ) {
    return this.request<UserProfile>(`/admin/organizers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async getAdminEventAttendees(eventId: string) {
    return this.request<Array<RegistrationItem & { student: UserProfile }>>(`/admin/events/${eventId}/attendees`);
  }

  // --------------------------------------------------------------------------
  // ORGANIZER APPLICATIONS WORKFLOW
  // --------------------------------------------------------------------------
  public async applyOrganizer(data: {
    full_name: string;
    email: string;
    employee_id: string;
    club_name: string;
    position: string;
    reason: string;
    password: string;
    confirm_password?: string;
  }) {
    return this.request<{ application: OrganizerApplication; user: UserProfile; token: string }>('/organizer/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async getOrganizerApplicationStatus() {
    return this.request<{ status: string; application: OrganizerApplication | null; user: UserProfile }>('/organizer/application-status');
  }

  public async getAdminOrganizerApplications(status?: string) {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return this.request<OrganizerApplication[]>(`/admin/organizer-applications${query}`);
  }

  public async approveOrganizerApplication(id: string) {
    return this.request<{ application: OrganizerApplication; user: UserProfile }>(`/admin/organizer-applications/${id}/approve`, {
      method: 'POST',
    });
  }

  public async rejectOrganizerApplication(id: string, reason?: string) {
    return this.request<{ application: OrganizerApplication; user: UserProfile }>(`/admin/organizer-applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async revokeOrganizerAccess(id: string, reason?: string) {
    return this.request<UserProfile>(`/admin/organizers/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export const api = new ApiClient();
