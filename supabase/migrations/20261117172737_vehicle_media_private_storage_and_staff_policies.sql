-- T-Moto Garage: editable vehicle and service media, private workshop uploads.
create table if not exists public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index if not exists vehicle_media_vehicle_id_idx on public.vehicle_media(vehicle_id);
alter table public.vehicle_media enable row level security;
drop policy if exists "Staff manage vehicle media" on public.vehicle_media;
create policy "Staff manage vehicle media" on public.vehicle_media for all to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
grant select, insert, update, delete on public.vehicle_media to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('tmoto-private-media','tmoto-private-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "T-Moto staff read private media" on storage.objects;
create policy "T-Moto staff read private media" on storage.objects for select to authenticated using (bucket_id='tmoto-private-media' and (select private.is_staff()));
drop policy if exists "T-Moto staff upload private media" on storage.objects;
create policy "T-Moto staff upload private media" on storage.objects for insert to authenticated with check (bucket_id='tmoto-private-media' and (select private.is_staff()));
drop policy if exists "T-Moto staff update private media" on storage.objects;
create policy "T-Moto staff update private media" on storage.objects for update to authenticated using (bucket_id='tmoto-private-media' and (select private.is_staff())) with check (bucket_id='tmoto-private-media' and (select private.is_staff()));
drop policy if exists "T-Moto staff delete private media" on storage.objects;
create policy "T-Moto staff delete private media" on storage.objects for delete to authenticated using (bucket_id='tmoto-private-media' and (select private.is_staff()));
