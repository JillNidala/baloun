-- ============================================================
-- BALOUN — Schema V1
-- Da incollare INTERAMENTE nel SQL Editor di Supabase ed eseguire.
-- È sicuro rieseguirlo: usa "if not exists" / "drop ... if exists".
--
-- Contiene SOLO ciò che serve al loop attuale:
--   profilo → stanza → feed → KEEP (waitlist) / POP (niente)
-- Niente chat, match, round, eliminazioni, notifiche.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Tipi
-- ------------------------------------------------------------
do $$ begin
  create type public.interest_kind as enum ('music', 'food', 'movie', 'travel', 'book');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.room_status as enum ('open', 'full', 'selecting', 'completed', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 2. profiles — estende auth.users
-- I campi sono NULL finché l'utente non completa l'onboarding.
-- Il vincolo garantisce che un profilo "onboarded" sia completo.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio           text,
  birth_date   date,
  city          text,
  avatar_path   text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint profiles_name_len check (display_name is null or char_length(display_name) between 2 and 30),
  constraint profiles_bio_len      check (bio is null or char_length(bio) <= 300),
  constraint profiles_complete_when_onboarded check (
    not onboarded
    or (display_name is not null and birth_date is not null and city is not null)
  )
);

-- Maggiore età: in un trigger, perché un CHECK non può usare la data odierna.
create or replace function public.enforce_adult()
returns trigger language plpgsql as $$
begin
  if new.birth_date is not null
     and new.birth_date > current_date - interval '18 years' then
    raise exception 'Devi avere almeno 18 anni';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_before_write on public.profiles;
create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.enforce_adult();

-- ------------------------------------------------------------
-- 3. profile_interests — canzone, cibo, e in futuro altro
-- Una riga per tipo: aggiungere un interesse = aggiungere un valore
-- all'enum interest_kind. Nessuna modifica di struttura.
-- ------------------------------------------------------------
create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind       public.interest_kind not null,
  value      text not null,
  created_at timestamptz not null default now(),

  primary key (profile_id, kind),
  constraint profile_interests_value_len check (char_length(value) between 1 and 120)
);

-- ------------------------------------------------------------
-- 4. rooms — ogni Main possiede una stanza
-- ------------------------------------------------------------
create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  main_id      uuid not null references public.profiles (id) on delete cascade,
  status       public.room_status not null default 'open',
  max_balloons int not null default 20,
  expires_at   timestamptz not null default now() + interval '24 hours',
  created_at   timestamptz not null default now(),
  closed_at    timestamptz
);

-- Una sola stanza attiva per Main (indice unico parziale).
create unique index if not exists rooms_one_active_per_main
  on public.rooms (main_id)
  where status in ('open', 'full', 'selecting');

create index if not exists rooms_feed_idx on public.rooms (status, expires_at desc);

-- ------------------------------------------------------------
-- 5. room_waitlist — l'UNICO record scritto dal feed (KEEP)
-- Il POP non scrive nulla, come da specifica.
-- ------------------------------------------------------------
create table if not exists public.room_waitlist (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  main_id    uuid not null references public.profiles (id) on delete cascade,
  balloon_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint room_waitlist_unique   unique (room_id, balloon_id),
  constraint room_waitlist_not_self check (balloon_id <> main_id)
);

create index if not exists room_waitlist_room_idx    on public.room_waitlist (room_id, created_at desc);
create index if not exists room_waitlist_balloon_idx on public.room_waitlist (balloon_id, created_at desc);

-- Massimo 20 Balloon per stanza: imposto dal database, non dall'app.
create or replace function public.enforce_room_capacity()
returns trigger language plpgsql as $$
declare
  current_count int;
  cap           int;
begin
  select count(*) into current_count from public.room_waitlist where room_id = new.room_id;
  select max_balloons into cap from public.rooms where id = new.room_id;

  if current_count >= cap then
    raise exception 'La stanza è al completo';
  end if;
  return new;
end $$;

drop trigger if exists room_waitlist_capacity on public.room_waitlist;
create trigger room_waitlist_capacity
  before insert on public.room_waitlist
  for each row execute function public.enforce_room_capacity();

-- ------------------------------------------------------------
-- 6. Automatismi
-- ------------------------------------------------------------

-- 6a. Alla registrazione crea la riga profilo (vuota, onboarded = false).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6b. Quando il profilo viene completato, apri la sua stanza.
create or replace function public.open_room_on_onboarding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.onboarded and not coalesce(old.onboarded, false) then
    if not exists (
      select 1 from public.rooms
       where main_id = new.id and status in ('open', 'full', 'selecting')
    ) then
      insert into public.rooms (main_id) values (new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_open_room on public.profiles;
create trigger profiles_open_room
  after update on public.profiles
  for each row execute function public.open_room_on_onboarding();

-- ------------------------------------------------------------
-- 7. RLS
-- ------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.profile_interests enable row level security;
alter table public.rooms             enable row level security;
alter table public.room_waitlist     enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- profile_interests
drop policy if exists interests_select on public.profile_interests;
create policy interests_select on public.profile_interests
  for select to authenticated using (true);

drop policy if exists interests_write_own on public.profile_interests;
create policy interests_write_own on public.profile_interests
  for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- rooms
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to authenticated using (true);

drop policy if exists rooms_update_own on public.rooms;
create policy rooms_update_own on public.rooms
  for update to authenticated using (main_id = auth.uid()) with check (main_id = auth.uid());

-- room_waitlist: vedi le TUE attese o la waitlist della TUA stanza
drop policy if exists waitlist_select on public.room_waitlist;
create policy waitlist_select on public.room_waitlist
  for select to authenticated using (balloon_id = auth.uid() or main_id = auth.uid());

drop policy if exists waitlist_insert_self on public.room_waitlist;
create policy waitlist_insert_self on public.room_waitlist
  for insert to authenticated with check (balloon_id = auth.uid());

drop policy if exists waitlist_delete_self on public.room_waitlist;
create policy waitlist_delete_self on public.room_waitlist
  for delete to authenticated using (balloon_id = auth.uid());

-- ------------------------------------------------------------
-- 8. Feed — la query che alimenta la Home
-- Esclude: te stessə, chi hai già messo in waitlist, stanze scadute o piene.
-- ------------------------------------------------------------
create or replace function public.get_feed(p_limit int default 10)
returns table (
  main_id     uuid,
  room_id     uuid,
  name        text,
  age         int,
  city        text,
  avatar_path text,
  interests   jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    r.id,
    p.display_name,
    extract(year from age(p.birth_date))::int,
    p.city,
    p.avatar_path,
    coalesce(
      (select jsonb_agg(jsonb_build_object('kind', pi.kind, 'value', pi.value) order by pi.kind)
         from public.profile_interests pi
        where pi.profile_id = p.id),
      '[]'::jsonb
    )
  from public.rooms r
  join public.profiles p on p.id = r.main_id
  where r.status = 'open'
    and r.expires_at > now()
    and p.onboarded
    and p.id <> auth.uid()
    and not exists (
      select 1 from public.room_waitlist w
       where w.room_id = r.id and w.balloon_id = auth.uid()
    )
    and (select count(*) from public.room_waitlist w2 where w2.room_id = r.id) < r.max_balloons
  order by r.created_at desc
  limit least(p_limit, 50);
$$;

-- 8b. get_my_room_waitlist — chi ha premuto KEEP sulla mia stanza.
create or replace function public.get_my_room_waitlist()
returns table (
  id           uuid,
  balloon_id   uuid,
  balloon_name text,
  balloon_city text,
  created_at   timestamptz
)
language sql stable security definer set search_path = public as $$
  select w.id, w.balloon_id, p.display_name, p.city, w.created_at
  from public.room_waitlist w
  join public.profiles p on p.id = w.balloon_id
  where w.main_id = auth.uid()
  order by w.created_at desc;
$$;

-- 8c. get_my_keeps — le stanze in cui sono in attesa.
create or replace function public.get_my_keeps()
returns table (
  room_id    uuid,
  main_id    uuid,
  main_name  text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select w.room_id, w.main_id, p.display_name, w.created_at
  from public.room_waitlist w
  join public.profiles p on p.id = w.main_id
  where w.balloon_id = auth.uid()
  order by w.created_at desc;
$$;

grant execute on function public.get_feed(int)          to authenticated;
grant execute on function public.get_my_room_waitlist() to authenticated;
grant execute on function public.get_my_keeps()         to authenticated;

-- ------------------------------------------------------------
-- 9. Storage — bucket per le foto profilo
-- Pubblico: nel feed l'immagine è comunque sfocata lato client.
-- Ogni utente può scrivere solo nella cartella con il proprio id.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
