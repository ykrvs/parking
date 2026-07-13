-- Facilities (depots). Adding a third depot later is just a new row here —
-- no code changes needed. Named "facility_code" (not "depot") on the other
-- tables to avoid colliding with the old, now-unused "depot" column that
-- predates the depot -> unit rename below and may still exist in some
-- databases.
create table if not exists public.facilities (
  code text primary key,
  name text not null,
  created_at timestamp with time zone not null default now()
);

insert into public.facilities (code, name)
values ('11FMD', 'Block 210'), ('12FMD', '12')
on conflict (code) do nothing;

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
alter table public.users add column if not exists is_verified boolean not null default false;
alter table public.users add column if not exists facility_code text not null default '11FMD' references public.facilities(code);
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
  id text primary key,
  variant text null,
  vehicle_unit text null,
  driver text null,
  driver_id text null references public.users(id) on delete set null,
  driver_phone text null,
  driver_unit text null,
  level text not null,
  lot text null,
  odometer numeric null,
  engine_hours numeric null,
  starter_v numeric null,
  starter_pct integer null,
  aux_v numeric null,
  aux_pct integer null,
  fuel_l numeric not null,
  fuel_pct integer not null,
  fire_ext_expiry date null,
  notes text null,
  check_in timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

drop index if exists vehicles_level_lot_active_key;
create unique index if not exists vehicles_level_lot_active_key
on public.vehicles (facility_code, level, lot)
where lot is not null;

drop index if exists vehicles_plate_idx;
create index if not exists vehicles_check_in_idx on public.vehicles (check_in desc);
alter table public.vehicles add column if not exists driver_unit text null;
alter table public.vehicles add column if not exists vehicle_unit text null;
alter table public.vehicles add column if not exists driver_id text null references public.users(id) on delete set null;
alter table public.vehicles add column if not exists facility_code text not null default '11FMD' references public.facilities(code);
create index if not exists vehicles_facility_code_idx on public.vehicles (facility_code);
alter table public.vehicles alter column lot drop not null;
alter table public.vehicles alter column odometer drop not null;
alter table public.vehicles alter column engine_hours drop not null;
alter table public.vehicles alter column starter_v drop not null;
alter table public.vehicles alter column starter_pct drop not null;
alter table public.vehicles alter column aux_v drop not null;
alter table public.vehicles alter column aux_pct drop not null;
alter table public.vehicles alter column fire_ext_expiry drop not null;
alter table public.vehicles alter column id drop default;
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
  vehicle_id text null,
  variant text null,
  vehicle_unit text null,
  level text null,
  lot text null,
  check_in timestamp with time zone null,
  check_out timestamp with time zone null,
  driver text null,
  driver_id text null references public.users(id) on delete set null,
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

alter table public.history add column if not exists facility_code text null references public.facilities(code);
alter table public.history add column if not exists vehicle_unit text null;
create index if not exists history_facility_code_idx on public.history (facility_code);
create index if not exists history_vehicle_id_idx on public.history (vehicle_id);

create table if not exists public.vehicle_units (
  id uuid primary key default gen_random_uuid(),
  facility_code text not null references public.facilities(code) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  sort_order integer null,
  created_at timestamp with time zone not null default now(),
  unique (facility_code, name)
);

create index if not exists vehicle_units_facility_active_idx
on public.vehicle_units (facility_code, is_active, sort_order, name);

-- Audit trail for admin actions (verifying users, granting/revoking admin,
-- managing safety messages). actor_name/target_label are snapshotted at
-- write time so the log still reads sensibly after a user is removed
-- (e.g. following the ORD reminder workflow).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text null,
  actor_name text null,
  action text not null,
  target_id text null,
  target_label text null,
  details jsonb null,
  created_at timestamp with time zone not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists vehicles_driver_id_idx on public.vehicles (driver_id);
create index if not exists history_driver_id_idx on public.history (driver_id);
create index if not exists history_check_out_idx on public.history (check_out desc);
create index if not exists history_created_at_idx on public.history (created_at desc);
alter table public.history add column if not exists driver_unit text null;
alter table public.history add column if not exists driver_id text null references public.users(id) on delete set null;
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
  vehicle_id text not null,
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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vehicles'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    if exists (
      select 1
      from public.vehicles
      group by plate
      having count(*) > 1
    ) then
      raise exception 'Cannot migrate vehicles.id to MID plate because duplicate vehicle plates exist in public.vehicles';
    end if;

    create temporary table if not exists vehicle_id_migration_map
    on commit drop
    as
    select id::text as old_id, plate as new_id
    from public.vehicles;

    alter table public.vehicles alter column id drop default;
    alter table public.vehicles
      alter column id type text
      using plate;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'history'
        and column_name = 'vehicle_id'
        and data_type = 'uuid'
    ) then
      alter table public.history
        alter column vehicle_id type text
        using vehicle_id::text;

      update public.history history
      set vehicle_id = migration.new_id
      from vehicle_id_migration_map migration
      where history.vehicle_id = migration.old_id;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'turret_esc_logs'
        and column_name = 'vehicle_id'
        and data_type = 'uuid'
    ) then
      alter table public.turret_esc_logs
        alter column vehicle_id type text
        using vehicle_id::text;

      update public.turret_esc_logs logs
      set vehicle_id = migration.new_id
      from vehicle_id_migration_map migration
      where logs.vehicle_id = migration.old_id;
    end if;
  end if;
end $$;

alter table public.history
  alter column vehicle_id type text
  using vehicle_id::text;

alter table public.turret_esc_logs
  alter column vehicle_id type text
  using vehicle_id::text;

alter table public.vehicles drop column if exists plate;
alter table public.history drop column if exists plate;
alter table public.turret_esc_logs drop column if exists plate;

alter table public.vehicles drop constraint if exists vehicles_non_negative_values;
alter table public.vehicles
  add constraint vehicles_non_negative_values
  check (
    odometer >= 0 and
    engine_hours >= 0 and
    starter_v >= 0 and
    starter_pct >= 0 and starter_pct <= 100 and
    aux_v >= 0 and
    aux_pct >= 0 and aux_pct <= 100 and
    fuel_l >= 0 and
    fuel_pct >= 0 and fuel_pct <= 100
  ) not valid;

alter table public.history drop constraint if exists history_non_negative_values;
alter table public.history
  add constraint history_non_negative_values
  check (
    odometer >= 0 and
    engine_hours >= 0 and
    starter_v >= 0 and
    starter_pct >= 0 and starter_pct <= 100 and
    aux_v >= 0 and
    aux_pct >= 0 and aux_pct <= 100 and
    fuel_l >= 0 and
    fuel_pct >= 0 and fuel_pct <= 100
  ) not valid;

alter table public.turret_esc_logs drop constraint if exists turret_esc_logs_non_negative_values;
alter table public.turret_esc_logs
  add constraint turret_esc_logs_non_negative_values
  check (
    (scu is null or scu >= 0) and
    (dcu is null or dcu >= 0)
  ) not valid;

create table if not exists public.parking_config (
  id text primary key,
  layout jsonb not null,
  updated_at timestamp with time zone not null default now()
);

-- Migrate the pre-multi-depot single config row ('default') to be keyed by
-- facility code instead, so each depot can have its own layout.
update public.parking_config set id = '11FMD' where id = 'default';

insert into public.parking_config (id, layout)
values (
  '11FMD',
  $parking_config${
  "levels": [
    {
      "id": "workshop",
      "desc": "Block 210 level 1 workshop layout.",
      "icon": "WS",
      "lots": [
        "A11",
        "A10",
        "A9",
        "A8",
        "A7",
        "A6",
        "A5",
        "A4",
        "A3",
        "A2",
        "A1",
        "B14",
        "B13",
        "B12",
        "B11",
        "B10",
        "B9",
        "B8",
        "B7",
        "B6",
        "B5",
        "B4",
        "B3",
        "B2",
        "B1"
      ],
      "label": "Workshop",
      "layout": {
        "columns": [
          {
            "id": "store-areas",
            "type": "mixed",
            "cells": [
              {
                "id": "spare-store",
                "type": "area",
                "label": "SPARE\nSTORE",
                "rowSpan": 4
              },
              {
                "id": "innovation-room",
                "type": "area",
                "label": "INNOVATION\nROOM",
                "rowSpan": 5
              },
              {
                "id": "scrapyard",
                "type": "area",
                "label": "SCRAPYARD",
                "rowSpan": 5
              }
            ]
          },
          {
            "id": "driveway-1",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "a-and-stels",
            "type": "mixed",
            "cells": [
              {
                "id": "stels-area",
                "type": "area",
                "label": "STELS",
                "rowSpan": 3
              },
              {
                "id": "A11",
                "type": "lot"
              },
              {
                "id": "A10",
                "type": "lot"
              },
              {
                "id": "A9",
                "type": "lot"
              },
              {
                "id": "A8",
                "type": "lot"
              },
              {
                "id": "A7",
                "type": "lot"
              },
              {
                "id": "A6",
                "type": "lot"
              },
              {
                "id": "A5",
                "type": "lot"
              },
              {
                "id": "A4",
                "type": "lot"
              },
              {
                "id": "A3",
                "type": "lot"
              },
              {
                "id": "A2",
                "type": "lot"
              },
              {
                "id": "A1",
                "type": "lot"
              }
            ]
          },
          {
            "id": "b",
            "lots": [
              "B14",
              "B13",
              "B12",
              "B11",
              "B10",
              "B9",
              "B8",
              "B7",
              "B6",
              "B5",
              "B4",
              "B3",
              "B2",
              "B1"
            ],
            "type": "lots"
          }
        ]
      }
    },
    {
      "id": "level-1",
      "desc": "Block 210 level 1 bay layout.",
      "icon": "L1",
      "lots": [
        "A15",
        "A14",
        "A13",
        "A12",
        "A11",
        "A10",
        "A9",
        "A8",
        "A7",
        "A6",
        "A5",
        "A4",
        "A3",
        "A2",
        "A1",
        "B15",
        "B14",
        "B13",
        "B12",
        "B11",
        "B10",
        "B9",
        "B8",
        "B7",
        "B6",
        "B5",
        "B4",
        "B3",
        "B2",
        "B1",
        "C15",
        "C14",
        "C13",
        "C12",
        "C11",
        "C10",
        "C9",
        "C8",
        "C7",
        "C6",
        "C5",
        "C4",
        "C3",
        "C2",
        "C1",
        "D15",
        "D14",
        "D13",
        "D12",
        "D11",
        "D10",
        "D9",
        "D8",
        "D7",
        "D6",
        "D5",
        "D4",
        "D3",
        "D2",
        "D1",
        "E15",
        "E14",
        "E13",
        "E12",
        "E11",
        "E10",
        "E9",
        "E8",
        "E7",
        "E6",
        "E5",
        "E4",
        "E3",
        "E2",
        "E1",
        "F9",
        "F8",
        "F7",
        "F6",
        "F5",
        "F4",
        "F3",
        "F2",
        "F1"
      ],
      "label": "Level 1",
      "layout": {
        "columns": [
          {
            "id": "a",
            "lots": [
              "A15",
              "A14",
              "A13",
              "A12",
              "A11",
              "A10",
              "A9",
              "A8",
              "A7",
              "A6",
              "A5",
              "A4",
              "A3",
              "A2",
              "A1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-1",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "b",
            "lots": [
              "B15",
              "B14",
              "B13",
              "B12",
              "B11",
              "B10",
              "B9",
              "B8",
              "B7",
              "B6",
              "B5",
              "B4",
              "B3",
              "B2",
              "B1"
            ],
            "type": "lots"
          },
          {
            "id": "c",
            "lots": [
              "C15",
              "C14",
              "C13",
              "C12",
              "C11",
              "C10",
              "C9",
              "C8",
              "C7",
              "C6",
              "C5",
              "C4",
              "C3",
              "C2",
              "C1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-2",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "d",
            "lots": [
              "D15",
              "D14",
              "D13",
              "D12",
              "D11",
              "D10",
              "D9",
              "D8",
              "D7",
              "D6",
              "D5",
              "D4",
              "D3",
              "D2",
              "D1"
            ],
            "type": "lots"
          },
          {
            "id": "e",
            "lots": [
              "E15",
              "E14",
              "E13",
              "E12",
              "E11",
              "E10",
              "E9",
              "E8",
              "E7",
              "E6",
              "E5",
              "E4",
              "E3",
              "E2",
              "E1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-3",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "f",
            "lots": [
              "F9",
              "F8",
              "F7",
              "F6",
              "F5",
              "F4",
              "F3",
              "F2",
              "F1"
            ],
            "type": "lots"
          }
        ]
      }
    },
    {
      "id": "level-2",
      "desc": "Block 210 level 2 bay layout with training and store areas.",
      "icon": "L2",
      "lots": [
        "A15",
        "A14",
        "A13",
        "A12",
        "A11",
        "A10",
        "A9",
        "A8",
        "A7",
        "A6",
        "A5",
        "A4",
        "A3",
        "A2",
        "A1",
        "B15",
        "B14",
        "B13",
        "B12",
        "B11",
        "B10",
        "B9",
        "B8",
        "B7",
        "B6",
        "B5",
        "B4",
        "B3",
        "B2",
        "B1",
        "C15",
        "C14",
        "C13",
        "C12",
        "C11",
        "C10",
        "C9",
        "C8",
        "C7",
        "C6",
        "C5",
        "C4",
        "C3",
        "C2",
        "C1",
        "D15",
        "D14",
        "D13",
        "D12",
        "D11",
        "D10",
        "D9",
        "D8",
        "D7",
        "D6",
        "D5",
        "D4",
        "D3",
        "D2",
        "D1",
        "E15",
        "E14",
        "E13",
        "E12",
        "E11",
        "E10",
        "E9",
        "E8",
        "E7",
        "E6",
        "E5",
        "E4",
        "E3",
        "E2",
        "E1",
        "F6",
        "F5",
        "F4",
        "F3",
        "F2",
        "F1"
      ],
      "label": "Level 2",
      "layout": {
        "columns": [
          {
            "id": "a",
            "lots": [
              "A15",
              "A14",
              "A13",
              "A12",
              "A11",
              "A10",
              "A9",
              "A8",
              "A7",
              "A6",
              "A5",
              "A4",
              "A3",
              "A2",
              "A1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-a-b",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "b",
            "lots": [
              "B15",
              "B14",
              "B13",
              "B12",
              "B11",
              "B10",
              "B9",
              "B8",
              "B7",
              "B6",
              "B5",
              "B4",
              "B3",
              "B2",
              "B1"
            ],
            "type": "lots"
          },
          {
            "id": "c",
            "lots": [
              "C15",
              "C14",
              "C13",
              "C12",
              "C11",
              "C10",
              "C9",
              "C8",
              "C7",
              "C6",
              "C5",
              "C4",
              "C3",
              "C2",
              "C1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-c-d",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "d",
            "lots": [
              "D15",
              "D14",
              "D13",
              "D12",
              "D11",
              "D10",
              "D9",
              "D8",
              "D7",
              "D6",
              "D5",
              "D4",
              "D3",
              "D2",
              "D1"
            ],
            "type": "lots"
          },
          {
            "id": "e",
            "lots": [
              "E15",
              "E14",
              "E13",
              "E12",
              "E11",
              "E10",
              "E9",
              "E8",
              "E7",
              "E6",
              "E5",
              "E4",
              "E3",
              "E2",
              "E1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-e-f",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "f-and-areas",
            "type": "mixed",
            "cells": [
              {
                "id": "F6",
                "type": "lot"
              },
              {
                "id": "F5",
                "type": "lot"
              },
              {
                "id": "F4",
                "type": "lot"
              },
              {
                "id": "F3",
                "type": "lot"
              },
              {
                "id": "F2",
                "type": "lot"
              },
              {
                "id": "F1",
                "type": "lot"
              },
              {
                "id": "gunnery-training",
                "type": "area",
                "label": "GUNNERY\nTRAINING",
                "rowSpan": 4
              },
              {
                "id": "peta-store",
                "type": "area",
                "label": "PETA\nSTORE",
                "rowSpan": 5
              }
            ]
          }
        ]
      }
    },
    {
      "id": "level-3",
      "desc": "Block 210 level 3 bay layout with armskote and store areas.",
      "icon": "L3",
      "lots": [
        "A15",
        "A14",
        "A13",
        "A12",
        "A11",
        "A10",
        "A9",
        "A8",
        "A7",
        "A6",
        "A5",
        "A4",
        "A3",
        "A2",
        "A1",
        "B15",
        "B14",
        "B13",
        "B12",
        "B11",
        "B10",
        "B9",
        "B8",
        "B7",
        "B6",
        "B5",
        "B4",
        "B3",
        "B2",
        "B1",
        "C15",
        "C14",
        "C13",
        "C12",
        "C11",
        "C10",
        "C9",
        "C8",
        "C7",
        "C6",
        "C5",
        "C4",
        "C3",
        "C2",
        "C1",
        "D15",
        "D14",
        "D13",
        "D12",
        "D11",
        "D10",
        "D9",
        "D8",
        "D7",
        "D6",
        "D5",
        "D4",
        "D3",
        "D2",
        "D1",
        "E15",
        "E14",
        "E13",
        "E12",
        "E11",
        "E10",
        "E9",
        "E8",
        "E7",
        "E6",
        "E5",
        "E4",
        "E3",
        "E2",
        "E1",
        "F6",
        "F5",
        "F4",
        "F3",
        "F2",
        "F1"
      ],
      "label": "Level 3",
      "layout": {
        "columns": [
          {
            "id": "a",
            "lots": [
              "A15",
              "A14",
              "A13",
              "A12",
              "A11",
              "A10",
              "A9",
              "A8",
              "A7",
              "A6",
              "A5",
              "A4",
              "A3",
              "A2",
              "A1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-a-b",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "b",
            "lots": [
              "B15",
              "B14",
              "B13",
              "B12",
              "B11",
              "B10",
              "B9",
              "B8",
              "B7",
              "B6",
              "B5",
              "B4",
              "B3",
              "B2",
              "B1"
            ],
            "type": "lots"
          },
          {
            "id": "c",
            "lots": [
              "C15",
              "C14",
              "C13",
              "C12",
              "C11",
              "C10",
              "C9",
              "C8",
              "C7",
              "C6",
              "C5",
              "C4",
              "C3",
              "C2",
              "C1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-c-d",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "d",
            "lots": [
              "D15",
              "D14",
              "D13",
              "D12",
              "D11",
              "D10",
              "D9",
              "D8",
              "D7",
              "D6",
              "D5",
              "D4",
              "D3",
              "D2",
              "D1"
            ],
            "type": "lots"
          },
          {
            "id": "e",
            "lots": [
              "E15",
              "E14",
              "E13",
              "E12",
              "E11",
              "E10",
              "E9",
              "E8",
              "E7",
              "E6",
              "E5",
              "E4",
              "E3",
              "E2",
              "E1"
            ],
            "type": "lots"
          },
          {
            "id": "driveway-e-f",
            "type": "driveway",
            "label": "DRIVEWAY"
          },
          {
            "id": "f-and-areas",
            "type": "mixed",
            "cells": [
              {
                "id": "F6",
                "type": "lot"
              },
              {
                "id": "F5",
                "type": "lot"
              },
              {
                "id": "F4",
                "type": "lot"
              },
              {
                "id": "F3",
                "type": "lot"
              },
              {
                "id": "F2",
                "type": "lot"
              },
              {
                "id": "F1",
                "type": "lot"
              },
              {
                "id": "armskote",
                "type": "area",
                "label": "ARMSKOTE",
                "rowSpan": 4
              },
              {
                "id": "opstronic-store",
                "type": "area",
                "label": "OPSTRONIC\nSTORE",
                "rowSpan": 5
              }
            ]
          }
        ]
      }
    }
  ]
}
$parking_config$::jsonb
)
on conflict (id) do update
set layout = excluded.layout,
    updated_at = now();

-- Placeholder layout for the second depot (12FMD): same four
-- levels/titles as 11FMD, but no lots defined yet — fill this in via the
-- `parking_config` table in Supabase once the real layout is ready.
-- Uses `do nothing` on conflict (unlike 11FMD above) so re-running this
-- file never wipes out real layout data once it's been added for 12FMD.
insert into public.parking_config (id, layout)
values (
  '12FMD',
  $parking_config_12fmd${
  "levels": [
    {
      "id": "workshop",
      "desc": "12 workshop layout — not yet configured.",
      "icon": "WS",
      "lots": [],
      "label": "Workshop"
    },
    {
      "id": "level-1",
      "desc": "12 level 1 bay layout — not yet configured.",
      "icon": "L1",
      "lots": [],
      "label": "Level 1"
    },
    {
      "id": "level-2",
      "desc": "12 level 2 bay layout — not yet configured.",
      "icon": "L2",
      "lots": [],
      "label": "Level 2"
    },
    {
      "id": "level-3",
      "desc": "12 level 3 bay layout — not yet configured.",
      "icon": "L3",
      "lots": [],
      "label": "Level 3"
    }
  ]
}
$parking_config_12fmd$::jsonb
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

-- Nullable: existing messages (and any future message created without a
-- specific depot) stay NULL and are shown at every depot. New messages
-- created via the admin panel are tagged with whichever depot the admin
-- has selected at the time.
alter table public.safety_messages add column if not exists facility_code text null references public.facilities(code);

create index if not exists safety_messages_active_schedule_idx
on public.safety_messages (is_active, starts_at, ends_at, created_at desc);

alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.history enable row level security;
alter table public.turret_esc_logs enable row level security;
alter table public.parking_config enable row level security;
alter table public.safety_messages enable row level security;
alter table public.facilities enable row level security;
alter table public.vehicle_units enable row level security;

grant usage on schema public to service_role;
grant select, insert, update on table public.users to service_role;
grant select, insert, update, delete on table public.vehicles to service_role;
grant select, insert, update, delete on table public.history to service_role;
grant select, insert, update, delete on table public.turret_esc_logs to service_role;
grant select, insert, update, delete on table public.parking_config to service_role;
grant select, insert, update, delete on table public.safety_messages to service_role;
grant select, insert, update, delete on table public.vehicle_units to service_role;

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

revoke execute on function public.is_admin(text) from public, anon, authenticated;
grant execute on function public.is_admin(text) to service_role;

drop function if exists public.set_user_admin(text, text, boolean);

create or replace function public.set_user_admin(
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
  actor_id text := auth.uid()::text;
begin
  if actor_id is null then
    raise exception 'Authenticated user required';
  end if;

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

revoke execute on function public.set_user_admin(text, boolean) from public, anon, authenticated;
grant execute on function public.set_user_admin(text, boolean) to service_role;
