# Parking Project Memory

Read `AGENTS.md` first. This app runs on the installed Next.js version, so check `node_modules/next/dist/docs/` before changing Next.js page, route, or mutation patterns.

## Product Shape

- The app is a Singpass-protected parking and vehicle tracking dashboard for Block 210.
- A user who is not a technician is treated as a combatant.
- Admins should have an in-app Admin page to view users, promote/demote admins, and add scheduled safety messages.
- Driver fields should identify the actual person using or moving the vehicle. Default to the logged-in user, but allow entering another person from the same section/unit.

## Data Model Direction

- `users`
  - `id` is the sgID/openid.
  - Required profile fields: `name`, `rank`, `ord_date`, `phone`, `unit`.
  - Role flags: `is_admin`, `is_technician`. Non-technicians display as `Combatant`.
  - Unit and depot are the same concept. Use `unit` only; `depot` is only a legacy fallback for old database rows.
- `vehicles`
  - Active parking records only.
  - Location is `level` + `lot`; levels come from `parking_config.layout.levels`.
  - Driver tracking uses `driver`, `driver_phone`, `driver_unit`.
  - Driver depot is the same concept as driver unit. Use `driver_unit` only; `driver_depot` is only a legacy fallback for old database rows.
- `history`
  - Append-only movement/update/drive-out log.
  - Store `vehicle_id`, plate, location, metrics, driver identity, and checkout timestamps.
- `parking_config`
  - Single row `id = 'default'`.
  - Basic JSON shape: `{ "levels": [{ "id", "label", "desc", "icon", "lots": [] }] }`.
  - Preferred dynamic layout shape: `{ "levels": [{ "layout": { "columns": [{ "type": "lots", "id": "a", "lots": ["A15"] }, { "type": "driveway", "id": "driveway-west", "label": "DRIVEWAY" }] } }] }`.
  - For non-parking areas inside a column, use a mixed column: `{ "type": "mixed", "id": "f-and-areas", "cells": [{ "type": "lot", "id": "F6" }, { "type": "area", "id": "peta-store", "label": "PETA\\nSTORE", "rowSpan": 5 }] }`.
  - Area cells are display-only and must not be clickable parking lots.
  - Keep `lots` as a flattened compatibility list when adding a `layout.columns` map.
- `safety_messages`
  - Scheduled message table with `message`, `starts_at`, `ends_at`, `is_active`, `created_by`.
  - Dashboard cycles active messages; hardcoded messages are only fallback content.

## Current Implementation Notes

- Main dashboard is mostly in `app/page.tsx` as a client component.
- API routes live under `app/api/**/route.ts` and use `getRequestSession`.
- Supabase server helpers are in `lib/supabase/server.ts`.
- Apply database changes from `supabase/parking_schema.sql` when adding tables/columns.
