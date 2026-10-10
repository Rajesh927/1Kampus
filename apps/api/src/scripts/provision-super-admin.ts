import dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db } from '../services/store.js';

// Load environment configuration
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface ProvisionResult {
  status: 'created' | 'updated' | 'local_configured';
  email: string;
  fullName: string;
  role: string;
  userId: string;
  temporaryPassword?: string;
  isSupabaseHosted: boolean;
  conflicts: Array<{ id: string; email: string; full_name: string }>;
  instructions: string;
}

export async function provisionSuperAdmin(): Promise<ProvisionResult> {
  const targetEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@srmist.edu.in').trim().toLowerCase();
  const targetName = (process.env.SUPER_ADMIN_NAME || 'SRMIST').trim();

  // Validate strong password
  let initialPassword = process.env.SUPER_ADMIN_PASSWORD;
  let isGeneratedPassword = false;

  if (!initialPassword) {
    // Generate high-entropy 24-character temporary password
    const entropy = crypto.randomBytes(12).toString('hex');
    initialPassword = `CC!${entropy}#Admin2026`;
    isGeneratedPassword = true;
  } else {
    // Verify password is not trivial or identical to email
    if (initialPassword.toLowerCase() === targetEmail || initialPassword.length < 8) {
      throw new Error(
        'SECURITY_ERROR: Administrator password must be at least 8 characters and must not match the login email address.'
      );
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isSupabaseHosted = !!(supabaseUrl && serviceKey && !supabaseUrl.includes('your-project.supabase.co'));

  console.log('\n============================================================');
  console.log('       1KAMPUS: SUPER ADMIN PROVISIONING');
  console.log('============================================================');
  console.log(`Target Email:   ${targetEmail}`);
  console.log(`Display Name:   ${targetName}`);
  console.log(`Role:           admin (Super Admin)`);
  console.log(`Hosting Target: ${isSupabaseHosted ? 'Supabase Hosted (Service Role Active)' : 'Local High-Fidelity Development Store'}`);

  // 1. Check existing administrator accounts in local store
  const localStoreResult = await db.ensureDesignatedSuperAdmin();
  const conflicts = localStoreResult.conflicts;

  if (conflicts.length > 0) {
    console.warn('\n[AUDIT WARNING] Pre-existing administrator accounts detected:');
    conflicts.forEach(c => {
      console.warn(`  - ID: ${c.id} | Email: ${c.email} | Name: ${c.full_name}`);
    });
    console.warn('Note: Existing administrator accounts have NOT been silently deleted.');
  }

  if (isSupabaseHosted) {
    // 2. Supabase Hosted Provisioning Procedure
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('\n[Supabase Auth] Inspecting existing Auth users...');
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
    }

    const existingAuthUser = usersData.users.find(u => u.email?.toLowerCase() === targetEmail);

    let authUserId: string;
    let provisionStatus: 'created' | 'updated';

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      provisionStatus = 'updated';
      console.log(`[Supabase Auth] Found existing Auth user (UUID: ${authUserId}). Updating metadata & password...`);

      const updatePayload: Record<string, any> = {
        user_metadata: {
          full_name: targetName,
          role: 'admin',
          account_type: 'Super Admin',
        },
      };

      if (!isGeneratedPassword || process.env.FORCE_RESET_PASSWORD === 'true') {
        updatePayload.password = initialPassword;
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, updatePayload);
      if (updateError) {
        throw new Error(`Failed to update Supabase Auth user: ${updateError.message}`);
      }
    } else {
      provisionStatus = 'created';
      console.log('[Supabase Auth] Creating new authenticated Super Admin user...');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: targetName,
          role: 'admin',
          account_type: 'Super Admin',
        },
      });

      if (createError || !createData.user) {
        throw new Error(`Failed to create user in Supabase Auth: ${createError?.message}`);
      }

      authUserId = createData.user.id;
    }

    // 3. Upsert into public.profiles
    console.log(`[Database] Linking profile for UUID ${authUserId}...`);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUserId,
      full_name: targetName,
      email: targetEmail,
      role: 'admin',
      registration_number: 'ADM-SRMIST-001',
      section: 'Administration',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      throw new Error(`Failed to update public.profiles in Supabase: ${profileError.message}`);
    }

    // Also update local store with the real Supabase Auth UUID
    await db.saveProfile({
      id: authUserId,
      full_name: targetName,
      email: targetEmail,
      role: 'admin',
      registration_number: 'ADM-SRMIST-001',
      section: 'Administration',
    });

    console.log('\n[SUCCESS] Super Admin account successfully configured in Supabase Auth & PostgreSQL profiles.');

    return {
      status: provisionStatus,
      email: targetEmail,
      fullName: targetName,
      role: 'admin',
      userId: authUserId,
      temporaryPassword: isGeneratedPassword ? initialPassword : '[PROVIDED_IN_ENVIRONMENT]',
      isSupabaseHosted: true,
      conflicts,
      instructions: `Sign in at ${process.env.CLIENT_URL || 'http://localhost:5173'}/login using email "${targetEmail}" with your password.`,
    };
  } else {
    // 4. Local High-Fidelity Development Store Provisioning
    const superAdmin = localStoreResult.superAdmin;
    console.log('\n[Local Mode] Super Admin profile configured in high-fidelity application store.');
    console.log(`  - UUID:  ${superAdmin.id}`);
    console.log(`  - Email: ${superAdmin.email}`);
    console.log(`  - Name:  ${superAdmin.full_name}`);
    console.log(`  - Role:  ${superAdmin.role}`);

    return {
      status: 'local_configured',
      email: targetEmail,
      fullName: targetName,
      role: 'admin',
      userId: superAdmin.id,
      temporaryPassword: isGeneratedPassword ? initialPassword : '[PROVIDED_IN_ENVIRONMENT]',
      isSupabaseHosted: false,
      conflicts,
      instructions:
        'Running in local mode. You can sign in using 1-Click "SRMIST (Super Admin)" persona or devLogin. To connect to hosted Supabase Auth, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env and run this script again.',
    };
  }
}

// Execute CLI
if (process.argv[1] && process.argv[1].includes('provision-super-admin')) {
  provisionSuperAdmin()
    .then(result => {
      console.log('\n------------------------------------------------------------');
      console.log('SUMMARY OF PROVISIONED SUPER ADMIN:');
      console.log(`  Status:             ${result.status.toUpperCase()}`);
      console.log(`  Display Name:       ${result.fullName}`);
      console.log(`  Login Email:        ${result.email}`);
      console.log(`  Role:               ${result.role}`);
      console.log(`  User UUID:          ${result.userId}`);
      console.log(`  Supabase Connected: ${result.isSupabaseHosted ? 'YES' : 'NO (Local Dev Mode)'}`);
      if (result.temporaryPassword && result.temporaryPassword !== '[PROVIDED_IN_ENVIRONMENT]') {
        console.log(`  Initial Password:   ${result.temporaryPassword}`);
        console.log('  [IMPORTANT] Change or reset this password before production use.');
      }
      console.log(`  How to sign in:     ${result.instructions}`);
      console.log('------------------------------------------------------------\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n[FATAL ERROR] Super Admin Provisioning failed:', err.message);
      process.exit(1);
    });
}
