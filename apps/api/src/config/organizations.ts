import { ApprovedOrganization } from '../types/index.js';

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

export const EVENT_TYPES = [
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'competition', label: 'Competition' },
  { id: 'seminar', label: 'Seminar' },
  { id: 'technical fest', label: 'Technical Fest' },
  { id: 'cultural event', label: 'Cultural Event' },
  { id: 'sports', label: 'Sports' },
  { id: 'other', label: 'Other' },
] as const;
