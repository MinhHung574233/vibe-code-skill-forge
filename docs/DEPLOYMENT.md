# SkillForge – Build, Host, Install, Test, Back up

Everything below uses free services and requires **no Apple Developer account and no backend**. Commands are PowerShell on Windows. Requires Node 22 (`node -v` → v22.x).

> **Choose your final URL first.** Browser storage is per-origin. If the site later moves to a different domain, the installed app starts empty and you must restore from a backup. Pick a stable host name (a free `*.pages.dev`, `*.netlify.app` or `*.github.io/<repo>` address is fine) before you start using the app daily.

## 1. Build the production PWA

```powershell
cd F:\claude\SkillForge
npm ci
npm run verify        # tsc + eslint + vitest must be green
npm run build         # outputs ./dist (static files incl. sw.js, manifest, icons)
npm run preview       # optional: serve ./dist locally at http://localhost:4173
```
The build uses a **relative base** (`./`) and a hash router, so the same `dist` works at a domain root or a sub-path (`user.github.io/skillforge/`).

## 2. Host on free HTTPS static hosting (pick one)

HTTPS is mandatory (service workers and installability require it; `localhost` is the only exception).

### Option A – Cloudflare Pages (recommended: free, fast, no repo needed)
1. Create a free Cloudflare account → *Workers & Pages* → *Create* → *Pages* → **Upload assets**.
2. Name the project (this becomes `https://<name>.pages.dev`), drag the `dist` folder in, deploy.
3. Updates: *Create new deployment* and upload a fresh `dist` (or connect a Git repo with build command `npm run build`, output `dist`, Node 22).

### Option B – GitHub Pages
1. Create a GitHub repo, push the project.
2. Add `.github/workflows/pages.yml` (provided at M5.x) that runs `npm ci && npm run verify && npm run build` with Node 22 and publishes `dist` via `actions/deploy-pages`.
3. Repo *Settings → Pages → Source: GitHub Actions*. URL: `https://<user>.github.io/<repo>/`.
4. Note: Pages on a *private* repo requires a paid plan; a public repo exposes the (non-personal) source and content. Your personal data is never in the repo – it lives only on the phone.

### Option C – Netlify Drop
1. Open `app.netlify.com/drop`, sign in (free), drag `dist` onto the page. URL: `https://<random>.netlify.app` (rename in site settings).

All three serve `sw.js` and `manifest.webmanifest` correctly with no extra configuration. `public/_headers` is copied into `dist/` and applied by Cloudflare (Workers assets and Pages) and Netlify: it sets the Content-Security-Policy and security headers and the cache policy. GitHub Pages ignores `_headers` (the app still works; only the extra headers are missing). Because `sw.js`, `index.html` and the manifest are `no-cache` and hashed assets are immutable, updates are picked up promptly and everything else is cached long-term.

## 3. Open it in Safari on iPhone
1. Use **Safari** (other iOS browsers cannot install PWAs to the Home Screen on all versions; Safari is the supported path).
2. Visit your HTTPS URL. Wait for the page to load fully while online.

## 4. Add to Home Screen
1. Tap the **Share** button → **Add to Home Screen** (scroll the share sheet if needed) → keep "Open as Web App" on if shown → **Add**.
2. Open SkillForge **from the Home Screen icon** (not from Safari). It should open full-screen with no Safari bars.
3. **Do your first-run setup inside the installed app**, not in the Safari tab: the installed app has its own, separate storage.
4. In *Settings → Offline*, wait for **Ready offline** (the full app and all learning content are cached). Stay online until it shows.

## 5. Test offline
1. Settings shows **Ready offline**. (If it says Incomplete, tap **Repair** while online.)
2. Enable **Airplane Mode**, force-quit SkillForge from the app switcher, relaunch from the icon.
3. Open every module; log a Rubik solve and a vocabulary review; confirm they appear in Progress.
4. Disable Airplane Mode; data must still be there.

## 6. Updating the app
Deploy the new `dist` to the same URL. Next time you open the app online, an **Update ready – Restart** banner appears; tap it. Your data is kept (database versions upgrade in place; a pre-upgrade snapshot is taken automatically).

## 7. Back up and restore personal data
**Back up (do this weekly; the app reminds you after 14 days):**
*Settings → Your data → Back up my data* → **Save to Files or share** (iCloud Drive recommended) or AirDrop to your PC. If that button is missing, use **Download file** or **Copy as text**. Keep at least two recent copies. The file is not encrypted: store it somewhere private.

**Restore (new phone, reinstall, or data loss):**
1. Install the app from the Home Screen first (§4) and wait for Ready offline.
2. *Settings → Your data → Restore from backup file* (or the same button on the recovery screen if the app reports missing data) → choose the `.json` file → review the summary (counts and date) → **Replace my data** → confirm. Files that are damaged, edited or from a newer app version are refused before anything changes.
3. The app keeps a safety copy of your current data, replaces it with the backup, and reloads. If anything fails, your previous data is restored automatically.

**Warnings:** deleting the Home Screen icon deletes all app data; changing the hosting URL creates an empty app; iOS may evict website data under extreme storage pressure. Backups are your only guaranteed protection.

## 8. Local development
```powershell
npm run dev           # Vite dev server (SW disabled by default in dev)
npm run dev -- --host # reach it from the phone on the same Wi-Fi (HTTP: no SW/install on device)
```
For real SW/install testing on a device use a deployed HTTPS preview (any option above) or an HTTPS tunnel; do not test installability over plain HTTP.
