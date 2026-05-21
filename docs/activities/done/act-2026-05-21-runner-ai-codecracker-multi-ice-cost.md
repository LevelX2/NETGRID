---
activityId: act-2026-05-21-runner-ai-codecracker-multi-ice-cost
status: done
kind: fix
area: ai
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/visible-run-analysis.ts
  - packages/ai/src/corp-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Codecracker"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "visible multi-ICE path"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Krash"
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts (3 bestehende Economy-Testfehler außerhalb dieses Pakets)
---

# Runner-KI: Codecracker-Multi-ICE-Kosten pro Encounter berechnen

## Ziel

Die Runner-KI soll bei sichtbaren gerezzten ICE-Pfaden korrekt einplanen, dass normale Icebreaker-Pumps nur für das aktuelle Encounter gelten. Ein Run mit `Codecracker` gegen zwei gerezzte `Endless Corridor` kostet dadurch mindestens 4 Credits und darf mit 3 Credits nicht erneut als sinnvoller Run geplant werden.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-21: Die Runner-KI lief mit zu wenigen Credits auf R&D mit zwei gerezzten `Endless Corridor`, brach ab, nahm 1 Credit und startete erneut einen weiterhin nicht bezahlbaren Run.
- `Codecracker` (`onr_v1_014_codecracker`) hat Stärke 0, pumpt für 1 Credit um +1 Stärke und bricht Code-Gate-Subroutinen für 0 Credits.
- `Endless Corridor` (`onr_v1_239_endless-corridor`) ist ein Code Gate mit Stärke 2 und zwei End-the-run-Subroutinen.
- Gesicherte Engine-Grenze: normale Breaker-Pumps werden beim Encounter-Ende zurückgesetzt; nur `Grubb` und `Krash` nutzen den run-dauernden Strength-Bonuspfad.
- Aktueller KI-Befund: `packages/ai/src/visible-run-analysis.ts` trägt die erreichte Breaker-Stärke über mehrere ICE hinweg weiter und unterschätzt dadurch normale Breaker-Pumpkosten.
- Verwandtes erledigtes Paket: `docs/activities/done/act-2026-05-17-crash-pump-run-duration.md` hält die `Krash`-Ausnahme fest.

## Scope

- Sichtbare KI-Runkostenanalyse so korrigieren, dass Breaker-Stärke nur für Breaker mit run-dauerndem Pump über ICE hinweg fortgeschrieben wird.
- Runner-KI-Regression für `Codecracker` mit zwei gerezzten `Endless Corridor` und 3 Credits ergänzen: Economy/Setup muss Run schlagen, sichtbare ETR-Break-Kosten müssen 4 Credits betragen.
- Positive Gegenprobe mit ausreichenden Credits ergänzen oder bestehenden Pfad so absichern, dass `Codecracker` mit 4 Credits nicht fälschlich blockiert wird.
- Corp-KI-Pfad, der dieselbe sichtbare Breakkostenanalyse nutzt, darf die alte Fehlannahme nicht behalten.

## Nicht im Scope

- Keine Änderung an Engine-Regeln für `Codecracker`, `Endless Corridor`, `Grubb` oder `Krash`.
- Keine Änderung an Kartendaten, sofern die lokalen Werte bestätigt bleiben.
- Keine UI-/Chronik-Änderung.
- Keine generelle Neubewertung unbekannter oder unrezzter ICE.

## Akzeptanzkriterien

- [ ] `Codecracker` gegen zwei gerezzte `Endless Corridor` wird als 4-Credit-Pfad bewertet.
- [ ] Runner-KI mit 3 Credits startet in diesem Zustand keinen R&D-Run, wenn eine legale Economy-Aktion verfügbar ist.
- [ ] Runner-KI mit 4 Credits wird durch die Korrektur nicht pauschal vom sichtbaren R&D-Run abgehalten.
- [ ] Run-dauernde Pump-Ausnahmen wie `Krash` bleiben erhalten und werden nicht regressiert.
- [ ] Die geteilte sichtbare Breakkostenanalyse ist für Runner- und Corp-Planung konsistent.

## Umsetzungshinweise

- Startpunkt: `packages/ai/src/visible-run-analysis.ts`.
- Dort nicht jede Breaker-Stärke pauschal per `breakerStrengths.set(...)` über ICE hinweg tragen.
- Geeigneter enger Ansatz: Run-dauernde Pumpfähigkeit aus der Kartenmechanik oder einer kleinen expliziten Helper-Liste ableiten (`onr_v1_030_grubb`, `onr_v1_039_krash`) und nur dann die `endingStrength` für spätere ICE merken.
- Fokussierte Tests in `packages/ai/src/index.test.ts` ergänzen.

## Ergebnisnotiz

Erledigt am 2026-05-21. Die sichtbare Runanalyse trägt Breaker-Stärke über mehrere ICE nur noch für run-dauernde Pump-Ausnahmen weiter (`Grubb`, `Krash` oder Karten mit `run_remainder_strength_bonus`). Normale Breaker wie `Codecracker` werden pro ICE-Encounter neu mit ihrer Ausgangsstärke bewertet. Dadurch kostet der sichtbare Pfad `Codecracker` gegen zwei gerezzte `Endless Corridor` 4 Credits; mit 3 Credits wählt die Runner-KI Economy statt R&D-Run, mit 4 Credits ist der Pfad nicht mehr als blockiert markiert.

Die gleiche Korrektur ist im Corp-Contest-Kapazitätspfad berücksichtigt, damit Runner- und Corp-Planung dieselbe sichtbare Breakkostenannahme nutzen. Der bestehende generische Multi-ICE-Test wurde auf die korrigierte normale Pump-Laufzeit angepasst.

Checks: `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Codecracker"`, `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "visible multi-ICE path"`, `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Krash"`, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.

Zusatzcheck: `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts` läuft bis auf drei bestehende Economy-Aktions-Regressionen grün: `uses installed Corp economy payouts before the basic credit action`, `uses installed Runner economy payouts before the basic credit action`, `separates Broker pool loading from visible pool payout`. Diese Fehler liegen außerhalb des Codecracker-/Run-Kosten-Schnitts.
