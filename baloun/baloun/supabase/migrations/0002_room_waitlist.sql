-- BALOUN — V1
-- Unico record scritto dal feed: il KEEP inserisce il Balloon nella
-- waitlist della stanza del Main. Il POP non scrive nulla.
--
-- Da eseguire nello Step 3 (SQL Editor di Supabase).

create table if not exists public.room_waitlist (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  -- il Main proprietario della stanza (denormalizzato: query più semplici)
  main_id uuid not null references public.profiles (id) on delete cascade,
  -- chi ha premuto KEEP
  balloon_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  -- un utente entra UNA volta sola nella stessa stanza
  constraint room_waitlist_unique unique (room_id, balloon_id),
  -- non puoi entrare nella tua stessa stanza
  constraint room_waitlist_not_self check (balloon_id <> main_id)
);

-- Il Main legge la sua lista; il Balloon rilegge le proprie attese.
create index if not exists room_waitlist_room_idx on public.room_waitlist (room_id, created_at desc);
create index if not exists room_waitlist_balloon_idx on public.room_waitlist (balloon_id, created_at desc);

alter table public.room_waitlist enable row level security;

-- Vedi le TUE attese, oppure la waitlist della TUA stanza.
create policy "waitlist_select_own_or_main"
  on public.room_waitlist for select
  using (balloon_id = auth.uid() or main_id = auth.uid());

-- Puoi inserire solo te stessə.
create policy "waitlist_insert_self"
  on public.room_waitlist for insert
  with check (balloon_id = auth.uid());

-- Puoi ritirarti dalla waitlist.
create policy "waitlist_delete_self"
  on public.room_waitlist for delete
  using (balloon_id = auth.uid());
