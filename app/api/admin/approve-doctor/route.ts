import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendDoctorApprovalEmail } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { doctorId } = await req.json();

    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
    }

    // 1. Fetch doctor details
    const { data: doctor, error: docError } = await supabaseAdmin
      .from('doctor_profiles')
      .select(`
        id,
        medical_license_number,
        specialty,
        profile_id,
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

    // 2. Set is_verified = true
    const { error: updateError } = await supabaseAdmin
      .from('doctor_profiles')
      .update({ is_verified: true, is_online: true })
      .eq('id', doctorId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update doctor verification status' }, { status: 500 });
    }

    // 3. Dispatch Resend transactional email to the doctor
    const doctorProfile = doctor.profiles as any;
    const emailResult = await sendDoctorApprovalEmail({
      doctorEmail: doctorProfile?.email || '',
      doctorName: doctorProfile?.full_name || 'Doctor',
      licenseNumber: doctor.medical_license_number,
      specialty: doctor.specialty
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor approved successfully and notification email dispatched.',
      emailStatus: emailResult
    });
  } catch (err: any) {
    console.error('Error in /api/admin/approve-doctor:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
