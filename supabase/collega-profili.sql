-- ============================================================
-- BALOUN — collega più profili per fare le prove
--
-- Fa due cose:
--   1. riempie la TUA stanza con dei Balloon (massimo 5, è il limite)
--   2. ti fa entrare nelle stanze di altri, così in "Others" trovi le schede
--
-- L'email è già impostata: benjillalia2@gmail.com
-- Se vuoi, cambia i tre numeri qui sotto. Poi incolla tutto nel
-- SQL Editor di Supabase e premi Run. Si può rieseguire quante volte vuoi.
-- ============================================================

do $$
declare
  -- ---------------- da regolare a piacere ----------------
  quanti_nella_mia_stanza constant int := 5;   -- max 5: è il limite della stanza
  quante_stanze_altrui    constant int := 6;   -- quante schede vedrai in "Others"
  quante_gia_aperte       constant int := 2;   -- di queste, quante saltano l'attesa
  -- -------------------------------------------------------

  me         uuid;
  mia_stanza uuid;
  posti      int;
  entrati    int := 0;
  unita      int := 0;
  aperte     int := 0;
  r          record;
begin
  select id into me from auth.users where email = 'benjillalia2@gmail.com';
  if me is null then
    raise exception 'Non trovo il tuo account. Controlla l''email.';
  end if;

  -- ---------- 1. riempio la mia stanza ----------
  select id into mia_stanza
    from public.rooms
   where main_id = me and status <> 'completed'
   order by created_at desc limit 1;

  if mia_stanza is null then
    raise notice 'La tua stanza non esiste ancora: completa il profilo. Salto questo passaggio.';
  else
    select rr.max_balloons - count(w.*)
      into posti
      from public.rooms rr
      left join public.room_waitlist w
        on w.room_id = rr.id and w.decision <> 'popped'
     where rr.id = mia_stanza
     group by rr.max_balloons;

    for r in
      select p.id as pid
        from public.profiles p
        join auth.users u on u.id = p.id
       where p.onboarded
         and p.id <> me
         and not exists (
           select 1 from public.room_waitlist w
            where w.room_id = mia_stanza and w.balloon_id = p.id
         )
       -- prima le persone vere, poi i profili di prova
       order by (u.email like 'seed%@baloun.test'), random()
       limit greatest(0, least(quanti_nella_mia_stanza, coalesce(posti, 0)))
    loop
      insert into public.room_waitlist (room_id, main_id, balloon_id)
      values (mia_stanza, me, r.pid)
      on conflict (room_id, balloon_id) do nothing;
      entrati := entrati + 1;
    end loop;
  end if;

  -- ---------- 2. entro nelle stanze degli altri ----------
  for r in
    select rm.id as rid, rm.main_id as mid
      from public.rooms rm
      join public.profiles p on p.id = rm.main_id
      join auth.users u      on u.id = p.id
     where rm.status = 'open'
       and rm.main_id <> me
       and p.onboarded
       and not exists (
         select 1 from public.room_waitlist w
          where w.room_id = rm.id and w.balloon_id = me
       )
       and (select count(*) from public.room_waitlist w2
             where w2.room_id = rm.id and w2.decision <> 'popped') < rm.max_balloons
     order by (u.email like 'seed%@baloun.test'), random()
     limit quante_stanze_altrui
  loop
    insert into public.room_waitlist (room_id, main_id, balloon_id)
    values (r.rid, r.mid, me)
    on conflict (room_id, balloon_id) do nothing;
    unita := unita + 1;

    -- le prime stanze si aprono subito, così puoi provare profilo
    -- completo ed emoji senza aspettare il minuto
    if aperte < quante_gia_aperte then
      update public.rooms set opens_at = now() - interval '5 seconds' where id = r.rid;
      aperte := aperte + 1;
    end if;
  end loop;

  raise notice 'Nella tua stanza: % — stanze a cui ti sei unitə: % (di cui già aperte: %)',
    entrati, unita, aperte;
end $$;

-- ============================================================
-- Riepilogo
-- ============================================================
with me as (
  select id from auth.users where email = 'benjillalia2@gmail.com'
)
select
  case when w.main_id = me.id then 'nella mia stanza' else 'io in casa d''altri' end as dove,
  p.display_name as persona,
  w.decision,
  case
    when r.opens_at is null then 'in attesa del primo ingresso'
    when r.opens_at <= now() then 'aperta'
    else 'si apre fra ' || to_char(r.opens_at - now(), 'MI:SS')
  end as stato
from public.room_waitlist w
cross join me                     -- va dichiarata PRIMA di essere usata
join public.rooms r    on r.id = w.room_id
join public.profiles p on p.id = case when w.main_id = me.id then w.balloon_id else w.main_id end
where w.main_id = me.id or w.balloon_id = me.id
order by dove, persona;
