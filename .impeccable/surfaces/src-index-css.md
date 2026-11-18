---
version: 1
slug: "src-index-css"
primary_target: "src/index.css"
related_targets: []
---

# Surface brief: Trip Tracker app screens (all trip screens and the trips list)

Mode: Operate. Scope: every screen of the installed phone app (trips list, app settings, Summary, Add, Entries, Days, Payments, sheets and menus), light and dark. Redesign 2026-11-18: the owner found Station Line generic and picked the Warm Consumer App card from the decision round (a dealt challenger, verdict competitive), then asked to refine it.

## Direction contract

THESIS: A friendly travel wallet that lives in the destination's color. Soft white cards on a ground tinted by the trip's country; the trip color appears only on what you can press and on the meters that show money moving. Refuses the outlined-sign-panel look it replaces and the grey SaaS card kit (identical cards, one radius, grey shadow everywhere).

OWN-WORLD: Ground is warm stone (#f1edea) outside a trip and a 7% wash of the country color inside one; cards pure white, flat, no shadow; only floating things (tab bar, sheets, undo toast) cast one warm shadow. Ink #2b2420, mute #776b63, red #c8322a for over and errors only. Radius hierarchy: hero 28, cards 22, rows 16, controls 14, chips full. Categories as soft tinted tiles (18% tint, glyph in the full category color). Type: the system rounded face (ui-rounded, SF Pro Rounded on iPhone), 800 for figures, sentence-case labels, tabular numerals. A small jet (the app icon's) rides each trip's route bar and sits in the empty state.

STORY: Open a trip and the first thing you read is how much is left today, as a big rounded number with a thick meter. In two taps: log a purchase. Everything else is one calm card per idea below it.

FIRST VIEWPORT: Large-title header (round tinted back button, flag, trip name at 1.6rem, day chip). Today hero card: label, Left today at 3.4rem 800, a 12px rounded day meter in the trip color (red when over), spent of limit beneath. Then the budget card (spent at 2.2rem, status chip, trip meter, remaining / per day / days left). Then By category as tinted tiles in two columns. Floating pill tab bar at the bottom, active tab in the trip color.

FORM: Warm Consumer App (dealt challenger digital-design-canon-warm-consumer-app-surface, chosen over the assigned Pocket City Map), seed:802a2f16054097ba. Refinements: country-tinted ground instead of a fixed warm cream; radius hierarchy instead of one radius; shadows only on floating elements; meters as the one expressive move; system rounded face so the app stays offline with no font files.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Open decisions
- Trip-list main color stays white outside a trip (owner's commitment): primary buttons there are white on the stone ground.
