'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { refreshProfile } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if user is banned or suspended by admin
      const isRestricted = data.user.app_metadata?.moderation_status === 'banned' || 
                           data.user.app_metadata?.moderation_status === 'suspended' ||
                           Boolean(data.user.app_metadata?.is_banned) ||
                           Boolean(data.user.app_metadata?.is_suspended);

      if (isRestricted) {
        const statusType = data.user.app_metadata?.moderation_status || 'suspended';
        await supabase.auth.signOut();
        setErrorMessage(`Access Restricted: Your provider account has been ${statusType} by CLINIC administration. Login is disabled.`);
        return;
      }

      await refreshProfile();

      // Check if user is a doctor and needs onboarding review
      const { data: doc } = await supabase
        .from('doctor_profiles')
        .select('is_verified')
        .eq('profile_id', data.user.id)
        .maybeSingle();

      if (doc) {
        if (!doc.is_verified) {
          router.push('/doctor/onboarding');
          return;
        } else {
          router.push('/doctor/dashboard');
          return;
        }
      }

      router.push(redirectUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          Sign In to CLINIC
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Access your consultations, medical records, or provider dashboard.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-99 transition-all cursor-pointer"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center pt-2">
          Don&apos;t have an account yet?{' '}
          <Link href="/auth/signup" className="text-teal-700 font-bold hover:underline">
            Create an Account
          </Link>
        </p>

      </form>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center text-xs text-slate-500 font-bold">Loading Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}

