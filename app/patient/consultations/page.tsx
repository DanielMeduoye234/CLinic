'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Stethoscope
} from 'lucide-react';

export default function PatientConsultationsPage() {
  const { user } = useAuth();

  const consultations = [
    {
      id: 'cons-active-1',
      doctorName: 'Dr. Anya Sharma, MD',
      specialty: 'Dermatology & Skin Health',
      status: 'active',
      date: 'Today, 2:15 PM',
      symptoms: 'Acute throbbing migraine and light sensitivity.',
      hasPrescription: true,
    },
    {
      id: 'cons-past-1',
      doctorName: 'Dr. Marcus Vance, FACP',
      specialty: 'Cardiovascular Medicine',
      status: 'completed',
      date: 'Oct 14, 2026',
      symptoms: 'Mild resting palpitations after exercise.',
      hasPrescription: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            My Telehealth Consultations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time chat history, clinical notes, and digital prescriptions from your doctors.
          </p>
        </div>

        <Link
          href="/doctors"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
        >
          New Consultation
        </Link>
      </div>

      {/* List */}
      <div className="space-y-4">
        {consultations.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-teal-500/80"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {c.doctorName}
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {c.status}
                </span>
                <span className="text-xs text-slate-400">• {c.date}</span>
              </div>
              <p className="text-xs font-semibold text-teal-700">{c.specialty}</p>
              <p className="text-xs text-slate-600 line-clamp-1">{c.symptoms}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/consultation/${c.id}`}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-teal-600/20 active:scale-95 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{c.status === 'active' ? 'Resume Chat' : 'View Archive'}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
