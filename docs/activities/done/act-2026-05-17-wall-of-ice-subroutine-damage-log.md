---
activityId: act-2026-05-17-wall-of-ice-subroutine-damage-log
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17T18:52:07+02:00
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Wall of Ice"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "Wall of Ice"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
---

# Wall of Ice: Subroutinen und Damage einzeln protokollieren

## Ziel

`Wall of Ice` soll Subroutinen, Damage-Folgen, Kartenbewegungen und `End the Run` schrittweise in UI und Chronik nachvollziehbar darstellen.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Karten landen offenbar im Heap, aber UI/Chronik machen nicht klar, welche Subroutine was ausgelöst hat.
- Lokaler Kartenanker: `onr_v1_278_wall-of-ice`.

## Scope

- Prüfen, ob Subroutinen intern einzeln oder als Block resolved werden.
- Für jede Subroutine einen eigenen sichtbaren Resolution-/Chronikschritt erzeugen.
- Damage und durch Damage abgeworfene Karten side-sicher dokumentieren.
- `End the Run` als eigenen Schritt protokollieren.

## Nicht im Scope

- Keine Änderung an Damage-Regeln, falls die Engine bereits korrekt resolved.
- Kein pauschaler Umbau aller ICE-Resolver außerhalb der nötigen gemeinsamen Hilfslogik.

## Akzeptanzkriterien

- [x] Die Chronik zeigt `200 Damage`, `200 Damage`, `End the Run` als getrennte Schritte.
- [x] Kartenbewegungen in den Heap sind nachvollziehbar und Hidden-Info-konform.
- [x] UI macht sichtbar, welche Subroutine gerade resolved wurde.
- [x] Regression deckt Wall-of-Ice-Encounter mit ungebrochenen Subroutinen ab.

## Umsetzungshinweise

- Wenn eine generische `Subroutine resolved -> effect result -> log entry`-Schicht fehlt, nur einen kleinen wiederverwendbaren Schnitt anlegen.

## Ergebnisnotiz

Erledigt. Wall of Ice schreibt beim ungebrochenen Encounter jetzt einzelne öffentliche `resolvedEffects` für die tatsächlich aufgelösten Subroutinen: zweimal Damage mit je 2 Net Damage und Heap-Count, danach der erste End-the-run-Schritt. Die Damage-Regeln selbst wurden nicht geändert; die bestehende aggregierte Damage-Payload bleibt erhalten. Die Chronik rendert diese Effekte als separate Einträge mit Subroutine-Nummer, Damage-Menge, Heap-Count und Run-Ende ohne Kartenidentitäten aus dem vorher verdeckten Grip zu veröffentlichen.
