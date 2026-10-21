# MOBILE APP EXPERIENCE & DISTINCT MOBILE VIEW RULES

## 1. Core Principle: Native Mobile App Paradigm
The mobile view of CLINIC is **NOT** just a scaled-down desktop website. Mobile viewports must look, feel, and function like a **high-end native iOS / Android healthcare application** (inspired by Apple Health, One Medical, Babylon Health, and modern medical apps).
- The mobile view **can and should be visually and structurally distinct** from the desktop web application whenever it delivers a superior native app experience.
- The interface must prioritize thumb-zone reachability, gesture-friendly components, and clean visual breathing room.

---

## 2. Mobile Hero Section Guidelines
- **Simplicity Over Clutter:** On mobile screens, do not overlay dense multi-column text and large form inputs directly over busy background photographs.
- **Stylish Typography & Framer Motion:**
  - Feature a clean, modern, stylish `<h1>` with smooth Framer Motion transitions.
  - Implement a mobile-first sliding card carousel (touch-swipeable, fluid, with tactile dot indicators).
  - Each slide should be a concise, beautiful app card with clear contrast and an immediate single-tap call to action.
- **Quick Search & Triage:** Provide an accessible, app-like search/symptom input with a prominent, tactile flagship button ("Check Symptoms & Connect").

---

## 3. App-Style Component Patterns
1. **Header & Top App Bar:**
   - The mobile header must be minimal and uncrowded: `[Brand Logo]` on the left, `[Cart with badge]` and `[Menu icon]` on the right.
   - Do **NOT** crowd the top bar on mobile with text links like "Sign In" (all authentication and secondary actions live cleanly inside the mobile menu drawer).
2. **Mobile Menu as a Native App Sheet:**
   - When the hamburger menu opens, present an ultra-clean, slide-over app sheet with a frosted glass backdrop.
   - Feature an account status card, categorized icon navigation with descriptive subtitles, and a dedicated emergency 911 quick-dial action.
3. **Quick Action Grid (App Launchpad):**
   - Provide a 4-tile native action launcher (e.g., Doctor Consult, AI Triage, Find Hospitals, Digital Pharmacy) with high-contrast icon tiles and instant tap response.
4. **Horizontal Rails (App Scrollers):**
   - For lists like Specialties, Top Doctors, and Pharmacy Essentials, use horizontal swipe rails (`overflow-x-auto` with `snap-x` and hidden scrollbars) instead of cramped vertical grids.
5. **Touch Targets & Ergonomics:**
   - All interactive elements must maintain a minimum touch target of 44x44px.
   - Use rounded corners (`rounded-2xl`, `rounded-3xl`) and subtle elevated shadows to create depth.

---

## 4. Desktop vs. Mobile Dual-Layout Strategy
- Use responsive branches (e.g., `md:hidden` for mobile app components and `hidden md:block` for desktop components) where appropriate.
- Ensure state (such as symptom input, cart drawer, and triage modal) is shared seamlessly between both viewports.
