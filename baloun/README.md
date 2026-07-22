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
- **Home**: feed delle stanze (foto, nome, età, n° Balloon, tempo, "Entra")
- **Room**: vista Balloon con **🎈 Resta / 💥 Poppa** e animazione di esito
- **La mia stanza**: contatore, timer, lista Balloon, elimina, chiudi
- **Profilo**: statistiche, modifica, logout

Tutte le regole della V1 (max 20 Balloon, 24h, ecc.) sono già in
`src/config/limits.ts`. I dati sono finti (`src/services/mockData.ts`) finché
non colleghiamo Supabase.

---

## 🔌 Step 3 (prossimo): Supabase

Quando pronti, creeremo il progetto Supabase, gireremo le migrazioni del
database e compileremo `.env` (vedi `.env.example`). Solo allora login e dati
diventeranno reali.

## Comandi (solo se un domani userai un computer con terminale)

```
npm install     # installa
npm run dev      # sviluppo in locale
npm run build    # build di produzione (quello che usa Netlify)
```
