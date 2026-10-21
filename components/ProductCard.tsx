'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PharmacyProduct } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { ShoppingBag, Star, ShieldCheck, Check } from 'lucide-react';

interface ProductCardProps {
  product: PharmacyProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart();
  const isInCart = items.some((item) => item.product.id === product.id);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-teal-500/80 p-2.5 sm:p-4 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between group">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-square w-full rounded-lg sm:rounded-xl bg-slate-100 overflow-hidden mb-2 sm:mb-3 border border-slate-100">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
            {product.requires_prescription ? (
              <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                Rx Required
              </span>
            ) : (
              <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                OTC
              </span>
            )}
          </div>
        </div>

        {/* Category & Rating */}
        <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 mb-0.5 sm:mb-1">
          <span className="font-semibold uppercase tracking-wider truncate max-w-[70%]">{product.category}</span>
          <span className="flex items-center gap-0.5 font-bold text-slate-700 shrink-0">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
            {Number(product.rating || 4.8).toFixed(1)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/pharmacy/${product.slug}`} className="block">
          <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h4>
        </Link>

        {/* Dosage & Ingredients */}
        <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 leading-tight sm:leading-relaxed">
          {product.dosage_form && <strong className="text-slate-700">{product.dosage_form} • </strong>}
          {product.active_ingredients || product.description}
        </p>
      </div>

      {/* Price & Add to Cart */}
      <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <div>
          <span className="font-heading font-extrabold text-xs sm:text-base text-slate-900">
            ${Number(product.price).toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => addItem(product, 1)}
          className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 shrink-0 ${
            isInCart
              ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20'
          }`}
          aria-label={`Add ${product.name} to cart`}
        >
          {isInCart ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
