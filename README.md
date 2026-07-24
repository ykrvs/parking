# Trackr

Trackr is a Next.js vehicle parking and readiness dashboard for depot operations. It supports vehicle check-in, drive-out, parking layout views, Vehicle data readings, reminders, admin verification, safety messages, audit history, and CSV/PDF exports.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Postgres via the service-role key on server routes
- sgID authentication
- Tailwind CSS and shadcn/Radix UI components

## Environment Variables

Copy `.env.example` to `.env.local` and fill these values:

```env
SGID_CLIENT_ID=""
SGID_CLIENT_SECRET=""
SGID_PRIVATE_KEY=""
AUTH_SESSION_SECRET=""

NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""

SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_USERS_TABLE="users"

API_SECRET=""
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must be a secret/service-role key. Never expose it with a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is safe for browser-side Supabase client usage.
- `SUPABASE_USERS_TABLE` defaults to `users`.
- `AUTH_SESSION_SECRET` should be a long random string.

## Supabase Setup

Run the SQL files in the Supabase SQL editor for the target project.

Recommended order:

1. `supabase/parking_schema.sql`
2. `supabase/users.sql`, only if your environment needs the standalone user-table migration
3. `supabase/vehicle_optional_readings.sql`, if not already applied
4. `supabase/vehicle_vor_servicing.sql`

The VOR and servicing migration adds:

- `vehicles.is_vor`
- `vehicles.next_servicing`
- `vehicles.last_serviced`
- matching history columns
- an index for facility-scoped servicing reminders

For new public tables, confirm Supabase Data API exposure, grants, and RLS policies. Existing tables that only receive new columns usually do not need extra Data API exposure steps, but RLS and grants should still match the access model.

## Local Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```powershell
npm run lint
npm run test
npx tsc --noEmit
```

`npm run build` should also be run before deployment. In restricted environments it may fail if Next.js cannot fetch hosted fonts during build.

## Deployment

The app is suitable for Vercel deployment.

Set the same environment variables in Vercel project settings, then deploy from the GitHub branch or pull request. After SQL changes, apply the Supabase scripts before testing production flows that depend on new columns.

## Feature Notes

- Vehicle check-in records plate, vehicle unit, variant, parking level/lot, optional readiness readings, fire extinguisher expiry, VOR status, and servicing dates.
- Drive-out is available to verified users in the same depot as the vehicle. Admin/facility checks still apply server-side.
- Odometer, engine hours, battery readings, fuel readings, fire extinguisher expiry, and next servicing are optional. Missing card values render as `-`.
- Vehicle units are loaded from the `vehicle_units` Supabase table per facility and are searchable/filterable in the UI.
- BOS and parking data can be exported as CSV or PDF.
- Fire extinguisher, ORD, and servicing reminders are shown in a compact reminder tray.
- Admin pages support user verification, admin role updates, safety messages, audit log viewing, and exports.

## Turret ESC Dormant Flag

Turret ESC remains intentionally dormant. Keep the feature code and related SQL in place, but leave the user-facing entry points commented out until the feature is ready to be enabled. This prevents dormant Turret ESC code from interfering with current vehicle, parking, BOS, and reminder workflows.
