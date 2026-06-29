create table public.users (
  id text not null,
  rank text null,
  name text not null,
  is_admin boolean not null default false,
  is_technician boolean not null default false,
  ord_date timestamp with time zone null,
  phone text null,
  unit text null,
  created_at timestamp with time zone not null default now(),
  constraint users_pkey1 primary key (id)
) tablespace pg_default;

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

alter table public.users enable row level security;

grant usage on schema public to service_role;
grant select, insert, update on table public.users to service_role;
