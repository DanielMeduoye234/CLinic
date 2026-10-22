'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Stethoscope, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  MessageSquare,
  ChevronRight,
  Activity
} from 'lucide-react';
import { DoctorProfile } from '@/lib/types';
import { GeminiTriageOutput } from '@/lib/gemini';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';

interface SymptomTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymptom?: string;
}

export default function SymptomTriageModal({
  isOpen,
  onClose,
  initialSymptom = '',
}: SymptomTriageModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Description, 2: Severity, 3: Analyzing, 4: Result
  const [symptoms, setSymptoms] = useState(initialSymptom);
  const [duration, setDuration] = useState('1-3 days');
  const [painLevel, setPainLevel] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triageResult, setTriageResult] = useState<GeminiTriageOutput | null>(null);
  const [matchedDoctors, setMatchedDoctors] = useState<DoctorProfile[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const quickSymptoms = [
    'Throbbing Migraine & Nausea',
    'Itchy Red Skin Rash',
    'High Fever & Dry Cough',
    'Severe Lower Back Pain',
    'Burning Acid Reflux',
    'Child has Persistent Vomiting',
  ];

  const handleStartAnalysis = async () => {
    if (!symptoms.trim()) {
      setErrorMessage('Please describe the symptoms you are experiencing.');
      return;
    }
    setErrorMessage('');
    setStep(3);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          duration,
          painLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete AI triage');
      }

      setTriageResult(data.triage);
      setMatchedDoctors(data.matchedDoctors || []);
      setIsEmergency(data.isEmergency);
      setStep(4);
    } catch (err: any) {
      console.error('Triage error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartConsultation = async (doctor: DoctorProfile) => {
    // If not signed in, route to sign in with consultation reason
    if (!user) {
      onClose();
      router.push(`/auth/login?redirect=/consultation/${doctor.id}&reason=consultation`);
      return;
    }

    if (profile?.role === 'doctor') {
      onClose();
      router.push('/doctor/dashboard');
      return;
    }

    try {
      // Create consultation record in Supabase
      const { data: consultation, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: user.id,
          doctor_id: doctor.id,
          raw_symptoms: symptoms,
          pain_level: painLevel,
          symptom_duration: duration,
          ai_urgency: triageResult?.urgency || 'routine',
          ai_recommended_specialty: triageResult?.primary_specialty || doctor.specialty,
          ai_triage_summary: triageResult?.patient_friendly_summary || '',
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating consultation record:', error);
      }

      onClose();
      const targetId = consultation?.id || doctor.id;
      router.push(`/consultation/${targetId}?doctorId=${doctor.id}`);
    } catch (e) {
      onClose();
      router.push(`/consultation/${doctor.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92dvh] flex flex-col"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  AI Symptom Assessment & Matching
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  Powered by Clinical Intelligence Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            {/* STEP 1: Symptom Input */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
                    What symptoms are you experiencing?
                  </label>
                  <textarea
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe how you feel in plain words (e.g., 'Throbbing headache on left side since yesterday, sensitive to bright light and feeling nauseous')..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Common Inquiries
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSymptoms.map((qs) => (
                      <button
                        key={qs}
                        type="button"
                        onClick={() => setSymptoms(qs)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 transition-colors border border-slate-200/60"
                      >
                        {qs}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!symptoms.trim()) {
                        setErrorMessage('Please describe your symptoms first.');
                        return;
                      }
                      setErrorMessage('');
                      setStep(2);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/20"
                  >
                    <span>Continue to Specialist Match</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Vitals & Context */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
                    How long have you had these symptoms?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['A few hours', '1-3 days', 'Over a week'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          duration === dur
                            ? 'bg-sky-50 border-sky-600 text-sky-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                      Pain or Discomfort Level (1 to 10)
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      {painLevel} / 10 — {painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : painLevel <= 8 ? 'Severe' : 'Very Severe'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-medium mt-1">
                    <span>1: Barely noticeable</span>
                    <span>5: Distracting</span>
                    <span>10: Unbearable</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="w-2/3 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Match with Verified Doctors</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Loading / Analyzing */}
            {step === 3 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-sky-600">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Analyzing Symptoms with Clinical AI...
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mt-1">
                    Screening clinical severity, determining recommended specialty, and querying live online verified doctors.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Results Screen */}
            {step === 4 && triageResult && (
              <div className="space-y-4">
                
                {/* EMERGENCY SCREENING TRIGGER */}
                {isEmergency ? (
                  <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-base text-rose-900">
                          Critical Emergency Detected
                        </h4>
                        <p className="text-xs text-rose-800 leading-relaxed mt-1">
                          {triageResult.emergency_instructions || 'Your symptoms indicate a potential life-threatening emergency. Do not wait for online chat. Call emergency services immediately.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <a
                        href="tel:911"
                        className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-md shadow-rose-600/30"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call 911 Emergency</span>
                      </a>
                      <button
                        onClick={onClose}
                        className="py-3 px-4 rounded-xl border border-rose-300 text-rose-800 font-bold text-xs hover:bg-rose-100/50"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 
                    // COMMENTED OUT AS PER CLINICAL REQUIREMENT: AI automated diagnosis removed so licensed physicians perform direct diagnosis.
                    <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-full">
                          Specialty: {triageResult.primary_specialty}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 capitalize">
                          Urgency: <strong className="text-sky-900">{triageResult.urgency}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {triageResult.patient_friendly_summary}
                      </p>
                    </div>
                    */}
                    <div className="p-4 bg-sky-50 border border-sky-200/80 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                          Recommended Specialty: {triageResult.primary_specialty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Connect with one of our licensed, board-certified physicians below to receive your personalized clinical evaluation and medical care.
                      </p>
                    </div>

                    {/* Matched Verified Doctors */}
                    <div>
                      <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900 mb-2">
                        Matched Verified Specialists ({matchedDoctors.length})
                      </h4>

                      {matchedDoctors.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                          <p className="text-xs text-slate-600">
                            No specialist in <strong>{triageResult.primary_specialty}</strong> is currently live online, but you can consult our on-duty General Practitioners.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              router.push('/doctors');
                            }}
                            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors"
                          >
                            Browse All Verified Doctors
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {matchedDoctors.map((doc) => {
                            const docName = (doc.profiles as any)?.full_name || 'Dr. Medical Specialist';
                            return (
                              <div
                                key={doc.id}
                                className="p-3.5 bg-white border border-slate-200 hover:border-sky-500 rounded-2xl transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="relative w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
                                    {docName.charAt(0)}
                                    {doc.is_online && (
                                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                    )}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h5 className="font-heading font-bold text-xs text-slate-900 group-hover:text-sky-700 transition-colors">
                                        {docName}
                                      </h5>
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-bold">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-medium">
                                      {doc.specialty} • {doc.years_of_experience} yrs exp
                                    </p>
                                    <p className="text-[10px] text-slate-600">
                                      {doc.hospital_affiliation || 'Clinical Medical Staff'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-1 shrink-0">
                                  <span className="font-heading font-bold text-xs text-slate-900">
                                    ${Number(doc.consultation_fee).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => handleStartConsultation(doc)}
                                    className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-sky-500/20 active:scale-95 transition-all"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>Start Chat</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <span>Clinical confidentiality protected</span>
            <span>CLINIC AI Triage Engine</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
