# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: the developer-owner, using the app on their own iPhone (installed to the Home Screen from Safari) and often on a foldable phone unfolded. Audience confirmed as "just me": a personal tool, not a shared or public product, so there is no onboarding, marketing, or multi-user concern. The code will live in a public GitHub repo (for GitHub Pages hosting), but each person's data stays on their own device.

The job: while travelling abroad, log each card charge, cash purchase, and every yen withdrawal or exchange within moments, then glance at daily totals, budget pace, category spend, and real exchange rates to decide how freely to spend that day. Entry happens at registers, on trains, and on the move; review happens at the hotel or over coffee.

## Product Purpose

A spending tracker for trips that works offline on the phone. It replaces a hand-built spreadsheet and must behave like it. Success means entering a purchase takes a few taps, the numbers match what the owner would have computed by hand, and the owner always knows whether they are on pace against a budget ceiling.

## Positioning

It never uses online or default exchange rates. Every rate shown (cash, each card, per day, overall) is worked out from the yen and dollars the owner actually paid, including ATM and bank fees, so the dollar cost of a purchase is the real cost. All data stays on the device; there is no account, backend, or network call after first load.

## Operating Context

- Used mostly offline or on poor roaming data, in daylight and indoors, frequently one-handed.
- Each trip has its own dates, dollar budget ceiling (a ceiling, not a target), card names, entries, and cash rate. The app opens on a trips list; a trip opens only when chosen.
- Three entry kinds per trip: card charges (yen and/or dollars; dollars may be filled in a day or two later once the card posts), cash purchases (yen; dollars derived from the cash rate), and cash bought (yen received, dollars paid including fees).
- Fixed categories in this order: Food, Shopping, Suica, Activities, Transportation, Misc.
- Yen shown as `¥1,600`, dollars as `$10.00`, dates as `11/26`.
- Backup is a JSON file the owner exports to Files or email; CSV export for review elsewhere.

## Capabilities and Constraints

- Platform: installable web app (PWA) in iOS Safari and as a Home Screen app; no Mac or Xcode in the workflow. Developed on Windows.
- Stack (existing): Vite, React, TypeScript, IndexedDB via `idb`, `vite-plugin-pwa` (planned), Vitest. Charts are plain SVG, no chart library. Ask before adding dependencies.
- Money is stored as integer yen and integer cents; rates are rounded only for display (2 decimals). Dates are local `YYYY-MM-DD` strings.
- Hosting: GitHub Pages over HTTPS, deployed by GitHub Actions on push to `main`. Not yet deployed.
- Calculations are a pure module with tests; the spec in CLAUDE.md is the behavior authority.
- Layout: one column on a normal phone; two columns around 700px and up (unfolded foldable). Light and dark mode follow the system.
- Interaction decisions already made by the owner: tapping an entry does nothing; each entry has a ⋮ button for Edit / Delete; edit sheets end in "Save changes" / "Discard changes"; no field is ever focused automatically (not on opening a trip, tapping Add, switching Card / Cash, or after saving); cash bought is logged from a button on Entries; the home page shows only trips, with app settings behind a gear button.
- Open decision: Home Screen icon, manifest, and PWA setup are not built yet.

## Brand Commitments

- Each trip can be set to a country: its flag shows on the trips list and inside the trip, and the country's color becomes that trip's main color (orange with no country). Outside a trip the main color is white. Flags are the system's flag emoji.

- App name: **"Trip Tracker"** (renamed from "Japan Trip" because the app now holds many trips). It is applied to the page title, the Home Screen title, backup and CSV file names, and the spec. The internal identifiers `japan-trip` (backup file marker and IndexedDB name) intentionally stay as they were so older backups and stored data keep working. The owner's first trip is still named "Japan Trip" inside the app.
- Voice: plain, direct, money-literate. Short labels, no cheerleading.

## Evidence on Hand

- A real spreadsheet the owner built (not in the repo) is the behavioral reference; CLAUDE.md records its calculations and the exact test cases (Vitest, currently passing).
- No testimonials, users, screenshots, or brand assets exist beyond the app itself. None should be invented.

## Product Principles

1. Entering a purchase is the primary act; make it fast, one-handed, and forgiving.
2. Real numbers only: every dollar figure traces to amounts the owner actually paid; never guess a rate, and show blanks instead of invented zeros.
3. Honest about pending data: card charges missing dollars and cash with no cash rate are visible gaps, never silently hidden.
4. The phone is the only place the data lives: offline first, private, and easy to back up.
5. Calm clarity over decoration: glanceable pace and over/under status in a sunlit street as well as a hotel room.

## Accessibility & Inclusion

No product-specific needs beyond standard good practice: legible contrast in light and dark, tap targets of at least 44px, 16px or larger inputs so iOS does not zoom, color never the only signal for over/under or errors, and safe-area handling on iPhone.
