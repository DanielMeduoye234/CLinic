'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Lock, 
  Activity, 
  FileCheck2, 
  ExternalLink,
  Heart
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-10 pb-8 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. Sleek Clinical Emergency Action Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative flex h-3.5 w-3.5 mt-0.5 sm:mt-0 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-rose-400">
                  Critical Emergency Safety Notice
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold hidden sm:inline-block">
                  Immediate 911 Protocol
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                If you have chest pain, shortness of breath, sudden numbness, or acute trauma, dial 911 or visit the nearest emergency room immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <Link
              href="/hospitals"
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Find Nearest Hospital</span>
            </Link>
            <a
              href="tel:911"
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-rose-600/30"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 911</span>
            </a>
          </div>
        </div>

        {/* 2. Structured 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 pb-8 border-b border-slate-800/80">
          
          {/* Col 1: Brand & Clinical Accreditation */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/25">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-sky-400 transition-colors leading-none">
                CLINIC<span className="text-sky-500">.</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              Instant AI symptom triage, verified doctor consultations, doorstep digital prescriptions, and local emergency hospital matching.
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-300 bg-sky-950/50 border border-sky-800/60 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Telehealth & AI Systems Online
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>100% Board-Certified Doctors</span>
              </div>
            </div>
          </div>

          {/* Col 2: For Patients */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-heading">
              For Patients
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/doctors" className="hover:text-sky-400 transition-colors">Find a Doctor</Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-sky-400 transition-colors flex items-center gap-1">
                  <span>Find Hospitals</span>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-bold">24/7</span>
                </Link>
              </li>
              <li>
                <Link href="/pharmacy" className="hover:text-sky-400 transition-colors">Digital Pharmacy</Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-sky-400 transition-colors">Patient Sign Up</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-sky-400 transition-colors">Account Portal</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Medical Providers */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-heading">
              For Providers
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/auth/signup?role=doctor" className="hover:text-sky-400 transition-colors">Join Practice as Doctor</Link>
              </li>
              <li>
                <Link href="/doctor/onboarding" className="hover:text-sky-400 transition-colors">Submit Medical License</Link>
              </li>
              <li>
                <Link href="/doctor/dashboard" className="hover:text-sky-400 transition-colors">Provider Dashboard</Link>
              </li>
              <li>
                <span className="text-slate-500">License Verification Guide</span>
              </li>
              <li>
                <span className="text-slate-500">Clinical Ethics Charter</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Hospital & Emergency Care */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-heading">
              Emergency Services
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/hospitals" className="hover:text-sky-400 transition-colors">Level 1 Trauma Units</Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-sky-400 transition-colors">Pediatric Emergency ER</Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-sky-400 transition-colors">Chest Pain & Stroke Centers</Link>
              </li>
              <li>
                <Link href="/hospitals" className="hover:text-sky-400 transition-colors">Walk-In Urgent Clinics</Link>
              </li>
              <li>
                <a href="tel:911" className="text-rose-400 hover:text-rose-300 font-bold">Emergency Hotline: 911</a>
              </li>
            </ul>
          </div>

          {/* Col 5: Clinical Governance & Compliance */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 font-heading">
              Compliance & Security
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              All doctors undergo state medical board license credentialing. Zero unverified profiles permitted.
            </p>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] bg-slate-900 text-sky-300 px-2.5 py-1 rounded-md font-semibold border border-slate-800">
                <Lock className="w-3 h-3 text-sky-400" />
                HIPAA & SOC-2 Aligned
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md font-semibold border border-slate-800 block">
                <FileCheck2 className="w-3 h-3 text-slate-400" />
                256-Bit TLS Vault Encryption
              </span>
            </div>
          </div>

        </div>

        {/* 3. Bottom Legal & Disclaimer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 pt-2">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} CLINIC Health Systems Inc. Telehealth & Triage Engine. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Clinical Care</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Patient Bill of Rights</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Designed with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for accessible healthcare
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
