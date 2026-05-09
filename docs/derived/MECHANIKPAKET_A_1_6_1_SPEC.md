# Mechanikpaket A 1.6.1 Spezifikation

Stand: 2026-05-09  
Status: eingefroren

## Scope

V1.6.1 implementiert einen freigabefähigen Kern mit 6 Karten und drei funktionalen Blöcken:

1. Runtime-Damage-Prevention aus installierten Runner-Karten
2. Core-Damage-ICE-Erweiterung
3. Catalog-/Manifest-/Scenario-Gate für den 6er-Kernkorb

## Nicht-Scope

- Kein globaler 111-Karten-Unlock in diesem Slice.
- Keine zusätzliche Runtime-Replacement-Karte.
- Keine V1.6.2+-Mechanikvorziehung (`Asset/Node`, `Persistent Modifier`, `Hosting`, `Unique`, `ChoiceFlow`).
- Keine neue `ai_supported`-Freigabe.

## Kartenvertrag V1.6.1

### Runner

- `onr_v1_023_evil-twin`
  - Killer-Breaker (Pump/Break Sentry)
  - passiver Prevention-Pool: bis zu 2 Net/Core Damage pro Turn
- `onr_v1_028_force-shield`
  - passiver Prevention-Pool: bis zu 2 Net/Core Damage pro Turn
- `onr_v1_125_dermatech-bodyplating`
  - passiver Prevention-Pool: bis zu 1 Meat Damage pro Turn

### Corp

- `onr_v1_229_code-corpse`
  - drei Subroutinen: 2x Core Damage, 1x End the Run
- `onr_v1_231_cortical-scrub`
  - zwei Subroutinen: 1x Core Damage, 1x End the Run
- `onr_v1_254_liche`
  - vier Subroutinen: 3x Core Damage, 1x End the Run

## Engine-Vertrag

### Runtime-Prevention-Kandidaten

- `collectEventModificationCandidates` kombiniert:
  - runtime-basierte Damage-Prevention-Kandidaten aus installierten Runner-Karten
  - bestehende Test-Harness-Kandidaten
- Runtime-Kandidaten führen `sourceRef.kind = card` inkl. `instanceId`/`definitionId`.

### Turn-Limit-Tracking

- `runnerTurnFlags.damagePreventionUsage` führt verbrauchte Prevention-Menge pro Karteninstanz.
- Reset bei `startCorpTurn` und `startRunnerTurn`.
- Verbrauch wird nur bei angewandter Prevention erhöht.

### Sichtbarkeit

- Runtime-Choice-Label darf den Kartennamen enthalten.
- Test-Harness-Choice-Label bleibt generisch, um bestehende Leak-Regressionen nicht zu brechen.

## Datenartefakte

- `data/manifests/card-implementation-manifest-1.6.1.json`
- `data/scenarios/v161-card-release-smoke.json`
- `data/rules/mechanics-coverage-1.6.1.json`

## Deferred-Regel

Karten aus dem 111er-Planungskorb mit späteren Blockereffekten oder ohne belastbare Resolverzuordnung bleiben in V1.6.1 `deferred` und werden nicht implizit freigegeben.
