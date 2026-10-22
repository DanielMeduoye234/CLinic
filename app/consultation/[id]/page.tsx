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
  AlertTriangle,
  Stethoscope,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsultationChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.id as string;
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

  // Media preview & Emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

        // Check if this consultationId is a known demo consultation from the doctor dashboard
        if (consultationId === 'cons-1') {
          setPatientInfo({
            name: 'David K. (38)',
            symptoms: 'Acute throbbing migraine on left temple with photophobia for 2 days.',
            urgency: 'moderate',
            time: '5 mins ago',
          });
          if (profile?.role === 'doctor') {
            setIsDoctorView(true);
            isDocChattingPatient = true;
          }
        } else if (consultationId === 'cons-2') {
          setPatientInfo({
            name: 'Elena R. (29)',
            symptoms: 'Itchy contact dermatitis rash on forearm after gardening.',
            urgency: 'routine',
            time: '18 mins ago',
          });
          if (profile?.role === 'doctor') {
            setIsDoctorView(true);
            isDocChattingPatient = true;
          }
        }

        // Try 1: check if consultationId is an active consultation record in Supabase
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
          docData = consultationRecord.doctor;
          const patientName = (consultationRecord.patient as any)?.full_name || 'Verified Patient';
          setPatientInfo({
            name: patientName,
            symptoms: consultationRecord.raw_symptoms || 'General clinical inquiry',
            urgency: consultationRecord.ai_urgency || 'routine',
          });

          // Role enforcement:
          if (profile?.role === 'doctor') {
            const isAssignedDoctor = 
              consultationRecord.doctor_id === doctorProfile?.id || 
              (consultationRecord.doctor as any)?.profile_id === user?.id;

            if (isAssignedDoctor) {
              setIsDoctorView(true);
              isDocChattingPatient = true;
            } else {
              // Doctor attempting to access another doctor's consultation or chat another doctor!
              setIsDoctorForbidden(true);
              setLoading(false);
              return;
            }
          }
        } else {
          // If not a consultation row, check if consultationId is a doctor's profile ID or doctor_profiles ID
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

          // If current user is a doctor and trying to chat a doctor:
          if (profile?.role === 'doctor' && !isDocChattingPatient) {
            // Doctors cannot chat other doctors!
            setIsDoctorForbidden(true);
            setLoading(false);
            return;
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

        const physicianName = (docData?.profiles as any)?.full_name || 'Dr. Medical Specialist';

        // Initialize starter messages
        const starterMessages: ChatMessage[] = [
          {
            id: 'msg-system-1',
            consultation_id: consultationId,
            sender_id: 'system',
            message_type: 'system',
            content: 'End-to-end encrypted medical consultation channel established. Your clinical privacy is protected under HIPAA guidelines.',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          },
          {
            id: 'msg-doc-1',
            consultation_id: consultationId,
            sender_id: docData?.profile_id || 'doctor-1',
            message_type: 'text',
            content: `Hello! I am Dr. ${physicianName.replace('Dr. ', '')}. I have reviewed your clinical symptom intake. I am here to help evaluate your condition and provide medical guidance. Could you tell me more about how long you've had these symptoms and if anything makes them better or worse?`,
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
          },
        ];

        // If in doctor view for demo patient David K. or Elena R., add their initial symptom message:
        if (consultationId === 'cons-1') {
          starterMessages.push({
            id: 'msg-patient-1',
            consultation_id: consultationId,
            sender_id: 'patient-david-k',
            message_type: 'text',
            content: 'Hello doctor, I have an acute throbbing migraine on my left temple with sensitivity to bright lights for the past 2 days. Over-the-counter paracetamol is not providing relief.',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
          });
        } else if (consultationId === 'cons-2') {
          starterMessages.push({
            id: 'msg-patient-2',
            consultation_id: consultationId,
            sender_id: 'patient-elena-r',
            message_type: 'text',
            content: 'Hi doctor! I have this itchy red contact dermatitis rash on my forearm after gardening yesterday. Could you review what soothing prescription might help?',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
          });
        }

        setMessages(starterMessages);
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

  // Setup Supabase Realtime channel
  useEffect(() => {
    const channel = supabase.channel(`consultation:${consultationId}`)
      .on('broadcast', { event: 'new-message' }, (payload) => {
        if (payload?.payload) {
          setMessages((prev) => [...prev, payload.payload]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId]);

  // Handle Text Message Send
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const senderId = isDoctorView 
      ? (user?.id || doctor?.profile_id || 'doctor-1')
      : (user?.id || 'patient-user');

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      consultation_id: consultationId,
      sender_id: senderId,
      message_type: 'text',
      content: userText,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Broadcast via Supabase Realtime
    supabase.channel(`consultation:${consultationId}`).send({
      type: 'broadcast',
      event: 'new-message',
      payload: newMessage,
    });

    // If sent by patient in patient view, simulate doctor clinical response with realistic typing
    if (!isDoctorView) {
      setIsDoctorTyping(true);
      setTimeout(() => {
        setIsDoctorTyping(false);
        const lower = userText.toLowerCase();
        let replyText = "Thank you for the update. I am reviewing your clinical response. Please tell me if this is accompanied by any nausea, dizziness, or shortness of breath?";
        
        if (lower.includes('pain') || lower.includes('hurt') || lower.includes('ache') || lower.includes('sore')) {
          replyText = "I understand you are experiencing discomfort. On a scale of 1 to 10, how intense would you rate the pain right now? Does resting or changing position relieve it?";
        } else if (lower.includes('cough') || lower.includes('fever') || lower.includes('cold') || lower.includes('flu') || lower.includes('throat')) {
          replyText = "Noted on the viral/upper respiratory symptoms. Keep your fluid intake high with warm herbal tea or broth. I will review suitable supportive therapeutics for you.";
        } else if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('rx') || lower.includes('antibiotic') || lower.includes('drug')) {
          replyText = "I can prepare an electronic prescription for you right now so our pharmacy can fulfill doorstep delivery. Do you have any known allergies to antibiotics or NSAIDs?";
        } else if (lower.includes('headache') || lower.includes('migraine')) {
          replyText = "Headache symptoms can stem from tension, dehydration, or vascular inflammation. Are you experiencing sensitivity to bright lights or sound?";
        }

        const doctorReply: ChatMessage = {
          id: `doc-reply-${Date.now()}`,
          consultation_id: consultationId,
          sender_id: doctor?.profile_id || 'doctor-1',
          message_type: 'text',
          content: replyText,
          is_read: true,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, doctorReply]);
        supabase.channel(`consultation:${consultationId}`).send({
          type: 'broadcast',
          event: 'new-message',
          payload: doctorReply,
        });
      }, 1500);
    }
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
          id: `audio-${Date.now()}`,
          consultation_id: consultationId,
          sender_id: user?.id || 'patient-user',
          message_type: 'audio',
          attachment_url: audioUrl,
          attachment_metadata: {
            duration_seconds: recordingDuration,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, voiceMessage]);
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
      id: `img-${Date.now()}`,
      consultation_id: consultationId,
      sender_id: user?.id || 'patient-user',
      message_type: 'image',
      content: file.name,
      attachment_url: imgUrl,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, imgMessage]);
  };

  // File Upload (PDF / Lab Report)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const fileMessage: ChatMessage = {
      id: `file-${Date.now()}`,
      consultation_id: consultationId,
      sender_id: user?.id || 'patient-user',
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

    setMessages((prev) => [...prev, fileMessage]);
  };

  // Issue Digital Prescription (Doctor Action)
  const handleIssuePrescription = () => {
    const rxMessage: ChatMessage = {
      id: `rx-${Date.now()}`,
      consultation_id: consultationId,
      sender_id: doctor?.profile_id || 'doctor-1',
      message_type: 'prescription',
      content: JSON.stringify({
        diagnosis: rxDiagnosis || 'Acute Upper Respiratory Tract Infection',
        medications: rxMedications,
      }),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, rxMessage]);
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all"
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
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto" />
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
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
          <Stethoscope className="w-8 h-8 text-teal-600" />
        </div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
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
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-98 transition-all"
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
    <div className="h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] flex flex-col bg-slate-100 overflow-hidden">
      
      {/* Hidden Audio Player instance */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* 1. CHAT HEADER BAR */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(isDoctorView ? '/doctor/dashboard' : '/doctors')}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isDoctorView ? (
            /* Doctor's view of Patient */
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-heading font-bold text-sm overflow-hidden shrink-0">
                {patientInfo?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading font-bold text-sm text-slate-900 leading-tight">
                    Patient: {patientInfo?.name || 'David K. (38)'}
                  </h2>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                    {patientInfo?.urgency || 'moderate'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium truncate max-w-xs sm:max-w-md">
                  Symptoms: {patientInfo?.symptoms || 'Acute migraine and photophobia'}
                </p>
              </div>
            </div>
          ) : (
            /* Patient's view of Doctor */
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-800 text-sm overflow-hidden shrink-0">
                {docName.replace('Dr. ', '').charAt(0)}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-heading font-bold text-sm text-slate-900 leading-tight">
                    {docName}
                  </h2>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {doctor?.specialty || 'General Practitioner'} • 🟢 Online Now
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Actions & Call Simulators */}
        <div className="flex items-center gap-2">
          {isDoctorView ? (
            <>
              <Link
                href="/pharmacy"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                <span>Pharmacy formulary</span>
              </Link>
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-teal-600/20 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Issue Prescription</span>
              </button>
            </>
          ) : (
            <Link
              href="/pharmacy"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Pharmacy Store</span>
              <span className="sm:hidden">Rx</span>
            </Link>
          )}
        </div>
      </header>

      {/* 2. CHAT STREAM / MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = isDoctorView
            ? msg.sender_id === (user?.id || 'doctor-1') || msg.sender_id === (doctor?.profile_id || 'doctor-1')
            : msg.sender_id === (user?.id || 'patient-user') || (msg.sender_id !== 'system' && msg.sender_id !== (doctor?.profile_id || 'doctor-1'));
          const isSystem = msg.message_type === 'system';
          const isPrescription = msg.message_type === 'prescription';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-slate-200/80 text-slate-600 text-[11px] px-3 py-1 rounded-full font-medium text-center max-w-md">
                  {msg.content}
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
              <div key={msg.id} className="flex justify-start max-w-lg my-3">
                <div className="bg-white rounded-2xl border-2 border-teal-600 p-5 shadow-md space-y-4 w-full">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 font-heading">
                          Digital Prescription
                        </span>
                        <h4 className="font-heading font-bold text-sm text-slate-900">
                          {parsedRx.diagnosis}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">
                      Rx #{msg.id.slice(-6)}
                    </span>
                  </div>

                  {/* Medications list */}
                  <div className="space-y-2.5">
                    {parsedRx.medications.map((med, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{med.name}</span>
                          <span className="text-teal-700">${(med.price || 14.50).toFixed(2)}</span>
                        </div>
                        <p className="text-slate-600 font-medium text-[11px]">
                          <strong>Dosage:</strong> {med.dosage} • {med.frequency} for {med.duration}
                        </p>
                        <p className="text-slate-600 text-[11px] italic">
                          Instruction: {med.instructions}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pharmacy Transfer Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleAddPrescriptionToCart(parsedRx.medications)}
                      className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-98 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add All Prescribed Medicines to Cart</span>
                    </button>
                    <p className="text-[10px] text-slate-600 text-center mt-1.5">
                      Fulfill directly with door-to-door express delivery from CLINIC Pharmacy.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-3 space-y-1.5 shadow-2xs ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200/80'
                }`}
              >
                {/* 1. Text Message */}
                {msg.message_type === 'text' && (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}

                {/* 2. Voice Note Message */}
                {msg.message_type === 'audio' && (
                  <div className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => togglePlayAudio(msg.attachment_url || '', msg.id)}
                      className={`p-2.5 rounded-full transition-transform active:scale-95 ${
                        isMe ? 'bg-white text-teal-700' : 'bg-teal-600 text-white'
                      }`}
                      aria-label="Play Voice Note"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 translate-x-0.5" />
                      )}
                    </button>

                    {/* Animated Waveform */}
                    <div className="flex items-center gap-1 h-6">
                      {[12, 24, 16, 28, 8, 20, 14, 22, 10].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: playingAudioId === msg.id ? `${h}px` : '8px' }}
                          className={`w-1 rounded-full transition-all duration-200 ${
                            isMe ? 'bg-white/80' : 'bg-teal-600/70'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className={`text-[10px] font-bold ${isMe ? 'text-teal-100' : 'text-slate-500'}`}>
                        {msg.attachment_metadata?.duration_seconds
                          ? `0:${msg.attachment_metadata.duration_seconds < 10 ? '0' : ''}${msg.attachment_metadata.duration_seconds}`
                          : 'Voice Note'}
                      </span>
                      <button
                        onClick={cycleAudioSpeed}
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
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
                      className="relative w-48 h-48 rounded-xl overflow-hidden cursor-pointer group bg-slate-100"
                    >
                      <Image
                        src={msg.attachment_url}
                        alt="Shared clinical media"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    {msg.content && <p className="text-[11px] opacity-90">{msg.content}</p>}
                  </div>
                )}

                {/* 4. File / Lab Report Message */}
                {msg.message_type === 'file' && (
                  <div className="flex items-center gap-3 p-2 bg-black/5 rounded-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{msg.content || 'Report.pdf'}</p>
                      <span className="text-[10px] opacity-75">
                        {msg.attachment_metadata?.size_bytes
                          ? `${(msg.attachment_metadata.size_bytes / 1024 / 1024).toFixed(1)} MB`
                          : 'Medical Document'}
                      </span>
                    </div>
                    <a
                      href={msg.attachment_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-black/10 rounded-lg"
                      aria-label="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Timestamp & Delivery Tick */}
                <div
                  className={`flex items-center justify-end gap-1 text-[10px] ${
                    isMe ? 'text-teal-100' : 'text-slate-600'
                  }`}
                >
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && <Check className="w-3 h-3" />}
                </div>
              </div>
            </motion.div>
          );
        })}
        {isDoctorTyping && (
          <div className="flex justify-start items-center gap-2 text-xs text-slate-500 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-teal-800 text-xs">
              {docName.replace('Dr. ', '').charAt(0)}
            </div>
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-bl-xs border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-slate-500 font-medium ml-1">Dr. {docName.replace('Dr. ', '')} is evaluating...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. CHAT INPUT DOCK */}
      <footer className="bg-white border-t border-slate-200 p-3 sm:p-4 pb-safe shrink-0 relative">
        
        {/* Emoji Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex flex-wrap gap-2 max-w-xs z-50">
            {['👋', '🙏', '🩺', '💊', '❤️', '👍', '😊', '🤒', '🤕', '💧'].map((emoji) => (
              <button
                key={emoji}
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

        {isRecording ? (
          /* Live Voice Recording Bar */
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl p-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-rose-700">
                0:{recordingDuration < 10 ? '0' : ''}{recordingDuration}
              </span>
              <div className="flex items-center gap-1 h-4">
                {[12, 20, 8, 16, 24, 10, 18].map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }} className="w-1 bg-rose-400 rounded-full" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-100"
                aria-label="Cancel Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={stopRecording}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Audio</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <div className="flex items-center gap-2">
            
            {/* Media Attachment Actions */}
            <div className="flex items-center gap-1">
              {/* Emojis */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                aria-label="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Upload Image */}
              <label className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Upload File / Lab Report */}
              <label className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Type your message, symptom questions, or updates..."
              className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:bg-white transition-all"
            />

            {/* Voice Note Trigger or Send Message */}
            {inputText.trim() ? (
              <button
                onClick={handleSendMessage}
                className="p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20 active:scale-95 transition-all"
                aria-label="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 active:scale-95 transition-all"
                aria-label="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
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
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-teal-600"
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
                          ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate">{med.name}</div>
                      <div className="text-[10px] text-teal-700 font-semibold">${med.price.toFixed(2)} • {med.dur}</div>
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
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Sign & Transmit to Chat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
