---
activityId: act-2026-05-17-junkyard-bbs-installed-resource-action
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm vitest run packages/engine/src/index.test.ts --testNamePattern "Junkyard BBS"
  - corepack pnpm vitest run packages/engine/src/index.test.ts --testNamePattern "Originalset Spotcheck 2026-05-16 Runner Resource Contacts hardening"
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Junkyard BBS: installierte Ressourcenaktion anbieten

## Ziel

`Junkyard BBS` muss nach Installation eine nutzbare Aktion anbieten, um die oberste passende Karte aus Heap/Trash zurückzuholen, sofern die Voraussetzungen erfüllt sind.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Installierte Karte funktioniert offenbar nicht; keine nutzbare Aktion erscheint.
- Lokaler Kartenanker: `onr_v1_165_junkyard-bbs`.

## Scope

- Aktivierte Fähigkeit beim Installieren und in der LegalAction-Erzeugung prüfen.
- Zone-Begriffe (`heap`, `trash`, `archives`, `discardPile`) gegen die Regel- und Engine-Bezeichnungen abgleichen.
- UI-Aktionsliste und kartennahe Aktionen für installierte Runner-Ressourcen prüfen.
- Chronik-Eintrag für Ausführung ergänzen oder korrigieren.

## Nicht im Scope

- Keine generelle Resource-UI-Neugestaltung.
- Keine Änderung an anderen BBS-Karten außer bei klar gemeinsamem Resolverfehler.

## Akzeptanzkriterien

- [x] Bei erfüllten Voraussetzungen erscheint die Junkyard-BBS-Aktion in der LegalAction-/UI-Liste.
- [x] Die oberste korrekte Ablagestapelkarte wird erkannt und regelgerecht bewegt.
- [x] Kosten, Timing und Zielzone werden in `applyAction` erneut validiert.
- [x] Chronik dokumentiert Quelle, Zielkarte oder generisches Hidden-Info-Label und Zielzone.
- [x] Regression deckt installierte Junkyard BBS mit passender Ablagestapelkarte ab.

## Umsetzungshinweise

- Erst klären, ob der Effekt fehlt oder nur nicht in der UI angeboten wird.

## Ergebnisnotiz

Erledigt. Die fehlende installierte Junkyard-BBS-Resource-Aktion wurde in der Engine ergänzt. Sie erscheint nur im Runner-Hauptfenster bei installierter Quelle, vorhandener Heap-Spitze und mindestens 1 Credit, kostet 1 Klick und 1 Credit, bewegt die aktuelle oberste Heap-Karte in die Grip und schreibt Quelle, Zieldefinition, Quellzone `heap`, Zielzone `grip`, Return-Count und Runner-Credits in den öffentlichen Ereignispayload. `applyAction` revalidiert Seite, installierte Quelle, Kosten, aktuelle Heap-Spitze und Zieldefinition über den regenerierten LegalAction-Vertrag und den Resolver.

Checks: fokussierter Junkyard-BBS-Vitest grün, Resource-Contacts-Spotcheck grün, Engine-Typecheck grün, `git diff --check` grün.

Offene Risiken: keine bekannten paketbezogenen Blocker. Die Änderung nutzt die bestehende generische LegalAction-Buttondarstellung; keine separate Resource-UI-Neugestaltung war im Scope.
