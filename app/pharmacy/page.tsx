'use client';

import React, { useState, useEffect } from 'react';
import { PharmacyProduct } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import ProductCard from '@/components/ProductCard';
import { 
  Search, 
  ShoppingBag, 
  Pill, 
  ShieldCheck, 
  SlidersHorizontal, 
  Truck, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

export default function PharmacyPage() {
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterRx, setFilterRx] = useState<'all' | 'otc' | 'rx'>('all');

  const categories = [
    'All',
    'Prescription Medications',
    'Pain & Fever',
    'Allergy & Sinus',
    'Vitamins & Supplements',
    'Medical Devices',
  ];

  // Default products fallback in case Supabase table hasn't been seeded yet
  const defaultProducts: PharmacyProduct[] = [
    {
      id: '1',
      name: 'Amoxicillin 500mg',
      slug: 'amoxicillin-500mg',
      category: 'Prescription Medications',
      description: 'Broad-spectrum antibiotic for bacterial respiratory, ear, and throat infections.',
      price: 14.50,
      stock_quantity: 120,
      requires_prescription: true,
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Capsules',
      active_ingredients: 'Amoxicillin Trihydrate 500mg',
      rating: 4.90,
    },
    {
      id: '2',
      name: 'Ibuprofen 400mg Rapid Relief',
      slug: 'ibuprofen-400mg',
      category: 'Pain & Fever',
      description: 'Non-steroidal anti-inflammatory drug providing rapid relief for headache, dental pain, and inflammation.',
      price: 8.99,
      stock_quantity: 300,
      requires_prescription: false,
      image_url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Tablets',
      active_ingredients: 'Ibuprofen 400mg',
      rating: 4.85,
    },
    {
      id: '3',
      name: 'Cetirizine 10mg All-Day Allergy',
      slug: 'cetirizine-10mg',
      category: 'Allergy & Sinus',
      description: 'Non-drowsy 24-hour antihistamine for seasonal hay fever and allergy relief.',
      price: 11.20,
      stock_quantity: 180,
      requires_prescription: false,
      image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Tablets',
      active_ingredients: 'Cetirizine Hydrochloride 10mg',
      rating: 4.78,
    },
    {
      id: '4',
      name: 'Sumatriptan 50mg Migraine Defense',
      slug: 'sumatriptan-50mg',
      category: 'Prescription Medications',
      description: 'Targeted acute migraine relief prescribed for severe episodic migraines with aura.',
      price: 28.00,
      stock_quantity: 85,
      requires_prescription: true,
      image_url: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Tablets',
      active_ingredients: 'Sumatriptan Succinate 50mg',
      rating: 4.92,
    },
    {
      id: '5',
      name: 'Magnesium Glycinate 400mg',
      slug: 'magnesium-glycinate-400mg',
      category: 'Vitamins & Supplements',
      description: 'Chelated high-absorption magnesium for muscular relaxation and calm sleep support.',
      price: 19.50,
      stock_quantity: 140,
      requires_prescription: false,
      image_url: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Capsules',
      active_ingredients: 'Magnesium Bisglycinate Chelate 400mg',
      rating: 4.95,
    },
    {
      id: '6',
      name: 'Digital Arm Blood Pressure Monitor',
      slug: 'digital-bp-monitor',
      category: 'Medical Devices',
      description: 'Clinically tested upper-arm cardiovascular monitor with irregular heartbeat detection.',
      price: 45.00,
      stock_quantity: 60,
      requires_prescription: false,
      image_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
      dosage_form: 'Device',
      active_ingredients: 'Oscillometric Clinical Sensor',
      rating: 4.88,
    },
  ];

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error || !data || data.length === 0) {
          setProducts(defaultProducts);
        } else {
          setProducts(data as PharmacyProduct[]);
        }
      } catch (e) {
        setProducts(defaultProducts);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesRx =
      filterRx === 'all' ||
      (filterRx === 'rx' && prod.requires_prescription) ||
      (filterRx === 'otc' && !prod.requires_prescription);
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      prod.name.toLowerCase().includes(query) ||
      prod.description.toLowerCase().includes(query) ||
      (prod.active_ingredients && prod.active_ingredients.toLowerCase().includes(query));

    return matchesCat && matchesRx && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-teal-800 to-teal-950 text-white rounded-2xl p-5 sm:p-7 relative overflow-hidden">
        <div className="max-w-2xl space-y-1.5 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Pill className="w-3.5 h-3.5" />
            Licensed Digital Pharmacy
          </span>
          <h1 className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight">
            Certified Medications & Wellness
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-lg">
            Purchase over-the-counter essentials or fulfill your doctor&apos;s digital prescription with express doorstep delivery.
          </p>

          <div className="pt-3 flex flex-wrap gap-4 text-xs text-teal-200">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-teal-400" />
              <span>Free Express Delivery over $35</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>FDA / Regulatory Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>2-Hour Urgent Local Delivery Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by medicine name, generic ingredient (e.g. Ibuprofen), or category..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Rx / OTC Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterRx('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterRx === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterRx('otc')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterRx === 'otc' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              OTC (No Rx)
            </button>
            <button
              onClick={() => setFilterRx('rx')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterRx === 'rx' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Prescription (Rx)
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 sm:h-64 rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
          <p className="font-heading font-bold text-base text-slate-900">No products found</p>
          <p className="text-xs text-slate-500">Try adjusting your search query or category filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setFilterRx('all');
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}

    </div>
  );
}
