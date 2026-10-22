'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  User, 
  ShieldCheck, 
  Heart, 
  FileText, 
  Activity, 
  ShoppingBag, 
  Plus, 
  X,
  Phone,
  AlertCircle,
  LogOut
} from 'lucide-react';

export default function PatientProfilePage() {
  const { user, profile } = useAuth();

  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Peanuts']);
  const [newAllergy, setNewAllergy] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>(['Mild Asthma']);
  const [newCondition, setNewCondition] = useState('');
  const [emergencyContact, setEmergencyContact] = useState({
    name: 'Robert Jenkins (Spouse)',
    phone: '+1 (555) 987-6543',
  });
  const [savedMessage, setSavedMessage] = useState(false);

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allg: string) => {
    setAllergies(allergies.filter((a) => a !== allg));
  };

  const addCondition = () => {
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      setChronicConditions([...chronicConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (c: string) => {
    setChronicConditions(chronicConditions.filter((item) => item !== c));
  };

  const handleSaveVault = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-sky-700 text-xs font-bold uppercase tracking-wider font-heading mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Encrypted Health Record</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            Medical Vault & Patient Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Your personal clinical history, drug allergies, and active consultations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/patient/dashboard"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            ← Dashboard
          </Link>
          <Link
            href="/doctors"
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs shadow-sm shadow-sky-500/20 transition-all"
          >
            Consult Doctor
          </Link>
          <Link
            href="/auth/logout"
            className="p-2 rounded-xl text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
          </Link>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs font-semibold text-sky-800">
          ✓ Medical vault updated and encrypted successfully.
        </div>
      )}

      {/* Profile Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 font-heading font-bold text-2xl flex items-center justify-center shrink-0">
          {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'P'}
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900">
            {profile?.full_name || 'Verified Patient'}
          </h2>
          <p className="text-xs text-slate-500">{user?.email || 'patient@clinic.health'}</p>
          <span className="inline-block mt-1 bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded">
            Patient ID: {user?.id?.slice(0, 8) || 'CLINIC-PT-8839'}
          </span>
        </div>
      </div>

      {/* Form: Medical Vault Details */}
      <form onSubmit={handleSaveVault} className="space-y-6">
        
        {/* Blood Group & Emergency Contact */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Emergency Vitals & Contacts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Emergency Phone
              </label>
              <input
                type="text"
                value={emergencyContact.phone}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Drug & Substance Allergies */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Documented Allergies & Drug Reactions</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {allergies.map((allg) => (
              <span
                key={allg}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
              >
                <span>{allg}</span>
                <button
                  type="button"
                  onClick={() => removeAllergy(allg)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Add allergy (e.g. Sulfa, Latex)"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-sky-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
            >
              Add
            </button>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Pre-existing / Chronic Conditions</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {chronicConditions.map((cond) => (
              <span
                key={cond}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-semibold"
              >
                <span>{cond}</span>
                <button
                  type="button"
                  onClick={() => removeCondition(cond)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Add condition (e.g. Hypertension)"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-sky-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={addCondition}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
        >
          Save Encrypted Vault
        </button>

      </form>

    </div>
  );
}
