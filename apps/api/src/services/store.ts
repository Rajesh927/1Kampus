import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { EventItem, RegistrationItem, UserProfile, EventCategory, EventStatus, NotificationItem, UserRole, EventType, ApprovedOrganization, OrganizerOverview, OrganizerApplication, OrganizerApprovalStatus } from '../types/index.js';
import { APPROVED_ORGANIZATIONS } from '../config/organizations.js';


// ----------------------------------------------------------------------------
// CRYPTOGRAPHIC CREDENTIALS & SESSION TOKEN SECURITY
// ----------------------------------------------------------------------------
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

export interface SessionPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('base64url');
  return `CC_SESSION_${data}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  if (!token || !token.startsWith('CC_SESSION_')) return null;
  const raw = token.replace('CC_SESSION_', '');
  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) return null;
  const data = raw.substring(0, dotIndex);
  const signature = raw.substring(dotIndex + 1);
  if (!data || !signature) return null;

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const expectedSig = hmac.digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired session
    }
    return payload;
  } catch {
    return null;
  }
}

// Seed demo user profiles
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'SRMIST',
    email: 'admin@srmist.edu.in',
    role: 'admin',
    registration_number: 'ADM-SRMIST-001',
    section: 'Administration',
    approval_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'ACM Student Chapter SRMIST',
    email: 'acm@srmist.edu.in',
    role: 'organizer',
    registration_number: 'ORG-ACM-001',
    section: 'Faculty Advisor / CSE',
    approval_status: 'approved',
    club_name: 'ACM Student Chapter',
    position: 'Faculty Advisor / Chapter Lead',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    full_name: 'SRM Robotics Club',
    email: 'robotics@srmist.edu.in',
    role: 'organizer',
    registration_number: 'ORG-ROBO-002',
    section: 'Student Affairs',
    approval_status: 'approved',
    club_name: 'Robotics/IoT Club',
    position: 'Club President',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    full_name: 'E-Cell SRMIST',
    email: 'ecell@srmist.edu.in',
    role: 'organizer',
    registration_number: 'ORG-ECELL-003',
    section: 'Management Studies',
    approval_status: 'approved',
    club_name: 'Entrepreneurship/E-Cell',
    position: 'Student Convenor',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    full_name: 'Milan Cultural Committee',
    email: 'milan@srmist.edu.in',
    role: 'organizer',
    registration_number: 'ORG-MILAN-004',
    section: 'Cultural Committee',
    approval_status: 'approved',
    club_name: 'Cultural Club',
    position: 'Cultural Secretary',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    full_name: 'Alex Chen',
    email: 'alex.chen@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311003010123',
    section: 'CSE-A',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    full_name: 'Priya Sharma',
    email: 'priya.s@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311003010456',
    section: 'CSE-B',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    full_name: 'Rohan Verma',
    email: 'rohan.v@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311003010789',
    section: 'CSE-A',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    full_name: 'Ananya Iyer',
    email: 'ananya.i@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311008010234',
    section: 'IT-A',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000014',
    full_name: 'Vikram Nair',
    email: 'vikram.n@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311012010567',
    section: 'ECE-A',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000015',
    full_name: 'Sneha Reddy',
    email: 'sneha.r@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2311026010890',
    section: 'AIDS-A',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000020',
    full_name: 'Dr. K. S. Ramanathan',
    email: 'ramanathan.ks@srmist.edu.in',
    role: 'student',
    registration_number: 'EMP-CSE-4821',
    section: 'SRM Developer Student Club',
    approval_status: 'pending',
    club_name: 'SRM Developer Student Club',
    position: 'Faculty Advisor & Convenor',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    full_name: 'Tanvi Deshmukh',
    email: 'tanvi.d@student.srmist.edu.in',
    role: 'student',
    registration_number: 'RA2211003010777',
    section: 'SRM Women in Tech (WIT)',
    approval_status: 'pending',
    club_name: 'SRM Women in Tech (WIT)',
    position: 'Chapter President',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  }
];


// Seed 10 realistic campus events with valid future dates
const nowMs = Date.now();
const dayMs = 86400000;

const INITIAL_EVENTS: EventItem[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    organizer_id: '00000000-0000-0000-0000-000000000002',
    organizer_name: 'ACM Student Chapter SRMIST',
    title: 'Hack SRM 2026: 36-Hour National Flagship Hackathon',
    slug: 'hack-srm-2026',
    description: 'Join 500+ builders, designers, and innovators for a weekend of rapid prototyping, mentorship, and project showcases. Tracks include Generative AI, Sustainable Tech, Decentralized Systems, and Smart Campus Solutions. Industry mentors from top tech companies will be on ground.',
    category: 'Hackathons',
    event_type: 'hackathon',
    organization: 'ACM Student Chapter',
    organization_id: 'acm-student-chapter',
    banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    venue: 'TP Ganesan Mini Hall 1 & Tech Park 8th Floor Labs',
    start_time: new Date(nowMs + 12 * dayMs).toISOString(),
    end_time: new Date(nowMs + 14 * dayMs).toISOString(),
    registration_deadline: new Date(nowMs + 10 * dayMs).toISOString(),
    capacity: 120,
    status: 'published',
    instructions: 'Bring your student ID, laptops, multi-plug extension cords, and sleeping gear if staying overnight. Teams of 2 to 4 members.',
    created_at: new Date(nowMs - 2 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 2 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    organizer_id: '00000000-0000-0000-0000-000000000002',
    organizer_name: 'ACM Student Chapter SRMIST',
    title: 'Full-Stack Modern React & Cloud Native Architecture Workshop',
    slug: 'full-stack-modern-react-workshop',
    description: 'A hands-on intensive masterclass on designing scalable client-server applications. Learn state machines, server components, edge deployment, and microservices architecture from senior software architects.',
    category: 'Workshops',
    event_type: 'workshop',
    organization: 'ACM Student Chapter',
    organization_id: 'acm-student-chapter',
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    venue: 'UB Seminar Hall 301, University Building',
    start_time: new Date(nowMs + 5 * dayMs).toISOString(),
    end_time: new Date(nowMs + 5 * dayMs + 14400000).toISOString(),
    registration_deadline: new Date(nowMs + 4 * dayMs).toISOString(),
    capacity: 60,
    status: 'published',
    instructions: 'Prerequisites: Basic familiarity with JavaScript/TypeScript and Git. Please install Node.js v20+ on your machines prior to attending.',
    created_at: new Date(nowMs - 3 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 3 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    organizer_id: '00000000-0000-0000-0000-000000000003',
    organizer_name: 'SRM Robotics Club',
    title: 'Autonomous Rover & Drone Dynamics Live Demo & Bootcamp',
    slug: 'autonomous-rover-drone-bootcamp',
    description: 'Explore the frontier of embedded computer vision, ROS2 integration, and real-time obstacle avoidance. Experience physical rovers navigating obstacle tracks and quadcopters performing automated waypoint patrol.',
    category: 'Technology',
    event_type: 'workshop',
    organization: 'Robotics/IoT Club',
    organization_id: 'club-robotics-iot',
    banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    venue: 'Biotech Quad Indoor Arena & Robotics Lab Ground Floor',
    start_time: new Date(nowMs + 8 * dayMs).toISOString(),
    end_time: new Date(nowMs + 8 * dayMs + 18000000).toISOString(),
    registration_deadline: new Date(nowMs + 7 * dayMs).toISOString(),
    capacity: 45,
    status: 'published',
    instructions: 'Safety goggles and laboratory gear will be provided on site. No prior hardware experience required.',
    created_at: new Date(nowMs - 4 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 4 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    organizer_id: '00000000-0000-0000-0000-000000000004',
    organizer_name: 'E-Cell SRMIST',
    title: 'Campus Founders Summit: From Dorm Room to Seed Stage',
    slug: 'campus-founders-summit-2026',
    description: 'Meet SRM alumni founders who scaled companies to Series A and beyond. Topics cover finding product-market fit, pitching angel investors, campus incubators, and legal incorporation for student startups.',
    category: 'Entrepreneurship',
    event_type: 'seminar',
    organization: 'Entrepreneurship/E-Cell',
    organization_id: 'club-ecell',
    banner_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    venue: 'Dr. T.P. Ganesan Main Auditorium',
    start_time: new Date(nowMs + 16 * dayMs).toISOString(),
    end_time: new Date(nowMs + 16 * dayMs + 21600000).toISOString(),
    registration_deadline: new Date(nowMs + 15 * dayMs).toISOString(),
    capacity: 300,
    status: 'published',
    instructions: 'Formal or smart casual attire recommended. Networking mixer session follows keynote speeches.',
    created_at: new Date(nowMs - 5 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 5 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    organizer_id: '00000000-0000-0000-0000-000000000005',
    organizer_name: 'Milan Cultural Committee',
    title: 'Acoustic Nights & Open Mic Fest 2026',
    slug: 'acoustic-nights-open-mic',
    description: 'An evening of unplugged musical performances, spoken word poetry, indie acoustic sets, and artistic showcases under the campus stars. Bring your instruments or just come with friends.',
    category: 'Cultural',
    event_type: 'cultural event',
    organization: 'Cultural Club',
    organization_id: 'club-cultural',
    banner_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    venue: 'Java Green Amphitheatre',
    start_time: new Date(nowMs + 3 * dayMs).toISOString(),
    end_time: new Date(nowMs + 3 * dayMs + 14400000).toISOString(),
    registration_deadline: new Date(nowMs + 2 * dayMs).toISOString(),
    capacity: 150,
    status: 'published',
    instructions: 'Performers must register at the reception desk 30 minutes prior to showtime.',
    created_at: new Date(nowMs - 1 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 1 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    organizer_id: '00000000-0000-0000-0000-000000000002',
    organizer_name: 'ACM Student Chapter SRMIST',
    title: 'Algorithm Battles: Fast-Paced Competitive Coding Contest',
    slug: 'algorithm-battles-competitive-coding',
    description: 'Put your algorithmic speed and data structure mastery to the test. 6 curated algorithmic challenges ranging from dynamic programming to graph flows. Real-time leaderboard and custom certificates.',
    category: 'Technology',
    event_type: 'competition',
    organization: 'ACM Student Chapter',
    organization_id: 'acm-student-chapter',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    venue: 'Tech Park Computing Center Lab 402',
    start_time: new Date(nowMs + 7 * dayMs).toISOString(),
    end_time: new Date(nowMs + 7 * dayMs + 10800000).toISOString(),
    registration_deadline: new Date(nowMs + 6 * dayMs).toISOString(),
    capacity: 80,
    status: 'published',
    instructions: 'Individual participation only. Contest runtime environments support C++, Python 3, Java, Rust, and Go.',
    created_at: new Date(nowMs - 6 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 6 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    organizer_id: '00000000-0000-0000-0000-000000000003',
    organizer_name: 'SRM Robotics Club',
    title: 'Introduction to Deep Reinforcement Learning for Physical Robots',
    slug: 'deep-rl-robotics-seminar',
    description: 'Guest technical seminar by visiting AI research scientists exploring policy gradients, PPO, simulation-to-real transfer, and Isaac Gym frameworks for humanoid motion planning.',
    category: 'Talks',
    event_type: 'seminar',
    organization: 'Robotics/IoT Club',
    organization_id: 'club-robotics-iot',
    banner_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    venue: 'Tech Park Auditorium 2',
    start_time: new Date(nowMs + 20 * dayMs).toISOString(),
    end_time: new Date(nowMs + 20 * dayMs + 10800000).toISOString(),
    registration_deadline: new Date(nowMs + 19 * dayMs).toISOString(),
    capacity: 100,
    status: 'published',
    instructions: 'Open to all engineering students. Prior knowledge of linear algebra and neural networks is helpful.',
    created_at: new Date(nowMs - 7 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 7 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    organizer_id: '00000000-0000-0000-0000-000000000004',
    organizer_name: 'E-Cell SRMIST',
    title: 'Intra-Campus 3v3 Basketball Tournament',
    slug: 'intra-campus-3v3-basketball',
    description: 'High-intensity knockout basketball championship. Teams battle for the annual campus cup with live commentary, refreshments, and spectator courtside seating.',
    category: 'Sports',
    event_type: 'sports',
    organization: 'Sports Club',
    organization_id: 'club-sports',
    banner_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    venue: 'SRM Sports Complex Court 1',
    start_time: new Date(nowMs + 10 * dayMs).toISOString(),
    end_time: new Date(nowMs + 10 * dayMs + 21600000).toISOString(),
    registration_deadline: new Date(nowMs + 9 * dayMs).toISOString(),
    capacity: 32,
    status: 'published',
    instructions: 'Rosters capped at 4 players per squad (3 on-court, 1 substitute). Non-marking basketball shoes mandatory.',
    created_at: new Date(nowMs - 8 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 8 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    organizer_id: '00000000-0000-0000-0000-000000000002',
    organizer_name: 'ACM Student Chapter SRMIST',
    title: 'Cloud-Native Kubernetes & Docker Microservices Bootcamp',
    slug: 'cloud-native-kubernetes-bootcamp',
    description: 'Learn container orchestration, ingress controllers, CI/CD pipelines, and zero-downtime rolling updates with live cluster deployments on Google Cloud Platform.',
    category: 'Workshops',
    event_type: 'workshop',
    organization: 'ACM Student Chapter',
    organization_id: 'acm-student-chapter',
    banner_url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
    venue: 'Tech Park Cloud Computing Lab 604',
    start_time: new Date(nowMs + 14 * dayMs).toISOString(),
    end_time: new Date(nowMs + 14 * dayMs + 14400000).toISOString(),
    registration_deadline: new Date(nowMs + 13 * dayMs).toISOString(),
    capacity: 50,
    status: 'published',
    instructions: 'GCP sandbox credits will be distributed to confirmed registered participants.',
    created_at: new Date(nowMs - 9 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 9 * dayMs).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    organizer_id: '00000000-0000-0000-0000-000000000005',
    organizer_name: 'Milan Cultural Committee',
    title: 'Digital Art & UI/UX Design Sprint Showcase',
    slug: 'digital-art-uiux-sprint',
    description: 'Exhibition and creative critique featuring student design projects in interaction design, 3D blender renders, visual branding, and generative typography.',
    category: 'Cultural',
    event_type: 'other',
    organization: 'Cultural Club',
    organization_id: 'club-cultural',
    banner_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    venue: 'Design Studio 2nd Floor, Architecture Block',
    start_time: new Date(nowMs + 18 * dayMs).toISOString(),
    end_time: new Date(nowMs + 18 * dayMs + 18000000).toISOString(),
    registration_deadline: new Date(nowMs + 17 * dayMs).toISOString(),
    capacity: 75,
    status: 'published',
    instructions: 'Digital artwork display boards and Figma review stations will be available for all attendees.',
    created_at: new Date(nowMs - 10 * dayMs).toISOString(),
    updated_at: new Date(nowMs - 10 * dayMs).toISOString(),
  },
];

// Initial demo confirmed registrations for Student Alex Chen
const INITIAL_REGISTRATIONS: RegistrationItem[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000010', // Alex Chen
    event_id: '10000000-0000-0000-0000-000000000001', // Hack SRM 2026
    registration_status: 'confirmed',
    ticket_code: 'CC-HACK-7F3A91',
    registered_at: new Date(nowMs - 1 * dayMs).toISOString(),
    attendance_status: 'unmarked',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000010', // Alex Chen
    event_id: '10000000-0000-0000-0000-000000000002', // React Workshop
    registration_status: 'confirmed',
    ticket_code: 'CC-WORK-B82C10',
    registered_at: new Date(nowMs - 12 * 3600000).toISOString(),
    attendance_status: 'unmarked',
  }
];

// Seed initial organizer applications awaiting Super Admin approval
const INITIAL_APPLICATIONS: OrganizerApplication[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000020',
    full_name: 'Dr. K. S. Ramanathan',
    email: 'ramanathan.ks@srmist.edu.in',
    employee_id: 'EMP-CSE-4821',
    club_name: 'SRM Developer Student Club',
    position: 'Faculty Advisor & Convenor',
    reason: 'Faculty coordinator requesting organizer dashboard access to conduct university coding hackathons, mentor student projects, and publish approved tech seminars.',
    status: 'pending',
    submitted_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0000-000000000021',
    full_name: 'Tanvi Deshmukh',
    email: 'tanvi.d@student.srmist.edu.in',
    employee_id: 'RA2211003010777',
    club_name: 'SRM Women in Tech (WIT)',
    position: 'Chapter President',
    reason: 'Student chapter president requesting organizer privileges to organize the Annual Women In Tech Summit 2026, tech workshops, and student networking mixers.',
    status: 'pending',
    submitted_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  }
];

// Disk cache directory for persistent storage across serverless warm/cold runs
const CACHE_DIR = process.env.VERCEL ? '/tmp' : path.resolve(process.cwd(), '.cache-1kampus');
const APPS_CACHE_FILE = path.join(CACHE_DIR, 'organizer_applications_cache.json');
const PROFILES_CACHE_FILE = path.join(CACHE_DIR, 'profiles_cache.json');

class DatabaseStore {
  private profiles: Map<string, UserProfile> = new Map();
  private events: Map<string, EventItem> = new Map();
  private registrations: Map<string, RegistrationItem> = new Map();
  private notifications: Map<string, NotificationItem> = new Map();
  private applications: Map<string, OrganizerApplication> = new Map();
  private credentials: Map<string, { email: string; passwordHash: string; salt: string; mustChangePassword?: boolean }> = new Map();
  private supabase: SupabaseClient | null = null;
  // Mutex lock for atomic registration concurrency
  private registrationMutex: Promise<any> = Promise.resolve();

  constructor() {
    // Populate in-memory store
    INITIAL_PROFILES.forEach(p => this.profiles.set(p.id, { ...p }));
    INITIAL_EVENTS.forEach(e => this.events.set(e.id, { ...e }));
    INITIAL_REGISTRATIONS.forEach(r => this.registrations.set(r.id, { ...r }));
    INITIAL_APPLICATIONS.forEach(a => this.applications.set(a.id, { ...a }));

    // Restore cached applications and profiles from disk if available (skip in test runner for hermetic test isolation)
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      this.loadDiskCache();
    }

    // Seed secure hashed credentials for designated accounts
    const initialAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'Admin@1Kampus2026!';
    this.setCredentials('admin@srmist.edu.in', initialAdminPass);
    this.setCredentials('acm@srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('robotics@srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('ecell@srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('milan@srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('ramanathan.ks@srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('tanvi.d@student.srmist.edu.in', 'Organizer@1Kampus2026!');
    this.setCredentials('alex.chen@student.srmist.edu.in', 'Student@1Kampus2026!');
    this.setCredentials('priya.s@student.srmist.edu.in', 'Student@1Kampus2026!');

    if (env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
      try {
        const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
        this.supabase = createClient(env.SUPABASE_URL, key);
        console.log('[DatabaseStore] Connected to Supabase backend client.');
      } catch (err) {
        console.warn('[DatabaseStore] Could not initialize Supabase client, falling back to local persistent store:', err);
      }
    } else {
      console.log('[DatabaseStore] Running in high-fidelity local development mode.');
    }

    // Ensure designated initial Super Admin account integrity
    this.ensureDesignatedSuperAdmin().then(res => {

      console.log(`[DatabaseStore] Super Admin verified: ${res.superAdmin.full_name} (${res.superAdmin.email})`);
      if (res.conflicts.length > 0) {
        console.warn(`[DatabaseStore] Warning: ${res.conflicts.length} other administrator account(s) detected:`, res.conflicts);
      }
    }).catch(err => {
      console.error('[DatabaseStore] Super Admin verification error:', err);
    });
  }

  public isUsingSupabase(): boolean {
    return this.supabase !== null;
  }

  public loadDiskCache(): void {
    try {
      if (fs.existsSync(APPS_CACHE_FILE)) {
        const raw = fs.readFileSync(APPS_CACHE_FILE, 'utf-8');
        const list = JSON.parse(raw) as OrganizerApplication[];
        if (Array.isArray(list)) {
          list.forEach(a => this.applications.set(a.id, a));
          console.log(`[DatabaseStore] Restored ${list.length} organizer application(s) from persistent disk cache.`);
        }
      }
      if (fs.existsSync(PROFILES_CACHE_FILE)) {
        const raw = fs.readFileSync(PROFILES_CACHE_FILE, 'utf-8');
        const list = JSON.parse(raw) as UserProfile[];
        if (Array.isArray(list)) {
          list.forEach(p => {
            if (!this.profiles.has(p.id)) {
              this.profiles.set(p.id, p);
            }
          });
          console.log(`[DatabaseStore] Restored ${list.length} user profile(s) from persistent disk cache.`);
        }
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not read disk cache (non-critical):', err);
    }
  }

  public saveDiskCache(): void {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return;
    }
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      const apps = Array.from(this.applications.values());
      fs.writeFileSync(APPS_CACHE_FILE, JSON.stringify(apps, null, 2), 'utf-8');

      const profiles = Array.from(this.profiles.values());
      fs.writeFileSync(PROFILES_CACHE_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[DatabaseStore] Could not save disk cache (non-critical):', err);
    }
  }

  // --------------------------------------------------------------------------

  // AUTHENTICATION & CREDENTIALS MANAGEMENT
  // --------------------------------------------------------------------------
  public setCredentials(email: string, password: string, mustChangePassword = false): void {
    const cleanEmail = email.trim().toLowerCase();
    const { hash, salt } = hashPassword(password);
    this.credentials.set(cleanEmail, {
      email: cleanEmail,
      passwordHash: hash,
      salt,
      mustChangePassword,
    });
  }

  public hasCredentials(email: string): boolean {
    return this.credentials.has(email.trim().toLowerCase());
  }

  public generateSessionToken(user: UserProfile): string {
    const secret = env.SUPABASE_JWT_SECRET || '1kampus-jwt-secret-session-key-2026';
    const payload: SessionPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    };
    return signSessionToken(payload, secret);
  }

  public verifySessionToken(token: string): { userId: string; role: UserRole; email: string } | null {
    const secret = env.SUPABASE_JWT_SECRET || '1kampus-jwt-secret-session-key-2026';
    const payload = verifySessionToken(token, secret);
    if (!payload) return null;
    return {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  }

  public async authenticate(email: string, password: string): Promise<{ user: UserProfile; token: string; mustChangePassword?: boolean } | null> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is active, attempt Supabase Auth sign in
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data.user) {
          let profile = await this.getProfileById(data.user.id);
          if (!profile) {
            profile = await this.getProfileByEmail(cleanEmail);
          }
          if (profile) {
            const token = this.generateSessionToken(profile);
            return { user: profile, token };
          }
        }
      } catch (err) {
        // Fall back to resilient local credentials check
      }
    }

    // 2. Validate against salted scrypt hashed credentials
    const cred = this.credentials.get(cleanEmail);
    if (!cred) {
      return null;
    }

    const isValid = verifyPassword(password, cred.passwordHash, cred.salt);
    if (!isValid) {
      return null;
    }

    const profile = await this.getProfileByEmail(cleanEmail);
    if (!profile) {
      return null;
    }

    const token = this.generateSessionToken(profile);
    return {
      user: profile,
      token,
      mustChangePassword: cred.mustChangePassword,
    };
  }

  // --------------------------------------------------------------------------
  // USER PROFILES
  // --------------------------------------------------------------------------
  public async getProfileById(id: string): Promise<UserProfile | null> {
    const profile = this.profiles.get(id);
    return profile ? { ...profile } : null;
  }

  public async getProfileByEmail(email: string): Promise<UserProfile | null> {
    for (const profile of this.profiles.values()) {
      if (profile.email.toLowerCase() === email.toLowerCase()) {
        return { ...profile };
      }
    }
    return null;
  }

  public async getProfileByRegistrationNumber(regNum: string): Promise<UserProfile | null> {
    const clean = regNum.trim().toLowerCase();
    for (const profile of this.profiles.values()) {
      if (profile.registration_number && profile.registration_number.trim().toLowerCase() === clean) {
        return { ...profile };
      }
    }
    return null;
  }

  public async checkEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const clean = email.trim().toLowerCase();
    for (const profile of this.profiles.values()) {
      if (excludeUserId && profile.id === excludeUserId) continue;
      if (profile.email.toLowerCase() === clean) {
        return true;
      }
    }
    return false;
  }

  public async checkRegistrationNumberExists(regNum: string, excludeUserId?: string): Promise<boolean> {
    const clean = regNum.trim().toLowerCase();
    for (const profile of this.profiles.values()) {
      if (excludeUserId && profile.id === excludeUserId) continue;
      if (profile.registration_number && profile.registration_number.trim().toLowerCase() === clean) {
        return true;
      }
    }
    return false;
  }

  public async registerStudentProfile(data: {
    id?: string;
    email: string;
    full_name: string;
    registration_number: string;
    section: string;
    avatar_url?: string;
    password?: string;
  }): Promise<UserProfile> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanReg = data.registration_number.trim().toUpperCase();
    const cleanName = data.full_name.trim();
    const cleanSection = data.section.trim();

    // Check duplicate email
    if (await this.checkEmailExists(cleanEmail, data.id)) {
      throw new Error('DUPLICATE_EMAIL: An account with this email address already exists.');
    }

    // Check duplicate registration number
    if (await this.checkRegistrationNumberExists(cleanReg, data.id)) {
      throw new Error('DUPLICATE_REGISTRATION_NUMBER: An account with this college registration number already exists.');
    }

    // Securely hash and store credentials (never exposed in public profile data)
    if (data.password) {
      this.setCredentials(cleanEmail, data.password);
    }

    const id = data.id || `00000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const newProfile: UserProfile = {
      id,
      email: cleanEmail,
      full_name: cleanName,
      role: 'student', // Security requirement: Always lock signup to student role
      registration_number: cleanReg,
      section: cleanSection,
      avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles.set(id, newProfile);

    // Sync to Supabase if configured
    if (this.supabase) {
      try {
        await this.supabase.from('profiles').upsert({
          id,
          email: cleanEmail,
          full_name: cleanName,
          role: 'student',
          registration_number: cleanReg,
          section: cleanSection,
          avatar_url: newProfile.avatar_url,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[DatabaseStore] Supabase profile sync fallback:', err);
      }
    }

    return { ...newProfile };
  }

  public async listStudents(params: {
    search?: string;
    section?: string;
    sortBy?: 'name' | 'registration_number' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    students: UserProfile[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    sections: string[];
  }> {
    let studentList = Array.from(this.profiles.values()).filter(p => p.role === 'student');

    // Collect all available sections across students
    const sectionSet = new Set<string>();
    studentList.forEach(s => {
      if (s.section) sectionSet.add(s.section);
    });
    const sections = Array.from(sectionSet).sort();

    // 1. Search filter (Name, Email, Registration Number)
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      studentList = studentList.filter(
        s =>
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.registration_number && s.registration_number.toLowerCase().includes(q))
      );
    }

    // 2. Section filter
    if (params.section && params.section !== 'All' && params.section !== '') {
      studentList = studentList.filter(s => s.section === params.section);
    }

    // 3. Sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

    studentList.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder * a.full_name.localeCompare(b.full_name);
      }
      if (sortBy === 'registration_number') {
        const regA = a.registration_number || '';
        const regB = b.registration_number || '';
        return sortOrder * regA.localeCompare(regB);
      }
      // default: created_at
      return sortOrder * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    // 4. Pagination
    const total = studentList.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const total_pages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = studentList.slice(startIndex, startIndex + limit);

    return {
      students: paginated.map(s => ({ ...s })),
      total,
      page,
      limit,
      total_pages,
      sections,
    };
  }

  public async getStudentDetails(id: string): Promise<{
    student: UserProfile;
    registrations: RegistrationItem[];
    registration_count: number;
  } | null> {
    const student = this.profiles.get(id);
    if (!student || student.role !== 'student') return null;

    const registrations = await this.getUserRegistrations(id);
    return {
      student: { ...student },
      registrations,
      registration_count: registrations.length,
    };
  }

  public async updateStudentByAdmin(
    id: string,
    updates: { full_name?: string; section?: string; registration_number?: string }
  ): Promise<UserProfile> {
    const student = this.profiles.get(id);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND: Student record not found.');
    }

    // Check uniqueness if registration_number is modified
    if (updates.registration_number) {
      const cleanReg = updates.registration_number.trim().toUpperCase();
      const isDuplicate = await this.checkRegistrationNumberExists(cleanReg, id);
      if (isDuplicate) {
        throw new Error('DUPLICATE_REGISTRATION_NUMBER: Another student already uses this registration number.');
      }
      student.registration_number = cleanReg;
    }

    if (updates.full_name) {
      student.full_name = updates.full_name.trim();
    }

    if (updates.section) {
      student.section = updates.section.trim();
    }

    student.updated_at = new Date().toISOString();
    // Guarantee role is NEVER elevated through student management!
    student.role = 'student';

    this.profiles.set(id, student);

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').update({
          full_name: student.full_name,
          section: student.section,
          registration_number: student.registration_number,
          updated_at: student.updated_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase student update fallback:', err);
      }
    }

    return { ...student };
  }

  public async saveProfile(profileData: Partial<UserProfile> & { id: string; email: string; full_name: string }): Promise<UserProfile> {
    const existing = this.profiles.get(profileData.id);
    let resolvedRole = existing ? existing.role : (profileData.role || 'student');

    // Security: Ordinary users cannot assign themselves the admin role. Only designated Super Admin email can hold admin.
    if (resolvedRole === 'admin' && profileData.email.toLowerCase() !== 'admin@srmist.edu.in' && existing?.role !== 'admin') {
      console.warn(`[DatabaseStore] Blocked unauthorized attempt to assign admin role to non-Super Admin email: ${profileData.email}`);
      resolvedRole = 'student';
    }

    const updated: UserProfile = {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      role: resolvedRole,
      registration_number: profileData.registration_number || existing?.registration_number,
      section: profileData.section || existing?.section,
      avatar_url: profileData.avatar_url || existing?.avatar_url,
      created_at: existing ? existing.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(updated.id, updated);
    return { ...updated };
  }

  public async updateProfile(id: string, updates: { full_name?: string; avatar_url?: string; section?: string }): Promise<UserProfile | null> {
    const existing = this.profiles.get(id);
    if (!existing) return null;
    const updated: UserProfile = {
      ...existing,
      full_name: updates.full_name ?? existing.full_name,
      avatar_url: updates.avatar_url ?? existing.avatar_url,
      section: updates.section ?? existing.section,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(id, updated);
    return { ...updated };
  }

  public async listAllProfiles(): Promise<UserProfile[]> {
    return Array.from(this.profiles.values()).map(p => ({ ...p }));
  }

  // --------------------------------------------------------------------------
  // ORGANIZER MANAGEMENT (Super Admin Authorized)
  // --------------------------------------------------------------------------
  public async listOrganizers(): Promise<Array<UserProfile & { events_count: number; active_events_count: number; total_attendees: number }>> {
    const organizers = Array.from(this.profiles.values()).filter(p => p.role === 'organizer');
    return organizers.map(org => {
      const orgEvents = Array.from(this.events.values()).filter(e => e.organizer_id === org.id && !e.deleted_at);
      const activeEvents = orgEvents.filter(e => e.status === 'published');
      let totalAttendees = 0;
      for (const ev of orgEvents) {
        totalAttendees += this.getEventConfirmedCount(ev.id);
      }
      return {
        ...org,
        event_count: orgEvents.length,
        events_count: orgEvents.length,
        active_events_count: activeEvents.length,
        total_attendees: totalAttendees,
      };
    });
  }

  public async getOrganizerDetails(id: string): Promise<{
    organizer: UserProfile;
    events: EventItem[];
    stats: { total_events: number; active_events: number; total_attendees: number };
  } | null> {
    const organizer = this.profiles.get(id);
    if (!organizer || organizer.role !== 'organizer') return null;

    const events = Array.from(this.events.values()).filter(e => e.organizer_id === id && !e.deleted_at);
    let totalAttendees = 0;
    for (const ev of events) {
      totalAttendees += this.getEventConfirmedCount(ev.id);
    }

    return {
      organizer: { ...organizer },
      events: events.map(e => ({
        ...e,
        registered_count: this.getEventConfirmedCount(e.id),
      })),
      stats: {
        total_events: events.length,
        active_events: events.filter(e => e.status === 'published').length,
        total_attendees: totalAttendees,
      },
    };
  }

  public async updateOrganizerByAdmin(
    id: string,
    updates: { full_name?: string; section?: string; registration_number?: string; role?: UserRole }
  ): Promise<UserProfile> {
    const organizer = this.profiles.get(id);
    if (!organizer) {
      throw new Error('ORGANIZER_NOT_FOUND: Organizer record not found.');
    }

    if (updates.full_name) {
      organizer.full_name = updates.full_name.trim();
    }
    if (updates.section) {
      organizer.section = updates.section.trim();
    }
    if (updates.registration_number) {
      organizer.registration_number = updates.registration_number.trim().toUpperCase();
    }
    if (updates.role) {
      if (updates.role === 'admin' && organizer.email.toLowerCase() !== 'admin@srmist.edu.in') {
        throw new Error('FORBIDDEN_ROLE: Only the designated Super Admin account (admin@srmist.edu.in) can hold the admin role.');
      }
      organizer.role = updates.role;
    }

    organizer.updated_at = new Date().toISOString();
    this.profiles.set(id, organizer);

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').update({
          full_name: organizer.full_name,
          section: organizer.section,
          registration_number: organizer.registration_number,
          role: organizer.role,
          updated_at: organizer.updated_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase organizer update fallback:', err);
      }
    }

    return { ...organizer };
  }

  public async getEventAttendees(eventId: string): Promise<Array<RegistrationItem & { student: UserProfile }>> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND: Event not found.');
    }

    const attendees: Array<RegistrationItem & { student: UserProfile }> = [];
    for (const reg of this.registrations.values()) {
      if (reg.event_id === eventId) {
        const student = this.profiles.get(reg.user_id);
        if (student) {
          attendees.push({
            ...reg,
            student: { ...student },
          });
        }
      }
    }

    attendees.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
    return attendees;
  }

  // --------------------------------------------------------------------------
  // DESIGNATED SUPER ADMIN INTEGRITY
  // --------------------------------------------------------------------------
  public async provisionOrganizer(params: {
    email: string;
    fullName: string;
    organization: string;
    temporaryPassword?: string;
  }): Promise<{ organizer: UserProfile; temporaryPassword?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    let tempPass = params.temporaryPassword;
    let isGenerated = false;

    if (!tempPass) {
      tempPass = `Org!${crypto.randomBytes(8).toString('hex')}#2026`;
      isGenerated = true;
    }

    let existing = await this.getProfileByEmail(cleanEmail);
    if (existing) {
      existing.full_name = params.fullName.trim();
      existing.role = 'organizer';
      existing.section = params.organization.trim();
      existing.updated_at = new Date().toISOString();
      this.profiles.set(existing.id, existing);
    } else {
      const id = `00000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
      existing = {
        id,
        email: cleanEmail,
        full_name: params.fullName.trim(),
        role: 'organizer',
        registration_number: `ORG-${Date.now().toString(16).slice(-4).toUpperCase()}`,
        section: params.organization.trim(),
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.profiles.set(id, existing);
    }

    this.setCredentials(cleanEmail, tempPass, isGenerated);
    return { organizer: existing, temporaryPassword: tempPass };
  }

  public async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const profile = await this.getProfileByEmail(cleanEmail);
    if (!profile) return false;
    this.setCredentials(cleanEmail, newPassword, false);
    return true;
  }

  public async ensureDesignatedSuperAdmin(): Promise<{
    superAdmin: UserProfile;
    conflicts: Array<{ id: string; email: string; full_name: string }>;
  }> {
    const targetEmail = 'admin@srmist.edu.in';
    const targetName = 'SRMIST';

    // Check existing administrator accounts
    const existingAdmins = Array.from(this.profiles.values()).filter(p => p.role === 'admin');
    const conflicts: Array<{ id: string; email: string; full_name: string }> = [];

    for (const admin of existingAdmins) {
      if (admin.email.toLowerCase() !== targetEmail.toLowerCase()) {
        conflicts.push({
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
        });
      }
    }

    // Locate or configure the designated Super Admin
    let superAdmin = Array.from(this.profiles.values()).find(
      p => p.email.toLowerCase() === targetEmail.toLowerCase()
    );

    const nowIso = new Date().toISOString();

    if (!superAdmin) {
      const placeholder = this.profiles.get('00000000-0000-0000-0000-000000000001');
      if (placeholder) {
        placeholder.full_name = targetName;
        placeholder.email = targetEmail;
        placeholder.role = 'admin';
        placeholder.registration_number = 'ADM-SRMIST-001';
        placeholder.section = 'Administration';
        placeholder.updated_at = nowIso;
        this.profiles.set(placeholder.id, placeholder);
        superAdmin = placeholder;
      } else {
        const id = '00000000-0000-0000-0000-000000000001';
        superAdmin = {
          id,
          full_name: targetName,
          email: targetEmail,
          role: 'admin',
          registration_number: 'ADM-SRMIST-001',
          section: 'Administration',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          created_at: nowIso,
          updated_at: nowIso,
        };
        this.profiles.set(id, superAdmin);
      }
    } else {
      superAdmin.full_name = targetName;
      superAdmin.role = 'admin';
      this.profiles.set(superAdmin.id, superAdmin);
    }

    return {
      superAdmin: { ...superAdmin },
      conflicts,
    };
  }

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------
  public async getEventById(id: string, userId?: string): Promise<EventItem | null> {
    const event = this.events.get(id);
    if (!event) return null;

    // Soft-deleted events are hidden from public and non-owner students
    if (event.deleted_at) {
      if (!userId) return null;
      const user = this.profiles.get(userId);
      const isOwner = event.organizer_id === userId;
      const isAdmin = user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        return null;
      }
    }

    const registered_count = this.getEventConfirmedCount(id);
    const remaining_capacity = Math.max(0, event.capacity - registered_count);
    const is_full = remaining_capacity <= 0;
    const is_registered_by_user = userId ? this.isUserRegisteredForEvent(userId, id) : false;

    return {
      ...event,
      registered_count,
      remaining_capacity,
      is_full,
      is_registered_by_user,
    };
  }

  public async getEventBySlug(slug: string, userId?: string): Promise<EventItem | null> {
    for (const event of this.events.values()) {
      if (event.slug === slug) {
        return this.getEventById(event.id, userId);
      }
    }
    return null;
  }

  public async listEvents(options: {
    search?: string;
    category?: string;
    status?: string;
    organizerId?: string;
    timeFilter?: 'upcoming' | 'past' | 'all';
    sortBy?: 'date_asc' | 'date_desc' | 'created_desc';
    page?: number;
    limit?: number;
    userId?: string;
    includeDeleted?: boolean;
  }): Promise<{ events: EventItem[]; total: number; page: number; limit: number; total_pages: number }> {
    let list = Array.from(this.events.values());

    // Filter soft-deleted events unless explicitly requested by authorized admin audit
    if (!options.includeDeleted) {
      list = list.filter(e => !e.deleted_at);
    }

    // Status filter
    if (options.status) {
      if (options.status === 'active') {
        list = list.filter(e => e.status === 'published' || e.status === 'draft');
      } else if (options.status === 'cancelled') {
        list = list.filter(e => e.status === 'cancelled');
      } else if (options.status === 'completed') {
        list = list.filter(e => e.status === 'completed');
      } else if (options.status !== 'all') {
        list = list.filter(e => e.status === options.status);
      }
    } else if (!options.organizerId) {
      // Public default: only published events
      list = list.filter(e => e.status === 'published');
    }

    // Category filter
    if (options.category && options.category !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === options.category!.toLowerCase());
    }

    // Organizer filter
    if (options.organizerId) {
      list = list.filter(e => e.organizer_id === options.organizerId);
    }

    // Search query filter
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }

    // Time filter
    const nowIso = new Date().toISOString();
    if (options.timeFilter === 'upcoming') {
      list = list.filter(e => e.end_time >= nowIso);
    } else if (options.timeFilter === 'past') {
      list = list.filter(e => e.end_time < nowIso);
    }

    // Sorting
    const sortBy = options.sortBy || 'date_asc';
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      if (sortBy === 'date_desc') return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    const total = list.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 12));
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    const enriched = paginated.map(event => {
      const registered_count = this.getEventConfirmedCount(event.id);
      const remaining_capacity = Math.max(0, event.capacity - registered_count);
      return {
        ...event,
        registered_count,
        remaining_capacity,
        is_full: remaining_capacity <= 0,
        is_registered_by_user: options.userId ? this.isUserRegisteredForEvent(options.userId, event.id) : false,
      };
    });

    return {
      events: enriched,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  public async getApprovedOrganizations(): Promise<ApprovedOrganization[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('approved_organizations')
          .select('*')
          .eq('active', true);
        if (!error && data && data.length > 0) {
          return data as ApprovedOrganization[];
        }
      } catch (err) {
        console.warn('[DatabaseStore] Supabase approved_organizations query fallback:', err);
      }
    }
    return APPROVED_ORGANIZATIONS;
  }

  public async createEvent(eventData: Omit<EventItem, 'id' | 'created_at' | 'updated_at'>): Promise<EventItem> {
    const id = crypto.randomUUID();
    const slug = eventData.slug || this.generateSlug(eventData.title);
    
    // Check slug collision
    let finalSlug = slug;
    let counter = 1;
    while (Array.from(this.events.values()).some(e => e.slug === finalSlug)) {
      finalSlug = `${slug}-${counter++}`;
    }

    const orgName = eventData.organization || eventData.organizer_name || 'SRMIST';
    const orgId = eventData.organization_id || 
      (APPROVED_ORGANIZATIONS.find(o => o.name.toLowerCase() === orgName.toLowerCase())?.id || 'srmist');

    const newEvent: EventItem = {
      ...eventData,
      id,
      slug: finalSlug,
      organizer_name: orgName,
      organization: orgName,
      organization_id: orgId,
      event_type: eventData.event_type || 'workshop',
      instructions: eventData.instructions || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.events.set(newEvent.id, newEvent);

    if (this.supabase) {
      try {
        await this.supabase.from('events').insert({
          id: newEvent.id,
          organizer_id: newEvent.organizer_id,
          organizer_name: newEvent.organizer_name,
          title: newEvent.title,
          slug: newEvent.slug,
          description: newEvent.description,
          category: newEvent.category,
          event_type: newEvent.event_type,
          organization: newEvent.organization,
          organization_id: newEvent.organization_id,
          banner_url: newEvent.banner_url,
          venue: newEvent.venue,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          registration_deadline: newEvent.registration_deadline,
          capacity: newEvent.capacity,
          status: newEvent.status,
          instructions: newEvent.instructions,
          created_at: newEvent.created_at,
          updated_at: newEvent.updated_at,
        });
      } catch (err) {
        console.warn('[DatabaseStore] Supabase event insert fallback:', err);
      }
    }

    return {
      ...newEvent,
      registered_count: 0,
      remaining_capacity: newEvent.capacity,
      is_full: false,
      is_registered_by_user: false,
    };
  }

  public async updateEvent(id: string, updates: Partial<EventItem>): Promise<EventItem | null> {
    const existing = this.events.get(id);
    if (!existing || existing.deleted_at) return null;

    const orgName = updates.organization || updates.organizer_name || existing.organization;
    const orgId = updates.organization_id || existing.organization_id || 
      (APPROVED_ORGANIZATIONS.find(o => o.name.toLowerCase() === (orgName || '').toLowerCase())?.id || 'srmist');

    const updated: EventItem = {
      ...existing,
      ...updates,
      id: existing.id,
      organizer_id: existing.organizer_id,
      organizer_name: orgName || existing.organizer_name,
      organization: orgName,
      organization_id: orgId,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    this.events.set(id, updated);

    if (this.supabase) {
      try {
        await this.supabase.from('events').update({
          title: updated.title,
          description: updated.description,
          category: updated.category,
          event_type: updated.event_type,
          organization: updated.organization,
          organization_id: updated.organization_id,
          organizer_name: updated.organizer_name,
          banner_url: updated.banner_url,
          venue: updated.venue,
          start_time: updated.start_time,
          end_time: updated.end_time,
          registration_deadline: updated.registration_deadline,
          capacity: updated.capacity,
          status: updated.status,
          instructions: updated.instructions,
          updated_at: updated.updated_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase event update fallback:', err);
      }
    }

    return this.getEventById(id);
  }

  public async cancelEvent(
    id: string,
    userId: string,
    userRole: string,
    reason?: string
  ): Promise<EventItem> {
    const existing = this.events.get(id);
    if (!existing || existing.deleted_at) {
      throw new Error('EVENT_NOT_FOUND: The requested event does not exist or has been deleted.');
    }

    if (userRole !== 'admin' && existing.organizer_id !== userId) {
      throw new Error('FORBIDDEN: You are not authorized to cancel events owned by other organizers.');
    }

    const nowIso = new Date().toISOString();
    const finalReason = reason?.trim() || (userRole === 'admin' ? 'Cancelled by Campus Administration.' : 'Cancelled by event organizer.');

    const updated: EventItem = {
      ...existing,
      status: 'cancelled',
      cancelled_at: nowIso,
      cancelled_by: userId,
      cancellation_reason: finalReason,
      updated_at: nowIso,
    };

    this.events.set(id, updated);

    // If cancelled by an administrator and the organizer is someone else, dispatch in-app notification
    if (userRole === 'admin' && existing.organizer_id !== userId) {
      await this.addNotification({
        user_id: existing.organizer_id,
        title: `Event Cancelled: ${existing.title}`,
        message: `Your event was cancelled by Campus Administration. Reason: ${finalReason}`,
        type: 'event_cancelled',
        event_id: existing.id,
      });
    }

    if (this.supabase) {
      try {
        await this.supabase.from('events').update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancelled_by: userId,
          cancellation_reason: finalReason,
          updated_at: nowIso,
        }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase cancelEvent fallback:', err);
      }
    }

    const result = await this.getEventById(id, userId);
    return result || updated;
  }

  public async deleteEventSafe(id: string, userId: string, userRole: string): Promise<boolean> {
    const existing = this.events.get(id);
    if (!existing || existing.deleted_at) {
      throw new Error('EVENT_NOT_FOUND: The requested event does not exist or has already been deleted.');
    }

    if (userRole !== 'admin' && existing.organizer_id !== userId) {
      throw new Error('FORBIDDEN: You are not authorized to delete events owned by other organizers.');
    }

    const nowIso = new Date().toISOString();
    // Soft deletion: Preserve student registrations, ticket verification, and attendance audit records
    existing.deleted_at = nowIso;
    existing.updated_at = nowIso;
    this.events.set(id, existing);

    if (this.supabase) {
      try {
        await this.supabase.from('events').update({
          deleted_at: nowIso,
          updated_at: nowIso,
        }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase deleteEventSafe fallback:', err);
      }
    }

    return true;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    const exists = this.events.has(id);
    if (exists) {
      const ev = this.events.get(id)!;
      ev.deleted_at = new Date().toISOString();
      this.events.set(id, ev);
    }
    return exists;
  }

  public async duplicateEvent(eventId: string, organizerId: string, role: string): Promise<EventItem> {
    const original = this.events.get(eventId);
    if (!original || original.deleted_at) {
      throw new Error('EVENT_NOT_FOUND: Event not found or already deleted.');
    }
    if (role !== 'admin' && original.organizer_id !== organizerId) {
      throw new Error('FORBIDDEN: You can only duplicate events that you organize.');
    }

    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${uniqueSuffix}`;
    
    // Shift dates forward by +7 days
    const shiftMs = 7 * 86400000;
    const newStartTime = new Date(new Date(original.start_time).getTime() + shiftMs).toISOString();
    const newEndTime = new Date(new Date(original.end_time).getTime() + shiftMs).toISOString();
    const newDeadline = new Date(new Date(original.registration_deadline).getTime() + shiftMs).toISOString();

    const newEvent: EventItem = {
      ...original,
      id: crypto.randomUUID ? crypto.randomUUID() : `copy-${Date.now()}-${uniqueSuffix}`,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      start_time: newStartTime,
      end_time: newEndTime,
      registration_deadline: newDeadline,
      registered_count: 0,
      remaining_capacity: original.capacity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: undefined,
      cancelled_at: undefined,
      cancelled_by: undefined,
      cancellation_reason: undefined,
    };

    this.events.set(newEvent.id, newEvent);

    if (this.supabase) {
      try {
        await this.supabase.from('events').insert({
          id: newEvent.id,
          organizer_id: newEvent.organizer_id,
          organizer_name: newEvent.organizer_name,
          title: newEvent.title,
          slug: newEvent.slug,
          description: newEvent.description,
          category: newEvent.category,
          event_type: newEvent.event_type || 'other',
          organization: newEvent.organization || 'SRMIST',
          organization_id: newEvent.organization_id || 'srmist',
          banner_url: newEvent.banner_url,
          venue: newEvent.venue,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          registration_deadline: newEvent.registration_deadline,
          capacity: newEvent.capacity,
          status: 'draft',
          instructions: newEvent.instructions,
          created_at: newEvent.created_at,
          updated_at: newEvent.updated_at,
        });
      } catch (err) {
        console.warn('[DatabaseStore] Supabase duplicateEvent sync fallback:', err);
      }
    }

    return newEvent;
  }

  public async createEventAnnouncement(
    eventId: string,
    organizerId: string,
    role: string,
    title: string,
    message: string
  ): Promise<{ sent_to: number; event_title: string }> {
    const event = this.events.get(eventId);
    if (!event || event.deleted_at) {
      throw new Error('EVENT_NOT_FOUND: Event not found.');
    }
    if (role !== 'admin' && event.organizer_id !== organizerId) {
      throw new Error('FORBIDDEN: You can only broadcast announcements for events you organize.');
    }

    const eventRegs = Array.from(this.registrations.values())
      .filter(r => r.event_id === eventId && r.registration_status === 'confirmed');

    const nowIso = new Date().toISOString();
    let sentCount = 0;

    for (const reg of eventRegs) {
      const notifId = crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const notif: NotificationItem = {
        id: notifId,
        user_id: reg.user_id,
        title: `[${event.title}] ${title}`,
        message,
        type: 'event_announcement',
        read: false,
        event_id: event.id,
        created_at: nowIso,
      };
      this.notifications.set(notif.id, notif);
      if (this.supabase) {
        try {
          await this.supabase.from('notifications').insert(notif);
        } catch (err) {
          console.warn('[DatabaseStore] Supabase announcement notification fallback:', err);
        }
      }
      sentCount++;
    }

    return { sent_to: sentCount, event_title: event.title };
  }

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------
  public async addNotification(notifData: {
    user_id: string;
    title: string;
    message: string;
    type?: NotificationItem['type'];
    event_id?: string;
  }): Promise<NotificationItem> {
    const id = crypto.randomUUID();
    const newNotif: NotificationItem = {
      id,
      user_id: notifData.user_id,
      title: notifData.title,
      message: notifData.message,
      type: notifData.type || 'info',
      read: false,
      event_id: notifData.event_id,
      created_at: new Date().toISOString(),
    };
    this.notifications.set(id, newNotif);

    if (this.supabase) {
      try {
        await this.supabase.from('notifications').insert(newNotif);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase notification insert fallback:', err);
      }
    }

    return { ...newNotif };
  }

  public async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const notif = this.notifications.get(id);
    if (!notif || notif.user_id !== userId) return false;
    notif.read = true;
    this.notifications.set(id, notif);
    if (this.supabase) {
      try {
        await this.supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase notification update fallback:', err);
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // CONCURRENCY-SAFE ATOMIC REGISTRATION
  // --------------------------------------------------------------------------
  public async registerForEventAtomic(
    eventId: string,
    userId: string
  ): Promise<{ registration: RegistrationItem; remaining_capacity: number }> {
    // Acquire mutex promise to ensure sequential atomic execution
    return new Promise((resolve, reject) => {
      this.registrationMutex = this.registrationMutex.then(async () => {
        try {
          const event = this.events.get(eventId);
          if (!event || event.deleted_at) {
            throw new Error('EVENT_NOT_FOUND: The requested event does not exist.');
          }

          if (event.status === 'cancelled') {
            throw new Error('EVENT_CANCELLED: Registrations are closed because this event has been cancelled.');
          }

          if (event.status !== 'published') {
            throw new Error(`EVENT_NOT_ACTIVE: Registrations are only allowed for published events. Current status: ${event.status}`);
          }

          const now = new Date();
          const deadline = new Date(event.registration_deadline);
          if (now > deadline) {
            throw new Error('DEADLINE_PASSED: The registration deadline for this event has passed.');
          }

          const startTime = new Date(event.start_time);
          if (now > startTime) {
            throw new Error('EVENT_ALREADY_STARTED: The event has already commenced.');
          }

          // Check for existing confirmed registration
          for (const reg of this.registrations.values()) {
            if (reg.event_id === eventId && reg.user_id === userId && reg.registration_status === 'confirmed') {
              throw new Error('DUPLICATE_REGISTRATION: You already hold an active confirmed registration for this event.');
            }
          }

          // Check capacity limit
          const currentConfirmedCount = this.getEventConfirmedCount(eventId);
          if (currentConfirmedCount >= event.capacity) {
            throw new Error(`CAPACITY_EXCEEDED: This event is completely full (Capacity: ${event.capacity}, Registered: ${currentConfirmedCount}).`);
          }

          // Generate unique ticket code
          const prefix = event.category.substring(0, 4).toUpperCase();
          const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
          const ticket_code = `CC-${prefix}-${randomHex}`;

          const regId = crypto.randomUUID();
          const newRegistration: RegistrationItem = {
            id: regId,
            user_id: userId,
            event_id: eventId,
            registration_status: 'confirmed',
            ticket_code,
            registered_at: new Date().toISOString(),
            attendance_status: 'unmarked',
          };

          this.registrations.set(regId, newRegistration);
          const remaining = event.capacity - (currentConfirmedCount + 1);

          resolve({
            registration: {
              ...newRegistration,
              event: { ...event },
            },
            remaining_capacity: remaining,
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public async cancelRegistration(registrationId: string, userId: string): Promise<RegistrationItem | null> {
    const reg = this.registrations.get(registrationId);
    if (!reg) return null;

    if (reg.user_id !== userId) {
      throw new Error('UNAUTHORIZED_CANCELLATION: You can only cancel your own registrations.');
    }

    if (reg.registration_status === 'cancelled') {
      return reg;
    }

    const updated: RegistrationItem = {
      ...reg,
      registration_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    };

    this.registrations.set(registrationId, updated);
    return {
      ...updated,
      event: this.events.get(updated.event_id),
    };
  }

  public async getUserRegistrations(userId: string): Promise<RegistrationItem[]> {
    const results: RegistrationItem[] = [];
    for (const reg of this.registrations.values()) {
      if (reg.user_id === userId) {
        const event = this.events.get(reg.event_id);
        results.push({
          ...reg,
          event: event ? { ...event } : undefined,
        });
      }
    }
    // Sort descending by registered_at
    return results.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
  }

  public async getEventRegistrations(eventId: string): Promise<RegistrationItem[]> {
    const results: RegistrationItem[] = [];
    for (const reg of this.registrations.values()) {
      if (reg.event_id === eventId) {
        const user = this.profiles.get(reg.user_id);
        results.push({
          ...reg,
          user: user ? { ...user } : undefined,
        });
      }
    }
    return results.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
  }

  public async markAttendance(registrationId: string, attendanceStatus: 'attended' | 'absent'): Promise<RegistrationItem | null> {
    const reg = this.registrations.get(registrationId);
    if (!reg) return null;

    const updated: RegistrationItem = {
      ...reg,
      attendance_status: attendanceStatus,
      attended_at: attendanceStatus === 'attended' ? new Date().toISOString() : undefined,
    };

    this.registrations.set(registrationId, updated);
    return { ...updated };
  }

  public async verifyTicket(ticketCode: string): Promise<{ valid: boolean; registration?: RegistrationItem; error?: string }> {
    for (const reg of this.registrations.values()) {
      if (reg.ticket_code === ticketCode) {
        const event = this.events.get(reg.event_id);
        const user = this.profiles.get(reg.user_id);
        return {
          valid: reg.registration_status === 'confirmed',
          registration: {
            ...reg,
            event: event ? { ...event } : undefined,
            user: user ? { ...user } : undefined,
          },
          error: reg.registration_status === 'confirmed' ? undefined : 'TICKET_CANCELLED: This registration has been cancelled.',
        };
      }
    }
    return { valid: false, error: 'TICKET_NOT_FOUND: Invalid or unrecognized ticket code.' };
  }

  // --------------------------------------------------------------------------
  // METRICS & AGGREGATIONS
  // --------------------------------------------------------------------------
  public async getOrganizerOverview(organizerId: string): Promise<OrganizerOverview> {
    const organizerEvents = Array.from(this.events.values()).filter(e => e.organizer_id === organizerId && !e.deleted_at);
    const nowIso = new Date().toISOString();
    const upcomingEvents = organizerEvents.filter(e => e.end_time >= nowIso && e.status === 'published');
    const published_events = organizerEvents.filter(e => e.status === 'published').length;
    const draft_events = organizerEvents.filter(e => e.status === 'draft').length;
    const completed_events = organizerEvents.filter(e => e.status === 'completed' || (e.end_time < nowIso && e.status === 'published')).length;
    const cancelled_events = organizerEvents.filter(e => e.status === 'cancelled').length;
    
    const eventIds = new Set(organizerEvents.map(e => e.id));
    const allRegs = Array.from(this.registrations.values()).filter(r => eventIds.has(r.event_id));
    const confirmedRegs = allRegs.filter(r => r.registration_status === 'confirmed');
    const attendedRegs = allRegs.filter(r => r.attendance_status === 'attended');

    const total_capacity = organizerEvents.reduce((acc, e) => acc + e.capacity, 0);
    const attended_count = attendedRegs.length;
    const overall_attendance_rate = confirmedRegs.length > 0 ? Math.round((attendedRegs.length / confirmedRegs.length) * 100) : 0;

    // Remaining capacity strictly on published active events calculated from actual confirmed registrations
    const total_remaining_seats = organizerEvents
      .filter(e => e.status === 'published' && e.end_time >= nowIso)
      .reduce((acc, e) => {
        const count = confirmedRegs.filter(r => r.event_id === e.id).length;
        return acc + Math.max(0, e.capacity - count);
      }, 0);

    const recent_registrations = confirmedRegs
      .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
      .slice(0, 5)
      .map(r => ({
        ...r,
        event: this.events.get(r.event_id),
        user: this.profiles.get(r.user_id),
      }));

    const recent_events = organizerEvents
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5)
      .map(e => ({
        ...e,
        registered_count: confirmedRegs.filter(r => r.event_id === e.id).length,
      }));

    // Daily registration trends over the last 7 days calculated strictly from active registrations
    const registration_trends: { date: string; label: string; count: number }[] = [];
    const DAY_MS = 86400000;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayMidnight.getTime() - i * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const dateKey = dayStart.toISOString().slice(0, 10);
      const label = dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayCount = confirmedRegs.filter(r => {
        const t = new Date(r.registered_at).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      }).length;

      registration_trends.push({
        date: dateKey,
        label,
        count: dayCount,
      });
    }

    // Category distribution across all hosted events
    const category_distribution: Record<string, number> = {};
    organizerEvents.forEach(e => {
      category_distribution[e.category] = (category_distribution[e.category] || 0) + 1;
    });

    return {
      total_events: organizerEvents.length,
      published_events,
      upcoming_events: upcomingEvents.length,
      draft_events,
      completed_events,
      cancelled_events,
      total_registrations: confirmedRegs.length,
      total_capacity,
      total_remaining_seats,
      overall_attendance_rate,
      attended_count,
      recent_registrations,
      recent_events,
      registration_trends,
      category_distribution,
    };
  }

  public async getAdminOverview(): Promise<{
    total_users: number;
    total_events: number;
    total_registrations: number;
    active_events: number;
    category_distribution: Record<string, number>;
    users_by_role: Record<string, number>;
    pending_applications_count: number;
    total_applications_count: number;
  }> {
    const users = Array.from(this.profiles.values());
    const events = Array.from(this.events.values()).filter(e => !e.deleted_at);
    const confirmedRegs = Array.from(this.registrations.values()).filter(r => r.registration_status === 'confirmed');

    const category_distribution: Record<string, number> = {};
    events.forEach(e => {
      category_distribution[e.category] = (category_distribution[e.category] || 0) + 1;
    });

    const users_by_role: Record<string, number> = {};
    users.forEach(u => {
      users_by_role[u.role] = (users_by_role[u.role] || 0) + 1;
    });

    const pending_applications_count = Array.from(this.applications.values()).filter(a => a.status === 'pending').length;
    const total_applications_count = this.applications.size;

    return {
      total_users: users.length,
      total_events: events.length,
      total_registrations: confirmedRegs.length,
      active_events: events.filter(e => e.status === 'published' && e.end_time >= new Date().toISOString()).length,
      category_distribution,
      users_by_role,
      pending_applications_count,
      total_applications_count,
    };
  }

  // --------------------------------------------------------------------------
  // ORGANIZER APPLICATIONS WORKFLOW (SUPER ADMIN RBAC)
  // --------------------------------------------------------------------------
  public async submitOrganizerApplication(data: {
    user_id?: string;
    full_name: string;
    email: string;
    employee_id: string;
    club_name: string;
    position: string;
    reason: string;
    password?: string;
  }): Promise<{ application: OrganizerApplication; user: UserProfile; token: string }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanEmpId = data.employee_id.trim();

    // Check duplicate applications (pending with same email or employee ID)
    for (const app of this.applications.values()) {
      if (app.status === 'pending') {
        if (app.email.toLowerCase() === cleanEmail) {
          throw new Error('DUPLICATE_APPLICATION: An organizer application with this email is already pending admin review.');
        }
        if (app.employee_id.toLowerCase() === cleanEmpId.toLowerCase()) {
          throw new Error('DUPLICATE_APPLICATION: An organizer application with this employee/registration ID is already pending admin review.');
        }
      }
    }

    // Check existing profile
    let user = await this.getProfileByEmail(cleanEmail);
    if (user && user.role === 'organizer' && user.approval_status === 'approved') {
      throw new Error('ALREADY_APPROVED: This account is already an approved organizer.');
    }
    if (user && user.role === 'admin') {
      throw new Error('INVALID_ACCOUNT: Administrator accounts cannot submit organizer applications.');
    }

    const nowIso = new Date().toISOString();

    if (!user) {
      if (!data.password) {
        throw new Error('PASSWORD_REQUIRED: Password is required for new organizer registrations.');
      }
      const userId = data.user_id || crypto.randomUUID();
      user = {
        id: userId,
        email: cleanEmail,
        full_name: data.full_name.trim(),
        role: 'student', // Retains student privileges until explicitly approved by Super Admin
        registration_number: cleanEmpId,
        section: data.club_name.trim(),
        approval_status: 'pending',
        club_name: data.club_name.trim(),
        position: data.position.trim(),
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.profiles.set(user.id, user);
      this.setCredentials(cleanEmail, data.password);
    } else {
      // Existing user applying for organizer role
      user = {
        ...user,
        full_name: data.full_name.trim(),
        registration_number: cleanEmpId,
        approval_status: 'pending',
        club_name: data.club_name.trim(),
        position: data.position.trim(),
        updated_at: nowIso,
      };
      this.profiles.set(user.id, user);
      if (data.password) {
        this.setCredentials(cleanEmail, data.password);
      }
    }

    const appId = crypto.randomUUID();
    const application: OrganizerApplication = {
      id: appId,
      user_id: user.id,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      employee_id: cleanEmpId,
      club_name: data.club_name.trim(),
      position: data.position.trim(),
      reason: data.reason.trim(),
      status: 'pending',
      submitted_at: nowIso,
    };

    this.applications.set(appId, application);
    this.saveDiskCache();

    // Notify Super Admin (admin@srmist.edu.in)
    const adminUser = Array.from(this.profiles.values()).find(p => p.role === 'admin' && p.email.toLowerCase() === 'admin@srmist.edu.in');
    if (adminUser) {
      await this.addNotification({
        user_id: adminUser.id,
        title: 'New Organizer Application',
        message: `${data.full_name} (${data.club_name} - ${data.position}) submitted an organizer application.`,
        type: 'organizer_application',
      });
    }

    // Sync to Supabase if connected
    if (this.supabase) {
      try {
        await this.supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          registration_number: user.registration_number,
          section: user.section,
          approval_status: user.approval_status,
          club_name: user.club_name,
          position: user.position,
          updated_at: user.updated_at,
        });

        await this.supabase.from('organizer_applications').insert({
          id: application.id,
          user_id: application.user_id,
          full_name: application.full_name,
          email: application.email,
          employee_id: application.employee_id,
          club_name: application.club_name,
          position: application.position,
          reason: application.reason,
          status: application.status,
          submitted_at: application.submitted_at,
        });
      } catch (err) {
        console.warn('[DatabaseStore] Supabase organizer application insert fallback:', err);
      }
    }

    const token = this.generateSessionToken(user);
    return { application, user, token };
  }

  public async listOrganizerApplications(statusFilter?: string): Promise<OrganizerApplication[]> {
    if (this.supabase) {
      try {
        let query = this.supabase.from('organizer_applications').select('*').order('submitted_at', { ascending: false });
        if (statusFilter && statusFilter.toLowerCase() !== 'all') {
          query = query.ilike('status', statusFilter.toLowerCase());
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach((app: OrganizerApplication) => this.applications.set(app.id, app));
          return data;
        }
      } catch (err) {
        console.warn('[DatabaseStore] Supabase listOrganizerApplications fallback:', err);
      }
    }

    const apps = Array.from(this.applications.values());
    const filtered = (statusFilter && statusFilter.toLowerCase() !== 'all')
      ? apps.filter(a => a.status.toLowerCase() === statusFilter.toLowerCase())
      : apps;
    return filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }


  public async getOrganizerApplicationById(id: string): Promise<OrganizerApplication | null> {
    const local = this.applications.get(id);
    if (local) return { ...local };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('organizer_applications').select('*').eq('id', id).single();
        if (!error && data) {
          this.applications.set(data.id, data);
          return data;
        }
      } catch (err) {
        console.warn('[DatabaseStore] Supabase getOrganizerApplicationById fallback:', err);
      }
    }
    return null;
  }

  public async getOrganizerApplicationByUserId(userId: string): Promise<OrganizerApplication | null> {
    for (const app of this.applications.values()) {
      if (app.user_id === userId) {
        return { ...app };
      }
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('organizer_applications')
          .select('*')
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          this.applications.set(data.id, data);
          return data;
        }
      } catch (err) {
        console.warn('[DatabaseStore] Supabase getOrganizerApplicationByUserId fallback:', err);
      }
    }
    return null;
  }

  public async approveOrganizerApplication(
    applicationId: string,
    reviewedByAdminEmail: string
  ): Promise<{ application: OrganizerApplication; user: UserProfile }> {
    const cleanAdmin = reviewedByAdminEmail.trim().toLowerCase();
    if (cleanAdmin !== 'admin@srmist.edu.in') {
      throw new Error('FORBIDDEN_SUPER_ADMIN_REQUIRED: Only the designated Super Admin (admin@srmist.edu.in) can approve organizer applications.');
    }

    let app = this.applications.get(applicationId);
    if (!app) {
      app = (await this.getOrganizerApplicationById(applicationId)) || undefined;
    }
    if (!app) {
      throw new Error('APPLICATION_NOT_FOUND: The organizer application does not exist.');
    }

    if (app.email.toLowerCase() === cleanAdmin) {
      throw new Error('CANNOT_APPROVE_SELF: Administrators cannot approve their own organizer applications.');
    }

    const nowIso = new Date().toISOString();
    app.status = 'approved';
    app.reviewed_at = nowIso;
    app.reviewed_by = cleanAdmin;
    this.applications.set(applicationId, app);

    const user = this.profiles.get(app.user_id);
    if (!user) {
      throw new Error('USER_NOT_FOUND: Applicant profile not found.');
    }

    user.role = 'organizer';
    user.approval_status = 'approved';
    user.club_name = app.club_name;
    user.position = app.position;
    user.updated_at = nowIso;
    this.profiles.set(user.id, user);
    this.saveDiskCache();

    // Notify applicant
    await this.addNotification({
      user_id: user.id,
      title: 'Organizer Application Approved',
      message: `Congratulations! Your organizer application for ${app.club_name} (${app.position}) has been approved by ${cleanAdmin}. You can now create and manage events.`,
      type: 'info',
    });

    if (this.supabase) {
      try {
        await this.supabase.from('organizer_applications').update({
          status: 'approved',
          reviewed_at: nowIso,
          reviewed_by: cleanAdmin,
        }).eq('id', applicationId);

        await this.supabase.from('profiles').update({
          role: 'organizer',
          approval_status: 'approved',
          club_name: user.club_name,
          position: user.position,
          updated_at: nowIso,
        }).eq('id', user.id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase approveOrganizerApplication fallback:', err);
      }
    }

    return { application: { ...app }, user: { ...user } };
  }

  public async rejectOrganizerApplication(
    applicationId: string,
    reviewedByAdminEmail: string,
    rejectionReason?: string
  ): Promise<{ application: OrganizerApplication; user: UserProfile }> {
    const cleanAdmin = reviewedByAdminEmail.trim().toLowerCase();
    if (cleanAdmin !== 'admin@srmist.edu.in') {
      throw new Error('FORBIDDEN_SUPER_ADMIN_REQUIRED: Only the designated Super Admin (admin@srmist.edu.in) can reject organizer applications.');
    }

    let app = this.applications.get(applicationId);
    if (!app) {
      app = (await this.getOrganizerApplicationById(applicationId)) || undefined;
    }
    if (!app) {
      throw new Error('APPLICATION_NOT_FOUND: The organizer application does not exist.');
    }

    if (app.email.toLowerCase() === cleanAdmin) {
      throw new Error('CANNOT_REJECT_SELF: Administrators cannot review their own accounts.');
    }

    const nowIso = new Date().toISOString();
    app.status = 'rejected';
    app.reviewed_at = nowIso;
    app.reviewed_by = cleanAdmin;
    app.rejection_reason = rejectionReason?.trim() || undefined;
    this.applications.set(applicationId, app);

    const user = this.profiles.get(app.user_id);
    if (!user) {
      throw new Error('USER_NOT_FOUND: Applicant profile not found.');
    }

    user.role = 'student';
    user.approval_status = 'rejected';
    user.updated_at = nowIso;
    this.profiles.set(user.id, user);
    this.saveDiskCache();

    // Notify applicant
    await this.addNotification({
      user_id: user.id,
      title: 'Organizer Application Update',
      message: `Your organizer application for ${app.club_name} was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      type: 'info',
    });

    if (this.supabase) {
      try {
        await this.supabase.from('organizer_applications').update({
          status: 'rejected',
          reviewed_at: nowIso,
          reviewed_by: cleanAdmin,
          rejection_reason: app.rejection_reason,
        }).eq('id', applicationId);

        await this.supabase.from('profiles').update({
          role: 'student',
          approval_status: 'rejected',
          updated_at: nowIso,
        }).eq('id', user.id);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase rejectOrganizerApplication fallback:', err);
      }
    }

    return { application: { ...app }, user: { ...user } };
  }

  public async revokeOrganizerAccess(
    userId: string,
    reviewedByAdminEmail: string,
    reason?: string
  ): Promise<UserProfile> {
    const cleanAdmin = reviewedByAdminEmail.trim().toLowerCase();
    if (cleanAdmin !== 'admin@srmist.edu.in') {
      throw new Error('FORBIDDEN_SUPER_ADMIN_REQUIRED: Only the designated Super Admin (admin@srmist.edu.in) can revoke organizer privileges.');
    }

    const user = this.profiles.get(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND: User profile not found.');
    }

    if (user.role === 'admin' || user.email.toLowerCase() === 'admin@srmist.edu.in') {
      throw new Error('FORBIDDEN_SUPER_ADMIN_ACTION: Cannot revoke privileges from designated Super Admin.');
    }

    const nowIso = new Date().toISOString();
    user.role = 'student';
    user.approval_status = 'suspended';
    user.updated_at = nowIso;
    this.profiles.set(userId, user);
    this.saveDiskCache();

    await this.addNotification({
      user_id: user.id,
      title: 'Organizer Access Suspended',
      message: `Your organizer access for ${user.club_name || '1Kampus'} has been suspended by the administrator.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'info',
    });

    if (this.supabase) {
      try {
        await this.supabase.from('profiles').update({
          role: 'student',
          approval_status: 'suspended',
          updated_at: nowIso,
        }).eq('id', userId);
      } catch (err) {
        console.warn('[DatabaseStore] Supabase revokeOrganizerAccess fallback:', err);
      }
    }

    return { ...user };
  }

  // --------------------------------------------------------------------------
  // INTERNAL HELPERS
  // --------------------------------------------------------------------------
  private getEventConfirmedCount(eventId: string): number {
    let count = 0;
    for (const reg of this.registrations.values()) {
      if (reg.event_id === eventId && reg.registration_status === 'confirmed') {
        count++;
      }
    }
    return count;
  }

  private isUserRegisteredForEvent(userId: string, eventId: string): boolean {
    for (const reg of this.registrations.values()) {
      if (reg.user_id === userId && reg.event_id === eventId && reg.registration_status === 'confirmed') {
        return true;
      }
    }
    return false;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

export const db = new DatabaseStore();
