'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Building,
  FileCheck,
  ShoppingBag
} from 'lucide-react';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Load simulated or Supabase stored order from localStorage
    try {
      const saved = localStorage.getItem(`clinic_order_${orderId}`);
      if (saved) {
        setOrder(JSON.parse(saved));
      } else {
        // Fallback default order data
        setOrder({
          id: orderId,
          patientName: 'Sarah Jenkins',
          email: 'sarah.jenkins@example.com',
          totalAmount: 38.99,
          deliverySpeed: 'express',
          shippingAddress: {
            fullName: 'Sarah Jenkins',
            street: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'IL',
            zip: '62704',
          },
          items: [
            {
              product: {
                name: 'Amoxicillin 500mg',
                requires_prescription: true,
                price: 14.50,
                dosage_form: 'Capsules',
              },
              quantity: 1,
            },
            {
              product: {
                name: 'Ibuprofen 400mg Rapid Relief',
                requires_prescription: false,
                price: 8.99,
                dosage_form: 'Tablets',
              },
              quantity: 2,
            },
          ],
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [orderId]);

  const steps = [
    { title: 'Order Confirmed', desc: 'Electronic order received', done: true, current: false },
    { title: 'Pharmacist Verification', desc: 'Prescription & dosage check', done: true, current: true },
    { title: 'Dispensed & Sealed', desc: 'Tamper-evident medical packaging', done: false, current: false },
    { title: 'Out for Delivery', desc: 'Temperature-controlled courier', done: false, current: false },
    { title: 'Delivered', desc: 'Doorstep signature confirmation', done: false, current: false },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Success Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-heading">
            Order Confirmed & Authorized
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 mt-1">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Order Reference: <strong className="text-slate-900 font-mono">{orderId}</strong>
          </p>
        </div>
      </div>

      {/* 5-Step Order Progress Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="font-heading font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Live Prescription Fulfillment Stepper</span>
          <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
            ● In Progress
          </span>
        </h3>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 relative">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 -bottom-2 w-0.5 ${
                    step.done ? 'bg-sky-500' : 'bg-slate-200'
                  }`}
                />
              )}

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                  step.done
                    ? 'bg-sky-600 text-white'
                    : step.current
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step.done ? '✓' : idx + 1}
              </div>

              <div>
                <h4
                  className={`font-heading font-bold text-sm ${
                    step.done || step.current ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details & Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                Recipient & Delivery Address
              </span>
              <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
              <p className="text-slate-600">
                {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
              </p>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                Delivery Priority
              </span>
              <p className="font-bold text-sky-800 capitalize">
                {order.deliverySpeed === 'express' ? 'Urgent 2-Hour Medical Courier' : 'Standard Delivery (1-2 Days)'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-[10px] uppercase font-bold text-slate-600">
              Prescribed & OTC Items Dispatched
            </span>
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                <div>
                  <span className="font-bold text-slate-900">{item.product?.name}</span>
                  <span className="text-slate-500 block text-[11px]">
                    Qty: {item.quantity} • {item.product?.dosage_form}
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  ${((item.product?.price || 14.50) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-sm">
            <span className="font-heading font-bold text-slate-900">Total Charged</span>
            <span className="font-heading font-extrabold text-xl text-sky-800">
              ${Number(order.totalAmount || 38.99).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/pharmacy"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 text-center"
        >
          Return to Pharmacy Store
        </Link>
        <Link
          href="/doctors"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs text-center shadow-md shadow-sky-600/20"
        >
          Consult Another Specialist
        </Link>
      </div>

    </div>
  );
}
