-- ==============================================================================
-- CLINIC TELEMEDICINE & PHARMACY PLATFORM
-- PRODUCTION CHAT PERSISTENCE & DOCTOR ISOLATION MIGRATION SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_/sql
-- 2. Paste this entire SQL script into the SQL Editor and click "RUN".
-- 3. All consultations, chat messages, and doctor isolation policies will be active.
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

-- 3. ENSURE CONSULTATIONS TABLE EXISTS & HAS CORRECT STRUCTURE
create table if not exists public.consultations (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.profiles(id) on delete cascade not null,
    doctor_id uuid references public.doctor_profiles(id) on delete set null,
    raw_symptoms text not null default 'General clinical inquiry',
    pain_level int check (pain_level between 1 and 10),
    symptom_duration text,
    ai_urgency text default 'routine',
    ai_recommended_specialty text,
    ai_triage_summary text,
    status text default 'active' not null,
    created_at timestamptz default now() not null,
    ended_at timestamptz
);

-- Ensure indexes for instant querying and isolation
create index if not exists idx_consultations_patient on public.consultations(patient_id);
create index if not exists idx_consultations_doctor on public.consultations(doctor_id);
create index if not exists idx_consultations_status on public.consultations(status);

-- 4. ENSURE CHAT_MESSAGES TABLE EXISTS WITH AUTO-UUID
create table if not exists public.chat_messages (
    id uuid primary key default uuid_generate_v4(),
    consultation_id uuid references public.consultations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    message_type message_type default 'text' not null,
    content text,
    attachment_url text,
    attachment_metadata jsonb default '{}'::jsonb,
    is_read boolean default false not null,
    created_at timestamptz default now() not null
);

create index if not exists idx_chat_messages_cons on public.chat_messages(consultation_id);
create index if not exists idx_chat_messages_created on public.chat_messages(created_at);

-- 5. COMPATIBILITY VIEW: Support 'messages' table queries seamlessly
-- If any code queries 'messages', it routes directly to 'chat_messages'
do $$ begin
    if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'messages') then
        create or replace view public.messages as select * from public.chat_messages;
    end if;
exception
    when others then null;
end $$;

-- 6. ENABLE ROW LEVEL SECURITY
alter table public.consultations enable row level security;
alter table public.chat_messages enable row level security;

-- 7. CONSULTATIONS ROW LEVEL SECURITY (Strict doctor & patient isolation)
drop policy if exists "Consultation participants view" on public.consultations;
create policy "Consultation participants view" on public.consultations for select
using (
    -- Patient can only view their own consultations
    auth.uid() = patient_id or 
    -- Doctor can only view consultations assigned to their doctor profile
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    doctor_id in (select id from public.doctor_profiles where profile_id = auth.uid()) or
    -- Admins have clinical oversight
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Consultation participants insert" on public.consultations;
create policy "Consultation participants insert" on public.consultations for insert
with check (
    auth.uid() = patient_id or
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    doctor_id in (select id from public.doctor_profiles where profile_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Consultation participants update" on public.consultations;
create policy "Consultation participants update" on public.consultations for update
using (
    auth.uid() = patient_id or 
    auth.uid() in (select profile_id from public.doctor_profiles where id = doctor_id) or
    doctor_id in (select id from public.doctor_profiles where profile_id = auth.uid())
);

-- 8. CHAT MESSAGES ROW LEVEL SECURITY (Multi-Doctor Isolation)
-- A doctor can NEVER see or access messages of another doctor's consultation!
drop policy if exists "Chat message participants view" on public.chat_messages;
create policy "Chat message participants view" on public.chat_messages for select
using (
    exists (
        select 1 from public.consultations c
        where c.id = consultation_id
        and (
            c.patient_id = auth.uid() or 
            c.doctor_id in (select id from public.doctor_profiles where profile_id = auth.uid()) or
            auth.uid() in (select profile_id from public.doctor_profiles where id = c.doctor_id) or
            exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
);

drop policy if exists "Chat message participants insert" on public.chat_messages;
create policy "Chat message participants insert" on public.chat_messages for insert
with check (
    auth.uid() = sender_id and
    exists (
        select 1 from public.consultations c
        where c.id = consultation_id
        and (
            c.patient_id = auth.uid() or 
            c.doctor_id in (select id from public.doctor_profiles where profile_id = auth.uid()) or
            auth.uid() in (select profile_id from public.doctor_profiles where id = c.doctor_id) or
            exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
);

-- 9. ENABLE SUPABASE REALTIME REPLICATION
do $$ begin
    alter publication supabase_realtime add table public.chat_messages;
exception
    when duplicate_object then null;
    when others then null;
end $$;

do $$ begin
    alter publication supabase_realtime add table public.consultations;
exception
    when duplicate_object then null;
    when others then null;
end $$;

-- 10. GRANTS
grant all on public.consultations to authenticated, anon;
grant all on public.chat_messages to authenticated, anon;

-- Done!
