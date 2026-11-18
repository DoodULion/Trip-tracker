# Trip Tracker — trip spending tracker, home-screen web app (PWA)

This file is the spec for the app. Read it fully before writing code, and keep the app consistent with it. If something here conflicts with a request in the chat, ask before changing behavior.

## What the app does

This is a personal spending tracker for trips (the first is a trip to Japan, Nov 26 – Dec 20, 2026; the app holds as many trips as I create). I'll use it on my iPhone, added to the Home Screen from Safari. I log each card charge and each cash purchase with its category, and every time I get yen (ATM withdrawal or exchange). The app shows daily totals, budget pace, totals by category, and my real exchange rates, worked out from the amounts I actually paid. It never uses online or default exchange rates for real amounts. The one exception (approved by me): a card charge still missing its dollars is counted at that day's market rate as a clearly marked estimate (≈) until I enter the real dollars.

It replaces a spreadsheet I built, and its behavior should match that spreadsheet.

I'm developing on Windows, so there's no Mac and no Xcode. The app must run as a web app in iOS Safari and as a Home Screen app.

## Tech

- Vite + React + TypeScript. Keep dependencies minimal and ask before adding any beyond these:
  - `vite-plugin-pwa` (manifest + service worker, so the app works offline)
  - `idb` (a small IndexedDB wrapper) for storage
  - `vitest` for tests
- Draw charts as plain SVG components. No chart library.
- All data stays on the device in IndexedDB. No accounts and no backend. The only network call after the first load is the market-rate lookup for card charges missing dollars (Frankfurter / ECB reference rates, sends only the date); rates are cached on the device and the app works fully offline without them.
- On first launch, call `navigator.storage.persist()` to ask the browser to keep the data.
- Money: store yen as integer yen and dollars as integer cents. Never do money math with floats. Only round rates (yen per $) when displaying them, to 2 decimals.
- Dates: store each entry as a local calendar date string, `YYYY-MM-DD`. Compare dates as these strings, never with time zones.

## iPhone and Home Screen requirements

- `manifest.webmanifest` should include a name ("Trip Tracker"), a short name, `display: standalone`, a theme color, and icons, including a 180×180 `apple-touch-icon`.
- Add these meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, and `viewport-fit=cover`. Respect safe-area insets (`env(safe-area-inset-*)`).
- Form inputs: use 16px or larger text (so iOS doesn't zoom in on focus), `inputmode="numeric"` for yen, and `inputmode="decimal"` for dollars. Make tap targets at least 44px.
- Use a responsive layout. One column on a normal phone, and a wider two-column layout when the screen is wider (around 700px and up), because I'll often use a foldable phone unfolded.
- Support light and dark mode: follow `prefers-color-scheme` by default, or force Light or Dark from App settings. Use the system font stack.
- Dollar amount fields for the trip budget show thousands commas as you type (`10,000`); commas are ignored when the amount is read.

## Data model

The app holds many **trips**. Every entry below belongs to exactly one trip (stored with its `tripId`), and every calculation in this spec (cash rate, daily limit, totals, and so on) is done per trip. Trips never mix: each has its own cash rate, budget, cards, and entries.

**Trip** (one record per trip; "Settings" below are its fields)
- `id`, `name` (e.g. "Japan Trip")
- `country` (optional, ISO 3166-1 alpha-2 code such as `JP`): sets the trip's flag and main color. Chosen from a list in the trip form; "No country" uses the neutral main color (near-black in light mode, the home page's warm white in dark mode).
- `tripStart`: `"2026-11-26"`, `tripEnd`: `"2026-12-20"` (the original trip's values)
- `budgetCeilingCents`: 1,000,000 ($10,000). This is a ceiling, not a target.
- `cards`: ["Apple Card", "Capital One"]. Editable per trip.
- `categories`: one list shared by every trip, starting as six built-ins in this order: Food, Shopping, Suica, Activities, Transportation, Misc. In App settings I can delete any category (with confirmation; at least one stays), restore deleted built-ins, and add my own (own tile color and letter). A deleted category is no longer offered for new entries; past entries keep it and it still shows in totals while it has spending. The list is kept in the backup.

**CardCharge**: `id`, `date`, `category`, `card` (all required); `yen` (optional, blank means the item was priced in dollars); `cents` (optional, can be filled in later because card charges take a day or two to finalize); `note` (optional)

**CashPurchase**: `id`, `date`, `category`, `yen` (all required); `cents` (optional: the USD actually paid; when set it replaces yen ÷ cash rate for that purchase, and does not change the cash rate or cash on hand); `note` (optional)

**CashBought** (ATM withdrawal or exchange): `id`, `date`, `yen` received, `cents` paid including any ATM or bank fees (all required); `where` (optional)

## Calculations

Put these in a pure TypeScript module (`src/calc.ts`) with no UI code, and test them.

- **Cash rate** = sum of CashBought yen ÷ sum of CashBought dollars (a weighted average over all cash bought). If no cash has been bought yet, the cash rate is undefined.
- **Cash purchase in dollars** = its own USD paid when entered, otherwise yen ÷ cash rate. If the cash rate is undefined, show a banner ("Add the cash you bought") and leave cash dollars blank. Never guess a rate.
- **Card rate** (overall, and for each card) = sum of yen ÷ sum of dollars, counting only charges that have both yen and real (not estimated) dollars.
- **Estimated card dollars**: a card charge with yen but no dollars counts at that day's market rate (the closest earlier day with a rate if that day has none; the owner's own card rate when no market rate has been fetched). Estimates feed totals, today's spending and left amounts, and are shown with ≈; they never change the entry or the card and overall rates.
- **Overall rate** = (card yen with dollars + cash yen spent) ÷ (card dollars with yen + cash dollars).

**Per trip day** (each date from tripStart through tripEnd, inclusive):
- Card yen, card dollars, cash yen, cash dollars
- Total ¥ = card yen + cash yen
- Total $ = card dollars + cash dollars
- Day rate = Total ¥ ÷ Total $ (only when both are present), counting real amounts only: a card charge still missing its dollars (estimated or not) is left out of the day rate on both sides, so best and worst day rate never come from an estimate
- Yen by category = card yen + cash yen in that category
- Daily limit = budget ceiling ÷ trip length in days
- Over/under = Total $ − daily limit. Show red if over, green if under.
- Running total $ and running limit (daily limit × days elapsed)

Days with no entries show blanks, not zeros.

**Trip summary:**
- Total spent ($) = card dollars + cash dollars
- Remaining = budget ceiling − total spent
- Trip length = days from tripStart to tripEnd, inclusive (25)
- Days left: before the trip, the full trip length. During the trip, tripEnd − today (today counts as used). After the trip, 0.
- Left per day = remaining ÷ days left
- Trip summary (after the trip ends): total spent; average per day = total spent ÷ trip length; most and least spent day = the biggest and smallest day among days with spending.
- Left today = daily limit − today's spending (only during the trip; blank before or after). Once the trip has ended, the Summary opens with a **Trip summary** block instead of Today: total spent, average per day (total over every day of the trip), and the day spent most and least (among days with spending, with their dates). Otherwise Summary opens with two separate blocks. First, **Today** (spent and left for the day, with the daily limit). It always shows: today during the trip, the first trip day (labelled as such) before the trip starts, and the last trip day after it ends. Second, the trip block: spent so far, status, then remaining, left per day and days left. Average per day and projected total are no longer shown on Summary (the pace status still uses them).
- Days with spending = number of trip days that have any spending
- Average per day = total spent ÷ days with spending
- Projected total = average per day × trip length
- Status: "Not started" if nothing is logged, "Over pace" if the projected total is more than the budget ceiling, otherwise "On pace". After the trip has ended, the projected total is simply the total actually spent (nothing is left to project), so a finished trip is "Over pace" only if it really went over the ceiling.
- By category: dollars (card dollars + cash dollars), yen, and % of the total
- By payment: dollars for each card, card charges with no card picked, cash
- Cash on hand (¥) = yen bought − cash yen spent
- Biggest day (and its date), smallest day, days over the limit, days under the limit
- Best and worst day rate

Entries dated outside the trip dates are not counted in the per-day views. Show them in an "Outside trip dates" note so they aren't silently lost.

## Screens

**Trips list (the main page).** The app always opens here, never straight into a trip. It lists the trips, most recently created first, with name, dates, spent of ceiling, and a status badge (after a trip ends the badge reads Under budget or Over budget). Holding a trip and dragging it reorders the list (also Move up / Move down in its ⋮ menu); the order is saved. Tap a trip to open it. Each trip has a ⋮ button on its right with **Edit trip** (name, dates, budget ceiling, cards; Save changes / Discard changes) and **Delete trip** (confirmation that says how many entries go with it). A **New trip** button creates a trip. The card-rename hint shows only when editing an existing trip. App settings shows when a backup was last exported from this device. Each trip with a country shows its flag emoji beside its name (and again in the header inside the trip), and its card on the list is outlined in the country's color, with a small jet riding its progress bar. The main color outside a trip (this list and app settings) is white; inside a trip the primary buttons, selected chips, active tab, meters and today's day dot take the country's color (near-black in light mode and warm white in dark mode when no country is set), and the page background takes a light tint of it. The look (warm white cards, rounded system font, floating tab bar) is recorded in DESIGN.md. The home page shows only the trips and a **New trip** button; a gear button in the top-right corner opens **App settings** with **Appearance** (System / Light / Dark; System follows the phone, and the choice is a per-device preference, not part of backups) and the app-wide tools: **Export backup** (one JSON file holding all trips), **Import backup** (replaces everything, with confirmation; old single-trip backups import as one trip), **Export CSV** (all entries from all trips, with a Trip column), and **Delete all data** (typed confirmation).

Inside a trip, a "‹ Trips" button at the top goes back to the list. A trip always opens on the Summary tab. Use a bottom tab bar:

1. **Summary**: budget card with spent, remaining, daily limit, left per day, and a status badge, spending by category, and the missing-cash-rate banner when it applies. (The daily-spending table and the daily yen chart were removed; per-day detail lives on the Days tab.)
2. **Add**: a fast entry flow. Pick Card or Cash, then enter the amounts. Defaults: date = today (clamped to the trip dates), the last-used card, and the last-used category. A **New category** chip adds a category for every trip, and a **New card** chip adds a card to this trip (there is no "None" card choice on Add; Edit still has it for older entries); each opens a small name sheet and selects the new item. No field is ever focused automatically: the keyboard must not open when the trip opens, when the Add tab is tapped, when switching between Card and Cash, or after saving; the user taps a field to start typing. Save in as few taps as possible, and show a brief "Saved" confirmation. Cash bought is not on this screen (see Entries).
3. **Entries**: lists of card charges, cash purchases, and cash bought, grouped by day, with filters All / Card / Cash / Cash bought. A **Log cash bought** button at the top opens a small form for an ATM withdrawal or exchange (yen received, dollars paid including fees, date, where). Tapping an entry does nothing; each row has a ⋮ button on its right that opens Edit / Delete / Cancel. Delete asks for confirmation. After saving a new entry (card, cash, or cash bought), saving an edit, or deleting an entry, an **Undo** button appears for about 7 seconds above the tab bar; it removes the new entry, restores the previous values, or brings the deleted entry back. Edit opens a sheet with "Save changes" and "Discard changes" at the bottom. Card charges still missing dollars are outlined in red, with a note above the list; fill them in through Edit.
4. **Days**: the daily log with Total $, Total ¥, rate, over/under, card/cash split, and running total vs. running limit. Tapping a day shows its entries.
5. **Payments**: By payment (dollars for each card, card charges with no card picked, cash), Cash and rates (cash on hand, overall, cash and card rates, per-card rates, best and worst day rate), and Days stats (days with spending, over and under the limit, biggest and smallest day). A trip's name, dates, budget ceiling and cards are edited from the trips list (⋮ → Edit trip); there is no Settings tab inside a trip.

Over the daily limit, the Today card turns into a solid warning panel (a vermilion distinct from any country color, with a warning tag and striped bar). After saving an entry, the Undo message also says how much is left for that day (or how far over). The Entries missing-dollars alert has an **Add dollars** button that opens the oldest such charge. Cash entries (Add and Edit) have an optional **USD paid** field. Pop-up sheets stack their buttons (main action first), and Escape or a tap outside closes a sheet only while nothing in it has been changed. Only the content area scrolls; the header and tab bar never move.

Navigation is animated, quickly: opening a trip or App settings slides the whole new screen in from the right over the old one, and going back slides it away to the right to reveal the screen underneath (on browsers without View Transitions, only the page content slides); switching tabs slides a short way toward the tapped tab, and sheets rise from the bottom. All motion is off when the device asks for reduced motion.

Show yen as `¥1,600` and dollars as `$10.00`.

## Test cases (must pass, in Vitest)

Test data:

Card:
- 2026-11-26, Food, ¥1,600, $10.00, Apple Card
- 2026-11-26, Shopping, ¥8,000, $50.00, Capital One
- 2026-11-27, Transportation, ¥16,000, $100.00, Apple Card

Cash:
- 2026-11-26, Food, ¥800
- 2026-11-27, Suica, ¥3,200
- 2026-11-28, Activities, ¥1,600

Cash bought:
- 2026-11-26, ¥30,000, $200.00

Expected results (dollars rounded to cents for display):
- Cash rate 150.00. Card rate 160.00, Apple Card 160.00, Capital One 160.00.
- 11/26: Total ¥10,400, Total $65.33, rate 159.18
- 11/27: Total ¥19,200, Total $121.33, rate 158.24
- 11/28: Total ¥1,600, Total $10.67, rate 150.00
- Total spent $197.33 (card $160.00 + cash $37.33). Total yen ¥31,200. Overall rate 158.11.
- Cash on hand ¥24,400. Days with spending 3. Average per day $65.78.
- Daily limit $400.00 ($10,000 over 25 days). Remaining $9,802.67.
- Category dollars: Food $15.33, Shopping $50.00, Suica $21.33, Activities $10.67, Transportation $100.00, Misc $0.00
- With no cash bought, cash dollars are undefined and the banner flag is set.

## Hosting

Deploy to GitHub Pages with a GitHub Actions workflow that builds on every push to `main`. Set Vite's `base` to the repository name. Explain each one-time setup step to me in plain language, since I'm new to GitHub Pages. The site must be served over HTTPS so the service worker and Home Screen install work.

## How to work

- I'm on Windows using PowerShell. Give commands that work there.
- Build in small steps, each one runnable: (1) project setup and the calculation module, with the tests passing; (2) storage and the Add flow; (3) the Entries list; (4) the Summary and Days screens and the chart; (5) Settings with backup, import, and CSV; (6) PWA setup (manifest, icons, offline) and deploying to GitHub Pages; (7) polish for iPhone and the wide unfolded screen.
- After each step, run the tests and the build, then tell me exactly what to check. For testing on my phone during development, run the dev server with `--host` and tell me the address to open in Safari on the same Wi-Fi.
