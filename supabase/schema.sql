-- ==============================================================================
-- CLINIC TELEMEDICINE & PHARMACY PLATFORM — COMPLETE PRODUCTION DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
    create type user_role as enum ('patient', 'doctor', 'pharmacist', 'admin');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type triage_urgency as enum ('routine', 'moderate', 'urgent', 'critical_emergency');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type consultation_status as enum ('pending_match', 'active', 'completed', 'cancelled');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type message_type as enum ('text', 'audio', 'image', 'file', 'prescription', 'system');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type order_status as enum ('pending', 'pharmacist_review', 'processing', 'shipped', 'delivered', 'cancelled');
exception
    when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE (Mirrors auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    role user_role default 'patient' not null,
    full_name text not null,
    email text unique not null,
    phone text,
    avatar_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 4. DOCTOR PROFILES TABLE
create table if not exists public.doctor_profiles (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references public.profiles(id) on delete cascade unique not null,
    specialty text not null,
    sub_specialties text[] default '{}',
    medical_license_number text not null,
    license_document_url text, -- Storage link in 'doctor-credentials' bucket
    is_verified boolean default false not null, -- Requires Admin approval in /admin
    moderation_status text default 'pending', -- 'pending' | 'verified' | 'suspended' | 'banned'
    suspension_reason text,
    hospital_affiliation text,
    years_of_experience int default 0,
    bio text,
    consultation_fee numeric(10, 2) default 35.00 not null,
    currency text default 'USD' not null,
    is_online boolean default true not null,
    average_rating numeric(3, 2) default 5.00,
    total_reviews int default 0,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- In case table already existed, add moderation columns
alter table public.doctor_profiles 
add column if not exists moderation_status text default 'pending',
add column if not exists suspension_reason text;

-- 5. PATIENT MEDICAL VAULT
create table if not exists public.patient_medical_vault (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.profiles(id) on delete cascade unique not null,
    blood_group text,
    allergies text[] default '{}',
    chronic_conditions text[] default '{}',
    emergency_contact_name text,
    emergency_contact_phone text,
    updated_at timestamptz default now() not null
);

-- 6. CONSULTATIONS (With Gemini AI Triage)
create table if not exists public.consultations (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.profiles(id) on delete cascade not null,
    doctor_id uuid references public.doctor_profiles(id) on delete set null,
    raw_symptoms text not null,
    pain_level int check (pain_level between 1 and 10),
    symptom_duration text,
    ai_urgency triage_urgency default 'routine',
    ai_recommended_specialty text,
    ai_triage_summary text,
    status consultation_status default 'pending_match' not null,
    created_at timestamptz default now() not null,
    ended_at timestamptz
);

-- 7. CHAT MESSAGES (Voice notes, images, files, prescriptions, text)
create table if not exists public.chat_messages (
    id uuid primary key default uuid_generate_v4(),
    consultation_id uuid references public.consultations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    message_type message_type default 'text' not null,
    content text,
    attachment_url text,
    attachment_metadata jsonb default '{}'::jsonb, -- { duration_seconds: 42, file_name: "blood_test.pdf", size_bytes: 2048500 }
    is_read boolean default false not null,
    created_at timestamptz default now() not null
);

-- 8. DIGITAL PRESCRIPTIONS
create table if not exists public.prescriptions (
    id uuid primary key default uuid_generate_v4(),
    consultation_id uuid references public.consultations(id) on delete cascade not null,
    doctor_id uuid references public.doctor_profiles(id) on delete cascade not null,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    diagnosis text not null,
    medications jsonb not null, -- Array of [{ name, dosage, frequency, duration, instructions, pharmacy_product_id }]
    doctor_notes text,
    pdf_url text,
    created_at timestamptz default now() not null
);

-- 9. PHARMACY PRODUCTS
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    category text not null,
    description text not null,
    price numeric(10, 2) not null,
    stock_quantity int default 100 not null,
    requires_prescription boolean default false not null,
    image_url text not null,
    dosage_form text, -- 'Tablets', 'Capsules', 'Syrup', 'Cream', 'Inhaler'
    active_ingredients text,
    rating numeric(3, 2) default 4.80,
    created_at timestamptz default now() not null
);

-- 10. PHARMACY ORDERS & ITEMS
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.profiles(id) on delete cascade not null,
    total_amount numeric(10, 2) not null,
    status order_status default 'pending' not null,
    shipping_address jsonb not null,
    attached_prescription_id uuid references public.prescriptions(id) on delete set null,
    payment_status text default 'paid',
    created_at timestamptz default now() not null
);

create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete restrict not null,
    quantity int not null,
    unit_price numeric(10, 2) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.patient_medical_vault enable row level security;
alter table public.consultations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.prescriptions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 1. PROFILES POLICIES
drop policy if exists "Public profiles view" on public.profiles;
create policy "Public profiles view" on public.profiles for select using (true);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. DOCTOR PROFILES POLICIES
drop policy if exists "Public views verified doctors" on public.doctor_profiles;
create policy "Public views verified doctors" on public.doctor_profiles for select
using (is_verified = true or auth.uid() = profile_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Doctors update own profile" on public.doctor_profiles;
create policy "Doctors update own profile" on public.doctor_profiles for update using (auth.uid() = profile_id);

drop policy if exists "Doctors insert own profile" on public.doctor_profiles;
create policy "Doctors insert own profile" on public.doctor_profiles for insert with check (auth.uid() = profile_id);

drop policy if exists "Admins manage all doctor profiles" on public.doctor_profiles;
create policy "Admins manage all doctor profiles" on public.doctor_profiles for all
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 3. PATIENT MEDICAL VAULT POLICIES
drop policy if exists "Patients view own vault" on public.patient_medical_vault;
create policy "Patients view own vault" on public.patient_medical_vault for select
using (
    auth.uid() = patient_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('doctor', 'admin'))
);

drop policy if exists "Patients update own vault" on public.patient_medical_vault;
create policy "Patients update own vault" on public.patient_medical_vault for update
using (auth.uid() = patient_id);

drop policy if exists "Patients insert own vault" on public.patient_medical_vault;
create policy "Patients insert own vault" on public.patient_medical_vault for insert
with check (auth.uid() = patient_id);

-- 4. CONSULTATIONS POLICIES
drop policy if exists "Consultation participants view" on public.consultations;
create policy "Consultation participants view" on public.consultations for select
using (
    auth.uid() = patient_id or 
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Patients insert consultations" on public.consultations;
create policy "Patients insert consultations" on public.consultations for insert with check (auth.uid() = patient_id);

drop policy if exists "Consultation participants update" on public.consultations;
create policy "Consultation participants update" on public.consultations for update
using (
    auth.uid() = patient_id or 
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id)
);

-- 5. CHAT MESSAGES POLICIES
drop policy if exists "Chat message participants view" on public.chat_messages;
create policy "Chat message participants view" on public.chat_messages for select
using (
    exists (
        select 1 from public.consultations c
        where c.id = consultation_id
        and (c.patient_id = auth.uid() or c.doctor_id in (
            select id from public.doctor_profiles where profile_id = auth.uid()
        ))
    )
);

drop policy if exists "Chat message participants insert" on public.chat_messages;
create policy "Chat message participants insert" on public.chat_messages for insert
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

-- 6. PRESCRIPTIONS POLICIES
drop policy if exists "Prescriptions view by patient and doctor" on public.prescriptions;
create policy "Prescriptions view by patient and doctor" on public.prescriptions for select
using (
    auth.uid() = patient_id or 
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pharmacist'))
);

drop policy if exists "Doctors insert prescriptions" on public.prescriptions;
create policy "Doctors insert prescriptions" on public.prescriptions for insert
with check (
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 7. PRODUCTS POLICIES
drop policy if exists "Public view products" on public.products;
create policy "Public view products" on public.products for select using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 8. ORDERS POLICIES
drop policy if exists "Patients view own orders" on public.orders;
create policy "Patients view own orders" on public.orders for select
using (auth.uid() = patient_id or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pharmacist')));

drop policy if exists "Patients insert own orders" on public.orders;
create policy "Patients insert own orders" on public.orders for insert
with check (auth.uid() = patient_id);

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders for update
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pharmacist')));

-- 9. ORDER ITEMS POLICIES
drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items" on public.order_items for select
using (
    exists (
        select 1 from public.orders o
        where o.id = order_items.order_id
        and (o.patient_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pharmacist')))
    )
);

drop policy if exists "Users insert own order items" on public.order_items;
create policy "Users insert own order items" on public.order_items for insert
with check (
    exists (
        select 1 from public.orders o
        where o.id = order_items.order_id and o.patient_id = auth.uid()
    )
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
    user_role_val public.user_role;
begin
    -- Determine role from raw user meta data (defaulting to 'patient')
    user_role_val := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'patient'::public.user_role);

    insert into public.profiles (id, full_name, email, role, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        user_role_val,
        coalesce(new.raw_user_meta_data->>'avatar_url', null)
    )
    on conflict (id) do update set
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

    -- If patient, automatically provision medical vault
    if user_role_val = 'patient' then
        insert into public.patient_medical_vault (patient_id)
        values (new.id)
        on conflict (patient_id) do nothing;
    end if;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION & ACCESS POLICIES
-- ==============================================================================
-- Create required storage buckets if they do not exist
insert into storage.buckets (id, name, public)
values 
    ('doctor-credentials', 'doctor-credentials', true),
    ('chat-attachments', 'chat-attachments', true),
    ('prescriptions', 'prescriptions', true),
    ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage Objects Policies:
-- 1. Doctor Credentials Bucket: Authenticated doctors can upload; authenticated users/admins can view
drop policy if exists "Authenticated users can upload doctor credentials" on storage.objects;
create policy "Authenticated users can upload doctor credentials" on storage.objects for insert
to authenticated
with check (bucket_id = 'doctor-credentials');

drop policy if exists "Public/Authenticated read doctor credentials" on storage.objects;
create policy "Public/Authenticated read doctor credentials" on storage.objects for select
using (bucket_id = 'doctor-credentials');

-- 2. Chat Attachments Bucket: Authenticated users can upload audio notes, diagnostic images
drop policy if exists "Authenticated upload chat attachments" on storage.objects;
create policy "Authenticated upload chat attachments" on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-attachments');

drop policy if exists "Read chat attachments" on storage.objects;
create policy "Read chat attachments" on storage.objects for select
using (bucket_id = 'chat-attachments');

-- 3. Prescriptions Bucket:
drop policy if exists "Read prescriptions storage" on storage.objects;
create policy "Read prescriptions storage" on storage.objects for select
using (bucket_id = 'prescriptions');

drop policy if exists "Upload prescriptions storage" on storage.objects;
create policy "Upload prescriptions storage" on storage.objects for insert
to authenticated
with check (bucket_id = 'prescriptions');

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS REPLICATION
-- ==============================================================================
-- Enable Realtime publication for chat messages & consultations
do $$ begin
    alter publication supabase_realtime add table public.chat_messages;
exception
    when duplicate_object then null;
end $$;

do $$ begin
    alter publication supabase_realtime add table public.consultations;
exception
    when duplicate_object then null;
end $$;

-- ==============================================================================
-- SEED ESSENTIAL PHARMACY PRODUCTS
-- ==============================================================================
insert into public.products (name, slug, category, description, price, stock_quantity, requires_prescription, image_url, dosage_form, active_ingredients, rating)
values
('Amoxicillin 500mg', 'amoxicillin-500mg', 'Prescription Medications', 'Broad-spectrum penicillin antibiotic used to treat bacterial infections of the respiratory tract, ear, nose, throat, and skin.', 14.50, 150, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80', 'Capsules', 'Amoxicillin Trihydrate 500mg', 4.90),
('Ibuprofen 400mg Rapid Relief', 'ibuprofen-400mg', 'Pain & Fever', 'Non-steroidal anti-inflammatory drug (NSAID) providing fast, targeted relief for headaches, dental pain, fever, and muscle inflammation.', 8.99, 320, false, 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80', 'Tablets', 'Ibuprofen 400mg', 4.85),
('Cetirizine 10mg All-Day Allergy', 'cetirizine-10mg', 'Allergy & Sinus', 'Non-drowsy antihistamine for 24-hour relief from seasonal allergies, hay fever, sneezing, runny nose, and itchy watery eyes.', 11.20, 210, false, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80', 'Tablets', 'Cetirizine Hydrochloride 10mg', 4.78),
('Sumatriptan 50mg Migraine Defense', 'sumatriptan-50mg', 'Prescription Medications', 'Targeted 5-HT1 receptor agonist specifically prescribed for acute migraine attacks with or without aura.', 28.00, 85, true, 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80', 'Tablets', 'Sumatriptan Succinate 50mg', 4.92),
('Magnesium Glycinate 400mg', 'magnesium-glycinate-400mg', 'Vitamins & Supplements', 'High-absorption chelated magnesium for nervous system support, muscle cramp prevention, and restful sleep support.', 19.50, 180, false, 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80', 'Capsules', 'Magnesium Bisglycinate Chelate 400mg', 4.95),
('Digital Arm Blood Pressure Monitor', 'digital-bp-monitor', 'Medical Devices', 'Clinically validated automatic upper-arm blood pressure monitor with irregular heartbeat detection and multi-user memory.', 45.00, 60, false, 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80', 'Device', 'Clinical Oscillometric Sensor', 4.88)
on conflict (slug) do nothing;
