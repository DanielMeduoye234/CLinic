import { NextRequest, NextResponse } from 'next/server';
import { analyzeSymptomsWithGemini } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptoms, duration, painLevel, additionalContext } = body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please describe the symptoms you are experiencing.' },
        { status: 400 }
      );
    }

    // 1. Analyze symptoms using Google Gemini AI Engine
    const triageResult = await analyzeSymptomsWithGemini(
      symptoms,
      duration,
      painLevel ? Number(painLevel) : undefined,
      additionalContext
    );

    // 2. If emergency detected, return emergency guidance directly
    if (triageResult.is_emergency) {
      return NextResponse.json({
        triage: triageResult,
        matchedDoctors: [],
        isEmergency: true
      });
    }

    // 3. Query Supabase for verified doctors matching the primary specialty
    // STRICT RULE: Only is_verified = true doctors are returned! No dummy profiles.
    let { data: doctors, error } = await supabaseAdmin
      .from('doctor_profiles')
      .select(`
        id,
        profile_id,
        specialty,
        sub_specialties,
        medical_license_number,
        is_verified,
        hospital_affiliation,
        years_of_experience,
        bio,
        consultation_fee,
        currency,
        is_online,
        average_rating,
        total_reviews,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('is_verified', true)
      .ilike('specialty', `%${triageResult.primary_specialty}%`)
      .order('is_online', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(3);

    // Fallback: If no specialist online in that exact sub-field, get verified General Practice / any verified doctor
    if (!doctors || doctors.length === 0) {
      const { data: generalDocs } = await supabaseAdmin
        .from('doctor_profiles')
        .select(`
          id,
          profile_id,
          specialty,
          sub_specialties,
          medical_license_number,
          is_verified,
          hospital_affiliation,
          years_of_experience,
          bio,
          consultation_fee,
          currency,
          is_online,
          average_rating,
          total_reviews,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('is_verified', true)
        .order('is_online', { ascending: false })
        .order('average_rating', { ascending: false })
        .limit(3);

      doctors = generalDocs || [];
    }

    return NextResponse.json({
      triage: triageResult,
      matchedDoctors: doctors,
      isEmergency: false
    });
  } catch (error: any) {
    console.error('Error in /api/triage/analyze:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during symptom triage.', details: error.message },
      { status: 500 }
    );
  }
}
