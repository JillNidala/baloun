# BALOUN — stato del progetto

Documento di passaggio: allegalo (insieme a `baloun.zip`) all'inizio di una
chat nuova, così si riparte senza rispiegare tutto.

---

## Cos'è

App di dating mobile-first ispirata al format "Pop The Balloon". Non ci sono
swipe: ci sono **stanze**. Ogni utente è **Main** (viene valutato, ha una
stanza) e **Balloon** (entra nelle stanze altrui).

**Il ciclo, in breve**
1. Nel feed anonimo vedi un Main: foto sfocata, nome, età, città, 2 interessi, 2 spunti.
2. 💥 palloncino rosso = rifiuti, non salva nulla. 🩷 cuore = entri nella sua waitlist.
3. La stanza si apre dopo un tempo (oggi 60 secondi, configurabile).
4. Da aperta vedi il profilo completo e decidi di nuovo.
5. Il Main sceglie fra chi è rimasto → **match** → chat.

**Regole attuali**: 5 Balloon per stanza, 10 Main per sessione nel feed,
1 stanza attiva per utente.

---

## Stack

React 19 · Vite · TypeScript · Tailwind · React Router · TanStack Query ·
Zustand · Framer Motion · React Hook Form · Zod · Lucide · Supabase.

**Niente Three.js**: la stanza è un'immagine con elementi sovrapposti (vedi sotto).

---

## Come è fatta la stanza

Non è 3D in tempo reale. È una **foto isometrica fissa** (`public/scene/room.jpg`)
con sopra i palloncini posizionati in 5 postazioni **misurate sul render
originale**, non stimate:

```
palloncini (coordinate immagine 1264×843):
  x: 656, 724, 794.5, 865.5, 937
  y: 282, 319, 352,   385,   417.5
  larghezza: 61 px
```

Sopra ogni palloncino c'è la foto profilo, staccata e grande 1,78 volte il
palloncino. Si sovrappongono per il 18% dell'area: è voluto, con ordine di
profondità.

**Sprite delle animazioni** (`public/scene/`):
- `pop.png` — palloncino che scoppia, griglia 5×4, 20 fotogrammi
- `heart-pop.png` — cuore che scoppia, griglia 4×4, 16 fotogrammi
- `balloon.png`, `heart.png` — le versioni ferme

---

## Decisioni prese (da non rimettere in discussione senza motivo)

- **Tenda rossa e pavimento in legno non si toccano mai.**
- Il POP non salva nulla; il KEEP scrive in `room_waitlist`.
- I Balloon non si vedono fra loro in chiaro: ognuno vede **nitida solo la
  propria** foto, sfocate le altre. Il Main le vede tutte nitide.
- La foto ad alta risoluzione sta in un bucket **privato**: il permesso è nel
  database, non nella grafica.
- Le emoji sono un elenco chiuso in tabella (`approved_emojis`), validato
  server-side.
- La personalizzazione con Gemini **modifica la foto della stanza**, non
  incolla oggetti sopra.

---

## Trappole già incontrate (leggere prima di toccare l'SQL)

1. **Ordine nel file SQL** — una funzione o una policy non può citare una
   tabella creata più avanti nel file. Costato due errori.
2. **Alias nelle join** — `cross join me` va messo prima di ogni condizione
   che usa `me.`.
3. **Variabili plpgsql** — mai chiamarle come una colonna (`in_feed`), crea
   ambiguità.
4. **Cambiare le colonne restituite da una funzione** richiede
   `drop function` prima di ricrearla. C'è già un blocco di pulizia in cima
   a `schema.sql`.
5. **Trigger di capienza** — non deve scattare quando la persona è già nella
   stanza (caso `insert ... on conflict`).

→ **`python3 supabase/verifica.py` intercetta tutti questi casi.** Va lanciato
prima di consegnare qualunque SQL.

---

## File che contano

```
src/features/room/components/RoomScene.tsx     la stanza + palloncini + emoji
src/features/room/components/SpritePop.tsx     le due animazioni di scoppio
src/features/feed/components/DecisionButtons   palloncino / cuore
src/pages/RoomsPage.tsx                        My room + Others (con swipe)
src/pages/RoomDetailPage.tsx                   stanza altrui vista da Balloon
src/features/decor/                            chat di personalizzazione
supabase/schema.sql                            TUTTO il database, rieseguibile
supabase/functions/generate-decor/index.ts     Edge Function per Gemini
supabase/prepara-prove.sql                     popola i dati di prova
supabase/verifica.py                           controlli automatici
```

---

## Come si pubblica

- **Database**: incollare `schema.sql` nel SQL Editor di Supabase. È
  rieseguibile e non cancella dati.
- **App**: caricare i file su GitHub **sovrascrivendo** (non serve cancellare
  tutto); Netlify ricostruisce da solo. I file *eliminati* dal progetto vanno
  però rimossi a mano dal repo.
- **Funzione Gemini**: Supabase → Edge Functions → Via Editor → Deploy.
  Segreti: `GEMINI_API_KEY` (progetto con fatturazione attiva), `APP_URL`.

---

## Cosa manca

- Round intermedio fra l'apertura della stanza e la scelta finale.
- Notifiche.
- Chiusura automatica delle stanze scadute (oggi spariscono solo dal feed).
- Qualità dei prompt di Gemini: da tarare sui risultati reali.
