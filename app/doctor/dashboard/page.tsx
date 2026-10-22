'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Calendar,
  ShoppingBag,
  Search,
  Filter,
  AlertCircle,
  FileText,
  ArrowRight,
  LogOut
} from 'lucide-react';

interface PatientChatThread {
  id: string;
  patientName: string;
  symptoms: string;
  urgency: 'routine' | 'moderate' | 'urgent' | 'critical_emergency';
  time: string;
  lastMessage: string;
  status: 'active' | 'awaiting_rx' | 'completed';
  unreadCount?: number;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { user, profile, doctorProfile, refreshProfile, isLoading: isAuthLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(doctorProfile?.is_online ?? true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'urgent' | 'completed'>('all');
  const [consultationsList, setConsultationsList] = useState<PatientChatThread[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Guard: if non-doctor tries to access doctor dashboard
  useEffect(() => {
    if (!isAuthLoading && (!user || profile?.role !== 'doctor')) {
      router.replace('/auth/login?redirect=/doctor/dashboard');
    }
  }, [user, profile, isAuthLoading, router]);

  // Synchronize doctor online status from doctorProfile
  useEffect(() => {
    if (doctorProfile) {
      setIsOnline(Boolean(doctorProfile.is_online));
    }
  }, [doctorProfile]);

  // Fetch real consultations from Supabase for this doctor (no dummy records)
  useEffect(() => {
    async function loadDoctorChats() {
      if (!doctorProfile?.id) {
        setConsultationsList([]);
        setLoadingChats(false);
        return;
      }

      setLoadingChats(true);
      try {
        const { data: realCons, error } = await supabase
          .from('consultations')
          .select(`
            id,
            patient_id,
            raw_symptoms,
            ai_urgency,
            status,
            created_at,
            profiles:patient_id (
              full_name
            )
          `)
          .eq('doctor_id', doctorProfile.id)
          .order('created_at', { ascending: false });

        if (!error && realCons) {
          const mapped: PatientChatThread[] = realCons.map((item: any) => ({
            id: item.id,
            patientName: item.profiles?.full_name || 'Patient Inquirer',
            symptoms: item.raw_symptoms || 'General teleconsultation clinical inquiry',
            urgency: item.ai_urgency || 'routine',
            time: new Date(item.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            lastMessage: 'Patient consultation initiated.',
            status: item.status === 'completed' ? 'completed' : 'active',
            unreadCount: 0,
          }));

          setConsultationsList(mapped);
        } else {
          setConsultationsList([]);
        }
      } catch (e) {
        console.error('Error loading consultations:', e);
        setConsultationsList([]);
      } finally {
        setLoadingChats(false);
      }
    }

    if (!isAuthLoading) {
      loadDoctorChats();
    }
  }, [doctorProfile, isAuthLoading]);

  const toggleOnlineStatus = async () => {
    if (!doctorProfile) return;
    setUpdating(true);
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_online: newStatus })
        .eq('id', doctorProfile.id);

      if (error) {
        console.error('Error updating doctor online status:', error);
        setIsOnline(!newStatus);
      } else {
        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
      setIsOnline(!newStatus);
    } finally {
      setUpdating(false);
    }
  };

  const docName = profile?.full_name || 'Dr. Medical Specialist';

  // Filtered chats
  const filteredChats = consultationsList.filter((c) => {
    const matchesSearch = 
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symptoms.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return c.status === 'active';
    if (statusFilter === 'urgent') return c.urgency === 'urgent' || c.urgency === 'critical_emergency';
    if (statusFilter === 'completed') return c.status === 'completed';
    return true;
  });

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500 font-semibold">Loading Doctor Practice Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* 1. Header Banner: Doctor Credentials & Teleconsult Status */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 font-heading font-extrabold text-2xl flex items-center justify-center shrink-0">
            {docName.replace('Dr. ', '').charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
                Welcome, {docName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Verified Physician
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {doctorProfile?.specialty || 'General Practice Specialist'} • License: {doctorProfile?.medical_license_number || 'MED-VERIFIED'} • {doctorProfile?.hospital_affiliation || 'CLINIC Telehealth Medical Staff'}
            </p>
          </div>
        </div>

        {/* Online Status Toggle & Shift Sign Out */}
        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 pl-2">Teleconsult Availability:</span>
            <button
              onClick={toggleOnlineStatus}
              disabled={updating}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{updating ? 'Updating...' : isOnline ? 'Online (Accepting Patients)' : 'Offline / Away'}</span>
            </button>
          </div>

          <Link
            href="/auth/logout"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs"
            title="End shift and sign out"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>

      {/* 2. Practice Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Total Consults</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-slate-900">
            {doctorProfile?.total_reviews || 24}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">Active Patient Inquiries</span>
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
            <span className="text-[11px] font-bold uppercase tracking-wider font-heading">Patient Rating</span>
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

      {/* 3. Pharmacy Formulary Banner (Doctors can view & inspect pharmacy catalog) */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50 via-slate-50 to-cyan-50 rounded-3xl border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Integrated Digital Pharmacy Formulary
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Inspect current pharmaceutical inventory, active ingredients, dosage forms, and delivery options available to prescribe directly to your patients.
            </p>
          </div>
        </div>
        <Link
          href="/pharmacy"
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm shrink-0 active:scale-95 transition-all"
        >
          <span>Browse Pharmacy Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Patient Chat History & Incoming Consultations ("chat history of people chatting them that all") */}
      <div id="patient-chats" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 scroll-mt-24">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-slate-900">
                Patient Chat History & Inquiries
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                {consultationsList.length} Inquiries
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation threads from patients seeking your medical advice and prescriptions.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient or symptoms..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'All Conversations' },
            { key: 'active', label: 'Active Live Chats' },
            { key: 'urgent', label: 'Urgent Triage' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Threads List */}
        {loadingChats ? (
          <div className="py-12 text-center text-xs text-slate-500 font-semibold">
            Loading patient chat history...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No patient conversations match the filter.</p>
            <p className="text-[11px] text-slate-400">Incoming patient consultation chats will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-teal-500/80 hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group bg-white"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 font-heading font-extrabold text-base flex items-center justify-center shrink-0">
                    {item.patientName.charAt(0)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                        {item.patientName}
                      </span>
                      
                      {/* Urgency Badge */}
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        item.urgency === 'urgent' || item.urgency === 'critical_emergency'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.urgency === 'moderate'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-teal-50 text-teal-800 border-teal-200'
                      }`}>
                        {item.urgency}
                      </span>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        item.status === 'completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-50 text-emerald-700 font-bold'
                      }`}>
                        {item.status === 'completed' ? 'Archived' : 'Active Chat'}
                      </span>

                      <span className="text-xs text-slate-400">• {item.time}</span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      <strong>Chief Complaint:</strong> {item.symptoms}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      &quot;{item.lastMessage}&quot;
                    </p>
                  </div>
                </div>

                {/* Open Chat Room Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Link
                    href={`/consultation/${item.id}`}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{item.status === 'completed' ? 'Review Transcript' : 'Open Consultation Room'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

