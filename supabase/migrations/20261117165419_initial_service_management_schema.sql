-- T-Moto Garage initial schema (applied to project oxvftybytcwpdcqygxpp)
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','technician')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.is_active and au.role in ('owner','admin','technician')
  );
$$;
revoke all on function private.is_staff() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, phone text, email text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  plate text not null, vin text, make text not null, model text not null,
  production_year smallint check (production_year between 1885 and 2100),
  mileage_km integer check (mileage_km is null or mileage_km >= 0),
  notes text, qr_token uuid not null unique default gen_random_uuid(),
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_plate_idx on public.vehicles (upper(regexp_replace(plate, '\s+', '', 'g')));
create index vehicles_customer_id_idx on public.vehicles(customer_id);
create index vehicles_vin_idx on public.vehicles(vin) where vin is not null;

create table public.service_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_number bigint generated always as identity unique,
  customer_complaint text, initial_diagnosis text, work_summary text,
  status text not null default 'received'
    check (status in ('received','inspection','waiting_approval','waiting_parts','in_progress','quality_check','ready_for_pickup','delivered','cancelled')),
  received_at timestamptz not null default now(), started_at timestamptz,
  estimated_delivery_at timestamptz, completed_at timestamptz, delivered_at timestamptz,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivered_at is null or completed_at is null or delivered_at >= completed_at)
);
create index service_records_vehicle_idx on public.service_records(vehicle_id, received_at desc);
create index service_records_status_idx on public.service_records(status);

create table public.service_events (
  id uuid primary key default gen_random_uuid(),
  service_record_id uuid not null references public.service_records(id) on delete cascade,
  status text not null check (status in ('received','inspection','waiting_approval','waiting_parts','in_progress','quality_check','ready_for_pickup','delivered','cancelled')),
  title text not null, description text, occurred_at timestamptz not null default now(),
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index service_events_record_time_idx on public.service_events(service_record_id, occurred_at);

create table public.parts_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text not null, brand text, part_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_parts (
  id uuid primary key default gen_random_uuid(),
  service_record_id uuid not null references public.service_records(id) on delete cascade,
  part_id uuid references public.parts_catalog(id) on delete set null,
  part_name text not null, category text not null,
  action text not null default 'replaced' check (action in ('replaced','installed','repaired','inspected','maintained')),
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  notes text, is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index service_parts_record_idx on public.service_parts(service_record_id);

create table public.service_media (
  id uuid primary key default gen_random_uuid(),
  service_record_id uuid not null references public.service_records(id) on delete cascade,
  storage_path text not null, caption text,
  media_type text not null default 'image' check (media_type in ('image','document')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index service_media_record_idx on public.service_media(service_record_id);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger customers_set_updated_at before update on public.customers for each row execute function private.set_updated_at();
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function private.set_updated_at();
create trigger service_records_set_updated_at before update on public.service_records for each row execute function private.set_updated_at();
create trigger parts_catalog_set_updated_at before update on public.parts_catalog for each row execute function private.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
alter table public.service_events enable row level security;
alter table public.parts_catalog enable row level security;
alter table public.service_parts enable row level security;
alter table public.service_media enable row level security;

create policy "staff can read admin users" on public.admin_users for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_staff()));
create policy "staff can insert admin users" on public.admin_users for insert to authenticated
with check ((select private.is_staff()));
create policy "staff can update admin users" on public.admin_users for update to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff can delete admin users" on public.admin_users for delete to authenticated
using ((select private.is_staff()));

create policy "staff manage customers" on public.customers for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage vehicles" on public.vehicles for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage service records" on public.service_records for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage service events" on public.service_events for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage parts catalog" on public.parts_catalog for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage service parts" on public.service_parts for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff manage service media" on public.service_media for all to authenticated
using ((select private.is_staff())) with check ((select private.is_staff()));

revoke all on table public.admin_users, public.customers, public.vehicles,
  public.service_records, public.service_events, public.parts_catalog,
  public.service_parts, public.service_media from anon;
grant select, insert, update, delete on table public.admin_users, public.customers,
  public.vehicles, public.service_records, public.service_events, public.parts_catalog,
  public.service_parts, public.service_media to authenticated;

create or replace function public.get_public_service_history(p_qr_token uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'vehicle', jsonb_build_object('make',v.make,'model',v.model,'production_year',v.production_year,'plate',v.plate),
    'records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'service_number',sr.service_number,'status',sr.status,'received_at',sr.received_at,
        'started_at',sr.started_at,'estimated_delivery_at',sr.estimated_delivery_at,
        'completed_at',sr.completed_at,'delivered_at',sr.delivered_at,'work_summary',sr.work_summary,
        'events',coalesce((select jsonb_agg(jsonb_build_object('status',se.status,'title',se.title,'description',se.description,'occurred_at',se.occurred_at) order by se.occurred_at)
          from public.service_events se where se.service_record_id=sr.id and se.is_public),'[]'::jsonb),
        'parts',coalesce((select jsonb_agg(jsonb_build_object('part_name',sp.part_name,'category',sp.category,'action',sp.action,'quantity',sp.quantity,'notes',sp.notes) order by sp.created_at)
          from public.service_parts sp where sp.service_record_id=sr.id and sp.is_public),'[]'::jsonb),
        'media',coalesce((select jsonb_agg(jsonb_build_object('caption',sm.caption,'media_type',sm.media_type) order by sm.created_at)
          from public.service_media sm where sm.service_record_id=sr.id and sm.is_public),'[]'::jsonb)
      ) order by sr.received_at desc)
      from public.service_records sr where sr.vehicle_id=v.id and sr.is_published
    ),'[]'::jsonb)
  )
  from public.vehicles v where v.qr_token=p_qr_token and v.is_published;
$$;
revoke all on function public.get_public_service_history(uuid) from public;
grant execute on function public.get_public_service_history(uuid) to anon, authenticated;
comment on function public.get_public_service_history(uuid) is
'Public QR lookup. QR token is a bearer secret; only explicitly published service data is returned; no customer contact, VIN, or internal notes.';
