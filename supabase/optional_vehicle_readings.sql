-- Allow vehicle readings to be left blank on active vehicle records.
-- Run this in the Supabase SQL editor for an existing production database.

alter table public.vehicles
  alter column odometer drop not null,
  alter column engine_hours drop not null,
  alter column starter_v drop not null,
  alter column starter_pct drop not null,
  alter column aux_v drop not null,
  alter column aux_pct drop not null,
  alter column fuel_l drop not null,
  alter column fuel_pct drop not null;

alter table public.vehicles
  drop constraint if exists vehicles_non_negative_values;

alter table public.vehicles
  add constraint vehicles_non_negative_values
  check (
    (odometer is null or odometer >= 0) and
    (engine_hours is null or engine_hours >= 0) and
    (starter_v is null or starter_v >= 0) and
    (starter_pct is null or (starter_pct >= 0 and starter_pct <= 100)) and
    (aux_v is null or aux_v >= 0) and
    (aux_pct is null or (aux_pct >= 0 and aux_pct <= 100)) and
    (fuel_l is null or fuel_l >= 0) and
    (fuel_pct is null or (fuel_pct >= 0 and fuel_pct <= 100))
  ) not valid;
