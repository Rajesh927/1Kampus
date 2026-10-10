-- ============================================================================
-- CAMPUSCONNECT: SEED.SQL
-- Realistic Fictional Demo Data for SRMIST Campus Events
-- Note: Clearly marked as fictional demo data for development and recruitment testing.
-- ============================================================================

-- 1. Insert Demo Profiles
INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'SRMIST', 'admin@srmist.edu.in', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000002', 'ACM Student Chapter', 'acm@srmist.edu.in', 'organizer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000003', 'SRM Robotics Club', 'robotics@srmist.edu.in', 'organizer', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000004', 'E-Cell SRMIST', 'ecell@srmist.edu.in', 'organizer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000005', 'Milan Cultural Committee', 'milan@srmist.edu.in', 'organizer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000010', 'Alex Chen (Student)', 'alex.chen@student.srmist.edu.in', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80'),
    ('00000000-0000-0000-0000-000000000011', 'Priya Sharma (Student)', 'priya.s@student.srmist.edu.in', 'student', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 2. Insert 10 Realistic Diverse Campus Events
INSERT INTO public.events (
    id, organizer_id, organizer_name, title, slug, description, category,
    banner_url, venue, start_time, end_time, registration_deadline, capacity, status, instructions
)
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'ACM Student Chapter SRMIST',
    'Hack SRM 2026: 36-Hour National Flagship Hackathon',
    'hack-srm-2026',
    'Join 500+ builders, designers, and innovators for a weekend of rapid prototyping, mentorship, and project showcases. Tracks include Generative AI, Sustainable Tech, Decentralized Systems, and Smart Campus Solutions. Industry mentors from top tech companies will be on ground.',
    'Hackathons',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'TP Ganesan Mini Hall 1 & Tech Park 8th Floor Labs',
    NOW() + INTERVAL '12 days',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '10 days',
    120,
    'published',
    'Bring your student ID, laptops, multi-plug extension cords, and sleeping gear if staying overnight. Teams of 2 to 4 members.'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'ACM Student Chapter SRMIST',
    'Full-Stack Modern React & Cloud Native Architecture Workshop',
    'full-stack-modern-react-workshop',
    'A hands-on intensive masterclass on designing scalable client-server applications. Learn state machines, server components, edge deployment, and microservices architecture from senior software architects.',
    'Workshops',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    'UB Seminar Hall 301, University Building',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days 4 hours',
    NOW() + INTERVAL '4 days',
    60,
    'published',
    'Prerequisites: Basic familiarity with JavaScript/TypeScript and Git. Please install Node.js v20+ on your machines prior to attending.'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'SRM Robotics Club',
    'Autonomous Rover & Drone Dynamics Live Demo & Bootcamp',
    'autonomous-rover-drone-bootcamp',
    'Explore the frontier of embedded computer vision, ROS2 integration, and real-time obstacle avoidance. Experience physical rovers navigating obstacle tracks and quadcopters performing automated waypoint patrol.',
    'Technology',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    'Biotech Quad Indoor Arena & Robotics Lab Ground Floor',
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '8 days 5 hours',
    NOW() + INTERVAL '7 days',
    45,
    'published',
    'Safety goggles and laboratory gear will be provided on site. No prior hardware experience required.'
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'E-Cell SRMIST',
    'Campus Founders Summit: From Dorm Room to Seed Stage',
    'campus-founders-summit-2026',
    'Meet SRM alumni founders who scaled companies to Series A and beyond. Topics cover finding product-market fit, pitching angel investors, campus incubators, and legal incorporation for student startups.',
    'Entrepreneurship',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    'Dr. T.P. Ganesan Main Auditorium',
    NOW() + INTERVAL '16 days',
    NOW() + INTERVAL '16 days 6 hours',
    NOW() + INTERVAL '15 days',
    300,
    'published',
    'Formal or smart casual attire recommended. Networking mixer session follows keynote speeches.'
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'Milan Cultural Committee',
    'Acoustic Nights & Open Mic Fest 2026',
    'acoustic-nights-open-mic',
    'An evening of unplugged musical performances, spoken word poetry, indie acoustic sets, and artistic showcases under the campus stars. Bring your instruments or just come with friends.',
    'Cultural',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    'Java Green Amphitheatre',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 4 hours',
    NOW() + INTERVAL '2 days',
    150,
    'published',
    'Performers must register at the reception desk 30 minutes prior to showtime.'
),
(
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000002',
    'ACM Student Chapter SRMIST',
    'Algorithm Battles: Fast-Paced Competitive Coding Contest',
    'algorithm-battles-competitive-coding',
    'Put your algorithmic speed and data structure mastery to the test. 6 curated algorithmic challenges ranging from dynamic programming to graph flows. Real-time leaderboard and custom certificates.',
    'Technology',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'Tech Park Computing Center Lab 402',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 3 hours',
    NOW() + INTERVAL '6 days',
    80,
    'published',
    'Individual participation only. Contest runtime environments support C++, Python 3, Java, Rust, and Go.'
),
(
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    'SRM Robotics Club',
    'Introduction to Deep Reinforcement Learning for Physical Robots',
    'deep-rl-robotics-seminar',
    'Guest technical seminar by visiting AI research scientists exploring policy gradients, PPO, simulation-to-real transfer, and Isaac Gym frameworks for humanoid motion planning.',
    'Talks',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    'Tech Park Auditorium 2',
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '20 days 3 hours',
    NOW() + INTERVAL '19 days',
    100,
    'published',
    'Open to all engineering students. Prior knowledge of linear algebra and neural networks is helpful.'
),
(
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000004',
    'E-Cell SRMIST',
    'Intra-Campus 3v3 Basketball Tournament',
    'intra-campus-3v3-basketball',
    'High-intensity knockout basketball championship. Teams battle for the annual campus cup with live commentary, refreshments, and spectator courtside seating.',
    'Sports',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    'SRM Sports Complex Court 1',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days 6 hours',
    NOW() + INTERVAL '9 days',
    32,
    'published',
    'Rosters capped at 4 players per squad (3 on-court, 1 substitute). Non-marking basketball shoes mandatory.'
),
(
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000002',
    'ACM Student Chapter SRMIST',
    'Cloud-Native Kubernetes & Docker Microservices Bootcamp',
    'cloud-native-kubernetes-bootcamp',
    'Learn container orchestration, ingress controllers, CI/CD pipelines, and zero-downtime rolling updates with live cluster deployments on Google Cloud Platform.',
    'Workshops',
    'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80',
    'Tech Park Cloud Computing Lab 604',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '14 days 4 hours',
    NOW() + INTERVAL '13 days',
    50,
    'published',
    'GCP sandbox credits will be distributed to confirmed registered participants.'
),
(
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000005',
    'Milan Cultural Committee',
    'Digital Art & UI/UX Design Sprint Showcase',
    'digital-art-uiux-sprint',
    'Exhibition and creative critique featuring student design projects in interaction design, 3D blender renders, visual branding, and generative typography.',
    'Cultural',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    'Design Studio 2nd Floor, Architecture Block',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '18 days 5 hours',
    NOW() + INTERVAL '17 days',
    75,
    'published',
    'Digital artwork display boards and Figma review stations will be available for all attendees.'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, capacity = EXCLUDED.capacity;
