'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Navigation, 
  Clock, 
  ShieldAlert, 
  Star, 
  Search, 
  Compass, 
  CheckCircle2, 
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  RefreshCw,
  Globe2,
  Zap,
  Target,
  Footprints,
  AlertTriangle,
  HelpCircle,
  X
} from 'lucide-react';
import { Hospital, formatDistanceDisplay } from '@/lib/hospital-data';

// Dynamically import Leaflet Map to prevent SSR window reference issues
const HospitalMap = dynamic(() => import('@/components/HospitalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] lg:min-h-[640px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 animate-pulse">
      <MapPin className="w-8 h-8 text-sky-600 mb-2 animate-bounce" />
      <span className="text-xs font-semibold">Loading High-Precision Live Hospital Map...</span>
    </div>
  ),
});

export default function FindHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Acquiring live location...');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'distance' | 'wait' | 'rating'>('distance');
  const [activeTabMobile, setActiveTabMobile] = useState<'list' | 'map'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGpsDeniedHelp, setShowGpsDeniedHelp] = useState(false);
  const [insecureContextNotice, setInsecureContextNotice] = useState(false);

  // Core Function: Fetch real live hospitals from API route
  const fetchLiveHospitals = useCallback(async (lat?: number, lng?: number, queryText?: string, accuracyMeters?: number) => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      let url = '/api/hospitals/nearby';
      const params = new URLSearchParams();

      if (lat !== undefined && lng !== undefined) {
        params.append('lat', lat.toString());
        params.append('lng', lng.toString());
      }
      if (queryText) {
        params.append('query', queryText);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.success) {
        setHospitals(data.hospitals || []);
        if (data.userLocation) {
          setUserLocation({
            lat: data.userLocation.lat,
            lng: data.userLocation.lng,
            name: data.userLocation.name,
          });

          const accText = accuracyMeters ? ` • GPS accuracy ±${Math.round(accuracyMeters)}m` : '';
          setLocationStatus(`Live Coordinates Locked: ${data.userLocation.name}${accText}`);
        }
      } else {
        setLocationStatus('Could not load nearby facilities. Please try refreshing.');
      }
    } catch (err: any) {
      console.error('Error fetching live hospitals:', err);
      setLocationStatus('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Client-Side Network Location Fallback (queries direct phone network IP if GPS denied)
  const fallbackClientNetworkLocation = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        setUserLocation({
          lat: data.latitude,
          lng: data.longitude,
          name: `${data.city || data.region}, ${data.country}`,
        });
        setLocationStatus(`Auto-detected: ${data.city || data.region}, ${data.country} (Network IP)`);
        await fetchLiveHospitals(data.latitude, data.longitude);
        return;
      }
    } catch (e) {
      console.warn('Direct client IP lookup failed, falling back to server default:', e);
    }
    // Fallback if client IP fails
    await fetchLiveHospitals();
  }, [fetchLiveHospitals]);

  // Request High-Precision GPS with two-stage fallback (Satellite -> Wi-Fi/Cellular -> Network IP)
  const requestHighPrecisionGPS = useCallback(() => {
    if (typeof window === 'undefined') return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.isSecureContext || isLocalhost;

    if (!('geolocation' in navigator)) {
      setLocationStatus('GPS not supported by this browser. Detecting network location...');
      fallbackClientNetworkLocation();
      return;
    }

    if (!isSecure) {
      setInsecureContextNotice(true);
      setLocationStatus('Mobile GPS blocked by browser (insecure HTTP). Detecting network location...');
      fallbackClientNetworkLocation();
      return;
    }

    setIsRefreshing(true);
    setLocationStatus('Calibrating hardware GPS for 100% exact coordinates...');

    // Stage 1: Try high accuracy GPS (satellite / hardware)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocationAccuracy(accuracy);
        setShowGpsDeniedHelp(false);
        setLocationStatus(`GPS Locked (±${Math.round(accuracy)}m precision). Finding nearest hospitals...`);
        fetchLiveHospitals(latitude, longitude, undefined, accuracy);
      },
      (error) => {
        console.warn('High precision GPS error code:', error.code, error.message);

        if (error.code === error.PERMISSION_DENIED) {
          // User denied permission or browser blocked it
          setShowGpsDeniedHelp(true);
          setLocationStatus('GPS access denied by browser. Detecting network location...');
          fallbackClientNetworkLocation();
        } else {
          // Timeout or Position Unavailable (often indoors) -> Stage 2: Try cellular & Wi-Fi triangulation
          setLocationStatus('Connecting via Wi-Fi & cellular towers...');
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              setLocationAccuracy(accuracy);
              setShowGpsDeniedHelp(false);
              setLocationStatus(`Location Locked via Wi-Fi/Cell (±${Math.round(accuracy)}m precision)`);
              fetchLiveHospitals(latitude, longitude, undefined, accuracy);
            },
            (err2) => {
              console.warn('Standard location error:', err2.message);
              setLocationStatus('GPS timed out. Auto-detecting your area via network IP...');
              fallbackClientNetworkLocation();
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 300000,
            }
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 9000,
      }
    );
  }, [fetchLiveHospitals, fallbackClientNetworkLocation]);

  // On initial mount: Trigger location request
  useEffect(() => {
    requestHighPrecisionGPS();
  }, [requestHighPrecisionGPS]);

  // Handle custom city/hospital search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      requestHighPrecisionGPS();
      return;
    }
    setLocationStatus(`Searching nearest medical facilities around "${searchQuery}"...`);
    fetchLiveHospitals(undefined, undefined, searchQuery);
  };

  // Under 1km Facilities Count
  const under1kmCount = useMemo(() => {
    return hospitals.filter((h) => h.isUnder1km || (h.distanceKm !== undefined && h.distanceKm < 1.0)).length;
  }, [hospitals]);

  // Filter & Sort Logic
  const filteredHospitals = useMemo(() => {
    let result = hospitals.filter((hosp) => {
      if (selectedCategory === 'Under1km') {
        return hosp.isUnder1km || (hosp.distanceKm !== undefined && hosp.distanceKm < 1.0);
      }
      if (selectedCategory === 'Trauma') return hosp.type === 'Trauma Center' || hosp.hasEmergency;
      if (selectedCategory === 'Clinic') return hosp.type === 'Urgent Care' || hosp.amenityType === 'clinic' || hosp.amenityType === 'doctors';
      if (selectedCategory === 'Pediatric') return hosp.type === 'Children Hospital';
      if (selectedCategory === 'Cardiac') return hosp.type === 'Cardiology Center';

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      }
      if (sortBy === 'wait') {
        return a.waitTimeMins - b.waitTimeMins;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  }, [hospitals, selectedCategory, sortBy]);

  // The absolute closest facility (Emergency or Clinic)
  const closestFacility = useMemo(() => {
    if (filteredHospitals.length === 0) return null;
    return filteredHospitals[0];
  }, [filteredHospitals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      
      {/* 1. Header Banner & Safety Notice */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-lg sm:text-2xl text-white tracking-tight">
                  Hospital & Emergency Center Locator
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-0.5 rounded-full">
                  <Target className="w-3 h-3 text-sky-400" />
                  100% Precise GPS
                </span>
                {under1kmCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {under1kmCount} Facility &lt; 1km
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Real-time satellite coordinates query open health registries worldwide. Finds the nearest emergency hospitals, trauma centers, and walk-in clinics within your immediate vicinity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="tel:911"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-rose-600/30 active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call 911 Emergency</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Top Controls: Search Bar, Precise GPS Trigger, Status Feedback */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3.5">
        
        {/* Search Bar & Recalibrate GPS Button */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city (e.g. Lagos, London, New York) or hospital name..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* High Precision GPS Recalibrate Button */}
          <button
            type="button"
            onClick={requestHighPrecisionGPS}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/20 active:scale-95 disabled:opacity-70 shrink-0 cursor-pointer"
          >
            <Compass className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-200' : ''}`} />
            <span>{isRefreshing ? 'Locating...' : 'Locate My Exact Position'}</span>
          </button>
        </form>

        {/* Quick Jump City Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick jump:</span>
          {['Lagos', 'Abuja', 'London', 'New York', 'Toronto', 'Johannesburg'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSearchQuery(city);
                fetchLiveHospitals(undefined, undefined, city);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200/70 text-slate-700 text-[11px] font-semibold shrink-0 transition-colors cursor-pointer"
            >
              📍 {city}
            </button>
          ))}
        </div>

        {/* GPS Permission Denied / Help Guide Card */}
        {showGpsDeniedHelp && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2.5 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>GPS Access Denied — How to enable on your phone:</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGpsDeniedHelp(false)}
                className="text-amber-700 hover:text-amber-950 p-1"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-900">
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/70 shadow-2xs">
                <strong className="block text-slate-900 mb-1">🍎 iPhone (Safari):</strong>
                <span>
                  Tap the <strong>aA</strong> icon in the address bar → tap <strong>Website Settings</strong> → set <strong>Location</strong> to <strong>Allow</strong>.
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/70 shadow-2xs">
                <strong className="block text-slate-900 mb-1">🤖 Android (Chrome):</strong>
                <span>
                  Tap the <strong>lock / tune</strong> icon in the address bar → tap <strong>Permissions</strong> → set <strong>Location</strong> to <strong>Allow</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5 flex-wrap">
              <button
                type="button"
                onClick={requestHighPrecisionGPS}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
              >
                Retry GPS Permission
              </button>
              <span className="text-[11px] text-amber-800">
                Or type your neighborhood in the search bar above.
              </span>
            </div>
          </div>
        )}

        {/* Insecure Context (HTTP on mobile IP) Warning */}
        {insecureContextNotice && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note on Mobile Browsers:</strong> iOS Safari and Android Chrome require HTTPS to access satellite GPS when testing over a local network IP. We auto-detected your location via Network IP, or you can search your area directly.
            </span>
          </div>
        )}

        {/* Live Precision Status Bar */}
        <div className="text-[11px] font-medium text-sky-900 bg-sky-50/80 px-3.5 py-2.5 rounded-xl border border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-600"></span>
            </span>
            <span className="font-bold text-sky-950">{locationStatus}</span>
          </span>

          {userLocation && (
            <div className="flex items-center gap-2 text-slate-600 font-mono text-[10px] shrink-0">
              <span className="bg-white/80 px-2 py-0.5 rounded border border-sky-200/50">
                Lat: {userLocation.lat.toFixed(5)}
              </span>
              <span className="bg-white/80 px-2 py-0.5 rounded border border-sky-200/50">
                Lng: {userLocation.lng.toFixed(5)}
              </span>
              <span className="bg-sky-700 text-white font-bold px-2 py-0.5 rounded shadow-xs">
                {hospitals.length} Facilities Found
              </span>
            </div>
          )}
        </div>

        {/* Filter Categories & Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          
          {/* Category Tabs including Under 1km */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'All', label: 'All Real Facilities' },
              { 
                id: 'Under1km', 
                label: `⚡ Nearest (< 1km)`,
                highlight: true,
                badge: under1kmCount > 0 ? under1kmCount : undefined 
              },
              { id: 'Trauma', label: 'Emergency & Trauma' },
              { id: 'Clinic', label: 'Walk-In Clinics' },
              { id: 'Pediatric', label: 'Children Hospitals' },
              { id: 'Cardiac', label: 'Cardiology' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? cat.highlight
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold ring-2 ring-amber-400/50'
                        : 'bg-slate-900 text-white shadow-xs'
                      : cat.highlight
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isSelected ? 'bg-slate-900 text-amber-300' : 'bg-amber-200 text-amber-900'}`}>
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-600 cursor-pointer"
            >
              <option value="distance">Closest Real Distance (Ascending)</option>
              <option value="wait">Shortest ER / Clinic Wait</option>
              <option value="rating">Highest Verified Rating</option>
            </select>
          </div>

        </div>

      </div>

      {/* Mobile View Switcher (List vs Map) */}
      <div className="flex sm:hidden items-center p-1 bg-slate-200/80 rounded-xl">
        <button
          onClick={() => setActiveTabMobile('list')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTabMobile === 'list'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span>Facility List ({filteredHospitals.length})</span>
        </button>
        <button
          onClick={() => setActiveTabMobile('map')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTabMobile === 'map'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
      </div>

      {/* 3. Main Split View: Left List, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Hospital & Clinic List */}
        <div className={`lg:col-span-6 space-y-3.5 ${activeTabMobile === 'map' ? 'hidden sm:block' : 'block'}`}>
          
          {/* Closest Medical Center Callout */}
          {closestFacility && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950 via-sky-900 to-slate-950 text-white border border-sky-400/40 shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/40 text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
                  <Sparkles className="w-3 h-3 text-sky-300" />
                  #1 Nearest Medical Facility
                </span>
                
                <span className="text-xs font-extrabold font-mono text-sky-200 bg-sky-800/60 px-2 py-0.5 rounded border border-sky-600/40">
                  {formatDistanceDisplay(closestFacility.distanceKm, closestFacility.distanceMiles).primary}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-base text-white">
                    {closestFacility.name}
                  </h3>
                  {closestFacility.isUnder1km && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                      Under 1km
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {closestFacility.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-200 pt-1 border-t border-sky-800/50">
                <span className="flex items-center gap-1 text-sky-300">
                  <Clock className="w-3.5 h-3.5" />
                  Est. Wait: ~{closestFacility.waitTimeMins} mins
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {closestFacility.rating} ({closestFacility.totalReviews} reviews)
                </span>
                {closestFacility.isUnder1km && (
                  <span className="flex items-center gap-1 text-sky-200">
                    <Footprints className="w-3.5 h-3.5 text-sky-300" />
                    ~{Math.max(2, Math.round((closestFacility.distanceKm || 0.3) * 12))} min walk
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${closestFacility.phone}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Emergency Reception</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${closestFacility.lat},${closestFacility.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/20"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Live Directions</span>
                </a>
              </div>
            </div>
          )}

          {/* Hospital List Items */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-100 animate-pulse h-28" />
                ))}
              </div>
            ) : filteredHospitals.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2.5">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-slate-800">No medical facilities match this filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Switch back to &quot;All Real Facilities&quot; or click &quot;Locate My Exact Position&quot; to scan around your coordinates.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Reset Category Filter
                </button>
              </div>
            ) : (
              filteredHospitals.map((hosp, idx) => {
                const isSelected = selectedHospital?.id === hosp.id;
                const distInfo = formatDistanceDisplay(hosp.distanceKm, hosp.distanceMiles);
                const isUnder1km = hosp.isUnder1km || (hosp.distanceKm !== undefined && hosp.distanceKm < 1.0);

                return (
                  <div
                    key={hosp.id}
                    onClick={() => setSelectedHospital(hosp)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white relative ${
                      isUnder1km ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/20 via-white to-white' : ''
                    } ${
                      isSelected
                        ? 'border-sky-600 ring-2 ring-sky-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Nearest Tag for top results */}
                    {idx === 0 && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-xs">
                        Nearest Facility
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0 mt-0.5 ${
                            hosp.hasEmergency || hosp.type === 'Trauma Center'
                              ? 'bg-rose-600'
                              : hosp.type === 'Urgent Care'
                              ? 'bg-sky-600'
                              : 'bg-sky-600'
                          }`}
                        >
                          {hosp.hasEmergency ? '✚' : 'H'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-heading font-bold text-sm text-slate-900 hover:text-sky-700 transition-colors">
                              {hosp.name}
                            </h4>
                            {isUnder1km && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold">
                                <Zap className="w-2.5 h-2.5 text-amber-600" />
                                &lt;1km
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-sky-700">
                            {hosp.traumaLevel || hosp.type}
                          </span>
                        </div>
                      </div>

                      {/* Distance pill */}
                      <div className="text-right shrink-0">
                        <span className={`font-heading font-extrabold text-xs block font-mono ${
                          isUnder1km ? 'text-amber-700 font-black' : 'text-slate-900'
                        }`}>
                          {distInfo.primary}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isUnder1km 
                            ? `~${Math.max(2, Math.round((hosp.distanceKm || 0.4) * 12))} min walk` 
                            : `~${Math.max(2, Math.round((hosp.distanceMiles || 1) * 2.5))} min drive`}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{hosp.address}</span>
                    </p>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hosp.features.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                            f.includes('<1km')
                              ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sky-600 flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          Wait: ~{hosp.waitTimeMins}m
                        </span>
                        <span className="flex items-center gap-0.5 text-slate-700 font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {hosp.rating}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${hosp.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Call Hospital"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Directions</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Interactive Leaflet Map */}
        <div className={`lg:col-span-6 sticky top-20 ${activeTabMobile === 'list' ? 'hidden sm:block' : 'block'}`}>
          <HospitalMap
            hospitals={filteredHospitals}
            selectedHospital={selectedHospital}
            onSelectHospital={(hosp) => setSelectedHospital(hosp)}
            userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
            onRecenterUser={requestHighPrecisionGPS}
          />
        </div>

      </div>

    </div>
  );
}
