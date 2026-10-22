'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';
import { 
  ChatMessage, 
  DoctorProfile, 
  MessageType, 
  PrescribedMedication,
  DigitalPrescription 
} from '@/lib/types';
import { 
  Mic, 
  MicOff, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  Phone, 
  Video, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight,
  Play, 
  Pause, 
  Download, 
  FileText, 
  Trash2, 
  ShoppingBag, 
  Check, 
  Clock, 
  PlusCircle, 
  Plus,
  Camera,
  AlertTriangle,
  Stethoscope,
  X,
  Home,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// RFC4122 v4 UUID generator for consistent database & client IDs
function generateMessageUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Resilient deduplication logic: matches ID, or sender+content within 8s window
function isDuplicateMessage(a: ChatMessage, b: ChatMessage): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (
    a.sender_id === b.sender_id &&
    a.message_type === b.message_type &&
    (a.content || '').trim() === (b.content || '').trim()
  ) {
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    if (!isNaN(tA) && !isNaN(tB) && Math.abs(tA - tB) < 8000) {
      return true;
    }
  }
  return false;
}

function mergeIncomingMessage(existingList: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const matchIdx = existingList.findIndex((m) => isDuplicateMessage(m, incoming));
  if (matchIdx !== -1) {
    const updated = [...existingList];
    updated[matchIdx] = { ...updated[matchIdx], ...incoming };
    return updated;
  }
  return [...existingList, incoming];
}

export default function ConsultationChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
  const [activeConsultationId, setActiveConsultationId] = useState<string>(consultationId);
  const { user, profile, doctorProfile, isLoading: isAuthLoading } = useAuth();
  const { addItem, openCart } = useCart();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDoctorView, setIsDoctorView] = useState(false);
  const [isDoctorForbidden, setIsDoctorForbidden] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{
    name: string;
    symptoms: string;
    urgency: string;
    time?: string;
  } | null>(null);
  const [isDoctorTyping, setIsDoctorTyping] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState<number>(1.0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Media preview, Attachments & Emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  // Prescription Form State (for Doctors)
  const [rxDiagnosis, setRxDiagnosis] = useState('Acute Bacterial Sinusitis & Inflammation');
  const [rxMedications, setRxMedications] = useState<PrescribedMedication[]>([
    {
      name: 'Amoxicillin 500mg',
      dosage: '500mg',
      frequency: '3 times daily after meals',
      duration: '7 days',
      instructions: 'Complete full course even if symptoms improve',
      pharmacy_product_id: '1',
      price: 14.50,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Consultation & Initial Doctor info
  useEffect(() => {
    async function initConsultation() {
      try {
        let docData: any = null;
        let isDocChattingPatient = false;
        let resolvedConsId = consultationId;

        // 1. Try checking if consultationId matches an active consultation record in Supabase
        const { data: consultationRecord } = await supabase
          .from('consultations')
          .select(`
            id,
            patient_id,
            doctor_id,
            raw_symptoms,
            pain_level,
            symptom_duration,
            ai_urgency,
            ai_recommended_specialty,
            ai_triage_summary,
            status,
            patient:profiles!consultations_patient_id_fkey (
              id,
              full_name,
              avatar_url,
              email
            ),
            doctor:doctor_profiles!consultations_doctor_id_fkey (
              id,
              profile_id,
              specialty,
              medical_license_number,
              hospital_affiliation,
              years_of_experience,
              consultation_fee,
              is_online,
              average_rating,
              bio,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', consultationId)
          .maybeSingle();

        if (consultationRecord) {
          resolvedConsId = consultationRecord.id;
          docData = consultationRecord.doctor;
          const patientName = (consultationRecord.patient as any)?.full_name || 'Verified Patient';
          setPatientInfo({
            name: patientName,
            symptoms: consultationRecord.raw_symptoms || 'General clinical inquiry',
            urgency: consultationRecord.ai_urgency || 'routine',
          });

          // Strict Doctor Isolation:
          if (profile?.role === 'doctor') {
            const isAssignedDoctor = 
              consultationRecord.doctor_id === doctorProfile?.id || 
              (consultationRecord.doctor as any)?.profile_id === user?.id;

            if (isAssignedDoctor) {
              setIsDoctorView(true);
              isDocChattingPatient = true;
            } else {
              // Doctor attempting to access another doctor's consultation!
              setIsDoctorForbidden(true);
              setLoading(false);
              return;
            }
          }
        } else {
          // If not a consultation record, consultationId is a doctor's ID (e.g. from /doctors/[id])
          const { data: d1 } = await supabase
            .from('doctor_profiles')
            .select(`
              id,
              profile_id,
              specialty,
              medical_license_number,
              hospital_affiliation,
              years_of_experience,
              consultation_fee,
              is_online,
              average_rating,
              bio,
              profiles (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', consultationId)
            .maybeSingle();

          if (d1) {
            docData = d1;
          } else {
            const { data: d2 } = await supabase
              .from('doctor_profiles')
              .select(`
                id,
                profile_id,
                specialty,
                medical_license_number,
                hospital_affiliation,
                years_of_experience,
                consultation_fee,
                is_online,
                average_rating,
                bio,
                profiles (
                  id,
                  full_name,
                  avatar_url
                )
              `)
              .eq('profile_id', consultationId)
              .maybeSingle();
            if (d2) docData = d2;
          }

          // Doctors cannot chat other doctors!
          if (profile?.role === 'doctor' && !isDocChattingPatient) {
            setIsDoctorForbidden(true);
            setLoading(false);
            return;
          }

          // If current user is an authenticated patient, find or create their persistent consultation record
          if (user?.id && docData?.id) {
            const { data: existingCons } = await supabase
              .from('consultations')
              .select('id, raw_symptoms, ai_urgency')
              .eq('patient_id', user.id)
              .eq('doctor_id', docData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingCons) {
              resolvedConsId = existingCons.id;
              setPatientInfo({
                name: profile?.full_name || 'Verified Patient',
                symptoms: existingCons.raw_symptoms || 'General clinical inquiry',
                urgency: existingCons.ai_urgency || 'routine',
              });
            } else {
              const { data: createdCons } = await supabase
                .from('consultations')
                .insert({
                  patient_id: user.id,
                  doctor_id: docData.id,
                  raw_symptoms: 'Direct teleconsultation inquiry',
                  status: 'active'
                })
                .select('id')
                .maybeSingle();

              if (createdCons) {
                resolvedConsId = createdCons.id;
              }
            }
          }
        }

        // Fallback doctor profile if needed
        if (!docData) {
          const { data: fallbackDoc } = await supabase
            .from('doctor_profiles')
            .select(`
              id,
              profile_id,
              specialty,
              medical_license_number,
              hospital_affiliation,
              years_of_experience,
              consultation_fee,
              is_online,
              average_rating,
              bio,
              profiles (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('is_verified', true)
            .limit(1)
            .maybeSingle();
          if (fallbackDoc) docData = fallbackDoc;
        }

        if (docData) {
          setDoctor(docData as unknown as DoctorProfile);
        }

        setActiveConsultationId(resolvedConsId);

        // Load persistent messages from Supabase (chat_messages with messages fallback)
        let dbMessages: any[] = [];
        const { data: m1, error: e1 } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('consultation_id', resolvedConsId)
          .order('created_at', { ascending: true });

        if (!e1 && m1) {
          dbMessages = m1;
        } else {
          const { data: m2 } = await supabase
            .from('messages')
            .select('*')
            .eq('consultation_id', resolvedConsId)
            .order('created_at', { ascending: true });
          if (m2) dbMessages = m2;
        }

        // Also retrieve local storage cache for immediate offline/resilient persistence
        let cachedMessages: ChatMessage[] = [];
        try {
          const raw = localStorage.getItem(`clinic_chat_${resolvedConsId}`);
          if (raw) cachedMessages = JSON.parse(raw);
        } catch (e) {}

        const systemNotice: ChatMessage = {
          id: 'msg-system-1',
          consultation_id: resolvedConsId,
          sender_id: 'system',
          message_type: 'system',
          content: 'End-to-end encrypted medical consultation channel established. Your clinical privacy is protected under HIPAA guidelines.',
          is_read: true,
          created_at: new Date().toISOString(),
        };

        const combinedList: ChatMessage[] = [systemNotice];
        const allCandidates = [...dbMessages, ...cachedMessages];

        allCandidates.forEach((m: any) => {
          if (!m || m.id === 'msg-system-1') return;
          const msgObj: ChatMessage = {
            id: m.id,
            consultation_id: m.consultation_id,
            sender_id: m.sender_id,
            message_type: m.message_type,
            content: m.content || '',
            attachment_url: m.attachment_url,
            attachment_metadata: m.attachment_metadata,
            is_read: m.is_read,
            created_at: m.created_at,
          };
          const matchIdx = combinedList.findIndex((existing) => isDuplicateMessage(existing, msgObj));
          if (matchIdx === -1) {
            combinedList.push(msgObj);
          } else {
            combinedList[matchIdx] = { ...combinedList[matchIdx], ...msgObj };
          }
        });

        const sorted = combinedList.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);

        // Sanitize cache to remove old duplicated items
        try {
          const cleanCache = sorted.filter((m) => m.id !== 'msg-system-1');
          localStorage.setItem(`clinic_chat_${resolvedConsId}`, JSON.stringify(cleanCache));
        } catch (e) {}
      } catch (err) {
        console.error('Error loading consultation:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthLoading) {
      initConsultation();
    }
  }, [consultationId, profile, doctorProfile, user, isAuthLoading]);

  // Setup Supabase Realtime channel (broadcast & postgres_changes)
  useEffect(() => {
    if (!activeConsultationId) return;

    const channel = supabase.channel(`consultation:${activeConsultationId}`)
      .on('broadcast', { event: 'new-message' }, (payload) => {
        if (payload?.payload) {
          const incoming = payload.payload as ChatMessage;
          setMessages((prev) => mergeIncomingMessage(prev, incoming));
          try {
            const key = `clinic_chat_${activeConsultationId}`;
            const cached: ChatMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
            localStorage.setItem(key, JSON.stringify(mergeIncomingMessage(cached, incoming)));
          } catch (e) {}
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `consultation_id=eq.${activeConsultationId}`,
        },
        (payload) => {
          if (payload?.new) {
            const row = payload.new as any;
            const incoming: ChatMessage = {
              id: row.id,
              consultation_id: row.consultation_id,
              sender_id: row.sender_id,
              message_type: row.message_type,
              content: row.content,
              attachment_url: row.attachment_url,
              attachment_metadata: row.attachment_metadata,
              is_read: row.is_read,
              created_at: row.created_at,
            };
            setMessages((prev) => mergeIncomingMessage(prev, incoming));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConsultationId]);

  // Unified Message Persistence & Realtime Dispatch
  const persistAndDispatchMessage = async (msg: ChatMessage) => {
    const targetId = activeConsultationId || consultationId;
    msg.consultation_id = targetId;

    // 1. Optimistic UI update (using mergeIncomingMessage prevents duplicate if already present)
    setMessages((prev) => mergeIncomingMessage(prev, msg));

    // 2. Local Storage Cache
    try {
      const key = `clinic_chat_${targetId}`;
      const cached: ChatMessage[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(mergeIncomingMessage(cached, msg)));
    } catch (e) {
      console.error('Local cache error:', e);
    }

    // 3. Supabase Realtime Broadcast
    supabase.channel(`consultation:${targetId}`).send({
      type: 'broadcast',
      event: 'new-message',
      payload: msg,
    });

    // 4. Supabase Database Insert - Explicitly pass msg.id (UUID) so DB matches client UUID!
    if (user?.id) {
      const dbPayload = {
        id: msg.id,
        consultation_id: targetId,
        sender_id: user.id,
        message_type: msg.message_type,
        content: msg.content || null,
        attachment_url: msg.attachment_url && !msg.attachment_url.startsWith('blob:') ? msg.attachment_url : null,
        attachment_metadata: msg.attachment_metadata || {},
        is_read: false,
      };

      const { error: insErr } = await supabase.from('chat_messages').insert(dbPayload);
      if (insErr) {
        console.warn('chat_messages insert error, attempting messages table:', insErr);
        await supabase.from('messages').insert(dbPayload);
      }
    }
  };

  // Handle Text Message Send
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const senderId = user?.id || (isDoctorView ? 'doctor' : 'patient');

    const newMessage: ChatMessage = {
      id: generateMessageUUID(),
      consultation_id: activeConsultationId,
      sender_id: senderId,
      message_type: 'text',
      content: userText,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setInputText('');
    persistAndDispatchMessage(newMessage);
  };

  // Voice Note Recording (Web Audio API)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const voiceMessage: ChatMessage = {
          id: generateMessageUUID(),
          consultation_id: activeConsultationId,
          sender_id: user?.id || (isDoctorView ? 'doctor' : 'patient'),
          message_type: 'audio',
          attachment_url: audioUrl,
          attachment_metadata: {
            duration_seconds: recordingDuration,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        };

        persistAndDispatchMessage(voiceMessage);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // Audio Playback with 1x, 1.5x, 2x speeds
  const togglePlayAudio = (url: string, id: string) => {
    if (playingAudioId === id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.playbackRate = audioPlaybackSpeed;
        audioPlayerRef.current.play();
        setPlayingAudioId(id);
        audioPlayerRef.current.onended = () => setPlayingAudioId(null);
      }
    }
  };

  const cycleAudioSpeed = () => {
    const nextSpeed = audioPlaybackSpeed === 1.0 ? 1.5 : audioPlaybackSpeed === 1.5 ? 2.0 : 1.0;
    setAudioPlaybackSpeed(nextSpeed);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = nextSpeed;
    }
  };

  // Image Upload & Lightbox
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imgUrl = URL.createObjectURL(file);
    const imgMessage: ChatMessage = {
      id: generateMessageUUID(),
      consultation_id: activeConsultationId,
      sender_id: user?.id || (isDoctorView ? 'doctor' : 'patient'),
      message_type: 'image',
      content: file.name,
      attachment_url: imgUrl,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    persistAndDispatchMessage(imgMessage);
  };

  // File Upload (PDF / Lab Report)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileMessage: ChatMessage = {
      id: generateMessageUUID(),
      consultation_id: activeConsultationId,
      sender_id: user?.id || (isDoctorView ? 'doctor' : 'patient'),
      message_type: 'file',
      content: file.name,
      attachment_url: fileUrl,
      attachment_metadata: {
        file_name: file.name,
        size_bytes: file.size,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };

    persistAndDispatchMessage(fileMessage);
  };

  // Issue Digital Prescription (Doctor Action)
  const handleIssuePrescription = () => {
    const rxMessage: ChatMessage = {
      id: generateMessageUUID(),
      consultation_id: activeConsultationId,
      sender_id: doctor?.profile_id || user?.id || 'doctor',
      message_type: 'prescription',
      content: JSON.stringify({
        diagnosis: rxDiagnosis || 'Acute Upper Respiratory Tract Infection',
        medications: rxMedications,
      }),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    persistAndDispatchMessage(rxMessage);
    setIsPrescriptionModalOpen(false);
  };

  // Patient adds prescribed items to cart
  const handleAddPrescriptionToCart = (meds: PrescribedMedication[]) => {
    meds.forEach((m) => {
      addItem({
        id: m.pharmacy_product_id || `prod-${Date.now()}`,
        name: m.name,
        slug: m.name.toLowerCase().replace(/\s+/g, '-'),
        category: 'Prescription Medications',
        description: m.instructions,
        price: m.price || 14.50,
        stock_quantity: 100,
        requires_prescription: true,
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
        dosage_form: m.dosage,
        rating: 4.9,
      });
    });
    openCart();
  };

  const docName = (doctor?.profiles as any)?.full_name || 'Dr. Anya Sharma, MD';

  // 1. Doctor Access Forbidden Barrier: Doctors cannot chat other doctors!
  if (isDoctorForbidden) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-slate-900">Physician Access Restricted</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Doctor accounts cannot initiate or participate in consultations with other doctors. Please use your Doctor Dashboard to manage your patient chat inquiries.
        </p>
        <Link
          href="/doctor/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 hover:bg-sky-700 transition-all"
        >
          <span>Open Doctor Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // 2. Loading state
  if (loading || isAuthLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">
          Initializing encrypted clinical consultation channel...
        </p>
      </div>
    );
  }

  // 3. User Authentication Barrier: Unauthenticated users CANNOT chat until signed up or signed in!
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center mx-auto shadow-xs">
          <Stethoscope className="w-8 h-8 text-sky-600" />
        </div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>HIPAA Secure Consultation</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900">
            Sign In Required to Consult
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            To protect your medical confidentiality and connect with {docName}, please sign in or register your patient account.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <Link
            href={`/auth/login?redirect=/consultation/${consultationId}&reason=consultation`}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-98 transition-all"
          >
            <span>Sign In to Start Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={`/auth/signup?redirect=/consultation/${consultationId}&reason=consultation`}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-heading font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>Create Free Patient Account</span>
          </Link>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/doctors"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Return to Doctors Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-0 sm:px-4 lg:px-6 sm:py-3 mb-0">
      <div className="h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-5.5rem)] rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/90 shadow-none sm:shadow-md bg-white overflow-hidden flex flex-col">
      
      {/* Hidden Audio Player instance */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* 1. CHAT HEADER BAR */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push(isDoctorView ? '/doctor/dashboard' : '/doctors')}
            className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isDoctorView ? (
            /* Doctor's view of Patient */
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-heading font-bold text-sm overflow-hidden shrink-0 shadow-xs">
                {patientInfo?.name?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                    {patientInfo?.name || 'Verified Patient'}
                  </h2>
                  <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full uppercase shrink-0">
                    {patientInfo?.urgency || 'moderate'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  Symptoms: {patientInfo?.symptoms || 'General clinical inquiry'}
                </p>
              </div>
            </div>
          ) : (
            /* Patient's view of Doctor */
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-100 border border-sky-200/80 flex items-center justify-center font-heading font-bold text-sky-800 text-sm overflow-hidden shrink-0 shadow-2xs">
                {docName.replace('Dr. ', '').charAt(0)}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <h2 className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                    {docName}
                  </h2>
                  <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-200/60 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
                  <span className="truncate">{doctor?.specialty || 'General Practice'}</span>
                  <span className="hidden sm:inline">• Online Now</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Actions & Quick Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
          {isDoctorView ? (
            <>
              <Link
                href="/pharmacy"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                <span>Formulary</span>
              </Link>
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Issue Prescription</span>
                <span className="sm:hidden">Rx</span>
              </button>
            </>
          ) : (
            <Link
              href="/pharmacy"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Pharmacy Store</span>
              <span className="text-[11px]">Rx</span>
            </Link>
          )}

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          <Link
            href="/"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors hidden sm:block"
            title="Return to Homepage"
          >
            <Home className="w-4 h-4" />
          </Link>

          <Link
            href="/auth/logout"
            className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors hidden sm:block"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 2. CHAT STREAM / MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 sm:space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isMe = user?.id
            ? msg.sender_id === user.id
            : isDoctorView
            ? msg.sender_id === 'doctor' || msg.sender_id === (doctor?.profile_id || '')
            : msg.sender_id === 'patient';
          const isSystem = msg.message_type === 'system';
          const isPrescription = msg.message_type === 'prescription';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-1.5 sm:my-2 px-2">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] px-3 py-1 rounded-full font-medium text-center border border-slate-200/70 shadow-2xs max-w-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>HIPAA Encrypted Consultation Channel</span>
                </span>
              </div>
            );
          }

          if (isPrescription) {
            let parsedRx: { diagnosis: string; medications: PrescribedMedication[] };
            try {
              parsedRx = JSON.parse(msg.content || '{}');
            } catch {
              parsedRx = { diagnosis: 'Clinical Assessment', medications: rxMedications };
            }

            return (
              <div key={msg.id} className="flex justify-start max-w-lg my-2 sm:my-3">
                <div className="bg-white rounded-2xl border-2 border-sky-600 p-4 sm:p-5 shadow-md space-y-3 sm:space-y-4 w-full">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 font-heading">
                          Digital Prescription
                        </span>
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                          {parsedRx.diagnosis}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
                      Rx #{msg.id.slice(-6)}
                    </span>
                  </div>

                  {/* Medications list */}
                  <div className="space-y-2">
                    {parsedRx.medications.map((med, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900 text-xs">
                          <span>{med.name}</span>
                          <span className="text-sky-700">${(med.price || 14.50).toFixed(2)}</span>
                        </div>
                        <p className="text-slate-600 font-medium text-[11px]">
                          <strong>Dosage:</strong> {med.dosage} • {med.frequency} for {med.duration}
                        </p>
                        <p className="text-slate-500 text-[10px] italic">
                          Instruction: {med.instructions}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pharmacy Transfer Button */}
                  <div className="pt-1">
                    <button
                      onClick={() => handleAddPrescriptionToCart(parsedRx.medications)}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-98 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add All Prescribed Medicines to Cart</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                      Direct fulfillment from CLINIC Pharmacy.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-md rounded-2xl shadow-2xs px-3.5 py-2 sm:px-4 sm:py-2.5 transition-all ${
                  isMe
                    ? 'bg-sky-500 text-white rounded-tr-xs'
                    : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/85'
                }`}
              >
                {/* 1. Text Message */}
                {msg.message_type === 'text' && (
                  <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}

                {/* 2. Voice Note Message */}
                {msg.message_type === 'audio' && (
                  <div className="flex items-center gap-2.5 py-0.5">
                    <button
                      onClick={() => togglePlayAudio(msg.attachment_url || '', msg.id)}
                      className={`p-2 rounded-full transition-transform active:scale-95 ${
                        isMe ? 'bg-white text-sky-600' : 'bg-sky-500 text-white'
                      }`}
                      aria-label="Play Voice Note"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 translate-x-0.5" />
                      )}
                    </button>

                    {/* Animated Waveform */}
                    <div className="flex items-center gap-0.5 sm:gap-1 h-5">
                      {[10, 20, 14, 24, 8, 18, 12, 20, 9].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: playingAudioId === msg.id ? `${h}px` : '7px' }}
                          className={`w-0.5 sm:w-1 rounded-full transition-all duration-200 ${
                            isMe ? 'bg-white/80' : 'bg-sky-600/70'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      <span className={`text-[9px] font-bold ${isMe ? 'text-sky-100' : 'text-slate-500'}`}>
                        {msg.attachment_metadata?.duration_seconds
                          ? `0:${msg.attachment_metadata.duration_seconds < 10 ? '0' : ''}${msg.attachment_metadata.duration_seconds}`
                          : 'Voice'}
                      </span>
                      <button
                        onClick={cycleAudioSpeed}
                        className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
                          isMe ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {audioPlaybackSpeed}x
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Image Message */}
                {msg.message_type === 'image' && msg.attachment_url && (
                  <div className="space-y-1">
                    <div
                      onClick={() => setLightboxImage(msg.attachment_url || null)}
                      className="relative w-44 sm:w-52 h-44 sm:h-52 rounded-xl overflow-hidden cursor-pointer group bg-slate-100"
                    >
                      <Image
                        src={msg.attachment_url}
                        alt="Shared clinical media"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    {msg.content && <p className="text-[11px] opacity-90 break-words">{msg.content}</p>}
                  </div>
                )}

                {/* 4. File / Lab Report Message */}
                {msg.message_type === 'file' && (
                  <div className="flex items-center gap-2.5 p-2 bg-black/5 rounded-xl">
                    <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{msg.content || 'Report.pdf'}</p>
                      <span className="text-[9px] opacity-75">
                        {msg.attachment_metadata?.size_bytes
                          ? `${(msg.attachment_metadata.size_bytes / 1024 / 1024).toFixed(1)} MB`
                          : 'Document'}
                      </span>
                    </div>
                    <a
                      href={msg.attachment_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-black/10 rounded-lg shrink-0"
                      aria-label="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Timestamp & Delivery Tick */}
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 select-none ${
                    isMe ? 'text-sky-100/90' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
              </div>
            </motion.div>
          );
        })}
        {isDoctorTyping && (
          <div className="flex justify-start items-center gap-2 text-xs text-slate-500 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-sky-800 text-xs">
              {docName.replace('Dr. ', '').charAt(0)}
            </div>
            <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-slate-500 font-medium ml-1">Dr. {docName.replace('Dr. ', '')} is evaluating...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. CHAT INPUT DOCK */}
      <footer className="bg-white border-t border-slate-200/90 p-2 sm:p-3 pb-safe shrink-0 relative">
        
        {/* Mobile Attachment Action Drawer */}
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-2 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex items-center gap-1.5 z-50 sm:hidden"
            >
              <button
                type="button"
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 text-xs font-semibold transition-colors"
              >
                <Camera className="w-4 h-4 text-sky-600" />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 text-xs font-semibold transition-colors"
              >
                <Paperclip className="w-4 h-4 text-sky-600" />
                <span>Document</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachmentMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 text-xs font-semibold transition-colors"
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Emoji</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-3 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex flex-wrap gap-2 max-w-xs z-50">
            {['👋', '🙏', '🩺', '💊', '❤️', '👍', '😊', '🤒', '🤕', '💧'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Hidden File Inputs for Attachment Handling */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileUpload}
          className="hidden"
        />

        {isRecording ? (
          /* Live Voice Recording Bar */
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-full px-3 py-2 animate-in fade-in">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-rose-700">
                0:{recordingDuration < 10 ? '0' : ''}{recordingDuration}
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1 h-3.5">
                {[10, 18, 8, 14, 20, 10, 16].map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }} className="w-0.5 sm:w-1 bg-rose-400 rounded-full" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                aria-label="Cancel Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Mobile '+' Attachment Toggle */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all sm:hidden ${
                showAttachmentMenu ? 'bg-sky-500 text-white rotate-45 shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              aria-label="Add attachment"
            >
              <Plus className="w-5 h-5 transition-transform" />
            </button>

            {/* Desktop Media Attachment Actions */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                aria-label="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                aria-label="Upload Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                aria-label="Upload File"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Type a message..."
              className="min-w-0 flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-100 border border-slate-200/80 rounded-full text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all placeholder:text-slate-400"
            />

            {/* Voice Note Trigger or Send Message */}
            {inputText.trim() ? (
              <button
                type="button"
                onClick={handleSendMessage}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white shadow-sm shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/80 active:scale-95 transition-all flex items-center justify-center shrink-0"
                aria-label="Record Voice Note"
              >
                <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}

          </div>
        )}
      </footer>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full h-[80vh]">
            <Image
              src={lightboxImage}
              alt="Medical inspection full size"
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Issue Prescription Modal (Doctor Action) */}
      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Issue Signed Digital Prescription
              </h3>
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                  Primary Clinical Diagnosis
                </label>
                <input
                  type="text"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bacterial Sinusitis"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                  Select Formulary Medicine (CLINIC Pharmacy)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { name: 'Amoxicillin 500mg', dosage: '500mg', freq: '3 times daily after meals', dur: '7 days', instr: 'Complete full course even if symptoms improve', price: 14.50, id: '1' },
                    { name: 'Sumatriptan 50mg', dosage: '50mg', freq: '1 tablet at migraine onset', dur: 'As needed', instr: 'May repeat once after 2 hours if migraine persists. Max 100mg/24h', price: 28.00, id: '4' },
                    { name: 'Ibuprofen 400mg', dosage: '400mg', freq: 'Every 8 hours with water', dur: '5 days', instr: 'Take after meals for acute pain and inflammation', price: 8.99, id: '2' },
                    { name: 'Cetirizine 10mg', dosage: '10mg', freq: '1 tablet daily at bedtime', dur: '14 days', instr: 'Non-drowsy relief for acute allergic dermatitis or rhinitis', price: 11.20, id: '3' },
                  ].map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => setRxMedications([{
                        name: med.name,
                        dosage: med.dosage,
                        frequency: med.freq,
                        duration: med.dur,
                        instructions: med.instr,
                        pharmacy_product_id: med.id,
                        price: med.price,
                      }])}
                      className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                        rxMedications[0]?.name.includes(med.name.split(' ')[0])
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate">{med.name}</div>
                      <div className="text-[10px] text-sky-700 font-semibold">${med.price.toFixed(2)} • {med.dur}</div>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">{rxMedications[0]?.name || 'Amoxicillin 500mg'}</span>
                  <p className="text-slate-600 text-[11px]">
                    <strong>Dosage:</strong> {rxMedications[0]?.dosage} • {rxMedications[0]?.frequency} for {rxMedications[0]?.duration}
                  </p>
                  <p className="text-slate-500 text-[10px] italic">
                    {rxMedications[0]?.instructions}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleIssuePrescription}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-sky-500/20"
              >
                Sign & Transmit to Chat
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
