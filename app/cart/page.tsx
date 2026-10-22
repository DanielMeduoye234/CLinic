'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    totalItems,
    hasPrescriptionItems 
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 35;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = isFreeShipping || items.length === 0 ? 0 : 4.99;
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review your pharmaceutical items and consultation medications before checkout.
          </p>
        </div>

        <Link
          href="/pharmacy"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Your cart is currently empty
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Add doctor-prescribed medications or health essentials from our licensed pharmacy.
          </p>
          <div className="pt-2">
            <Link
              href="/pharmacy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20"
            >
              <span>Explore Pharmacy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            {hasPrescriptionItems && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-0.5">
                  <p className="font-bold">Prescription Required for Gated Medications</p>
                  <p className="text-amber-800">
                    Items marked with <strong>Rx</strong> require validation. Your digital prescription from your CLINIC consultation will be linked automatically during checkout.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-slate-900">
                          {product.name}
                        </h4>
                        {product.requires_prescription && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {product.dosage_form || 'Standard Unit'} • ${Number(product.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1.5 hover:text-sky-700"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-1.5 hover:text-sky-700"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-heading font-extrabold text-sm text-slate-900 min-w-16 text-right">
                      ${(product.price * quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
            <h3 className="font-heading font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal ({totalItems})</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-bold text-slate-900">
                  {isFreeShipping ? <strong className="text-sky-700">FREE</strong> : '$4.99'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pharmacist Verification Fee</span>
                <span className="font-bold text-slate-900">$0.00 (Waived)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-heading font-bold text-base text-slate-900">Total</span>
              <span className="font-heading font-extrabold text-2xl text-sky-800">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-99 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Safe & compliant prescription dispensation</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
