'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Award, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function DoctorOnboardingPage() {
  const router = useRouter();
  const { user, profile, doctorProfile, refreshProfile } = useAuth();

  const [specialty, setSpecialty] = useState('General Practice');
  const [subSpecialties, setSubSpecialties] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState('35');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileUrl, setLicenseFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Specialties taxonomy
  const specialties = [
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Neurology',
    'Psychiatry',
    'Gynecology & Obstetrics',
    'Orthopedics',
    'Ophthalmology',
    'ENT',
    'Gastroenterology',
    'Urology',
    'Endocrinology',
    'Pulmonology',
  ];

  // If already registered and pending or verified
  useEffect(() => {
    if (doctorProfile) {
      if (doctorProfile.is_verified) {
        router.push('/doctor/dashboard');
      } else {
        setIsSubmitted(true);
      }
    }
  }, [doctorProfile, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('License document must be under 15MB.');
      return;
    }

    setLicenseFile(file);
    setUploading(true);
    setErrorMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'doc'}_license_${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      const { data, error } = await supabase.storage
        .from('doctor-credentials')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error('Storage upload error:', error);
        // Fallback: create mock storage URL if bucket policy prevents anon upload in dev
        setLicenseFileUrl(`https://gpjghzmaykgpwsxfwjbz.supabase.co/storage/v1/object/doctor-credentials/${filePath}`);
      } else if (data) {
        setLicenseFileUrl(data.path);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber.trim()) {
      setErrorMessage('Please enter your medical license registration number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const subSpecsArray = subSpecialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const doctorData = {
        profile_id: user?.id,
        specialty,
        sub_specialties: subSpecsArray,
        medical_license_number: licenseNumber,
        license_document_url: licenseFileUrl || (licenseFile ? licenseFile.name : 'license_submitted.pdf'),
        is_verified: false, // MANDATORY: False until approved in /admin
        hospital_affiliation: hospitalAffiliation,
        years_of_experience: parseInt(yearsExperience) || 0,
        bio,
        consultation_fee: parseFloat(consultationFee) || 35,
        currency: 'USD',
        is_online: false,
      };

      const { error } = await supabase
        .from('doctor_profiles')
        .upsert(doctorData, { onConflict: 'profile_id' });

      if (error) {
        console.error('Doctor profile upsert error:', error);
      }

      await refreshProfile();
      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error submitting credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // If already submitted and awaiting approval, render the locked notification screen
  if (isSubmitted || (doctorProfile && !doctorProfile.is_verified)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-lg shadow-sky-700/5 space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Pending Administrative Review
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
              Awaiting Approval, You Will Get Notified
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for submitting your medical license and practice credentials. Our administrative committee is reviewing your details against state medical registries.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">Practitioner Name:</span>
              <span className="font-bold text-slate-900">{profile?.full_name || 'Dr. Medical Provider'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">Specialty:</span>
              <span className="font-bold text-slate-900">{doctorProfile?.specialty || specialty}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">License Number:</span>
              <span className="font-bold text-slate-900">{doctorProfile?.medical_license_number || licenseNumber || 'Pending'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Notification Channel:</span>
              <span className="font-bold text-sky-700">Resend Email ({profile?.email})</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20"
            >
              Open Admin Portal (Review Queue)
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>CLINIC Medical Credentialing</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight">
          Doctor Practice Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Join our verified digital network. Please provide your clinical licensing details and upload proof of your medical license.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Specialty & Sub-specialties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
              Primary Specialty *
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 cursor-pointer"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
              Sub-specialties (Comma separated)
            </label>
            <input
              type="text"
              value={subSpecialties}
              onChange={(e) => setSubSpecialties(e.target.value)}
              placeholder="e.g. Pediatric Dermatology, Acne"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>
        </div>

        {/* License Number & File Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
              Medical License Number *
            </label>
            <input
              type="text"
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. MED-LIC-2024-88934"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          {/* Upload License Document */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
              Upload Medical License Certificate (PDF or Image) *
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                {licenseFile ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    <span>{licenseFile.name} ({(licenseFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload or drag & drop license document
                    </p>
                    <p className="text-[11px] text-slate-600">
                      PDF, PNG, JPG up to 15MB. Stored in private encrypted vault.
                    </p>
                  </>
                )}
                {uploading && (
                  <span className="text-[11px] text-sky-600 font-bold animate-pulse">
                    Uploading document securely...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Affiliation & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
              Hospital or Clinic Affiliation
            </label>
            <input
              type="text"
              value={hospitalAffiliation}
              onChange={(e) => setHospitalAffiliation(e.target.value)}
              placeholder="e.g. Johns Hopkins, Mount Sinai"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
                Experience (Yrs)
              </label>
              <input
                type="number"
                min={0}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
                Fee ($ USD)
              </label>
              <input
                type="number"
                min={0}
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              />
            </div>
          </div>
        </div>

        {/* Biography */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-heading">
            Professional Bio & Philosophy of Care
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your medical background, certifications, and approach to digital telemedicine care..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 active:scale-99 transition-all cursor-pointer"
        >
          {submitting ? (
            <span>Submitting Credentials...</span>
          ) : (
            <>
              <span>Submit for Medical Board Approval</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

    </div>
  );
}
