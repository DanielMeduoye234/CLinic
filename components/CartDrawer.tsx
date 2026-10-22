'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const { 
    items, 
    isCartOpen, 
    closeCart, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    totalItems,
    hasPrescriptionItems 
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 35;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-sky-600" />
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    Your Pharmacy Cart
                  </h3>
                  <span className="bg-sky-50 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Progress Indicator */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>
                    {amountToFreeShipping === 0
                      ? '🎉 You unlocked FREE Express Delivery!'
                      : `Add $${amountToFreeShipping.toFixed(2)} more for FREE Delivery`}
                  </span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Prescription Gating Alert */}
              {hasPrescriptionItems && (
                <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-snug">
                    <strong className="font-bold">Prescription Required (Rx):</strong> Items in your cart require a doctor prescription. You can attach your CLINIC consultation prescription during checkout.
                  </p>
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-slate-900 mb-1">
                      Your cart is empty
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mb-6">
                      Explore our certified digital pharmacy to find wellness supplements, OTC relief, or prescribed medications.
                    </p>
                    <Link
                      href="/pharmacy"
                      onClick={closeCart}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-sm shadow-sky-600/20"
                    >
                      Browse Pharmacy Store
                    </Link>
                  </div>
                ) : (
                  items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>

                      {/* Info & Quantity Modifiers */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {product.name}
                            </h4>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-600 font-medium">
                              {product.dosage_form || 'Unit'}
                            </span>
                            {product.requires_prescription && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                Rx
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-xs text-sky-700">
                            ${(product.price * quantity).toFixed(2)}
                          </span>

                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 hover:text-sky-700 hover:bg-slate-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer / Checkout CTA */}
              {items.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Delivery</span>
                      <span className="font-bold text-slate-900">
                        {amountToFreeShipping === 0 ? 'FREE' : '$4.99'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-heading font-bold text-sm text-slate-900">Total</span>
                    <span className="font-heading font-extrabold text-lg text-sky-700">
                      ${(subtotal + (amountToFreeShipping === 0 ? 0 : 4.99)).toFixed(2)}
                    </span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-all shadow-md shadow-sky-600/20 active:scale-[0.99]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>Secure encrypted medical checkout</span>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
