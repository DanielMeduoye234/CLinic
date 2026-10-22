'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DoctorProfile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import DoctorCard from '@/components/DoctorCard';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import SymptomTriageModal from '@/components/SymptomTriageModal';

function DoctorsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || 'All';
  const { profile, isLoading: isAuthLoading } = useAuth();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price_asc' | 'price_desc'>('rating');
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  // Doctors cannot view other doctors
  useEffect(() => {
    if (!isAuthLoading && profile?.role === 'doctor') {
      router.replace('/doctor/dashboard');
    }
  }, [profile, isAuthLoading, router]);

  const categories = [
    'All',
    'General Practice',
    'Dermatology',
    'Cardiology',
    'Pediatrics',
    'Neurology',
    'Psychiatry',
    'Orthopedics',
    'ENT',
    'Gastroenterology',
    'Ophthalmology',
  ];

  // Fetch verified doctors from Supabase
  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        let query = supabase
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
          .eq('is_verified', true); // ONLY VERIFIED DOCTORS

        if (selectedSpecialty !== 'All') {
          query = query.ilike('specialty', `%${selectedSpecialty}%`);
        }

        if (onlyOnline) {
          query = query.eq('is_online', true);
        }

        if (sortBy === 'rating') {
          query = query.order('average_rating', { ascending: false });
        } else if (sortBy === 'experience') {
          query = query.order('years_of_experience', { ascending: false });
        } else if (sortBy === 'price_asc') {
          query = query.order('consultation_fee', { ascending: true });
        } else if (sortBy === 'price_desc') {
          query = query.order('consultation_fee', { ascending: false });
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching doctors:', error);
        } else if (data) {
          setDoctors(data as unknown as DoctorProfile[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [selectedSpecialty, onlyOnline, sortBy]);

  // Client-side text search filter
  const filteredDoctors = doctors.filter((doc) => {
    const docName = (doc.profiles as any)?.full_name?.toLowerCase() || '';
    const specialty = doc.specialty?.toLowerCase() || '';
    const hospital = doc.hospital_affiliation?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return docName.includes(query) || specialty.includes(query) || hospital.includes(query);
  });

  // If logged in as doctor, display doctor redirection notice
  if (!isAuthLoading && profile?.role === 'doctor') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
          <Stethoscope className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-900">Physician Access Notice</h2>
        <p className="text-sm text-slate-600">
          Doctor accounts have their own dedicated practice view and cannot browse or consult other doctors. Redirecting to your Doctor Practice Portal...
        </p>
        <Link
          href="/doctor/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all"
        >
          <span>Go to Doctor Practice Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Directory Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-teal-700 text-xs font-bold uppercase tracking-wider font-heading mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Certified Medical Directory</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-3xl text-slate-900 tracking-tight">
            Find the Right Specialist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
            All listed practitioners possess verified medical board licenses. Search by condition, specialty, or hospital affiliation.
          </p>
        </div>

        {/* Quick Symptom Assessment Trigger */}
        <button
          onClick={() => setIsTriageOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center gap-2 self-start md:self-auto transition-colors"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Unsure which specialist? Check Symptoms</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        
        {/* Search Input & Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, specialty (e.g. Cardiologist), or hospital..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Online Now Toggle */}
            <button
              onClick={() => setOnlyOnline(!onlyOnline)}
              className={`px-3.5 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                onlyOnline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>Online Now</span>
            </button>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-600 appearance-none pr-8 cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="price_asc">Fee: Low to High</option>
                <option value="price_desc">Fee: High to Low</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Specialty Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSpecialty(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedSpecialty === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Doctors Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 px-4 bg-white border border-slate-200 rounded-3xl text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              No verified doctors found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              We strictly enforce our <strong>Zero Dummy Profile Rule</strong>. All doctors must be vetted and approved through credentialing verification before appearing here.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSelectedSpecialty('All');
                setSearchQuery('');
                setOnlyOnline(false);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsTriageOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm shadow-teal-600/20"
            >
              Check Symptoms with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDoctors.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      )}

      {/* Symptom Triage Modal */}
      <SymptomTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
      />

    </div>
  );
}

export default function DoctorsDirectoryPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">Loading Doctors Directory...</div>}>
      <DoctorsDirectoryContent />
    </Suspense>
  );
}

