# Product

## Platform

web

## Users

One person: the developer-owner, using the app on their own iPhone (installed to the Home Screen from Safari) and often on a foldable phone unfolded. Audience confirmed as "just me": a personal tool, not a shared or public product, so there is no onboarding, marketing, or multi-user concern. The code will live in a public GitHub repo (for GitHub Pages hosting), but each person's data stays on their own device.

The job: while travelling abroad, log each card charge, cash purchase, and every local-currency withdrawal or exchange within moments, then glance at daily totals, budget pace, category spend, and real exchange rates to decide how freely to spend that day. Entry happens at registers, on trains, and on the move; review happens at the hotel or over coffee.

## Product Purpose

A spending tracker for trips that works offline on the phone. It replaces a hand-built spreadsheet and must behave like it. Success means entering a purchase takes a few taps, the numbers match what the owner would have computed by hand, and the owner always knows whether they are on pace against a budget ceiling.

## Positioning

Every rate shown (cash, each card, per day, overall) is worked out from the local currency and dollars the owner actually paid, including ATM and bank fees, so the dollar cost of a purchase is the real cost. Online or default rates are never used for real amounts. The one exception, approved by the owner: a card charge still missing its dollars is counted at that day's market rate (Frankfurter / ECB reference rates) as an estimate marked ≈ until the real dollars are entered. That lookup is optional: it sends only the date, rates are cached per currency on the device, and the app works fully offline without it (estimates then fall back to the owner's own card rate). Estimates never change any rate. All data stays on the device; there is no account or backend, and the rate lookup is the only network call after first load.

## Operating Context

- Used mostly offline or on poor roaming data, in daylight and indoors, frequently one-handed.
- Each trip has its own dates, dollar budget ceiling (a ceiling, not a target), country, cards, categories, entries, and cash rate. The app opens on a trips list (tabs for Current & upcoming and Past), or straight into a trip's Summary when today falls within its dates.
- Dollars are always the base currency. A trip's country sets its local currency (yen, euros, pounds, kroner and so on, with that currency's sign and decimals), used for every local amount on that trip's screens and in the CSV. A trip with no country uses yen. Local amounts are stored as integer minor units, so changing a trip's country re-reads its entries in the new currency.
- Three entry kinds per trip: card charges (local amount and/or dollars; dollars may be filled in a day or two later once the card posts), cash purchases (local amount; dollars from the cash rate, or the USD actually paid when entered), and cash bought (local currency received, dollars paid including fees).
- Categories are the owner's own list: six built-ins to start (Food, Shopping, Suica, Activities, Transportation, Misc), plus any the owner adds, each with its own tile color and letter. Each trip picks which categories it offers, ordered by how often they were used on other trips. Deleted categories stay on past entries and in totals.
- Yen shown as `¥1,600`, euros as `€16.00`, dollars as `$10.00`, dates as `11/26`.
- Backup is a JSON file (all trips) the owner exports to Files or email; CSV export (all entries, with a Trip column) for review elsewhere.

## Capabilities and Constraints

- Platform: installable web app (PWA) in iOS Safari and as a Home Screen app; no Mac or Xcode in the workflow. Developed on Windows.
- Stack: Vite, React 19, TypeScript, IndexedDB via `idb`, `vite-plugin-pwa` (manifest, icons, offline service worker), Vitest. Charts are plain SVG, no chart library. Ask before adding dependencies.
- Money is stored as integer local-currency minor units (whole yen, euro cents) and integer dollar cents; rates are rounded only for display (2 decimals). Dates are local `YYYY-MM-DD` strings.
- Hosting: GitHub Pages over HTTPS, deployed by GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`. Installed and in use on the owner's iPhone.
- Calculations are a pure module with tests; the spec in CLAUDE.md is the behavior authority.
- Layout: one column on a normal phone; two columns around 700px and up (unfolded foldable). Light mode by default; Dark or System can be chosen in App settings (a per-device preference).
- Interaction decisions already made by the owner: tapping an entry does nothing; each entry has a ⋮ button for Edit / Delete; edit sheets end in "Save changes" / "Discard changes"; no field is ever focused automatically (not on opening a trip, tapping Add, switching Card / Cash, or after saving); cash bought is logged from the **Add cash** row in Add > Cash; the home page shows only trips, with app settings behind a gear button; the Summary is a set of cards the owner arranges and can extend with their own figures, formulas and charts.

## Brand Commitments

- Each trip can be set to a country: its flag shows on the trips list and inside the trip, and the country's color becomes that trip's main color (near-black in light mode and warm white in dark mode with no country). Outside a trip the main color is white. Red-flag countries draw money meters in ink, so red on a meter always means "over". Flags are the system's flag emoji.

- App name: **"Trip Tracker"** (renamed from "Japan Trip" because the app now holds many trips). It is applied to the page title, the Home Screen title, backup and CSV file names, and the spec. The internal identifiers `japan-trip` (backup file marker and IndexedDB name) intentionally stay as they were so older backups and stored data keep working; the npm package name is `trip-tracker`. The owner's first trip is still named "Japan Trip" inside the app.
- Voice: plain, direct, money-literate. Short labels, no cheerleading.

## Evidence on Hand

- A real spreadsheet the owner built (not in the repo) is the behavioral reference; CLAUDE.md records its calculations and the exact test cases (Vitest, currently passing).
- No testimonials, users, screenshots, or brand assets exist beyond the app itself. None should be invented.

## Product Principles

1. Entering a purchase is the primary act; make it fast, one-handed, and forgiving.
2. Real numbers only: every dollar figure traces to amounts the owner actually paid, except card charges awaiting dollars, which are clearly marked ≈ estimates; never guess a cash rate, and show blanks instead of invented zeros.
3. Honest about pending data: card charges missing dollars and cash with no cash rate are visible gaps, never silently hidden.
4. The phone is the only place the data lives: offline first, private, and easy to back up.
5. Calm clarity over decoration: glanceable pace and over/under status in a sunlit street as well as a hotel room.

## Accessibility & Inclusion

No product-specific needs beyond standard good practice: legible contrast in light and dark, tap targets of at least 44px, 16px or larger inputs so iOS does not zoom, color never the only signal for over/under or errors, and safe-area handling on iPhone.
