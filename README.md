# CLINIC — Telemedicine, AI Doctor Matching & Digital Pharmacy Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15.x-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-emerald?style=flat&logo=supabase)](https://supabase.com/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.0-blue?style=flat&logo=google)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Hosted%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4+-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Motion-Framer%20Motion-purple?style=flat)](https://www.framer.com/motion/)

---

## 🏥 About CLINIC
**CLINIC** is an all-in-one telemedicine ecosystem that connects patients in clinical distress directly with certified medical practitioners in under 60 seconds. Powered by **Google Gemini AI**, patients describe their symptoms in plain language, receive instant clinical triage and red-flag screening, get matched with available verified doctors, and immediately enter an interactive multi-modal consultation chat (with voice notes, files, images, and emojis). 

Following the consultation, patients can instantly fulfill doctor-prescribed medications with a single tap through the integrated **Digital Pharmacy E-Commerce Store**.

---

## 📁 Project Architecture & Documentation Index

All core architectural decisions, design tokens, and implementation guidelines have been codified into detailed markdown specifications:

| Document | Description |
| :--- | :--- |
| **[`PRD.md`](./PRD.md)** | **Master Product Requirements Document** — Executive vision, user personas, end-to-end user journeys, functional specs, complete Supabase PostgreSQL schema, Gemini AI integration, and 5-phase roadmap. |
| **[`rules/RESPONSIVENESS_RULES.md`](./rules/RESPONSIVENESS_RULES.md)** | **Mobile Responsiveness Guidelines** — Mobile-first standard, dynamic viewport height (`dvh`) for mobile virtual keyboards, touch target sizing (48px), and bottom sheet vs. modal patterns. |
| **[`rules/TYPOGRAPHY_DESIGN_RULES.md`](./rules/TYPOGRAPHY_DESIGN_RULES.md)** | **Typography & Design Rules** — Typography pairing (**Lexend** primary + **Plus Jakarta Sans** secondary), medical teal/sky color palette, WCAG AAA accessibility, and Framer Motion animation tokens. |
| **[`rules/UX_SIMPLICITY_RULES.md`](./rules/UX_SIMPLICITY_RULES.md)** | **UX Simplicity & Empathy Rules** — Frictionless 60-second time-to-consultation, progressive disclosure, CTA microcopy analysis (*"Check Symptoms & Connect"* vs. *"Tell us how you feel"*), and anti-complexity rules. |
| **[`rules/CHAT_FEATURE_RULES.md`](./rules/CHAT_FEATURE_RULES.md)** | **Consultation Chat Specification** — Real-time WebSockets, voice note recording with live waveform and 1x/1.5x/2x playback, image zoom lightboxes, PDF lab reports, emojis, and in-chat digital prescription cards. |
| **[`rules/GEMINI_AI_MATCHING_RULES.md`](./rules/GEMINI_AI_MATCHING_RULES.md)** | **Gemini AI Engine Rules** — Prompt engineering, structured JSON schema, medical specialty taxonomy, emergency red-flag screening (911/EMS routing), and doctor ranking algorithm. |
| **[`rules/ECOMMERCE_PHARMACY_RULES.md`](./rules/ECOMMERCE_PHARMACY_RULES.md)** | **Pharmacy & E-Commerce Rules** — Catalog, single product details, Rx vs. OTC gating, slide-over cart drawer, single-tap prescription-to-cart injection, and order tracking stepper. |
| **[`rules/TECH_STACK_ARCHITECTURE_RULES.md`](./rules/TECH_STACK_ARCHITECTURE_RULES.md)** | **Hosting & Security Architecture** — Next.js 15+ App Router, Vercel edge/serverless hosting, Supabase PostgreSQL RLS policies, encrypted storage buckets, and environment variables. |
| **[`rules/DOCTOR_ONBOARDING_ADMIN_RULES.md`](./rules/DOCTOR_ONBOARDING_ADMIN_RULES.md)** | **Doctor Onboarding & Admin Verification** — Zero-dummy-profile rule, mandatory medical license upload, "Awaiting approval" status screen, `/admin` credential verification portal, and Resend transactional approval email integration. |

---

## ⚡ Core Feature Highlights

### 1. Smart Symptom Triage & Matching
- Empathetic Hero CTA: **`"Check Symptoms & Connect"`** (Supported by: *"Describe how you feel in plain words. Our clinical AI matches you with the right specialist right now."*)
- Gemini 2.0 Flash semantic analysis parses symptoms, pain scales (1-10), and duration.
- Automated life-threatening emergency screening routes critical patients to immediate emergency contacts (911 / EMS).

### 2. Multi-Modal Telemedicine Chat
- **Text & Emojis:** Sub-200ms latency powered by Supabase Realtime channels.
- **Audio Voice Notes:** One-tap recording with live waveform decibel visualizer, preview, cancel, and 1.0x / 1.5x / 2.0x playback speeds.
- **Images & Photos:** Client-side WebP compression, secure upload, and in-app zoom/pan lightbox.
- **Lab & Diagnostic Reports:** PDF, DOCX, and DICOM upload and download.
- **In-Chat Digital Prescriptions:** Doctors issue signed prescriptions directly into the chat stream; patients click `"Add All to Pharmacy Cart"` to auto-populate checkout.

### 3. Comprehensive Directories & Profiles
- **Doctors:** Medical council verification badge, specialties, hospital affiliation, years of experience, patient reviews, fees, and live online presence indicators.
- **Patients:** Medical vault (allergies, blood type, chronic conditions, uploaded past lab reports), past consultation history, and active pharmacy orders.

### 4. Integrated Digital Pharmacy E-Commerce
- **Catalog & Categories:** Rx medications, OTC wellness, vitamins, and first aid devices.
- **Product Details:** Active ingredients, dosage instructions, contraindications, and high-definition galleries.
- **Cart & Checkout:** Slide-over drawer, prescription attachment verification, rapid 2-hour local delivery option, and secure Stripe payment.

---

## 🛠️ Tech Stack & Hosting

- **Frontend & Backend:** Next.js (App Router, React 19, Server Actions, Route Handlers)
- **Hosting:** Vercel (Edge network, Node.js serverless functions)
- **Database, Auth & Storage:** Supabase (PostgreSQL with RLS, Supabase Auth, Supabase Storage S3 buckets, Supabase Realtime)
- **AI Intelligence:** Google Gemini AI (`@google/genai` / `gemini-2.0-flash`)
- **Typography:** `Lexend` (Headings & Heroes) + `Plus Jakarta Sans` (UI & Body)
- **Styling & Animation:** Tailwind CSS + Framer Motion
