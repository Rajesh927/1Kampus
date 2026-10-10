import { ApprovedOrganization, EventType } from '../types/index.js';

export const APPROVED_ORGANIZATIONS: ApprovedOrganization[] = [
  { id: 'srmist', name: 'SRMIST', category: 'institution' },
  { id: 'acm-student-chapter', name: 'ACM Student Chapter', category: 'club' },
  { id: 'dsa-coding-club', name: 'DSA/Coding Club', category: 'club' },
  { id: 'dept-cse', name: 'CSE', category: 'department' },
  { id: 'dept-aiml', name: 'AI & ML', category: 'department' },
  { id: 'dept-it', name: 'IT', category: 'department' },
  { id: 'dept-eee', name: 'EEE', category: 'department' },
  { id: 'dept-ece', name: 'ECE', category: 'department' },
  { id: 'dept-mech', name: 'Mechanical Engineering', category: 'department' },
  { id: 'dept-civil', name: 'Civil Engineering', category: 'department' },
  { id: 'club-robotics-iot', name: 'Robotics/IoT Club', category: 'club' },
  { id: 'club-ecell', name: 'Entrepreneurship/E-Cell', category: 'club' },
  { id: 'club-cultural', name: 'Cultural Club', category: 'club' },
  { id: 'club-sports', name: 'Sports Club', category: 'club' },
  { id: 'other-approved', name: 'Other Approved Organization', category: 'other' },
];

export interface EventTypeOption {
  id: EventType;
  label: string;
  defaultCategory: string;
}

export const EVENT_TYPES: EventTypeOption[] = [
  { id: 'hackathon', label: 'Hackathon', defaultCategory: 'Hackathons' },
  { id: 'workshop', label: 'Workshop', defaultCategory: 'Workshops' },
  { id: 'competition', label: 'Competition', defaultCategory: 'Technology' },
  { id: 'seminar', label: 'Seminar', defaultCategory: 'Talks' },
  { id: 'technical fest', label: 'Technical Fest', defaultCategory: 'Technology' },
  { id: 'cultural event', label: 'Cultural Event', defaultCategory: 'Cultural' },
  { id: 'sports', label: 'Sports', defaultCategory: 'Sports' },
  { id: 'other', label: 'Other', defaultCategory: 'Technology' },
];
