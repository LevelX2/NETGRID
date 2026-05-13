# V1.9.3 Implementation Review - Mechanikpaket L

Stand: 2026-05-10  
Status: implemented

## Scope

V1.9.3 wurde als gate-konformer Kernrelease umgesetzt. Der im V1.9.3-Preflight eingefrorene 4-Karten-Kernkorb ist vollständig implementiert und freigegeben.

## Umgesetzt

- Neue Corp-Karten:
  - `onr_v1_207_netwatch-operations-office`
  - `onr_v1_213_private-cybernet-police`
  - `onr_v1_251_jack-attack`
  - `onr_v1_271_tko-2-0`

- Engine-Erweiterung:
  - Scored-Agenda-Aktionen für Netwatch Operations Office mit Trace 7 und Private Cybernet Police mit Trace 5; beide vergeben bei Erfolg einen Tag.
  - Jack Attack Subroutine mit run-weitem Jack-out-Lock und Trace-Tag-Pfad.
  - TKO 2.0 Subroutine mit End-the-run plus deterministischem Next-Action-Verzicht des Runners.
  - Turn-Flag-Fallback für Action-Verzicht über Zuggrenzen hinweg ohne Replay-/StateHash-Drift.

- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_9_3_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 4 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.9.3`
  - V1.9.3 Text-/Numeric-Overrides ergänzt
  - keine automatische Erweiterung von `ai_supported`

- Testabdeckung:
  - neuer V1.9.3-Engine-Testblock für Mechanikpaket L
  - aktualisierte Katalogtests für Runtime-Gate/Manifest-Kette V1.9.3
  - serverseitiger Matchstart-Gate-Test für V1.9.3-Kartenstatus

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.9.3.json`
- `data/scenarios/v193-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.9.3.json`
- `docs/derived/V1_9_3_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `docs/derived/V1_9_3_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_9_3_FINAL_REVIEW.md`

## No-Scope-Bestätigung

- Keine V2.x-Funktionen
- Keine Damage/Prevention/Core-Erweiterung außerhalb des V1.9.3-Scope
- Kein automatisches `ai_supported`-Upgrade
- Keine Public-Plattformfeatures
