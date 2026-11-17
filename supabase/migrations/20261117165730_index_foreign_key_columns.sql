create index if not exists vehicles_created_by_idx on public.vehicles(created_by) where created_by is not null;
create index if not exists service_records_created_by_idx on public.service_records(created_by) where created_by is not null;
create index if not exists service_events_created_by_idx on public.service_events(created_by) where created_by is not null;
create index if not exists service_parts_part_id_idx on public.service_parts(part_id) where part_id is not null;