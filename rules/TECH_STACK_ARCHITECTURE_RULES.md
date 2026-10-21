# CLINIC — Tech Stack, Hosting & Security Architecture Rules

## 1. System Architecture Overview

CLINIC is architected as a modern, full-stack Next.js application deployed to **Vercel**, with **Supabase** acting as the unified Backend-as-a-Service (PostgreSQL database, Authentication, Realtime WebSockets, and S3-compatible Object Storage) and **Google Gemini 2.0** providing medical intelligence.

```
┌────────────────────────────────────────────────────────┐
│                   VERCEL HOSTING                       │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Next.js 15+ App Router                         │  │
│  │   - React Server Components (Doctor Directory)   │  │
│  │   - Client Components (Consultation Chat, Cart)  │  │
│  │   - Node.js Route Handlers (/api/triage, /api/..)│  │
│  └──────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     GOOGLE GEMINI AI     │  │      SUPABASE CLOUD      │
│  - gemini-2.0-flash      │  │  - PostgreSQL + PostGIS   │
│  - Medical Triage Engine │  │  - Row Level Security     │
│  - Structured JSON Output│  │  - Supabase Auth (JWT)    │
│  - Red-flag screening    │  │  - Realtime WebSockets    │
└──────────────────────────┘  │  - Encrypted Storage S3  │
                              └──────────────────────────┘
```

---

## 2. Next.js & Vercel Hosting Rules

### 2.1 Next.js App Router Structure
- **Server Components by Default:** Doctor directory listings, single doctor bio, and pharmacy product catalogs must be rendered as Server Components to maximize SEO indexing and eliminate client-side JavaScript waterfall requests.
- **Client Components (`'use client'`):** Reserved strictly for interactive UI subtrees:
  - Symptom Assessment Modal & Drawer
  - Real-time Consultation Chat Room (`/consultation/[id]`)
  - Voice note recorder & audio player
  - E-commerce Cart Drawer & Checkout Form.
- **Node.js Runtime on Vercel:**
  - Route handlers interacting with external SDKs (e.g. `@google/genai`, Stripe, Supabase Admin) must declare the Node.js runtime:
    ```typescript
    export const runtime = 'nodejs';
    export const dynamic = 'force-dynamic';
    ```

### 2.2 Route Handlers Inventory
- `POST /api/triage/analyze` — Sends patient symptoms to Gemini AI, returns structured specialty match & urgency.
- `POST /api/consultations/create` — Creates consultation session and provisions Realtime chat channel.
- `POST /api/prescriptions/issue` — Doctor creates signed digital prescription.
- `POST /api/pharmacy/checkout` — Initiates payment and creates pharmacy order.
- `GET /api/doctors/search` — High-speed cached doctor directory query.

---

## 3. Supabase Integration Rules

### 3.1 Authentication & Role-Based Access Control (RBAC)
- CLINIC supports 4 distinct user roles: `patient`, `doctor`, `pharmacist`, `admin`.
- Authentication uses Supabase Auth with Server-Side Auth helpers (`@supabase/ssr`).
- User session is validated in `middleware.ts` to protect doctor portals (`/doctor/*`) and patient medical records (`/patient/*`).

### 3.2 Row Level Security (RLS) Policies (HIPAA & Privacy Aligned)
Protected Health Information (PHI) must be strictly isolated. Every table has RLS enabled:

```sql
-- 1. Consultations Table RLS
alter table public.consultations enable row level security;

-- Patients can only view and create their own consultations
create policy "Patients view own consultations"
on public.consultations for select
using (auth.uid() = patient_id);

create policy "Patients insert own consultations"
on public.consultations for insert
with check (auth.uid() = patient_id);

-- Doctors can view consultations assigned to them
create policy "Doctors view assigned consultations"
on public.consultations for select
using (auth.uid() in (
    select profile_id from public.doctor_profiles where id = doctor_id
));

-- 2. Chat Messages RLS
alter table public.chat_messages enable row level security;

create policy "Participants view chat messages"
on public.chat_messages for select
using (
    exists (
        select 1 from public.consultations c
        where c.id = consultation_id
        and (c.patient_id = auth.uid() or c.doctor_id in (
            select id from public.doctor_profiles where profile_id = auth.uid()
        ))
    )
);

create policy "Participants send chat messages"
on public.chat_messages for insert
with check (
    auth.uid() = sender_id and
    exists (
        select 1 from public.consultations c
        where c.id = consultation_id
        and (c.patient_id = auth.uid() or c.doctor_id in (
            select id from public.doctor_profiles where profile_id = auth.uid()
        ))
    )
);
```

### 3.3 Supabase Storage Buckets Configuration

| Bucket Name | Privacy Level | Allowed MIME Types | Max Size | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `public-assets` | Public | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Doctor avatars, hospital logos, pharmacy product images. |
| `doctor-credentials` | Private | `application/pdf`, `image/*` | 15 MB | Medical licenses and degree certificates for admin verification. |
| `patient-vault` | Private | `application/pdf`, `image/*` | 25 MB | Lab reports, blood tests, X-rays, diagnostic scans. |
| `consultation-media` | Private | `audio/webm`, `audio/mp4`, `image/*`, `application/pdf` | 25 MB | Chat voice notes, symptom photos, shared files. |

- Files in private buckets are never exposed publicly; client applications fetch time-limited **Signed URLs** (15-minute expiration) generated on demand.

### 3.4 Supabase Realtime Channels
- A dedicated channel is opened per consultation: `clinic:consultation:[consultation_id]`.
- Presence is tracked via `channel.track({ user_id, online_at, is_typing })`.
- Messages are broadcasted with sub-200ms latency to all participants.

---

## 4. Environment Variables Specification

```env
# NEXT.JS & APP
NEXT_PUBLIC_APP_URL="https://clinic-health.vercel.app"
NEXT_PUBLIC_SITE_NAME="CLINIC"

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# GOOGLE GEMINI AI
GEMINI_API_KEY="AIzaSy..."

# PAYMENTS (STRIPE)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# RESEND (TRANSACTIONAL EMAILS & DOCTOR APPROVALS)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="CLINIC Credentialing <onboarding@clinic.health>"
```

