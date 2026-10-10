import dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '../services/store.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PRE_AUTHORIZED_ORGANIZERS = [
  { email: 'acm@srmist.edu.in', name: 'ACM Student Chapter SRMIST', organization: 'ACM Student Chapter' },
  { email: 'robotics@srmist.edu.in', name: 'SRM Robotics Club', organization: 'Robotics/IoT Club' },
  { email: 'ecell@srmist.edu.in', name: 'E-Cell SRMIST', organization: 'Entrepreneurship/E-Cell' },
  { email: 'milan@srmist.edu.in', name: 'Milan Cultural Committee', organization: 'Cultural Club' },
];

export async function provisionOrganizerAccount(targetEmail?: string, customPassword?: string) {
  const emailToProvision = (targetEmail || process.env.ORGANIZER_EMAIL || 'acm@srmist.edu.in').trim().toLowerCase();
  
  const knownConfig = PRE_AUTHORIZED_ORGANIZERS.find(o => o.email.toLowerCase() === emailToProvision);
  const orgName = knownConfig?.name || process.env.ORGANIZER_NAME || 'Campus Club Organizer';
  const orgDepartment = knownConfig?.organization || 'Student Affairs';

  let initialPassword = customPassword || process.env.ORGANIZER_PASSWORD;
  let isGenerated = false;

  if (!initialPassword) {
    const entropy = crypto.randomBytes(8).toString('hex');
    initialPassword = `Org!${entropy}#2026`;
    isGenerated = true;
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isSupabaseHosted = !!(supabaseUrl && serviceKey && !supabaseUrl.includes('your-project.supabase.co'));

  console.log('\n============================================================');
  console.log('       1KAMPUS: ORGANIZER ACCOUNT PROVISIONING');
  console.log('============================================================');
  console.log(`Target Email:   ${emailToProvision}`);
  console.log(`Club / Name:    ${orgName}`);
  console.log(`Organization:   ${orgDepartment}`);
  console.log(`Role:           organizer (Pre-Authorized Campus Organizer)`);
  console.log(`Hosting Target: ${isSupabaseHosted ? 'Supabase Hosted (Service Role Active)' : 'Local High-Fidelity Store'}`);

  // 1. Provision in local DatabaseStore
  await db.provisionOrganizer({
    email: emailToProvision,
    fullName: orgName,
    organization: orgDepartment,
    temporaryPassword: initialPassword,
  });

  // 2. If Supabase is active, synchronize to Supabase Auth & profiles table
  if (isSupabaseHosted) {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn(`[Supabase Auth] Note: Could not query auth users: ${listError.message}`);
    } else {
      const existing = usersData.users.find(u => u.email?.toLowerCase() === emailToProvision);
      if (existing) {
        console.log(`[Supabase Auth] Updating existing organizer account: ${existing.id}`);
        await supabase.auth.admin.updateUserById(existing.id, {
          password: initialPassword,
          user_metadata: { full_name: orgName, role: 'organizer', organization: orgDepartment },
        });
      } else {
        console.log('[Supabase Auth] Creating new authorized organizer user...');
        await supabase.auth.admin.createUser({
          email: emailToProvision,
          password: initialPassword,
          email_confirm: true,
          user_metadata: { full_name: orgName, role: 'organizer', organization: orgDepartment },
        });
      }
    }
  }

  console.log('------------------------------------------------------------');
  console.log('✅ Organizer account successfully provisioned & verified.');
  console.log(`  Login Email:        ${emailToProvision}`);
  console.log(`  Temporary Password: ${initialPassword}`);
  console.log('  [SECURITY NOTICE] Deliver temporary credentials only through secure channel.');
  console.log('============================================================\n');

  return { email: emailToProvision, temporaryPassword: initialPassword };
}

// Auto-execute if invoked directly via CLI
if (process.argv[1] && process.argv[1].includes('provision-organizer')) {
  provisionOrganizerAccount().catch(err => {
    console.error('Organizer provisioning failed:', err);
    process.exit(1);
  });
}
