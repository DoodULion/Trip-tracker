---
version: 1
slug: "src-index-css"
primary_target: "src/index.css"
related_targets: []
---

# Surface brief: Trip Tracker app screens (all trip screens and the trips list)

Mode: Operate. Scope: every screen of the installed phone app (trips list, Add, Entries, Days, Summary, Settings, sheets and menus), light and dark. The owner changed the pick from Engraved Note to Station Line after the round. Draft approved before any code change.

## Direction contract

THESIS: A trip is a rail line. Each day is a numbered station, each category a line color, each budget a sign panel. Refuses the grey-cards-plus-one-accent finance default and the cherry-blossom-and-torii Japan costume.

OWN-WORLD: White enamel sign panels with heavy ink-black keylines on a warm light-grey ground (#f4f4f1); ink #1a1a1a. Orange line (#f39700) is the shell color: top band, primary buttons, the day line. Fixed category line colors at full strength: Food orange #f39700, Shopping purple #9c5e9b, Suica green #00a260, Activities blue #009bbf, Transportation magenta #b6007a, Misc silver #8a8a85. Red #d4261c is reserved for over-limit only. Line-colored roundels carry category codes (F, S, IC, A, T, M). Stations are rings with D01-style codes. BIZ UDPGothic (a signage-legibility gothic) with tabular numerals; no display face. Authored SVG icons in one stroke weight. Dark mode: enamel-black ground, same line colors.

STORY: At a glance: spent against the ceiling and the room left today. In two taps: log a purchase. The days read as a journey, with today marked and gaps visible.

FIRST VIEWPORT: Orange top band with back chevron, trip name and day count. A sign-panel budget card: spent at 44px, ceiling, status pill, remaining / daily limit / left per day under a ruled rule. Category roundels with amount and percent of total in a 2-column grid (the spec requires the percent; three columns were too narrow for "Transportation"). Then the days as stations on the orange line, today filled. Standard bottom tab bar.

FORM: Station Line (the pick, position 1 on my grounded list), seed:0bc2aa0ec5e15f1a. Raise from Tenji Yellow: the single number you need today is set large, like a sign band. Raise from Cassette J-Card: running totals right-aligned and tight to the margin.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Open decisions
- Imagery (decided at finish review): a seigaiha wave-scale pattern of real overlapping arcs fades across the trips-list band; a drawn bullet train rides the route bar on each trip card (progress marker) and sits in the empty state. Drawn SVG only, 2px line vocabulary; no photos, no cherry blossom, torii or Fuji costume.
- Exact dark-mode surfaces: confirm in the draft.
