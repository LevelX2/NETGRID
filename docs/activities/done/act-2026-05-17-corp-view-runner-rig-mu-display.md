---
activityId: act-2026-05-17-corp-view-runner-rig-mu-display
status: done
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts --passWithNoTests
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - git diff --check
---

# Korp-Sicht: MU-Auslastung im Runner-Rig anzeigen

## Ziel

Die Korp-Sicht auf das Runner-Rig soll die öffentliche MU-Auslastung der Runner-Programme genauso verständlich anzeigen wie die Runner-Sicht.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: In der Corporation-Sicht fehlt bei Programmen die MU-Anzeige, z. B. `2 / 4 MU`.

## Scope

- Runner-eigene Rig-Komponente und Korp-Sicht vergleichen.
- MU-Berechnung und Rendering in der Korp-Perspektive ergänzen.
- Aktualisierung nach Installation/Deinstallation prüfen.

## Nicht im Scope

- Keine Änderung an MU-Regeln oder Programm-Install-Legalität.
- Keine Anzeige verdeckter Runner-Informationen.

## Akzeptanzkriterien

- [x] Korp-Sicht zeigt öffentliche MU-Auslastung im Programmbereich.
- [x] Anzeige aktualisiert sich nach Programm-Install/Trash.
- [x] Runner-Sicht bleibt unverändert oder konsistent verbessert.
- [x] UI-Test oder Browser-Smoke deckt Korp-Perspektive ab.

## Umsetzungshinweise

- MU-Auslastung ist kein Hidden-Info-Geheimnis, solange sie aus installierten öffentlichen Programmen stammt.

## Ergebnisnotiz

Erledigt: Die side-gefilterte Korp-PlayerView enthält jetzt die öffentlichen Runner-MU-Werte, und der gegnerische Runner-Rig-Strip zeigt im Programmbereich dieselbe MU-Badge wie die Runner-Sicht. Die Anzeige hängt an `PlayerView`-Werten und aktualisiert sich dadurch mit jeder neuen View nach Programm-Install oder Trash; MU-Regeln und Install-Legalität wurden nicht verändert.

Verifiziert mit fokussiertem Web-UI-Helper-Test inklusive aktualisierter Korp-Perspektive, Typechecks für Web, Engine und Shared sowie `git diff --check`.

Offene Punkte: keine.
