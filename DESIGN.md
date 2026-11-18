---
name: Trip Tracker
description: A warm travel wallet; white cards on a ground washed in the trip's country color, with the trip color only on what you press and on the meters that show money moving.
colors:
  warm-stone: "#f1edea"
  card-white: "#ffffff"
  field-stone: "#f4f0ed"
  ink: "#2b2420"
  mute: "#665a52"
  hairline: "#e6dfda"
  main-outside-trip: "#2b2420"
  night-main-outside-trip: "#f3ece7"
  default-trip-orange: "#f39700"
  over-red: "#d63306"
  under-green: "#17623e"
  food-orange: "#d9480f"
  shopping-magenta: "#b83280"
  suica-green: "#0f8a5f"
  activities-blue: "#1f74c7"
  transport-violet: "#6b46c1"
  misc-stone: "#78716c"
  night-stone: "#1b1715"
  night-card: "#28221f"
  night-field: "#332b27"
  night-ink: "#f3ece7"
  night-mute: "#b1a59c"
  night-hairline: "#3d3430"
  night-red: "#ff6a3d"
  night-green: "#5fd39a"
  night-food: "#ff8a4c"
  night-shopping: "#f06bb4"
  night-suica: "#3ccb8f"
  night-activities: "#5aa9f0"
  night-transport: "#a88bf5"
  night-misc: "#b5ada6"
typography:
  hero-figure:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  display:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title-lg:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 800
  body:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  small:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
  label:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
  caption:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
rounded:
  hero: "28px"
  card: "22px"
  trip: "24px"
  track: "18px"
  row: "16px"
  control: "14px"
  tile: "11px"
  meter: "6px"
  full: "999px"
spacing:
  gutter: "16px"
  stack: "14px"
  card-pad: "18px"
  hero-pad: "20px"
  row-gap: "8px"
  tap-min: "44px"
components:
  button-primary:
    backgroundColor: "{colors.default-trip-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "0 18px"
    height: "54px"
  button-primary-outside-trip:
    backgroundColor: "{colors.main-outside-trip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    height: "54px"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    height: "54px"
  button-danger:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.over-red}"
    rounded: "{rounded.row}"
    height: "54px"
  button-danger-armed:
    backgroundColor: "{colors.over-red}"
    textColor: "{colors.card-white}"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  card-hero:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.hero}"
    padding: "20px 20px 18px"
  entry-row:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    height: "62px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "52px"
  chip:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  status-pill:
    textColor: "{colors.under-green}"
    rounded: "{rounded.full}"
    padding: "5px 11px"
  category-tile:
    rounded: "{rounded.tile}"
    size: "36px"
  meter:
    backgroundColor: "{colors.field-stone}"
    rounded: "{rounded.meter}"
    height: "12px"
  tab-bar:
    backgroundColor: "{colors.card-white}"
    rounded: "26px"
    padding: "6px"
---

# Design System: Trip Tracker

## Overview

**Creative North Star: "The Warm Travel Wallet"**

A friendly wallet that takes on the destination's color. Soft white cards sit flat on a warm stone ground; open a trip and that ground takes a faint wash of the country's color, while the full color is spent only on what you can press and on the meters that show money moving. The first thing read in a trip is a big rounded number, how much is left today, over a thick meter. Everything else is one calm card per idea below it.

Density is phone-first and one-handed: generous 44px+ targets, one column on a phone, two columns from 700px for an unfolded foldable. The face is the system's rounded sans (SF Pro Rounded on iPhone), heavy for figures, plain for labels, with tabular numerals everywhere money appears. No font files ship; the app stays fully offline.

The system rejects the outlined enamel sign-panel look it replaced and the grey SaaS card kit: identical cards, one radius, a grey shadow on everything.

**Key Characteristics:**
- Ground tinted by the trip's country; cards pure white and flat.
- Main color is neutral outside a trip (ink in light mode, warm white in dark) and the country color inside one (the same neutral when no country is set).
- A radius hierarchy that ranks surfaces: hero 28, cards 22, rows 16, controls 14, chips and pills full.
- Shadow only on things that float: tab bar, sheets, undo toast.
- Meters (today, budget, the route bar on each trip card) are the one expressive move.
- Categories as soft tinted tiles with a letter in the full category color.
- Red means over the limit, missing data, an error, or a destructive action; nothing else.

## Colors

Warm, low-chroma neutrals carry the page; one swappable trip color carries action; six fixed category hues carry data; red and green carry judgement.

### Primary
- **Trip Color** (set per trip): the country's representative national color, computed by `tripTheme()` into `--brand` (light) and `--brand-dark` (dark). In light mode it is nudged toward black only until ink or white text on it reaches 4.5:1; in dark mode it is lightened until it stands 3:1 off a dark panel and carries readable text. Its text color (`--on-brand`) is whichever of ink or white reads better. Inside a trip it fills primary buttons, the selected chip, the active tab icon and its 16% tint, input focus borders, the caret, the meter fill, the day-timeline dots and line, and the jet's tail and stripe.
- **No-country neutral**: a trip with no country uses the same neutral as outside a trip (ink #2b2420 in light, warm white #f3ece7 in dark). The old default orange (#f39700) is kept only as a token for reference.
- **Main Outside Trip** (#ffffff light, #f3ece7 dark): the main color on the trips list and App settings. Primary buttons there are white on the stone ground with a hairline border; focused inputs take an ink border instead.

### Tertiary (category hues, fixed for every trip)
- **Food Orange** (#d9480f), **Shopping Magenta** (#b83280), **Suica Green** (#0f8a5f), **Activities Blue** (#1f74c7), **Transport Violet** (#6b46c1), **Misc Stone** (#78716c). Dark mode lifts each (night-food through night-misc). Used for the letter in category tiles (on an 18% tint of the same hue), and for a category's slice or bar in Summary charts so it always matches its tile.

### Neutral
- **Warm Stone** (#f1edea): the ground outside a trip, the theme-color and manifest background. Night Stone (#1b1715) in dark.
- **Card White** (#ffffff): every card, row, input, chip and the tab bar. Night Card (#28221f) in dark.
- **Field Stone** (#f4f0ed): meter tracks, route tracks, pressed states, rows nested inside a day. Night Field (#332b27).
- **Ink** (#2b2420): all primary text and the focus ring. Night Ink (#f3ece7).
- **Mute** (#665a52): labels, secondary figures, inactive tabs. Night Mute (#b1a59c).
- **Hairline** (#e6dfda): input and secondary-button borders, dividers between card parts and day stops. Night Hairline (#3d3430).
- **Over Red** (#c8322a; Night Red #ff7a6b) and **Under Green** (#17623e; Night Green #5fd39a): judgement only.

### Named Rules
**The Country Wash Rule.** Inside a trip the ground is the trip color mixed into stone in oklab (8% light over #f6f2ef, 9% dark over #1b1715) and the field tone takes a 6% / 8% wash. The wash is the room; the full color is reserved for action and meters.

**The White Outside Rule.** Outside a trip there is no brand color. The trips list and App settings run on white, ink and stone; each trip card brings its own country color with it as a 2.5px outline and its route fill.

**The Red Means Trouble Rule.** Red appears only for over the limit, missing data (a card charge with no dollars, no cash rate), errors, and destructive actions. A country whose flag color is red still gets red only as its trip color, never as a warning signal on its own screens.

## Typography

**Display Font:** ui-rounded / SF Pro Rounded (with Nunito if installed, then the system UI sans)
**Body Font:** the same stack
**Label/Mono Font:** none distinct; numerals are tabular (`font-variant-numeric: tabular-nums`) on the body

**Character:** One friendly rounded face, made assertive by weight rather than size changes. On iPhone it is SF Pro Rounded; on other platforms it falls back to the system sans, by the owner's choice to ship no font files.

### Hierarchy
- **Hero figure** (800, 3.4rem, line-height 1, -0.03em): Left today in the Today card; only one per screen.
- **Display** (800, 2.2rem, 1.1, -0.02em): the main figure of a card (spent, total spent).
- **Headline** (800, 1.45rem, -0.01em): the trip name in the top band; 2.1rem on the root trips list.
- **Title large** (800, 1.25rem): card headings (Today, Budget, By category, Stats cards), trip names on trip cards and sheet titles; a clear step above 16px body.
- **Title** (800, 1.05rem): sub-headings inside a card ("Rest of the trip") and button text.
- **Body** (400, 16px, 1.4): text and figures in rows; inputs are 17px 600 so iOS never zooms on focus.
- **Small** (600, 0.95rem): secondary lines (the live "left today" caption, alerts, Days chips).
- **Label** (600 to 700, 0.85rem): field labels, stat captions, route dates, row sub-lines. Sentence case, never uppercase.
- **Caption** (700, 0.75rem): tab labels, chart axis labels, usage counts.

The ramp is closed: 0.75, 0.85, 0.95, 1, 1.05, 1.25, 1.45, 2.2, 3.4rem. Figures that fit themselves to their column (container units) stay inside these bounds.

### Named Rules
**The Weight Carries It Rule.** Figures are 800; labels are 600 to 700 in mute. Hierarchy comes from weight and color before size.

**The No Files Rule.** No webfont ships. The rounded face comes from the device; Nunito is only a fallback name for machines that already have it.

## Layout

A single column inside a 900px max container with a 16px side gutter plus safe-area insets; screens stack cards with a 14px gap. From 700px the content splits into two columns (`1fr 1fr`, or `3fr 2fr` when the row opens with the hero card), full-width blocks span both, and the category grid goes from two to three columns. Sheets anchor to the bottom on a phone and center from 700px. Bottom padding of 120px plus the safe-area inset keeps content clear of the floating tab bar. Every tap target is at least 44px; primary buttons are 54px, inputs 52px, rows 62px, tabs 58px.

## Elevation & Depth

Flat by default. Cards, rows, inputs and chips sit on the ground with no shadow; depth between them comes from white against tinted stone and from the radius rank. One warm shadow is reserved for elements that float over the page.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 12px 32px -10px rgba(70, 40, 20, 0.32), 0 2px 6px rgba(70, 40, 20, 0.08)`; dark: `rgba(0,0,0,0.7)` / `rgba(0,0,0,0.4)`): the tab bar, sheets, and the undo toast.
- **Push edge** (`box-shadow: -8px 0 24px rgba(40, 20, 10, 0.25)`): only on the incoming or outgoing screen during the whole-screen slide.

### Named Rules
**The Only Floaters Cast Rule.** If it scrolls with the page, it has no shadow. If it floats above the page, it gets Float, never anything heavier.

## Shapes

Every corner is soft and the radius ranks the surface: hero card 28px (also sheets), cards and the day timeline 22px, trip cards 24px, rows, buttons and notes 16px, inputs 14px, category tiles 11px (9px small), meters 6px, chips, pills and the day-head marker fully round, the 44px header buttons and day dots circular. Borders are rare and functional: 2px hairline on inputs and secondary buttons, 2px red on a row missing dollars, 2.5px country color around each trip card, 1.5px hairline dividers between card parts and between day stops.

## Components

### Buttons
Tactile and plain: full-width blocks with a small press-in.
- **Shape:** gently rounded (16px), 54px tall, 17px 800 text.
- **Primary:** trip color with its readable text inside a trip; ink with warm-white text outside one (warm white with ink text in dark).
- **Secondary:** card white, ink text, 2px hairline border.
- **Danger:** card white, red text, red border at 40%; armed state fills red with white text (two-step delete).
- **Press:** `scale(0.97)` over 160ms on the ease-out-quint curve. Focus is a 3px ink outline offset 2px across the app.

### Chips
- **Style:** card white, fully round, 44px tall, 15px 700. A chip carrying a category tile tucks its padding to 6px on the left.
- **State:** selected fills with the main color and its text, the tile inside turns white. Press scales to 0.95.

### Segmented Control
A soft track (ink 8% into the ground, 18px radius, 4px inset) with a raised white pill (14px) for the selected option. Card / Cash on Add and the Entries filters.

### Cards / Containers
- **Corner Style:** 22px; the Today hero 28px.
- **Background:** card white.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none; inner sections are split by a 1.5px hairline with 14px above and below.
- **Internal Padding:** 18px; hero 20px 20px 18px.

### Inputs / Fields
- **Style:** card white, 2px hairline border, 14px radius, 52px tall, 17px 600 text; numeric keypad for yen, decimal for dollars.
- **Focus:** fields get a trip-color border plus a soft 3px halo of it (ink outside a trip); buttons get a 3px ink outline; caret and accent take the main color.
- **Labels:** 0.875rem 700 mute above the field, given a ground-colored backing so the background pattern never crosses them.

### Navigation
- **Top band:** large title (1.45rem 800; 2.1rem on the trips list), a round 44px back or gear button in card white (16% trip tint inside a trip), the flag emoji beside the trip name, and a day chip.
- **Tab bar:** a floating pill (26px radius, card white, Float shadow) 10px above the home indicator. Each tab is 58px with icon over a 0.72rem label in mute; the active tab gets a 16% trip-color fill, ink text and a trip-color icon. Icons are 24px stroked SVGs at 2px.

### Meter (signature)
The expressive move. A 12px track in field stone, 6px radius, filled in the main color proportional to part over whole, with a 12px minimum so a sliver always shows. Over the limit the fill turns red. The fill eases to its width over 600ms. Used on the Today hero (day spent of daily limit) and the budget card (trip spent of ceiling).

### Route Bar (signature)
On each trip card: a 10px field-stone track with the trip color filling the elapsed share of the trip, and the app icon's jet (40px, ink stroke, white body, trip-color tail and stripe) riding at the fill's leading edge. Fill and jet glide in together over 900ms on first paint. Start and end dates sit beneath in 0.8rem mute. The same jet at 120px is the empty-state illustration.

### Category Tile
A 36px soft square (11px radius) filled with an 18% tint of the category hue, the category's letter (F, S, IC, A, T, M; ¥ for cash bought) in the full hue at 800. 30px small variant in rows. Always decorative beside the written category name.

### Entry Row
Card-white strip, 16px radius, 62px minimum. Category tile, then the name in 800 over a sub line (payment and date in mute, note in ink 500, truncating), amounts right-aligned (yen 800, dollars mute beneath), and a ⋮ button. A card charge missing dollars gets a 2px red outline.

### Day Timeline
Days sit in one 22px card with a 4px line in a 30% trip tint running down the left. Each day is a 28px numbered dot: white with a 3px trip-color ring, filled with the trip color for today, hairline ring and mute number for a day with no spending. Over or under shows in red or green under the day's total.

### Live Left-Today Line (Add)
A white 16px-radius strip under the amount fields: a mute caption ("Left today", or "After this, left today" once an amount is typed) and a 1.25rem 800 figure, ≈ when the dollars are estimated. When the purchase would go over the daily limit the whole strip turns the warning red with on-red text. In Cash mode the dashed **Add cash** row sits right below it.

### Folded Row and Scrolling Chips (Add, Entries)
Rarely changed fields wait behind one 52px row (2px hairline, 14px radius): "Today · Change date, add a note" with a chevron; tapping it reveals Date and Note side by side. On a phone, long chip rows (categories, cards, Entries filters) scroll sideways in one line with a soft fade at each edge instead of wrapping; from 700px they wrap again.

### Summary Cards and Charts
The Summary is a column of cards the owner arranges (pencil in the header, then Edit; hold and drag to reorder, with the card lifting and following the finger while the others slide aside). Built-ins: Today (hero), Budget, By category. Custom cards show chosen numbers or calculations as Numbers, Tiles, a Bar chart (one bar per figure, scaled within its unit), a Pie chart (category or chart-order colors, legend with value and percent, 6 slices then Other) or a Daily chart (bars per day with a dashed daily-limit line and red over-limit days, or lines for running totals and day rates; tap a day to read it). Chart slice colors (--chart-1..6) are a fixed, color-blind-checked order. Stats uses the same figure language: a large figure per card over a three-up rule of smaller figures.

### Sheets and Undo
Sheets float clear of every edge on the ground color, 28px radius, Float shadow, rising 56px into place over 420ms (a 16px rise plus slight scale from 700px). The undo toast inverts: ink background, ground-colored text, 18px radius, with its own Undo button, sitting above the tab bar.

### Motion
Navigation is quick and directional, and all of it switches off under `prefers-reduced-motion`. Opening a trip or App settings slides the whole screen in from the right (View Transitions, 420ms, the outgoing screen drifts 30% left and dims); going back reverses it. Page content pushes 40px, tabs slide 18px toward the tapped tab (300ms). Presses scale on `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). Meter and route fills ease in.

## Do's and Don'ts

### Do:
- **Do** take the main color from `--or` everywhere, so a trip's country color and the neutral outside a trip both flow through one variable.
- **Do** keep cards flat white on the tinted ground; give the Float shadow only to the tab bar, sheets and undo toast.
- **Do** rank radius by surface: hero 28, card 22, row 16, control 14, tile 11, chips full.
- **Do** set figures at 800 in tabular numerals, and keep labels sentence case in mute.
- **Do** show money moving with a meter in the main color, red when over.
- **Do** outline each trip card on the list in its own country color, and show flags as system emoji.
- **Do** keep every tap target at 44px or more and every input at 16px or larger.

### Don't:
- **Don't** use red for anything but over the limit, missing data, errors and destructive actions.
- **Don't** put a brand color on the trips list or App settings; the main color outside a trip is the neutral ink / warm white.
- **Don't** add shadows to cards, rows, chips or inputs.
- **Don't** ship font files; rely on the system rounded face.
- **Don't** return to outlined sign panels or a single-radius grey card kit.
- **Don't** set labels in uppercase or add small headings above titles.
