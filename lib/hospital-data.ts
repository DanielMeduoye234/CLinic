export interface Hospital {
  id: string;
  name: string;
  type: 'Trauma Center' | 'Children Hospital' | 'Cardiology Center' | 'General Hospital' | 'Urgent Care';
  traumaLevel?: string;
  hasEmergency: boolean;
  isOpen247: boolean;
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  waitTimeMins: number;
  rating: number;
  totalReviews: number;
  distanceMiles?: number;
  distanceKm?: number;
  distanceMeters?: number;
  isUnder1km?: boolean;
  amenityType?: 'hospital' | 'clinic' | 'doctors' | 'emergency';
  features: string[];
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateDistanceKm(lat1, lon1, lat2, lon2) * 0.621371;
}

export function formatDistanceDisplay(km?: number, miles?: number): { primary: string; secondary: string } {
  if (km === undefined && miles === undefined) {
    return { primary: 'Nearby', secondary: '' };
  }
  const safeKm = km ?? ((miles ?? 0) * 1.60934);
  const safeMiles = miles ?? (safeKm * 0.621371);

  if (safeKm < 1) {
    const meters = Math.round(safeKm * 1000);
    return {
      primary: `${meters}m away`,
      secondary: `(${safeMiles.toFixed(2)} mi • <1 km)`,
    };
  }

  return {
    primary: `${safeKm.toFixed(1)} km`,
    secondary: `(${safeMiles.toFixed(1)} mi)`,
  };
}

// Realistic initial hospital directory across major healthcare hubs
export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Metropolitan General Hospital & Trauma Center',
    type: 'Trauma Center',
    traumaLevel: 'Level 1 Trauma Center',
    hasEmergency: true,
    isOpen247: true,
    address: '520 E 70th St, New York, NY 10021',
    city: 'New York',
    phone: '+1 (212) 746-5454',
    lat: 40.7651,
    lng: -73.9542,
    waitTimeMins: 14,
    rating: 4.9,
    totalReviews: 840,
    features: ['Level 1 Adult & Pediatric Trauma', 'Comprehensive Stroke Center', 'Cardiac Cath Lab', 'Helipad'],
  },
  {
    id: 'hosp-2',
    name: 'Bellevue Health Center & Emergency Pavilion',
    type: 'Trauma Center',
    traumaLevel: 'Level 1 Trauma Center',
    hasEmergency: true,
    isOpen247: true,
    address: '462 1st Ave, New York, NY 10016',
    city: 'New York',
    phone: '+1 (212) 562-4141',
    lat: 40.7391,
    lng: -73.9763,
    waitTimeMins: 22,
    rating: 4.8,
    totalReviews: 1250,
    features: ['24/7 Resuscitation Bay', 'Burn Center', 'Toxicology ICU', 'Emergency Psychiatry'],
  },
  {
    id: 'hosp-3',
    name: 'St. Luke’s Heart & Vascular Institute',
    type: 'Cardiology Center',
    traumaLevel: 'Chest Pain & STEMI Center',
    hasEmergency: true,
    isOpen247: true,
    address: '1111 Amsterdam Ave, New York, NY 10025',
    city: 'New York',
    phone: '+1 (212) 523-4000',
    lat: 40.8048,
    lng: -73.9626,
    waitTimeMins: 10,
    rating: 4.95,
    totalReviews: 620,
    features: ['Primary Angioplasty 24/7', 'Electrophysiology Lab', 'Cardiovascular ICU', 'Rapid Triage'],
  },
  {
    id: 'hosp-4',
    name: 'Children’s Memorial Pediatric Emergency Hospital',
    type: 'Children Hospital',
    traumaLevel: 'Pediatric Level 1 Trauma',
    hasEmergency: true,
    isOpen247: true,
    address: '3959 Broadway, New York, NY 10032',
    city: 'New York',
    phone: '+1 (212) 305-6628',
    lat: 40.8407,
    lng: -73.9421,
    waitTimeMins: 8,
    rating: 4.98,
    totalReviews: 950,
    features: ['Dedicated Pediatric ER', 'Child Life Specialists', 'Neonatal ICU', 'Pediatric Surgery'],
  },
  {
    id: 'hosp-5',
    name: 'NYU Langone Medical Complex',
    type: 'General Hospital',
    traumaLevel: 'Emergency Department',
    hasEmergency: true,
    isOpen247: true,
    address: '550 1st Ave, New York, NY 10016',
    city: 'New York',
    phone: '+1 (212) 263-7300',
    lat: 40.7423,
    lng: -73.9739,
    waitTimeMins: 18,
    rating: 4.88,
    totalReviews: 1100,
    features: ['Robotic Surgery Unit', 'Advanced Diagnostics / MRI', 'Oncology Care', 'Urgent Neurology'],
  },
  {
    id: 'hosp-6',
    name: 'CityMD Downtown Urgent Care & Walk-in',
    type: 'Urgent Care',
    traumaLevel: 'Walk-In Urgent Care',
    hasEmergency: false,
    isOpen247: false,
    address: '14 Wall St, New York, NY 10005',
    city: 'New York',
    phone: '+1 (212) 267-2002',
    lat: 40.7075,
    lng: -74.0112,
    waitTimeMins: 6,
    rating: 4.75,
    totalReviews: 430,
    features: ['On-site Digital X-Ray', 'Minor Suturing & Lacerations', 'Rapid PCR Lab', 'Prescription Dispensing'],
  },
  {
    id: 'hosp-7',
    name: 'Lenox Hill Hospital Emergency Dept',
    type: 'General Hospital',
    traumaLevel: 'Emergency Center',
    hasEmergency: true,
    isOpen247: true,
    address: '100 E 77th St, New York, NY 10075',
    city: 'New York',
    phone: '+1 (212) 434-2000',
    lat: 40.7738,
    lng: -73.9599,
    waitTimeMins: 15,
    rating: 4.82,
    totalReviews: 760,
    features: ['Rapid Assessment Unit', 'Orthopedic Trauma', 'Interventional Radiology'],
  },
  {
    id: 'hosp-8',
    name: 'Chelsea Urgent Medical Care Center',
    type: 'Urgent Care',
    traumaLevel: 'Extended Hours Clinic',
    hasEmergency: false,
    isOpen247: false,
    address: '268 W 23rd St, New York, NY 10011',
    city: 'New York',
    phone: '+1 (212) 463-0101',
    lat: 40.7454,
    lng: -73.9984,
    waitTimeMins: 5,
    rating: 4.8,
    totalReviews: 310,
    features: ['Walk-in Access', 'Fracture Splinting', 'IV Hydration', 'Immediate Testing'],
  },
];
