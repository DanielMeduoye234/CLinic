export type UserRole = 'patient' | 'doctor' | 'pharmacist' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DoctorProfile {
  id: string;
  profile_id: string;
  specialty: string;
  sub_specialties?: string[];
  medical_license_number: string;
  license_document_url?: string | null;
  is_verified: boolean;
  hospital_affiliation?: string | null;
  years_of_experience: number;
  bio?: string | null;
  consultation_fee: number;
  currency: string;
  is_online: boolean;
  average_rating: number;
  total_reviews: number;
  created_at?: string;
  profiles?: Profile;
}

export interface PatientMedicalVault {
  id: string;
  patient_id: string;
  blood_group?: string | null;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export type TriageUrgency = 'routine' | 'moderate' | 'urgent' | 'critical_emergency';
export type ConsultationStatus = 'pending_match' | 'active' | 'completed' | 'cancelled';

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  raw_symptoms: string;
  pain_level?: number | null;
  symptom_duration?: string | null;
  ai_urgency: TriageUrgency;
  ai_recommended_specialty?: string | null;
  ai_triage_summary?: string | null;
  status: ConsultationStatus;
  created_at: string;
  ended_at?: string | null;
  doctor?: DoctorProfile | null;
  patient?: Profile | null;
}

export type MessageType = 'text' | 'audio' | 'image' | 'file' | 'prescription' | 'system';

export interface ChatMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  message_type: MessageType;
  content?: string | null;
  attachment_url?: string | null;
  attachment_metadata?: {
    duration_seconds?: number;
    file_name?: string;
    size_bytes?: number;
    mime_type?: string;
    width?: number;
    height?: number;
  } | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface PrescribedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  pharmacy_product_id?: string | null;
  price?: number;
}

export interface DigitalPrescription {
  id: string;
  consultation_id: string;
  doctor_id: string;
  patient_id: string;
  diagnosis: string;
  medications: PrescribedMedication[];
  doctor_notes?: string | null;
  pdf_url?: string | null;
  created_at: string;
}

export interface PharmacyProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  image_url: string;
  dosage_form?: string | null;
  active_ingredients?: string | null;
  rating: number;
  created_at?: string;
}

export interface CartItem {
  product: PharmacyProduct;
  quantity: number;
}

export type OrderStatus = 'pending' | 'pharmacist_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  patient_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  attached_prescription_id?: string | null;
  payment_status: string;
  created_at: string;
  items?: {
    id: string;
    product: PharmacyProduct;
    quantity: number;
    unit_price: number;
  }[];
}
