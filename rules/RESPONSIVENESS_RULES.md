# CLINIC — Mobile Responsiveness & Adaptive Design Rules

## 1. Core Philosophy: Mobile-First Healthcare
Telemedicine and urgent health inquiries happen overwhelmingly on mobile devices (75%+ of traffic). Patients are frequently in bed, in transit, or managing symptoms on a smartphone. 
Every layout, component, and interaction in CLINIC **must be designed and verified on mobile viewports first** (360px – 430px) before scaling up to tablet (768px – 1024px) and desktop (1280px+).

---

## 2. Breakpoint System & Standard Grid

```css
/* Standard Tailwind & CSS Breakpoints */
xs: 375px;   /* Small modern smartphones (iPhone SE, Galaxy A) */
sm: 640px;   /* Large smartphones / Phablets */
md: 768px;   /* Tablets (iPad mini, iPad portrait) */
lg: 1024px;  /* Tablets landscape, small laptops */
xl: 1280px;  /* Standard Desktop / MacBook */
2xl: 1536px; /* Ultra-wide monitors */
```

### Layout Constraints
- Max Container Width: `max-w-7xl` (1280px) centered with `mx-auto`.
- Mobile Horizontal Padding: `px-4` (16px) or `px-5` (20px).
- Desktop Horizontal Padding: `px-6` (24px) or `px-8` (32px).

---

## 3. Strict Mobile Responsive Rules

### Rule 1: Touch Target Sizing (Accessibility Standard)
- All interactive controls (buttons, icon triggers, checkboxes, select dropdowns, chat inputs) **must have a minimum interactive bounding box of 48px × 48px**.
- Small visual icons (e.g., 20px close cross or audio mic) must use padding (`p-3`) or pseudo-elements to expand the tappable area to at least 48px.
- Spacing between adjacent touch targets must be at least `8px` (`gap-2` minimum) to prevent mis-taps.

### Rule 2: Viewport Height & Mobile Keyboard Handling (`dvh`)
- **Never rely on `100vh`** for full-screen modals, drawers, or chat rooms. Mobile browser chrome (Safari address bar, Chrome URL bar) and virtual keyboards cause viewport jitter and hide message inputs.
- Always use Dynamic Viewport Height:
  ```css
  height: 100dvh;
  min-height: 100dvh;
  ```
- For the consultation chat interface:
  - Container must use `flex flex-col h-[100dvh]`.
  - Chat message feed must use `flex-1 overflow-y-auto overscroll-contain`.
  - Chat input dock must use `sticky bottom-0 bg-white/95 backdrop-blur-md pb-safe` with `env(safe-area-inset-bottom)`.

### Rule 3: Bottom Sheet Pattern on Mobile vs. Centered Modal on Desktop
- On mobile devices (`< 768px`), all dialogs (Symptom Assessment, Doctor Match, Prescription Details, Cart Preview) **must slide up from the bottom as a Sheet / Drawer**.
  - Includes a visual drag handle at top (`w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2`).
  - Supports swipe-down to dismiss.
  - Border radius: `rounded-t-3xl rounded-b-none`.
- On desktop devices (`>= 768px`), the component transforms into a centered, floating modal dialog (`max-w-xl rounded-2xl p-6`).

### Rule 4: Data-Dense Views & Tables
- Telemedicine records, doctor directories, and order lists must **never trigger horizontal page scrolling** on mobile.
- Desktop multi-column tables (e.g. Order History, Doctor Consultation Logs) must automatically refactor into **stacked visual cards** on viewports `< md`.
  ```html
  <!-- Desktop: Table | Mobile: Card List -->
  <div class="hidden md:block"><table>...</table></div>
  <div class="block md:hidden space-y-3"><div class="card">...</div></div>
  ```

### Rule 5: Sticky Mobile Navigation & Action Bars
- **Bottom Navigation Bar (Mobile Only):**
  - Persistent bottom bar with 5 key icons: `Home`, `Find Doctors`, `Symptom Check (Floating Center Pill)`, `Pharmacy`, `Profile`.
  - Height: `h-16 pb-safe`.
- **Doctor Profile Sticky Booking Bar:**
  - On mobile, when viewing a doctor profile (`/doctors/[slug]`), pin a sticky action bar to the viewport bottom showing:
    - Doctor fee (e.g., `$45 / session`)
    - Primary CTA: `"Instant Chat"` (takes 65% width)
    - Secondary CTA: Calendar icon for scheduled booking.

### Rule 6: Image & Media Scaling
- All doctor avatars and pharmacy product images must use responsive aspect ratios (`aspect-square`, `aspect-[4/3]`) with `object-cover`.
- Use Next.js `<Image>` component with responsive `sizes` attribute:
  ```jsx
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  ```
- Prevent layout shifts by strictly declaring width/height or filling an aspect-ratio container.

---

## 4. Mobile Responsiveness Quality Checklist
Before approving any page or component, test against:
- [ ] iPhone SE (375px width) — No truncated text, no horizontal overflow.
- [ ] iPhone 15 Pro / Galaxy S24 (390px - 412px width) — Standard baseline check.
- [ ] Virtual Keyboard Open state in Chat — Input field stays pinned above keyboard.
- [ ] Safe area insets (`safe-top`, `safe-bottom`) for notched phones.
- [ ] Fast touch response: No 300ms mobile tap delay (`touch-action: manipulation`).
