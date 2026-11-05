-- School Receipt System: run this file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('director','finance','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null,
  full_name text not null,
  classroom text not null default '',
  grade_level text not null default '',
  academic_year text not null,
  registered boolean not null default false,
  created_at timestamptz not null default now(),
  unique(student_code, academic_year)
);

create table if not exists public.receipt_settings (
  id uuid primary key default gen_random_uuid(),
  prefix text not null default 'RC',
  separator text not null default '-',
  next_number integer not null default 1 check (next_number > 0),
  updated_at timestamptz not null default now()
);
insert into public.receipt_settings(prefix,separator,next_number)
select 'RC','-',1 where not exists(select 1 from public.receipt_settings);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id uuid references public.students(id) on delete set null,
  payer_name text not null,
  description text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  receipt_date date not null default current_date,
  receipt_type text not null default 'normal' check(receipt_type in ('normal','independent')),
  locked boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint independent_is_locked check (receipt_type <> 'independent' or (locked = true and amount = 0))
);

create index if not exists receipts_date_idx on public.receipts(receipt_date);
create index if not exists students_class_idx on public.students(academic_year,grade_level,classroom);

create or replace function public.current_role()
returns text language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() and active=true $$;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_settings enable row level security;

drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles for select to authenticated
using (id=auth.uid() or public.current_role()='admin');
drop policy if exists "admin manage profiles" on public.profiles;
create policy "admin manage profiles" on public.profiles for all to authenticated
using (public.current_role()='admin') with check (public.current_role()='admin');

drop policy if exists "authenticated read students" on public.students;
create policy "authenticated read students" on public.students for select to authenticated using (true);
drop policy if exists "finance admin manage students" on public.students;
create policy "finance admin manage students" on public.students for all to authenticated
using (public.current_role() in ('finance','admin')) with check (public.current_role() in ('finance','admin'));

drop policy if exists "authenticated read receipts" on public.receipts;
create policy "authenticated read receipts" on public.receipts for select to authenticated using (true);
drop policy if exists "finance admin insert receipts" on public.receipts;
create policy "finance admin insert receipts" on public.receipts for insert to authenticated
with check (public.current_role() in ('finance','admin') and (receipt_type <> 'independent' or (locked=true and amount=0)));
drop policy if exists "finance admin update normal receipts" on public.receipts;
create policy "finance admin update normal receipts" on public.receipts for update to authenticated
using (public.current_role() in ('finance','admin') and locked=false and receipt_type='normal')
with check (public.current_role() in ('finance','admin') and locked=false and receipt_type='normal');
drop policy if exists "finance admin delete normal receipts" on public.receipts;
create policy "finance admin delete normal receipts" on public.receipts for delete to authenticated
using (public.current_role() in ('finance','admin') and locked=false and receipt_type='normal');

drop policy if exists "authenticated read receipt settings" on public.receipt_settings;
create policy "authenticated read receipt settings" on public.receipt_settings for select to authenticated using (true);
drop policy if exists "admin finance manage receipt settings" on public.receipt_settings;
create policy "admin finance manage receipt settings" on public.receipt_settings for all to authenticated
using (public.current_role() in ('finance','admin')) with check (public.current_role() in ('finance','admin'));

-- Create the first admin manually:
-- 1) Supabase Dashboard > Authentication > Users > Add user
-- 2) Copy that user's UUID, then run:
-- insert into public.profiles(id,full_name,role) values ('USER-UUID','ผู้ดูแลระบบ','admin');
