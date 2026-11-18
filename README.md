# Trip Tracker

A personal spending tracker for trips, installable on an iPhone Home Screen. Everything is stored on the device; there is no account or server. See `CLAUDE.md` for the full spec.

## Run it while developing (PowerShell)

```powershell
npm install
npm run dev -- --host   # open the "Network" address in Safari on the same Wi-Fi
npm test                # calculation and data tests
npm run build           # type-check and build into dist/
```

## Deploying

Pushing to `main` builds and publishes the site with GitHub Actions (`.github/workflows/deploy.yml`). In the repository, set **Settings > Pages > Source** to **GitHub Actions** once. The site is served at `https://<username>.github.io/<repository-name>/`; the build picks up the repository name automatically.

To test the production build locally under the same path:

```powershell
$env:VITE_BASE = '/trip-tracker/'
npm run build
npx vite preview --port 4173
# open http://localhost:4173/trip-tracker/
```

## Icons

`node scripts/make-icons.mjs` regenerates the PNG icons in `public/icons/`.

## Font

BIZ UDPGothic (Latin subset), SIL Open Font License, bundled in `public/fonts/` so the app works offline.
