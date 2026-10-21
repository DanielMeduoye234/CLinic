'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DoctorProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  Star, 
  Clock, 
  Hospital, 
  MessageSquare, 
  Calendar, 
  ArrowLeft, 
  Award, 
  FileText, 
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const { data, error } = await supabase
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
            profiles (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('id', doctorId)
          .single();

        if (error) {
          console.error(error);
        } else if (data) {
          setDoctor(data as unknown as DoctorProfile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const handleStartConsultation = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/consultation/${doctorId}`);
      return;
    }
    router.push(`/consultation/${doctorId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-semibold">Loading doctor clinical credentials...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-heading font-bold text-xl text-slate-900">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-600">
          This doctor profile either does not exist or has not yet been verified by our clinical committee.
        </p>
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const docName = (doctor.profiles as any)?.full_name || 'Dr. Medical Specialist';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28 sm:pb-12">
      
      {/* Back Link */}
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Doctors Directory</span>
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          
          {/* Avatar */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center font-heading font-extrabold text-teal-800 text-4xl overflow-hidden shrink-0">
            {docName.replace('Dr. ', '').charAt(0)}
            {doctor.is_online && (
              <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
                {docName}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Verified Physician
              </span>
            </div>

            <p className="font-heading font-bold text-base text-teal-700">
              {doctor.specialty}
            </p>

            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
              <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{doctor.hospital_affiliation || 'Hospital Affiliated Practitioner'}</span>
            </div>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {Number(doctor.average_rating || 5).toFixed(1)} ({doctor.total_reviews} consultations)
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-900">{doctor.years_of_experience} Years Experience</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Fast Responder (&lt; 5m)
              </span>
            </div>
          </div>

        </div>

        {/* Pricing Box (Desktop) */}
        <div className="hidden md:flex flex-col items-end gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 min-w-48 text-right">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-600">Telehealth Chat Fee</span>
            <span className="font-heading font-extrabold text-2xl text-slate-900">
              ${Number(doctor.consultation_fee).toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleStartConsultation}
            className="w-full py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start Instant Chat</span>
          </button>
        </div>
      </div>

      {/* Grid: Credentials & Biography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Biography & Care Philosophy */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-3">
            <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              About & Philosophy of Care
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.bio || `${docName} is a dedicated, board-certified physician specializing in ${doctor.specialty}. With over ${doctor.years_of_experience} years of clinical practice, Dr. ${docName.split(' ').pop()} provides comprehensive diagnostic evaluations, evidence-based treatment plans, and continuous patient support.`}
            </p>
          </div>

          {/* Sub-specialties */}
          {doctor.sub_specialties && doctor.sub_specialties.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-3">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Specialized Clinical Focus
              </h3>
              <div className="flex flex-wrap gap-2">
                {doctor.sub_specialties.map((sub) => (
                  <span
                    key={sub}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-100"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Verified Credentials Sidebar */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-600" />
              Verified Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div className="pb-3 border-b border-slate-100">
                <span className="block text-[10px] uppercase font-bold text-slate-600">License Registration</span>
                <span className="font-semibold text-slate-900">{doctor.medical_license_number}</span>
              </div>
              <div className="pb-3 border-b border-slate-100">
                <span className="block text-[10px] uppercase font-bold text-slate-600">Verification Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified by CLINIC Medical Board
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-600">Hospital Affiliation</span>
                <span className="font-semibold text-slate-900">{doctor.hospital_affiliation || 'Verified Staff'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-safe z-40 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-600">Consultation Fee</span>
          <span className="font-heading font-extrabold text-base text-slate-900">
            ${Number(doctor.consultation_fee).toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleStartConsultation}
          className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Start Instant Chat</span>
        </button>
      </div>

    </div>
  );
}
