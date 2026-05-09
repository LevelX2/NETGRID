# V1.6.3 Implementation Review - Mechanikpaket C

Stand: 2026-05-09  
Status: implemented

## Scope

V1.6.3 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 23-Kartenplans wurden 5 freigabefähige Karten mit uninstall-/upgrade-/region-Lifecycle-Pfaden implementiert.

## Umgesetzt

- Neue ICE-/Upgrade-Karten:
  - `onr_v1_233_d-arc-knight`
  - `onr_v1_267_sentinels-prime`
  - `onr_v1_273_triggerman`
  - `onr_v1_350_antiquated-interface-routines`
  - `onr_v1_371_tokyo-chiba-infighting`
- Engine-Erweiterung:
  - neue `trash_installed_program`-Subroutine mit deterministischem Uninstall-Zielpfad
  - uninstall/trash nach Runner-Heap inkl. Memory-Bereinigung
  - servergebundener ICE-Stärkebonus durch gerezzte Antiquated Interface Routines
  - Region-Installlifecycle (rez on install, eine Region je Fort, ältere Region nach Archives)
  - Tokyo-Chiba-Bonus auf erfolglosen Run am selben Fort
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_6_3_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.6.3`

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.6.3.json`
- `data/scenarios/v163-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.6.3.json`
- `docs/derived/V1_6_3_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_6_3_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_C_1_6_3_SPEC.md`
- `docs/derived/V1_6_3_TEST_MATRIX.md`
- `docs/derived/V1_6_3_REQUIREMENTS_REVIEW.md`

## No-Scope-Bestätigung

- Kein Subtypen-/Hosting-/Recurring-/Unique-Breitenscope aus V1.7.0
- Kein Run-/Access-/HiddenZone-Breitenscope aus V1.7.1
- Kein Tag-/Trace-/ActionEconomy-Breitenscope aus V1.7.2
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
