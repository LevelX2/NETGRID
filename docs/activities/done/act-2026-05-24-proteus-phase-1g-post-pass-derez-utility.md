---
activityId: act-2026-05-24-proteus-phase-1g-post-pass-derez-utility
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 1g
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/disintegrator.ts
  - data/scenarios/proteus-phase-1g-post-pass-derez-utility-smoke-2026-05-24.json
  - data/manifests/proteus-card-support.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 1g"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 1g"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 1g"
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus Phase 1g: Post-Pass Derez Utility

## Ziel

`Disintegrator` als eigenen Runner-Programm-Schnitt planen, weil die Karte einen präzisen Post-Pass-/Fully-Broken-Run-Zustand braucht.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarte

- `onr_proteus_085_disintegrator` Disintegrator

## Benötigte Funktionsbausteine

- Installed Runner program baseline:
  - Installkosten und MU aus CardDefinition.
  - Karte bleibt nicht decklegal und nicht `ai_supported`.
- Post-pass fully-broken hook:
  - Timing nur, wenn Runner gerade ein ICE erfolgreich passiert hat.
  - Bedingung: Runner hat alle Subroutinen dieses ICE gebrochen.
  - Hook speichert das gerade passierte ICE als public target.
- Paid ability during run:
  - Kosten `[2]`.
  - Quelle muss installiert, aktiv und vom Runner kontrolliert sein.
  - Ziel ist das gerade passierte ICE aus dem Hook, nicht ein frei wählbares anderes ICE.
- Effects:
  - Ziel-ICE derezzen.
  - aktuellen Run beenden.
- Cleanup:
  - Hook-Zustand endet nach Nutzung, nach anderem Timingfenster oder am Run-Ende.

## Nicht im Scope

- Keine allgemeinen Icebreaker-Pump/Break-Programme.
- Keine Virus-/Purge- oder Random-Karten.
- Keine variable ICE-Umsetzung.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] `Disintegrator` hat eine per-card CardImplementation-Datei.
- [x] Ability erscheint nur nach vollständig gebrochenem und passiertem ICE.
- [x] Kosten, Source, Timing und Target werden in `applyAction` revalidiert.
- [x] Derez und Run-Ende sind PublicEvent-, Replay- und StateHash-stabil.
- [x] Ability erscheint nicht nach nicht vollständig gebrochenem ICE, nicht außerhalb eines Runs und nicht gegen stale Targets.

## Umsetzungshinweise

- Bestehende Break-/Pass-Zustände genau prüfen, bevor ein neuer Hook eingeführt wird.
- Wenn "alle Subroutinen gebrochen" aktuell nicht persistiert wird, zuerst einen generischen side-sicheren Encounter-Summary-Baustein schneiden.

## Ergebnisnotiz

Erledigt am 2026-05-24. `Disintegrator` ist als eigene CardImplementation unter `packages/engine/src/card-implementations/proteus/runner/programs/disintegrator.ts` umgesetzt. Der Slice ergänzt einen generischen Runner-Utility-Baustein `derez_fully_broken_passed_ice_and_end_run`, einen generischen `fullyBrokenPassedIcePendingId`-Post-Pass-Marker und einen side-sicheren Resolver: Nach dem Passieren eines rezzed ICE, dessen Subroutinen vollständig gebrochen wurden, kann der Runner genau dieses ICE für `[2]` derezzen und den Run beenden.

`applyAction` revalidiert Runner-Seite, Movement-/Post-Pass-Timing, installierte Programmquelle, gebundenes Ziel-ICE, rezzed/installed-Zustand, fully-broken-Marker und Kosten. PublicPayload enthält nur öffentliche Definitions-/Count-/Kosteninformationen; Replay und StateHash sind im gezielten Engine-Test stabil. Manifest und Szenario wurden ergänzt; keine Decklegalität, Formatlegalität oder AI-Unterstützung.
