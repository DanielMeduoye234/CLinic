import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET all patients for admin
export async function GET() {
  try {
    const { data: patients, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        role,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        updated_at,
        patient_medical_vault (
          blood_group,
          allergies,
          chronic_conditions,
          emergency_contact_name,
          emergency_contact_phone
        )
      `)
      .eq('role', 'patient')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ patients: patients || [] });
  } catch (err: any) {
    console.error('Error fetching admin patients:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE patient by ID (purges from Supabase Auth & public.profiles)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('id');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required.' }, { status: 400 });
    }

    // 1. Verify user is a patient (prevent accidental deletion of doctors or admins)
    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', patientId)
      .single();

    if (fetchErr || !profile) {
      // Still attempt to purge from auth if orphan exists
      await supabaseAdmin.auth.admin.deleteUser(patientId).catch(() => {});
      return NextResponse.json({ success: true, message: 'Patient record cleaned.' });
    }

    if (profile.role !== 'patient') {
      return NextResponse.json({ 
        error: `Cannot delete user with role '${profile.role}' from the patients directory. Use doctor moderation for doctors.` 
      }, { status: 400 });
    }

    // 2. Cascade delete from Supabase Auth
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(patientId);
    if (authDeleteErr) {
      console.warn('Notice deleting from Auth:', authDeleteErr.message);
    }

    // 3. Explicitly delete from public.profiles in case cascade was delayed
    const { error: profileDeleteErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', patientId);

    if (profileDeleteErr) {
      console.warn('Notice deleting profile:', profileDeleteErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Patient ${profile.full_name || profile.email} was successfully deleted from records.`
    });
  } catch (err: any) {
    console.error('Error deleting patient:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
