-- ============================================================
-- BALOUN — prepara tutto per le prove
--
-- 1. riempie di interessi e spunti i profili che ne sono sprovvisti
-- 2. rimette loveperipera@gmail.com nella tua stanza
-- 3. completa la tua stanza fino a 5 palloncini
-- 4. ti fa entrare in 6 stanze altrui (2 già aperte)
-- 5. ti manda qualche emoji, così vedi come si vedono
--
-- L'email è già impostata: benjillalia2@gmail.com
-- Incolla tutto nel SQL Editor di Supabase e premi Run.
-- Si può rieseguire quante volte vuoi.
-- ============================================================

-- ------------------------------------------------------------
-- 1a. Interessi per chi non ne ha: 5 a testa, 2 visibili nel feed
-- ------------------------------------------------------------
insert into public.profile_tags (profile_id, tag_slug, in_feed)
select p.id, t.slug, t.rn <= 2
from public.profiles p
cross join lateral (
  select slug, row_number() over () as rn
  from (
    select slug from public.interest_tags
     order by md5(p.id::text || slug)
     limit 5
  ) x
) t
where p.onboarded
  and not exists (select 1 from public.profile_tags pt where pt.profile_id = p.id)
on conflict do nothing;

-- ------------------------------------------------------------
-- 1b. Spunti per chi non ne ha: 5 risposte, 2 visibili nel feed
-- ------------------------------------------------------------
insert into public.profile_prompts (profile_id, prompt_id, answer, in_room, in_feed)
select
  p.id,
  v.prompt_id,
  v.answer,
  true,
  v.prompt_id in ('mai', 'voglio')
from public.profiles p
cross join lateral (
  values
    ('mai', (array[
      'preso un aereo senza sapere dove andavo',
      'visto la neve al mare',
      'dormito in tenda sotto le stelle',
      'resistito a un mercatino dell''usato'
    ])[1 + (abs(hashtext(p.id::text)) % 4)]),
    ('voglio', (array[
      'aprire un piccolo bar con i libri',
      'vedere l''aurora boreale',
      'vivere un anno all''estero',
      'smettere di rimandare'
    ])[1 + (abs(hashtext(p.id::text || 'v')) % 4)]),
    ('domenica', (array[
      'mercato la mattina e divano il pomeriggio',
      'una camminata lunga e niente sveglia',
      'colazione lenta e un museo',
      'bici lungo il fiume'
    ])[1 + (abs(hashtext(p.id::text || 'd')) % 4)]),
    ('colonna', (array[
      'After Hours — The Weeknd',
      'Blonde — Frank Ocean',
      'Currents — Tame Impala',
      'Rumours — Fleetwood Mac'
    ])[1 + (abs(hashtext(p.id::text || 'c')) % 4)]),
    ('piatto', (array[
      'Carbonara come si deve',
      'Ramen fatto in casa',
      'Pizza napoletana',
      'Tortellini in brodo'
    ])[1 + (abs(hashtext(p.id::text || 'p')) % 4)])
) as v(prompt_id, answer)
where p.onboarded
  and not exists (select 1 from public.profile_prompts pp where pp.profile_id = p.id)
on conflict do nothing;

-- ------------------------------------------------------------
-- 2-5. Collegamenti, stanze ed emoji
-- ------------------------------------------------------------
do $$
declare
  quante_stanze_altrui constant int := 6;
  quante_gia_aperte    constant int := 2;
  emoji_da_ricevere    constant int := 8;

  me         uuid;
  altro      uuid;
  mia_stanza uuid;
  posti      int;
  unita      int := 0;
  aperte     int := 0;
  reazioni   int := 0;
  r          record;
  emo        text[] := array['🥰','❤️','😍','😂','🤩','🫣','😜','🥹','🤭','😇'];
begin
  select id into me from auth.users where email = 'benjillalia2@gmail.com';
  if me is null then
    raise exception 'Non trovo il tuo account.';
  end if;

  select id into mia_stanza from public.rooms
   where main_id = me and status <> 'completed'
   order by created_at desc limit 1;

  if mia_stanza is null then
    raise notice 'La tua stanza non esiste: completa il profilo nell''app.';
  else
    -- loveperipera per prima, se esiste
    select id into altro from auth.users where email = 'loveperipera@gmail.com';
    if altro is not null then
      -- Se la stanza è piena e lei non c'è ancora, libero un posto
      -- togliendo un profilo di prova (mai una persona vera).
      if not exists (
        select 1 from public.room_waitlist
         where room_id = mia_stanza and balloon_id = altro
      ) then
        select rr.max_balloons - count(w.*) into posti
          from public.rooms rr
          left join public.room_waitlist w
            on w.room_id = rr.id and w.decision <> 'popped'
         where rr.id = mia_stanza
         group by rr.max_balloons;

        if coalesce(posti, 0) <= 0 then
          delete from public.room_waitlist
           where id in (
             select w.id from public.room_waitlist w
             join auth.users u on u.id = w.balloon_id
             where w.room_id = mia_stanza
               and u.email like 'seed%@baloun.test'
             limit 1
           );
          raise notice 'Stanza piena: ho tolto un profilo di prova per fare posto.';
        end if;
      end if;

      insert into public.room_waitlist (room_id, main_id, balloon_id)
      values (mia_stanza, me, altro)
      on conflict (room_id, balloon_id) do update
        set decision = 'pending', decided_at = null;
    end if;

    -- completo i posti liberi
    select rr.max_balloons - count(w.*) into posti
      from public.rooms rr
      left join public.room_waitlist w
        on w.room_id = rr.id and w.decision <> 'popped'
     where rr.id = mia_stanza
     group by rr.max_balloons;

    for r in
      select p.id as pid from public.profiles p
        join auth.users u on u.id = p.id
       where p.onboarded and p.id <> me
         and not exists (select 1 from public.room_waitlist w
                          where w.room_id = mia_stanza and w.balloon_id = p.id)
       order by (u.email like 'seed%@baloun.test'), random()
       limit greatest(0, coalesce(posti, 0))
    loop
      insert into public.room_waitlist (room_id, main_id, balloon_id)
      values (mia_stanza, me, r.pid)
      on conflict (room_id, balloon_id) do nothing;
    end loop;

    -- qualche emoji in arrivo, da mittenti diversi
    for r in
      select w.balloon_id as bid, row_number() over () as n
        from public.room_waitlist w
       where w.room_id = mia_stanza and w.decision <> 'popped'
    loop
      for i in 1..2 loop
        exit when reazioni >= emoji_da_ricevere;
        insert into public.room_reactions (room_id, sender_id, emoji, created_at)
        values (mia_stanza, r.bid,
                emo[1 + ((r.n::int * 3 + i) % array_length(emo, 1))],
                now() - make_interval(mins => (reazioni * 4)));
        reazioni := reazioni + 1;
      end loop;
    end loop;
  end if;

  -- entro nelle stanze degli altri
  for r in
    select rm.id as rid, rm.main_id as mid
      from public.rooms rm
      join public.profiles p on p.id = rm.main_id
      join auth.users u      on u.id = p.id
     where rm.status = 'open' and rm.main_id <> me and p.onboarded
       and not exists (select 1 from public.room_waitlist w
                        where w.room_id = rm.id and w.balloon_id = me)
       and (select count(*) from public.room_waitlist w2
             where w2.room_id = rm.id and w2.decision <> 'popped') < rm.max_balloons
     order by (u.email like 'seed%@baloun.test'), random()
     limit quante_stanze_altrui
  loop
    insert into public.room_waitlist (room_id, main_id, balloon_id)
    values (r.rid, r.mid, me)
    on conflict (room_id, balloon_id) do nothing;
    unita := unita + 1;

    if aperte < quante_gia_aperte then
      update public.rooms set opens_at = now() - interval '5 seconds' where id = r.rid;
      aperte := aperte + 1;
    end if;
  end loop;

  raise notice 'Stanze a cui ti sei unitə: % (aperte subito: %) — emoji ricevute: %',
    unita, aperte, reazioni;
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
  (select count(*) from public.profile_tags t where t.profile_id = p.id)    as interessi,
  (select count(*) from public.profile_prompts pr where pr.profile_id = p.id) as spunti,
  case
    when r.opens_at is null then 'in attesa del primo ingresso'
    when r.opens_at <= now() then 'aperta'
    else 'si apre fra ' || to_char(r.opens_at - now(), 'MI:SS')
  end as stato
from public.room_waitlist w
cross join me
join public.rooms r    on r.id = w.room_id
join public.profiles p on p.id = case when w.main_id = me.id then w.balloon_id else w.main_id end
where w.main_id = me.id or w.balloon_id = me.id
order by dove, persona;
