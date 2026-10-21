'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile } from '@/lib/types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Clock, 
  Search, 
  Mail, 
  ExternalLink, 
  Hospital, 
  AlertCircle,
  RefreshCw,
  Users,
  Stethoscope,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Ban,
  PauseCircle,
  PlayCircle,
  Pill,
  ShoppingBag,
  AlertTriangle,
  X,
  UserCheck,
  Lock
} from 'lucide-react';

interface PatientRecord {
  id: string;
  role: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  patient_medical_vault?: {
    blood_group?: string;
    allergies?: string[];
    chronic_conditions?: string[];
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  } | null;
}

interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  image_url: string;
  dosage_form?: string;
  active_ingredients?: string;
  rating?: number;
  created_at?: string;
}

export default function AdminDashboardPage() {
  const [activeMainTab, setActiveMainTab] = useState<'doctors' | 'patients' | 'products'>('doctors');
  
  // Doctors State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorSubFilter, setDoctorSubFilter] = useState<'all' | 'pending' | 'verified' | 'restricted'>('all');
  const [doctorSearch, setDoctorSearch] = useState('');
  
  // Patients State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [deletingPatient, setDeletingPatient] = useState<PatientRecord | null>(null);

  // Products State
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductRecord | null>(null);

  // Form State for Product Create / Edit
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Prescription Medications',
    description: '',
    price: '',
    stock_quantity: '100',
    requires_prescription: false,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    dosage_form: 'Tablets',
    active_ingredients: ''
  });

  // Global Loading & Message
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors');
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors || []);
      }
    } catch (err: any) {
      console.warn('Error fetching admin doctors:', err.message);
    }
  };

  // 2. Fetch Patients
  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/admin/patients');
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients || []);
      }
    } catch (err: any) {
      console.warn('Error fetching admin patients:', err.message);
    }
  };

  // 3. Fetch Products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err: any) {
      console.warn('Error fetching admin products:', err.message);
    }
  };

  // Security Passcode Gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('clinic_admin_passcode_auth');
      if (stored === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toUpperCase() === 'CLINIC') {
      setIsAuthenticated(true);
      setPasscodeError(false);
      sessionStorage.setItem('clinic_admin_passcode_auth', 'true');
    } else {
      setPasscodeError(true);
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('clinic_admin_passcode_auth');
    setIsAuthenticated(false);
    setPasscode('');
  };

  const loadAllData = async () => {
    setLoading(true);
    setStatusMessage(null);
    await Promise.all([fetchDoctors(), fetchPatients(), fetchProducts()]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Doctor Moderation Action (Approve, Suspend, Ban, Reinstate)
  const handleModerateDoctor = async (doctorId: string, action: 'approve' | 'suspend' | 'ban' | 'reinstate', docName: string) => {
    setProcessingId(doctorId);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/moderate-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} doctor`);
      }

      setStatusMessage({
        type: 'success',
        text: data.message || `Dr. ${docName} successfully updated.`
      });

      // Refresh doctor list
      await fetchDoctors();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || `Error executing ${action} on doctor` });
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Patient
  const handleDeletePatient = async () => {
    if (!deletingPatient) return;
    setProcessingId(deletingPatient.id);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/patients?id=${deletingPatient.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete patient');
      }

      setStatusMessage({
        type: 'success',
        text: `Patient ${deletingPatient.full_name || deletingPatient.email} has been permanently deleted from records.`
      });

      setDeletingPatient(null);
      await fetchPatients();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting patient' });
    } finally {
      setProcessingId(null);
    }
  };

  // Product Create or Update Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('product-saving');
    setStatusMessage(null);

    try {
      const isEditing = Boolean(editingProduct);
      const endpoint = '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing 
        ? { id: editingProduct!.id, ...productForm }
        : { ...productForm };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setStatusMessage({
        type: 'success',
        text: isEditing 
          ? `Product "${productForm.name}" updated successfully.`
          : `New product "${productForm.name}" added to pharmacy catalog.`
      });

      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving product' });
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setProcessingId(deletingProduct.id);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/products?id=${deletingProduct.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setStatusMessage({
        type: 'success',
        text: `Product "${deletingProduct.name}" removed from catalog.`
      });

      setDeletingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting product' });
    } finally {
      setProcessingId(null);
    }
  };

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Prescription Medications',
      description: '',
      price: '',
      stock_quantity: '100',
      requires_prescription: false,
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Tablets',
      active_ingredients: ''
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: ProductRecord) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      requires_prescription: product.requires_prescription,
      image_url: product.image_url,
      dosage_form: product.dosage_form || 'Tablets',
      active_ingredients: product.active_ingredients || ''
    });
    setIsProductModalOpen(true);
  };

  // Filtered Doctors
  const filteredDoctors = doctors.filter((doc) => {
    const isRestricted = doc.auth_meta?.is_banned || doc.auth_meta?.is_suspended || doc.auth_meta?.moderation_status === 'banned' || doc.auth_meta?.moderation_status === 'suspended';
    const isPending = !doc.is_verified && !isRestricted;
    const isVerified = doc.is_verified && !isRestricted;

    if (doctorSubFilter === 'pending' && !isPending) return false;
    if (doctorSubFilter === 'verified' && !isVerified) return false;
    if (doctorSubFilter === 'restricted' && !isRestricted) return false;

    const name = (doc.profiles as any)?.full_name?.toLowerCase() || '';
    const email = (doc.profiles as any)?.email?.toLowerCase() || '';
    const specialty = doc.specialty?.toLowerCase() || '';
    const lic = doc.medical_license_number?.toLowerCase() || '';
    const q = doctorSearch.toLowerCase();

    return name.includes(q) || email.includes(q) || specialty.includes(q) || lic.includes(q);
  });

  // Filtered Patients
  const filteredPatients = patients.filter((patient) => {
    const name = patient.full_name?.toLowerCase() || '';
    const email = patient.email?.toLowerCase() || '';
    const phone = patient.phone?.toLowerCase() || '';
    const q = patientSearch.toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  // Filtered Products
  const productCategories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((prod) => {
    if (productCategoryFilter !== 'All' && prod.category !== productCategoryFilter) {
      return false;
    }
    const name = prod.name.toLowerCase();
    const desc = prod.description.toLowerCase();
    const act = (prod.active_ingredients || '').toLowerCase();
    const q = productSearch.toLowerCase();
    return name.includes(q) || desc.includes(q) || act.includes(q);
  });

  // Computed Counters
  const pendingCount = doctors.filter((d) => !d.is_verified && !d.auth_meta?.is_banned && !d.auth_meta?.is_suspended).length;
  const verifiedCount = doctors.filter((d) => d.is_verified && !d.auth_meta?.is_banned && !d.auth_meta?.is_suspended).length;
  const restrictedCount = doctors.filter((d) => d.auth_meta?.is_banned || d.auth_meta?.is_suspended || d.auth_meta?.moderation_status === 'banned' || d.auth_meta?.moderation_status === 'suspended').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-heading">
              Restricted Area
            </span>
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 mt-2">
              Admin Governance Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the master administrator passcode to access clinical credentials and database governance.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Master Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPasscodeError(false);
                }}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono tracking-widest bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-center uppercase"
              />
            </div>

            {passcodeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid Master Passcode. Access Denied.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs tracking-wide shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            CLINIC Health • Medical Board System Administration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider font-heading mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Administrative Governance Console</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            CLINIC Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage provider credentials & suspensions, moderate patient accounts, and curate the digital pharmacy catalog.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>

          <button
            onClick={handleLockAdmin}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Lock Admin Portal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="block text-[11px] sm:text-xs font-bold uppercase text-slate-500 font-heading">
              Pending Doctors
            </span>
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              {pendingCount}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="block text-[11px] sm:text-xs font-bold uppercase text-slate-500 font-heading">
              Verified Doctors
            </span>
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              {verifiedCount}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="block text-[11px] sm:text-xs font-bold uppercase text-slate-500 font-heading">
              Total Patients
            </span>
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              {patients.length}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="block text-[11px] sm:text-xs font-bold uppercase text-slate-500 font-heading">
              Pharmacy Items
            </span>
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              {products.length}
            </span>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div 
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveMainTab('doctors')}
          className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeMainTab === 'doctors'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors & Licensing</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
            {doctors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('patients')}
          className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeMainTab === 'patients'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patients Directory</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('products')}
          className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeMainTab === 'products'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Pharmacy Products</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
            {products.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DOCTORS MANAGEMENT */}
      {activeMainTab === 'doctors' && (
        <div className="space-y-6">
          {/* Sub Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setDoctorSubFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  doctorSubFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({doctors.length})
              </button>
              <button
                onClick={() => setDoctorSubFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  doctorSubFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Pending Review ({pendingCount})
              </button>
              <button
                onClick={() => setDoctorSubFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  doctorSubFilter === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Verified Active ({verifiedCount})
              </button>
              <button
                onClick={() => setDoctorSubFilter('restricted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  doctorSubFilter === 'restricted'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Suspended / Banned ({restrictedCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search name, specialty, license..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Doctor List */}
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading doctor profiles...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-heading font-bold text-slate-700 text-sm">No doctors match this filter</h4>
              <p className="text-xs text-slate-500">Try adjusting your search criteria or sub-filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => {
                const isRestricted = doc.auth_meta?.is_banned || doc.auth_meta?.is_suspended || doc.auth_meta?.moderation_status === 'banned' || doc.auth_meta?.moderation_status === 'suspended';
                const isBanned = doc.auth_meta?.is_banned || doc.auth_meta?.moderation_status === 'banned';
                const isSuspended = doc.auth_meta?.is_suspended || doc.auth_meta?.moderation_status === 'suspended';
                const isVerified = doc.is_verified && !isRestricted;
                const isPending = !doc.is_verified && !isRestricted;
                const docName = (doc.profiles as any)?.full_name || 'Physician';
                const docEmail = (doc.profiles as any)?.email || '';

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      isBanned 
                        ? 'border-rose-300 bg-rose-50/20' 
                        : isSuspended 
                        ? 'border-amber-300 bg-amber-50/20' 
                        : isPending 
                        ? 'border-amber-200' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 font-bold font-heading flex items-center justify-center text-lg">
                            {docName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-bold text-base text-slate-900 leading-tight">
                                Dr. {docName}
                              </h3>
                            </div>
                            <span className="text-xs text-teal-700 font-semibold">{doc.specialty}</span>
                            <span className="text-xs text-slate-400 block">{docEmail}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isBanned ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Ban className="w-3 h-3 text-rose-600" />
                            <span>Banned</span>
                          </span>
                        ) : isSuspended ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <PauseCircle className="w-3 h-3 text-amber-600" />
                            <span>Suspended</span>
                          </span>
                        ) : isVerified ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>

                      {/* Doctor Credential Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">License Number</span>
                          <span className="font-mono font-bold text-slate-800">{doc.medical_license_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Affiliation</span>
                          <span className="font-semibold text-slate-700 truncate block">{doc.hospital_affiliation || 'General Telehealth'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Experience</span>
                          <span className="font-semibold text-slate-700">{doc.years_of_experience || 0} years</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Consultation Fee</span>
                          <span className="font-semibold text-slate-700">${doc.consultation_fee || 35}</span>
                        </div>
                      </div>

                      {/* Suspension Reason Warning */}
                      {isRestricted && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            {isBanned 
                              ? 'This doctor has been permanently banned. Auth login attempts are strictly blocked.' 
                              : 'This doctor is suspended. Login access is currently revoked.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {doc.license_document_url ? (
                        <a
                          href={doc.license_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View License</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No document file</span>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Pending Approvals */}
                        {isPending && (
                          <button
                            onClick={() => handleModerateDoctor(doc.id, 'approve', docName)}
                            disabled={processingId === doc.id}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{processingId === doc.id ? 'Approving...' : 'Approve Doctor'}</span>
                          </button>
                        )}

                        {/* Verified / Active Actions */}
                        {isVerified && (
                          <>
                            <button
                              onClick={() => {
                                if (confirm(`Suspend Dr. ${docName}? They will not be able to log in or see consultations for 30 days.`)) {
                                  handleModerateDoctor(doc.id, 'suspend', docName);
                                }
                              }}
                              disabled={processingId === doc.id}
                              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Suspend</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Permanently BAN Dr. ${docName} from the platform? Their account will be locked indefinitely.`)) {
                                  handleModerateDoctor(doc.id, 'ban', docName);
                                }
                              }}
                              disabled={processingId === doc.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Ban</span>
                            </button>
                          </>
                        )}

                        {/* Restricted (Suspended or Banned) Actions */}
                        {isRestricted && (
                          <button
                            onClick={() => {
                              if (confirm(`Reinstate Dr. ${docName}? This will unlock their login and restore their active practitioner profile.`)) {
                                handleModerateDoctor(doc.id, 'reinstate', docName);
                              }
                            }}
                            disabled={processingId === doc.id}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Reinstate Access</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PATIENTS DIRECTORY */}
      {activeMainTab === 'patients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900">Registered Patient Records</h2>
              <p className="text-xs text-slate-500">Manage registered patient accounts. Deleting a patient completely purges their medical records and login.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient name, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading patients directory...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-heading font-bold text-slate-700 text-sm">No patients found</h4>
              <p className="text-xs text-slate-500">Registered patients will appear here once they create accounts.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Medical Vault</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPatients.map((patient) => {
                      const vault = patient.patient_medical_vault;
                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 font-bold flex items-center justify-center font-heading">
                                {patient.full_name?.charAt(0) || patient.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-heading font-bold text-slate-900 block">
                                  {patient.full_name || 'Anonymous Patient'}
                                </span>
                                <span className="text-[11px] text-slate-400">ID: {patient.id.substring(0, 8)}...</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 block">{patient.email}</span>
                            <span className="text-[11px] text-slate-500">{patient.phone || 'No phone on file'}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {vault ? (
                              <div className="space-y-0.5 text-[11px]">
                                {vault.blood_group && (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold mr-1">
                                    {vault.blood_group}
                                  </span>
                                )}
                                {vault.allergies && vault.allergies.length > 0 && (
                                  <span className="text-slate-600">
                                    Allergies: {vault.allergies.join(', ')}
                                  </span>
                                )}
                                {!vault.blood_group && (!vault.allergies || vault.allergies.length === 0) && (
                                  <span className="text-slate-400 italic">No allergies recorded</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Vault not initialized</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setDeletingPatient(patient)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PHARMACY PRODUCTS MANAGEMENT */}
      {activeMainTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900">Pharmacy Medication Catalog</h2>
              <p className="text-xs text-slate-500">Create new pharmaceutical medications, adjust prices, edit descriptions, and update stock.</p>
            </div>

            <button
              onClick={openCreateProductModal}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Medication</span>
            </button>
          </div>

          {/* Product Category Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    productCategoryFilter === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search medication name, ingredient..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Pill className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-heading font-bold text-slate-700 text-sm">No products found</h4>
              <p className="text-xs text-slate-500">Click &ldquo;Add New Medication&rdquo; to create your first pharmaceutical product.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="relative h-40 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.requires_prescription && (
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-sm">
                          Prescription Rx
                        </span>
                      )}
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 font-bold text-[10px] shadow-sm">
                        {product.dosage_form || 'Tablets'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="font-heading font-bold text-base text-slate-900 leading-tight mt-0.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Price</span>
                        <span className="font-heading font-extrabold text-base text-slate-900">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock</span>
                        <span className={`font-bold ${product.stock_quantity < 20 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {product.stock_quantity} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Toolbar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add New Pharmaceutical Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Prescription Medications">Prescription Medications</option>
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Antibiotics & Antivirals">Antibiotics & Antivirals</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="First Aid & Surgical">First Aid & Surgical</option>
                    <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                    <option value="Skincare & Dermatology">Skincare & Dermatology</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage Form</label>
                  <select
                    value={productForm.dosage_form}
                    onChange={(e) => setProductForm({ ...productForm, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Cream">Cream / Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Eye/Ear Drops</option>
                    <option value="Injection">Injection Solution</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (USD $) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="14.50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Active Ingredients</label>
                <input
                  type="text"
                  value={productForm.active_ingredients}
                  onChange={(e) => setProductForm({ ...productForm, active_ingredients: e.target.value })}
                  placeholder="e.g. Amoxicillin Trihydrate 500mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Indications, usage notes, precautions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prescription-req"
                  checked={productForm.requires_prescription}
                  onChange={(e) => setProductForm({ ...productForm, requires_prescription: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="prescription-req" className="font-bold text-slate-800">
                  Requires Certified Doctor Digital Prescription (Rx)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === 'product-saving'}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {processingId === 'product-saving' ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE PATIENT */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-slate-900">
                Delete Patient Record?
              </h3>
              <p className="text-xs text-slate-600">
                You are about to permanently delete <strong className="text-slate-900">{deletingPatient.full_name || deletingPatient.email}</strong>. 
                This action will delete their auth login, consultation history, prescriptions, and medical vault records.
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-semibold text-center">
              ⚠️ This operation is permanent and cannot be undone.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeletingPatient(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                disabled={processingId === deletingPatient.id}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {processingId === deletingPatient.id ? 'Deleting...' : 'Yes, Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE PRODUCT */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-slate-900">
                Delete Medication?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{deletingProduct.name}</strong> from the pharmacy store?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={processingId === deletingProduct.id}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {processingId === deletingProduct.id ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
