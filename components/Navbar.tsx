'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { 
  Stethoscope, 
  ShoppingBag, 
  Menu, 
  X, 
  User, 
  ShieldCheck, 
  LogOut, 
  Activity,
  FileText,
  Clock
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, doctorProfile, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
              <Stethoscope className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors leading-none">
                CLINIC<span className="text-teal-600">.</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-600 hidden sm:block mt-0.5">
                Instant Telehealth
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link 
              href="/doctors" 
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/doctors') 
                  ? 'text-teal-700 bg-teal-50 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Find Doctors
            </Link>
            <Link 
              href="/hospitals" 
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/hospitals') 
                  ? 'text-teal-700 bg-teal-50 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>Find Hospitals</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            </Link>
            <Link 
              href="/pharmacy" 
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname.startsWith('/pharmacy') 
                  ? 'text-teal-700 bg-teal-50 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Pharmacy Store
            </Link>
          </nav>


          {/* Right Action Icons (Cart & Auth) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Pharmacy Cart Trigger */}
            <button
              onClick={openCart}
              aria-label="View Cart"
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-teal-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                {profile?.role === 'doctor' ? (
                  <Link
                    href="/doctor/dashboard"
                    className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/60 hover:bg-teal-100 transition-colors"
                  >
                    {doctorProfile?.is_verified ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{doctorProfile?.is_verified ? 'Doctor Dashboard' : 'Pending Approval'}</span>
                  </Link>
                ) : (
                  <Link
                    href="/patient/consultations"
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    <span>My Consultations</span>
                  </Link>
                )}

                <div className="relative group">
                  <button 
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 transition-colors"
                    aria-label="User Menu"
                  >
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{profile?.full_name || user.email}</p>
                      <p className="text-[11px] text-slate-600 capitalize font-medium">{profile?.role || 'Patient'}</p>
                    </div>

                    {profile?.role === 'doctor' && (
                      <Link
                        href="/doctor/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors mt-1"
                      >
                        <FileText className="w-4 h-4 text-teal-600" />
                        Doctor Practice Portal
                      </Link>
                    )}

                    <Link
                      href="/patient/profile"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Medical Profile
                    </Link>

                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden md:inline-flex px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup?role=doctor"
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 hover:bg-teal-100 transition-all"
                >
                  Join as Doctor
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>

        </div>
      </div>

      {/* Enhanced Native Mobile App Drawer (Slide-Over Sheet via Portal) */}
      {mounted && mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden flex flex-col justify-end">
          {/* Opaque Full-Screen Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Solid White App Sheet */}
          <div 
            className="relative w-full max-h-[90dvh] bg-white rounded-t-3xl shadow-2xl flex flex-col border-t border-slate-200 z-10 overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/20">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="font-heading font-extrabold text-lg text-slate-900">
                  CLINIC<span className="text-teal-600">.</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                  Mobile App
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-5 py-4 space-y-4 pb-8">
              {/* User Account Card */}
              {!user ? (
                <div className="p-3.5 bg-gradient-to-r from-teal-50 to-slate-50 rounded-2xl border border-teal-100 space-y-2.5">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900">Welcome to CLINIC Telehealth</h4>
                    <p className="text-[11px] text-slate-500">Sign in for instant doctor consults and digital prescriptions</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs hover:bg-slate-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-teal-600 text-white shadow-xs hover:bg-teal-700"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center font-heading">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900">{profile?.full_name || 'Patient'}</h4>
                      <p className="text-[11px] text-slate-500 capitalize">{profile?.role || 'Patient'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}

              {/* Native App Navigation List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Main Services
                </span>

                <Link
                  href="/doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50 text-slate-800 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-xs text-slate-900">Find Doctors</div>
                      <div className="text-[10px] text-slate-500">14+ specialties, verified board licenses</div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">→</span>
                </Link>

                <Link
                  href="/hospitals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50 text-slate-800 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-xs text-slate-900">Find Hospitals & ER</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      </div>
                      <div className="text-[10px] text-slate-500">Live worldwide GPS emergency locator</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">GPS Live</span>
                </Link>

                <Link
                  href="/pharmacy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50 text-slate-800 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-xs text-slate-900">Digital Pharmacy</div>
                      <div className="text-[10px] text-slate-500">Express doorstep medication delivery</div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">→</span>
                </Link>

                {user && (
                  <Link
                    href="/patient/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50 text-slate-800 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-xs text-slate-900">My Health Vault</div>
                        <div className="text-[10px] text-slate-500">Consultation notes, prescriptions & records</div>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs font-bold">→</span>
                  </Link>
                )}
              </div>

              {/* Provider Section */}
              <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-xs text-slate-900 block">Licensed Physician?</span>
                  <span className="text-[10px] text-slate-500">Join our verified telehealth practice</span>
                </div>
                <Link
                  href="/auth/signup?role=doctor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-700"
                >
                  Join Practice
                </Link>
              </div>

              {/* Emergency Action */}
              <a
                href="tel:911"
                className="py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Activity className="w-4 h-4" />
                <span>Medical Emergency: Call 911</span>
              </a>

              {/* Compliance Tag */}
              <div className="text-center text-[10px] text-slate-400 pt-1">
                CLINIC Telehealth • HIPAA & SOC-2 Aligned
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
