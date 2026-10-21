import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendDoctorApprovalEmail } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { doctorId, action, reason } = await req.json();

    if (!doctorId || !action) {
      return NextResponse.json({ error: 'doctorId and action are required' }, { status: 400 });
    }

    if (!['approve', 'suspend', 'ban', 'reinstate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Supported: approve, suspend, ban, reinstate' }, { status: 400 });
    }

    // 1. Fetch doctor details
    const { data: doctor, error: docError } = await supabaseAdmin
      .from('doctor_profiles')
      .select(`
        id,
        profile_id,
        medical_license_number,
        specialty,
        is_verified,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('id', doctorId)
      .single();

    if (docError || !doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const doctorProfile = doctor.profiles as any;
    const profileId = doctor.profile_id;

    if (action === 'approve') {
      // 1. Approve & verify in DB
      await supabaseAdmin
        .from('doctor_profiles')
        .update({ is_verified: true, is_online: true })
        .eq('id', doctorId);

      // 2. Clear any ban in Auth
      if (profileId) {
        await supabaseAdmin.auth.admin.updateUserById(profileId, {
          ban_duration: 'none',
          app_metadata: { moderation_status: 'active', is_banned: false, is_suspended: false }
        }).catch((e) => console.warn('Auth unban notice:', e.message));
      }

      // 3. Dispatch Resend transactional email
      const emailResult = await sendDoctorApprovalEmail({
        doctorEmail: doctorProfile?.email || '',
        doctorName: doctorProfile?.full_name || 'Doctor',
        licenseNumber: doctor.medical_license_number,
        specialty: doctor.specialty
      });

      return NextResponse.json({
        success: true,
        action: 'approve',
        status: 'active',
        message: `Dr. ${doctorProfile?.full_name || 'Doctor'} approved. Credentialing approval email sent.`,
        emailResult
      });
    }

    if (action === 'suspend') {
      // 1. Mark unverified & offline in DB (removes immediately from directory & matching)
      await supabaseAdmin
        .from('doctor_profiles')
        .update({ is_verified: false, is_online: false })
        .eq('id', doctorId);

      // 2. Ban in Supabase Auth so they cannot log in (720h = 30 days suspension)
      if (profileId) {
        await supabaseAdmin.auth.admin.updateUserById(profileId, {
          ban_duration: '720h',
          app_metadata: {
            moderation_status: 'suspended',
            is_suspended: true,
            is_banned: false,
            suspension_reason: reason || 'Account under administrative review'
          }
        }).catch((e) => console.warn('Auth suspend notice:', e.message));
      }

      return NextResponse.json({
        success: true,
        action: 'suspend',
        status: 'suspended',
        message: `Dr. ${doctorProfile?.full_name || 'Doctor'} has been suspended. Login access revoked.`
      });
    }

    if (action === 'ban') {
      // 1. Mark unverified & offline in DB
      await supabaseAdmin
        .from('doctor_profiles')
        .update({ is_verified: false, is_online: false })
        .eq('id', doctorId);

      // 2. Permanent Ban in Supabase Auth (100 years = 876000h)
      if (profileId) {
        await supabaseAdmin.auth.admin.updateUserById(profileId, {
          ban_duration: '876000h',
          app_metadata: {
            moderation_status: 'banned',
            is_banned: true,
            is_suspended: false,
            ban_reason: reason || 'Violation of medical platform policies'
          }
        }).catch((e) => console.warn('Auth ban notice:', e.message));
      }

      return NextResponse.json({
        success: true,
        action: 'ban',
        status: 'banned',
        message: `Dr. ${doctorProfile?.full_name || 'Doctor'} has been permanently banned from CLINIC. Platform access locked.`
      });
    }

    if (action === 'reinstate') {
      // 1. Restore verified status in DB
      await supabaseAdmin
        .from('doctor_profiles')
        .update({ is_verified: true, is_online: true })
        .eq('id', doctorId);

      // 2. Lift Auth ban so they can log back in
      if (profileId) {
        await supabaseAdmin.auth.admin.updateUserById(profileId, {
          ban_duration: 'none',
          app_metadata: {
            moderation_status: 'active',
            is_banned: false,
            is_suspended: false
          }
        }).catch((e) => console.warn('Auth reinstate notice:', e.message));
      }

      return NextResponse.json({
        success: true,
        action: 'reinstate',
        status: 'active',
        message: `Dr. ${doctorProfile?.full_name || 'Doctor'} has been reinstated. Full credentials and portal access restored.`
      });
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/admin/moderate-doctor:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
