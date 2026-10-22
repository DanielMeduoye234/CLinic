'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { 
  Stethoscope, 
  User, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'doctor' ? 'doctor' : 'patient';

  const [role, setRole] = useState<'patient' | 'doctor'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { refreshProfile } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        throw error;
      }

      await refreshProfile();

      // Rule: Doctors must upload license & complete onboarding; Patients get signed in immediately
      if (role === 'doctor') {
        router.push('/doctor/onboarding');
      } else {
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl && redirectUrl !== '/') {
          router.push(redirectUrl);
        } else {
          router.push('/patient/consultations');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUrl = searchParams.get('redirect') || '/';

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/25">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          Join CLINIC Health
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Instant telemedicine, verified doctor consultations, and certified digital pharmacy.
        </p>
      </div>

      {searchParams.get('reason') === 'consultation' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Stethoscope className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Consultation Registration</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Create your confidential patient profile to immediately start chatting with your doctor.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Role Picker */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setRole('patient')}
          className={`py-3 px-3 rounded-xl font-heading font-bold text-xs flex flex-col items-center gap-1 transition-all ${
            role === 'patient'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-sky-600" />
          <span>I am a Patient</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`py-3 px-3 rounded-xl font-heading font-bold text-xs flex flex-col items-center gap-1 transition-all ${
            role === 'doctor'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-sky-600" />
          <span>I am a Doctor</span>
        </button>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSignUp} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-heading">
            {role === 'doctor' ? 'Professional Full Name (e.g. Dr. Alex Vance)' : 'Full Name *'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={role === 'doctor' ? 'Dr. Jane Doe, MD' : 'Jane Doe'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-600 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-heading">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-600 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-heading">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-600 focus:bg-white"
            />
          </div>
        </div>

        {role === 'doctor' && (
          <div className="p-3 bg-sky-50 border border-sky-200/80 rounded-xl text-[11px] text-sky-800 leading-snug">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-sky-600" />
            Doctors must upload their medical council license on the next screen before being reviewed and approved.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-99 transition-all cursor-pointer"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <span>{role === 'doctor' ? 'Continue to License Upload' : 'Create Patient Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center pt-2">
          Already have an account?{' '}
          <Link 
            href={`/auth/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}${searchParams.get('reason') ? `&reason=${searchParams.get('reason')}` : ''}` : ''}`} 
            className="text-sky-700 font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>

      </form>

    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">Loading Registration...</div>}>
      <SignUpContent />
    </Suspense>
  );
}

