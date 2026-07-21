-- Stores the latest reason shown to a user after an admin removes their
-- Trackr profile. The app reads this server-side through the service role;
-- users do not query this table directly from the browser.
create table if not exists public.user_removal_notices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text null,
  facility_code text null references public.facilities(code),
  unit text null,
  reason text null,
  removed_by_id text null,
  removed_by_name text null,
  action text not null default 'user.remove',
  created_at timestamp with time zone not null default now()
);

create index if not exists user_removal_notices_user_id_created_at_idx
on public.user_removal_notices (user_id, created_at desc);

alter table public.user_removal_notices enable row level security;

grant select, insert on table public.user_removal_notices to service_role;
grant delete on table public.users to service_role;
