# V1.8.1 Implementation Review - Mechanikpaket H

Stand: 2026-05-10  
Status: implemented

## Scope

V1.8.1 wurde als gate-konformer Kernrelease umgesetzt. Statt des vollständigen 15-Kartenplans wurden 12 freigabefähige Karten mit Counter-/Virus-/Purge- und rungebundenen Folgeflag-Pfaden implementiert.

## Umgesetzt

- Neue Runner-Karten:
  - `onr_v1_012_clown`
  - `onr_v1_046_pattels-virus`
  - `onr_v1_049_pox`
  - `onr_v1_094_inside-job`
  - `onr_v1_173_restrictive-net-zoning`
- Neue Corp-Karten:
  - `onr_v1_193_corporate-coup`
  - `onr_v1_209_political-coup`
  - `onr_v1_222_ball-and-chain`
  - `onr_v1_225_canis-major`
  - `onr_v1_226_canis-minor`
  - `onr_v1_242_fatal-attractor`
  - `onr_v1_268_shock-r`
- Engine-Erweiterung:
  - deterministischer `Clown`-Encounter-Strength-Modifier
  - erfolgreiche-Run-Trigger für `Pattel's Virus` und `Pox`
  - `purge_virus_counters` entfernt Virus-Counter aus Karten und `poxCountersByServer`
  - deterministischer `Inside Job`-First-ICE-Bypass
  - servergebundene ICE-Installkosten-Tax aus `Restrictive Net Zoning` plus `Pox`
  - scored-Agenda-Counterpfade für `Corporate Coup` (5) und `Political Coup` (6) mit LegalAction-only-Creditentnahme
  - rungebundene Folgeflags für `Ball and Chain`, `Canis Major`, `Canis Minor`, `Fatal Attractor`, `Shock.r`
  - Action-ID-Kollisionsschutz erweitert: `selectedServerId` wird in `makeActionId` berücksichtigt
- Catalog-/Runtime-Gate:
  - neue Release-Liste `ONR_V1_8_1_RELEASE_CARD_IDS`
  - Runtime-Allowlist erweitert exakt um 12 Karten
  - neues Manifest-Mapping `card-implementation-manifest-v1.8.1`
  - Text-/Numeric-Overrides für V1.8.1-Kernkarten
- Testabdeckung:
  - neuer V1.8.1-Engine-Testblock für Kernkorb, Purge, Run-Flags, Coup-Aktionen und Taxpfade
  - aktualisierte Katalogtests für Runtime-Gate und V1.8.1-Manifestpriorität

## Daten- und Dokuartefakte

- `data/manifests/card-implementation-manifest-1.8.1.json`
- `data/scenarios/v181-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.8.1.json`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/release-assignment-preflight.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/requirements.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/spec.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/test-matrix.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/requirements-review.md`

## Deferred in V1.8.1

- `onr_v1_013_cockroach` -> V1.9.0 (Würfel-/Zufallsabhängigkeit)
- `onr_v1_034_incubator` -> V1.9.0 (Würfel-/Zufallsabhängigkeit)
- `onr_v1_030_grubb` -> deferred (offener remainder-of-run-Breaker-Lifecycle außerhalb Scope)

## No-Scope-Bestätigung

- Keine Würfelmechanik aus V1.9.0
- Keine Ambush-/Rest-Sonderresolver-Breite aus V1.9.0
- Keine automatische AI-Freigabe
- Keine Public-Plattformfeatures
