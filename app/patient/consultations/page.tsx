'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Stethoscope,
  Plus
} from 'lucide-react';

interface PatientConsultationItem {
  id: string;
  doctorName: string;
  specialty: string;
  status: 'active' | 'completed' | string;
  date: string;
  symptoms: string;
}

export default function PatientConsultationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [consultations, setConsultations] = useState<PatientConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatientConsultations() {
      if (!user) {
        setConsultations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select(`
            id,
            doctor_id,
            raw_symptoms,
            ai_urgency,
            status,
            created_at,
            doctor:doctor_id (
              id,
              specialty,
              profiles:profile_id (
                full_name
              )
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: PatientConsultationItem[] = data.map((item: any) => {
            const docProfile = (item.doctor as any)?.profiles;
            const docName = docProfile?.full_name ? `Dr. ${docProfile.full_name.replace('Dr. ', '')}` : 'Platform Physician';
            const spec = (item.doctor as any)?.specialty || 'General Practice';
            const dateStr = new Date(item.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return {
              id: item.id,
              doctorName: docName,
              specialty: spec,
              status: item.status || 'active',
              date: dateStr,
              symptoms: item.raw_symptoms || 'General clinical inquiry',
            };
          });

          setConsultations(mapped);
        } else {
          setConsultations([]);
        }
      } catch (err) {
        console.error('Error fetching consultations:', err);
        setConsultations([]);
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthLoading) {
      fetchPatientConsultations();
    }
  }, [user, isAuthLoading]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            My Telehealth Consultations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time chat history, clinical notes, and digital prescriptions from your doctors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/patient/dashboard"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            ← Patient Dashboard
          </Link>
          <Link
            href="/doctors"
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </Link>
        </div>
      </div>

      {/* Consultations List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading your clinical consultations...</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-slate-900">
              No Consultations Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              You do not have any active or past medical consultations. Connect with verified specialists online in 60 seconds.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Find Verified Doctors</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-sky-500/80 hover:shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {c.doctorName}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    c.status === 'completed'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-slate-400">• {c.date}</span>
                </div>
                <p className="text-xs font-semibold text-sky-700">{c.specialty}</p>
                <p className="text-xs text-slate-600 line-clamp-1">{c.symptoms}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <Link
                  href={`/consultation/${c.id}`}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-500/20 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{c.status === 'active' ? 'Resume Chat' : 'View Archive'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
