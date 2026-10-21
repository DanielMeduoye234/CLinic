import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch all doctor profiles from DB
    const { data: doctors, error } = await supabaseAdmin
      .from('doctor_profiles')
      .select(`
        id,
        profile_id,
        specialty,
        sub_specialties,
        medical_license_number,
        license_document_url,
        is_verified,
        hospital_affiliation,
        years_of_experience,
        bio,
        consultation_fee,
        currency,
        is_online,
        average_rating,
        total_reviews,
        created_at,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Enrich with Auth metadata (banned status, moderation status)
    const enrichedDoctors = await Promise.all(
      (doctors || []).map(async (doc: any) => {
        let authMeta: any = {
          is_banned: false,
          is_suspended: false,
          moderation_status: doc.is_verified ? 'active' : 'pending'
        };

        if (doc.profile_id) {
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(doc.profile_id);
            if (authUser?.user) {
              const u = authUser.user;
              const isBanned = Boolean(u.banned_until && new Date(u.banned_until) > new Date());
              const modStatus = u.app_metadata?.moderation_status || (isBanned ? 'banned' : (doc.is_verified ? 'active' : 'pending'));

              authMeta = {
                banned_until: u.banned_until,
                is_banned: modStatus === 'banned' || isBanned,
                is_suspended: modStatus === 'suspended',
                moderation_status: modStatus,
                suspension_reason: u.app_metadata?.suspension_reason,
                ban_reason: u.app_metadata?.ban_reason
              };
            }
          } catch (e: any) {
            console.warn('Could not inspect auth user for doctor:', doc.profile_id, e.message);
          }
        }

        return {
          ...doc,
          auth_meta: authMeta
        };
      })
    );

    return NextResponse.json({ doctors: enrichedDoctors });
  } catch (err: any) {
    console.error('Error fetching admin doctors:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
