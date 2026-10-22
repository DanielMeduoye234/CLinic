'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  CheckCircle2, 
  Home, 
  LogIn, 
  ShieldCheck, 
  ShoppingBag, 
  Building2, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

function LogoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const autoParam = searchParams.get('auto');
  const { signOut } = useAuth();

  const [loggedOut, setLoggedOut] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(autoParam === 'true' ? 3 : null);

  useEffect(() => {
    let isMounted = true;

    const performLogout = async () => {
      try {
        await signOut();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        if (isMounted) {
          setLoggedOut(true);
        }
      }
    };

    performLogout();

    return () => {
      isMounted = false;
    };
  }, [signOut]);

  // Handle optional automatic redirect countdown if requested via ?auto=true
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(redirectParam || '/');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, redirectParam, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 p-8 sm:p-10 text-center space-y-6">
        
        {/* Animated Status Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-sky-50 border border-sky-100 animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/25">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Session Closed Securely</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            You Have Been Signed Out
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your clinical account and personal medical vault have been safely locked. Where would you like to go next?
          </p>
        </div>

        {/* Primary Destination Actions */}
        <div className="space-y-3 pt-2">
          {/* 1. Homepage */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-heading font-bold text-sm shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>

          {/* 2. Authentication / Sign In */}
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-heading font-bold text-sm border border-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogIn className="w-4 h-4 text-sky-700" />
            <span>Sign In to Another Account</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
          </Link>
        </div>

        {/* Secondary Quick Access Links */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Public Clinical Resources
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <Link
              href="/pharmacy"
              className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-slate-700 group-hover:text-sky-800">
                <ShoppingBag className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold font-heading">Pharmacy</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Direct medication delivery</p>
            </Link>

            <Link
              href="/hospitals"
              className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 transition-all group"
            >
              <div className="flex items-center gap-2 text-slate-700 group-hover:text-sky-800">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold font-heading">Hospitals</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Emergency directory</p>
            </Link>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Protected by CLINIC End-to-End HIPAA Standard</span>
        </div>

      </div>
    </div>
  );
}

function LogoutSkeleton() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-100 p-8 sm:p-10 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="relative w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/25">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Session Closed Securely</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Signed Out Successfully
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your clinical account and personal medical vault have been safely locked.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-heading font-bold text-sm shadow-md shadow-sky-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-sm border border-slate-200"
          >
            <LogIn className="w-4 h-4 text-sky-700" />
            <span>Sign In Again</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={<LogoutSkeleton />}>
      <LogoutContent />
    </Suspense>
  );
}
