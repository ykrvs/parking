-- Dismissible Trackr announcement banners. The browser reads/writes these
-- through server API routes; this table is not exposed directly to anon or
-- authenticated clients.
create table if not exists public.app_announcements (
  id uuid primary key default gen_random_uuid(),
  title text null,
  message text not null,
  link_url text null,
  button_label text null,
  target_role text not null default 'all'
    check (target_role in ('all', 'admins', 'drivers', 'technicians')),
  starts_at timestamp with time zone null,
  ends_at timestamp with time zone null,
  is_active boolean not null default true,
  facility_code text null references public.facilities(code),
  created_by text null references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists app_announcements_active_window_idx
on public.app_announcements (facility_code, is_active, starts_at, ends_at);

create index if not exists app_announcements_created_at_idx
on public.app_announcements (created_at desc);

alter table public.app_announcements enable row level security;

grant select, insert, update, delete on table public.app_announcements to service_role;
