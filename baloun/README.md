# BALOUN — base (Step 2)

App mobile-first (PWA) in React 19 + Vite + TypeScript + Tailwind + Supabase.
Questa è la **base navigabile**: 8 schermate con il branding definitivo (logo
palloncino + ago, serif editoriale, typewriter, rosso + rosa). L'autenticazione
è **simulata** — nello Step 3 colleghiamo Supabase (login vero + database).

---

## 📱 Provarla su iPhone SENZA terminale

Servono due account gratuiti: **GitHub** (per ospitare il codice) e **Netlify**
(per pubblicarla). Nessun comando da digitare.

### 1) Metti il codice su GitHub
1. Vai su https://github.com → **New repository** → nome `baloun` → **Create**.
2. Nella pagina del repo vuoto, clicca **"uploading an existing file"**.
3. Trascina dentro **tutti i file di questa cartella** (NON la cartella
   `node_modules` né `dist` — non ci sono nello zip che ti ho dato).
4. **Commit changes**.

### 2) Pubblica con Netlify
1. Vai su https://app.netlify.com → **Add new site** → **Import an existing project**.
2. Scegli **GitHub** e seleziona il repo `baloun`.
3. Netlify legge già il file `netlify.toml`, quindi i campi sono giusti:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Deploy site**. Dopo ~1 minuto avrai un link tipo `https://baloun-xyz.netlify.app`.

### 3) Aprila sull'iPhone come app
1. Apri quel link in **Safari** sull'iPhone.
2. Tocca **Condividi** → **Aggiungi a Home**.
3. Ora hai l'icona BALOUN sulla home: si apre a schermo intero, come un'app.

> Ogni volta che aggiorneremo il codice su GitHub, Netlify ripubblica da solo.

---

## 🗺️ Cosa c'è già dentro

- **Splash** con logo animato → **Login / Registrazione** (form validati con Zod)
- **Onboarding** (foto, bio, interessi, età, città) — struttura visiva
- **Home = feed di Main da leggere.** Una card per volta, più alta dello schermo:
  avatar sfocato → nome • età • città → canzone → cibo → decisione.
  - 🎈 **POP THE BALLOON** → rifiuti, si passa subito al Main successivo (non salva nulla)
  - ❤️ **KEEP THE BALLOON** → entri nella **waitlist** della stanza di quel Main,
    piccola conferma, poi Main successivo
  - massimo **10 Main per sessione**, poi la schermata di fine sessione
- **La mia stanza**: vista Main (mock) + l'elenco delle stanze in cui sei in attesa
- **Profilo**: statistiche, modifica, logout

Non ci sono ancora chat, match, round, eliminazioni e notifiche: è voluto.
L'unico loop da validare è **Leggo → Decido → KEEP o POP → Prossimo Main**.

Le regole stanno in `src/config/limits.ts`. I dati dei Main sono finti
(`src/features/feed/api/mockMains.ts`) finché non colleghiamo Supabase.

### Come aggiungere un nuovo interesse alla card
1. Aggiungi il tipo in `src/features/feed/types/main.ts` (`InterestKind`)
2. Aggiungi icona ed etichetta in `src/features/feed/components/InterestRow.tsx`
Fatto: la card non va toccata.

## 🔌 Backend (Supabase)

L'app ora usa un database vero. Per configurarlo segui **`SETUP-SUPABASE.md`**
(15 minuti, senza terminale). Lo schema del database è in `supabase/schema.sql`.

Servono due variabili d'ambiente su Netlify:
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
Senza di esse l'app mostra la schermata "Manca la configurazione".

## Comandi (solo se un domani userai un computer con terminale)

```
npm install     # installa
npm run dev      # sviluppo in locale
npm run build    # build di produzione (quello che usa Netlify)
```
