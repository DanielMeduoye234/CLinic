# CLINIC — E-Commerce & Integrated Pharmacy Rules

## 1. Overview & Business Integration

The CLINIC E-Commerce Pharmacy (`/pharmacy`) serves as the fulfillment bridge for telemedicine consultations and an independent health store. It allows patients to purchase both **Over-The-Counter (OTC)** medications / wellness products and **Prescription-Only (Rx)** drugs with full regulatory compliance.

---

## 2. Page Inventory & Routes

| Route | Page Name | Primary Objective | Key Features |
| :--- | :--- | :--- | :--- |
| `/pharmacy` | **Pharmacy Storefront** | Product discovery, deals, category browsing. | Hero banner, category grid, curated health kits, search bar. |
| `/pharmacy/category/[slug]`| **Category Catalog** | Filtered browse by health concern. | Multi-facet sidebar filters (dosage, brand, price, rating, Rx status). |
| `/pharmacy/[slug]` | **Single Product Details**| Clinical transparency, dosage, purchase. | Image gallery, Rx badge, ingredients, dosage tab, Add to Cart. |
| `/cart` | **Full Cart & Drawer** | Order review, prescription attachment. | Quantity modifiers, free shipping progress bar, Rx upload warning. |
| `/checkout` | **Frictionless Checkout** | Delivery, payment, pharmacist review. | Shipping address autocomplete, prescription selector, Stripe payment. |
| `/orders/[id]` | **Order Tracking** | Post-purchase reassurance. | Live 5-step status stepper, delivery courier details, receipt PDF. |

---

## 3. Product Catalog & Details Specification

### 3.1 Over-The-Counter (OTC) vs. Prescription (Rx) Rules
- **OTC Products (Vitamins, Pain Relief, First Aid):**
  - Can be added directly to cart and checked out immediately without verification.
  - Clear `"OTC - No Prescription Needed"` green badge.
- **Rx Products (Antibiotics, Blood Pressure, Strong Analgesics):**
  - Displays amber `"Prescription Required"` (Rx) badge.
  - Add to cart triggers a prompt:
    1. *"Attach from my CLINIC consultations"* (Lists digital prescriptions from the user's account).
    2. *"Upload prescription photo/PDF"*.
  - Checkout is blocked until a valid prescription is attached.
  - Order status enters `'pharmacist_review'` before inventory is charged or dispatched.

### 3.2 Single Product Details (`/pharmacy/[slug]`)
- **Visuals:** High-res gallery with aspect-ratio `aspect-square`, thumbnail rail, and tap-to-zoom.
- **Header:** Brand name, generic molecule name (e.g. `Amoxicillin 500mg`), pack count (e.g. `20 Capsules`), rating (`4.8 ★ 92 reviews`).
- **Pricing:** Unit price, per-dose cost (e.g. `$0.45 / tablet`), insurance eligibility indicator if applicable.
- **Interactive Tabs / Accordions:**
  1. *Clinical Description & Indications:* What it treats.
  2. *Active Ingredients & Strengths:* Full pharmaceutical breakdown.
  3. *Dosage & Directions for Use:* How and when to take.
  4. *Safety Warnings & Contraindications:* Pregnancy warnings, drug interactions.
  5. *Storage Conditions:* e.g. Store below 25°C in a dry place.
- **Sticky Mobile Purchase Bar:** Fixed at the bottom of the screen on mobile devices showing price, quantity selector, and `"Add to Cart"`.

---

## 4. Shopping Cart & Drawer Rules

1. **Slide-Over Drawer:** Clicking the cart icon anywhere on the site opens a smooth right slide-over drawer (`w-full sm:max-w-md`) with Framer Motion.
2. **Optimistic Cart State:** Incrementing, decrementing, or deleting items updates the UI in `0ms`, syncing with the backend in the background.
3. **Prescription Status Check:** If any item in the cart has `requires_prescription = true`, a prominent amber warning card is rendered:
   - *"1 item requires a valid prescription to dispense. [Attach Prescription]"*
4. **Free Shipping Progress Bar:**
   - Dynamic bar: `e.g. $14.20 away from FREE Express Delivery`.

---

## 5. Seamless Telemedicine-to-Pharmacy Bridge

When a doctor issues a digital prescription during a consultation:
1. The patient sees the interactive prescription bubble in their consultation chat.
2. The card features an **`"Add All Prescribed Items to Cart"`** CTA.
3. The platform searches the product catalog for the prescribed medicine SKUs.
4. With a single click:
   - All available prescribed items are injected into the patient's cart.
   - The digital prescription ID is automatically linked as the authorization document.
   - The patient is taken directly to the checkout screen with the prescription pre-verified!

---

## 6. Checkout & Order Tracking Architecture

### 6.1 Checkout Steps (Single Scrollable Accordion)
- **Step 1: Patient & Delivery Details:** Address with unit/apartment number, delivery instructions for courier.
- **Step 2: Delivery Speed:**
  - Standard Delivery (1–2 business days, $4.99 or Free over $35).
  - Rapid Urgent Delivery (Under 2 hours for acute medications via local partner pharmacy, $9.99).
- **Step 3: Pharmacist Consultation Option:** Checkbox: *"I would like a pharmacist to call me to explain how to take these medications."*
- **Step 4: Secure Payment:** Stripe Elements / Apple Pay / Google Pay integration.

### 6.2 Order Tracking Stepper (`/orders/[id]`)
Interactive visual stepper with real-time status updates via Supabase Realtime:
1. `Order Placed` (Timestamp)
2. `Pharmacist Verified` (License # & review notes)
3. `Packed & Sealed` (Tamper-evident medical packaging)
4. `Out for Delivery` (Driver contact & map tracking)
5. `Delivered` (Signature / photo proof).
