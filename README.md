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

The PNG icons in `public/icons/` were rendered from `scripts/icon.svg` (see the note at its top).

## Font

No font files ship: the app uses the device's rounded system face (SF Pro Rounded on iPhone), so it works offline. See `DESIGN.md`.

## Apple Pay Shortcut

To fill card charges from Apple Pay taps, set up the iPhone Shortcut in `SHORTCUT.md`.
