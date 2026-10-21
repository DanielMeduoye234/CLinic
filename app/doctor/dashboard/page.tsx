'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { 
  Stethoscope, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Star, 
  Clock, 
  ExternalLink,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const { user, profile, doctorProfile, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(doctorProfile?.is_online ?? true);
  const [updating, setUpdating] = useState(false);

  const toggleOnlineStatus = async () => {
    if (!doctorProfile) return;
    setUpdating(true);
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      await supabase
        .from('doctor_profiles')
        .update({ is_online: newStatus })
        .eq('id', doctorProfile.id);

      await refreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const docName = profile?.full_name || 'Dr. Medical Specialist';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 font-heading font-extrabold text-2xl flex items-center justify-center shrink-0">
            {docName.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                Welcome, {docName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Verified Practice
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {doctorProfile?.specialty || 'General Practice'} • License: {doctorProfile?.medical_license_number || 'MED-VERIFIED'}
            </p>
          </div>
        </div>

        {/* Online Status Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-700 pl-2">Practice Status:</span>
          <button
            onClick={toggleOnlineStatus}
            disabled={updating}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isOnline
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            <span>{isOnline ? 'Online for Teleconsults' : 'Offline'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Consultations</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-slate-900">
            {doctorProfile?.total_reviews || 24}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">Active Practice</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Session Fee</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-slate-900">
            ${Number(doctorProfile?.consultation_fee || 35).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block">Per Teleconsultation</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-slate-900">
            {Number(doctorProfile?.average_rating || 5.0).toFixed(1)} ★
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block">5-Star Verified</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Avg Response</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-slate-900">
            &lt; 3 mins
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">Fast Responder</span>
        </div>
      </div>

      {/* Consultations Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Active Patient Consultations
            </h3>
            <p className="text-xs text-slate-500">Live patient rooms awaiting medical guidance.</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'cons-1',
              patientName: 'David K. (38)',
              symptoms: 'Acute throbbing migraine on left temple with photophobia for 2 days.',
              urgency: 'moderate',
              time: '5 mins ago',
            },
            {
              id: 'cons-2',
              patientName: 'Elena R. (29)',
              symptoms: 'Itchy contact dermatitis rash on forearm after gardening.',
              urgency: 'routine',
              time: '18 mins ago',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm text-slate-900">
                    {item.patientName}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {item.urgency}
                  </span>
                  <span className="text-xs text-slate-400">• {item.time}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">{item.symptoms}</p>
              </div>

              <Link
                href={`/consultation/${item.id}`}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 active:scale-95 transition-all self-end sm:self-auto"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Chat Room</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
