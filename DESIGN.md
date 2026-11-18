---
name: Trip Tracker
description: A spending tracker drawn as a rail line; enamel sign panels, line-colored roundels, an orange shell.
colors:
  orange-line: "#f39700"
  ink: "#1a1a1a"
  enamel-ground: "#f4f4f1"
  enamel-sign: "#ffffff"
  mute: "#5c5c57"
  hairline: "#d6d6d0"
  over-red: "#d4261c"
  food-orange: "#f39700"
  shopping-purple: "#9c5e9b"
  suica-green: "#00a260"
  activities-blue: "#009bbf"
  transport-magenta: "#b6007a"
  misc-silver: "#6f6f6a"
  night-ground: "#121212"
  night-sign: "#1e1e1e"
  night-ink: "#f2f2ee"
  night-mute: "#a8a8a2"
  night-hairline: "#3a3a37"
  night-red: "#ff6b5e"
  night-misc-silver: "#9a9a94"
typography:
  display:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 700
    lineHeight: 1.35
  title:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.35
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  pill: "14px"
  chip: "22px"
  round: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
components:
  button-primary:
    backgroundColor: "{colors.orange-line}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "52px"
  button-danger:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.over-red}"
    rounded: "{rounded.md}"
    height: "52px"
  sign-panel:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  input-field:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "48px"
  roundel:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "34px"
  status-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.enamel-ground}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  chip:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.enamel-ground}"
  tab-bar:
    backgroundColor: "{colors.enamel-sign}"
    textColor: "{colors.mute}"
    height: "60px"
  top-band:
    backgroundColor: "{colors.orange-line}"
    textColor: "{colors.ink}"
    height: "56px"
---

# Design System: Trip Tracker

## Overview

**Creative North Star: "Station Line"**

A trip is a rail line. Each day is a numbered station, each category a line color, each budget a sign panel. Surfaces are white enamel signs with heavy ink keylines set on a warm light-grey ground; the single orange line is the shell around everything (top band, primary action, the day line). The look is made for a sunlit street and one-handed use: large numerals, hard edges, full-strength color, nothing translucent or soft.

The system refuses the grey-cards-plus-one-accent finance default and the cherry-blossom-and-torii Japan costume. Japan is present only in the transit-signage grammar and in two authored SVG motifs (seigaiha wave scales on the trips-list band, a bullet train riding each trip's route bar). Dark mode is an enamel-black ground with the same line colors.

**Key Characteristics:**
- Heavy ink keylines (3px panels, 2px controls) instead of shadows.
- Category = line color + roundel code; color is never the only signal because the name and code always sit beside it.
- One typeface, tabular numerals, no display face.
- The one number you need today is set large (44px), like a sign band.
- Running totals right-aligned and tight to the margin.

## Colors

A warm-grey enamel ground, white signs, ink-black type, one orange shell, six fixed line colors, and a single reserved red.

### Primary
- **Orange Line** (#f39700): the shell. Top band, primary buttons, the active tab marker, the day line and its today node, route progress, the focus ring, selection. Black ink sits on it (never white).

### Secondary (the six category lines, fixed for every trip, same in light and dark)
- **Food Orange** (#f39700), **Shopping Purple** (#9c5e9b), **Suica Green** (#00a260), **Activities Blue** (#009bbf), **Transport Magenta** (#b6007a): roundel rings, chart segments, legend dots.
- **Misc Silver** (#6f6f6a light, #9a9a94 dark): Misc category and the cash-bought roundel; the one line color that shifts per scheme, for contrast against the sign.

### Neutral
- **Enamel Ground** (#f4f4f1 / night #121212): page and sheet background.
- **Enamel Sign** (#ffffff / night #1e1e1e): panels, inputs, tab bar, rows.
- **Ink** (#1a1a1a / night #f2f2ee): text, keylines, selected states (inverted fills).
- **Mute** (#5c5c57 / night #a8a8a2): labels, secondary text, inactive tabs.
- **Hairline** (#d6d6d0 / night #3a3a37): row dividers, chip outlines, empty-state outlines.
- **Over Red** (#d4261c / night #ff6b5e): over-limit, missing dollars, errors, destructive. Nothing else.

### Named Rules
**The Red Means Over Rule.** Red marks over-limit, missing data, errors and destruction only; it is never decoration and never a category.
**The Fixed Lines Rule.** A category keeps its line color on every screen, every trip, in both schemes. Do not recolor categories per context.
**The Ink On Orange Rule.** Text on the orange shell is ink, not white.

## Typography

**Display Font:** BIZ UDPGothic (with Hiragino Sans, Yu Gothic, system-ui)
**Body Font:** BIZ UDPGothic, same stack
**Label/Mono Font:** none; tabular numerals on the whole page

**Character:** A signage-legibility gothic, bundled Latin 400 and 700 (OFL). Hierarchy comes from size and the 400/700 weight step alone; there is no display face.

### Hierarchy
- **Display** (700, 2.75rem, 1.1, -0.01em): the spent figure on the budget card.
- **Headline** (700, 1.4rem): the trips-list band title.
- **Title** (700, 1.2rem): band title inside a trip, trip names, sheet headings (1.15rem).
- **Body** (400, 16px, 1.35): rows, inputs, buttons (17px bold), table cells (0.9rem).
- **Label** (700, 0.8rem, mute): field labels, table heads, tab labels, group headings. Sentence case, no tracking.

### Named Rules
**The Tabular Rule.** Every figure aligns on tabular numerals; amounts right-align.
**The Sixteen Rule.** Inputs never fall below 16px.

## Layout

One column on a phone inside a 900px centered container (14px side padding plus safe-area insets, 110px bottom padding to clear the fixed tab bar). Screens stack with a 12px gap. At 700px and up, `.cols` becomes two equal columns and sheets center as dialogs (max 640px) instead of docking to the bottom. Spacing is a loose 4/6/8/12/14/16 rhythm; the category grid is two columns because "Transportation" does not fit in three.

## Elevation & Depth

No shadows. Depth is conveyed by keylines: a 3px ink border lifts a sign panel off the ground, 2px on controls, a 1px hairline for quiet rows. Overlays use a flat scrim (55% ink light, 70% black dark) behind sheets that carry the same 3px keyline. A pressed state is a 12% darkening or `brightness(0.92)`.

### Named Rules
**The Keyline Not Shadow Rule.** Separation is a heavy ink line, never a blur.

## Shapes

Enamel plates with softened corners: 10px on panels, buttons and rows; 8px on inputs; 14px on sheets and the pill; 22px full chips; circles for roundels, station nodes and the legend dots. The signature silhouette is the roundel: white face, 5px colored ring (4px small), one code letter (F, S, IC, A, T, M; ¥ for cash bought). Stations are rings (4px ink border, 20px) on a 6px orange line, today filled orange, empty days outlined in hairline.

## Components

### Buttons
- **Shape:** 10px radius, 52px tall, 17px bold.
- **Primary:** orange fill, ink text, no border; pressed brightens down 8%.
- **Secondary:** white sign, 2px ink border. **Danger:** white sign, 2px red border and red text; armed state fills red.
- **Focus:** 3px orange outline, 2px offset (ink outline inside the orange band).

### Chips and segmented control
- Chips: 44px, 22px radius, 2px hairline border, bold 15px; selected inverts to ink fill with ground-colored text. A chip carrying a roundel pads 6px left.
- Segmented control: one 2px ink frame, 10px radius, 46px segments; selected inverts to ink.

### Cards / Containers (sign panels)
- White enamel, 3px ink border, 10px radius, 12px 14px padding, 4px internal gap. The budget card carries the 44px figure, a status pill, and a three-column ruled stat row above a 2px ink rule.

### Inputs / Fields
- 48px, 2px ink border, 8px radius, white fill, 16px text; focus swaps the border to orange with a 3px orange outline. Label above in 0.8rem bold mute. `inputmode` follows the spec.

### Navigation
- Top band: orange, 56px, back chevron in a 44px hit target, bold title, optional note; on the trips list a seigaiha wave-scale pattern fades in from the right at 30% ink strength.
- Tab bar: fixed, white, 3px ink top border; tabs 60px tall with 0.8rem labels, mute inactive, ink bold active with a 5px orange bar straddling the top border.

### Rows and the day line
- Entry rows: 58px, white, 1px hairline, 10px radius, roundel left, amount right-aligned, a 36x44 overflow button; rows missing dollars take a 2px red border.
- Day line (Days): a sign panel with a vertical 6px orange line; each day a station ring with a D01-style code, date, amount and over/under small text (red when over).

### Route bar and train (signature)
- Each trip card has a route bar (ring, 6px line, ring) whose orange fill and a drawn bullet train ride to the trip's progress; the train also sits in the empty state. Authored SVG, 2px line vocabulary.

### Stacked bar chart
- Plain SVG, one bar per trip day, segments in category line colors, hairline gridlines, 11px axis labels in mute, dates as `11/26`, legend of 10px colored dots.

## Do's and Don'ts

### Do:
- **Do** separate surfaces with a 3px ink keyline and 10px corners.
- **Do** code every category with its fixed line color and roundel letter, beside its name.
- **Do** put ink text on the orange shell and use orange for the primary action only once per view.
- **Do** keep tap targets at 44px or more and inputs at 16px or more.
- **Do** show blanks, not zeros, and flag missing data with a red border plus text.
- **Do** honor `prefers-reduced-motion`; the only motion is the route fill and train ride (0.8s) and the toast fade.
- **Do** draw new imagery as authored SVG in the 2px line vocabulary.

### Don't:
- **Don't** use red for anything but over-limit, missing data, errors or destruction.
- **Don't** introduce a display face, shadows, gradients as fills, or translucent glass.
- **Don't** put cherry blossom, torii or Fuji costume on any surface.
- **Don't** recolor a category, or let color be the only over/under or error signal.
- **Don't** add a third column to the category grid.
