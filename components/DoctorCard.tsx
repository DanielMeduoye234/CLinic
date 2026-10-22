'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DoctorProfile } from '@/lib/types';
import { ShieldCheck, Star, Clock, MessageSquare, Hospital } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface DoctorCardProps {
  doctor: DoctorProfile;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const docName = (doctor.profiles as any)?.full_name || 'Dr. Medical Specialist';

  const handleStartChat = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/consultation/${doctor.id}&reason=consultation`);
      return;
    }
    if (profile?.role === 'doctor') {
      router.push('/doctor/dashboard');
      return;
    }
    router.push(`/consultation/${doctor.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500/80 p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between group">
      <div>
        {/* Top Header: Avatar & Online Status & Verified Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-heading font-bold text-teal-800 text-xl overflow-hidden shrink-0">
              {docName.replace('Dr. ', '').charAt(0)}
              {doctor.is_online && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-heading font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                  {docName}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-teal-700">
                {doctor.specialty}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                <Hospital className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{doctor.hospital_affiliation || 'Certified Medical Staff'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Bio Snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {doctor.bio || `Certified specialist in ${doctor.specialty} with over ${doctor.years_of_experience} years of clinical practice.`}
        </p>

        {/* Quick Stats: Experience, Rating, Response Time */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl mb-4 text-center">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-600">Experience</span>
            <span className="font-heading font-bold text-xs text-slate-900">{doctor.years_of_experience} yrs</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-600">Rating</span>
            <span className="font-heading font-bold text-xs text-slate-900 flex items-center justify-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(doctor.average_rating || 5).toFixed(1)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-600">Response</span>
            <span className="font-heading font-bold text-xs text-slate-900 flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3 text-emerald-600" />
              &lt; 5m
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Fee & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-600">Consultation Fee</span>
          <span className="font-heading font-extrabold text-base text-slate-900">
            ${Number(doctor.consultation_fee).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/doctors/${doctor.id}`}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={handleStartChat}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-500/20 active:scale-95 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
