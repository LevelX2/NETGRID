# V1.7.0 Implementation Review - Mechanikpaket D

Stand: 2026-05-09  
Status: implemented

## Scope

V1.7.0 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 36-Kartenplans wurden 5 freigabefähige Karten mit Unique-/Hosting-/Recurring-/Subtype-Kernpfaden implementiert.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_011_cloak`
  - `onr_v1_036_jackhammer`
  - `onr_v1_069_succubus`
  - `onr_v1_163_floating-runner-bbs`
  - `onr_v1_180_smiths-pawnshop`
- Engine-Erweiterung:
  - Unique-Constraint in Deckvalidierung (`quantity > 1` für Unique-Karten wird abgelehnt)
  - Unique-Constraint in Runtime-Installpfaden für Runner und Corp
  - gehostete Programm-Install-Aktionen auf Daemon-Hosts
  - Hosted-Programme zählen auf Daemon nicht gegen Runner-MU
  - Host-Verlust triggert deterministische Trash-Kaskade hosted Programme
  - Recurring-Credit-Resolver in Run-Kostenpfaden mit Stealth/Noisy-Gate
  - Runner-Start-of-turn-Resolver für Floating Runner BBS (+1 Credit)
  - Runner-Start-of-turn-Choice für Smith's Pawnshop (optionaler Trash für +1 Credit)
  - eindeutige ActionId-Bildung für Hosted-Install (`hostOnCardId` als Teil der ActionId)
  - Subtype-Konsistenz: `onr_v1_021_dwarf` und `onr_v1_074_worm` enthalten `worm`
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_7_0_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.7.0`

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.7.0.json`
- `data/scenarios/v170-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.7.0.json`
- `docs/derived/V1_7_0_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_7_0_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_D_1_7_0_SPEC.md`
- `docs/derived/V1_7_0_TEST_MATRIX.md`
- `docs/derived/V1_7_0_REQUIREMENTS_REVIEW.md`

## No-Scope-Bestätigung

- Keine Run-/Search-/Multiaccess-Breite aus V1.7.1
- Keine Trace-/Tag-/Handsize-Breite aus V1.7.2
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
