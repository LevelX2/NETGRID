---
activityId: act-2026-05-17-hq-access-root-upgrade-sequence
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - "pass: corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"adds HQ root upgrades\""
  - "pass: corepack pnpm --filter @netgrid/engine typecheck"
  - "known unrelated fail: corepack pnpm --filter @netgrid/engine test -> Originalset Spotcheck 2026-05-16 Trace Link Post-Bid Resolvers / uses Signpost and The Springboard only after both trace bids are revealed"
  - "pass: git diff --check"
---

# HQ-Access: installiertes Root-Upgrade zugreifbar machen

## Ziel

Bei erfolgreichem HQ-Zugriff muss der Runner neben einer zufälligen HQ-Handkarte auch alle zugreifbaren installierten Upgrades im HQ-Root sauber erreichen und abhandeln können.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: In HQ lag ein Upgrade wie `Olivia Salazar`; die UI zeigte offenbar `Karte 1 von 2`, aber keine nutzbare zweite Access-Karte.
- Verwandte erledigte Activity: `docs/activities/done/act-2026-05-17-central-root-upgrade-install-targets.md` hatte zentrale Root-Upgrade-Installation und Sichtbarkeit behandelt, nicht diesen Access-Sequenz-Bug.

## Scope

- HQ-Access-Queue für Handkarte plus HQ-Root-Upgrades prüfen.
- Navigation zwischen mehreren Access-Objekten bereitstellen oder reparieren.
- Trash-/Nicht-Trash-Entscheidung für zugreifbare Upgrades sicherstellen.
- Chronik für beide Zugriffe ergänzen.

## Nicht im Scope

- Keine generelle Remote-Access-Neugestaltung.
- Keine Änderung an der Legalität zentraler Root-Upgrade-Installation.

## Akzeptanzkriterien

- [x] HQ-Zugriff mit Handkarte plus HQ-Root-Upgrade bietet beide Access-Objekte erreichbar an.
- [x] `Karte 1 von 2`, Weiter/Zurück oder äquivalente Navigation funktioniert.
- [x] Trash-Entscheidungen für Upgrades bleiben möglich, soweit regelrecht.
- [x] Chronik dokumentiert beide Zugriffsvorgänge side-sicher.
- [x] Regression deckt mindestens ein HQ-Root-Upgrade ab.

## Umsetzungshinweise

- Prüfen, ob der zweite Access-State erzeugt, aber nicht gerendert wird.
- Hidden-Info: nicht accessierte HQ-Handkarten bleiben verdeckt.

## Ergebnisnotiz

HQ-Breach-Queues enthalten jetzt zuerst die zufällige HQ-Handkarte und anschließend installierte HQ-Root-Upgrades als Root-Zugriffe. Root-Upgrades bleiben damit über den normalen Access-/Trash-Pfad erreichbar, während nicht accessierte HQ-Handkarten in PlayerView und PublicEvent-Payloads verdeckt bleiben. Die Regression deckt Queue-Reihenfolge, Root-Zonenmarkierung, zwei side-sichere Access-Chronikeinträge, Trash des Upgrades, Replay/StateHash und `validateGameState` ab.

Restrisiko: Der vollständige Engine-Testlauf zeigt im Worker einen reproduzierbaren, nicht durch diese Änderung verursachten Trace-Resolver-Fail in `uses Signpost and The Springboard only after both trace bids are revealed`.
