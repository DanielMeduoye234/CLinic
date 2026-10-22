'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { 
  Stethoscope, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Activity, 
  Heart, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  ExternalLink, 
  FileText, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  X, 
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientConsultation {
  id: string;
  doctorId: string;
  doctorProfileId: string;
  doctorName: string;
  specialty: string;
  hospitalAffiliation: string;
  doctorAvatar?: string;
  isOnline: boolean;
  rating: number;
  status: 'active' | 'completed' | string;
  urgency: 'routine' | 'moderate' | 'urgent' | 'critical_emergency';
  createdAt: string;
  symptoms: string;
  lastMessage?: string;
}

interface ConsultedDoctor {
  id: string; // doctor_profile id
  name: string;
  specialty: string;
  hospital: string;
  avatar?: string;
  isOnline: boolean;
  rating: number;
  lastConsultationId: string;
  lastConsultationDate: string;
  totalConsultations: number;
}

interface PatientVault {
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

function PatientDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading: isAuthLoading } = useAuth();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'chats' | 'vault'>('overview');

  const [consultations, setConsultations] = useState<PatientConsultation[]>([]);
  const [consultedDoctors, setConsultedDoctors] = useState<ConsultedDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters for chats
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Medical Vault State
  const [vault, setVault] = useState<PatientVault>({
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Mild Asthma'],
    emergencyContact: {
      name: 'Robert Jenkins',
      phone: '+1 (555) 987-6543',
      relation: 'Spouse',
    },
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [vaultSavedNotice, setVaultSavedNotice] = useState(false);

  // Guard: Redirect unauthenticated users or doctors
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.replace('/auth/login?redirect=/patient/dashboard');
      } else if (profile?.role === 'doctor') {
        router.replace('/doctor/dashboard');
      }
    }
  }, [user, profile, isAuthLoading, router]);

  // Sync tab from URL if present
  useEffect(() => {
    if (tabParam && ['overview', 'doctors', 'chats', 'vault'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Load Vault from local cache
  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`clinic_patient_vault_${user.id}`);
        if (stored) {
          setVault(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [user]);

  // Fetch Consultations and unique Consulted Doctors from Supabase
  useEffect(() => {
    async function loadPatientData() {
      if (!user?.id) return;
      setLoading(true);

      try {
        // Query patient consultations
        const { data: rawCons, error } = await supabase
          .from('consultations')
          .select(`
            id,
            doctor_id,
            raw_symptoms,
            ai_urgency,
            status,
            created_at,
            doctor:doctor_profiles!consultations_doctor_id_fkey (
              id,
              profile_id,
              specialty,
              hospital_affiliation,
              is_online,
              average_rating,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });

        let list: PatientConsultation[] = [];

        if (!error && rawCons && rawCons.length > 0) {
          list = rawCons.map((item: any) => {
            const doc = item.doctor;
            const docProf = doc?.profiles;
            const rawName = docProf?.full_name || 'Dr. Clinical Specialist';
            const cleanName = rawName.startsWith('Dr. ') ? rawName : `Dr. ${rawName}`;

            return {
              id: item.id,
              doctorId: doc?.id || item.doctor_id,
              doctorProfileId: doc?.profile_id || '',
              doctorName: cleanName,
              specialty: doc?.specialty || 'General Practitioner',
              hospitalAffiliation: doc?.hospital_affiliation || 'CLINIC Telehealth Medical Staff',
              doctorAvatar: docProf?.avatar_url,
              isOnline: Boolean(doc?.is_online ?? true),
              rating: Number(doc?.average_rating || 4.9),
              status: item.status || 'active',
              urgency: item.ai_urgency || 'routine',
              createdAt: item.created_at,
              symptoms: item.raw_symptoms || 'General clinical inquiry',
            };
          });
        } else {
          // Fallback query if FK alias differs
          const { data: rawFallback } = await supabase
            .from('consultations')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });

          if (rawFallback && rawFallback.length > 0) {
            // Fetch doctor profiles
            const docIds = Array.from(new Set(rawFallback.map(c => c.doctor_id).filter(Boolean)));
            const { data: docs } = await supabase
              .from('doctor_profiles')
              .select(`
                id,
                profile_id,
                specialty,
                hospital_affiliation,
                is_online,
                average_rating,
                profiles (
                  id,
                  full_name,
                  avatar_url
                )
              `)
              .in('id', docIds);

            const docMap = new Map((docs || []).map((d: any) => [d.id, d]));

            list = rawFallback.map((c: any) => {
              const doc: any = docMap.get(c.doctor_id);
              const docProf = doc?.profiles;
              const rawName = docProf?.full_name || 'Dr. Clinical Specialist';
              const cleanName = rawName.startsWith('Dr. ') ? rawName : `Dr. ${rawName}`;

              return {
                id: c.id,
                doctorId: c.doctor_id,
                doctorProfileId: doc?.profile_id || '',
                doctorName: cleanName,
                specialty: doc?.specialty || 'General Practitioner',
                hospitalAffiliation: doc?.hospital_affiliation || 'CLINIC Telehealth Staff',
                doctorAvatar: docProf?.avatar_url,
                isOnline: Boolean(doc?.is_online ?? true),
                rating: Number(doc?.average_rating || 4.9),
                status: c.status || 'active',
                urgency: c.ai_urgency || 'routine',
                createdAt: c.created_at,
                symptoms: c.raw_symptoms || 'General clinical inquiry',
              };
            });
          }
        }

        setConsultations(list);

        // Compute unique doctors consulted
        const doctorMap = new Map<string, ConsultedDoctor>();
        list.forEach((c) => {
          if (!doctorMap.has(c.doctorId)) {
            doctorMap.set(c.doctorId, {
              id: c.doctorId,
              name: c.doctorName,
              specialty: c.specialty,
              hospital: c.hospitalAffiliation,
              avatar: c.doctorAvatar,
              isOnline: c.isOnline,
              rating: c.rating,
              lastConsultationId: c.id,
              lastConsultationDate: c.createdAt,
              totalConsultations: 1,
            });
          } else {
            const existing = doctorMap.get(c.doctorId)!;
            existing.totalConsultations += 1;
          }
        });

        setConsultedDoctors(Array.from(doctorMap.values()));
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthLoading) {
      loadPatientData();
    }
  }, [user, isAuthLoading]);

  // Save Medical Vault handler
  const handleSaveVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      localStorage.setItem(`clinic_patient_vault_${user.id}`, JSON.stringify(vault));
      setVaultSavedNotice(true);
      setTimeout(() => setVaultSavedNotice(false), 3000);
    } catch (e) {
      console.error('Vault save error:', e);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !vault.allergies.includes(newAllergy.trim())) {
      setVault({ ...vault, allergies: [...vault.allergies, newAllergy.trim()] });
      setNewAllergy('');
    }
  };

  const removeAllergy = (item: string) => {
    setVault({ ...vault, allergies: vault.allergies.filter((a) => a !== item) });
  };

  const addCondition = () => {
    if (newCondition.trim() && !vault.chronicConditions.includes(newCondition.trim())) {
      setVault({ ...vault, chronicConditions: [...vault.chronicConditions, newCondition.trim()] });
      setNewCondition('');
    }
  };

  const removeCondition = (item: string) => {
    setVault({ ...vault, chronicConditions: vault.chronicConditions.filter((c) => c !== item) });
  };

  // Filter consultations
  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch = 
      c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symptoms.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.status === 'active';
    if (statusFilter === 'completed') return c.status === 'completed';
    return true;
  });

  const patientName = profile?.full_name || user?.email?.split('@')[0] || 'Patient';
  const patientIdFormatted = `PID-${user?.id?.slice(0, 8).toUpperCase() || 'VERIFIED'}`;

  if (isAuthLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">
          Loading your secure patient health dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-heading font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
            {patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 leading-tight">
                Welcome back, {patientName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Verified Patient</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {patientIdFormatted}
              </span>
              <span>•</span>
              <span>{user?.email}</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Active Health Channel
              </span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
          <Link
            href="/doctors"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-500/25 transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Consult New Doctor</span>
          </Link>
          <Link
            href="/pharmacy"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80"
          >
            <ShoppingBag className="w-4 h-4 text-sky-600" />
            <span>Pharmacy</span>
          </Link>
          <Link
            href="/auth/logout"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. STATS / OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Doctors Consulted */}
        <div 
          onClick={() => setActiveTab('doctors')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doctors Consulted</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-slate-900">
              {consultedDoctors.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">specialists</span>
          </div>
          <p className="text-[10px] text-sky-600 font-bold mt-2 flex items-center gap-1">
            <span>View doctors list</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Chat Consultations */}
        <div 
          onClick={() => setActiveTab('chats')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chat Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-slate-900">
              {consultations.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {consultations.filter(c => c.status === 'active').length} active
            </span>
          </div>
          <p className="text-[10px] text-indigo-600 font-bold mt-2 flex items-center gap-1">
            <span>See chat history</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Health Vault */}
        <div 
          onClick={() => setActiveTab('vault')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Health Profile</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-slate-900">
              {vault.bloodGroup || 'O+'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {vault.allergies.length} allergies
            </span>
          </div>
          <p className="text-[10px] text-rose-600 font-bold mt-2 flex items-center gap-1">
            <span>Manage medical vault</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Security & HIPAA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Encryption</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-extrabold text-base text-slate-900">
              HIPAA Protected
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            256-bit encrypted teleconsultation records
          </p>
        </div>

      </div>

      {/* 3. INTERACTIVE TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all shrink-0 ${
            activeTab === 'doctors'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>My Doctors ({consultedDoctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all shrink-0 ${
            activeTab === 'chats'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat History ({consultations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all shrink-0 ${
            activeTab === 'vault'
              ? 'bg-sky-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Medical Vault & Profile</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* --- TAB 1: DASHBOARD OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          
          {/* Section: Your Consulted Doctors Carousel/Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-slate-900">
                  Your Consulted Doctors
                </h2>
                <p className="text-xs text-slate-500">
                  Physicians you have held teleconsultations with. 1-click to resume conversation.
                </p>
              </div>
              {consultedDoctors.length > 0 && (
                <button
                  onClick={() => setActiveTab('doctors')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>See all ({consultedDoctors.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {consultedDoctors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900">No Doctor Consultations Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Connect with a verified specialist in 60 seconds with instant chat, voice notes, and digital prescriptions.
                </p>
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Find Available Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultedDoctors.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 font-heading font-bold text-base flex items-center justify-center shrink-0">
                        {doc.name.replace('Dr. ', '').charAt(0)}
                        {doc.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Online Now" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="font-heading font-bold text-sm text-slate-900 truncate">
                            {doc.name}
                          </h3>
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        </div>
                        <p className="text-[11px] text-sky-600 font-semibold truncate">
                          {doc.specialty}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {doc.hospital}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {doc.totalConsultations} {doc.totalConsultations === 1 ? 'consultation' : 'consultations'}
                      </span>
                      <Link
                        href={`/consultation/${doc.lastConsultationId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Resume Chat</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Recent Chat Threads */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-slate-900">
                  Recent Consultation Chats
                </h2>
                <p className="text-xs text-slate-500">
                  Your ongoing and past clinical inquiries.
                </p>
              </div>
              {consultations.length > 0 && (
                <button
                  onClick={() => setActiveTab('chats')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>View all chats</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {consultations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 text-center text-xs text-slate-500">
                You currently have no recorded chat inquiries. Start a chat by selecting a physician.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {consultations.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                        {c.doctorName.replace('Dr. ', '').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-bold text-sm text-slate-900">
                            {c.doctorName}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {c.specialty}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            c.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate max-w-md mt-1">
                          Inquiry: {c.symptoms}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Consultation initiated on {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/consultation/${c.id}`}
                      className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <span>Open Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: MY DOCTORS (FULL DIRECTORY) --- */}
      {activeTab === 'doctors' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-slate-900">
                Doctors You've Consulted ({consultedDoctors.length})
              </h2>
              <p className="text-xs text-slate-500">
                Full list of medical professionals with active consultation records.
              </p>
            </div>

            <Link
              href="/doctors"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Browse All Specialists</span>
            </Link>
          </div>

          {consultedDoctors.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900">No Consulted Doctors</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                You haven't initiated conversations with any doctors yet. Browse our medical staff and connect immediately.
              </p>
              <Link
                href="/doctors"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Find a Doctor Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {consultedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="relative w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 font-heading font-bold text-lg flex items-center justify-center">
                        {doc.name.replace('Dr. ', '').charAt(0)}
                        {doc.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {doc.isOnline ? '● Online Now' : 'Offline'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-heading font-bold text-base text-slate-900">
                          {doc.name}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      </div>
                      <p className="text-xs text-sky-700 font-semibold">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{doc.hospital}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Total Consultations:</span>
                        <strong className="text-slate-900">{doc.totalConsultations}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Session:</span>
                        <span>{new Date(doc.lastConsultationDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Link
                      href={`/consultation/${doc.lastConsultationId}`}
                      className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Chat</span>
                    </Link>
                    <Link
                      href={`/doctors/${doc.id}`}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                      title="View Doctor Bio"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: CHAT HISTORY (SEARCHABLE LIST) --- */}
      {activeTab === 'chats' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-slate-900">
                Consultation Chat History
              </h2>
              <p className="text-xs text-slate-500">
                Filter and revisit every conversation with your clinical doctors.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({consultations.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({consultations.filter(c => c.status === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({consultations.filter(c => c.status === 'completed').length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history by doctor name, specialty, or clinical inquiry..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Threads list */}
          {filteredConsultations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-xs text-slate-500 space-y-2">
              <p>No chat history matching your criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sky-600 font-bold underline"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {filteredConsultations.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0">
                      {c.doctorName.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-sm text-slate-900">
                          {c.doctorName}
                        </h3>
                        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                          {c.specialty}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          c.urgency === 'urgent' || c.urgency === 'critical_emergency'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1">
                        Reason: {c.symptoms}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Channel ID: #{c.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/consultation/${c.id}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enter Chat Room</span>
                  </Link>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* --- TAB 4: MEDICAL PROFILE & HEALTH VAULT --- */}
      {activeTab === 'vault' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sky-700 text-xs font-bold uppercase tracking-wider font-heading mb-1">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>HIPAA Encrypted Patient Record</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl text-slate-900">
                Medical Profile & Clinical Vault
              </h2>
              <p className="text-xs text-slate-500">
                This data is securely provided to consulting physicians to prevent drug interactions.
              </p>
            </div>

            {vaultSavedNotice && (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in">
                ✓ Health vault saved securely
              </span>
            )}
          </div>

          <form onSubmit={handleSaveVault} className="space-y-6">
            
            {/* Primary Vitals */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-2xs">
              <h3 className="font-heading font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Primary Blood Group & Vitals</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Blood Group
                  </label>
                  <select
                    value={vault.bloodGroup}
                    onChange={(e) => setVault({ ...vault, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none font-semibold text-slate-800"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Emergency Contact Name & Relation
                  </label>
                  <input
                    type="text"
                    value={vault.emergencyContact.name}
                    onChange={(e) => setVault({
                      ...vault,
                      emergencyContact: { ...vault.emergencyContact, name: e.target.value }
                    })}
                    placeholder="e.g. Robert Jenkins (Spouse)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={vault.emergencyContact.phone}
                    onChange={(e) => setVault({
                      ...vault,
                      emergencyContact: { ...vault.emergencyContact, phone: e.target.value }
                    })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Drug Allergies */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-2xs">
              <h3 className="font-heading font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Known Drug Allergies & Adverse Reactions</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {vault.allergies.map((allg) => (
                  <span
                    key={allg}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200"
                  >
                    <span>{allg}</span>
                    <button
                      type="button"
                      onClick={() => removeAllergy(allg)}
                      className="p-0.5 rounded-full hover:bg-amber-200 text-amber-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                  placeholder="Type an allergy (e.g. Amoxicillin, Sulfa drugs) and press Add..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Add Allergy
                </button>
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-2xs">
              <h3 className="font-heading font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                <span>Pre-existing Conditions & Medical History</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {vault.chronicConditions.map((cond) => (
                  <span
                    key={cond}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200"
                  >
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => removeCondition(cond)}
                      className="p-0.5 rounded-full hover:bg-sky-200 text-sky-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCondition();
                    }
                  }}
                  placeholder="Type a chronic condition (e.g. Type 2 Diabetes, Hypertension)..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-sky-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Add Condition
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-heading font-bold text-xs shadow-md shadow-sky-500/25 active:scale-95 transition-all"
              >
                Save Medical Profile Vault
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading your secure patient health dashboard...
          </p>
        </div>
      }
    >
      <PatientDashboardContent />
    </Suspense>
  );
}
