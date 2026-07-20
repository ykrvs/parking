alter table public.vehicles
  add column if not exists is_vor boolean not null default false,
  add column if not exists next_servicing date,
  add column if not exists last_serviced date;

alter table public.history
  add column if not exists is_vor boolean not null default false,
  add column if not exists next_servicing date,
  add column if not exists last_serviced date;

create index if not exists vehicles_facility_next_servicing_idx
  on public.vehicles (facility_code, next_servicing)
  where next_servicing is not null;
