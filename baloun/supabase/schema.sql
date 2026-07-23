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
-- 1b. Pulizia delle funzioni
-- PostgreSQL non permette di cambiare le colonne restituite da una
-- funzione già esistente: vanno eliminate e ricreate.
-- Qui sotto le eliminiamo tutte; il resto del file le ricrea.
-- (Non tocca tabelle né dati.)
-- ------------------------------------------------------------
drop function if exists public.get_feed(int);
drop function if exists public.get_my_room_waitlist();
drop function if exists public.get_my_keeps();
drop function if exists public.get_room_reveal(uuid);
drop function if exists public.submit_reveal_decision(uuid, boolean);
drop function if exists public.get_room_candidates();
drop function if exists public.choose_balloon(uuid);
drop function if exists public.get_my_matches();
drop function if exists public.mark_match_seen(uuid);
drop function if exists public.open_my_room_now();

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
-- 5b. AGGIORNAMENTI (per database già creati con la versione precedente)
-- Queste righe non fanno nulla se le colonne esistono già.
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_full_path text;

alter table public.rooms
  add column if not exists opens_at timestamptz;

-- Quanto dura l'attesa prima che la stanza si apra.
-- Per ora 60 secondi: alzalo quando andrai live.
alter table public.rooms
  add column if not exists open_delay_seconds int not null default 60;

do $$ begin
  create type public.reveal_decision as enum ('pending', 'kept', 'popped');
exception when duplicate_object then null; end $$;

alter table public.room_waitlist
  add column if not exists decision public.reveal_decision not null default 'pending';

alter table public.room_waitlist
  add column if not exists decided_at timestamptz;

-- Come si apre una stanza. Oggi 'timer'; in futuro basta cambiare questo
-- valore, senza toccare l'app:
--   timer    → si apre dopo open_delay_seconds dal primo KEEP
--              (per "dopo 24 ore" metti 86400)
--   capacity → si apre appena arriva al numero massimo di Balloon
--   manual   → si apre quando il Main preme il pulsante
do $$ begin
  create type public.room_open_mode as enum ('timer', 'capacity', 'manual');
exception when duplicate_object then null; end $$;

alter table public.rooms
  add column if not exists open_mode public.room_open_mode not null default 'timer';

-- Apertura per capienza raggiunta.
create or replace function public.open_room_when_full()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  total int;
begin
  select count(*) into total from public.room_waitlist where room_id = new.room_id;

  update public.rooms
     set opens_at = now()
   where id = new.room_id
     and open_mode = 'capacity'
     and opens_at is null
     and total >= max_balloons;
  return new;
end $$;

drop trigger if exists room_waitlist_open_when_full on public.room_waitlist;
create trigger room_waitlist_open_when_full
  after insert on public.room_waitlist
  for each row execute function public.open_room_when_full();

-- Apertura manuale, decisa dal Main.
create or replace function public.open_my_room_now()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.rooms
     set opens_at = now()
   where main_id = auth.uid()
     and status = 'open'
     and opens_at is null;

  if not found then
    raise exception 'Nessuna stanza da aprire';
  end if;
end $$;

grant execute on function public.open_my_room_now() to authenticated;

-- Il conto alla rovescia parte al PRIMO Balloon che entra.
create or replace function public.start_room_countdown()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.rooms
     set opens_at = now() + make_interval(secs => open_delay_seconds)
   where id = new.room_id
     and open_mode = 'timer'
     and opens_at is null;
  return new;
end $$;

drop trigger if exists room_waitlist_start_countdown on public.room_waitlist;
create trigger room_waitlist_start_countdown
  after insert on public.room_waitlist
  for each row execute function public.start_room_countdown();

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
    and (r.opens_at is null or r.opens_at > now())
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
    and w.decision <> 'popped'
  order by w.created_at desc;
$$;

-- 8c. get_my_keeps — le stanze in cui sono in attesa.
create or replace function public.get_my_keeps()
returns table (
  room_id    uuid,
  main_id    uuid,
  main_name  text,
  created_at timestamptz,
  opens_at   timestamptz,
  is_open    boolean,
  decision   public.reveal_decision,
  is_closed  boolean
)
language sql stable security definer set search_path = public as $$
  select
    w.room_id,
    w.main_id,
    p.display_name,
    w.created_at,
    r.opens_at,
    (r.opens_at is not null and r.opens_at <= now()),
    w.decision,
    (r.status = 'completed')
  from public.room_waitlist w
  join public.profiles p on p.id = w.main_id
  join public.rooms r    on r.id = w.room_id
  where w.balloon_id = auth.uid()
    and w.decision <> 'popped'
  order by r.opens_at nulls last, w.created_at desc;
$$;

-- 8d. get_room_reveal — il profilo COMPLETO del Main.
-- Restituisce dati solo se: sei nella waitlist di quella stanza
-- E la stanza si è già aperta. Altrimenti non torna nulla.
create or replace function public.get_room_reveal(p_room_id uuid)
returns table (
  main_id          uuid,
  name             text,
  age              int,
  city             text,
  bio              text,
  avatar_full_path text,
  interests        jsonb,
  decision         public.reveal_decision
)
language sql stable security definer set search_path = public as $$
  select
    p.id,
    p.display_name,
    extract(year from age(p.birth_date))::int,
    p.city,
    p.bio,
    coalesce(p.avatar_full_path, p.avatar_path),
    coalesce(
      (select jsonb_agg(jsonb_build_object('kind', pi.kind, 'value', pi.value) order by pi.kind)
         from public.profile_interests pi
        where pi.profile_id = p.id),
      '[]'::jsonb
    ),
    w.decision
  from public.room_waitlist w
  join public.rooms r    on r.id = w.room_id
  join public.profiles p on p.id = w.main_id
  where w.room_id = p_room_id
    and w.balloon_id = auth.uid()
    and r.opens_at is not null
    and r.opens_at <= now();
$$;

-- 8e. submit_reveal_decision — la seconda decisione, sul profilo completo.
-- true  = resto (kept)
-- false = poppo (popped): esco dalla stanza e non la rivedo più.
create or replace function public.submit_reveal_decision(p_room_id uuid, p_keep boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  is_open boolean;
begin
  select (r.opens_at is not null and r.opens_at <= now())
    into is_open
    from public.rooms r
   where r.id = p_room_id;

  if not coalesce(is_open, false) then
    raise exception 'La stanza non è ancora aperta';
  end if;

  update public.room_waitlist
     set decision   = case when p_keep then 'kept' else 'popped' end::public.reveal_decision,
         decided_at = now()
   where room_id = p_room_id
     and balloon_id = auth.uid()
     and decision = 'pending';

  if not found then
    raise exception 'Hai già deciso, o non sei in questa stanza';
  end if;
end $$;

grant execute on function public.get_feed(int)          to authenticated;
grant execute on function public.get_my_room_waitlist() to authenticated;
grant execute on function public.get_my_keeps()         to authenticated;
grant execute on function public.get_room_reveal(uuid)  to authenticated;
grant execute on function public.submit_reveal_decision(uuid, boolean) to authenticated;

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

-- ------------------------------------------------------------
-- 11. MATCH e CHAT
-- Il Main sceglie una persona fra chi è rimasto: nasce il match
-- e si apre la conversazione. Un match per stanza.
-- ------------------------------------------------------------
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null unique references public.rooms (id) on delete cascade,
  main_id      uuid not null references public.profiles (id) on delete cascade,
  balloon_id   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  -- serve a mostrare l'animazione una volta sola a chi viene scelto
  balloon_seen boolean not null default false,

  constraint matches_not_self check (main_id <> balloon_id)
);

create index if not exists matches_main_idx    on public.matches (main_id, created_at desc);
create index if not exists matches_balloon_idx on public.matches (balloon_id, created_at desc);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches (id) on delete cascade,
  sender_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),

  constraint messages_body_len check (char_length(body) between 1 and 2000)
);

create index if not exists messages_match_idx on public.messages (match_id, created_at);

alter table public.matches  enable row level security;
alter table public.messages enable row level security;

-- Vedi solo i match a cui partecipi.
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches
  for select to authenticated
  using (main_id = auth.uid() or balloon_id = auth.uid());

-- Nessun insert e nessun update diretto: i match nascono solo da
-- choose_balloon() e si marcano come visti solo con mark_match_seen().
drop policy if exists matches_update_seen on public.matches;

-- Leggi i messaggi solo dei tuoi match.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.matches m
     where m.id = messages.match_id
       and (m.main_id = auth.uid() or m.balloon_id = auth.uid())
  ));

-- Scrivi solo come te stessə, e solo nei tuoi match.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
       where m.id = messages.match_id
         and (m.main_id = auth.uid() or m.balloon_id = auth.uid())
    )
  );

-- 11a. get_room_candidates — chi è rimasto dopo il secondo giro.
-- Solo il Main della stanza può vederli.
create or replace function public.get_room_candidates()
returns table (
  room_id          uuid,
  balloon_id       uuid,
  name             text,
  age              int,
  city             text,
  bio              text,
  avatar_full_path text,
  interests        jsonb
)
language sql stable security definer set search_path = public as $$
  select
    r.id,
    p.id,
    p.display_name,
    extract(year from age(p.birth_date))::int,
    p.city,
    p.bio,
    coalesce(p.avatar_full_path, p.avatar_path),
    coalesce(
      (select jsonb_agg(jsonb_build_object('kind', pi.kind, 'value', pi.value) order by pi.kind)
         from public.profile_interests pi
        where pi.profile_id = p.id),
      '[]'::jsonb
    )
  from public.rooms r
  join public.room_waitlist w on w.room_id = r.id
  join public.profiles p      on p.id = w.balloon_id
  where r.main_id = auth.uid()
    and r.opens_at is not null
    and r.opens_at <= now()
    and w.decision = 'kept'
    and not exists (select 1 from public.matches m where m.room_id = r.id)
  order by w.decided_at nulls last;
$$;

-- 11b. choose_balloon — il Main sceglie: nasce il match.
create or replace function public.choose_balloon(p_balloon_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_room_id  uuid;
  v_match_id uuid;
begin
  select r.id into v_room_id
    from public.rooms r
   where r.main_id = auth.uid()
     and r.opens_at is not null
     and r.opens_at <= now()
     and r.status <> 'completed'
   limit 1;

  if v_room_id is null then
    raise exception 'Nessuna stanza aperta';
  end if;

  if not exists (
    select 1 from public.room_waitlist w
     where w.room_id = v_room_id
       and w.balloon_id = p_balloon_id
       and w.decision = 'kept'
  ) then
    raise exception 'Questa persona non è più in gioco';
  end if;

  insert into public.matches (room_id, main_id, balloon_id)
  values (v_room_id, auth.uid(), p_balloon_id)
  returning id into v_match_id;

  update public.rooms
     set status = 'completed', closed_at = now()
   where id = v_room_id;

  return v_match_id;
end $$;

-- 11c. get_my_matches — l'elenco delle conversazioni.
create or replace function public.get_my_matches()
returns table (
  match_id         uuid,
  other_id         uuid,
  other_name       text,
  other_city       text,
  avatar_full_path text,
  created_at       timestamptz,
  is_new           boolean,
  last_message     text,
  last_message_at  timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    m.id,
    other.id,
    other.display_name,
    other.city,
    coalesce(other.avatar_full_path, other.avatar_path),
    m.created_at,
    (m.balloon_id = auth.uid() and not m.balloon_seen),
    last_msg.body,
    last_msg.created_at
  from public.matches m
  join public.profiles other
    on other.id = case when m.main_id = auth.uid() then m.balloon_id else m.main_id end
  left join lateral (
    select body, created_at
      from public.messages msg
     where msg.match_id = m.id
     order by msg.created_at desc
     limit 1
  ) last_msg on true
  where m.main_id = auth.uid() or m.balloon_id = auth.uid()
  order by coalesce(last_msg.created_at, m.created_at) desc;
$$;

-- 11d. mark_match_seen — l'animazione del match si vede una volta sola.
create or replace function public.mark_match_seen(p_match_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.matches
     set balloon_seen = true
   where id = p_match_id
     and balloon_id = auth.uid();
$$;

grant execute on function public.get_room_candidates()     to authenticated;
grant execute on function public.choose_balloon(uuid)      to authenticated;
grant execute on function public.get_my_matches()          to authenticated;
grant execute on function public.mark_match_seen(uuid)     to authenticated;

-- I messaggi arrivano in tempo reale.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 12. Foto ad alta risoluzione — bucket PRIVATO
-- Visibile solo a chi è nella waitlist di una stanza GIÀ APERTA.
-- Prima dell'apertura il file non è raggiungibile: non basta
-- copiare l'indirizzo dell'immagine per anticipare la rivelazione.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars-full', 'avatars-full', false)
on conflict (id) do nothing;

drop policy if exists avatars_full_read on storage.objects;
create policy avatars_full_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars-full'
    and (
      -- la tua foto la vedi sempre
      (storage.foldername(name))[1] = auth.uid()::text
      -- oppure: sei un Balloon e la stanza di quel Main si è aperta
      or exists (
        select 1
          from public.room_waitlist w
          join public.rooms r on r.id = w.room_id
         where w.balloon_id = auth.uid()
           and r.main_id::text = (storage.foldername(name))[1]
           and r.opens_at is not null
           and r.opens_at <= now()
      )
      -- oppure: sei il Main e questa persona è nella tua stanza aperta
      or exists (
        select 1
          from public.room_waitlist w
          join public.rooms r on r.id = w.room_id
         where r.main_id = auth.uid()
           and w.balloon_id::text = (storage.foldername(name))[1]
           and r.opens_at is not null
           and r.opens_at <= now()
      )
      -- oppure: avete un match, quindi vi vedete comunque
      or exists (
        select 1 from public.matches m
         where (m.main_id = auth.uid() and m.balloon_id::text = (storage.foldername(name))[1])
            or (m.balloon_id = auth.uid() and m.main_id::text = (storage.foldername(name))[1])
      )
    )
  );

drop policy if exists avatars_full_write_own on storage.objects;
create policy avatars_full_write_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars-full' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_full_update_own on storage.objects;
create policy avatars_full_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars-full' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_full_delete_own on storage.objects;
create policy avatars_full_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars-full' and (storage.foldername(name))[1] = auth.uid()::text);
