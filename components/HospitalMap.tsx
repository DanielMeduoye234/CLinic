'use client';

import React, { useEffect, useRef } from 'react';
import { Hospital, formatDistanceDisplay } from '@/lib/hospital-data';
import 'leaflet/dist/leaflet.css';

interface HospitalMapProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelectHospital: (hospital: Hospital) => void;
  userLocation: { lat: number; lng: number } | null;
  onRecenterUser?: () => void;
}

export default function HospitalMap({
  hospitals,
  selectedHospital,
  onSelectHospital,
  userLocation,
  onRecenterUser,
}: HospitalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const centerLat = userLocation?.lat || (hospitals[0]?.lat ?? 40.7128);
      const centerLng = userLocation?.lng || (hospitals[0]?.lng ?? -74.0060);

      // Tight initial zoom (15) so user sees their immediate street & nearby <1km facilities
      const initialZoom = userLocation ? 14 : 12;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: initialZoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Sleek high-contrast modern Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // 1. Add User Location Marker & 1km Radius Zone
      if (userLocation) {
        // 1km Walkable Radius Circle
        const radiusCircle = L.circle([userLocation.lat, userLocation.lng], {
          radius: 1000, // 1000 meters = 1 km
          color: '#0d9488',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '#14b8a6',
          fillOpacity: 0.08,
          dashArray: '4, 6',
        }).addTo(map);
        radiusCircle.bindTooltip('1km Walkable Radius', {
          permanent: false,
          direction: 'top',
          className: 'map-radius-tooltip',
        });
        circleRef.current = radiusCircle;

        // Custom High-Precision GPS radar marker
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: -8px; background: rgba(13, 148, 136, 0.25); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: -3px; background: rgba(13, 148, 136, 0.45); border-radius: 9999px;"></div>
              <div style="position: relative; width: 18px; height: 18px; background: #0f766e; border: 3px solid #ffffff; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px; font-weight: 700; color: #0f766e; text-align: center;">
              📍 You Are Here
              <div style="font-size: 10px; color: #64748b; font-weight: 500;">High-Accuracy Live GPS Position</div>
            </div>
          `);
      }

      // 2. Add Hospital Markers
      const newMarkers: { [key: string]: any } = {};

      hospitals.forEach((hosp) => {
        const isUnder1km = hosp.isUnder1km || (hosp.distanceKm !== undefined && hosp.distanceKm < 1.0);
        const isEmergency = hosp.hasEmergency || hosp.type === 'Trauma Center';
        const isClinic = hosp.amenityType === 'clinic' || hosp.type === 'Urgent Care';

        let markerBg = '#0d9488'; // teal default
        let markerSymbol = 'H';
        if (isEmergency) {
          markerBg = '#dc2626'; // rose/red
          markerSymbol = '✚';
        } else if (isClinic) {
          markerBg = '#0284c7'; // blue
          markerSymbol = '✚';
        }

        const markerHtml = `
          <div style="cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; width: ${isUnder1km ? '38px' : '32px'}; height: ${isUnder1km ? '38px' : '32px'}; background: ${markerBg}; color: white; border-radius: 10px; border: ${isUnder1km ? '3px solid #fef08a' : '2.5px solid white'}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-weight: 900; font-size: ${isUnder1km ? '15px' : '13px'}; transition: transform 0.2s ease;">
            ${isUnder1km ? '<span style="position: absolute; top: -6px; right: -6px; width: 14px; height: 14px; background: #eab308; border: 2px solid white; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 8px;">★</span>' : ''}
            ${markerSymbol}
          </div>
        `;

        const markerIcon = L.divIcon({
          className: 'custom-hospital-marker',
          html: markerHtml,
          iconSize: [isUnder1km ? 38 : 32, isUnder1km ? 38 : 32],
          iconAnchor: [isUnder1km ? 19 : 16, isUnder1km ? 19 : 16],
        });

        const distInfo = formatDistanceDisplay(hosp.distanceKm, hosp.distanceMiles);

        const marker = L.marker([hosp.lat, hosp.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; min-width: 200px; padding: 3px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${isUnder1km ? '#fef9c3; color: #854d0e;' : '#f1f5f9; color: #475569;'}">
                  ${isUnder1km ? '⚡ Under 1km • Walkable' : (hosp.type || 'Medical Facility')}
                </span>
                <span style="font-size: 12px; font-weight: 900; color: #0d9488;">
                  ${distInfo.primary}
                </span>
              </div>
              <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${hosp.name}</div>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">${hosp.address}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                <span style="color: #10b981;">Wait: ~${hosp.waitTimeMins} mins</span>
                <span style="color: #f59e0b;">★ ${hosp.rating}</span>
              </div>
            </div>
          `);

        marker.on('click', () => {
          onSelectHospital(hosp);
        });

        newMarkers[hosp.id] = marker;
      });

      markersRef.current = newMarkers;

      // Fit bounds intelligently
      if (hospitals.length > 0 && userLocation) {
        // Prioritize facilities within 3km for initial fit
        const nearbySubset = hospitals.filter(h => (h.distanceKm ?? 999) <= 4.0);
        const focusList = nearbySubset.length >= 2 ? nearbySubset : hospitals.slice(0, 5);
        
        const bounds = L.latLngBounds(focusList.map((h) => [h.lat, h.lng]));
        bounds.extend([userLocation.lat, userLocation.lng]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (hospitals.length > 0) {
        const bounds = L.latLngBounds(hospitals.slice(0, 8).map((h) => [h.lat, h.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hospitals, userLocation]);

  // When selected hospital changes, pan map to it
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHospital) return;
    mapInstanceRef.current.flyTo([selectedHospital.lat, selectedHospital.lng], 16, {
      duration: 1.0,
    });
    const marker = markersRef.current[selectedHospital.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedHospital]);

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[640px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Recenter / Focus GPS Floating Button */}
      {userLocation && (
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current && userLocation) {
              mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.0 });
            }
            if (onRecenterUser) onRecenterUser();
          }}
          className="absolute bottom-5 left-4 z-10 bg-white/95 hover:bg-white text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-200/80 flex items-center gap-2 transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          title="Center map on your precise GPS coordinates"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
          </span>
          <span>Center on My GPS</span>
        </button>
      )}

      {/* Map Legend */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-semibold text-slate-700 space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">✚</span>
          <span>24/7 Emergency & Trauma</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-sky-600 text-white flex items-center justify-center text-[9px] font-bold">✚</span>
          <span>Walk-In Clinic / Medical Center</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-md bg-teal-600 border border-yellow-300 text-yellow-300 flex items-center justify-center text-[9px] font-bold">★</span>
          <span className="font-bold text-amber-700">Nearest Under 1km (Walkable)</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2 pt-0.5 border-t border-slate-200/60">
            <span className="w-3 h-3 rounded-full bg-teal-700 border-2 border-white shadow-xs"></span>
            <span className="text-teal-900 font-bold">Your Exact Location (1km Zone)</span>
          </div>
        )}
      </div>
    </div>
  );
}
