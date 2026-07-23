-- ============================================================
-- BALOUN — 100 profili di prova
--
-- COSA FARE: incolla tutto nel SQL Editor di Supabase → Run.
-- Richiede che schema.sql sia già stato eseguito.
--
-- Crea 100 utenti finti con email tipo seed001@baloun.test.
-- I trigger che hai già installato fanno il resto:
--   utente creato  → nasce il profilo
--   profilo completo → si apre la sua stanza
--
-- Per cancellarli tutti, in fondo al file trovi il comando.
-- ============================================================

-- ------------------------------------------------------------
-- PULIZIA: rimuove i profili di prova creati in precedenza.
-- Serve perché le email devono essere uniche.
-- A cascata spariscono anche profili, stanze, waitlist, foto,
-- interessi e spunti collegati. I profili VERI non vengono toccati.
-- ------------------------------------------------------------
delete from auth.users where email like 'seed%@baloun.test';

do $$
declare
  nomi text[] := array[
    'Giulia','Marco','Sara','Luca','Chiara','Matteo','Elena','Davide','Alice','Federico',
    'Martina','Simone','Francesca','Andrea','Beatrice','Lorenzo','Ilaria','Riccardo','Valentina','Tommaso',
    'Camilla','Alessandro','Noemi','Filippo','Greta','Gabriele','Aurora','Stefano','Ludovica','Emanuele',
    'Silvia','Nicolò','Rebecca','Pietro','Arianna','Edoardo','Vittoria','Giacomo','Anna','Cristian',
    'Marta','Daniele','Serena','Alberto','Irene','Michele','Sofia','Enrico','Bianca','Samuele'
  ];
  citta text[] := array[
    'Milano','Roma','Torino','Bologna','Firenze','Napoli','Genova','Verona','Padova','Bergamo',
    'Brescia','Venezia','Trieste','Parma','Modena'
  ];
  canzoni text[] := array[
    'After Hours — The Weeknd','Blonde — Frank Ocean','Currents — Tame Impala','Punisher — Phoebe Bridgers',
    'Rumours — Fleetwood Mac','In Rainbows — Radiohead','SOS — SZA','Igor — Tyler, The Creator',
    'Kind of Blue — Miles Davis','Random Access Memories — Daft Punk','Cellophane — FKA twigs',
    'Norman Rockwell — Lana Del Rey','Ok Computer — Radiohead','Channel Orange — Frank Ocean',
    'Melodrama — Lorde','Bad Bunny — Un Verano Sin Ti','Fine Line — Harry Styles','Ants From Up There — Black Country',
    'Sono Un Grande — Calcutta','La Bella Confusione — Franco126'
  ];
  cibi text[] := array[
    'Sushi','Ramen','Pizza napoletana','Carbonara','Tacos al pastor','Poke','Bao','Curry thai',
    'Tortellini in brodo','Focaccia','Gnocchi al pomodoro','Pad thai','Hummus','Paella',
    'Cacio e pepe','Dim sum','Falafel','Lasagne','Pho','Tiramisù'
  ];
  risposte_mai text[] := array[
    'preso un aereo senza sapere dove andavo','imparato ad andare in bici','visto la neve al mare',
    'finito una serie in un giorno','detto di no a un tiramisù','dormito in tenda sotto le stelle',
    'cantato bene sotto la doccia','resistito a un mercatino dell''usato'
  ];
  risposte_voglio text[] := array[
    'aprire un piccolo bar con i libri','vedere l''aurora boreale','imparare a suonare il basso',
    'vivere un anno all''estero','avere un orto sul balcone','scrivere qualcosa che resti',
    'attraversare l''Italia in treno','smettere di rimandare'
  ];
  risposte_domenica text[] := array[
    'mercato la mattina e divano il pomeriggio','una camminata lunga e niente sveglia',
    'colazione lenta e un museo','fuori città senza programmi','cucinare per troppa gente',
    'un film alle tre del pomeriggio','bici lungo il fiume','libreria, caffè, zero fretta'
  ];
  i      int;
  uid    uuid;
  mail   text;
begin
  for i in 1..100 loop
    uid  := gen_random_uuid();
    mail := 'seed' || lpad(i::text, 3, '0') || '@baloun.test';

    -- 1) Utente finto. La password è un valore fisso senza significato:
    --    questi profili non fanno login, esistono solo per popolare il feed.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      mail,
      '$2a$10$PZ4h1mQKpZ7t0uJc9vY5xO8dGf3nRbLwE6sTaHkVmXpQyNzCiUdBu',
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      '', '', '', ''
    );

    -- 2) Completa il profilo creato dal trigger.
    --    onboarded = true fa scattare l'apertura della stanza.
    update public.profiles set
      display_name = nomi[1 + (i - 1) % array_length(nomi, 1)],
      city         = citta[1 + (i * 7) % array_length(citta, 1)],
      birth_date   = current_date
                     - (interval '1 year' * (19 + (i * 3) % 20))
                     - (interval '1 day'  * ((i * 37) % 360)),
      bio          = null,
      avatar_path  = null,
      onboarded    = true
    where id = uid;

    -- 3) Interessi: 5 scelti, di cui 2 visibili nel feed anonimo.
    insert into public.profile_tags (profile_id, tag_slug, in_feed)
    select uid, t.slug, (row_number() over (order by t.sort)) <= 2
      from (
        select slug, sort from public.interest_tags
         order by ((sort / 10) + i) % 16, slug
         limit 5
      ) t;

    -- 4) Spunti: 5 risposte, di cui 2 visibili nel feed anonimo.
    insert into public.profile_prompts (profile_id, prompt_id, answer, in_room, in_feed)
    values
      (uid, 'mai',          risposte_mai[1 + (i * 7) % array_length(risposte_mai, 1)],       true, true),
      (uid, 'voglio',       risposte_voglio[1 + (i * 11) % array_length(risposte_voglio, 1)], true, true),
      (uid, 'domenica',     risposte_domenica[1 + (i * 5) % array_length(risposte_domenica, 1)], true, false),
      (uid, 'colonna',      canzoni[1 + (i * 11) % array_length(canzoni, 1)],                true, false),
      (uid, 'piatto',       cibi[1 + (i * 13) % array_length(cibi, 1)],                      true, false);
  end loop;
end $$;

-- Le stanze nascono con scadenza 24 ore: per i profili di prova la allunghiamo
-- a 30 giorni, altrimenti domani sparirebbero tutti dal feed.
update public.rooms r
   set expires_at = now() + interval '30 days'
  from auth.users u
 where u.id = r.main_id
   and u.email like 'seed%@baloun.test';

-- Controllo finale: dovresti leggere 100.
select count(*) as profili_di_prova
  from public.profiles p
  join auth.users u on u.id = p.id
 where u.email like 'seed%@baloun.test';


-- ============================================================
-- OPZIONALE — riempi la TUA stanza
-- Fa entrare 8 profili finti nella tua waitlist, così "La mia stanza"
-- non è vuota. Sostituisci l'email con la TUA.
-- ============================================================
-- insert into public.room_waitlist (room_id, main_id, balloon_id)
-- select r.id, r.main_id, s.id
--   from public.rooms r
--   join auth.users me on me.id = r.main_id and me.email = 'benjillalia2@gmail.com'
--   cross join lateral (
--     select p.id from public.profiles p
--     join auth.users u on u.id = p.id
--     where u.email like 'seed%@baloun.test'
--     order by random() limit 8
--   ) s
-- on conflict do nothing;


-- ============================================================
-- PER CANCELLARE TUTTI I PROFILI DI PROVA
-- Elimina utenti, profili, stanze e waitlist a cascata.
-- ============================================================
-- delete from auth.users where email like 'seed%@baloun.test';
