create table if not exists public.employee_health_records (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  age integer,
  age_group text,
  gender text,
  role text,
  experience_years numeric,
  work_mode text,
  shift_type text,
  work_hours_per_day numeric,
  sitting_hours_per_day numeric,
  commute_mins_per_day integer,
  sleep_hours numeric,
  physical_activity_mins_week integer,
  diet_type text,
  diet_salt_intake text,
  fast_food_per_week integer,
  tea_coffee_cups_day integer,
  smoking text,
  alcohol text,
  family_history_htn text,
  diabetes text,
  known_htn text,
  on_bp_medication text,
  stress_category text,
  stress_scale_0_10 numeric,
  height_cm numeric,
  weight_kg numeric,
  bmi numeric,
  bmi_category text,
  sbp_1 integer,
  dbp_1 integer,
  sbp_2 integer,
  dbp_2 integer,
  pulse integer,
  sbp_avg integer,
  dbp_avg integer,
  bp_category text,
  risk_score integer,
  risk_level text,
  created_at timestamptz not null default now()
);

alter table public.employee_health_records enable row level security;

revoke all on table public.employee_health_records from anon;
grant insert on table public.employee_health_records to authenticated;
grant select on table public.employee_health_records to authenticated;

drop policy if exists "Authenticated collectors can insert records" on public.employee_health_records;
create policy "Authenticated collectors can insert records"
on public.employee_health_records
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated collectors can read records" on public.employee_health_records;
create policy "Authenticated collectors can read records"
on public.employee_health_records
for select
to authenticated
using (true);
