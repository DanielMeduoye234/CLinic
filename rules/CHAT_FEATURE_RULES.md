# CLINIC — Real-Time Multi-Modal Consultation Chat Rules

## 1. Overview & Architectural Goals

The CLINIC Consultation Chat is a production-grade, HIPAA/GDPR-aligned telemedicine communication suite. It must rival modern messaging apps (WhatsApp, Telegram) in speed, fluidity, and multi-modal richness, while providing medical-grade clinical tools (prescriptions, lab requests, and privacy protections).

---

## 2. Core Functional Requirements Matrix

| Capability | Specification | Tech Implementation |
| :--- | :--- | :--- |
| **1. Text Messaging** | Real-time bidirectional messaging, optimistic UI rendering, markdown formatting support. | Supabase Realtime Channel (`broadcast` & `postgres_changes`). |
| **2. Voice Notes (Audio)** | One-tap / hold-to-record voice note with live waveform visualizer, preview, cancel, and playback with variable speeds (`1x`, `1.5x`, `2x`). | HTML5 `MediaRecorder` API + Web Audio API + Supabase Storage. |
| **3. Image Sharing** | Camera snap or gallery upload for symptom inspection (rashes, swelling, wounds). Lightbox preview with pinch/zoom. | Client-side compression (WebP) + Supabase Storage + Signed URLs. |
| **4. File / Lab Reports** | PDF, DOCX, DICOM diagnostic report sharing up to 25MB with file icon, name, and size. | Supabase Storage bucket (`consultation-attachments`). |
| **5. Emoji Picker** | Lightweight popover for emotional reassurance and quick reactions. | Accessible emoji matrix or `@emoji-mart/react` / native Unicode. |
| **6. Message Receipts** | Single check (Sent), Double check (Delivered), Double Blue check (Read). | Realtime presence & `read_receipts` table updates. |
| **7. Typing & Presence** | `"Dr. Anya is typing..."` + live online status pulse. | Supabase Realtime Presence (`channel.track({ status, typing })`). |
| **8. Clinical Actions** | In-chat Digital Prescription Card with one-click `"Add All to Pharmacy Cart"`. | Structured JSON message type (`message_type: 'prescription'`). |

---

## 3. Detailed Component Specifications

### 3.1 Voice Note Recording & Playback Workflow

#### A. Recording State
1. **Trigger:** Patient or Doctor taps the Microphone icon in the chat input dock.
2. **Permission Request:** Browser prompts for microphone access with clear fallback if blocked.
3. **Recording Bar:** The text input collapses and reveals the Recording Bar:
   - Live elapsed timer (`00:14`)
   - Animated audio waveform reflecting real-time microphone decibels (`analyserNode.getByteFrequencyData`)
   - Trash / Cancel button (red icon) to abort recording
   - Send button (green checkmark or arrow) to immediately encode and dispatch.
4. **Encoding:** Record as `audio/webm;codecs=opus` (supported across modern Android, iOS Safari 14.1+, and desktop browsers).

#### B. Audio Player Component
- When an audio message is rendered in the chat bubble:
  - Play / Pause button with spinner state while buffering.
  - Interactive scrubbable waveform or progress bar showing current time / total duration (e.g. `0:42 / 1:15`).
  - Speed toggle button: Cycles between `1.0x` ➔ `1.5x` ➔ `2.0x`.
  - Audio files are stored in a private Supabase Storage bucket (`patient-audio-vault`) accessed strictly via short-lived signed URLs.

### 3.2 Image & Document Upload Workflow

1. **Client-Side Optimization:**
   - Before uploading images, compress client-side using `canvas.toBlob('image/webp', 0.85)` to keep uploads fast over mobile cellular networks.
   - Limit max dimension to 2048px while preserving diagnostic clarity.
2. **Progressive Upload States:**
   - Immediately display message bubble with a blurred thumbnail and an animated circular progress indicator (`0%` -> `100%`).
   - On completion, replace with the signed Supabase Storage URL.
3. **Lightbox Viewer:**
   - Tapping an image opens a full-screen Framer Motion modal with black backdrop (`bg-black/90`).
   - Supports double-tap to zoom, pinch-to-zoom, and download.

### 3.3 File & Lab Report Attachment Component
- Displays a dedicated medical document card:
  - Document badge: `PDF` (Red), `DOCX` (Blue), `LAB` (Teal).
  - File name: e.g., `Blood_Panel_Report_Oct2026.pdf`
  - File size: e.g., `2.4 MB`
  - Download / View button triggering secure authenticated stream.

### 3.4 Interactive Emoji Picker
- Positioned seamlessly above the input dock on desktop or as a bottom drawer on mobile.
- Categorized into Smileys, Gestures, Health & Care, and Objects.
- Must not cause layout jump or freeze the chat scroll position.

### 3.5 In-Chat Digital Prescription Card
When a doctor writes a prescription during the consultation, it renders directly in the chat stream:
```
┌────────────────────────────────────────────────────────┐
│  📋 DIGITAL PRESCRIPTION — Dr. Anya Sharma (MD)        │
│  Diagnosis: Acute Tension-Type Headache                │
├────────────────────────────────────────────────────────┤
│  1. Sumatriptan 50mg Tablets                           │
│     Take 1 tablet at headache onset. Max 100mg/24h.    │
│  2. Magnesium Glycinate 400mg                          │
│     Take 1 capsule daily before bed with water.        │
├────────────────────────────────────────────────────────┤
│  [🛒 Add All Prescribed Medicines to Pharmacy Cart]    │
│  [⬇️ Download Signed Prescription PDF]                │
└────────────────────────────────────────────────────────┘
```
- **The Pharmacy Bridge:** Clicking **`Add All Prescribed Medicines to Pharmacy Cart`** validates availability in the e-commerce database, automatically adds them to the user's cart, and routes the user directly to the checkout flow with the prescription attached!

---

## 4. Chat State Management & Resilience Rules

1. **Optimistic Updates:** Messages must appear in the UI immediately with a temporary UUID and a clock icon (`pending`), transitioning to a single tick upon Supabase DB confirmation.
2. **Offline Reconnection:** If the mobile device loses cellular connection:
   - Show a subtle amber banner at top: `"Reconnecting to consultation..."`.
   - On network recovery, auto-sync missed messages via `consultations/:id/messages?after=last_timestamp`.
3. **Scroll Anchoring:**
   - Chat automatically scrolls to bottom when new messages arrive *only if* the user is already within 100px of the bottom.
   - If the user has scrolled up to read past history, show a floating `"↓ New messages"` pill button to avoid hijacking their scroll.
4. **End of Consultation Protocol:**
   - Only the doctor or system can mark the consultation as `completed`.
   - When completed:
     - Chat input is disabled and replaced with: `"Consultation closed on [Date]. Read-only archive."`
     - Prompts patient to rate and review the doctor (1-5 stars + optional testimonial).
