# V1.7.2 Implementation Review - Mechanikpaket F

Stand: 2026-05-09  
Status: implemented

## Scope

V1.7.2 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 28-Kartenplans wurden 5 freigabefähige Karten mit Trace-/Tag-/Resource-/ActionEconomy-Kernpfaden implementiert.

## Umgesetzt

- Neue Corp-Karten:
  - `onr_v1_283_audit-of-call-records`
  - `onr_v1_284_chance-observation`
  - `onr_v1_286_corporate-detective-agency`
- Neue Runner-Karten:
  - `onr_v1_158_danshis-second-id`
  - `onr_v1_179_silicon-saloon-franchise`
- Engine-Erweiterung:
  - Operation-Trace-Start außerhalb aktiver Runs mit Rückkehrkontext (`phase`, `timingPoint`, `activeSide`)
  - Last-Turn-Run-Attempt-Flags (`runAttemptsThisTurn`, `runAttemptsLastTurn`) inkl. turn-boundary-Logik
  - Play-Gates für Audit/Chance gemäß Runner-Run-Attempts des letzten Runner-Turns
  - Deterministischer Resource-Trash von bis zu zwei Runner-Resources für Corporate Detective Agency
  - Runner-Resource-Ability-Aktionen:
    - Danshi: 1/2/3 Tag entfernen, keine Credit-Kosten, Self-Trash
    - Silicon: 1 Klick -> +1 Credit und +1 Draw
  - `makeActionId` erweitert um `removeTagAmount`, damit Mehrfachoptionen eindeutig legal-action-sicher bleiben
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_7_2_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 5 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.7.2`
  - Text-/Numeric-Overrides für V1.7.2-Kernkarten
- Testabdeckung:
  - neuer V1.7.2-Engine-Testblock für Kernkarten, Run-Attempt-Gates, Operation-Trace, Resource-Trash und Runner-Resource-Aktionen
  - aktualisierte Katalog-/Web-Katalogtests für Runtime-Gates und AI-Approval-Listen

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.7.2.json`
- `data/scenarios/v172-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.7.2.json`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/release-assignment-preflight.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/requirements.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/spec.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/test-matrix.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/requirements-review.md`

## No-Scope-Bestätigung

- Keine Agenda-/Scored-Static-Breite aus V1.8.0
- Keine Counter-/Virus-/Purge-Breite aus V1.8.1
- Keine Würfel-/Ambush-/Rest-Sonderresolver-Breite aus V1.9.0
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
