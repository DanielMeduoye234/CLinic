'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Stethoscope, 
  ShieldCheck, 
  Clock, 
  Activity, 
  ArrowRight, 
  HeartPulse, 
  Baby, 
  Brain, 
  Eye, 
  Bone, 
  Pill, 
  Smile, 
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Truck,
  CheckCircle2,
  MapPin,
  Building2,
  Phone,
  Zap,
  ShoppingBag
} from 'lucide-react';
import SymptomTriageModal from '@/components/SymptomTriageModal';
import DoctorCard from '@/components/DoctorCard';
import ProductCard from '@/components/ProductCard';
import { DoctorProfile, PharmacyProduct } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading: isAuthLoading } = useAuth();
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [quickSymptom, setQuickSymptom] = useState('');
  const [verifiedDoctors, setVerifiedDoctors] = useState<DoctorProfile[]>([]);
  const [pharmacyProducts, setPharmacyProducts] = useState<PharmacyProduct[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Requirement: Doctor should NOT have access to homepage; route straight to doctor dashboard
  useEffect(() => {
    if (!isAuthLoading && profile?.role === 'doctor') {
      router.replace('/doctor/dashboard');
    }
  }, [profile, isAuthLoading, router]);

  if (!isAuthLoading && profile?.role === 'doctor') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />
        <h2 className="font-heading font-extrabold text-xl text-slate-900">
          Redirecting to Doctor Practice Dashboard...
        </h2>
        <p className="text-xs text-slate-500">
          Physician accounts operate directly within the clinical practice portal.
        </p>
      </div>
    );
  }

  // Desktop Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mobile App Slider State
  const [mobileSlide, setMobileSlide] = useState(0);
  const mobileTouchStartX = useRef<number | null>(null);
  const desktopTouchStartX = useRef<number | null>(null);

  const heroSlides = [
    {
      id: 0,
      badge: 'Instant Clinical AI Triage & Matching',
      badgeIcon: Sparkles,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      titlePrimary: 'Describe how you feel.',
      titleAccent: 'Connect with a doctor in 60s.',
      subtitle: 'Triage symptoms instantly with clinical AI. Get matched with certified medical specialists for real-time consultations, voice notes, digital prescriptions, and doorstep medication delivery.',
      image: '/images/hero/hero_doctor.jpg',
      imageAlt: 'Telehealth clinical consultation with doctor',
      hasInput: true,
      stats: [
        { label: 'Avg Matching Time', value: '<60s' },
        { label: 'Specialists Available', value: '24/7' },
        { label: 'Clinical Accuracy', value: '99.4%' },
      ],
    },
    {
      id: 1,
      badge: '100% Board-Certified Specialists',
      badgeIcon: ShieldCheck,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      titlePrimary: 'Board-certified doctors,',
      titleAccent: 'ready whenever you are.',
      subtitle: 'Consult directly with verified general practitioners, pediatricians, cardiologists, and dermatologists via high-definition chat, audio notes, and instant digital prescriptions.',
      image: '/images/hero/hero_specialist.jpg',
      imageAlt: 'Team of certified doctors discussing medical records',
      hasInput: false,
      primaryCta: { text: 'Browse Verified Doctors', href: '/doctors' },
      secondaryCta: { text: 'Start AI Assessment', action: 'triage' },
      stats: [
        { label: 'License Verified', value: '100%' },
        { label: 'Medical Specialties', value: '14+' },
        { label: 'Patient Satisfaction', value: '4.9/5' },
      ],
    },
    {
      id: 2,
      badge: 'Integrated Digital Pharmacy',
      badgeIcon: Pill,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      titlePrimary: 'Digital prescriptions,',
      titleAccent: 'delivered right to your door.',
      subtitle: 'Seamlessly convert your doctor\'s digital prescription into fast home delivery or shop certified OTC health essentials with real-time temperature-monitored package tracking.',
      image: '/images/hero/hero_pharmacy.jpg',
      imageAlt: 'Modern pharmacy medication packaging and delivery',
      hasInput: false,
      primaryCta: { text: 'Visit Pharmacy Store', href: '/pharmacy' },
      secondaryCta: { text: 'Check Symptoms First', action: 'triage' },
      stats: [
        { label: 'Express Delivery', value: 'Same-Day' },
        { label: 'Authentic Medications', value: '100% Genuine' },
        { label: 'Licensed Pharmacy', value: 'Certified' },
      ],
    },
  ];

  // Mobile App Dedicated Slides (Simple, clean, stylish typography with Framer Motion)
  const mobileAppSlides = [
    {
      id: 0,
      badge: 'Instant AI Symptom Triage',
      badgeIcon: Sparkles,
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200/80',
      titlePrimary: 'How are you feeling today?',
      titleAccent: 'Match with a doctor in 60s.',
      subtitle: 'Describe your symptoms in natural words. Our clinical AI checks severity and connects you with available specialists.',
      hasInput: true,
      accentBg: 'from-sky-50 via-white to-slate-50',
    },
    {
      id: 1,
      badge: 'Verified Medical Directory',
      badgeIcon: Stethoscope,
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200/80',
      titlePrimary: 'Top Board-Certified Specialists',
      titleAccent: 'Ready for consults on your phone.',
      subtitle: 'Direct audio notes, live chat, and verified digital prescriptions across 14+ medical specialties.',
      hasInput: false,
      ctaText: 'Browse All Doctors',
      ctaHref: '/doctors',
      accentBg: 'from-sky-50 via-white to-slate-50',
    },
    {
      id: 2,
      badge: 'Live GPS Emergency Locator',
      badgeIcon: MapPin,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200/80',
      titlePrimary: 'Need Emergency Hospital Care?',
      titleAccent: 'Locate trauma centers near you.',
      subtitle: 'Live worldwide geolocation matching you to 24/7 accredited hospitals with live ER wait times and 1-tap navigation.',
      hasInput: false,
      ctaText: 'Find Nearest Hospital',
      ctaHref: '/hospitals',
      accentBg: 'from-rose-50 via-white to-slate-50',
    },
    {
      id: 3,
      badge: 'Digital Pharmacy & Delivery',
      badgeIcon: Pill,
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
      titlePrimary: 'Doctor Digital Prescriptions',
      titleAccent: 'Delivered directly to your door.',
      subtitle: 'Fulfill doctor prescriptions in 1-click or order certified everyday health essentials with express home dispatch.',
      hasInput: false,
      ctaText: 'Visit Pharmacy Store',
      ctaHref: '/pharmacy',
      accentBg: 'from-cyan-50 via-white to-slate-50',
    },
  ];

  // Auto-advance desktop slider
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  // Auto-advance mobile slider
  useEffect(() => {
    const interval = setInterval(() => {
      setMobileSlide((prev) => (prev + 1) % mobileAppSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [mobileAppSlides.length]);

  // Mobile Touch Swipe Handling
  const handleMobileTouchStart = (e: React.TouchEvent) => {
    mobileTouchStartX.current = e.touches[0].clientX;
  };

  const handleMobileTouchEnd = (e: React.TouchEvent) => {
    if (mobileTouchStartX.current === null) return;
    const diff = mobileTouchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      setMobileSlide((prev) => (prev + 1) % mobileAppSlides.length);
    } else if (diff < -40) {
      setMobileSlide((prev) => (prev - 1 + mobileAppSlides.length) % mobileAppSlides.length);
    }
    mobileTouchStartX.current = null;
  };

  // Desktop Slider Handlers
  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handleDesktopTouchStart = (e: React.TouchEvent) => {
    desktopTouchStartX.current = e.touches[0].clientX;
  };

  const handleDesktopTouchEnd = (e: React.TouchEvent) => {
    if (desktopTouchStartX.current === null) return;
    const diff = desktopTouchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNextSlide();
    else if (diff < -50) handlePrevSlide();
    desktopTouchStartX.current = null;
  };

  // Fetch real verified doctors and pharmacy products from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data: docs } = await supabase
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
          .limit(4);

        if (docs) {
          setVerifiedDoctors(docs as unknown as DoctorProfile[]);
        }

        const { data: products } = await supabase
          .from('products')
          .select('*')
          .limit(4);

        if (products) {
          setPharmacyProducts(products as PharmacyProduct[]);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoadingDocs(false);
      }
    }

    loadData();
  }, []);

  const specialties = [
    { name: 'General Practice', icon: Stethoscope, count: 'Available Now' },
    { name: 'Dermatology', icon: Smile, count: 'Skin & Rash' },
    { name: 'Pediatrics', icon: Baby, count: 'Child Health' },
    { name: 'Neurology', icon: Brain, count: 'Headache & Migraine' },
    { name: 'Cardiology', icon: HeartPulse, count: 'Heart Health' },
    { name: 'Orthopedics', icon: Bone, count: 'Joint & Bone' },
    { name: 'Ophthalmology', icon: Eye, count: 'Eye & Vision' },
    { name: 'Mental Health', icon: Activity, count: 'Stress & Anxiety' },
  ];

  const activeSlide = heroSlides[currentSlide];
  const activeMobileSlide = mobileAppSlides[mobileSlide];

  return (
    <div className="space-y-6 sm:space-y-12 pb-14">
      
      {/* ========================================================================= */}
      {/* 1A. MOBILE APP EXPERIENCE VIEW (NATIVE APP FEEL, DISTINCT & SIMPLE) */}
      {/* ========================================================================= */}
      <div className="block md:hidden px-4 pt-3 space-y-4">
        
        {/* App Greeting & Live Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Good day 👋</span>
              <span className="font-heading font-extrabold text-sm text-slate-900 leading-none">
                CLINIC Telehealth
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/70 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>24/7 AI & MDs Live</span>
          </div>
        </div>

        {/* Mobile Hero: Stylish Framer Motion Sliding Card Section */}
        <div
          onTouchStart={handleMobileTouchStart}
          onTouchEnd={handleMobileTouchEnd}
          className="relative overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm bg-gradient-to-b from-white to-slate-50/70 p-5"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMobileSlide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-3"
            >
              {/* Mini Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold">
                {React.createElement(activeMobileSlide.badgeIcon, { className: 'w-3 h-3 text-sky-600' })}
                <span className={activeMobileSlide.badgeColor}>{activeMobileSlide.badge}</span>
              </div>

              {/* Stylish Mobile H1 */}
              <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight leading-[1.18]">
                {activeMobileSlide.titlePrimary} <br />
                <span className="text-sky-600">{activeMobileSlide.titleAccent}</span>
              </h1>

              {/* Concise App Subtitle */}
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {activeMobileSlide.subtitle}
              </p>

              {/* Slide 0: Interactive App Symptom Search */}
              {activeMobileSlide.hasInput ? (
                <div className="space-y-2 pt-1">
                  <div className="p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <Activity className="w-4 h-4 text-sky-600 shrink-0" />
                      <input
                        type="text"
                        value={quickSymptom}
                        onChange={(e) => setQuickSymptom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsTriageOpen(true);
                        }}
                        placeholder="Describe how you feel (e.g. fever, headache)..."
                        className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                    </div>
                    <button
                      onClick={() => setIsTriageOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/25 active:scale-95 transition-transform"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Check Symptoms & Connect</span>
                    </button>
                  </div>

                  {/* Horizontal Scrollable Quick Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Common:</span>
                    {['Migraine', 'Skin Rash', 'Fever & Cough', 'Back Pain', 'Anxiety'].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setQuickSymptom(chip);
                          setIsTriageOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold shrink-0 active:bg-sky-50 hover:text-sky-700 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <Link
                    href={activeMobileSlide.ctaHref || '/doctors'}
                    className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-500/25 active:scale-95 transition-transform"
                  >
                    <span>{activeMobileSlide.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Slider Progress Dots */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {mobileAppSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setMobileSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === mobileSlide ? 'w-6 bg-sky-600' : 'w-1.5 bg-slate-200'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              0{mobileSlide + 1} / 0{mobileAppSlides.length}
            </span>
          </div>
        </div>

        {/* 4 App-Style Quick Launch Tiles */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <Link
            href="/doctors"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-50 border border-sky-100/80 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-[11px] text-slate-900 text-center leading-tight">
              Doctor Consult
            </span>
          </Link>

          <button
            onClick={() => setIsTriageOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-50 border border-purple-100/80 active:scale-95 transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-[11px] text-slate-900 text-center leading-tight">
              AI Triage
            </span>
          </button>

          <Link
            href="/hospitals"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-rose-50 border border-rose-100/80 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-[11px] text-slate-900 text-center leading-tight">
              Find Hospitals
            </span>
          </Link>

          <Link
            href="/pharmacy"
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-cyan-50 border border-cyan-100/80 active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Pill className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-[11px] text-slate-900 text-center leading-tight">
              Pharmacy
            </span>
          </Link>
        </div>

        {/* Mobile Specialties App Horizontal Scroller */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-heading font-bold text-sm text-slate-900">Medical Specialties</span>
            <Link href="/doctors" className="text-[11px] font-bold text-sky-700 flex items-center gap-0.5">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            {specialties.map((spec) => {
              const Icon = spec.icon;
              return (
                <Link
                  key={spec.name}
                  href={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                  className="snap-start flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs shrink-0 w-28 active:border-sky-500 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-heading font-bold text-xs text-slate-900 text-center truncate w-full">
                    {spec.name}
                  </span>
                  <span className="text-[10px] text-slate-500 text-center mt-0.5 truncate w-full">
                    {spec.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Live Emergency Hospital Callout Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950 text-white border border-rose-500/30 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Live Hospital Locator
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Worldwide GPS</span>
          </div>

          <div>
            <h4 className="font-heading font-extrabold text-sm text-white">Need an accredited Emergency Room?</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Track 30+ hospitals nearest to your live position with ER wait times and direct GPS navigation.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Link
              href="/hospitals"
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open Hospital Map</span>
            </Link>
            <a
              href="tel:911"
              className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>911</span>
            </a>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1B. DESKTOP FULL-SCREEN 100VH CINEMATIC SLIDER VIEW (HIDDEN ON MOBILE) */}
      {/* ========================================================================= */}
      <section 
        className="hidden md:flex relative overflow-hidden bg-slate-950 text-white h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] min-h-[580px] max-h-[960px] flex-col justify-between"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleDesktopTouchStart}
        onTouchEnd={handleDesktopTouchEnd}
      >
        {/* Background Image Carousel with Smooth Crossfade */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="absolute inset-0"
            >
              <Image
                src={activeSlide.image}
                alt={activeSlide.imageAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-top sm:object-center"
              />
            </motion.div>
          </AnimatePresence>

          {/* Desktop high-contrast gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/35" />
          <div className="absolute inset-0 bg-radial-[at_top_left] from-sky-900/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Hero Content Container - Vertically Centered */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-4 flex-1 flex flex-col justify-center w-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              {/* Trust Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide mb-3 backdrop-blur-md shadow-xs"
              >
                {React.createElement(activeSlide.badgeIcon, { className: 'w-3.5 h-3.5' })}
                <span className={activeSlide.badgeColor}>{activeSlide.badge}</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="font-heading font-extrabold text-4xl lg:text-5xl text-white tracking-tight leading-[1.16] mb-3"
              >
                {activeSlide.titlePrimary} <br />
                <span className="text-sky-400">{activeSlide.titleAccent}</span>
              </motion.h1>

              {/* Clinical Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="text-base text-slate-300 max-w-xl leading-relaxed mb-5 font-normal"
              >
                {activeSlide.subtitle}
              </motion.p>

              {/* Dynamic Slide Content: Input Bar on Slide 0, CTAs on Slide 1 & 2 */}
              {activeSlide.hasInput ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                  className="space-y-2.5"
                >
                  {/* Direct Input & Flagship CTA Form */}
                  <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-2 shadow-xl">
                    <div className="flex items-center gap-2.5 w-full px-3">
                      <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                      <input
                        type="text"
                        value={quickSymptom}
                        onChange={(e) => setQuickSymptom(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsTriageOpen(true);
                        }}
                        placeholder="Describe symptoms (e.g. migraine, fever, rash)..."
                        className="w-full text-sm text-white placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                    </div>

                    {/* Primary Flagship Button */}
                    <button
                      onClick={() => setIsTriageOpen(true)}
                      className="px-5 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-heading font-extrabold text-sm flex items-center justify-center gap-2 shrink-0 transition-all shadow-md shadow-sky-400/25 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Check Symptoms & Connect</span>
                    </button>
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-slate-400 text-[11px] font-semibold mr-1 shrink-0">Popular:</span>
                    {['Severe Migraine', 'Skin Rash', 'Cough & Fever', 'Lower Back Pain', 'Chest Tightness'].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setQuickSymptom(chip);
                          setIsTriageOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white text-[11px] font-medium transition-colors shrink-0"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                  className="flex items-center gap-2.5"
                >
                  {activeSlide.primaryCta && (
                    <Link
                      href={activeSlide.primaryCta.href}
                      className="px-5 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-heading font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-400/25 active:scale-95"
                    >
                      <span>{activeSlide.primaryCta.text}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {activeSlide.secondaryCta && (
                    <button
                      onClick={() => setIsTriageOpen(true)}
                      className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all backdrop-blur-md"
                    >
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>{activeSlide.secondaryCta.text}</span>
                    </button>
                  )}
                  {activeSlide.id === 1 && (
                    <Link
                      href="/hospitals"
                      className="px-4 py-3 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all border border-rose-500/30"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Find Nearest Hospital</span>
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Slide Metric Tags */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.24 }}
                className="grid grid-cols-3 gap-3 pt-4 max-w-md"
              >
                {activeSlide.stats.map((s) => (
                  <div key={s.label} className="border-l border-sky-500/40 pl-2.5">
                    <div className="text-lg font-heading font-extrabold text-sky-400 leading-none">
                      {s.value}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium mt-0.5 leading-tight">
                      {s.label}
                    </div>
                  </div>
                ))}
              </motion.div>

            </motion.div>
          </AnimatePresence>

        </div>

        {/* Bottom Bar: Slide Controls & Progress Dots */}
        <div className="relative z-10 border-t border-white/10 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2.5 flex items-center justify-between">
            
            {/* Interactive Dot Indicators */}
            <div className="flex items-center gap-2">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide 
                      ? 'w-7 bg-sky-400 shadow-xs shadow-sky-400/50' 
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
              <span className="text-[11px] font-bold text-slate-400 ml-1.5 font-mono">
                0{currentSlide + 1} / 0{heroSlides.length}
              </span>
            </div>

            {/* Quick Proof Pills */}
            <div className="flex items-center gap-5 text-xs text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                Board-Certified Doctors
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Sub-60s AI Response
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                Same-Day Rx Delivery
              </span>
            </div>

            {/* Left / Right Arrow Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevSlide}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors focus:outline-none"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextSlide}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors focus:outline-none"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. SPECIALTY CATEGORIES (DESKTOP GRID) */}
      {/* ========================================================================= */}
      <section className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-heading">
              Clinical Specialties
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 mt-0.5">
              Browse by Department
            </h2>
          </div>
          <Link
            href="/doctors"
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 group"
          >
            <span>View All Doctors</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {specialties.map((spec) => {
            const Icon = spec.icon;
            return (
              <Link
                key={spec.name}
                href={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-sky-500 hover:shadow-md hover:shadow-sky-500/5 transition-all group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 group-hover:text-sky-700 transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {spec.count}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS (COMPACT WORKFLOW) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-8 relative overflow-hidden">
          <div className="max-w-2xl mb-5 sm:mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-heading">
              Streamlined Care
            </span>
            <h2 className="font-heading font-extrabold text-lg sm:text-3xl text-white mt-0.5">
              Healthcare without waiting rooms
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              From your initial symptom check to receiving doorstep medications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-extrabold flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-white">Describe How You Feel</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Type your symptoms in natural language. Our clinical AI screens for red flags and matches you with verified specialists.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-extrabold flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-white">Instant Specialist Match</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Connect with verified, board-certified doctors online. Review qualifications, hospital credentials, and consultation rates upfront.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-400 font-extrabold flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-white">Live Chat & Digital Rx</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                Consult via multi-modal chat with voice notes, image sharing, and instant digital prescriptions ready for doorstep pharmacy fulfillment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VERIFIED DOCTORS (STRICT ZERO DUMMY PROFILES) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3.5 sm:mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-heading">
              {profile?.role === 'doctor' ? 'Physician Practice Portal' : 'Certified Medical Directory'}
            </span>
            <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-slate-900 mt-0.5">
              {profile?.role === 'doctor' ? 'Your Clinical Practice Hub' : 'Verified Doctors Online'}
            </h2>
          </div>
          {profile?.role === 'doctor' ? (
            <Link
              href="/doctor/dashboard#patient-chats"
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 group"
            >
              <span>View Patient Inquiries</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              href="/doctors"
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 group"
            >
              <span>Search All Specialists</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {profile?.role === 'doctor' ? (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-sky-50 via-slate-50 to-cyan-50 border border-sky-200/80 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-heading font-extrabold text-xl shrink-0 shadow-sm shadow-sky-600/20">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Physician Practice Management
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Active Doctor Session
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl">
                  You are signed in as a certified practitioner. Access your live patient consultations, chat history, and digital prescription issuance in your dedicated doctor portal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <Link
                href="/doctor/dashboard"
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <span>Doctor Practice Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : loadingDocs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 sm:h-56 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : verifiedDoctors.length === 0 ? (
          <div className="p-5 sm:p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-2.5 max-w-xl mx-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xs sm:text-base text-slate-900">
                Are you a licensed medical doctor?
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto mt-0.5 leading-relaxed">
                We strictly enforce our <strong>Zero Dummy Profile Rule</strong>. All doctors must submit their medical credentials and license for credentialing verification prior to public directory listing.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/auth/signup?role=doctor"
                className="inline-block px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
              >
                Join Practice & Submit License
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {verifiedDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. PHARMACY E-COMMERCE PREVIEW */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3.5 sm:mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-heading">
              Certified Digital Pharmacy
            </span>
            <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-slate-900 mt-0.5">
              Medications & Health Essentials
            </h2>
          </div>
          <Link
            href="/pharmacy"
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 group"
          >
            <span>Visit Pharmacy Store</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {pharmacyProducts.length > 0 ? (
            pharmacyProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))
          ) : (
            [
              {
                id: '1',
                name: 'Amoxicillin 500mg',
                slug: 'amoxicillin-500mg',
                category: 'Prescription Medications',
                description: 'Broad-spectrum antibiotic for bacterial infections.',
                price: 14.5,
                stock_quantity: 100,
                requires_prescription: true,
                image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
                dosage_form: 'Capsules',
                rating: 4.9,
              },
              {
                id: '2',
                name: 'Ibuprofen 400mg Rapid Relief',
                slug: 'ibuprofen-400mg',
                category: 'Pain & Fever',
                description: 'Fast, targeted anti-inflammatory relief.',
                price: 8.99,
                stock_quantity: 200,
                requires_prescription: false,
                image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
                dosage_form: 'Tablets',
                rating: 4.85,
              },
              {
                id: '3',
                name: 'Cetirizine 10mg All-Day Allergy',
                slug: 'cetirizine-10mg',
                category: 'Allergy & Sinus',
                description: '24-hour non-drowsy relief from allergic rhinitis.',
                price: 11.2,
                stock_quantity: 150,
                requires_prescription: false,
                image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
                dosage_form: 'Tablets',
                rating: 4.78,
              },
              {
                id: '4',
                name: 'Digital Arm BP Monitor',
                slug: 'digital-bp-monitor',
                category: 'Medical Devices',
                description: 'Clinical accuracy upper-arm blood pressure monitor.',
                price: 45.0,
                stock_quantity: 40,
                requires_prescription: false,
                image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
                dosage_form: 'Device',
                rating: 4.88,
              },
            ].map((prod) => (
              <ProductCard key={prod.id} product={prod as PharmacyProduct} />
            ))
          )}
        </div>
      </section>

      {/* Flagship Guided Intake Modal */}
      <SymptomTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        initialSymptom={quickSymptom}
      />

    </div>
  );
}
