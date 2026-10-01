-- ==============================================================================
-- BioLoop Monitoring Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. BINS TABLE
create table if not exists public.bins (
    id text primary key,
    name text not null,
    location text not null,
    status text not null default 'Online', -- 'Online', 'Offline', 'Maintenance'
    capacity_kg numeric(6, 2) not null default 50.00,
    current_weight_kg numeric(6, 2) not null default 0.00,
    fill_level_pct numeric(5, 2) generated always as ((current_weight_kg / capacity_kg) * 100) stored,
    temp_c numeric(4, 1) not null default 28.4,
    battery_pct integer not null default 95,
    device_id text not null,
    lid_status text not null default 'Safe', -- 'Safe', 'Open', 'Leak Alert'
    last_comm_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. DEPOSITS TABLE (Transaction logs of UCO received)
create table if not exists public.deposits (
    id text primary key,
    bin_id text not null references public.bins(id) on delete cascade,
    source_name text not null, -- e.g., 'Restaurant A', 'School Canteen'
    deposit_code text not null unique, -- e.g., 'DEP-0134'
    weight_kg numeric(6, 2) not null,
    status text not null default 'Verified', -- 'Verified', 'Flagged', 'Pending'
    deposited_at timestamptz not null default now(),
    notes text
);

-- 3. FEEDSTOCK ASSESSMENTS TABLE (Chemical quality analysis, FFA, water content)
create table if not exists public.feedstock_assessments (
    id uuid primary key default uuid_generate_v4(),
    bin_id text not null references public.bins(id) on delete cascade,
    status text not null default 'Pretreatment Required', -- 'Optimal', 'Pretreatment Required', 'Critical Quality'
    details text not null default 'Elevated FFA • Water content • Visible solids detected. Requires technical review.',
    predicted_ffa numeric(4, 2) not null default 2.17,
    lab_ffa numeric(4, 2) not null default 2.05,
    review_requested boolean not null default false,
    review_notes text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now()
);

-- 4. PICKUP REQUESTS TABLE (Logistics for emptying full bins)
create table if not exists public.pickup_requests (
    id uuid primary key default uuid_generate_v4(),
    bin_id text not null references public.bins(id) on delete cascade,
    requested_by text not null,
    status text not null default 'Pending', -- 'Pending', 'Assigned', 'In Transit', 'Completed'
    current_fill_kg numeric(6, 2) not null,
    priority text not null default 'Standard', -- 'Low', 'Standard', 'Urgent'
    scheduled_for timestamptz,
    created_at timestamptz not null default now(),
    notes text
);

-- 5. SENSOR READINGS TABLE (Time-series telemetry for charts)
create table if not exists public.sensor_readings (
    id uuid primary key default uuid_generate_v4(),
    bin_id text not null references public.bins(id) on delete cascade,
    cumulative_weight_kg numeric(6, 2) not null,
    temp_c numeric(4, 1) not null,
    recorded_at timestamptz not null default now()
);

-- ==============================================================================
-- SEED DATA (Exact match to BioLoop Figma UI)
-- ==============================================================================

-- Insert default SmartBins
insert into public.bins (id, name, location, status, capacity_kg, current_weight_kg, temp_c, battery_pct, device_id, lid_status, last_comm_at)
values 
('BIN-001', 'BIN-001', 'NU Bacolod Collection Site', 'Online', 50.00, 34.72, 28.4, 95, 'ESP32-A1F3C', 'Safe', now() - interval '2 minutes'),
('BIN-002', 'BIN-002', 'Bacolod City Plaza Hub', 'Online', 50.00, 48.10, 29.1, 88, 'ESP32-B88D1', 'Safe', now() - interval '5 minutes'),
('BIN-003', 'BIN-003', 'Talisay Bio Refinery Drop', 'Online', 100.00, 22.40, 27.8, 99, 'ESP32-C449E', 'Safe', now() - interval '1 minute')
on conflict (id) do update set
    current_weight_kg = excluded.current_weight_kg,
    temp_c = excluded.temp_c,
    battery_pct = excluded.battery_pct,
    last_comm_at = excluded.last_comm_at;

-- Insert recent deposits
insert into public.deposits (id, bin_id, source_name, deposit_code, weight_kg, status, deposited_at)
values 
('dep-1', 'BIN-001', 'Restaurant A', 'DEP-0134', 2.90, 'Verified', now() - interval '3 hours 40 minutes'),
('dep-2', 'BIN-001', 'School Canteen', 'DEP-0133', 2.10, 'Verified', now() - interval '5 hours 50 minutes'),
('dep-3', 'BIN-001', 'Restaurant B', 'DEP-0131', 5.40, 'Verified', now() - interval '8 hours 20 minutes')
on conflict (id) do nothing;

-- Insert feedstock assessment
insert into public.feedstock_assessments (bin_id, status, details, predicted_ffa, lab_ffa, review_requested)
values 
('BIN-001', 'Pretreatment Required', 'Elevated FFA • Water content • Visible solids detected. Requires technical review.', 2.17, 2.05, false)
on conflict do nothing;

-- Enable Row Level Security (RLS) and public read policies
alter table public.bins enable row level security;
alter table public.deposits enable row level security;
alter table public.feedstock_assessments enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.sensor_readings enable row level security;

create policy "Allow public read access on bins" on public.bins for select using (true);
create policy "Allow public read access on deposits" on public.deposits for select using (true);
create policy "Allow public insert on deposits" on public.deposits for insert with check (true);
create policy "Allow public read access on feedstock_assessments" on public.feedstock_assessments for select using (true);
create policy "Allow public update on feedstock_assessments" on public.feedstock_assessments for update using (true);
create policy "Allow public read access on pickup_requests" on public.pickup_requests for select using (true);
create policy "Allow public insert on pickup_requests" on public.pickup_requests for insert with check (true);
