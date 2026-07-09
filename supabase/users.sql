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

alter table public.users
add column if not exists is_verified boolean not null default false;

alter table public.users
add column if not exists facility_code text;

create table if not exists public.facilities (
  code text primary key,
  name text not null
);

insert into public.facilities (code, name)
values ('11FMD', '11FMD')
on conflict (code) do nothing;

update public.users
set facility_code = '11FMD'
where facility_code is null;

alter table public.users
alter column facility_code set not null;

alter table public.users
drop constraint if exists users_facility_code_fkey;

alter table public.users
add constraint users_facility_code_fkey
foreign key (facility_code)
references public.facilities(code);
