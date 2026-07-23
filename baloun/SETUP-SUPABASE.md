# BALOUN — collegare il backend (Supabase)

Guida passo-passo, senza terminale. Tempo stimato: 15 minuti.
Alla fine l'app avrà registrazione vera, profili reali, feed dal database
e waitlist funzionante.

---

## 1) Crea il progetto Supabase

1. Vai su https://supabase.com → **Start your project** → accedi con GitHub
2. **New project**
   - **Name**: `baloun`
   - **Database Password**: generane una e **salvala** (serve solo in casi rari)
   - **Region**: `Central EU (Frankfurt)` — la più vicina all'Italia
3. Attendi 1-2 minuti che il progetto sia pronto

---

## 2) Crea il database

1. Nel menu a sinistra: **SQL Editor** → **New query**
2. Apri il file `supabase/schema.sql` di questo progetto, **copia tutto**
3. Incollalo nell'editor → **Run** (in basso a destra)
4. Deve comparire *Success. No rows returned*

Puoi rieseguirlo quando vuoi: è scritto per non creare doppioni.

Per controllare: menu **Table Editor** → devi vedere le tabelle
`profiles`, `profile_interests`, `rooms`, `room_waitlist`.

---

## 3) Disattiva la conferma email (solo per i test)

Altrimenti ogni registrazione richiede di aprire la mail prima di poter entrare.

1. Menu **Authentication** → **Sign In / Providers** (oppure **Providers** → **Email**)
2. Disattiva **Confirm email**
3. **Save**

> Quando l'app andrà live, riattivalo.

---

## 4) Prendi le due chiavi

1. Menu **Project Settings** (icona ingranaggio) → **API Keys** (o **API**)
2. Ti servono due valori:
   - **Project URL** → qualcosa tipo `https://abcdefgh.supabase.co`
   - **anon public** (chiave pubblica) → una stringa lunghissima

⚠️ Esiste anche una chiave **service_role**: **non usarla mai** nell'app.
Quella ha pieni poteri sul database e va tenuta segreta.
La chiave *anon* invece è fatta apposta per stare dentro l'app: da sola non
permette nulla, perché è il database (con le regole RLS che hai appena creato)
a decidere chi può leggere e scrivere cosa.

---

## 5) Metti le chiavi su Netlify

Le chiavi vengono inserite **durante il build**, quindi devono stare su Netlify.

1. Netlify → il tuo sito → **Site configuration** → **Environment variables**
2. **Add a variable** → **Add a single variable**, due volte:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | il Project URL del punto 4 |
   | `VITE_SUPABASE_ANON_KEY` | la chiave anon del punto 4 |

   (Scope: lascia *All scopes* / *All deploy contexts*)
3. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

Se apri l'app e vedi la scritta *"Manca la configurazione"*, significa che le
due variabili non sono arrivate: ricontrolla il nome (devono iniziare con
`VITE_`) e rifai il deploy.

---

## 6) Prova

1. Apri il sito su iPhone → **Registrati** con una email qualsiasi
2. Compila il profilo (nome, data di nascita, città, canzone, cibo, foto)
3. Vedrai la Home vuota: **sei l'unico utente**, e nel feed non compari mai tu stessə

Per vedere il feed popolato servono altri profili:
- registra un secondo account (usa una scheda privata o un'altra email)
- oppure chiedi a un amico di iscriversi

Con due account puoi provare il giro completo: da A premi KEEP su B,
poi entra come B e in **La mia stanza** vedrai A nella lista.

---

## Cosa NON serve (per ora)

**Edge Functions: nessuna.** Tutto ciò che fa la V1 (registrarsi, salvare il
profilo, leggere il feed, entrare in waitlist) è gestito dal database con le
regole RLS e tre funzioni SQL. Aggiungere Edge Functions ora sarebbe
complessità inutile.

Serviranno più avanti per:
- chiudere le stanze scadute a orario fisso (o con l'estensione **pg_cron**)
- inviare notifiche push
- moderazione automatica delle foto

**Secrets: solo le due variabili sopra.** Nient'altro.

---

## Come funziona la sicurezza (in breve)

Ogni tabella ha **RLS** attivo: il database controlla ogni singola richiesta.

- Puoi modificare **solo** il tuo profilo
- Puoi inserirti in waitlist **solo** come te stessə, e una volta sola per stanza
- Vedi la waitlist **solo** della tua stanza (o le tue attese)
- Non puoi entrare nella tua stessa stanza
- Le foto: ognuno scrive solo nella propria cartella

Anche se qualcuno leggesse il codice dell'app (è possibile: è pubblico),
non potrebbe fare nulla di più di quanto permettono queste regole.

**Le foto profilo** vengono ridotte a 96px prima del caricamento: nel feed si
vedono sfocate e, anche scaricando il file originale, non sono riconoscibili.
La foto ad alta risoluzione la aggiungeremo con i round di rivelazione.
