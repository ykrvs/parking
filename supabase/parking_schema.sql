create table if not exists public.users (
  id text primary key,
  rank text null,
  name text not null,
  is_admin boolean not null default false,
  is_technician boolean not null default false,
  ord_date timestamp with time zone null,
  phone text null,
  unit text null,
  created_at timestamp with time zone not null default now()
);

alter table public.users add column if not exists phone text null;
alter table public.users add column if not exists unit text null;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'depot'
  ) then
    update public.users set unit = depot where unit is null and depot is not null;
  end if;
end $$;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  variant text null,
  driver text null,
  driver_phone text null,
  driver_unit text null,
  level text not null,
  lot text not null,
  odometer numeric null,
  engine_hours numeric null,
  starter_v numeric null,
  starter_pct integer null,
  aux_v numeric null,
  aux_pct integer null,
  fuel_l numeric null,
  fuel_pct integer null,
  fire_ext_expiry date null,
  notes text null,
  check_in timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create unique index if not exists vehicles_level_lot_active_key
on public.vehicles (level, lot);

create index if not exists vehicles_plate_idx on public.vehicles (plate);
create index if not exists vehicles_check_in_idx on public.vehicles (check_in desc);
alter table public.vehicles add column if not exists driver_unit text null;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vehicles'
      and column_name = 'driver_depot'
  ) then
    update public.vehicles
    set driver_unit = driver_depot
    where driver_unit is null and driver_depot is not null;
  end if;
end $$;

create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid null,
  plate text not null,
  variant text null,
  level text null,
  lot text null,
  check_in timestamp with time zone null,
  check_out timestamp with time zone null,
  driver text null,
  driver_phone text null,
  driver_unit text null,
  odometer numeric null,
  engine_hours numeric null,
  starter_v numeric null,
  starter_pct integer null,
  aux_v numeric null,
  aux_pct integer null,
  fuel_l numeric null,
  fuel_pct integer null,
  fire_ext_expiry date null,
  notes text null,
  created_at timestamp with time zone not null default now()
);

create index if not exists history_vehicle_id_idx on public.history (vehicle_id);
create index if not exists history_check_out_idx on public.history (check_out desc);
create index if not exists history_created_at_idx on public.history (created_at desc);
alter table public.history add column if not exists driver_unit text null;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'history'
      and column_name = 'driver_depot'
  ) then
    update public.history
    set driver_unit = driver_depot
    where driver_unit is null and driver_depot is not null;
  end if;
end $$;

create table if not exists public.turret_esc_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null,
  plate text not null,
  user_name text not null,
  ics boolean not null default false,
  gsu boolean not null default false,
  wim boolean not null default false,
  trav_actuator boolean not null default false,
  elev_actuator boolean not null default false,
  gcu boolean not null default false,
  mdcu boolean not null default false,
  psu boolean not null default false,
  gun_gyro boolean not null default false,
  conv_ass boolean not null default false,
  boost_box_ass boolean not null default false,
  slip_ring boolean not null default false,
  turr_estop boolean not null default false,
  upplink_echute boolean not null default false,
  upplink_splate boolean not null default false,
  lowlink_splate boolean not null default false,
  lowlink_echute boolean not null default false,
  uppflex_chute boolean not null default false,
  lowflex_chute boolean not null default false,
  lws_comp boolean not null default false,
  scu integer null,
  dcu integer null,
  fault_list text null,
  notes text null,
  created_at timestamp with time zone not null default now()
);

create index if not exists turret_esc_logs_vehicle_id_idx
on public.turret_esc_logs (vehicle_id, created_at desc);

create table if not exists public.parking_config (
  id text primary key,
  layout jsonb not null,
  updated_at timestamp with time zone not null default now()
);

insert into public.parking_config (id, layout)
values (
  'default',
  '{
    "levels": [
      {
        "id": "level-1",
        "label": "Level 1",
        "desc": "Block 210 level 1 bay layout.",
        "icon": "L1",
        "lots": ["A15", "A14", "A13", "A12", "A11", "A10", "A9", "A8", "A7", "A6", "A5", "A4", "A3", "A2", "A1", "B15", "B14", "B13", "B12", "B11", "B10", "B9", "B8", "B7", "B6", "B5", "B4", "B3", "B2", "B1", "C15", "C14", "C13", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2", "C1", "D15", "D14", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1", "E15", "E14", "E13", "E12", "E11", "E10", "E9", "E8", "E7", "E6", "E5", "E4", "E3", "E2", "E1", "F9", "F8", "F7", "F6", "F5", "F4", "F3", "F2", "F1"],
        "layout": {
          "columns": [
            { "type": "lots", "id": "a", "lots": ["A15", "A14", "A13", "A12", "A11", "A10", "A9", "A8", "A7", "A6", "A5", "A4", "A3", "A2", "A1"] },
            { "type": "lots", "id": "b", "lots": ["B15", "B14", "B13", "B12", "B11", "B10", "B9", "B8", "B7", "B6", "B5", "B4", "B3", "B2", "B1"] },
            { "type": "lots", "id": "c", "lots": ["C15", "C14", "C13", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2", "C1"] },
            { "type": "driveway", "id": "driveway-west", "label": "DRIVEWAY" },
            { "type": "lots", "id": "d", "lots": ["D15", "D14", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1"] },
            { "type": "lots", "id": "e", "lots": ["E15", "E14", "E13", "E12", "E11", "E10", "E9", "E8", "E7", "E6", "E5", "E4", "E3", "E2", "E1"] },
            { "type": "driveway", "id": "driveway-east", "label": "DRIVEWAY" },
            { "type": "lots", "id": "f", "lots": ["F9", "F8", "F7", "F6", "F5", "F4", "F3", "F2", "F1"] }
          ]
        }
      },
      {
        "id": "level-2",
        "label": "Level 2",
        "desc": "Block 210 level 2 bay layout with training and store areas.",
        "icon": "L2",
        "lots": ["A15", "A14", "A13", "A12", "A11", "A10", "A9", "A8", "A7", "A6", "A5", "A4", "A3", "A2", "A1", "B15", "B14", "B13", "B12", "B11", "B10", "B9", "B8", "B7", "B6", "B5", "B4", "B3", "B2", "B1", "C15", "C14", "C13", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2", "C1", "D15", "D14", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1", "E15", "E14", "E13", "E12", "E11", "E10", "E9", "E8", "E7", "E6", "E5", "E4", "E3", "E2", "E1", "F6", "F5", "F4", "F3", "F2", "F1"],
        "layout": {
          "columns": [
            { "type": "lots", "id": "a", "lots": ["A15", "A14", "A13", "A12", "A11", "A10", "A9", "A8", "A7", "A6", "A5", "A4", "A3", "A2", "A1"] },
            { "type": "driveway", "id": "driveway-a-b", "label": "DRIVEWAY" },
            { "type": "lots", "id": "b", "lots": ["B15", "B14", "B13", "B12", "B11", "B10", "B9", "B8", "B7", "B6", "B5", "B4", "B3", "B2", "B1"] },
            { "type": "lots", "id": "c", "lots": ["C15", "C14", "C13", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2", "C1"] },
            { "type": "driveway", "id": "driveway-c-d", "label": "DRIVEWAY" },
            { "type": "lots", "id": "d", "lots": ["D15", "D14", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1"] },
            { "type": "lots", "id": "e", "lots": ["E15", "E14", "E13", "E12", "E11", "E10", "E9", "E8", "E7", "E6", "E5", "E4", "E3", "E2", "E1"] },
            { "type": "driveway", "id": "driveway-e-f", "label": "DRIVEWAY" },
            { "type": "mixed", "id": "f-and-areas", "cells": [{ "type": "lot", "id": "F6" }, { "type": "lot", "id": "F5" }, { "type": "lot", "id": "F4" }, { "type": "lot", "id": "F3" }, { "type": "lot", "id": "F2" }, { "type": "lot", "id": "F1" }, { "type": "area", "id": "gunnery-training", "label": "GUNNERY\nTRAINING", "rowSpan": 4 }, { "type": "area", "id": "peta-store", "label": "PETA\nSTORE", "rowSpan": 5 }] }
          ]
        }
      },
      {
        "id": "level-3",
        "label": "Level 3",
        "desc": "Default parking layout. Replace this with the confirmed Block 210 lots.",
        "icon": "L3",
        "lots": ["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "B3", "B4", "B5", "B6"]
      }
    ]
  }'::jsonb
)
on conflict (id) do nothing;

create table if not exists public.safety_messages (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  starts_at timestamp with time zone null,
  ends_at timestamp with time zone null,
  is_active boolean not null default true,
  created_by text null references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists safety_messages_active_schedule_idx
on public.safety_messages (is_active, starts_at, ends_at, created_at desc);

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.history enable row level security;
alter table public.turret_esc_logs enable row level security;
alter table public.parking_config enable row level security;
alter table public.safety_messages enable row level security;

grant usage on schema public to service_role;
grant select, insert, update on table public.users to service_role;
grant select, insert, update, delete on table public.vehicles to service_role;
grant select, insert, update, delete on table public.history to service_role;
grant select, insert, update, delete on table public.turret_esc_logs to service_role;
grant select, insert, update, delete on table public.parking_config to service_role;
grant select, insert, update, delete on table public.safety_messages to service_role;

create or replace function public.is_admin(user_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = user_id
      and is_admin = true
  );
$$;

create or replace function public.set_user_admin(
  actor_id text,
  target_id text,
  admin_value boolean
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if not public.is_admin(actor_id) then
    raise exception 'Only admins can update admin status';
  end if;

  update public.users
  set is_admin = admin_value
  where id = target_id
  returning * into updated_user;

  if updated_user.id is null then
    raise exception 'Target user not found';
  end if;

  return updated_user;
end;
$$;
