'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PharmacyProduct } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';
import { 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Check, 
  FileText,
  Clock
} from 'lucide-react';

export default function SingleProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem, openCart } = useCart();

  const [product, setProduct] = useState<PharmacyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'dosage' | 'warnings'>('details');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (data) {
          setProduct(data as PharmacyProduct);
        } else {
          // Fallback mock item if DB not seeded
          setProduct({
            id: '1',
            name: slug.replace(/-/g, ' ').toUpperCase(),
            slug: slug,
            category: 'Prescription Medications',
            description: 'Prescription-grade clinical therapeutic formulated to treat acute symptoms.',
            price: 18.50,
            stock_quantity: 100,
            requires_prescription: true,
            image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
            dosage_form: 'Tablets',
            active_ingredients: 'Pharmaceutical Active Molecule 500mg',
            rating: 4.9,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-bold">Loading medication details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="font-heading font-bold text-lg text-slate-900">Product Not Found</h2>
        <Link href="/pharmacy" className="text-sky-700 text-xs font-bold hover:underline">
          Return to Pharmacy Store
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28 sm:pb-12">
      
      {/* Back Link */}
      <Link
        href="/pharmacy"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Pharmacy Catalog</span>
      </Link>

      {/* Main Product Hero Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Product Image */}
        <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          <div className="absolute top-3 left-3">
            {product.requires_prescription ? (
              <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                Prescription Required (Rx)
              </span>
            ) : (
              <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                Over-The-Counter (OTC)
              </span>
            )}
          </div>
        </div>

        {/* Product Details & Buy Box */}
        <div className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 font-heading">
              {product.category}
            </span>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 mt-1">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {Number(product.rating || 4.8).toFixed(1)}
              </span>
              <span>•</span>
              <span className="text-sky-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> In Stock & Ready to Dispense
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-bold text-slate-600 uppercase">Unit Price</span>
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-sky-800">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-slate-600 hover:text-sky-700"
                aria-label="Decrease"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-slate-600 hover:text-sky-700"
                aria-label="Increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rx Warning Notice */}
          {product.requires_prescription && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-snug">
                <strong>Doctor Prescription Required:</strong> You will be prompted to attach your CLINIC consultation prescription or upload a valid doctor note at checkout.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-99 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart — ${(product.price * quantity).toFixed(2)}</span>
            </button>
          </div>

          {/* Delivery & Security Badges */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              <span>Free express delivery over $35</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Pharmacist verified authenticity</span>
            </div>
          </div>
        </div>

      </div>

      {/* Clinical Specifications Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'details'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clinical Description
          </button>
          <button
            onClick={() => setActiveTab('dosage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dosage'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dosage & Administration
          </button>
          <button
            onClick={() => setActiveTab('warnings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'warnings'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Safety & Warnings
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
          {activeTab === 'details' && (
            <div className="space-y-3">
              <p>{product.description}</p>
              {product.active_ingredients && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <strong>Active Pharmaceutical Ingredient:</strong> {product.active_ingredients}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dosage' && (
            <div className="space-y-2">
              <p>
                Follow the precise instructions provided by your consulting doctor. Unless otherwise directed by a healthcare professional, do not exceed the stated dose.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Take with a full glass of water.</li>
                <li>May be taken with or without food unless gastrointestinal sensitivity occurs.</li>
                <li>Store at room temperature (15°C - 25°C) away from moisture.</li>
              </ul>
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-2">
              <p>
                Do not take this medication if you have a known hypersensitivity or allergy to any of its active components. Consult your physician if pregnant, planning pregnancy, or breastfeeding.
              </p>
              <p className="text-amber-800 font-semibold">
                Keep out of reach of children. In case of accidental overdose, contact poison control immediately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Buy Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-safe z-40 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-600">Total</span>
          <span className="font-heading font-extrabold text-base text-slate-900">
            ${(product.price * quantity).toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

    </div>
  );
}
