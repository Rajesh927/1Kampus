export type UserRole = 'student' | 'organizer' | 'admin';

export type EventCategory = 
  | 'Technology' 
  | 'Hackathons' 
  | 'Workshops' 
  | 'Cultural' 
  | 'Entrepreneurship' 
  | 'Sports' 
  | 'Talks';

export type EventType =
  | 'hackathon'
  | 'workshop'
  | 'competition'
  | 'seminar'
  | 'technical fest'
  | 'cultural event'
  | 'sports'
  | 'other';

export interface ApprovedOrganization {
  id: string;
  name: string;
  category: 'institution' | 'department' | 'club' | 'other';
  active?: boolean;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlist';

export type AttendanceStatus = 'unmarked' | 'attended' | 'absent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  registration_number?: string;
  section?: string;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  organizer_id: string;
  organizer_name: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  event_type?: EventType;
  organization?: string;
  organization_id?: string;
  banner_url: string;
  venue: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  status: EventStatus;
  instructions?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  // Computed / aggregated fields
  registered_count?: number;
  remaining_capacity?: number;
  is_full?: boolean;
  is_registered_by_user?: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'event_cancelled' | 'info' | 'system' | 'registration' | 'event_announcement';
  read: boolean;
  event_id?: string;
  created_at: string;
}

export interface OrganizerOverview {
  total_events: number;
  published_events: number;
  upcoming_events: number;
  draft_events: number;
  completed_events: number;
  cancelled_events: number;
  total_registrations: number;
  total_capacity: number;
  total_remaining_seats: number;
  overall_attendance_rate: number;
  attended_count: number;
  recent_registrations: RegistrationItem[];
  recent_events: EventItem[];
  registration_trends: { date: string; label: string; count: number }[];
  category_distribution: Record<string, number>;
}

export interface RegistrationItem {
  id: string;
  user_id: string;
  event_id: string;
  registration_status: RegistrationStatus;
  ticket_code: string;
  registered_at: string;
  cancelled_at?: string;
  attendance_status: AttendanceStatus;
  attended_at?: string;
  // Joined relation fields for convenience
  event?: EventItem;
  user?: UserProfile;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  sections?: string[];
  meta?: any;
}
