'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight,
  FileCheck,
  Building
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, hasPrescriptionItems } = useCart();
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [street, setStreet] = useState('742 Evergreen Terrace');
  const [city, setCity] = useState('Springfield');
  const [stateVal, setStateVal] = useState('IL');
  const [zip, setZip] = useState('62704');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard');
  const [prescriptionAttached, setPrescriptionAttached] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const shippingCost = deliverySpeed === 'express' ? 9.99 : subtotal >= 35 ? 0 : 4.99;
  const totalAmount = subtotal + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);

    try {
      // Simulate order creation or insert to Supabase
      const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;

      // Store order details in localStorage for tracking demo
      const orderData = {
        id: newOrderId,
        patientName: fullName,
        email,
        items,
        totalAmount,
        shippingAddress: { fullName, street, city, state: stateVal, zip, phone },
        deliverySpeed,
        status: hasPrescriptionItems ? 'pharmacist_review' : 'processing',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(`clinic_order_${newOrderId}`, JSON.stringify(orderData));
      clearCart();
      router.push(`/orders/${newOrderId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-heading font-bold text-xl text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-600">Please add items from the pharmacy catalog before checking out.</p>
        <button
          onClick={() => router.push('/pharmacy')}
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          Go to Pharmacy
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Checkout Title */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          Secure Prescription & Pharmacy Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
          Guaranteed compliant medical dispensation and tamper-evident packaging.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Shipping Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Delivery Address
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address & Apt / Unit *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Prescription Verification Check */}
          {hasPrescriptionItems && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Prescription Verification
                </h3>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-teal-950">
                    Linked to CLINIC Teleconsultation #{Date.now().toString().slice(-4)}
                  </p>
                  <p className="text-teal-800">
                    Your certified digital prescription from your doctor consultation is automatically verified and attached to this delivery for our licensed pharmacist to dispense.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Delivery Speed Options */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Delivery Method
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => setDeliverySpeed('standard')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliverySpeed === 'standard'
                    ? 'border-teal-600 bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900">Standard Delivery</div>
                  <span className="font-bold text-teal-800">{subtotal >= 35 ? 'FREE' : '$4.99'}</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Estimated delivery in 1-2 business days via medical courier.
                </p>
              </label>

              <label
                onClick={() => setDeliverySpeed('express')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliverySpeed === 'express'
                    ? 'border-teal-600 bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900">Urgent 2-Hour Courier</div>
                  <span className="font-bold text-teal-800">$9.99</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Dispatched immediately from nearest partner pharmacy for acute symptoms.
                </p>
              </label>
            </div>
          </div>

          {/* Step 4: Payment Simulation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">4</span>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Payment Method
              </h3>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-teal-800 text-white flex items-center justify-center font-bold text-[10px]">
                  VISA
                </div>
                <div>
                  <span className="font-bold text-slate-900">Card ending in •••• 4242</span>
                  <p className="text-[11px] text-slate-600">Encrypted 256-bit checkout</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Order Review Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 sticky top-24">
          <h3 className="font-heading font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({items.length} items)
          </h3>

          <div className="space-y-3 max-h-56 overflow-y-auto text-xs pr-1">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900">{product.name}</span>
                  <span className="text-slate-500 block text-[11px]">Qty: {quantity}</span>
                </div>
                <span className="font-bold text-slate-900">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping ({deliverySpeed === 'express' ? 'Urgent 2h' : 'Standard'})</span>
              <span className="font-bold text-slate-900">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tax</span>
              <span className="font-bold text-slate-900">$0.00</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="font-heading font-bold text-base text-slate-900">Total</span>
            <span className="font-heading font-extrabold text-2xl text-teal-800">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-99 transition-all cursor-pointer"
          >
            {submitting ? (
              <span>Authorizing Prescription & Order...</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Place Order (${totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-600 text-center leading-normal">
            By placing this order you consent to pharmacist review and prescription dispensation per telemedicine state guidelines.
          </p>
        </div>

      </form>

    </div>
  );
}
