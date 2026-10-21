# CLINIC — Typography, Design System & Animation Rules

## 1. Typography System

The CLINIC typography system is designed around **clinical empathy, visual clarity, and reading speed**. Telemedicine platforms require high readability under stress (e.g. patients in pain or reviewing vital dosage instructions).

### 1.1 Font Pairings & Rationale

| Role | Font Family | Source | Rationale |
| :--- | :--- | :--- | :--- |
| **Primary Font (Headings, Heroes, Key CTAs, Clinical Intakes)** | **`Lexend`** | Google Fonts | Developed through scientific typographic research to reduce visual stress, minimize character crowding, and increase reading speed. Gives CLINIC an ultra-modern, warm, and highly accessible clinical identity. |
| **Secondary Font (UI Elements, Body, Data Tables, Metadata, Chat)** | **`Plus Jakarta Sans`** | Google Fonts | A geometric, highly legible sans-serif with clean proportions, wide apertures, and exceptional readability at small sizes (11px – 14px) for chat timestamps, badges, and medicine dosages. *(Fallback: `Inter`)* |

### 1.2 Next.js Font Configuration Setup
```typescript
// app/layout.tsx
import { Lexend, Plus_Jakarta_Sans } from 'next/font/google';

export const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
```

### 1.3 Typographic Scale & Hierarchy

| Element | Font | Size / Line Height | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Lexend | 48px / 1.15 | `font-display text-4xl sm:text-5xl font-extrabold tracking-tight` | Landing page hero, primary intake title |
| **Page Heading (H1)** | Lexend | 32px – 36px / 1.2 | `font-display text-2xl sm:text-3xl font-bold tracking-tight` | Doctor directory title, pharmacy catalog title |
| **Section Heading (H2)** | Lexend | 24px – 28px / 1.25 | `font-display text-xl sm:text-2xl font-semibold` | Doctor bio header, product details header |
| **Card / Subheading (H3)**| Lexend | 18px – 20px / 1.3 | `font-display text-lg font-semibold` | Doctor card name, product name in grid |
| **Body (Regular)** | Plus Jakarta | 15px – 16px / 1.6 | `font-sans text-sm sm:text-base text-slate-600 leading-relaxed` | Descriptions, articles, patient medical history |
| **Chat Message Text** | Plus Jakarta | 15px / 1.45 | `font-sans text-[15px] leading-relaxed` | Bubble messages in consultation |
| **Metadata / Badges** | Plus Jakarta | 12px – 13px / 1.2 | `font-sans text-xs font-medium tracking-wide uppercase` | Specialty pill tags, status pills, timestamps |

---

## 2. Color Palette & Healthcare Aesthetics

CLINIC rejects generic harsh blues or sterile hospital whites. We use a **curated teal and sky harmony** that projects clinical authority while feeling warm and hospitable.

```css
/* Custom CSS Color Variables */
:root {
  /* Brand Teal — Clinical Precision & Trust */
  --clinic-teal-50:  #F0FDFA;
  --clinic-teal-100: #CCFBF1;
  --clinic-teal-500: #14B8A6;
  --clinic-teal-600: #0D9488;  /* PRIMARY BRAND COLOR */
  --clinic-teal-700: #0F766E;
  --clinic-teal-900: #134E4A;

  /* Sky Blue — Friendly Reassurance */
  --clinic-sky-50:   #F0F9FF;
  --clinic-sky-500:  #0EA5E9;
  --clinic-sky-600:  #0284C7;  /* SECONDARY ACCENT */

  /* Neutral Slate — Soft, readable text & backgrounds */
  --clinic-bg:       #F8FAFC;  /* Slate-50 background */
  --clinic-surface:  #FFFFFF;  /* Card / Container surface */
  --clinic-border:   #E2E8F0;  /* Subtle divider */
  --clinic-text:     #0F172A;  /* Slate-900 high contrast text */
  --clinic-muted:    #64748B;  /* Slate-500 supporting copy */

  /* Semantic Alerts */
  --clinic-emergency:#DC2626;  /* Red-600 (Life-threatening emergency alerts) */
  --clinic-success:  #059669;  /* Emerald-600 (Doctor online, order confirmed) */
  --clinic-warning:  #D97706;  /* Amber-600 (Pending prescription review) */
}
```

### Contrast & Accessibility (WCAG AAA / AA)
- Body text (`#0F172A` or `#334155`) on white/neutral backgrounds exceeds **7:1 contrast ratio**.
- Interactive primary buttons (`#0D9488` with `#FFFFFF` text) achieve **4.6:1 contrast ratio**.
- No light gray text on white backgrounds allowed under 14px.

---

## 3. Framer Motion Animation Rules

### 3.1 Design Philosophy: Purposeful Micro-Interactions
Telemedicine interfaces must feel solid, calming, and responsive. **Never use gimmicky, bouncy, or slow animations that impede a patient seeking rapid care.**

### 3.2 Motion Presets & Tokens

#### 1. Page & Container Transitions (Subtle Fade + Rise)
```typescript
export const fadeInUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

#### 2. Staggered Doctor & Product Cards Grid
```typescript
export const staggerGridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05
    }
  }
};

export const staggerCardItem = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.2, ease: 'easeOut' } 
  }
};
```

#### 3. Modal & Mobile Bottom Sheet Spring Animation
```typescript
export const modalSheetVariants = {
  hidden: { y: '100%', opacity: 0.8 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 300,
      mass: 0.8
    }
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
};
```

#### 4. Chat Message Bubble Insertion
```typescript
export const chatMessageVariant = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.18, ease: 'easeOut' } 
  }
};
```

#### 5. Live Audio Recording Waveform Pulse
- Audio waveform visualizer pulses smoothly during recording using an animated Framer Motion bar sequence with `repeat: Infinity, repeatType: "reverse"`.

---

## 4. UI Polish & Aesthetics Golden Rules
1. **Rounded Corners:** Use modern, generous radiuses:
   - Cards & Dialogs: `rounded-2xl` (16px) or `rounded-3xl` (24px)
   - Buttons & Badges: `rounded-full` or `rounded-xl`
2. **Subtle Elevation & Shadows:** Use soft multi-layered shadows (`shadow-sm`, `shadow-md`, `shadow-teal-500/5`), avoid harsh black drop shadows.
3. **Glassmorphism:** Use sparingly for sticky headers and chat input bars: `bg-white/80 backdrop-blur-md border-b border-slate-200/60`.
4. **Zero Layout Shifts (CLS):** Always provide skeleton loaders matching the exact card dimension when fetching Gemini AI matches or doctor lists.
